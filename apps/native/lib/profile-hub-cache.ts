/**
 * Profile hub cache + invalidation for CollectorProfile.
 *
 * Collection, Showcase, and Profile lenses share one cached fetch bundle.
 * Call `invalidateProfileHub(ownerId)` after owner collectible catalog / edit /
 * delete or showcase membership changes so mounted profile hubs refetch.
 */

import type { CollectionItem } from '@/components/collectibles/collection';
import type { HomeShowcaseDetail, UserShowcase } from '@/lib/api/showcases';
import type { User } from '@/lib/api/auth';

export type ProfileCacheEntry = {
  timestamp: number;
  /**
   * The viewed collector's public identity (name / username / avatar / crown
   * jewel / featured showcase). Cached alongside the hub bundle so the fast
   * cache-hit path can mount the ID card instead of falling back to the
   * "Collector / @collector" placeholder. Null for the owner's own profile,
   * where identity comes from the auth context instead.
   */
  identity: User | null;
  followCounts: { followersCount: number; followingCount: number };
  collectionValue: number;
  collectionSize: number;
  collectionItems: CollectionItem[];
  trackingIds: Set<string>;
  featuredShowcase: HomeShowcaseDetail | null;
  showcases: UserShowcase[];
  assetMatrix: { label: string; count: number; pct: number }[];
  statusBreakdown: { key: string; count: number; pct: number }[];
};

const PROFILE_CACHE_TTL_MS = 45_000;

const profileCache = new Map<string, ProfileCacheEntry>();
const listeners = new Set<(userId: string) => void>();

export function getProfileCacheEntry(userId: string): ProfileCacheEntry | undefined {
  return profileCache.get(userId);
}

export function setProfileCacheEntry(userId: string, entry: ProfileCacheEntry): void {
  profileCache.set(userId, entry);
}

export function isProfileCacheFresh(userId: string): boolean {
  const cached = profileCache.get(userId);
  return !!cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL_MS;
}

/** Drop cached hub data and notify mounted profile hubs to refetch. */
export function invalidateProfileHub(userId: string): void {
  if (!userId) return;
  profileCache.delete(userId);
  for (const listener of listeners) {
    listener(userId);
  }
}

export function subscribeProfileHub(listener: (userId: string) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
