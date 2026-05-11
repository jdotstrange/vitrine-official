/**
 * Network Surface V3 API
 *
 * Wraps the four RPCs and supporting queries that power the V3 NETWORK lens:
 *   - getSuggestedCollectors → suggest_collectors_for
 *   - getMutualFollows       → get_mutual_follows (IG/Twitter semantics)
 *   - getFollowersWithPrivacy / getFollowingWithPrivacy
 *       → follows + users.follow_lists_visibility privacy gate
 *   - setFollowListsVisibility → users.follow_lists_visibility setter
 *
 * Why a new module rather than extending lib/api/follows.ts: the V3 surface
 * has new return shapes (privacy sentinel, suggested-with-reason) that the
 * legacy follow callers (collector cards, profile header, settings) don't
 * need to know about. Keeping the V3 surface in its own module also makes
 * the future deprecation of `getMutualFollows` (legacy) painless.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '../logger';
import type { FollowUser } from './follows';

const log = logger.create('NetworkAPI');

// ────────────────────────────────────────────────────────────────────────────
// Suggested Collectors
// ────────────────────────────────────────────────────────────────────────────

/**
 * Reason codes emitted by suggest_collectors_for. Drives the reason chip
 * copy on the SuggestedRow primitive. Add a new code here, in the migration
 * CHECK constraint, AND in components/network/suggested-row to extend.
 */
export type SuggestedReasonCode =
  | 'comp'
  | 'inventory'
  | 'tracking'
  | 'network'
  | 'authority'
  | 'serendipity';

export interface SuggestedReasonMeta {
  /** comp signal — count of strong-match items (>=0.75). */
  compCount?: number;
  /** inventory signal — up to three shared categories (lowercased). */
  sharedCategories?: string[];
  /** tracking signal — count of candidate items the viewer is tracking. */
  trackedCount?: number;
  /** network signal — count of mutual followers via the viewer. */
  viaCount?: number;
  /** network signal — up to five mutual follower IDs (display only). */
  viaUserIds?: string[];
}

export interface SuggestedCollector {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  collectiblesCount: number;
  followersCount: number;
  matchScore: number;
  reasonCode: SuggestedReasonCode;
  reasonMeta: SuggestedReasonMeta;
  /** First photo of up to three most recent public collectibles. */
  previewItems: string[];
}

export interface GetSuggestedCollectorsOptions {
  limit?: number;
  /**
   * Pull-to-refresh path. Forces the RPC to delete the viewer's cache
   * rows and recompute. Use sparingly — recompute fans out the comps RPC
   * across up to 50 viewer collectibles.
   */
  forceRecompute?: boolean;
}

