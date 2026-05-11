# Data Model Context

Last updated: 2026-05-05

## Entities
- **Users**: public profile rows linked to Supabase Auth users.
- **Collectibles**: user-owned collectible records with photos, value, listing status flags, category/type, and AI-enriched metadata.
- **Showcases**: user-created (manual) or rule-based (managed) collections of collectibles.
- **Showcase collectibles**: junction/order records between showcases and collectibles.
- **Follows**: follower/following relationships.
- **Activity / Notifications**: Stream-backed and API-backed activity feeds.
- **Views**: anonymous profile/collectible view tracking with rollup aggregation.
- **Suggested collectors cache**: server-side cache for the suggested-collectors algorithm.
- **Notification preferences**: per-user notification category opt-in/out settings.
- **Messages/feeds**: Stream Chat-backed messaging.

## Relationships
- Supabase Auth user maps to public `users` row through `supabase_auth_id`.
- Collectibles belong to users (`user_id`).
- Showcases belong to users (`user_id`).
- Showcases contain collectibles through `showcase_collectibles` junction table.
- Follows relate users to users (`follower_id` → `following_id`).
- Users may point at one featured showcase through `featured_showcase_id`.
- Users may point at one Crown Jewel collectible through `crown_jewel_collectible_id`.
- Managed showcases store rules inline (`rules` jsonb, `rules_match` text).
- User collectible change watermark (`users.collectibles_last_changed_at`) drives incremental managed showcase re-evaluation.

## Auth / Permissions
Auth is Supabase OTP-based (email/phone). RLS assumptions should be verified in migrations before changing queries or policies.

## Key Collectible Fields
- `id`, `user_id`, `collectible_type` (memorabilia, trading_card, comics, etc.)
- `listing_title`, `listing_description`, `title`
- `classification`, `category`, `subcategory`
- `traits` (text[]), `tags` (text[])
- `confidence`, `ai_metadata`, `field_schema`, `trait_metadata`
- `available_for_sale`, `available_for_trade` (booleans)
- `value` (numeric)
- `photos` (text[])
- `created_at`, `updated_at`

## Showcase Fields
- `id`, `user_id`, `title`, `description`, `type` ('manual' | 'managed')
- `visibility` ('public' | 'private')
- `rules` (jsonb — array of `{field, op, value}` conditions, NULL for manual)
- `rules_match` ('all' | 'any', NULL for manual)
- `rules_last_evaluated_at` (timestamptz — watermark for incremental sweep)
- `rules_last_evaluation_status` ('ok', 'error:<reason>', etc.)
- `created_at`, `updated_at`

## User Profile Fields
- `users.featured_showcase_id`: optional manual Featured Showcase selection.
- `users.crown_jewel_collectible_id`: optional manual Crown Jewel selection.
- `users.collectibles_last_changed_at`: timestamp bumped by AFTER trigger on collectibles. Used by managed showcase incremental sweep as a "needs re-eval?" signal.

## Key Tables Added Since V3
- `suggested_collectors_cache`: server-side cache for suggested collectors (user_id, candidate_id, match_score, cached_at, expires_at).
- `notification_preferences`: per-user notification category settings (user_id, category, enabled).
- `views` / `view_rollups`: anonymous view tracking and aggregation.

## Triggers
- `trg_touch_collectibles_changed` on `collectibles`: AFTER INSERT/UPDATE/DELETE bumps `users.collectibles_last_changed_at` for the affected user. Drives managed showcase incremental sweep.

## Indexes
- `idx_showcases_user_id_managed`: partial index on `showcases(user_id)` WHERE `type = 'managed'`.
- `idx_showcases_rules_last_evaluated_at`: partial index for sweep watermark queries.
- `idx_users_collectibles_last_changed_at`: partial index WHERE NOT NULL.

## Collector Profile Derived Data
- Crown Jewel fallback: manual user field → highest `value` → highest tracking count → newest `created_at`.
- Featured Showcase fallback: manual user field → highest value → most items → newest/title tie-breaker.
- Collection filter facets derive from loaded collection rows: `status`, `traits`, `collectible_type`, value, `ai_metadata`, `trait_metadata`.
- Suggested collectors: 5-signal weighted algorithm computed on-demand, cached 24-48hrs.

## Constraints
Use migrations in `supabase/migrations/` as source of truth. Key constraints:
- `showcases_rules_match_check`: rules_match IN ('all', 'any') or NULL.
- Foreign keys on junction tables (showcase_collectibles, follows, etc.).

## Migration Rules
- Read current migrations before adding or changing schema.
- Be careful with RLS and auth-linked user data.
- Do not run production migrations from automation without explicit approval.
- Document downstream app effects in `DECISION_LOG.md` or `OPEN_THREADS.md`.

## Known Data Risks
- Migrated legacy collectibles may have less reliable AI-enriched signals than future uploads.
- `collectible_type` values are canonical (`memorabilia`, `trading_card`) but some legacy rows may have different values.
- Polymorphic metadata: `category`, `subcategory`, `classification` vary by `schema_mode` (e.g., trading cards use sport/year/brand, memorabilia uses different categories). The managed showcase rule grammar deliberately avoids these fields, using `listing_title contains` as a proxy.
- `tags` is a free-form text array — no controlled vocabulary. Managed showcase tag rules do case-insensitive matching.
