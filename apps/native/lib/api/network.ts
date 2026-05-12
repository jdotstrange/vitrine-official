/**
 * Backwards-compat shim — `network` lives in `@vitrine/api` after Day 2.5.
 *
 * Network V3 RPC `getMutualFollows` is exported from the package as
 * `getMutualFollowsV2`; re-export it under its original (pre-monorepo) name
 * `getMutualFollows` so this shim mirrors the old native module surface.
 */
import '@/lib/api';
export {
  getSuggestedCollectors,
  getMutualFollowsV2 as getMutualFollows,
  getFollowersWithPrivacy,
  getFollowingWithPrivacy,
  setFollowListsVisibility,
  getFollowListsVisibility,
  type SuggestedCollector,
  type SuggestedReasonCode,
  type SuggestedReasonMeta,
  type GetSuggestedCollectorsOptions,
  type FollowListsVisibility,
  type FollowListResult,
} from '@vitrine/api';
