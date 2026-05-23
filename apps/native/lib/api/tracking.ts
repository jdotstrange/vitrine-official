import { supabase } from '@/lib/supabase';
import { logger } from '../logger';
import { sendNotification } from './notifications';
import type { ListingStatus } from '@/lib/status-utils';
import {
  mapToCollectionItem,
  type CollectionItem,
} from '@/components/collectibles/collection';

const log = logger.create('TrackingAPI');

export interface OwnerInfo {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
}

function generateId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function deriveStatus(forSale?: boolean | null, forTrade?: boolean | null): ListingStatus {
  if (forSale && forTrade) return 'SELL_TRADE';
  if (forSale) return 'FOR_SALE';
  if (forTrade) return 'FOR_TRADE';
  return 'NFST';
}

export interface TrackedCollectible {
  trackId: string;
  collectibleId: string;
  trackedAt: string;
  title: string;
  image: string;
  category: string;
  subcategory: string;
  value: number;
  status: ListingStatus;
  owner: {
    id: string;
    displayName: string;
    username: string;
    avatar: string | null;
  };
  trackCount: number;
}

/**
 * Track a collectible for the current user.
 */
export async function trackItem(userId: string, collectibleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tracked_items')
    .insert({ id: generateId(), user_id: userId, collectible_id: collectibleId });

  if (error) {
    if (error.code === '23505') return true;
    log.error('Error tracking item:', error.message, error.code);
    return false;
  }

  (async () => {
    try {
      const { data } = await supabase
        .from('collectibles')
        .select('user_id, title, primary_image')
        .eq('id', collectibleId)
        .single();
      if (data && data.user_id && data.user_id !== userId) {
        sendNotification({
          type: 'someone_tracked_your_item',
          recipientIds: [data.user_id],
          actorId: userId,
          data: {
            objectId: collectibleId,
            collectibleId,
            collectibleTitle: data.title || '',
            collectibleImage: data.primary_image || '',
          },
        }).catch(() => {});
      }
    } catch {}
  })();

  return true;
}

/**
 * Untrack a collectible for the current user.
 */
export async function untrackItem(userId: string, collectibleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tracked_items')
    .delete()
    .eq('user_id', userId)
    .eq('collectible_id', collectibleId);

  if (error) {
    log.error('Error untracking item:', error.message, error.code);
    return false;
  }
  return true;
}

/**
 * Check if the current user is tracking a specific collectible.
 */
