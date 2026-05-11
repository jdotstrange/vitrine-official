import { supabase } from '@/lib/supabase';
import { logger } from '../logger';

const log = logger.create('SearchAPI');

export interface SearchCollectibleResult {
  id: string;
  title: string;
  image: string;
  price: number | null;
  category: string;
  status: 'NFST' | 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE';
  userId: string;
}

export interface SearchUserResult {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  collectiblesCount: number;
}

/**
 * Search collectibles using the search_collectibles RPC
 */
export async function searchCollectibles(
  query: string,
  options?: { limit?: number; offset?: number; excludeUserId?: string }
): Promise<SearchCollectibleResult[]> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const args: Record<string, any> = {
    p_query: query.trim(),
    p_limit: limit,
    p_offset: offset,
  };
  if (options?.excludeUserId) args.p_exclude_user_id = options.excludeUserId;

  const { data, error } = await supabase.rpc('search_collectibles', args);

  if (error) {
    log.error('Error searching collectibles:', error);
    throw new Error('Failed to search collectibles');
  }

  return (data ?? []).map((row: any) => {
    let status: SearchCollectibleResult['status'] = 'NFST';
    if (row.available_for_sale && row.available_for_trade) status = 'SELL_TRADE';
    else if (row.available_for_sale) status = 'FOR_SALE';
    else if (row.available_for_trade) status = 'FOR_TRADE';

    return {
      id: row.id,
      title: row.title,
      image: row.photos?.[0] ?? '',
      price: row.display_price ? parseFloat(String(row.display_price)) : null,
      category: row.unified_category ?? 'Collectible',
      status,
      userId: row.user_id,
    };
  });
}

/**
 * Search users by display name or username
 */
export async function searchUsers(
  query: string,
  options?: { limit?: number; excludeUserId?: string }
): Promise<SearchUserResult[]> {
  const limit = options?.limit ?? 10;
  const q = query.trim().toLowerCase();
  if (!q) return [];

  let builder = supabase
    .from('users')
    .select('id, display_name, username, avatar, bio, collectibles_count')
    .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    .not('onboarding_completed_at', 'is', null)
    .order('collectibles_count', { ascending: false })
    .limit(limit);

  if (options?.excludeUserId) {
    builder = builder.neq('id', options.excludeUserId);
  }

  const { data, error } = await builder;

  if (error) {
    log.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    displayName: row.display_name ?? 'Collector',
    username: row.username ?? 'user',
    avatar: row.avatar ?? null,
    bio: row.bio ?? null,
    collectiblesCount: row.collectibles_count ?? 0,
  }));
}
