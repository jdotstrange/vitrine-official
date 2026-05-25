/**
 * Centralized visibility helpers for `collectibles` queries.
 *
 * These encode the four canonical query shapes that emerged from the
 * Upload Lane Unification work. Every display surface MUST go through
 * one of these helpers (or pull in the same WHERE-clause filter shape)
 * so that we don't drift back to ad-hoc `extraction_status = 'complete'`
 * filters that miss the `published_at` gate.
 *
 * See docs/UPLOAD_LANE_UNIFICATION_PLAN.md for the design.
 *
 * Each helper builds a chainable `PostgrestFilterBuilder` that the caller
 * can extend with extra `.eq()`, `.order()`, `.range()`, etc. The default
 * `select` is `'*'`; pass a column list to narrow the projection.
 *
 *  ┌──────────────────────────┬─────────────────────────────────────────┐
 *  │ Helper                   │ Filters applied                         │
 *  ├──────────────────────────┼─────────────────────────────────────────┤
 *  │ publishedCollectibles    │ user_id, published_at NOT NULL          │
 *  │ publicCollectibles       │ user_id, published_at NOT NULL,         │
 *  │                          │ privacy = 'public'                      │
 *  │ queueReviewItems         │ user_id, extraction_status = 'complete',│
 *  │                          │ published_at IS NULL                    │
 *  │ queueErrorItems          │ user_id, extraction_status = 'failed'   │
 *  └──────────────────────────┴─────────────────────────────────────────┘
 *
 * Notes on `publishedCollectibles` (the most-used helper):
 *   • `extraction_status = 'complete'` is implied by `published_at IS NOT NULL`
 *     thanks to the `complete_and_publish` trigger and the migration backfill,
 *     so we don't need to filter on it explicitly. This also keeps the helper
 *     well-aligned with the `idx_collectibles_published` partial index.
 *   • This is the helper the OWNER's collection uses — privacy isn't filtered
 *     here because the owner sees their own private items too. For "others
 *     viewing" surfaces, use `publicCollectibles`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Owner's collection: items the user can see in their own collection.
 * Filters: `user_id = userId` AND `published_at IS NOT NULL`.
 */
export function publishedCollectibles(
  supabase: SupabaseClient,
  userId: string,
  select: string = '*',
) {
  return supabase
    .from('collectibles')
    .select(select)
    .eq('user_id', userId)
    .not('published_at', 'is', null);
}

/**
 * Public-facing collection: items others can see on a user's profile,
 * shared links, browse/explore, search, etc.
 * Filters: `user_id = userId` AND `published_at IS NOT NULL` AND
 * `privacy = 'public'`.
 *
 * Note: the legacy column name is `privacy`, not `visibility`.
 */
export function publicCollectibles(
  supabase: SupabaseClient,
  userId: string,
  select: string = '*',
) {
  return publishedCollectibles(supabase, userId, select).eq('privacy', 'public');
}

/**
 * My Queue → Review tab. Items whose extraction succeeded but whose batch
 * was uploaded with the "Hold for review before publishing" toggle on, so
 * `published_at` is still NULL. Owner-only by definition.
 */
export function queueReviewItems(
  supabase: SupabaseClient,
  userId: string,
  select: string = '*',
) {
  return supabase
    .from('collectibles')
    .select(select)
    .eq('user_id', userId)
    .eq('extraction_status', 'complete')
    .is('published_at', null);
}

/**
 * My Queue → Errors tab. Items whose extraction failed and have not yet
 * been retried-to-success or removed. Owner-only by definition.
 */
export function queueErrorItems(
  supabase: SupabaseClient,
  userId: string,
  select: string = '*',
) {
  return supabase
    .from('collectibles')
    .select(select)
    .eq('user_id', userId)
    .eq('extraction_status', 'failed');
}

/**
 * Decorator: apply the published-visibility filter to an existing
 * `PostgrestFilterBuilder`. Use this when a query already has a complex
 * `select(...)` shape (e.g. with joins) and you can't easily restructure
 * it to start from one of the helpers above.
 *
 *   const q = supabase.from('tracked_items').select('*, collectible:collectibles!inner(...)').eq(...)
 *   applyPublishedFilter(q, { table: 'collectible' })  // filters joined collectible
 */
export function applyPublishedFilter<Q extends { not: (col: string, op: string, val: unknown) => Q }>(
  query: Q,
  options?: { table?: string },
): Q {
  const col = options?.table ? `${options.table}.published_at` : 'published_at';
  return query.not(col, 'is', null);
}
