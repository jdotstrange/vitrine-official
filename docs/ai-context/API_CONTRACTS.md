# API Contracts Context

Last updated: 2026-05-11
Last verified: 2026-05-11

## API Shape
The app primarily uses Supabase. Most modules live in the shared `@vitrine/api` package as factory functions (`createXApi(supabase, logger, env)`). The native app composes them via `bindToSingleton()` and re-exports flat functions through `apps/native/lib/api/*.ts` shim files for backward compatibility. The web app calls `getServerApi()` (defined in `apps/web/lib/api.ts`) per request to obtain a `VitrineApi` instance bound to the web Supabase client. Edge Functions handle server-side operations that need privileged access or scheduled execution.

## Shared API Modules (`@vitrine/api`)
Factory location: `packages/api/src/modules/<name>.ts`. Each exports `createXApi(...)` returning `XApi`. The mega-factory `createApi()` composes them all and `bindToSingleton()` registers the instance for flat exports.

- `blocked` — `createBlockedApi(supabase)`: block/unblock helpers.
- `comps` — `createCompsApi(supabase, logger)`: comps queries + `TrackedCompItem` mapping + `getTrackedComps()` wrapper.
- `fields` — `createFieldsApi(supabase)`: dynamic field/option resolution.
- `search` — `createSearchApi(supabase)`: cross-entity search.
- `activity` — `createActivityApi(supabase, logger)`: inbox/signals/journal/all activity feeds.
- `notifications` — `createNotificationsApi(supabase, logger, env)`: Stream + push notification dispatch and per-user preference storage. Requires `env.supabaseUrl` + `env.supabaseAnonKey`.
- `follows` — `createFollowsApi(supabase, logger, notifications)`: follow counts, relationships, mutual check; emits new-follower notifications via injected `notifications`.
- `network` — `createNetworkApi(supabase, logger)`: Network V3 — suggested collectors, mutual follows with privacy.
- `categories` — `createCategoriesApi(supabase, logger)`: category tree fetching/management.
- `extraction` — `createExtractionApi(supabase, logger, env)`: extraction-pipeline wrappers + Realtime collectible-row subscriptions. Requires `env.supabaseUrl` + `env.supabaseAnonKey`.
- `explore` — `createExploreApi(supabase, logger)`: Discover lens RPCs + market browse/search (`browseMarket`, `searchCollectiblesMarket`, `searchShowcasesMarket`, `searchCollectorsMarket`).
- `showcases` — `createShowcasesApi(supabase, logger, notifications)`: showcase CRUD (manual | managed), `updateShowcaseRules`, detail/preview queries. Re-exports the pure `previewRuleMatches()` and inlines `getTrackCounts()` so it stays portable.
- `managed-rules` — pure TypeScript module (no factory). `validateRules`, `itemMatchesManagedRules`, `evaluateManagedRules`, `evalRowFromCollectionItem`, condition formatting. Mirrored on the Edge Function side at `supabase/functions/_shared/managed-eval.ts`.

## Native-Only API Modules (`apps/native/lib/api/`)
These remain in the native app because they depend on Expo / React Native APIs:
- `auth.ts`: public user profile, auth-user row linking, profile completion, featured showcase/crown jewel assignment.
- `collectibles.ts`: collectible CRUD/query/mapping (uses `expo-image-manipulator`).
- `tracking.ts`: collectible tracking (`getTrackedCollectionItems`, `deriveTrackedOverviewStats`).
- `views.ts`: profile/collectible view recording (uses `expo-crypto` + AsyncStorage for dedup).
- `market.ts`: market data shapes coupled to native `CollectionItem`.
- `trading-cards.ts`, `client.ts`, `config.ts`: thin wrappers around the native HTTP client + `getAuthToken`/`buildUrl`.
- `messaging.ts`: Stream Chat integration.
- `index.ts`: re-exports `@vitrine/api` plus the native-only modules.

## External APIs / Services
- Supabase Auth/PostgREST/RPC/Edge Functions/Vault/pg_cron.
- Stream Chat.
- Stream Activity Feeds.
- Expo services for app runtime/build tooling.

