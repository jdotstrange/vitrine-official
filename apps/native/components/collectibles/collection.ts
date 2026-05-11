/**
 * Collection-lens shared module — types, constants, pure derive helpers, and
 * mappers consumed by every surface that renders a "filtered slice of
 * collectibles" (collector profile collection lens, showcase detail lens, and
 * any future collection-shaped surface).
 *
 * Pure module — no React imports. The React component that consumes this
 * lives in `./collection-surface.tsx`.
 */

import type { CreateCollectibleResponse, FilterTraits } from '@/lib/api/collectibles';
import { deriveStatus, type ListingStatus } from '@/lib/design';
import type { CollectibleCardData } from '@/components/vault';

import type {
  CollectionFilterOptions,
  CollectionFilters,
  CollectionSortOption,
  FilterOption,
} from './collection-filter-controls';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type CollectionItem = {
  id: string;
  title: string;
  classification: string | null;
  image: string;
  status: string;
  traits: string[];
  value: number | null;
  trackingCount: number;
  /**
   * Total view count from `view_counters`. Optional — populated at the
   * surface level via a batched `getViewCounts` after the rows render.
   */
  viewCount?: number;
  category: string;
  collectibleType: string;
  createdAt: string;
  aiMetadata: Record<string, unknown> | null;
  traitMetadata: Record<string, unknown> | null;
  filterTraits: FilterTraits | null;
  /**
   * Owner attribution — populated by Market Hub browse RPC.
   * Undefined for own-collection surfaces (profile, tracking).
   */
  ownerAvatar?: string | null;
  ownerName?: string | null;
};

export type CollectionSortKey =
  | 'recent'
  | 'value_high'
  | 'value_low'
  | 'title_az'
  | 'most_tracked';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

export const EMPTY_COLLECTION_FILTERS: CollectionFilters = {
  statuses: [],
  traits: [],
  types: [],
  valueRange: { min: null, max: null },
  people: [],
  teams: [],
};

export const COLLECTION_SORT_OPTIONS: readonly CollectionSortOption<CollectionSortKey>[] = [
  { key: 'recent', label: 'Recently Added', description: 'Newest items first' },
  { key: 'value_high', label: 'Highest Value', description: 'Estimated value, high to low' },
  { key: 'value_low', label: 'Lowest Value', description: 'Estimated value, low to high' },
  { key: 'title_az', label: 'A-Z', description: 'Listing title alphabetically' },
  { key: 'most_tracked', label: 'Most Tracked', description: 'Highest tracking count first' },
];

/**
 * Short-form status labels for analytical / filter contexts. Sits alongside
 * STATUS_CONFIG (lib/design) — that one owns the canonical pill label
 * ("For Sale"); this one owns the breakdown copy ("FOR SALE" / "BUY + TRADE"
 * / "NFS") used by the StatusBreakdownGrid and filter chips.
 */
export const STATUS_SUMMARY_COPY: Record<ListingStatus, { title: string; subtitle: string }> = {
  NFST: { title: 'NFS', subtitle: 'NOT FOR SALE' },
  FOR_SALE: { title: 'FOR SALE', subtitle: 'LIQUIDATING' },
  FOR_TRADE: { title: 'FOR TRADE', subtitle: 'OPEN TO OFFERS' },
  SELL_TRADE: { title: 'BUY + TRADE', subtitle: 'ACQUIRING' },
};

// ---------------------------------------------------------------------------
// MAPPERS
// ---------------------------------------------------------------------------

/**
 * Map an API collectible response into the CollectionItem shape consumed by
 * every collection-lens surface (filter, sort, card rendering).
 */
export function mapToCollectionItem(
  r: CreateCollectibleResponse,
  trackingCount = 0,
): CollectionItem {
  const status = deriveStatus(r.availableForSale, r.availableForTrade);

  return {
    id: r.id,
    title: r.listingTitle || r.title || 'Untitled',
    classification: r.classification || null,
    image: r.photos?.[0] || '',
    status,
    traits: r.traits || [],
    value: typeof r.value === 'number' ? r.value : null,
    trackingCount,
    category: r.category || 'Collectible',
    collectibleType: r.collectibleType || 'unknown',
    createdAt: r.createdAt,
    aiMetadata: r.aiMetadata || null,
    traitMetadata: r.traitMetadata || null,
    filterTraits: r.filterTraits || null,
  };
}

/**
 * Normalize free-form trait strings (`Rookie`, `signed`, `game-used`) into the
 * canonical TRAIT_CONFIG keys (`is_rookie`, `is_autographed`, `is_game_used`,
 * `is_graded`). Unknown strings pass through unchanged.
 */
