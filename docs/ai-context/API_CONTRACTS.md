# API Contracts Context

Last updated: 2026-05-05
Last verified: 2026-05-05

## API Shape
The app primarily uses Supabase directly from React Native through `lib/api/*` modules and `lib/supabase.ts`. Edge Functions handle server-side operations that need privileged access or scheduled execution.

## Core Modules
- `lib/api/auth.ts`: public user profile, auth-user row linking, profile completion, featured showcase/crown jewel assignment.
- `lib/api/collectibles.ts`: collectible CRUD/query/mapping.
- `lib/api/showcases.ts`: showcase CRUD (discriminated manual|managed), `updateShowcaseRules`, `previewRuleMatches`, detail/preview queries with visitor visibility filtering.
- `lib/api/managed-rules.ts`: pure TypeScript rule evaluator — `validateRules`, `itemMatchesManagedRules`, `evaluateManagedRules`, condition formatting, row hydration. Shared source of truth for rule semantics.
- `lib/api/follows.ts`: follow counts, relationships, mutual check.
- `lib/api/comps.ts`: comps-related queries/RPCs. Extended with `TrackedCompItem` interface (adds `sourceCollectibleId`, `sourceTitle`), `mapTrackedRow()`, and `getTrackedComps()` client wrapper for blended tracked comps.
- `lib/api/activity.ts`: activity feed queries (inbox, signals, journal, all).
- `lib/api/views.ts`: profile/collectible view recording and aggregation.
- `lib/api/notifications.ts`: notification delivery via Stream and push.
- `lib/api/tracking.ts`: collectible tracking (track/untrack/counts/IDs), `getTrackedCollectionItems()` (full AI-enriched join returning CollectionItem[] + ownerMap), `deriveTrackedOverviewStats()` (client-side metric derivation from items + ownerMap).
- `lib/api/search.ts`: search queries.
- `lib/api/explore.ts`: explore/discovery feed. Extended with market browse/search wrappers: `browseMarket()` (paginated browse via `browse_market_v2` RPC), `searchCollectiblesMarket()`, `searchShowcasesMarket()` (via `search_showcases_tiered` RPC), `searchCollectorsMarket()` (via `search_collectors_tiered` RPC).
- `lib/api/index.ts`: barrel export for all public API types and functions.

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
Use TypeScript interfaces in each `lib/api/*` module as the local contract source. Do not invent response shapes when interfaces already exist. Key discriminated unions:
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