export async function isTracking(userId: string, collectibleId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('tracked_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('collectible_id', collectibleId);

  if (error) {
    log.error('Error checking tracking:', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Get the set of collectible IDs a user is currently tracking.
 * Used by card components for fast tracked-state lookups.
 */
export async function getTrackingIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('tracked_items')
    .select('collectible_id')
    .eq('user_id', userId);

  if (error) {
    log.error('Error fetching tracking IDs:', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r: any) => r.collectible_id));
}

/**
 * Get how many users are tracking a specific collectible.
 */
export async function getTrackCount(collectibleId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tracked_items')
    .select('id', { count: 'exact', head: true })
    .eq('collectible_id', collectibleId);

  if (error) {
    log.error('Error fetching track count:', error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Batch count how many users are tracking each collectible.
 */
export async function getTrackCounts(collectibleIds: string[]): Promise<Map<string, number>> {
  const ids = collectibleIds.filter(Boolean);
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .rpc('get_track_counts', { p_collectible_ids: ids });

  if (error) {
    log.error('Error fetching track counts:', error.message);
    return new Map();
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.collectible_id, Number(row.cnt ?? 0));
  }
  return counts;
}

/**
 * Fetch full tracked items for a user with joined collectible + owner data.
 * Optionally filter by collectible category and/or search query.
 */
export async function getTrackedItems(
  userId: string,
  options?: { limit?: number; offset?: number; category?: string; search?: string; status?: ListingStatus }
): Promise<TrackedCollectible[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Always !inner-join so we can filter on the joined collectible's
  // published_at (PostgREST only allows referencing joined columns in
  // filters when the join is inner).
  let query = supabase
    .from('tracked_items')
    .select(`
      id,
      collectible_id,
      created_at,
      collectibles!inner (
        id, title, photos, category, subcategory, value,
        available_for_sale, available_for_trade, user_id, published_at,
        users!collectibles_user_id_fkey ( id, display_name, username, avatar )
      )
    `)
    .eq('user_id', userId)
    .not('collectibles.published_at', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.category) {
    query = query.eq('collectibles.category', options.category);
  }
  if (options?.search) {
    query = query.ilike('collectibles.title', `%${options.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Error fetching tracked items:', error.message, error.code);
    throw new Error('Failed to fetch tracked items');
  }

  if (!data || data.length === 0) return [];

  const collectibleIds = data
    .map((r: any) => r.collectible_id)
    .filter(Boolean);

  const trackCounts = await getTrackCounts(collectibleIds);

  let results = data
    .filter((row: any) => row.collectibles)
    .map((row: any) => {
      const c = row.collectibles;
      const owner = c.users;
      const numericValue = c.value ? parseFloat(String(c.value)) : 0;

      return {
        trackId: row.id,
        collectibleId: c.id,
        trackedAt: row.created_at,
        title: c.title || 'Untitled',
        image: c.photos?.[0] || '',
        category: c.category || 'Collectible',
        subcategory: c.subcategory || '',
        value: numericValue,
        status: deriveStatus(c.available_for_sale, c.available_for_trade),
        owner: {
          id: c.user_id,
          displayName: owner?.display_name || owner?.username || 'Collector',
          username: owner?.username || 'collector',
          avatar: owner?.avatar || null,
        },
        trackCount: trackCounts.get(c.id) ?? 0,
      } satisfies TrackedCollectible;
    });

  if (options?.status) {
    results = results.filter((r) => r.status === options.status);
  }

  return results;
}

export interface CategoryCount {
  category: string;
  count: number;
}

/**
 * Get accurate per-category counts for a user's tracked items (server-side).
 */
export async function getTrackedCategoryCounts(userId: string): Promise<CategoryCount[]> {
  const { data, error } = await supabase
    .rpc('get_tracked_category_counts', { p_user_id: userId });

  if (error) {
    log.error('Error fetching tracked category counts:', error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    category: r.category || 'Other',
    count: Number(r.cnt),
  }));
}

/**
 * Get the total count of items a user is tracking (no join, fast).
 */
export async function getTrackedItemCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tracked_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    log.error('Error counting tracked items:', error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Fetch all tracked items for a user as AI-enriched CollectionItems, suitable
 * for the V3 tracking hub. Returns items shaped for CollectionSurface along
 * with an ownerMap for spatial-card attribution and analytics.
 *
 * This is the richer sibling of getTrackedItems() — it selects the full
 * AI-enriched column set (listing_title, classification, traits, etc.) so the
 * tracking hub can derive assetMatrix, statusBreakdown, traitMix, and own
 * CollectionSurface rendering without a second fetch.
 */
export async function getTrackedCollectionItems(userId: string): Promise<{
  items: CollectionItem[];
  ownerMap: Map<string, OwnerInfo>;
}> {
  const { data, error } = await supabase
    .from('tracked_items')
    .select(`
      id,
      collectible_id,
      created_at,
      collectibles!inner (
        id, title, listing_title, photos, category, subcategory, value,
        available_for_sale, available_for_trade, user_id, published_at,
        classification, traits, collectible_type, ai_metadata, trait_metadata, filter_traits, created_at,
        users!collectibles_user_id_fkey ( id, display_name, username, avatar )
      )
    `)
    .eq('user_id', userId)
    .not('collectibles.published_at', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    log.error('Error fetching tracked collection items:', error.message, error.code);
    return { items: [], ownerMap: new Map() };
  }

  if (!data || data.length === 0) return { items: [], ownerMap: new Map() };

  const valid = (data as any[]).filter((r) => r.collectibles);

  const collectibleIds = valid.map((r) => r.collectible_id).filter(Boolean);
  const trackCounts = await getTrackCounts(collectibleIds);

  const ownerMap = new Map<string, OwnerInfo>();
  const items: CollectionItem[] = [];

  for (const row of valid) {
    const c = row.collectibles as any;
    const owner = c.users as any;

    const ownerInfo: OwnerInfo = {
      id: c.user_id,
      displayName: owner?.display_name || owner?.username || 'Collector',
      username: owner?.username || 'collector',
      avatar: owner?.avatar || null,
    };
    ownerMap.set(c.id, ownerInfo);

    // Construct a CreateCollectibleResponse-compatible shape from the joined row
    const responseShape = {
      id: c.id,
      userId: c.user_id,
      title: c.title || 'Untitled',
      description: undefined,
      photos: c.photos || [],
      category: c.category || 'Collectible',
      subcategory: c.subcategory,
      privacy: 'public',
      tags: [],
      availableForSale: !!c.available_for_sale,
      availableForTrade: !!c.available_for_trade,
      value: c.value ? parseFloat(String(c.value)) : undefined,
      collectibleType: c.collectible_type,
      createdAt: c.created_at,
      updatedAt: c.created_at,
      listingTitle: c.listing_title,
      classification: c.classification,
      traits: c.traits,
      aiMetadata: c.ai_metadata,
      traitMetadata: c.trait_metadata,
      filterTraits: c.filter_traits ?? null,
    };

    items.push(mapToCollectionItem(responseShape, trackCounts.get(c.id) ?? 0));
  }

  return { items, ownerMap };
}

/**
 * Derive high-level overview stats from a set of tracked CollectionItems.
 * All values are computed client-side from the data already fetched by
 * getTrackedCollectionItems() — no additional network calls.
 */
export function deriveTrackedOverviewStats(
  items: CollectionItem[],
  ownerMap: Map<string, OwnerInfo>,
): {
  totalValue: number;
  itemCount: number;
  ownerCount: number;
  topCollectors: { owner: OwnerInfo; count: number }[];
} {
  const totalValue = items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const itemCount = items.length;

  // Count items per owner using the ownerMap
  const ownerCounts = new Map<string, { owner: OwnerInfo; count: number }>();
  for (const [collectibleId, owner] of ownerMap.entries()) {
    if (!items.find((i) => i.id === collectibleId)) continue;
    const existing = ownerCounts.get(owner.id);
    if (existing) {
      existing.count += 1;
    } else {
      ownerCounts.set(owner.id, { owner, count: 1 });
    }
  }

  const ownerCount = ownerCounts.size;
  const topCollectors = Array.from(ownerCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { totalValue, itemCount, ownerCount, topCollectors };
}

// ---------------------------------------------------------------------------
// Telemetry derivation — for the RADAR TelemetryCard
// ---------------------------------------------------------------------------

export interface TrackedTelemetrySeries {
  /** Daily-bucketed cumulative tracked-portfolio value. */
  valueSeries: number[];
  /** Daily-bucketed cumulative tracked-item count. */
  countSeries: number[];
  /** Daily-bucketed cumulative unique-collector count. */
  collectorSeries: number[];
}

export interface TrackedTelemetryDeltas {
  /** Sum of tracked-item value added in the most recent 24h. */
  valueDelta24h: number;
  /** Sum of tracked-item value added in the most recent 7d. */
  valueDelta7d: number;
  /** Number of items tracked in the most recent 24h. */
  countDelta24h: number;
  /** Number of items tracked in the most recent 7d. */
  countDelta7d: number;
  /** New unique collectors first seen in the most recent 7d. */
  collectorDelta7d: number;
}

export interface TrackedTelemetry extends TrackedTelemetrySeries, TrackedTelemetryDeltas {
  /** Number of daily buckets in each series. */
  windowDays: number;
}

/**
 * Derive sparkline-ready time series + window deltas for the RADAR TelemetryCard.
 *
 * Builds N daily buckets ending today. For each bucket:
 *   - valueSeries[i]      = total value of items tracked on or before that day
 *   - countSeries[i]      = total tracked-item count on or before that day
 *   - collectorSeries[i]  = unique collector count on or before that day
 *
 * Each item's `createdAt` is the user's tracked_items.created_at (when the
 * user started watching it), not the collectible's own creation date — that's
 * the right axis for "watchlist growth over time".
 *
 * Pure function — no network. Deterministic given the same input.
 */
export function deriveTrackedTelemetry(
  items: CollectionItem[],
  ownerMap: Map<string, OwnerInfo>,
  windowDays = 14,
): TrackedTelemetry {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Sort ascending by tracked-at date so we can stream items into buckets
  // as we walk forward through time. Items missing a createdAt fall back
  // to the epoch and cluster into the oldest bucket.
  const sorted = [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  let cursor = 0;
  let runningValue = 0;
  let runningCount = 0;
  const ownerSet = new Set<string>();

  const valueSeries: number[] = [];
  const countSeries: number[] = [];
  const collectorSeries: number[] = [];

  // Walk N days, oldest-first → newest, producing one bucket per day.
  for (let i = windowDays - 1; i >= 0; i--) {
    const dayBoundary = now - i * dayMs;

    while (cursor < sorted.length) {
      const item = sorted[cursor];
      const t = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      if (t > dayBoundary) break;

      runningValue += item.value ?? 0;
      runningCount += 1;
      const owner = ownerMap.get(item.id);
      if (owner?.id) ownerSet.add(owner.id);

      cursor += 1;
    }

    valueSeries.push(runningValue);
    countSeries.push(runningCount);
    collectorSeries.push(ownerSet.size);
  }

  // Window deltas — bucket length lets us read "last 24h" from the gap
  // between the final two buckets, and "last 7d" from the gap between
  // the final bucket and bucket[N-8] (or bucket[0] if window is shorter).
  const last = valueSeries.length - 1;
  const idx7d = Math.max(0, last - 7);
  const idx24h = Math.max(0, last - 1);

  return {
    windowDays,
    valueSeries,
    countSeries,
    collectorSeries,
    valueDelta24h: valueSeries[last] - valueSeries[idx24h],
    valueDelta7d: valueSeries[last] - valueSeries[idx7d],
    countDelta24h: countSeries[last] - countSeries[idx24h],
    countDelta7d: countSeries[last] - countSeries[idx7d],
    collectorDelta7d: collectorSeries[last] - collectorSeries[idx7d],
  };
}
