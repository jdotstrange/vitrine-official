/**
 * Collectibles API
 * Handles creating and updating collectibles
 * 
 * Now uses direct Supabase queries instead of Railway backend
 */

import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { uploadImage as uploadStorageImage } from '@/lib/image-utils';
import { logger } from '../logger';
import { sendNotification } from './notifications';
import { invalidateProfileHub } from '@/lib/profile-hub-cache';
import { createShowcase } from './showcases';

const log = logger.create('API');

function generateId(): string {
  return Crypto.randomUUID();
}

// Domain enums live in @vitrine/types. Re-exported so existing
// `import { type ListingStatus } from '@/lib/api/collectibles'` keeps working.
import type { ListingStatus, CollectibleType } from '@vitrine/types';
export type { ListingStatus, CollectibleType };

/**
 * Create Collectible Request
 */
export interface CreateCollectibleRequest {
  title: string;
  description?: string;
  photos: string[]; // URLs after upload
  category: string; // Category code (e.g., "baseball")
  subcategory?: string; // Subcategory code (optional)
  privacy?: string; // Default: "public"
  tags?: string[];
  availableForSale?: boolean;
  availableForTrade?: boolean;
  value?: number;
  showcaseId?: string;
}

/** Owner-authored field (not from Looking Glass). */
export interface CollectibleCustomField {
  id: string;
  label: string;
  value: string;
  created_at: string;
}

/** Post-catalog correction provenance for transparency badges. */
export type MetadataProvenance = Record<
  string,
  { source: 'user'; at: string }
>;

