import { supabase } from '@/lib/supabase';
import { logger } from '../logger';
import { sendNotification } from './notifications';

const log = logger.create('FollowsAPI');

export interface FollowUser {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  followedAt: string;
}

export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

/**
 * Drop the (viewer, candidate) row from the V3 Network suggested cache so
 * a freshly followed/unfollowed collector doesn't reappear on the next
 * lens render. Failures are swallowed by design — the daily cron purge
 * and the 36h TTL keep the table self-healing.
 */
async function invalidateSuggestedCacheRow(viewerId: string, candidateId: string): Promise<void> {
  try {
    await supabase
      .from('suggested_collectors_cache')
      .delete()
      .eq('viewer_id', viewerId)
      .eq('candidate_id', candidateId);
  } catch (e) {
    log.warn('Suggested cache invalidation failed (non-fatal):', e);
  }
}

/**
 * Follow a user. Returns true if the follow was created, false if it already existed.
 */
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    if (error.code === '23505') {
      return false;
    }
    log.error('Error following user:', error);
    throw new Error('Failed to follow user');
  }

  invalidateSuggestedCacheRow(followerId, followingId).catch(() => {});

  sendNotification({
    type: 'new_follower',
    recipientIds: [followingId],
    actorId: followerId,
    data: { objectId: followerId },
  }).catch(() => {});

  return true;
}

/**
 * Unfollow a user. Returns true if the row was deleted, false if it didn't exist.
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .select('id');

  if (error) {
    log.error('Error unfollowing user:', error);
    throw new Error('Failed to unfollow user');
  }

  invalidateSuggestedCacheRow(followerId, followingId).catch(() => {});

  return (data?.length ?? 0) > 0;
}

/**
 * Check if follower follows following.
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    log.error('Error checking follow status:', error);
    return false;
  }
  return !!data;
}

/**
 * Get paginated followers for a user (people who follow them).
 */
export async function getFollowers(
  userId: string,
  limit = 50,
  offset = 0
): Promise<FollowUser[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      follower:users!follows_follower_id_fkey (
        id, display_name, username, avatar, bio
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log.error('Error fetching followers:', error);
    throw new Error('Failed to fetch followers');
  }

  return (data ?? []).map((row: any) => ({
    id: row.follower.id,
    displayName: row.follower.display_name,
    username: row.follower.username,
    avatar: row.follower.avatar,
    bio: row.follower.bio,
    followedAt: row.created_at,
  }));
}

/**
 * Get paginated following list for a user (people they follow).
 */
export async function getFollowing(
  userId: string,
  limit = 50,
  offset = 0
): Promise<FollowUser[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      following:users!follows_following_id_fkey (
        id, display_name, username, avatar, bio
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log.error('Error fetching following:', error);
    throw new Error('Failed to fetch following');
  }

  return (data ?? []).map((row: any) => ({
    id: row.following.id,
    displayName: row.following.display_name,
    username: row.following.username,
    avatar: row.following.avatar,
    bio: row.following.bio,
    followedAt: row.created_at,
  }));
}

/**
 * Get mutual follows between two users.
 */
export async function getMutualFollows(
  userA: string,
  userB: string,
  limit = 50,
  offset = 0
): Promise<FollowUser[]> {
  const { data, error } = await supabase.rpc('get_mutual_follows', {
    user_a: userA,
    user_b: userB,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    log.warn('Mutual follows RPC not available, computing client-side:', error.message);
    const [aFollowing, bFollowing] = await Promise.all([
      getFollowing(userA, 500),
      getFollowing(userB, 500),
    ]);
    const bSet = new Set(bFollowing.map(u => u.id));
    return aFollowing.filter(u => bSet.has(u.id)).slice(offset, offset + limit);
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

/**
 * Get follower/following counts directly from the users table (denormalized).
 */
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const { data, error } = await supabase
    .from('users')
    .select('followers_count, following_count')
    .eq('id', userId)
    .single();

  if (error) {
    log.error('Error fetching follow counts:', error);
    return { followersCount: 0, followingCount: 0 };
  }

  return {
    followersCount: data.followers_count ?? 0,
    followingCount: data.following_count ?? 0,
  };
}

/**
 * Batch check which user IDs the current user is following.
 * Useful for rendering follow buttons on lists.
 */
export async function getFollowingIds(followerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId);

  if (error) {
    log.error('Error fetching following IDs:', error);
    return new Set();
  }

  return new Set((data ?? []).map((row: any) => row.following_id));
}
