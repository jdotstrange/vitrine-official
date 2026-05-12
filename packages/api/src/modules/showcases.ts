/**
 * Showcases API — manual + managed showcase CRUD, detail loading, and
 * follower fan-out.
 *
 * Cross-module deps wired via the factory:
 *   - notifications  → fan-out new_showcase_from_followed
 *   - managed-rules  → preview rule matches client-side
 *
 * `getTrackCounts` is inlined here as a small standalone Supabase query
 * so showcases can ship in @vitrine/api without depending on the (still
 * native-only) tracking module.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ListingStatus, ManagedRules } from '@vitrine/types';
import type { Logger } from '../logger';
import type { NotificationsApi } from './notifications';
import { evalRowFromCollectionItem, evaluateManagedRules } from './managed-rules';

export type CreateShowcaseParams =
  | CreateShowcaseManualParams
  | CreateShowcaseManagedParams;

export interface CreateShowcaseManualParams {
  type: 'manual';
  userId: string;
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  collectibleIds: string[];
}

export interface CreateShowcaseManagedParams {
  type: 'managed';
  userId: string;
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  rules: ManagedRules;
}

export interface UpdateShowcaseRulesParams {
  showcaseId: string;
  title?: string;
  description?: string;
  visibility?: 'public' | 'private';
  rules: ManagedRules;
}

export interface UpdateShowcaseParams {
  showcaseId: string;
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  collectibleIds: string[];
}

export interface UserShowcase {
  id: string;
  title: string;
  items: number;
  totalValue: number;
  showcaseType: 'manual' | 'auto' | 'managed';
  images: string[];
  rules?: unknown;
  rulesMatch?: string | null;
  rulesLastEvaluatedAt?: string | null;
}

export interface ShowcaseDetailCollectible {
  id: string;
  image: string;
  title: string;
  collector: string;
  avatar?: string;
  tracks: number;
  type: string;
  subcategory: string;
  value: string;
  name: string;
  addedAt: Date | string | number;
  priceChange?: string;
  status: ListingStatus;
}

export interface ShowcaseDetailItem {
  id: string;
  title: string;
  classification: string | null;
  image: string;
  status: string;
  traits: string[];
  value: number | null;
  trackingCount: number;
  category: string;
  collectibleType: string;
  createdAt: string;
  aiMetadata: Record<string, unknown> | null;
  traitMetadata: Record<string, unknown> | null;
  filterTraits?: Record<string, unknown> | null;
}

export interface ShowcaseDetail {
  id: string;
  title: string;
  description?: string;
  showcaseType: 'manual' | 'auto' | 'managed';
  visibility: 'public' | 'private';
  createdAt: Date | string | number;
  owner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    followers: number;
  };
  stats: {
    totalItems: number;
    totalValue: string;
    totalValueNumeric: number;
  };
  collectibles: ShowcaseDetailCollectible[];
  items: ShowcaseDetailItem[];
  images: string[];
  rules?: ManagedRules;
  rulesLastEvaluatedAt?: string | null;
}

export interface HomeShowcaseDetail {
  id: string;
  title: string;
  description: string | null;
  itemCount: number;
  previewImages: string[];
  primaryCategory: string | null;
}

export interface ShowcasePreview {
  id: string;
  title: string;
  thumbnail: string | null;
}

export interface PreviewableItem {
  id: string;
  title: string;
  collectibleType: string;
  value: number | null;
  status: string;
  traits: string[];
  tags?: string[];
  image?: string;
  filterTraits?: { franchise?: string | null; item_type?: string | null; year?: number | null; maker?: string | null } | null;
}

export interface PreviewResult {
  matchingIds: string[];
  totalValue: number;
  previewImages: string[];
}

export interface ShowcasesApi {
  createShowcase(params: CreateShowcaseParams): Promise<string>;
  updateShowcaseRules(params: UpdateShowcaseRulesParams): Promise<{ matched: number }>;
  previewRuleMatches(items: PreviewableItem[], rules: ManagedRules): PreviewResult;
  deleteShowcase(showcaseId: string): Promise<void>;
  updateShowcase(params: UpdateShowcaseParams): Promise<void>;
  getShowcaseCollectibleIds(showcaseId: string): Promise<string[]>;
  getUserShowcases(userId: string, requestingUserId?: string): Promise<UserShowcase[]>;
  getShowcaseById(showcaseId: string, requestingUserId?: string): Promise<ShowcaseDetail | null>;
  getFeaturedShowcaseDetail(showcaseId: string): Promise<HomeShowcaseDetail | null>;
  getUserShowcaseCount(userId: string): Promise<number>;
  getUserShowcasePreviews(userId: string, limit?: number): Promise<ShowcasePreview[]>;
}

/**
 * Pure rule-preview helper. Evaluates rules client-side against an in-memory
 * collectible list — used by the rule builder for live preview. Doesn't
 * depend on supabase, so it's a free-standing export.
 */
