/**
 * Network Surface V3 API — suggested collectors, mutual follows w/ privacy
 * gating, and follow-list visibility setter. See architectural rationale in
 * the original native module (split out from follows.ts to keep V3 surface
 * separable for future deprecation).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from '../logger';
import type { FollowUser } from './follows';

export type SuggestedReasonCode =
  | 'comp'
  | 'inventory'
  | 'tracking'
  | 'network'
  | 'authority'
  | 'serendipity';

export interface SuggestedReasonMeta {
  compCount?: number;
  sharedCategories?: string[];
  trackedCount?: number;
  viaCount?: number;
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
  previewItems: string[];
}

export interface GetSuggestedCollectorsOptions {
  limit?: number;
  forceRecompute?: boolean;
}

export type FollowListsVisibility = 'public' | 'private';

export type FollowListResult =
  | { visibility: 'public'; users: FollowUser[] }
  | { visibility: 'private'; users: [] };

interface PrivacyOptions {
  isOwner: boolean;
  limit?: number;
  offset?: number;
}

export interface NetworkApi {
  getSuggestedCollectors(viewerId: string, opts?: GetSuggestedCollectorsOptions): Promise<SuggestedCollector[]>;
  getMutualFollows(viewerId: string, profileId: string, limit?: number, offset?: number): Promise<FollowUser[]>;
  getFollowersWithPrivacy(profileId: string, opts: PrivacyOptions): Promise<FollowListResult>;
  getFollowingWithPrivacy(profileId: string, opts: PrivacyOptions): Promise<FollowListResult>;
  setFollowListsVisibility(userId: string, visibility: FollowListsVisibility): Promise<{ success: boolean }>;
  getFollowListsVisibility(userId: string): Promise<FollowListsVisibility>;
}

export function createNetworkApi(supabase: SupabaseClient, logger: Logger): NetworkApi {
  const log = logger.create('NetworkAPI');

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
    return ((data as any)?.follow_lists_visibility as FollowListsVisibility) ?? 'public';
  }

  async function getSuggestedCollectors(
    viewerId: string,
    opts: GetSuggestedCollectorsOptions = {},
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

  async function getMutualFollows(
    viewerId: string,
    profileId: string,
    limit = 50,
    offset = 0,
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

  async function getFollowersWithPrivacy(
    profileId: string,
    opts: PrivacyOptions,
  ): Promise<FollowListResult> {
    const { isOwner, limit = 50, offset = 0 } = opts;

    if (!isOwner) {
      const visibility = await getProfileVisibility(profileId);
      if (visibility === 'private') return { visibility: 'private', users: [] };
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

  async function getFollowingWithPrivacy(
    profileId: string,
    opts: PrivacyOptions,
  ): Promise<FollowListResult> {
    const { isOwner, limit = 50, offset = 0 } = opts;

    if (!isOwner) {
      const visibility = await getProfileVisibility(profileId);
      if (visibility === 'private') return { visibility: 'private', users: [] };
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

  async function setFollowListsVisibility(
    userId: string,
    visibility: FollowListsVisibility,
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('users')
      .update({ follow_lists_visibility: visibility, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      log.error('Error updating follow lists visibility:', error);
      return { success: false };
    }
    return { success: true };
  }

  async function getFollowListsVisibility(userId: string): Promise<FollowListsVisibility> {
    return getProfileVisibility(userId);
  }

  return {
    getSuggestedCollectors,
    getMutualFollows,
    getFollowersWithPrivacy,
    getFollowingWithPrivacy,
    setFollowListsVisibility,
    getFollowListsVisibility,
  };
}
