import { supabase } from '@/lib/supabase';
import { logger } from '../logger';
import type { ListingStatus } from '../status-utils';

const log = logger.create('ExploreAPI');

// ── Types ──

export interface HotItem {
  id: string;
  title: string;
  image: string;
  price: number;
  status: ListingStatus;
  collector: string;
  tracks: number;
  savesCount: number;
  changePercent?: number;
  category?: string;
}

export interface ExploreCategory {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  itemCount: number;
}

export interface NewListing {
  id: string;
  title: string;
  image: string;
  price: number;
  status: ListingStatus;
  listedAgo: string;
}

export interface ListedItem {
  id: string;
  title: string;
  image: string;
  price: number;
  status: ListingStatus;
  collector: string;
}

export interface FeaturedCollector {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  itemCount: number;
  followers: number;
  previewItems: string[];
  specialty?: string;
  isFollowing?: boolean;
}

// ── Helpers ──

function deriveStatus(forSale: boolean, forTrade: boolean): ListingStatus {
  if (forSale && forTrade) return 'SELL_TRADE';
  if (forSale) return 'FOR_SALE';
  if (forTrade) return 'FOR_TRADE';
  return 'NFST';
}

function formatTimeAgoShort(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

// ── API Functions ──

/**
 * Fetch actively listed collectibles, ordered by track count then recency.
 * Uses an RPC to get track counts via left join on tracked_items.
 */
export async function getHotItems(limit = 8, excludeUserId?: string): Promise<HotItem[]> {
  const args: Record<string, any> = { p_limit: limit };
  if (excludeUserId) args.p_exclude_user_id = excludeUserId;

  const { data, error } = await supabase.rpc('get_hot_items', args);

  if (error) {
    log.error('Error fetching hot items:', error);
    // Fallback: fetch without track counts
    return getHotItemsFallback(limit, excludeUserId);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    image: row.photos?.[0] ?? '',
    price: row.value ? parseFloat(String(row.value)) : 0,
    status: deriveStatus(row.available_for_sale, row.available_for_trade),
    collector: row.display_name ?? row.username ?? 'Collector',
    tracks: row.track_count ?? 0,
    savesCount: row.saves_count ?? 0,
    category: row.category ?? undefined,
  }));
}

async function getHotItemsFallback(limit: number, excludeUserId?: string): Promise<HotItem[]> {
  let query = supabase
    .from('collectibles')
    .select('id, title, photos, value, available_for_sale, available_for_trade, saves_count, user_id, users!collectibles_user_id_fkey(display_name, username)')
    .not('photos', 'is', null)
    .or('available_for_sale.eq.true,available_for_trade.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (excludeUserId) query = query.neq('user_id', excludeUserId);

  const { data, error } = await query;

  if (error) {
    log.error('Hot items fallback failed:', error);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const user = row.users ?? {};
    return {
      id: row.id,
      title: row.title,
      image: row.photos?.[0] ?? '',
      price: row.value ? parseFloat(String(row.value)) : 0,
      status: deriveStatus(row.available_for_sale, row.available_for_trade),
      collector: user.display_name ?? user.username ?? 'Collector',
      tracks: 0,
      savesCount: row.saves_count ?? 0,
      category: row.category ?? undefined,
    };
  });
}

/**
 * Fetch categories from category_types table + real item counts from collectibles_unified.
 */
export async function getExploreCategories(): Promise<ExploreCategory[]> {
  const [typesRes, countsRes] = await Promise.all([
    supabase
      .from('category_types')
      .select('code, title, thumbnail_image, order')
      .order('order', { ascending: true }),
    supabase.rpc('get_category_counts'),
  ]);

  if (typesRes.error) {
    log.error('Error fetching category types:', typesRes.error);
    return [];
  }

  // get_category_counts hits the collectibles_unified view which currently
  // has restrictive RLS for the authenticated role (permission denied). When
  // that fails we fall back to returning every category with itemCount=0
  // rather than filtering everything out — the Discover lens still wants
  // category cards to render even without live counts.
  let countMap: Map<string, number>;
  let countsAvailable = true;
  if (countsRes.error) {
    log.warn('Category counts unavailable; returning categories without counts:', countsRes.error.message);
    countMap = new Map();
    countsAvailable = false;
  } else {
    countMap = new Map(
      (countsRes.data ?? []).map((r: any) => [r.unified_category, Number(r.cnt)])
    );
  }

  return (typesRes.data ?? [])
    .filter((t: any) => !countsAvailable || (countMap.get(t.code) ?? 0) > 0)
    .map((t: any) => {
      const count = countMap.get(t.code) ?? 0;
      return {
        id: t.code,
        title: t.title,
        subtitle: countsAvailable ? `${count.toLocaleString()} items` : 'Browse →',
        image: t.thumbnail_image ?? '',
        itemCount: count,
      };
    });
}

/**
 * Fetch the most recently created collectibles with photos.
 */
export async function getNewListings(limit = 8, excludeUserId?: string): Promise<NewListing[]> {
  let query = supabase
    .from('collectibles')
    .select('id, title, photos, value, available_for_sale, available_for_trade, user_id, created_at')
    .not('photos', 'is', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (excludeUserId) query = query.neq('user_id', excludeUserId);

  const { data, error } = await query;

  if (error) {
    log.error('Error fetching new listings:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    image: row.photos?.[0] ?? '',
    price: row.value ? parseFloat(String(row.value)) : 0,
    status: deriveStatus(row.available_for_sale, row.available_for_trade),
    listedAgo: formatTimeAgoShort(row.created_at),
  }));
}