export function previewRuleMatches(
  items: PreviewableItem[],
  rules: ManagedRules,
): PreviewResult {
  const evalItems = items.map(evalRowFromCollectionItem);
  const { matchingIds } = evaluateManagedRules(evalItems, rules);
  const matchingSet = new Set(matchingIds);

  let totalValue = 0;
  const previewImages: string[] = [];

  for (const item of items) {
    if (!matchingSet.has(item.id)) continue;
    totalValue += item.value ?? 0;
    if (previewImages.length < 3 && item.image) {
      previewImages.push(item.image);
    }
  }

  return { matchingIds, totalValue, previewImages };
}

function generateId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function getListingStatus(
  availableForSale?: boolean | null,
  availableForTrade?: boolean | null,
): ListingStatus {
  if (availableForSale && availableForTrade) return 'SELL_TRADE';
  if (availableForSale) return 'FOR_SALE';
  if (availableForTrade) return 'FOR_TRADE';
  return 'NFST';
}

export function createShowcasesApi(
  supabase: SupabaseClient,
  logger: Logger,
  notifications: NotificationsApi,
): ShowcasesApi {
  const log = logger.create('ShowcasesAPI');

  async function getTrackCounts(collectibleIds: string[]): Promise<Map<string, number>> {
    const ids = collectibleIds.filter(Boolean);
    if (ids.length === 0) return new Map();

    const { data, error } = await supabase.rpc('get_track_counts', { p_collectible_ids: ids });

    if (error) {
      log.error('Error fetching track counts:', error.message);
      return new Map();
    }

    const counts = new Map<string, number>();
    for (const row of (data ?? []) as any[]) {
      counts.set(row.collectible_id, Number(row.cnt ?? 0));
    }
    return counts;
  }

  async function invokeManagedEvaluate(
    showcaseId: string,
  ): Promise<{ matched: number; added: number; removed: number } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('managed-evaluate', {
        body: { showcaseId },
      });
      if (error) {
        log.error('managed-evaluate invocation error:', error.message);
        return null;
      }
      return data as { matched: number; added: number; removed: number };
    } catch (err) {
      log.error('managed-evaluate call failed:', (err as Error).message);
      return null;
    }
  }

  function notifyFollowersOfNewShowcase(
    ownerId: string,
    showcaseId: string,
    title: string,
    collectibleIds: string[],
  ) {
    (async () => {
      try {
        const { data: followers } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', ownerId);
        if (!followers || followers.length === 0) return;

        let coverImage: string | null = null;
        if (collectibleIds.length > 0) {
          const { data: cover } = await supabase
            .from('collectibles')
            .select('photos')
            .eq('id', collectibleIds[0])
            .single();
          coverImage = (cover as any)?.photos?.[0] ?? null;
        }

        const recipientIds = followers.map((f: any) => f.follower_id);
        notifications.sendNotification({
          type: 'new_showcase_from_followed',
          recipientIds,
          actorId: ownerId,
          data: {
            objectId: showcaseId,
            objectType: 'showcase',
            showcaseId,
            showcaseTitle: title,
            showcaseImage: coverImage,
          },
        }).catch(() => {});
      } catch (err) {
        log.warn('new_showcase_from_followed wire-up failed:', err);
      }
    })();
  }

  async function createManualShowcase(params: CreateShowcaseManualParams): Promise<string> {
    const { userId, title, description, visibility, collectibleIds } = params;
    const showcaseId = generateId();
    const now = new Date().toISOString();

    const { error: showcaseError } = await supabase
      .from('showcases')
      .insert({
        id: showcaseId,
        user_id: userId,
        title,
        description: description || null,
        type: 'manual',
        visibility,
        created_at: now,
        updated_at: now,
      });

    if (showcaseError) {
      log.error('Error creating showcase:', showcaseError.message, showcaseError.code);
      throw new Error('Failed to create showcase');
    }

    if (collectibleIds.length > 0) {
      const junctionRows = collectibleIds.map((collectibleId, index) => ({
        id: generateId(),
        showcase_id: showcaseId,
        collectible_id: collectibleId,
        display_order: index,
      }));

      const { error: junctionError } = await supabase
        .from('showcase_collectibles')
        .insert(junctionRows);

      if (junctionError) {
        log.error('Error inserting showcase collectibles:', junctionError.message, junctionError.code);
        await supabase.from('showcases').delete().eq('id', showcaseId);
        throw new Error('Failed to add items to showcase');
      }
    }

    if (visibility !== 'private') {
      notifyFollowersOfNewShowcase(userId, showcaseId, title, collectibleIds);
    }

    return showcaseId;
  }

  async function createManagedShowcase(params: CreateShowcaseManagedParams): Promise<string> {
    const { userId, title, description, visibility, rules } = params;
    const showcaseId = generateId();
    const now = new Date().toISOString();

    const { error: showcaseError } = await supabase
      .from('showcases')
      .insert({
        id: showcaseId,
        user_id: userId,
        title,
        description: description || null,
        type: 'managed',
        visibility,
        rules: rules.conditions,
        rules_match: rules.match,
        created_at: now,
        updated_at: now,
      });

    if (showcaseError) {
      log.error('Error creating managed showcase:', showcaseError.message, showcaseError.code);
      throw new Error('Failed to create managed showcase');
    }

    try {
      await invokeManagedEvaluate(showcaseId);
    } catch (err) {
      log.warn('Immediate eval failed (sweep will catch up):', (err as Error).message);
    }

    if (visibility !== 'private') {
      notifyFollowersOfNewShowcase(userId, showcaseId, title, []);
    }

    return showcaseId;
  }

  async function createShowcase(params: CreateShowcaseParams): Promise<string> {
    if (params.type === 'managed') return createManagedShowcase(params);
    return createManualShowcase(params);
  }

  async function updateShowcaseRules(
    params: UpdateShowcaseRulesParams,
  ): Promise<{ matched: number }> {
    const { showcaseId, title, description, visibility, rules } = params;
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      rules: rules.conditions,
      rules_match: rules.match,
      updated_at: now,
    };
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description || null;
    if (visibility !== undefined) updatePayload.visibility = visibility;

    const { error: metaError } = await supabase
      .from('showcases')
      .update(updatePayload)
      .eq('id', showcaseId);

    if (metaError) {
      log.error('Error updating managed showcase rules:', metaError.message, metaError.code);
      throw new Error('Failed to update showcase rules');
    }

    const evalResult = await invokeManagedEvaluate(showcaseId);
    return { matched: evalResult?.matched ?? 0 };
  }

  async function deleteShowcase(showcaseId: string): Promise<void> {
    const { error: junctionError } = await supabase
      .from('showcase_collectibles')
      .delete()
      .eq('showcase_id', showcaseId);

    if (junctionError) {
      log.error('Error deleting showcase collectibles:', junctionError.message, junctionError.code);
    }

    const { error } = await supabase
      .from('showcases')
      .delete()
      .eq('id', showcaseId);

    if (error) {
      log.error('Error deleting showcase:', error.message, error.code);
      throw new Error('Failed to delete showcase');
    }
  }

  async function updateShowcase(params: UpdateShowcaseParams): Promise<void> {
    const { showcaseId, title, description, visibility, collectibleIds } = params;
    const now = new Date().toISOString();

    const { error: metaError } = await supabase
      .from('showcases')
      .update({ title, description: description || null, visibility, updated_at: now })
      .eq('id', showcaseId);

    if (metaError) {
      log.error('Error updating showcase:', metaError.message, metaError.code);
      throw new Error('Failed to update showcase');
    }

    const { error: deleteError } = await supabase
      .from('showcase_collectibles')
      .delete()
      .eq('showcase_id', showcaseId);

    if (deleteError) {
      log.error('Error clearing showcase collectibles:', deleteError.message, deleteError.code);
      throw new Error('Failed to update showcase items');
    }

    if (collectibleIds.length > 0) {
      const junctionRows = collectibleIds.map((collectibleId, index) => ({
        id: generateId(),
        showcase_id: showcaseId,
        collectible_id: collectibleId,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from('showcase_collectibles')
        .insert(junctionRows);

      if (insertError) {
        log.error('Error inserting showcase collectibles:', insertError.message, insertError.code);
        throw new Error('Failed to update showcase items');
      }
    }
  }

  async function getShowcaseCollectibleIds(showcaseId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('showcase_collectibles')
      .select('collectible_id, display_order')
      .eq('showcase_id', showcaseId)
      .order('display_order', { ascending: true });

    if (error) {
      log.error('Error fetching showcase collectible IDs:', error.message, error.code);
      throw new Error('Failed to fetch showcase items');
    }

    return (data ?? []).map((row: any) => row.collectible_id);
  }

  async function getUserShowcases(
    userId: string,
    requestingUserId?: string,
  ): Promise<UserShowcase[]> {
    const { data: showcases, error: scError } = await supabase
      .from('showcases')
      .select('id, user_id, title, type, rules, rules_match, rules_last_evaluated_at, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (scError) {
      log.error('Error fetching showcases:', scError.message, scError.code, scError.details);
      throw new Error('Failed to fetch showcases');
    }

    if (!showcases || showcases.length === 0) return [];

    const showcaseIds = showcases.map((s: any) => s.id);
    const { data: junctionRows, error: junctionError } = await supabase
      .from('showcase_collectibles')
      .select('showcase_id, collectible_id, display_order, collectibles ( id, photos, value )')
      .in('showcase_id', showcaseIds);

    if (junctionError) {
      log.error('Error fetching showcase collectibles:', junctionError.message, junctionError.code, junctionError.details);
      throw new Error('Failed to fetch showcase collectibles');
    }

    interface JunctionRow {
      showcase_id: string;
      collectible_id: string;
      display_order: number;
      collectibles: { id: string; photos: string[] | null; value: number | string | null } | null;
    }

    const byShowcase = new Map<string, JunctionRow[]>();
    for (const row of (junctionRows as unknown as JunctionRow[]) || []) {
      const existing = byShowcase.get(row.showcase_id) || [];
      existing.push(row);
      byShowcase.set(row.showcase_id, existing);
    }

    const isVisitor = requestingUserId != null && requestingUserId !== userId;

    const result: UserShowcase[] = [];
    for (const sc of showcases as any[]) {
      const items = byShowcase.get(sc.id) || [];
      const sorted = [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

      const isManagedType = sc.type === 'managed' || sc.type === 'auto';
      if (isVisitor && isManagedType && items.length === 0) continue;

      const images = sorted
        .map((j) => j.collectibles?.photos?.[0])
        .filter((url): url is string => !!url);

      const totalValue = sorted.reduce((sum, j) => {
        const v = j.collectibles?.value;
        return sum + (v ? parseFloat(String(v)) : 0);
      }, 0);

      const showcaseType: 'manual' | 'auto' | 'managed' =
        sc.type === 'managed' ? 'managed' : sc.type === 'auto' ? 'auto' : 'manual';

      result.push({
        id: sc.id,
        title: sc.title,
        items: items.length,
        totalValue,
        showcaseType,
        images,
        rules: sc.rules ?? undefined,
        rulesMatch: sc.rules_match ?? null,
        rulesLastEvaluatedAt: sc.rules_last_evaluated_at ?? null,
      });
    }

    return result;
  }

  async function getShowcaseById(
    showcaseId: string,
    requestingUserId?: string,
  ): Promise<ShowcaseDetail | null> {
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .select('id, user_id, title, type, description, visibility, created_at, rules, rules_match, rules_last_evaluated_at')
      .eq('id', showcaseId)
      .single();

    if (showcaseError) {
      if (showcaseError.code === 'PGRST116') return null;
      log.error('Error fetching showcase:', showcaseError.message, showcaseError.code, showcaseError.details);
      throw new Error('Failed to fetch showcase');
    }
    const sc = showcase as any;

    const { data: ownerData } = await supabase
      .from('users')
      .select('id, display_name, username, avatar, followers_count')
      .eq('id', sc.user_id)
      .single();
    const owner = ownerData as any;

    const { data: junctionRows, error: junctionError } = await supabase
      .from('showcase_collectibles')
      .select(`
        collectible_id,
        display_order,
        added_at,
        collectibles (
          id, title, listing_title, photos, category, subcategory,
          collectible_type, classification, traits, ai_metadata, trait_metadata, filter_traits,
          value, available_for_sale, available_for_trade, created_at
        )
      `)
      .eq('showcase_id', sc.id)
      .order('display_order', { ascending: true });

    if (junctionError) {
      log.error('Error fetching showcase collectibles:', junctionError.message, junctionError.code, junctionError.details);
      throw new Error('Failed to fetch showcase collectibles');
    }

    const ownerName = owner?.display_name || owner?.username || 'Collector';
    const ownerUsername = (owner?.username || 'collector').replace(/^@+/, '');
    const ownerAvatar = owner?.avatar || '/collector-avatar.png';
    const ownerFollowers = typeof owner?.followers_count === 'number' ? owner.followers_count : 0;

    const validRows = ((junctionRows as any[]) || []).filter((row) => !!row.collectibles);
    const ids = validRows.map((row) => row.collectibles.id);
    let trackCounts: Map<string, number> = new Map();
    if (ids.length > 0) {
      try {
        trackCounts = await getTrackCounts(ids);
      } catch (error) {
        log.warn('Track counts fetch failed, defaulting to zero:', (error as Error).message);
      }
    }

    const items: ShowcaseDetailItem[] = validRows.map((row) => {
      const c = row.collectibles;
      const numericValue = c.value != null ? parseFloat(String(c.value)) : null;
      const status = getListingStatus(c.available_for_sale, c.available_for_trade);
      const createdAt = row.added_at || c.created_at || new Date().toISOString();
      return {
        id: c.id,
        title: c.listing_title || c.title || 'Untitled',
        classification: c.classification ?? null,
        image: c.photos?.[0] || '',
        status,
        traits: c.traits || [],
        value: Number.isFinite(numericValue) ? numericValue : null,
        trackingCount: trackCounts.get(c.id) ?? 0,
        category: c.category || 'Collectible',
        collectibleType: c.collectible_type || 'unknown',
        createdAt,
        aiMetadata: c.ai_metadata || null,
        traitMetadata: c.trait_metadata || null,
        filterTraits: c.filter_traits || null,
      };
    });

    const collectibles: ShowcaseDetailCollectible[] = validRows.map((row, index) => {
      const c = row.collectibles;
      const numericValue = c.value != null ? parseFloat(String(c.value)) : 0;
      return {
        id: c.id,
        image: c.photos?.[0] || '/collector-avatar.png',
        title: c.title,
        collector: ownerName,
        avatar: ownerAvatar,
        tracks: items[index]?.trackingCount ?? 0,
        type: c.category || 'Collectible',
        subcategory: c.subcategory || 'General',
        value: formatCurrency(numericValue),
        name: c.title,
        addedAt: row.added_at || c.created_at || new Date().toISOString(),
        priceChange: '+0%',
        status: getListingStatus(c.available_for_sale, c.available_for_trade),
      };
    });

    const totalValueNumeric = items.reduce((sum, item) => sum + (item.value ?? 0), 0);

    const isManagedType = sc.type === 'managed' || sc.type === 'auto';
    const isVisitor = requestingUserId != null && requestingUserId !== sc.user_id;
    if (isVisitor && isManagedType && items.length === 0) return null;

    const showcaseType: 'manual' | 'auto' | 'managed' =
      sc.type === 'managed' ? 'managed' : sc.type === 'auto' ? 'auto' : 'manual';

    const parsedRules: ManagedRules | undefined = isManagedType && Array.isArray(sc.rules)
      ? { match: (sc.rules_match as 'all' | 'any') ?? 'all', conditions: sc.rules }
      : undefined;

    return {
      id: sc.id,
      title: sc.title,
      description: sc.description ?? undefined,
      showcaseType,
      visibility: (sc.visibility === 'private' ? 'private' : 'public') as 'public' | 'private',
      createdAt: sc.created_at,
      owner: {
        id: sc.user_id,
        name: ownerName,
        username: ownerUsername,
        avatar: ownerAvatar,
        followers: ownerFollowers,
      },
      stats: {
        totalItems: items.length,
        totalValue: formatCurrency(totalValueNumeric),
        totalValueNumeric,
      },
      collectibles,
      items,
      images: items.map((item) => item.image).filter(Boolean).slice(0, 4),
      rules: parsedRules,
      rulesLastEvaluatedAt: sc.rules_last_evaluated_at ?? null,
    };
  }

  async function getFeaturedShowcaseDetail(
    showcaseId: string,
  ): Promise<HomeShowcaseDetail | null> {
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .select('id, title, description')
      .eq('id', showcaseId)
      .single();

    if (showcaseError || !showcase) {
      log.error('Error fetching featured showcase:', showcaseError?.message);
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from('showcase_collectibles')
      .select('collectibles ( photos, category )')
      .eq('showcase_id', showcaseId)
      .order('display_order', { ascending: true });

    if (itemsError) log.warn('Error fetching showcase items:', itemsError.message);

    const allItems = (items ?? []).filter((row: any) => row.collectibles);
    const previewImages: string[] = [];
    const categoryCounts = new Map<string, number>();

    for (const row of allItems) {
      const c = (row as any).collectibles;
      if (previewImages.length < 3 && c.photos?.[0]) previewImages.push(c.photos[0]);
      const cat = c.category || 'other';
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    let primaryCategory: string | null = null;
    let maxCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > maxCount) {
        primaryCategory = cat;
        maxCount = count;
      }
    }

    return {
      id: (showcase as any).id,
      title: (showcase as any).title,
      description: (showcase as any).description ?? null,
      itemCount: allItems.length,
      previewImages,
      primaryCategory,
    };
  }

  async function getUserShowcaseCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('showcases')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      log.error('Error counting showcases:', error.message);
      return 0;
    }
    return count ?? 0;
  }

  async function getUserShowcasePreviews(
    userId: string,
    limit = 3,
  ): Promise<ShowcasePreview[]> {
    const { data, error } = await supabase
      .from('showcases')
      .select('id, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      log.error('Error fetching showcase previews:', error?.message);
      return [];
    }

    const previews: ShowcasePreview[] = [];
    for (const s of data as any[]) {
      const { data: items } = await supabase
        .from('showcase_collectibles')
        .select('collectibles ( photos )')
        .eq('showcase_id', s.id)
        .order('display_order', { ascending: true })
        .limit(1);

      const firstImage = (items?.[0] as any)?.collectibles?.photos?.[0] ?? null;
      previews.push({
        id: s.id,
        title: s.title,
        thumbnail: firstImage,
      });
    }

    return previews;
  }

  return {
    createShowcase,
    updateShowcaseRules,
    previewRuleMatches,
    deleteShowcase,
    updateShowcase,
    getShowcaseCollectibleIds,
    getUserShowcases,
    getShowcaseById,
    getFeaturedShowcaseDetail,
    getUserShowcaseCount,
    getUserShowcasePreviews,
  };
}