export async function getSuggestedCollectors(
  viewerId: string,
  opts: GetSuggestedCollectorsOptions = {}
): Promise<SuggestedCollector[]> {
  const { limit = 20, forceRecompute = false } = opts;

  const { data, error } = await supabase.rpc('suggest_collectors_for', {
    p_viewer_id: viewerId,
    p_limit: limit,
    p_force_recompute: forceRecompute,
  });

  if (error) {
    log.error('Error fetching suggested collectors:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.candidate_id,
    displayName: row.display_name,
    username: row.username,
    avatar: row.avatar,
    collectiblesCount: row.collectibles_count ?? 0,
    followersCount: row.followers_count ?? 0,
    matchScore: Number(row.match_score) || 0,
    reasonCode: (row.reason_code as SuggestedReasonCode) ?? 'authority',
    reasonMeta: (row.reason_meta as SuggestedReasonMeta) ?? {},
    previewItems: Array.isArray(row.preview_items) ? row.preview_items : [],
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// Mutual Follows (V3 — IG/Twitter "Followed by" semantics)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns users that the viewer follows AND that also follow the profile.
 * Visitor-only chip on the V3 NETWORK lens.
 *
 * Self-comparisons (viewer === profile) intentionally return [] — owners
 * see no MUTUAL chip on their own profile.
 */
export async function getMutualFollows(
  viewerId: string,
  profileId: string,
  limit = 50,
  offset = 0
): Promise<FollowUser[]> {
  if (viewerId === profileId) return [];

  const { data, error } = await supabase.rpc('get_mutual_follows', {
    p_viewer_id: viewerId,
    p_profile_id: profileId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    log.error('Error fetching mutual follows:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    avatar: row.avatar,
    bio: row.bio,
    followedAt: row.followed_at ?? new Date().toISOString(),
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// Followers / Following with privacy gate
// ────────────────────────────────────────────────────────────────────────────

export type FollowListsVisibility = 'public' | 'private';

/**
 * Discriminated union returned by getFollowersWithPrivacy and
 * getFollowingWithPrivacy. The lens renders different empty states
 * depending on the variant.
 */
export type FollowListResult =
  | { visibility: 'public'; users: FollowUser[] }
  | { visibility: 'private'; users: [] };

interface PrivacyOptions {
  /** Owner viewing their own profile bypasses the privacy gate. */
  isOwner: boolean;
  limit?: number;
  offset?: number;
}

async function getProfileVisibility(profileId: string): Promise<FollowListsVisibility> {
  const { data, error } = await supabase
    .from('users')
    .select('follow_lists_visibility')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    log.warn('Privacy lookup failed, defaulting to public:', error);
    return 'public';
  }
  return (data?.follow_lists_visibility as FollowListsVisibility) ?? 'public';
}

export async function getFollowersWithPrivacy(
  profileId: string,
  opts: PrivacyOptions
): Promise<FollowListResult> {
  const { isOwner, limit = 50, offset = 0 } = opts;

  if (!isOwner) {
    const visibility = await getProfileVisibility(profileId);
    if (visibility === 'private') {
      return { visibility: 'private', users: [] };
    }
  }

  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      follower:users!follows_follower_id_fkey (
        id, display_name, username, avatar, bio
      )
    `)
    .eq('following_id', profileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log.error('Error fetching followers:', error);
    return { visibility: 'public', users: [] };
  }

  const users: FollowUser[] = (data ?? []).map((row: any) => ({
    id: row.follower.id,
    displayName: row.follower.display_name,
    username: row.follower.username,
    avatar: row.follower.avatar,
    bio: row.follower.bio,
    followedAt: row.created_at,
  }));

  return { visibility: 'public', users };
}

export async function getFollowingWithPrivacy(
  profileId: string,
  opts: PrivacyOptions
): Promise<FollowListResult> {
  const { isOwner, limit = 50, offset = 0 } = opts;

  if (!isOwner) {
    const visibility = await getProfileVisibility(profileId);
    if (visibility === 'private') {
      return { visibility: 'private', users: [] };
    }
  }

  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      following:users!follows_following_id_fkey (
        id, display_name, username, avatar, bio
      )
    `)
    .eq('follower_id', profileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log.error('Error fetching following:', error);
    return { visibility: 'public', users: [] };
  }

  const users: FollowUser[] = (data ?? []).map((row: any) => ({
    id: row.following.id,
    displayName: row.following.display_name,
    username: row.following.username,
    avatar: row.following.avatar,
    bio: row.following.bio,
    followedAt: row.created_at,
  }));

  return { visibility: 'public', users };
}

// ────────────────────────────────────────────────────────────────────────────
// Privacy toggle
// ────────────────────────────────────────────────────────────────────────────

export async function setFollowListsVisibility(
  userId: string,
  visibility: FollowListsVisibility
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('users')
    .update({
      follow_lists_visibility: visibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    log.error('Error updating follow lists visibility:', error);
    return { success: false };
  }
  return { success: true };
}

export async function getFollowListsVisibility(
  userId: string
): Promise<FollowListsVisibility> {
  return getProfileVisibility(userId);
}
