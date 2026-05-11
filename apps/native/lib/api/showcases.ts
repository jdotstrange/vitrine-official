import { supabase } from '@/lib/supabase';
import { logger } from '../logger';
import { type ListingStatus } from '@/lib/status-utils';
import { getTrackCounts } from './tracking';
import { sendNotification } from './notifications';
import {
  evalRowFromCollectionItem,
  evaluateManagedRules,
  type ManagedRules,
} from './managed-rules';

const log = logger.create('ShowcasesAPI');

function generateId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

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

/**
 * Create a new showcase. Manual showcases get junction rows from the provided
 * IDs. Managed showcases persist rules and kick off the evaluator Edge
 * function, blocking until the first evaluation completes so the user sees
 * the membership result immediately.
 *
 * Returns the new showcase ID.
 */
export async function createShowcase(params: CreateShowcaseParams): Promise<string> {
  if (params.type === 'managed') {
    return createManagedShowcase(params);
  }
  return createManualShowcase(params);
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

// ---------------------------------------------------------------------------
// UPDATE RULES (for existing managed showcases)
// ---------------------------------------------------------------------------

export interface UpdateShowcaseRulesParams {
  showcaseId: string;
  title?: string;
  description?: string;
  visibility?: 'public' | 'private';
  rules: ManagedRules;
}

/**
 * Update a managed showcase's rules (and optionally its metadata). Persists
 * the new rules then blocks on immediate evaluation so the caller gets the
 * match count back.
 */
export async function updateShowcaseRules(
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

// ---------------------------------------------------------------------------
// PREVIEW (pure client-side eval — no network round-trip)
// ---------------------------------------------------------------------------

/**
 * Preview rule matches against in-memory collectibles. Called on every
 * condition change in the rule builder for the live preview card.
 */
export function previewRuleMatches(
  items: Array<{
    id: string;
    title: string;
    collectibleType: string;
    value: number | null;
    status: string;
    traits: string[];
    tags?: string[];
    image?: string;
    filterTraits?: { franchise?: string | null; item_type?: string | null; year?: number | null; maker?: string | null } | null;
  }>,
  rules: ManagedRules,
): { matchingIds: string[]; totalValue: number; previewImages: string[] } {
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

// ---------------------------------------------------------------------------
// EDGE FN INVOCATION
// ---------------------------------------------------------------------------

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

/**
 * Fan out a `new_showcase_from_followed` activity to every follower of
 * the showcase's creator. Best-effort — we resolve the cover image off
 * the first collectible if one exists.
 */
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
        coverImage = cover?.photos?.[0] ?? null;
      }

      const recipientIds = followers.map((f: { follower_id: string }) => f.follower_id);
      sendNotification({
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

/**
 * Delete a showcase and its collectible junction rows.
 */
export async function deleteShowcase(showcaseId: string): Promise<void> {
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

export interface UpdateShowcaseParams {
  showcaseId: string;
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  collectibleIds: string[];
}

/**
 * Update an existing showcase's metadata and reconcile its collectible list.
 */
export async function updateShowcase(params: UpdateShowcaseParams): Promise<void> {
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

/**
 * Fetch the collectible IDs currently in a showcase, ordered by display_order.
 */
export async function getShowcaseCollectibleIds(showcaseId: string): Promise<string[]> {
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

export interface ShowcaseCollectibleRow {
  collectible_id: string;
  display_order: number;
  collectible: {
    id: string;
    photos: string[] | null;
    value: number | string | null;
  } | null;
}

export interface ShowcaseRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
  showcase_collectibles: ShowcaseCollectibleRow[];
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

/**
 * Enriched, normalized collectible shape consumed by the V3 showcase detail
 * surface. Structurally identical to `CollectionItem` from
 * `@/components/collectibles` so the showcase detail screen can pass the
 * array directly to `<CollectionSurface>` and to the derive helpers
 * (`deriveAssetMatrix`, `deriveStatusBreakdown`, `deriveTraitMix`) without
 * any runtime mapping.
 *
 * We don't import `CollectionItem` here to avoid `lib/api → components`
 * dependency direction — TS structural typing makes the cross-boundary
 * assignment seamless.
 */
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
    /** Pre-formatted display string (`"$12,345"`). Legacy chrome consumes this. */
    totalValue: string;
    /** Raw numeric total for V3 surfaces that own their own formatting. */
    totalValueNumeric: number;
  };
  /**
   * Lossy legacy collectible shape — currently consumed by the messaging
   * vitrine-attachment preview. Kept for backward compat; V3 surfaces should
   * prefer `items`. Safe to retire once the attachment preview migrates.
   */
  collectibles: ShowcaseDetailCollectible[];
  /** Enriched collectible list — V3 consumers should pass straight through. */
  items: ShowcaseDetailItem[];
  images: string[];
  /** Present when `showcaseType === 'managed'`. */
  rules?: ManagedRules;
  /** Timestamp of last successful rule evaluation. */
  rulesLastEvaluatedAt?: string | null;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function getListingStatus(availableForSale?: boolean | null, availableForTrade?: boolean | null): ListingStatus {
  if (availableForSale && availableForTrade) return 'SELL_TRADE';
  if (availableForSale) return 'FOR_SALE';
  if (availableForTrade) return 'FOR_TRADE';
  return 'NFST';
}

/**
 * Fetch all showcases for a user, including collectible images and computed value.
 *
 * When `requestingUserId` differs from `userId` (visitor view), managed
 * showcases with zero items are filtered out.
 */
export async function getUserShowcases(
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

  // Step 2: Fetch junction rows with collectible data for all user showcases
  const showcaseIds = showcases.map((s) => s.id);
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
  for (const sc of showcases) {
    const items = byShowcase.get(sc.id) || [];
    const sorted = [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    // Hide empty managed showcases from visitors
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

/**
 * Fetch a single showcase detail view with owner + collectibles.
 *
 * When `requestingUserId` is provided and differs from the owner,
 * managed showcases with zero items return `null` (hidden from visitors).
 */
export async function getShowcaseById(
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

  const { data: owner } = await supabase
    .from('users')
    .select('id, display_name, username, avatar, followers_count')
    .eq('id', showcase.user_id)
    .single();

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
    .eq('showcase_id', showcase.id)
    .order('display_order', { ascending: true });

  if (junctionError) {
    log.error('Error fetching showcase collectibles:', junctionError.message, junctionError.code, junctionError.details);
    throw new Error('Failed to fetch showcase collectibles');
  }

  interface DetailRow {
    collectible_id: string;
    display_order: number;
    added_at: string | null;
    collectibles: {
      id: string;
      title: string;
      listing_title: string | null;
      photos: string[] | null;
      category: string | null;
      subcategory: string | null;
      collectible_type: string | null;
      classification: string | null;
      traits: string[] | null;
      ai_metadata: Record<string, unknown> | null;
      trait_metadata: Record<string, unknown> | null;
      filter_traits: Record<string, unknown> | null;
      value: number | string | null;
      available_for_sale: boolean | null;
      available_for_trade: boolean | null;
      created_at: string | null;
    } | null;
  }

  const ownerName = owner?.display_name || owner?.username || 'Collector';
  const ownerUsername = (owner?.username || 'collector').replace(/^@+/, '');
  const ownerAvatar = owner?.avatar || '/collector-avatar.png';
  const ownerFollowers = typeof owner?.followers_count === 'number' ? owner.followers_count : 0;

  // ── Pull tracking counts in a single batched RPC ─────────────────────
  const validRows = ((junctionRows as DetailRow[]) || []).filter((row) => !!row.collectibles);
  const ids = validRows.map((row) => row.collectibles!.id);
  let trackCounts: Map<string, number> = new Map();
  if (ids.length > 0) {
    try {
      trackCounts = await getTrackCounts(ids);
    } catch (error) {
      log.warn('Track counts fetch failed, defaulting to zero:', (error as Error).message);
    }
  }

  // ── Build the V3-enriched item shape ─────────────────────────────────
  const items: ShowcaseDetailItem[] = validRows.map((row) => {
    const c = row.collectibles!;
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

  // ── Build the legacy lossy shape (still consumed by the messaging
  // vitrine-attachment preview). Mirrors the previous behaviour. ─
  const collectibles: ShowcaseDetailCollectible[] = validRows.map((row, index) => {
    const c = row.collectibles!;
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

  const isManagedType = showcase.type === 'managed' || showcase.type === 'auto';
  const isVisitor = requestingUserId != null && requestingUserId !== showcase.user_id;
  if (isVisitor && isManagedType && items.length === 0) return null;

  const showcaseType: 'manual' | 'auto' | 'managed' =
    showcase.type === 'managed' ? 'managed' : showcase.type === 'auto' ? 'auto' : 'manual';

  const parsedRules: ManagedRules | undefined = isManagedType && Array.isArray(showcase.rules)
    ? { match: (showcase.rules_match as 'all' | 'any') ?? 'all', conditions: showcase.rules }
    : undefined;

  return {
    id: showcase.id,
    title: showcase.title,
    description: showcase.description ?? undefined,
    showcaseType,
    visibility: (showcase.visibility === 'private' ? 'private' : 'public') as 'public' | 'private',
    createdAt: showcase.created_at,
    owner: {
      id: showcase.user_id,
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
    rulesLastEvaluatedAt: showcase.rules_last_evaluated_at ?? null,
  };
}

// ── Home Screen Queries ──

export interface HomeShowcaseDetail {
  id: string;
  title: string;
  description: string | null;
  itemCount: number;
  previewImages: string[];
  primaryCategory: string | null;
}

export async function getFeaturedShowcaseDetail(
  showcaseId: string
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

  if (itemsError) {
    log.warn('Error fetching showcase items:', itemsError.message);
  }

  const allItems = (items ?? []).filter((row: any) => row.collectibles);
  const previewImages: string[] = [];
  const categoryCounts = new Map<string, number>();

  for (const row of allItems) {
    const c = (row as any).collectibles;
    if (previewImages.length < 3 && c.photos?.[0]) {
      previewImages.push(c.photos[0]);
    }
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

export async function getUserShowcaseCount(userId: string): Promise<number> {
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

export interface ShowcasePreview {
  id: string;
  title: string;
  thumbnail: string | null;
}

export async function getUserShowcasePreviews(
  userId: string,
  limit = 3
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
  for (const s of data) {
    const { data: items } = await supabase
      .from('showcase_collectibles')
      .select('collectibles ( photos )')
      .eq('showcase_id', (s as any).id)
      .order('display_order', { ascending: true })
      .limit(1);

    const firstImage = (items?.[0] as any)?.collectibles?.photos?.[0] ?? null;
    previews.push({
      id: (s as any).id,
      title: (s as any).title,
      thumbnail: firstImage,
    });
  }

  return previews;
}