/**
 * Fetch actively for-sale collectibles with prices.
 */
export async function getForSaleNow(limit = 8, excludeUserId?: string): Promise<ListedItem[]> {
  let query = supabase
    .from('collectibles')
    .select('id, title, photos, value, available_for_sale, available_for_trade, user_id, users!collectibles_user_id_fkey(display_name, username)')
    .not('photos', 'is', null)
    .eq('visibility', 'public')
    .eq('available_for_sale', true)
    .gt('value', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (excludeUserId) query = query.neq('user_id', excludeUserId);

  const { data, error } = await query;

  if (error) {
    log.error('Error fetching for-sale items:', error);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const user = row.users ?? {};
    return {
      id: row.id,
      title: row.title,
      image: row.photos?.[0] ?? '',
      price: row.value ? parseFloat(String(row.value)) : 0,
      status: deriveStatus(row.available_for_sale, row.available_for_trade),
      collector: user.display_name ?? user.username ?? 'Collector',
    };
  });
}

/**
 * Fetch top collectors (by collection size) with their 3 most recent collectible images.
 * Returns empty array if fewer than 2 collectors qualify (sparse-data guard).
 */
export async function getCollectorsToFollow(
  excludeUserId?: string,
  limit = 10
): Promise<FeaturedCollector[]> {
  let query = supabase
    .from('users')
    .select('id, display_name, username, avatar, collectibles_count, followers_count')
    .not('onboarding_completed_at', 'is', null)
    .gt('collectibles_count', 0)
    .order('collectibles_count', { ascending: false })
    .limit(limit);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data: users, error: usersError } = await query;

  if (usersError) {
    log.error('Error fetching collectors:', usersError);
    return [];
  }

  if (!users || users.length < 2) return [];

  const userIds = users.map((u: any) => u.id);

  const { data: previews, error: previewError } = await supabase
    .from('collectibles')
    .select('user_id, photos')
    .in('user_id', userIds)
    .not('photos', 'is', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(userIds.length * 3);

  if (previewError) {
    log.warn('Error fetching preview images:', previewError);
  }

  const previewMap = new Map<string, string[]>();
  for (const row of previews ?? []) {
    const uid = (row as any).user_id;
    const photos = (row as any).photos as string[] | null;
    if (!uid || !photos?.[0]) continue;
    const existing = previewMap.get(uid) ?? [];
    if (existing.length < 3) {
      existing.push(photos[0]);
      previewMap.set(uid, existing);
    }
  }

  return users.map((u: any) => ({
    id: u.id,
    displayName: u.display_name ?? u.username ?? 'Collector',
    username: u.username ?? 'user',
    avatar: u.avatar ?? '',
    itemCount: u.collectibles_count ?? 0,
    followers: u.followers_count ?? 0,
    previewItems: previewMap.get(u.id) ?? [],
  }));
}

// ── Browse Collectibles (filtered grid) ──

export interface BrowseFilters {
  types?: string[];
  statuses?: ListingStatus[];
  valueMin?: number;
  valueMax?: number;
  ownerIds?: string[];
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  excludeUserId?: string;
}

export interface BrowseResult {
  id: string;
  title: string;
  image: string;
  category: string;
  subcategory: string;
  value: number;
  status: ListingStatus;
  owner: { id: string; name: string; username: string; avatar: string | null };
  trackCount: number;
  createdAt: string;
}

const SORT_MAP: Record<string, string> = {
  'recent': 'recent',
  'price-high': 'price_high',
  'price-low': 'price_low',
  'alpha': 'alpha',
};

export async function browseCollectibles(filters: BrowseFilters = {}): Promise<BrowseResult[]> {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  const args: Record<string, any> = {
    p_limit: limit,
    p_offset: offset,
    p_sort: SORT_MAP[filters.sort ?? 'recent'] ?? 'recent',
  };

  if (filters.types?.length) args.p_types = filters.types;
  if (filters.statuses?.length) args.p_statuses = filters.statuses;
  if (filters.valueMin != null) args.p_value_min = filters.valueMin;
  if (filters.valueMax != null) args.p_value_max = filters.valueMax;
  if (filters.ownerIds?.length) args.p_owner_ids = filters.ownerIds;
  if (filters.search) args.p_search = filters.search;
  if (filters.excludeUserId) args.p_exclude_user_id = filters.excludeUserId;

  const { data, error } = await supabase.rpc('browse_collectibles', args);

  if (error) {
    log.error('Error browsing collectibles:', error.message, error.code);
    throw new Error('Failed to browse collectibles');
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title || 'Untitled',
    image: row.image || '',
    category: row.category || '',
    subcategory: row.subcategory || '',
    value: row.item_value ? parseFloat(String(row.item_value)) : 0,
    status: deriveStatus(!!row.available_for_sale, !!row.available_for_trade),
    owner: {
      id: row.owner_id,
      name: row.owner_name || 'Collector',
      username: row.owner_username || 'collector',
      avatar: row.owner_avatar || null,
    },
    trackCount: Number(row.track_count) || 0,
    createdAt: row.created_at,
  }));
}
