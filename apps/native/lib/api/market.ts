/**
 * Market API — browse_market_v2 RPC wrapper + market overview stats.
 *
 * MarketItem extends CollectionItem with owner attribution so that SpatialCard
 * can render owner avatars/names in the BROWSE lens without any extra queries.
 * Because MarketItem satisfies the CollectionItem contract, toCardData() from
 * collection.ts works as-is for vault card rendering.
 */

import { supabase } from '@/lib/supabase';
import { deriveStatus } from '@/lib/design';
import type { CollectionItem } from '@/components/collectibles/collection';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface MarketOwner {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
}

export interface MarketItem extends CollectionItem {
  owner: MarketOwner;
}

export type MarketSortKey = 'recent' | 'price_high' | 'price_low' | 'alpha' | 'most_tracked';

export interface MarketFilters {
  types?: string[];
  statuses?: string[];
  traits?: string[];
  valueMin?: number;
  valueMax?: number;
  search?: string;
  sort?: MarketSortKey;
  /** Person / Character free-text — ILIKE against listing_title */
  searchPerson?: string;
  /** Team / IP free-text — ILIKE against listing_title */
  searchTeam?: string;
}

export interface MarketOverviewStats {
  totalItems: number;
  totalValue: number;
  activeListings: number;
  addedLast24h: number;
}

export interface CollectorSearchResult {
  userId: string;
  displayName: string;
  username: string;
  avatar: string | null;
  collectiblesCount: number;
  matchCount: number;
  previewThumbs: string[];
  matchTier: 1 | 2;
}

export interface ShowcaseSearchResult {
  showcaseId: string;
  title: string;
  description: string | null;
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  previewThumbs: string[];
  itemCount: number;
  matchCount: number;
  matchTier: 1 | 2;
}

/** Shared chip+filter state passed to both collector and showcase search RPCs. */
export interface MarketSearchChipFilters {
  traits?: string[];
  types?: string[];
  statuses?: string[];
}

// ---------------------------------------------------------------------------
// BROWSE
// ---------------------------------------------------------------------------

export async function browseMarket(
  filters: MarketFilters = {},
  limit = 20,
  offset = 0,
  excludeUserId?: string,
): Promise<MarketItem[]> {
  const args: Record<string, unknown> = {
    p_limit: limit,
    p_offset: offset,
    p_sort: filters.sort ?? 'recent',
  };

  if (filters.types?.length)          args.p_types          = filters.types;
  if (filters.statuses?.length)       args.p_statuses       = filters.statuses;
  if (filters.traits?.length)         args.p_traits         = filters.traits;
  if (filters.valueMin != null)       args.p_value_min      = filters.valueMin;
  if (filters.valueMax != null)       args.p_value_max      = filters.valueMax;
  if (filters.search?.trim())         args.p_search         = filters.search.trim();
  if (filters.searchPerson?.trim())   args.p_search_person  = filters.searchPerson.trim();
  if (filters.searchTeam?.trim())     args.p_search_team    = filters.searchTeam.trim();
  if (excludeUserId)                  args.p_exclude_user_id = excludeUserId;

  const { data, error } = await supabase.rpc('browse_market_v2', args);
  if (error) throw error;

  return (data ?? []).map(mapRowToMarketItem);
}

// ---------------------------------------------------------------------------
// TIERED SEARCH
// ---------------------------------------------------------------------------

export async function searchCollectorsTiered(
  query: string,
  chipFilters: MarketSearchChipFilters = {},
  limit = 20,
  excludeUserId?: string,
): Promise<CollectorSearchResult[]> {
  const args: Record<string, unknown> = {
    p_query: query.trim(),
    p_limit: limit,
  };
  if (chipFilters.traits?.length)   args.p_traits   = chipFilters.traits;
  if (chipFilters.types?.length)    args.p_types    = chipFilters.types;
  if (chipFilters.statuses?.length) args.p_statuses = chipFilters.statuses;
  if (excludeUserId)                args.p_exclude_user_id = excludeUserId;

  const { data, error } = await supabase.rpc('search_collectors_tiered', args);
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId:           String(row.user_id       ?? ''),
    displayName:      String(row.display_name  ?? 'Collector'),
    username:         String(row.username       ?? 'user'),
    avatar:           row.avatar ? String(row.avatar) : null,
    collectiblesCount: Number(row.collectibles_count ?? 0),
    matchCount:       Number(row.match_count    ?? 0),
    previewThumbs:    Array.isArray(row.preview_thumbs) ? row.preview_thumbs.map(String) : [],
    matchTier:        (Number(row.match_tier ?? 2) === 1 ? 1 : 2) as 1 | 2,
  }));
}

