# Open Threads

Last updated: 2026-05-12
Last verified: 2026-05-12

## Product / Design Threads

### Marketing site copy iteration
The V3 marketing site shipped with copy ported verbatim from the `vitrine-2026` HTML mockup. Per the user, the structure is right but the narrative needs another iteration — outside the hero, most copy is "filler and not fully realized." The Pro section (pricing) in particular needs to land with intent. Iteration is a separate pass on top of the now-stable structure.

### Marketing site real assets
The 8 image URLs in `apps/web/lib/marketing/photos.ts` are Unsplash placeholders. Real brand assets to be provided. Swap is a one-file edit. Same applies to the 3 collector avatars in `CommunitySection`, the 3 quote portraits in `PressSection`, and the 8 spatial cards in `ExploreSection`. The roadmap dates in `LiveComingSection` / `ProSection` are also stale (months-old mockup) and should be refreshed during the copy pass.

### Marketing site shadcn `ui/*` cleanup
`apps/web/components/ui/*` (shadcn) currently has zero importers but was deliberately retained for the eventual authenticated web app. If a year passes without web auth shipping, prune to remove the dead weight.

### Showcase curated sort + drag-to-reorder (v2)
The COLLECTION lens on showcase detail defaults to `recent` sort. The right long-term owner experience is curated/manual ordering with drag-to-reorder. Requires a `position` column on `showcase_collectibles`, write-path support, and a sort handle on each card primitive.

### Crown Jewel assignment UI
Crown Jewel resolves from `user.crownJewelCollectibleId` with fallback logic (highest value → most tracked → newest). The collectible detail screen doesn't yet have a UI to assign/unassign Crown Jewel status.

### Trending searches for Market Surface
Market Surface currently only has Recent Searches (device-local via AsyncStorage). Trending searches (top queries from last 7 days) would require a `search_queries` table to log search inputs, an aggregation query to surface the top 5-7, and a UI section in the search drawer. Recent searches pull from last 24 hours; trending is a curated version of the last 7 days.

### Market search at scale
Current market RPCs use `listing_title ILIKE '%term%'` for person/team filtering and search. At scale, this should be replaced with full-text search indexes (`tsvector`/`tsquery`) or a dedicated search service. The `browse_market_v2` RPC also does offset-based pagination which degrades at high offsets — cursor-based pagination would be better long-term.

### Marketplace / Commerce surfaces
The listing status system (FOR_SALE, FOR_TRADE, SELL_TRADE, NFST) is fully built with pricing, commerce pills, and value gating. Actual buy/trade/deal flows are not yet implemented.

### FramedHero lightbox V2 — pinch-to-zoom + double-tap
The current lightbox (V1) supports paginated swipe + counter + X-to-close on a fullscreen Modal. Collectors generally expect pinch-to-zoom on photo viewers (Instagram, Apple Photos, Twitter). `react-native-gesture-handler` is already installed; would need `PinchGestureHandler` + `Animated` transform composition + double-tap-to-zoom + reset-on-modal-close. Defer until first user complaint or until inline-listing photos become richer.

### InlineEditableField reuse beyond upload Review
The new `InlineEditableField` pattern (always-on TextInput + always-visible Pencil + focus chrome + char counter) is currently inlined inside `components/upload-entry.tsx`. Natural reuse candidates: collectible detail screen (edit listing title/description in place), profile bio editing, showcase title/description editing. Worth extracting to `components/vault/inline-editable-field.tsx` once a second consumer materializes — premature extraction risks an over-fit API.

### react-native-keyboard-controller migration
Captured in detail in `future-ideas.md`. The `KeyboardAvoidingView` + ScrollView pattern works well for current surfaces (Scan, Review, RapidFireEdit) but doesn't auto-scroll to focused inputs across nested scrolls and lacks gesture-driven keyboard dismissal. The keyboard-controller library is the modern industry standard with an Expo config plugin. **Deferred until we leave Expo Go** — requires a dev-client rebuild.

### Managed showcase manual ↔ managed conversion
V1 decision: conversion between manual and managed showcase types is immutable. Future versions may allow conversion paths.

### Managed showcase rule grammar — remaining candidates
V2 shipped `franchise`, `item_type`, `year`, `maker`. Remaining deferred candidates: `category`/`subcategory` (polymorphic inconsistency unresolved), `grade`/`grading_company` (not yet in `filter_traits`), custom metadata fields from AI schema.

## Data / Backend Threads

### Edge Function deployment
New Edge Functions created during the Managed Showcase V1 build need deployment via `supabase functions deploy`:
- `managed-evaluate`
- `managed-sweep-worker`
- Other recently created functions should be verified.

### Server-side collection filtering/sorting
Current collection filters derive from loaded client-side data. Large collections (600+ items) should move to server-side facets/filter/sort via RPCs for performance.

### AI extraction engine integration
The upload flow uses a seeded prototype pipeline. Real AI extraction engine integration replaces the seed.