## Edge Functions
- `supabase/functions/trading-cards/index.ts`: trading card operations.
- `supabase/functions/generate-variants/index.ts`: image variant generation.
- `supabase/functions/migrate-images/index.ts`: image migration.
- `supabase/functions/stream-notify/index.ts`: activity notification dispatch.
- `supabase/functions/comp-alert-worker/index.ts`: comp alert cron worker (daily, >75% match threshold, max 5/day).
- `supabase/functions/view-rollup-worker/index.ts`: anonymous view rollup cron worker.
- `supabase/functions/view-milestone-checker/index.ts`: view milestone notification checker.
- `supabase/functions/network-suggested-cache-purge/index.ts`: suggested collectors cache invalidation on follow/unfollow.
- `supabase/functions/managed-evaluate/index.ts`: immediate managed showcase rule evaluation on rule save.
- `supabase/functions/managed-sweep-worker/index.ts`: cron-driven managed showcase re-evaluation (`?mode=incremental` every 5min, `?mode=full` nightly).
- `supabase/functions/_shared/managed-eval.ts`: shared evaluator module for Edge Functions (mirrors `lib/api/managed-rules.ts`).

## RPC Functions
- `suggest_collectors_for(p_user_id)`: 5-signal weighted suggested collectors algorithm with server-side cache.
- `record_view(p_viewer_id, p_target_type, p_target_id)`: anonymous view recording with dedup.
- `get_tracked_comps(p_user_id, p_limit)`: V2 blended comparable sales across a user's full tracked portfolio. Quality-gated: Gate 1 excludes sources with < 2 meaningful fields; Gate 2 requires >= 3 matched signals AND >= 50% score fraction. Deduplicates candidates across sources, keeping best score + source attribution. Tunable constants: `v_min_source_fields`, `v_min_matched_signals`, `v_min_score_fraction`.
- `browse_market_v2(p_limit, p_offset, p_sort, p_exclude_user_id, p_chip, p_search, p_search_person, p_search_team)`: paginated market browse with chip filtering, sort options, and person/team `listing_title ILIKE` search. Returns collectible rows with owner info and view counts. `SECURITY INVOKER` — requires `GRANT SELECT` on `view_counters` and `collectibles_unified`.
- `search_collectors_tiered(p_query, p_limit)`: tiered collector search — priority 1: display name match, priority 2: username match, priority 3: collection content match (listing_title). Returns collector rows with item count and tracking overlap.
- `search_showcases_tiered(p_query, p_limit)`: tiered showcase search — priority 1: title match, priority 2: collectible content match. Returns showcase rows with computed `item_count` (via CTE from `showcase_collectibles`) and thumbnail array.
- Various comps-related RPCs in `supabase/migrations/20260220*.sql`.

## pg_cron Jobs
- `comp-alert-daily`: daily comp alert scan.
- `view-rollup-hourly`: hourly anonymous view rollup.
- `view-milestone-checker`: view milestone notification check.
- `managed-sweep-incremental`: every 5 minutes, watermark-filtered managed showcase re-eval.
- `managed-sweep-nightly`: 03:15 UTC full drift-correction sweep.
- `network-suggested-cache-purge`: scheduled cache cleanup.

## Inputs / Outputs
Domain types live in `@vitrine/types` (e.g., `User`, `Collectible`, `ShowcaseDetail`, `MarketItem`, `ManagedRules`, `JournalEntry`). API modules in `@vitrine/api` import these. The native-only modules in `apps/native/lib/api/*` should also import from `@vitrine/types` rather than redefining shapes. Key discriminated unions:
- `CreateShowcaseParams = CreateShowcaseManualParams | CreateShowcaseManagedParams`
- `ManagedRules = { match: 'all' | 'any'; conditions: Condition[] }`
- `TrackedCompItem` extends `CompItem` with `sourceCollectibleId` and `sourceTitle`
- `TrackingChipCategory = 'STATUS' | 'VALUE' | 'COMPS'` (used by activity verb filtering)
- `OwnerInfo = { displayName, username, avatar }` (returned by `getTrackedCollectionItems` ownerMap)

## Errors
Existing API modules often log and throw or return nullable results. Preserve user-safe errors and avoid exposing raw backend errors in UI.

## Auth
- Client auth: Supabase JWT via `getAccessToken()` in `lib/supabase.ts`.
- Edge Function auth (client-invoked): `SUPABASE_SERVICE_ROLE_KEY` via Authorization header.
- Edge Function auth (cron-invoked): `CRON_SECRET` from Vault secrets via Authorization header.

## Contract Risks
- Some helpers map snake_case DB rows to camelCase app types. Preserve mappings carefully.
- Do not silently change API return shapes without updating consumers.
- Treat Edge Function env variables and secrets as non-printable.
- `managed-rules.ts` and `_shared/managed-eval.ts` must stay in lockstep — same operators, same semantics.
- `getUserShowcases` and `getShowcaseById` now accept optional `requestingUserId` for visitor filtering — ensure callers pass it where visibility matters.
- Market RPCs use `SECURITY INVOKER` — the `GRANT SELECT` migration (`20260505050000_grant_market_read_access.sql`) must be applied or they'll return permission errors.