export async function searchShowcasesTiered(
  query: string,
  chipFilters: MarketSearchChipFilters = {},
  limit = 20,
  excludeUserId?: string,
): Promise<ShowcaseSearchResult[]> {
  const args: Record<string, unknown> = {
    p_query: query.trim(),
    p_limit: limit,
  };
  if (chipFilters.traits?.length)   args.p_traits   = chipFilters.traits;
  if (chipFilters.types?.length)    args.p_types    = chipFilters.types;
  if (chipFilters.statuses?.length) args.p_statuses = chipFilters.statuses;
  if (excludeUserId)                args.p_exclude_user_id = excludeUserId;

  const { data, error } = await supabase.rpc('search_showcases_tiered', args);
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    showcaseId:   String(row.showcase_id        ?? ''),
    title:        String(row.title              ?? ''),
    description:  row.description ? String(row.description) : null,
    owner: {
      id:          String(row.owner_id           ?? ''),
      username:    String(row.owner_username     ?? 'user'),
      displayName: String(row.owner_display_name ?? 'Collector'),
      avatar:      row.owner_avatar ? String(row.owner_avatar) : null,
    },
    previewThumbs: Array.isArray(row.preview_thumbs) ? row.preview_thumbs.map(String) : [],
    itemCount:    Number(row.item_count  ?? 0),
    matchCount:   Number(row.match_count ?? 0),
    matchTier:    (Number(row.match_tier ?? 2) === 1 ? 1 : 2) as 1 | 2,
  }));
}

// ---------------------------------------------------------------------------
// MARKET STATS (Discover lens DossierCard)
// @deprecated — no longer called by the Market Surface. Retained for
// backwards compat until the browse_market_stats RPC is cleaned up.
// ---------------------------------------------------------------------------

export async function getMarketOverviewStats(
  excludeUserId?: string,
): Promise<MarketOverviewStats> {
  const args: Record<string, unknown> = {};
  if (excludeUserId) args.p_exclude_user_id = excludeUserId;

  const { data, error } = await supabase.rpc('browse_market_stats', args);
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { totalItems: 0, totalValue: 0, activeListings: 0, addedLast24h: 0 };

  return {
    totalItems:     Number(row.total_items    ?? 0),
    totalValue:     Number(row.total_value    ?? 0),
    activeListings: Number(row.active_listings ?? 0),
    addedLast24h:   Number(row.added_last_24h  ?? 0),
  };
}

// ---------------------------------------------------------------------------
// MAPPER
// ---------------------------------------------------------------------------

function mapRowToMarketItem(row: Record<string, unknown>): MarketItem {
  const availableForSale  = Boolean(row.available_for_sale);
  const availableForTrade = Boolean(row.available_for_trade);
  const status = deriveStatus(availableForSale, availableForTrade);

  const collectionItem: CollectionItem = {
    id:             String(row.id ?? ''),
    title:          String(row.title ?? 'Untitled'),
    classification: row.classification ? String(row.classification) : null,
    image:          String(row.image ?? ''),
    status,
    traits:         Array.isArray(row.traits) ? row.traits.map(String) : [],
    value:          row.value != null ? Number(row.value) : null,
    trackingCount:  Number(row.track_count ?? 0),
    viewCount:      Number(row.view_count  ?? 0),
    category:       String(row.category    ?? ''),
    collectibleType: String(row.collectible_type ?? 'unknown'),
    createdAt:      String(row.created_at  ?? ''),
    aiMetadata:     row.ai_metadata    ? (row.ai_metadata    as Record<string, unknown>) : null,
    traitMetadata:  row.trait_metadata ? (row.trait_metadata as Record<string, unknown>) : null,
    filterTraits:   row.filter_traits  ? (row.filter_traits  as any) : null,
    // Owner attribution (passed through from MarketItem extension)
    ownerAvatar: row.owner_avatar ? String(row.owner_avatar) : null,
    ownerName:   String(row.owner_display_name ?? row.owner_username ?? 'Collector'),
  };

  return {
    ...collectionItem,
    owner: {
      id:          String(row.owner_id          ?? ''),
      displayName: String(row.owner_display_name ?? ''),
      username:    String(row.owner_username     ?? ''),
      avatar:      row.owner_avatar ? String(row.owner_avatar) : null,
    },
  };
}
