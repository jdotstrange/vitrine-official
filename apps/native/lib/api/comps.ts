/**
 * Comps / similar collectibles — backed by Supabase RPC get_collectible_comps
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { ListingStatus } from '@/lib/status-utils';

const log = logger.create('API:Comps');

export interface CompItem {
  id: string;
  title: string;
  image: string;
  category: string;
  subcategory: string;
  value: number;
  availableForSale: boolean;
  availableForTrade: boolean;
  ownerId: string;
  ownerName: string;
  ownerUsername: string;
  ownerAvatar: string | null;
  savesCount: number;
  matchedSignals: number;
  totalSignals: number;
  scoreFraction: number;
  valueFallback: boolean;
  status: ListingStatus;
}

/** Map RPC row to CompItem (snake_case from PostgREST). */
function mapRow(row: Record<string, unknown>): CompItem {
  const sale = !!row.available_for_sale;
  const trade = !!row.available_for_trade;
  const status: ListingStatus =
    sale && trade ? 'SELL_TRADE' : sale ? 'FOR_SALE' : trade ? 'FOR_TRADE' : 'NFST';

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    image: String(row.image ?? ''),
    category: String(row.category ?? ''),
    subcategory: String(row.subcategory ?? ''),
    value: row.value != null ? Number(row.value) : 0,
    availableForSale: sale,
    availableForTrade: trade,
    ownerId: String(row.owner_id ?? ''),
    ownerName: String(row.owner_name ?? ''),
    ownerUsername: String(row.owner_username ?? ''),
    ownerAvatar: row.owner_avatar != null && row.owner_avatar !== '' ? String(row.owner_avatar) : null,
    savesCount: Number(row.saves_count) || 0,
    matchedSignals: Number(row.matched_signals) || 0,
    totalSignals: Number(row.total_signals) || 0,
    scoreFraction: row.score_fraction != null ? Number(row.score_fraction) : 0,
    valueFallback: !!row.value_fallback,
    status,
  };
}

export async function getCollectibleComps(
  sourceId: string,
  limit = 30
): Promise<CompItem[]> {
  const { data, error } = await supabase.rpc('get_collectible_comps', {
    p_source_id: sourceId,
    p_limit: limit,
  });

  if (error) {
    log.error('get_collectible_comps failed:', error.message, error.code);
    throw new Error('Failed to load comps');
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row));
}

/** Tier label for card UI — not raw percentage. */
export type CompTierLabel = 'Strong match' | 'Close match' | 'Similar' | 'Similar range';

export function getCompTierLabel(item: CompItem): CompTierLabel {
  if (item.valueFallback) return 'Similar range';
  if (item.scoreFraction >= 0.75) return 'Strong match';
  if (item.scoreFraction >= 0.4) return 'Close match';
  return 'Similar';
}

/**
 * Comp item enriched with the tracked-portfolio source that triggered the
 * match. Returned by getTrackedComps().
 */
export interface TrackedCompItem extends CompItem {
  sourceCollectibleId: string;
  sourceTitle: string;
}

/** Map a get_tracked_comps RPC row to TrackedCompItem. */
function mapTrackedRow(row: Record<string, unknown>): TrackedCompItem {
  return {
    ...mapRow(row),
    sourceCollectibleId: String(row.source_collectible_id ?? ''),
    sourceTitle: String(row.source_title ?? ''),
  };
}

/**
 * Fetch blended comparable sales across a user's full tracked portfolio.
 * Backed by the get_tracked_comps RPC which deduplicates candidates and
 * attributes each result to the best-matching tracked source item.
 */
export async function getTrackedComps(
  userId: string,
  limit = 30,
): Promise<TrackedCompItem[]> {
  const { data, error } = await supabase.rpc('get_tracked_comps', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    log.error('get_tracked_comps failed:', error.message, error.code);
    throw new Error('Failed to load tracked comps');
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapTrackedRow(row));
}
