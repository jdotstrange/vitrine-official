/**
 * Backwards-compat shim — `follows` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getMutualFollows,
  getFollowCounts,
  getFollowingIds,
  type FollowUser,
  type FollowCounts,
} from '@vitrine/api';