export function normalizeTraitKey(trait: string): string {
  const normalized = trait.trim().toLowerCase().replace(/[\s-]+/g, '_');
  switch (normalized) {
    case 'rookie':
    case 'is_rookie':
      return 'is_rookie';
    case 'signed':
    case 'autographed':
    case 'is_autographed':
      return 'is_autographed';
    case 'game_used':
    case 'gameused':
    case 'is_game_used':
      return 'is_game_used';
    case 'graded':
    case 'is_graded':
      return 'is_graded';
    default:
      return trait;
  }
}

export function toCardData(item: CollectionItem): CollectibleCardData {
  return {
    id: item.id,
    photoUrl: item.image || null,
    title: item.title,
    subtitle: item.classification || item.category,
    price: item.value != null ? formatPrice(item.value) : null,
    status: item.status as ListingStatus,
    traits: item.traits.map(normalizeTraitKey),
    trackingCount: item.trackingCount,
    viewCount: item.viewCount,
    ownerAvatar: item.ownerAvatar ?? undefined,
    ownerName: item.ownerName ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// FORMAT HELPERS
// ---------------------------------------------------------------------------

export function formatPrice(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function getStatusLabel(status: string): string {
  const key = status as ListingStatus;
  return STATUS_SUMMARY_COPY[key]?.title ?? key;
}

export function formatFilterLabel(value: string): string {
  return value
    .replace(/^is_/, '')
    .replace(/[_./-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ---------------------------------------------------------------------------
// FILTER / SORT DERIVATION
// ---------------------------------------------------------------------------

/**
 * Crown Jewel resolver. Manual selection wins; otherwise fall back to highest
 * value -> highest tracking -> newest. Returns `null` for an empty collection.
 */
export function resolveCrownJewel(
  items: CollectionItem[],
  manualCollectibleId?: string | null,
): CollectionItem | null {
  if (items.length === 0) return null;

  if (manualCollectibleId) {
    const manual = items.find((item) => item.id === manualCollectibleId);
    if (manual) return manual;
  }

  return [...items].sort((a, b) => {
    const valueDelta = (b.value ?? -1) - (a.value ?? -1);
    if (valueDelta !== 0) return valueDelta;

    const trackingDelta = b.trackingCount - a.trackingCount;
    if (trackingDelta !== 0) return trackingDelta;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
}

export function deriveTypeFilters(items: CollectionItem[]): string[] {
  const seen = new Set<string>();
  items.forEach((i) => {
    const type = getItemType(i);
    if (type && type !== 'unknown') seen.add(type);
  });
  return Array.from(seen).sort();
}

export function normalizeMetadataToken(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeMetadataToken);
  if (typeof value === 'object') return [];
  return String(value)
    .split(/[,;/|]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function getMetadataValues(item: CollectionItem, keys: string[]): string[] {
  const metadata = item.aiMetadata || {};
  return keys.flatMap((key) => normalizeMetadataToken(metadata[key]));
}

export function buildCountOptions(values: string[]): FilterOption[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: formatFilterLabel(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function countActiveFilters(filters: CollectionFilters): number {
  return (
    filters.statuses.length +
    filters.traits.length +
    filters.types.length +
    (filters.valueRange.min != null || filters.valueRange.max != null ? 1 : 0) +
    filters.people.length +
    filters.teams.length
  );
}

export function itemMatchesCollectionFilters(
  item: CollectionItem,
  filters: CollectionFilters,
): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) return false;
  if (filters.types.length > 0 && !filters.types.includes(getItemType(item))) return false;
  if (filters.traits.length > 0 && !filters.traits.every((trait) => item.traits.includes(trait))) {
    return false;
  }

  if (filters.valueRange.min != null || filters.valueRange.max != null) {
    if (item.value == null) return false;
    if (filters.valueRange.min != null && item.value < filters.valueRange.min) return false;
    if (filters.valueRange.max != null && item.value > filters.valueRange.max) return false;
  }

  if (filters.people.length > 0) {
    const people = getItemPeople(item);
    if (!people.some((person) => filters.people.includes(person))) return false;
  }

  if (filters.teams.length > 0) {
    const teams = getItemTeams(item);
    if (!teams.some((team) => filters.teams.includes(team))) return false;
  }

  return true;
}

export function sortCollectionItems(
  items: CollectionItem[],
  sortKey: CollectionSortKey,
): CollectionItem[] {
  const sorted = [...items];
  switch (sortKey) {
    case 'value_high':
      return sorted.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
    case 'value_low':
      return sorted.sort(
        (a, b) => (a.value ?? Number.MAX_SAFE_INTEGER) - (b.value ?? Number.MAX_SAFE_INTEGER),
      );
    case 'title_az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'most_tracked':
      return sorted.sort((a, b) => b.trackingCount - a.trackingCount);
    case 'recent':
    default:
      return sorted;
  }
}

export function deriveCollectionFilterOptions(items: CollectionItem[]): CollectionFilterOptions {
  const values = items
    .map((item) => item.value)
    .filter((value): value is number => typeof value === 'number');
  const minValue = values.length ? Math.floor(Math.min(...values)) : 0;
  const maxValue = values.length ? Math.ceil(Math.max(...values)) : 0;

  return {
    statuses: buildCountOptions(items.map((item) => item.status)),
    traits: buildCountOptions(items.flatMap((item) => item.traits)),
    types: buildCountOptions(
      items.map((item) => getItemType(item)).filter((type) => type !== 'unknown'),
    ),
    valueBounds: { min: minValue, max: maxValue },
    people: buildCountOptions(
      items.flatMap((item) => getItemPeople(item)),
    ),
    teams: buildCountOptions(
      items.flatMap((item) => getItemTeams(item)),
    ),
  };
}

/**
 * Get the item type — prefers filter_traits.item_type (granular: "Baseball",
 * "Jersey", etc.) over collectibleType (coarse: "memorabilia", "trading_card").
 */
function getItemType(item: CollectionItem): string {
  return item.filterTraits?.item_type || item.collectibleType || 'unknown';
}

/**
 * Get people/subjects — prefers filter_traits.subject over ai_metadata key scanning.
 */
function getItemPeople(item: CollectionItem): string[] {
  if (item.filterTraits?.subject && item.filterTraits.subject.length > 0) {
    return item.filterTraits.subject;
  }
  return getMetadataValues(item, [
    'Athlete(s)/Person',
    'Artist(s)/Person',
    'Person(s) of Interest',
    'players',
  ]);
}

/**
 * Get teams/franchise — prefers filter_traits.franchise over ai_metadata key scanning.
 */
function getItemTeams(item: CollectionItem): string[] {
  if (item.filterTraits?.franchise) {
    return [item.filterTraits.franchise];
  }
  return getMetadataValues(item, [
    'Team(s)',
    'teams',
    'Franchise/IP',
    'Character(s)/Subjects(s)',
  ]);
}

// ---------------------------------------------------------------------------
// COLLECTION-WIDE STATS (asset matrix, status breakdown, trait mix)
// ---------------------------------------------------------------------------

export type AssetMatrixSegmentDerived = { label: string; count: number; pct: number };
export type StatusBreakdownEntryDerived = { key: string; count: number; pct: number };
export type TraitMixEntryDerived = { traitKey: string; count: number; pct: number };

/**
 * Derive Asset Matrix segments (collectible_type composition) from a list of
 * CollectionItems. Sorted by count desc; pct rounded to integers.
 */
export function deriveAssetMatrix(items: CollectionItem[]): AssetMatrixSegmentDerived[] {
  if (items.length === 0) return [];
  const counts = new Map<string, number>();
  for (const item of items) {
    const raw = item.collectibleType || 'unknown';
    if (raw === 'unknown') continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];
  return Array.from(counts.entries())
    .map(([key, count]) => ({
      label: formatFilterLabel(key),
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Derive Status Breakdown entries (NFST / FOR_SALE / FOR_TRADE / SELL_TRADE)
 * from a list of CollectionItems. Always returns one entry per known status
 * so the grid renders a stable 4-card layout (zero-pct cards still render —
 * matches the profile pattern).
 */
export function deriveStatusBreakdown(items: CollectionItem[]): StatusBreakdownEntryDerived[] {
  const order: ListingStatus[] = ['NFST', 'FOR_SALE', 'FOR_TRADE', 'SELL_TRADE'];
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.status;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = items.length;
  return order.map((key) => {
    const count = counts.get(key) ?? 0;
    return {
      key,
      count,
      pct: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });
}

/**
 * Derive Trait Mix entries (rookie / autographed / game_used / graded) from a
 * list of CollectionItems. Each item's `traits` array is normalized through
 * `normalizeTraitKey` first, so legacy data (`Rookie`, `signed`, `game-used`)
 * collapses into the canonical TRAIT_CONFIG keys before counting.
 *
 * Pct is computed against the total item count (not total trait count) so the
 * bars represent "what fraction of items have this trait" — items with
 * multiple traits contribute to multiple bars.
 */
export function deriveTraitMix(items: CollectionItem[]): TraitMixEntryDerived[] {
  if (items.length === 0) return [];
  const counts = new Map<string, number>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const raw of item.traits) {
      const key = normalizeTraitKey(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([traitKey, count]) => ({
      traitKey,
      count,
      pct: Math.round((count / items.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