### Comps algorithm tuning
The blended `get_tracked_comps` RPC (V2) has quality gates deployed and verified. Current thresholds (source >= 2 meaningful fields, candidate >= 3 matched signals + 50% score fraction) produce good distribution across 8 sources. May need adjustment as more items get AI-enriched — if the feed is too sparse, lower `v_min_matched_signals` to 2; if still noisy, raise `v_min_score_fraction` to 0.6. Individual-item comps (`get_collectible_comps`) do not yet have quality gates. The comps lens on collectible detail uses a client-side 75% threshold to partition strong matches from fallback (value-range) items.

### Legacy screen cleanup
Legacy screens still importing from `@/lib/colors` (pre-V3) are untouched by the theme system. A safety audit is needed before deletion to ensure no critical functionality lives only in legacy routes. User wants to hold off until this audit is complete.

### Tracking Hub V2 polish
The Tracking Hub V3 is fully functional. Potential v2 items:
- Status Changes section on OVERVIEW could be enhanced with richer change detail (old value → new value) once `collectible_change_log` has more production data.
- COMPS lens could add per-source grouping or a source filter chip.
- TRACKED lens untrack action could add a confirmation dialog.
- Top Collectors section could deep-link to collector profiles.

## Monorepo / Infra Threads

### Day 3 deferred items (from Day 2 Shared Packages plan)
The Day 2 plan explicitly deferred these to a focused infra session:
- **Web Tailwind tokens consuming `@vitrine/design-tokens` natively.** Today web ports tokens to CSS vars by hand in an adapter file. Day 3 would wire Tailwind v4 to consume the package directly.
- **Edge Functions consuming `@vitrine/api`.** Would require Deno-side bundling. Today they keep their own mirrored copies (e.g., `_shared/managed-eval.ts` mirrors `packages/api/src/modules/managed-rules.ts`). Risk: two-evaluator drift.
- **TypeScript project references with `tsc --build`.** Overkill for current scale; reconsider when shared packages have their own tests.
- **GitHub Actions CI gates** that enforce package boundaries (e.g., no `apps/native/*` import from `apps/web/*`).
- **`.cursor/rules/expo-release-guardrails.mdc` updates** for the new package layout.

### 5 native-only API modules
`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging` still live in `apps/native/lib/api/` because they depend on Expo / RN APIs (image-manipulator, AsyncStorage, native HTTP client, expo-crypto, native `CollectionItem` types). Migrating any of them to `@vitrine/api` requires first abstracting those deps. Worth doing only when web actually needs them — at which point the migration unblocks the web collectible (`/s/c/[id]`) and profile (`/s/p/[id]`) share resolvers, which still use direct Supabase queries.

### Web SSR Supabase client split
Day 2 plan called for installing `@supabase/ssr` and creating browser/server client variants. Today web uses a single shared client wrapped by `getServerApi()`. Not needed for public share resolvers; becomes important the moment web adds an authenticated route.

### Native tsc baseline at 107 errors
Down from 137 (pre-Day-2) → 125 (post-Day-2 baseline) → 107 after token retyping + jest types pass. None block runtime. Largest single offender is `components/key-details/field-renderers.tsx` (31 errors — discriminated union not narrowed before property access). Remainder is component-prop drift (`OptimizedImageProps`, `ButtonProps`), domain type mismatches, and tuple vs array. Opportunistic to fix.

## Release / Ops Threads

### app.json production name
`app.json` name is `vitrinev0`; release guardrails require `Vitrine` for production builds.

### EAS / TestFlight readiness
EAS build and TestFlight submission pipeline not fully audited. Expo Go remains the development target.

### Edge Function secrets sync
Verify `CRON_SECRET`, `project_url`, and `SUPABASE_SERVICE_ROLE_KEY` are set correctly across all environments before deploying cron-dependent Edge Functions.

### Push notification deep-link paths
Any external push notification deep-links targeting `/(tabs)/profile?lens=X` need updating to `/(tabs)?lens=X` since `profile.tsx` was merged into `index.tsx`.

## Assumptions Still Being Tested
- `CollectionSurface` multi-select mode works correctly across all card types and view modes.
- Managed showcase incremental sweep catches collection changes within the 5-minute window.
- Managed showcase rules with large condition sets perform acceptably against collections of 600+ items.
- Suggested collectors algorithm produces useful results with the current signal weights.
- Activity triggers fire correctly for all 15 event types in production.
- Blended tracked comps quality gates produce good results as more items get AI-enriched (may need threshold tuning).
- Tracking OVERVIEW Status Changes section renders meaningful content once `collectible_change_log` has production data.
- `getTrackedCollectionItems` performs acceptably for users tracking 200+ items (currently capped at 50 sources in the comps RPC).