function parseCustomFields(raw: unknown): CollectibleCustomField[] {
  if (!Array.isArray(raw)) return [];
  const out: CollectibleCustomField[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === 'string' ? e.label.trim() : '';
    const value = typeof e.value === 'string' ? e.value : String(e.value ?? '');
    if (!label) continue;
    out.push({
      id: typeof e.id === 'string' ? e.id : `cf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      label,
      value,
      created_at: typeof e.created_at === 'string' ? e.created_at : new Date().toISOString(),
    });
  }
  return out;
}

function parseMetadataProvenance(raw: unknown): MetadataProvenance {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as MetadataProvenance;
}

function mapRowToResponse(item: Record<string, any>): CreateCollectibleResponse {
  return {
    id: item.id,
    firebaseId: item.firebase_id,
    userId: item.user_id,
    title: item.title,
    description: item.description,
    photos: item.photos || [],
    category: item.category,
    subcategory: item.subcategory,
    privacy: item.privacy,
    tags: item.tags || [],
    availableForSale: item.available_for_sale,
    availableForTrade: item.available_for_trade,
    value: item.value,
    collectibleType: item.collectible_type as CollectibleType | undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    listingTitle: item.listing_title,
    listingDescription: item.listing_description,
    classification: item.classification,
    traits: item.traits,
    confidence: item.confidence,
    aiMetadata: item.ai_metadata,
    fieldSchema: item.field_schema,
    traitMetadata: item.trait_metadata,
    autographAssessment: item.autograph_assessment,
    verificationUrl: item.verification_url,
    schemaMode: item.schema_mode,
    filterTraits: item.filter_traits ?? null,
    customFields: parseCustomFields(item.custom_fields),
    metadataProvenance: parseMetadataProvenance(item.metadata_provenance),
    reextractionOf: item.reextraction_of ?? null,
    publishedAt: item.published_at ?? null,
    extractionStatus: item.extraction_status ?? null,
  };
}

/**
 * Create Collectible Response
 */
export interface CreateCollectibleResponse {
  id: string;
  firebaseId?: string;
  userId: string;
  title: string;
  description?: string;
  photos: string[];
  category: string;
  subcategory?: string;
  privacy: string;
  tags: string[];
  availableForSale: boolean;
  availableForTrade: boolean;
  value?: number;
  collectibleType?: CollectibleType;
  createdAt: string;
  updatedAt: string;
  // AI-enriched columns
  listingTitle?: string | null;
  listingDescription?: string | null;
  classification?: string | null;
  traits?: string[] | null;
  confidence?: string | null;
  aiMetadata?: Record<string, unknown> | null;
  fieldSchema?: Record<string, { type: string; description: string }> | null;
  traitMetadata?: Record<string, unknown> | null;
  autographAssessment?: Record<string, unknown> | null;
  verificationUrl?: string | null;
  schemaMode?: string | null;
  filterTraits?: FilterTraits | null;
  customFields?: CollectibleCustomField[];
  metadataProvenance?: MetadataProvenance;
  reextractionOf?: string | null;
  publishedAt?: string | null;
  extractionStatus?: string | null;
}

export type FilterTraits = {
  year: number | null;
  maker: string | null;
  subject: string[] | null;
  franchise: string | null;
  item_type: string | null;
  serial_number: string | null;
  special_finish: boolean;
};

/**
 * Key Details Request
 * Dynamic object based on field values
 */
export interface KeyDetailsRequest {
  [fieldId: string]: unknown;
}

/**
 * Key Details Response
 */
export interface KeyDetailsResponse {
  success: boolean;
  message?: string;
}

/**
 * Upload Image Response
 */
export interface UploadImageResponse {
  url: string;
  id?: string;
}

/**
 * Create a new collectible (memorabilia type)
 */
export async function createCollectible(
  userId: string,
  data: CreateCollectibleRequest
): Promise<CreateCollectibleResponse> {
  log.info('Creating collectible for user:', userId);

  const now = new Date().toISOString();
  const collectibleId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data: collectible, error } = await supabase
    .from('collectibles')
    .insert({
      id: collectibleId,
      user_id: userId,
      title: data.title,
      description: data.description || null,
      photos: data.photos || [],
      category: data.category,
      subcategory: data.subcategory || null,
      privacy: data.privacy || 'public',
      visibility: data.privacy || 'public',
      tags: data.tags || [],
      available_for_sale: data.availableForSale || false,
      available_for_trade: data.availableForTrade || false,
      value: data.value || null,
      collectible_type: 'memorabilia',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    log.error('Error creating collectible:', error);
    throw new Error('Failed to create collectible');
  }

  // Update user's collectibles count
  try {
    const { error: countError } = await supabase
      .from('users')
      .update({ 
        collectibles_count: (await supabase
          .from('collectibles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('published_at', 'is', null)).count || 0 
      })
      .eq('id', userId);
    
    if (countError) {
      log.warn('Could not update collectibles count:', countError);
    }
  } catch (e) {
    log.warn('Error updating collectibles count:', e);
  }

  log.info('Collectible created:', collectibleId);

  if (collectible.privacy !== 'private') {
    notifyFollowersOfNewItem(
      userId,
      collectibleId,
      collectible.title,
      collectible.photos?.[0] || '',
    );
  }

  return {
    id: collectible.id,
    firebaseId: collectible.firebase_id,
    userId: collectible.user_id,
    title: collectible.title,
    description: collectible.description,
    photos: collectible.photos || [],
    category: collectible.category,
    subcategory: collectible.subcategory,
    privacy: collectible.privacy,
    tags: collectible.tags || [],
    availableForSale: collectible.available_for_sale,
    availableForTrade: collectible.available_for_trade,
    value: collectible.value,
    createdAt: collectible.created_at,
    updatedAt: collectible.updated_at,
  };
}

/**
 * Update an existing collectible's core fields.
 *
 * Detects status / value mutations and:
 *   - writes a row to collectible_change_log (powers the JOURNAL stream)
 *   - notifies trackers via the activity feed
 *
 * Both side effects are fire-and-forget; a failed notification never
 * blocks the update.
 */
export async function updateCollectible(
  collectibleId: string,
  data: Partial<CreateCollectibleRequest>
): Promise<CreateCollectibleResponse> {
  log.info('Updating collectible:', collectibleId);

  const now = new Date().toISOString();

  // Snapshot the rows we may need to diff against. Pulling these in one
  // shot is cheaper than two separate roundtrips and keeps the diff
  // logic next to the mutation it describes.
  const wantsStatusDiff = data.availableForSale !== undefined || data.availableForTrade !== undefined;
  const wantsValueDiff = data.value !== undefined;
  let prevAvailableForSale: boolean | null = null;
  let prevAvailableForTrade: boolean | null = null;
  let prevValue: number | null = null;
  if (wantsStatusDiff || wantsValueDiff) {
    const { data: prevRow } = await supabase
      .from('collectibles')
      .select('available_for_sale, available_for_trade, value')
      .eq('id', collectibleId)
      .single();
    if (prevRow) {
      prevAvailableForSale = prevRow.available_for_sale ?? null;
      prevAvailableForTrade = prevRow.available_for_trade ?? null;
      prevValue = prevRow.value !== null && prevRow.value !== undefined
        ? Number(prevRow.value)
        : null;
    }
  }

  const updatePayload: Record<string, string | string[] | boolean | number | null> = { updated_at: now };

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.description !== undefined) updatePayload.description = data.description || null;
  if (data.photos !== undefined) updatePayload.photos = data.photos || [];
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.subcategory !== undefined) updatePayload.subcategory = data.subcategory || null;
  if (data.privacy !== undefined) {
    updatePayload.privacy = data.privacy;
    updatePayload.visibility = data.privacy;
  }
  if (data.tags !== undefined) updatePayload.tags = data.tags || [];
  if (data.availableForSale !== undefined) updatePayload.available_for_sale = data.availableForSale;
  if (data.availableForTrade !== undefined) updatePayload.available_for_trade = data.availableForTrade;
  if (data.value !== undefined) updatePayload.value = data.value;
  if (data.showcaseId !== undefined) updatePayload.showcase_id = data.showcaseId || null;

  const { data: collectible, error } = await supabase
    .from('collectibles')
    .update(updatePayload)
    .eq('id', collectibleId)
    .select()
    .single();

  if (error) {
    log.error('Error updating collectible:', error);
    throw new Error('Failed to update collectible');
  }

  log.info('Collectible updated:', collectibleId);

  if (wantsStatusDiff) {
    const sameStatus =
      collectible.available_for_sale === prevAvailableForSale &&
      collectible.available_for_trade === prevAvailableForTrade;
    if (!sameStatus) {
      notifyTrackersOfStatusChange(
        collectibleId,
        collectible.user_id,
        collectible.title,
        collectible.photos?.[0] || '',
        collectible.available_for_sale,
        collectible.available_for_trade,
        {
          for_sale: prevAvailableForSale,
          for_trade: prevAvailableForTrade,
        },
      );
    }
  }

  if (wantsValueDiff) {
    const newValue = collectible.value !== null && collectible.value !== undefined
      ? Number(collectible.value)
      : null;
    if (newValue !== prevValue) {
      notifyTrackersOfValueChange(
        collectibleId,
        collectible.user_id,
        collectible.title,
        collectible.photos?.[0] || '',
        prevValue,
        newValue,
      );
    }
  }

  return {
    id: collectible.id,
    firebaseId: collectible.firebase_id,
    userId: collectible.user_id,
    title: collectible.title,
    description: collectible.description,
    photos: collectible.photos || [],
    category: collectible.category,
    subcategory: collectible.subcategory,
    privacy: collectible.privacy,
    tags: collectible.tags || [],
    availableForSale: collectible.available_for_sale,
    availableForTrade: collectible.available_for_trade,
    value: collectible.value,
    createdAt: collectible.created_at,
    updatedAt: collectible.updated_at,
  };
}

/**
 * Compose the wire-format status code from sale + trade flags. Used by
 * both notifications and the change-log payload so the JOURNAL stream
 * speaks the same vocabulary as the INBOX stream.
 */
function deriveStatusCode(forSale: boolean | null, forTrade: boolean | null): string {
  if (forSale && forTrade) return 'sell_trade';
  if (forSale) return 'sell';
  if (forTrade) return 'trade';
  return 'collection';
}

/**
 * Append a row to collectible_change_log. Best-effort — JOURNAL is a
 * convenience surface, not a transactional invariant, so a failure here
 * shouldn't surface to the user.
 */
async function writeChangeLog(
  collectibleId: string,
  userId: string,
  changeType: 'status' | 'value',
  prevValue: Record<string, unknown> | null,
  newValue: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.from('collectible_change_log').insert({
      collectible_id: collectibleId,
      user_id: userId,
      change_type: changeType,
      prev_value: prevValue,
      new_value: newValue,
    });
    if (error) log.warn('change_log insert failed:', error.message);
  } catch (err) {
    log.warn('change_log insert error:', err);
  }
}

function notifyTrackersOfStatusChange(
  collectibleId: string,
  ownerId: string,
  title: string,
  image: string,
  forSale: boolean,
  forTrade: boolean,
  prev: { for_sale: boolean | null; for_trade: boolean | null },
) {
  const newStatus = deriveStatusCode(forSale, forTrade);

  (async () => {
    // Always write the journal entry, even if there are no trackers —
    // the owner still wants to see "you changed status" on their own
    // activity surface.
    await writeChangeLog(
      collectibleId,
      ownerId,
      'status',
      { for_sale: prev.for_sale, for_trade: prev.for_trade },
      { for_sale: forSale, for_trade: forTrade, status: newStatus },
    );

    try {
      const { data: trackers } = await supabase
        .from('tracked_items')
        .select('user_id')
        .eq('collectible_id', collectibleId);
      if (!trackers || trackers.length === 0) return;
      const recipientIds = trackers
        .map((t: { user_id: string }) => t.user_id)
        .filter((id: string) => id !== ownerId);
      if (recipientIds.length === 0) return;

      sendNotification({
        type: 'status_change',
        recipientIds,
        actorId: ownerId,
        data: {
          objectId: collectibleId,
          objectType: 'collectible',
          collectibleId,
          collectibleTitle: title,
          collectibleImage: image,
          newStatus,
        },
      }).catch(() => {});
    } catch {}
  })();
}

function notifyTrackersOfValueChange(
  collectibleId: string,
  ownerId: string,
  title: string,
  image: string,
  prevValue: number | null,
  newValue: number | null,
) {
  (async () => {
    await writeChangeLog(
      collectibleId,
      ownerId,
      'value',
      prevValue !== null ? { amount: prevValue } : null,
      { amount: newValue },
    );

    try {
      const { data: trackers } = await supabase
        .from('tracked_items')
        .select('user_id')
        .eq('collectible_id', collectibleId);
      if (!trackers || trackers.length === 0) return;
      const recipientIds = trackers
        .map((t: { user_id: string }) => t.user_id)
        .filter((id: string) => id !== ownerId);
      if (recipientIds.length === 0) return;

      sendNotification({
        type: 'value_change',
        recipientIds,
        actorId: ownerId,
        data: {
          objectId: collectibleId,
          objectType: 'collectible',
          collectibleId,
          collectibleTitle: title,
          collectibleImage: image,
          prevValue,
          newValue,
        },
      }).catch(() => {});
    } catch {}
  })();
}

/**
 * Notify trackers that metadata fields changed. Metadata mutations
 * don't get journaled (the user explicitly opted out of "you edited
 * metadata" rows), but trackers still get a heads-up that the listing
 * has more or different specs.
 */
function notifyTrackersOfMetadataChange(
  collectibleId: string,
  ownerId: string,
  title: string,
  image: string,
  changedFieldLabels: string[],
) {
  if (changedFieldLabels.length === 0) return;
  (async () => {
    try {
      const { data: trackers } = await supabase
        .from('tracked_items')
        .select('user_id')
        .eq('collectible_id', collectibleId);
      if (!trackers || trackers.length === 0) return;
      const recipientIds = trackers
        .map((t: { user_id: string }) => t.user_id)
        .filter((id: string) => id !== ownerId);
      if (recipientIds.length === 0) return;

      sendNotification({
        type: 'metadata_change',
        recipientIds,
        actorId: ownerId,
        data: {
          objectId: collectibleId,
          objectType: 'collectible',
          collectibleId,
          collectibleTitle: title,
          collectibleImage: image,
          changedFields: changedFieldLabels,
        },
      }).catch(() => {});
    } catch {}
  })();
}

function notifyFollowersOfNewItem(
  ownerId: string,
  collectibleId: string,
  title: string,
  image: string,
) {
  (async () => {
    try {
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', ownerId);
      if (!followers || followers.length === 0) return;
      const recipientIds = followers.map((f: { follower_id: string }) => f.follower_id);
      sendNotification({
        type: 'new_item_from_followed',
        recipientIds,
        actorId: ownerId,
        data: {
          objectId: collectibleId,
          collectibleId,
          collectibleTitle: title,
          collectibleImage: image,
        },
      }).catch(() => {});
    } catch {}
  })();
}

/**
 * Update collectible key details
 * 
 * @param collectibleId - The collectible ID
 * @param details - Field values keyed by field ID
 */
export async function updateCollectibleKeyDetails(
  collectibleId: string,
  details: KeyDetailsRequest
): Promise<KeyDetailsResponse> {
  log.info('Updating key details for:', collectibleId);

  const now = new Date().toISOString();

  // Get existing field values for this collectible
  const { data: existingValues, error: fetchError } = await supabase
    .from('collectible_field_values')
    .select('id, field_id')
    .eq('collectible_id', collectibleId);

  if (fetchError) {
    log.error('Error fetching existing values:', fetchError);
    throw new Error('Failed to fetch existing field values');
  }

  const existingFieldIds = new Set(existingValues?.map(v => v.field_id) || []);

  interface FieldValueRecord {
    id?: string;
    collectible_id: string;
    field_id: string;
    value: string;
    updated_at: string;
    field_level?: string;
    field_type?: string;
    created_at?: string;
  }

  const upserts: FieldValueRecord[] = [];
  const inserts: FieldValueRecord[] = [];

  for (const [fieldId, value] of Object.entries(details)) {
    const record = {
      collectible_id: collectibleId,
      field_id: fieldId,
      value: JSON.stringify(value),
      updated_at: now,
    };

    if (existingFieldIds.has(fieldId)) {
      // Update existing
      const existing = existingValues?.find(v => v.field_id === fieldId);
      if (existing) {
        upserts.push({ ...record, id: existing.id });
      }
    } else {
      // Insert new
      inserts.push({
        ...record,
        id: `cfv-${collectibleId}-${fieldId}`,
        field_level: 'category', // Default - could be determined from field lookup
        field_type: 'text', // Default - could be determined from field lookup
        created_at: now,
      });
    }
  }

  // Perform upserts
  if (upserts.length > 0) {
    const { error: upsertError } = await supabase
      .from('collectible_field_values')
      .upsert(upserts);

    if (upsertError) {
      log.error('Error upserting field values:', upsertError);
      throw new Error('Failed to update field values');
    }
  }

  // Perform inserts
  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from('collectible_field_values')
      .insert(inserts);

    if (insertError) {
      log.error('Error inserting field values:', insertError);
      throw new Error('Failed to insert field values');
    }
  }

  // Update collectible's updated_at
  await supabase
    .from('collectibles')
    .update({ updated_at: now })
    .eq('id', collectibleId);

  log.info('Key details updated successfully');

  // Fire metadata_change to trackers if anything actually moved.
  const touchedFieldIds = [...upserts, ...inserts]
    .map((r) => r.field_id)
    .filter((id): id is string => !!id);
  if (touchedFieldIds.length > 0) {
    (async () => {
      try {
        const [{ data: ownerRow }, { data: labelRows }] = await Promise.all([
          supabase
            .from('collectibles')
            .select('user_id, title, photos')
            .eq('id', collectibleId)
            .single(),
          supabase
            .from('fields')
            .select('id, field_label')
            .in('id', touchedFieldIds),
        ]);
        if (!ownerRow) return;
        const labels = (labelRows || [])
          .map((r) => (r as any).field_label)
          .filter((l): l is string => typeof l === 'string' && l.length > 0);
        notifyTrackersOfMetadataChange(
          collectibleId,
          ownerRow.user_id,
          ownerRow.title || 'a collectible',
          (ownerRow.photos && ownerRow.photos[0]) || '',
          labels,
        );
      } catch (err) {
        log.warn('metadata_change wire-up failed:', err);
      }
    })();
  }

  return {
    success: true,
    message: 'Key details updated successfully',
  };
}

/**
 * Upload image for collectible to Supabase Storage
 * 
 * @param userId - User ID for path organization
 * @param imageUri - Local file URI
 * @param filename - Original filename
 */
export async function uploadImage(
  userId: string,
  imageUri: string,
  filename?: string
): Promise<UploadImageResponse> {
  log.info('Uploading image for user:', userId);

  try {
    const fileExt = filename?.split('.').pop() || 'jpg';
    const basePath = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { url, storagePath } = await uploadStorageImage(
      'collectible-images',
      basePath,
      imageUri,
    );

    log.info('Image uploaded:', url);

    return { url, id: storagePath };
  } catch (error) {
    log.error('Upload error:', error);
    throw error;
  }
}

/**
 * Get collectible by ID
 */
export async function getCollectible(collectibleId: string): Promise<CreateCollectibleResponse | null> {
  const { data, error } = await supabase
    .from('collectibles')
    .select('*')
    .eq('id', collectibleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    log.error('Error fetching collectible:', error);
    throw new Error('Failed to fetch collectible');
  }

  return mapRowToResponse(data);
}

/**
 * Get collectibles for a user
 */
export async function getUserCollectibles(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<CreateCollectibleResponse[]> {
  let query = supabase
    .from('collectibles')
    .select('*')
    .eq('user_id', userId)
    .not('listing_title', 'is', null)
    .not('published_at', 'is', null)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Error fetching user collectibles:', error);
    throw new Error('Failed to fetch collectibles');
  }

  return (data || []).map(mapRowToResponse);
}

/**
 * Delete a collectible and its associated images from storage.
 */
export async function deleteCollectible(collectibleId: string, userId: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from('collectibles')
    .select('photos, user_id')
    .eq('id', collectibleId)
    .single();

  if (fetchError) {
    log.error('Error fetching collectible for delete:', fetchError);
    throw new Error('Failed to find collectible');
  }

  if (row.user_id !== userId) {
    throw new Error('You can only delete your own collectibles');
  }

  const { error: scError } = await supabase
    .from('showcase_collectibles')
    .delete()
    .eq('collectible_id', collectibleId);
  if (scError) log.warn('Error removing showcase refs:', scError);

  const { error: tiError } = await supabase
    .from('tracked_items')
    .delete()
    .eq('collectible_id', collectibleId);
  if (tiError) log.warn('Error removing tracked_items refs:', tiError);

  const { error: fvError } = await supabase
    .from('collectible_field_values')
    .delete()
    .eq('collectible_id', collectibleId);
  if (fvError) log.warn('Error removing field values:', fvError);

  const { error: deleteError } = await supabase
    .from('collectibles')
    .delete()
    .eq('id', collectibleId);

  if (deleteError) {
    log.error('Error deleting collectible row:', deleteError.code, deleteError.message, deleteError.details);
    throw new Error(`Failed to delete collectible: ${deleteError.message}`);
  }

  // Clean up storage images (best effort)
  if (row.photos && Array.isArray(row.photos)) {
    for (const url of row.photos) {
      if (!url || typeof url !== 'string') continue;
      const match = url.match(/\/collectible-images\/(.+)$/);
      if (match) {
        await supabase.storage.from('collectible-images').remove([match[1]]).catch(() => {});
      }
    }
  }

  invalidateProfileHub(userId);
}

/**
 * Count how many times other users are tracking this user's collectibles.
 * Uses a joined query: tracked_items → collectibles WHERE collectibles.user_id = profileUser
 * and tracked_items.user_id != profileUser (exclude self-tracks).
 */
export async function getUserTrackCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_user_track_count', { profile_user_id: userId });

  if (error) {
    log.error('Error fetching track count:', error);
    return 0;
  }

  return typeof data === 'number' ? data : 0;
}

export interface DynamicDetailField {
  id: string;
  label: string;
  section: string;
  level: 'type' | 'category' | 'subcategory';
  fieldType: string;
  displayValue: string | string[];
  priority: number;
}

export interface DynamicDetailSection {
  title: string;
  fields: DynamicDetailField[];
}

export interface CollectibleDynamicDetails {
  fieldCount: number;
  density: 'absent' | 'minimal' | 'standard' | 'rich';
  keyFacts: DynamicDetailField[];
  sections: DynamicDetailSection[];
}

function normalizeSectionName(
  level: 'type' | 'category' | 'subcategory',
  sectionTitle?: string | null
): string {
  if (sectionTitle && sectionTitle.trim()) return sectionTitle.trim();
  if (level === 'type') return 'Authentication & Provenance';
  if (level === 'category') return 'Item Specifications';
  return 'Additional Details';
}

function computeFieldPriority(label: string): number {
  const l = label.toLowerCase();
  if (l.includes('grade') || l.includes('cert') || l.includes('coa') || l.includes('loa')) return 5;
  if (l.includes('autograph') || l.includes('game used') || l.includes('inscrib')) return 4;
  if (l.includes('year') || l.includes('team') || l.includes('player') || l.includes('athlete')) return 3;
  return 1;
}

function formatDynamicValue(raw: unknown): string | string[] | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(raw)) {
    const formatted = raw
      .map((item) => {
        if (item === null || item === undefined) return null;
        if (typeof item === 'string') return item.trim() || null;
        if (typeof item === 'number' || typeof item === 'boolean') return String(item);
        try {
          return JSON.stringify(item);
        } catch {
          return null;
        }
      })
      .filter((v): v is string => !!v);
    return formatted.length > 0 ? formatted : null;
  }
  try {
    const serialized = JSON.stringify(raw);
    return serialized && serialized !== '{}' && serialized !== '[]' ? serialized : null;
  } catch {
    return null;
  }
}

/**
 * Get raw field values for a collectible (for edit form pre-population)
 */
export async function getCollectibleFieldValues(
  collectibleId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('collectible_field_values')
    .select('field_id, value')
    .eq('collectible_id', collectibleId);

  if (error) {
    log.error('Error fetching field values:', error);
    return {};
  }

  const values: Record<string, unknown> = {};
  for (const row of data || []) {
    const raw = row.value;
    if (typeof raw === 'string') {
      try {
        values[row.field_id] = JSON.parse(raw);
      } catch {
        values[row.field_id] = raw;
      }
    } else {
      values[row.field_id] = raw;
    }
  }
  return values;
}

export async function getCollectibleDynamicDetails(
  collectibleId: string
): Promise<CollectibleDynamicDetails> {
  const { data: valueRows, error: valuesError } = await supabase
    .from('collectible_field_values')
    .select('field_id, field_level, field_type, value')
    .eq('collectible_id', collectibleId);

  if (valuesError) {
    log.error('Error fetching dynamic field values:', valuesError);
    throw new Error('Failed to fetch collectible details');
  }

  const fieldIds = Array.from(
    new Set((valueRows || []).map((row) => row.field_id).filter(Boolean))
  );

  let fieldMetaById: Record<string, { label: string; section_title?: string | null }> = {};
  if (fieldIds.length > 0) {
    const { data: fieldMetaRows, error: fieldMetaError } = await supabase
      .from('fields')
      .select('id, field_label, section_title')
      .in('id', fieldIds);

    if (fieldMetaError) {
      log.error('Error fetching field metadata:', fieldMetaError);
    } else {
      fieldMetaById = (fieldMetaRows || []).reduce<Record<string, { label: string; section_title?: string | null }>>((acc, row) => {
        acc[row.id] = { label: row.field_label || row.id, section_title: row.section_title };
        return acc;
      }, {});
    }
  }

  const fields: DynamicDetailField[] = [];

  for (const row of valueRows || []) {
    const level = row.field_level as 'type' | 'category' | 'subcategory' | null;
    if (!level) continue;

    const meta = fieldMetaById[row.field_id] || {
      label: String(row.field_id || 'Field'),
      section_title: null,
    };
    const displayValue = formatDynamicValue(row.value);
    if (!displayValue) continue;

    const section = normalizeSectionName(level, meta.section_title);
    const priority = computeFieldPriority(meta.label);

    fields.push({
      id: String(row.field_id),
      label: meta.label,
      section,
      level,
      fieldType: String(row.field_type || 'text'),
      displayValue,
      priority,
    });
  }

  const sectionsMap = new Map<string, DynamicDetailField[]>();
  for (const field of fields) {
    if (!sectionsMap.has(field.section)) sectionsMap.set(field.section, []);
    sectionsMap.get(field.section)!.push(field);
  }

  const sections: DynamicDetailSection[] = Array.from(sectionsMap.entries()).map(([title, rows]) => ({
    title,
    fields: rows.sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label)),
  }));

  const keyFacts = [...fields]
    .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label))
    .slice(0, 6);

  const fieldCount = fields.length;
  const density: 'absent' | 'minimal' | 'standard' | 'rich' =
    fieldCount === 0 ? 'absent' : fieldCount <= 5 ? 'minimal' : fieldCount <= 10 ? 'standard' : 'rich';

  return {
    fieldCount,
    density,
    keyFacts,
    sections,
  };
}

/**
 * Feed item with collector info for the home feed
 */
export interface FeedCollectible {
  id: string;
  title: string;
  image: string;
  value: number | null;
  status: 'NFST' | 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE';
  category: string;
  createdAt: string;
  collector: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
  };
}

/**
 * Fetch a mixed feed of collectibles for the home screen.
 * Pulls a blend of recent items and actively listed items,
 * shuffled for variety.
 */
export async function getFeedCollectibles(
  options?: { limit?: number; offset?: number; excludeUserId?: string }
): Promise<FeedCollectible[]> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let query = supabase
    .from('collectibles')
    .select(`
      id, title, photos, value, available_for_sale, available_for_trade,
      category, created_at, user_id,
      users!collectibles_user_id_fkey ( id, display_name, username, avatar )
    `)
    .not('photos', 'is', null)
    .not('published_at', 'is', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.excludeUserId) {
    query = query.neq('user_id', options.excludeUserId);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Error fetching feed:', error);
    throw new Error('Failed to fetch feed');
  }

  interface FeedJoinedRow {
    id: string;
    title: string;
    photos: string[] | null;
    value: number | string | null;
    available_for_sale: boolean;
    available_for_trade: boolean;
    category: string | null;
    created_at: string;
    user_id: string;
    users: { id: string; display_name: string | null; username: string | null; avatar: string | null } | null;
  }

  return (data as FeedJoinedRow[] || []).map((item) => {
    const user = item.users || { id: item.user_id, display_name: null, username: null, avatar: null };
    let status: FeedCollectible['status'] = 'NFST';
    if (item.available_for_sale && item.available_for_trade) status = 'SELL_TRADE';
    else if (item.available_for_sale) status = 'FOR_SALE';
    else if (item.available_for_trade) status = 'FOR_TRADE';

    return {
      id: item.id,
      title: item.title,
      image: item.photos?.[0] || '',
      value: item.value ? parseFloat(String(item.value)) : null,
      status,
      category: item.category || 'Collectible',
      createdAt: item.created_at,
      collector: {
        id: item.user_id,
        name: user.display_name || user.username || 'Collector',
        username: user.username || null,
        avatar: user.avatar || null,
      },
    };
  });
}

/**
 * Fetch recent collectibles from users the given user follows.
 * Returns empty array if user follows nobody or no items found.
 */
export async function getNetworkFeed(userId: string, limit = 6): Promise<FeedCollectible[]> {
  const { data: followRows, error: followErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followErr || !followRows?.length) return [];

  const followingIds = followRows.map((r: any) => r.following_id);

  const { data, error } = await supabase
    .from('collectibles')
    .select(`
      id, title, photos, value, available_for_sale, available_for_trade,
      category, created_at, user_id,
      users!collectibles_user_id_fkey ( id, display_name, username, avatar )
    `)
    .in('user_id', followingIds)
    .not('photos', 'is', null)
    .not('published_at', 'is', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    log.error('Error fetching network feed:', error);
    return [];
  }

  return (data ?? []).map((item: any) => {
    const user = item.users ?? { id: item.user_id, display_name: null, username: null, avatar: null };
    let status: FeedCollectible['status'] = 'NFST';
    if (item.available_for_sale && item.available_for_trade) status = 'SELL_TRADE';
    else if (item.available_for_sale) status = 'FOR_SALE';
    else if (item.available_for_trade) status = 'FOR_TRADE';

    return {
      id: item.id,
      title: item.title,
      image: item.photos?.[0] || '',
      value: item.value ? parseFloat(String(item.value)) : null,
      status,
      category: item.category || 'Collectible',
      createdAt: item.created_at,
      collector: {
        id: item.user_id,
        name: user.display_name || user.username || 'Collector',
        username: user.username || null,
        avatar: user.avatar || null,
      },
    };
  });
}

// ── Home Screen Queries ──

function deriveListingStatus(forSale?: boolean | null, forTrade?: boolean | null): ListingStatus {
  if (forSale && forTrade) return 'SELL_TRADE';
  if (forSale) return 'FOR_SALE';
  if (forTrade) return 'FOR_TRADE';
  return 'NFST';
}

export interface RecentCollectible {
  id: string;
  title: string;
  image: string;
  category: string;
  value: number;
  status: ListingStatus;
  createdAt: string;
}

export async function getRecentlyAdded(
  userId: string,
  limit = 5
): Promise<RecentCollectible[]> {
  const { data, error } = await supabase
    .from('collectibles')
    .select('id, title, photos, category, value, available_for_sale, available_for_trade, created_at')
    .eq('user_id', userId)
    .not('photos', 'is', null)
    .not('published_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    log.error('Error fetching recently added:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title || 'Untitled',
    image: row.photos?.[0] ?? '',
    category: row.category || '',
    value: row.value ? parseFloat(String(row.value)) : 0,
    status: deriveListingStatus(row.available_for_sale, row.available_for_trade),
    createdAt: row.created_at,
  }));
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  percentage: number;
}

export async function getCategoryBreakdown(
  userId: string
): Promise<CategoryBreakdownItem[]> {
  const { data, error } = await supabase
    .from('collectibles')
    .select('category')
    .eq('user_id', userId)
    .not('published_at', 'is', null);

  if (error) {
    log.error('Error fetching category breakdown:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const cat = (row as any).category || 'other';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  const total = data.length;
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
    }));

  if (sorted.length <= 5) return sorted;

  const top4 = sorted.slice(0, 4);
  const otherCount = sorted.slice(4).reduce((sum, item) => sum + item.count, 0);
  const otherPercentage = sorted.slice(4).reduce((sum, item) => sum + item.percentage, 0);
  top4.push({ category: 'other', count: otherCount, percentage: otherPercentage });
  return top4;
}

// ---------------------------------------------------------------------------
// Draft collectible lifecycle (async extraction pipeline)
// ---------------------------------------------------------------------------

export interface CreateDraftCollectibleRequest {
  title: string;
  photos: string[];
  hint?: string;
  availableForSale?: boolean;
  availableForTrade?: boolean;
  value?: number | null;
  visibility?: string;
  tags?: string[];
}

/**
 * Create a staging row for the extraction pipeline. Owner preferences are
 * written at insert (mirrors web bulk). The row stays out of collection
 * queries until Catalog commit sets published_at.
 */
export async function createDraftCollectible(
  userId: string,
  data: CreateDraftCollectibleRequest,
): Promise<string> {
  const now = new Date().toISOString();
  const collectibleId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const visibility = data.visibility || 'public';

  const { error } = await supabase
    .from('collectibles')
    .insert({
      id: collectibleId,
      user_id: userId,
      title: data.title,
      description: data.hint || null,
      photos: data.photos,
      category: 'pending',
      privacy: visibility,
      visibility,
      tags: data.tags || [],
      available_for_sale: data.availableForSale ?? false,
      available_for_trade: data.availableForTrade ?? false,
      value: data.value ?? null,
      collectible_type: 'memorabilia',
      extraction_status: 'queued',
      created_at: now,
      updated_at: now,
    });

  if (error) {
    log.error('Error creating draft collectible:', error);
    throw new Error('Failed to create draft collectible');
  }

  log.info('Draft collectible created:', collectibleId);
  return collectibleId;
}

/**
 * Save the extraction job_id on the staging row after enqueue succeeds.
 */
export async function updateExtractionJobId(
  collectibleId: string,
  jobId: string,
): Promise<void> {
  const { error } = await supabase
    .from('collectibles')
    .update({
      extraction_job_id: jobId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', collectibleId);

  if (error) {
    log.error('Error updating extraction_job_id:', error);
    throw new Error('Failed to save extraction job id');
  }
}

/**
 * Commit a staging row into the user's permanent collection. Called when the
 * user taps Catalog on the review screen.
 */
export async function commitDraftCollectible(
  collectibleId: string,
  userId: string,
  edits: {
    title?: string;
    listingTitle?: string;
    listingDescription?: string;
    value?: number;
    availableForSale?: boolean;
    availableForTrade?: boolean;
    visibility?: string;
    tags?: string[];
    showcaseIds?: string[];
    aiMetadata?: Record<string, unknown>;
    traitMetadata?: Record<string, unknown>;
    customFields?: CollectibleCustomField[];
  },
): Promise<void> {
  const now = new Date().toISOString();

  // Client-owned publish: setting published_at IS the publish action. The
  // server-side trigger promotes single-lane rows to 'complete' but never sets
  // published_at, so the row sits in My Queue -> Review until this commit. We
  // set 'complete' too for idempotency in case we commit straight from
  // 'extracted' (e.g. before the trigger-promoted value round-trips to state).
  const updatePayload: Record<string, unknown> = {
    extraction_status: 'complete',
    published_at: now,
    updated_at: now,
  };

  if (edits.title !== undefined) updatePayload.title = edits.title;
  if (edits.listingTitle !== undefined) updatePayload.listing_title = edits.listingTitle;
  if (edits.listingDescription !== undefined) updatePayload.listing_description = edits.listingDescription;
  if (edits.value !== undefined) updatePayload.value = edits.value;
  if (edits.availableForSale !== undefined) updatePayload.available_for_sale = edits.availableForSale;
  if (edits.availableForTrade !== undefined) updatePayload.available_for_trade = edits.availableForTrade;
  if (edits.visibility !== undefined) {
    updatePayload.privacy = edits.visibility;
    updatePayload.visibility = edits.visibility;
  }
  if (edits.tags !== undefined) updatePayload.tags = edits.tags;
  if (edits.aiMetadata !== undefined) updatePayload.ai_metadata = edits.aiMetadata;
  if (edits.traitMetadata !== undefined) updatePayload.trait_metadata = edits.traitMetadata;
  if (edits.customFields !== undefined) updatePayload.custom_fields = edits.customFields;

  const { error } = await supabase
    .from('collectibles')
    .update(updatePayload)
    .eq('id', collectibleId);

  if (error) {
    log.error('Error committing draft collectible:', error);
    throw new Error('Failed to add collectible to collection');
  }

  // Bump user collectibles count
  try {
    const { count } = await supabase
      .from('collectibles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('published_at', 'is', null);

    await supabase
      .from('users')
      .update({ collectibles_count: count || 0 })
      .eq('id', userId);
  } catch (e) {
    log.warn('Could not update collectibles count:', e);
  }

  // Notify followers of new item
  try {
    const { data: row } = await supabase
      .from('collectibles')
      .select('title, photos, privacy')
      .eq('id', collectibleId)
      .single();
    if (row && row.privacy !== 'private') {
      notifyFollowersOfNewItem(userId, collectibleId, row.title, row.photos?.[0] || '');
    }
  } catch {
    // Best-effort
  }

  if (edits.showcaseIds && edits.showcaseIds.length > 0) {
    await linkCollectibleToShowcases(collectibleId, edits.showcaseIds);
  }

  log.info('Draft committed to collection:', collectibleId);
  invalidateProfileHub(userId);
}

// NOTE: Draft cleanup helpers (deleteDraftCollectible, sweepStaleStagingRows)
// were removed in the upload-lane-unification refactor. With server-side
// auto-completion + the published_at gate, every row in `collectibles` is a
// real committed item. Discarding an upload mid-flow is now a regular
// `deleteCollectible` call. Orphaned 'queued'/'processing' rows are caught
// by the `extraction-watchdog` cron (marks them as failed), and abandoned
// failures are hard-deleted by `failed-extractions-purge` after 45 days.

// ---------------------------------------------------------------------------
// Edit collectible (post-catalog)
// ---------------------------------------------------------------------------

export interface CollectibleEditCommitPayload {
  listingTitle?: string;
  listingDescription?: string;
  value?: number;
  availableForSale?: boolean;
  availableForTrade?: boolean;
  visibility?: string;
  tags?: string[];
  showcaseIds?: string[];
  photos?: string[];
  aiMetadata?: Record<string, unknown>;
  traitMetadata?: Record<string, unknown>;
  customFields?: CollectibleCustomField[];
  /** Baseline for provenance diff (S0 for metadata-only; draft engine output for rerun). */
  provenanceBaseline?: {
    aiMetadata: Record<string, unknown>;
    traitMetadata: Record<string, unknown>;
    listingTitle?: string | null;
    listingDescription?: string | null;
  };
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function provenanceFieldKeys(
  prefix: 'ai' | 'trait',
  baseline: Record<string, unknown>,
  final: Record<string, unknown>,
  existing: MetadataProvenance,
): Set<string> {
  const keys = new Set<string>([
    ...Object.keys(baseline),
    ...Object.keys(final),
  ]);
  const provPrefix = `${prefix}.`;
  for (const provKey of Object.keys(existing)) {
    if (provKey.startsWith(provPrefix)) {
      keys.add(provKey.slice(provPrefix.length));
    }
  }
  return keys;
}

/**
 * Reconcile user-edit markers against a baseline (S0 at edit open, or fresh LG output on rerun).
 * Clears stale ai/trait/listing markers when values match the baseline again.
 */
export function computeMetadataProvenance(
  baseline: CollectibleEditCommitPayload['provenanceBaseline'],
  final: {
    aiMetadata: Record<string, unknown>;
    traitMetadata: Record<string, unknown>;
    listingTitle?: string;
    listingDescription?: string;
  },
  existing: MetadataProvenance,
): MetadataProvenance {
  if (!baseline) return existing;

  const now = new Date().toISOString();
  const out: MetadataProvenance = { ...existing };

  for (const key of provenanceFieldKeys('ai', baseline.aiMetadata, final.aiMetadata, existing)) {
    const provKey = `ai.${key}`;
    if (!valuesEqual(final.aiMetadata[key], baseline.aiMetadata[key])) {
      out[provKey] = { source: 'user', at: now };
    } else {
      delete out[provKey];
    }
  }
  for (const key of provenanceFieldKeys(
    'trait',
    baseline.traitMetadata,
    final.traitMetadata,
    existing,
  )) {
    const provKey = `trait.${key}`;
    if (!valuesEqual(final.traitMetadata[key], baseline.traitMetadata[key])) {
      out[provKey] = { source: 'user', at: now };
    } else {
      delete out[provKey];
    }
  }
  if (final.listingTitle !== undefined) {
    if (!valuesEqual(final.listingTitle, baseline.listingTitle ?? '')) {
      out.listing_title = { source: 'user', at: now };
    } else {
      delete out.listing_title;
    }
  }
  if (final.listingDescription !== undefined) {
    if (!valuesEqual(final.listingDescription, baseline.listingDescription ?? '')) {
      out.listing_description = { source: 'user', at: now };
    } else {
      delete out.listing_description;
    }
  }

  return out;
}

export interface LocalShowcaseStub {
  id: string;
  title: string;
}

/**
 * Mint any inline-created showcase stubs (`local-*` ids) before catalog/edit
 * commit. Real ids are returned; unknown local stubs are dropped with a warn.
 */
export async function resolveShowcaseIdsForCommit(
  userId: string,
  showcaseIds: string[],
  localStubs: LocalShowcaseStub[],
): Promise<string[]> {
  const stubById = new Map(localStubs.map((s) => [s.id, s]));
  const resolved: string[] = [];

  for (const id of showcaseIds) {
    if (!id.startsWith('local-')) {
      resolved.push(id);
      continue;
    }
    const stub = stubById.get(id);
    if (!stub?.title.trim()) {
      log.warn('Skipping unresolved local showcase id:', id);
      continue;
    }
    const realId = await createShowcase({
      type: 'manual',
      userId,
      title: stub.title.trim(),
      visibility: 'public',
      collectibleIds: [],
    });
    resolved.push(realId);
  }

  return [...new Set(resolved)];
}

async function linkCollectibleToShowcases(
  collectibleId: string,
  showcaseIds: string[],
): Promise<void> {
  const ids = showcaseIds.filter((id) => !id.startsWith('local-'));
  if (ids.length === 0) return;

  for (const showcaseId of ids) {
    const { error } = await supabase.from('showcase_collectibles').insert({
      id: generateId(),
      showcase_id: showcaseId,
      collectible_id: collectibleId,
      display_order: 0,
    });
    if (error) {
      if (error.code === '23505') continue;
      log.error('Failed to add to showcase:', showcaseId, error.message, error.code);
      throw new Error('Failed to add collectible to showcase');
    }
  }
}

export async function getCollectibleShowcaseIds(collectibleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('showcase_collectibles')
    .select('showcase_id')
    .eq('collectible_id', collectibleId);

  if (error) {
    log.warn('Error fetching showcase memberships:', error);
    return [];
  }
  return (data ?? []).map((r) => r.showcase_id as string);
}

async function syncShowcaseMembership(
  collectibleId: string,
  showcaseIds: string[],
): Promise<void> {
  const target = new Set(showcaseIds.filter((id) => !id.startsWith('local-')));
  const { data: existing, error: fetchError } = await supabase
    .from('showcase_collectibles')
    .select('showcase_id')
    .eq('collectible_id', collectibleId);

  if (fetchError) {
    log.error('Failed to load showcase memberships:', fetchError.message);
    throw new Error('Failed to update showcase assignments');
  }

  const existingIds = new Set((existing ?? []).map((r) => r.showcase_id as string));

  for (const showcaseId of existingIds) {
    if (!target.has(showcaseId)) {
      const { error } = await supabase
        .from('showcase_collectibles')
        .delete()
        .eq('collectible_id', collectibleId)
        .eq('showcase_id', showcaseId);
      if (error) {
        log.error('Failed to remove from showcase:', showcaseId, error.message);
        throw new Error('Failed to update showcase assignments');
      }
    }
  }

  const toAdd = [...target].filter((id) => !existingIds.has(id));
  if (toAdd.length > 0) {
    await linkCollectibleToShowcases(collectibleId, toAdd);
  }
}

async function applyEditCollectibleSideEffects(
  collectibleId: string,
  userId: string,
  prevRow: {
    available_for_sale: boolean;
    available_for_trade: boolean;
    value: number | null;
    title: string;
    photos: string[];
  },
  updatePayload: Record<string, unknown>,
): Promise<void> {
  const { data: collectible, error } = await supabase
    .from('collectibles')
    .update(updatePayload)
    .eq('id', collectibleId)
    .select('available_for_sale, available_for_trade, value, title, photos, user_id')
    .single();

  if (error || !collectible) {
    log.error('Error updating collectible:', error);
    throw new Error('Failed to update collectible');
  }

  if (
    updatePayload.available_for_sale !== undefined ||
    updatePayload.available_for_trade !== undefined
  ) {
    const sameStatus =
      collectible.available_for_sale === prevRow.available_for_sale &&
      collectible.available_for_trade === prevRow.available_for_trade;
    if (!sameStatus) {
      notifyTrackersOfStatusChange(
        collectibleId,
        userId,
        collectible.title,
        collectible.photos?.[0] || '',
        collectible.available_for_sale,
        collectible.available_for_trade,
        {
          for_sale: prevRow.available_for_sale,
          for_trade: prevRow.available_for_trade,
        },
      );
    }
  }

  if (updatePayload.value !== undefined) {
    const newValue =
      collectible.value !== null && collectible.value !== undefined
        ? Number(collectible.value)
        : null;
    const prevValue =
      prevRow.value !== null && prevRow.value !== undefined ? Number(prevRow.value) : null;
    if (newValue !== prevValue) {
      notifyTrackersOfValueChange(
        collectibleId,
        userId,
        collectible.title,
        collectible.photos?.[0] || '',
        prevValue,
        newValue,
      );
    }
  }
}

/**
 * Staging draft for re-extraction (Looking Glass rerun on edited photos).
 */
export async function createReExtractionDraft(
  userId: string,
  data: CreateDraftCollectibleRequest & { originalId: string },
): Promise<string> {
  const now = new Date().toISOString();
  const collectibleId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const visibility = data.visibility || 'public';

  const { error } = await supabase.from('collectibles').insert({
    id: collectibleId,
    user_id: userId,
    title: data.title,
    description: data.hint || null,
    photos: data.photos,
    category: 'pending',
    privacy: visibility,
    visibility,
    tags: data.tags || [],
    available_for_sale: data.availableForSale ?? false,
    available_for_trade: data.availableForTrade ?? false,
    value: data.value ?? null,
    collectible_type: 'memorabilia',
    extraction_status: 'queued',
    reextraction_of: data.originalId,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    log.error('Error creating re-extraction draft:', error);
    throw new Error('Failed to start re-extraction');
  }

  return collectibleId;
}

/**
 * Metadata-only edit path (no photo add/remove). Preserves published_at.
 */
export async function commitMetadataUpdate(
  originalId: string,
  userId: string,
  edits: CollectibleEditCommitPayload,
  existingProvenance: MetadataProvenance,
): Promise<void> {
  const { data: prevRow, error: fetchErr } = await supabase
    .from('collectibles')
    .select('available_for_sale, available_for_trade, value, title, photos, published_at')
    .eq('id', originalId)
    .single();

  if (fetchErr || !prevRow) {
    throw new Error('Failed to load collectible');
  }

  const now = new Date().toISOString();
  const listingTitle = edits.listingTitle?.trim();
  const provenance = computeMetadataProvenance(
    edits.provenanceBaseline,
    {
      aiMetadata: edits.aiMetadata ?? {},
      traitMetadata: edits.traitMetadata ?? {},
      listingTitle,
      listingDescription: edits.listingDescription,
    },
    existingProvenance,
  );

  const updatePayload: Record<string, unknown> = { updated_at: now };

  if (listingTitle !== undefined) {
    updatePayload.listing_title = listingTitle;
    updatePayload.title = listingTitle;
  }
  if (edits.listingDescription !== undefined) {
    updatePayload.listing_description = edits.listingDescription;
  }
  if (edits.value !== undefined) updatePayload.value = edits.value;
  if (edits.availableForSale !== undefined) updatePayload.available_for_sale = edits.availableForSale;
  if (edits.availableForTrade !== undefined) updatePayload.available_for_trade = edits.availableForTrade;
  if (edits.visibility !== undefined) {
    updatePayload.privacy = edits.visibility;
    updatePayload.visibility = edits.visibility;
  }
  if (edits.tags !== undefined) updatePayload.tags = edits.tags;
  if (edits.photos !== undefined) updatePayload.photos = edits.photos;
  if (edits.aiMetadata !== undefined) updatePayload.ai_metadata = edits.aiMetadata;
  if (edits.traitMetadata !== undefined) updatePayload.trait_metadata = edits.traitMetadata;
  if (edits.customFields !== undefined) updatePayload.custom_fields = edits.customFields;
  updatePayload.metadata_provenance = provenance;

  await applyEditCollectibleSideEffects(originalId, userId, prevRow, updatePayload);

  if (edits.showcaseIds) {
    await syncShowcaseMembership(originalId, edits.showcaseIds);
  }

  log.info('Metadata update committed:', originalId);
  invalidateProfileHub(userId);
}

/**
 * Re-extraction edit path: merge staging draft engine output onto the original row.
 */
export async function commitReExtraction(
  originalId: string,
  draftId: string,
  userId: string,
  edits: CollectibleEditCommitPayload,
  existingProvenance: MetadataProvenance,
): Promise<void> {
  const { data: draft, error: draftErr } = await supabase
    .from('collectibles')
    .select(
      'ai_metadata, trait_metadata, filter_traits, field_schema, classification, traits, confidence, schema_mode, verification_url, autograph_assessment, photos, category, subcategory, collectible_type',
    )
    .eq('id', draftId)
    .single();

  if (draftErr || !draft) {
    throw new Error('Failed to load re-extraction results');
  }

  const { data: prevRow, error: fetchErr } = await supabase
    .from('collectibles')
    .select('available_for_sale, available_for_trade, value, title, photos, published_at')
    .eq('id', originalId)
    .single();

  if (fetchErr || !prevRow) {
    throw new Error('Failed to load collectible');
  }

  const now = new Date().toISOString();
  const listingTitle = edits.listingTitle?.trim();
  const finalAi = (edits.aiMetadata ?? draft.ai_metadata ?? {}) as Record<string, unknown>;
  const finalTrait = (edits.traitMetadata ?? draft.trait_metadata ?? {}) as Record<string, unknown>;

  const provenanceBaseline =
    edits.provenanceBaseline ?? {
      aiMetadata: (draft.ai_metadata as Record<string, unknown>) ?? {},
      traitMetadata: (draft.trait_metadata as Record<string, unknown>) ?? {},
      listingTitle: null,
      listingDescription: null,
    };

  const provenance = computeMetadataProvenance(
    provenanceBaseline,
    {
      aiMetadata: finalAi,
      traitMetadata: finalTrait,
      listingTitle,
      listingDescription: edits.listingDescription,
    },
    existingProvenance,
  );

  const updatePayload: Record<string, unknown> = {
    updated_at: now,
    extraction_status: 'complete',
    ai_metadata: finalAi,
    trait_metadata: finalTrait,
    filter_traits: draft.filter_traits,
    field_schema: draft.field_schema,
    classification: draft.classification,
    traits: draft.traits,
    confidence: draft.confidence,
    schema_mode: draft.schema_mode,
    verification_url: draft.verification_url,
    autograph_assessment: draft.autograph_assessment,
    category: draft.category,
    subcategory: draft.subcategory,
    collectible_type: draft.collectible_type,
    photos: edits.photos ?? draft.photos,
    metadata_provenance: provenance,
  };

  if (listingTitle !== undefined) {
    updatePayload.listing_title = listingTitle;
    updatePayload.title = listingTitle;
  }
  if (edits.listingDescription !== undefined) {
    updatePayload.listing_description = edits.listingDescription;
  }
  if (edits.value !== undefined) updatePayload.value = edits.value;
  if (edits.availableForSale !== undefined) updatePayload.available_for_sale = edits.availableForSale;
  if (edits.availableForTrade !== undefined) updatePayload.available_for_trade = edits.availableForTrade;
  if (edits.visibility !== undefined) {
    updatePayload.privacy = edits.visibility;
    updatePayload.visibility = edits.visibility;
  }
  if (edits.tags !== undefined) updatePayload.tags = edits.tags;
  if (edits.customFields !== undefined) updatePayload.custom_fields = edits.customFields;

  await applyEditCollectibleSideEffects(originalId, userId, prevRow, updatePayload);

  if (edits.showcaseIds) {
    await syncShowcaseMembership(originalId, edits.showcaseIds);
  }

  try {
    await deleteCollectible(draftId, userId);
  } catch (e) {
    log.warn('Failed to delete re-extraction staging draft:', draftId, e);
  }

  log.info('Re-extraction committed:', originalId, 'from draft', draftId);
  invalidateProfileHub(userId);
}