## Resolved Threads (since last update)
- ~~Web marketing site visual misalignment with V3~~ → Resolved by full V3 rebuild. Single-page, dark-first, frost-on-void, brand-correct ivory accent. 20 sections ported from the `vitrine-2026` mockup, share resolvers re-skinned to match, 6 legacy routes 301'd, dynamic icon/OG endpoints rendering the canonical crown mark, mobile responsive across 3 breakpoints. Six atomic commits in `git log`.
- ~~Light/Dark mode toggle~~ → Fully implemented. ThemeProvider + useTheme hook, 3-state segmented control on settings header, ~100 V3 components migrated, AsyncStorage persistence, Auto mode via system-follow.
- ~~Settings screen V3 redesign~~ → Full V3 overhaul complete. Theme toggle, account management (sign out, delete account with username confirm), blocked users wired, support shipped dark, auto-updating app version.
- ~~Alive activity component on PROFILE lens~~ → Activity Banner built and live. Slides in when `unseenCount > 0`, shows count + smart summary, tapping navigates to ACTIVITY lens, dismissible via X button.
- ~~Settings/menu access point~~ → Settings gear icon on DossierCard (top-right, owner-only) + footer "SETTINGS" button at bottom of PROFILE lens scroll. QR Code moved to action row next to Share.
- ~~Home Screen redesign~~ → Home screen eliminated entirely. Profile hub promoted to landing surface at `app/(tabs)/index.tsx`. The collector's profile IS the home.
- ~~Profile screen production route~~ → Confirmed as the production landing tab. `app/(tabs)/index.tsx` mounts `CollectorProfile`.
- ~~Messages as profile hub lens~~ → Messages graduated to dedicated tab at `app/(tabs)/messages.tsx`.
- ~~HUD overlay~~ → Removed entirely. Messages → dedicated tab, notifications → avatar badge dot, menu → deferred.
- ~~Search/Discovery/Explore redesign~~ → Replaced by Market Surface V3 with Instagram-style three-state architecture (mosaic → drawer → results). Three new RPCs deployed (`browse_market_v2`, `search_collectors_tiered`, `search_showcases_tiered`).
- ~~Tracking screen redesign~~ → Replaced by Tracking Hub V3 with four-lens architecture (OVERVIEW | TRACKED | ACTIVITY | COMPS).
- ~~Comps single-source domination~~ → Solved by quality gates in `get_tracked_comps` V2 RPC.
- ~~Notifications lens placeholder~~ → Replaced by Activity Surface V1.
- ~~Follower/following legacy screen~~ → Replaced by Network Surface V3.
- ~~Create Showcase legacy wizard~~ → Replaced by lens-based CURATED | MANAGED flow.
- ~~Managed/Smart showcase "coming soon"~~ → Fully implemented as Managed Showcase V1.
- ~~Managed showcase rule grammar expansion~~ → V2 shipped: added `franchise`, `item_type`, `year`, `maker` from `filter_traits`. `subject` excluded (use `listing_title contains` instead). `category`/`subcategory` still deferred.
- ~~Showcase surface toolbar irrelevant filter controls~~ → Replaced by Create Showcase CTA.
- ~~Profile hub lens ordering~~ → Locked: PROFILE | COLLECTION | SHOWCASE | ACTIVITY | NETWORK (5 lenses; MESSAGE graduated to dedicated tab).
- ~~Custom branded icons~~ → Shipped: CollectibleIcon, ShowcaseIcon, UploadCollectibleIcon.
- ~~AI extraction engine integration~~ → Shipped. Real Looking Glass async pipeline live: `enqueue-extraction` proxy + `looking-glass-webhook` (HMAC-verified) + 2s polling on draft `collectibles` row + Theater "Looking Glass HUD" + cascade-complete on `extracted`.
- ~~Upload Review surface drift from CollectibleDetail~~ → Resolved by extracting `FramedHero` to a shared component (`components/detail/framed-hero.tsx`) used by both surfaces. Review now shows a 1:1 preview of the production detail hero, with tap-to-zoom lightbox.
- ~~Listing copy editable in upload flow~~ → Shipped via `InlineEditableField` (always-on TextInput + always-visible Pencil + focus chrome + counter). Title 90 char, description 420 char (caps grounded in production data).
- ~~Keyboard avoidance on Scan/Review~~ → Shipped using the proven `vault/rapid-fire-edit.tsx` pattern: `KeyboardAvoidingView` with `keyboardVerticalOffset={0}` + ScrollView with `keyboardShouldPersistTaps="handled"` + docked footer button outside the ScrollView. The `offset=0` is correct because in-layout headers don't need compensation.
- ~~Capture screen camera vs library~~ → Shipped: empty-tile tap opens `ActionSheet` with Take Photo (single shot, w/ permission handling + Settings deep-link) and Choose from Library (batch select).
- ~~Onboarding quiz flow~~ → Removed. The quiz (usage intents, type interests, marketplace personality) was designed for a social feed home screen that no longer exists. Data had zero consumers. `onboarding_completed_at` is now set during profile completion. Quiz tables dropped.
