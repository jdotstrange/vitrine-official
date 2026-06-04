# Open Threads

Last updated: 2026-06-02
Last verified: 2026-06-02

## Product / Design Threads

### Edit collectible (owner post-catalog edits, custom fields, provenance badges)
**Status: Implemented (2026-06-02).** OTA preview `fd922925` + production `db889dfe`; git `e83f6e4`. Provenance false-positive after rerun-only save fixed same wave. Listing-line Edited badges deferred V1. Follow-up: optional data cleanup for rows with orphan provenance keys; founder soak on device after cold restart.

### Native upload: Identify-first flow (prefs on screen 1, drop Finalize step)
**Status: Implemented (2026-06-02).**

Merge today's **Scan + Finalize (Preferences)** into a single scrolling **Identify** screen, matching the web bulk uploader's "stage everything, then fire" model:

```
Identify (photos + context + owner prefs) → Analyze
  → Theater
  → Review / Confirm (AI verification + edits)
  → Catalog → Success
```

**Locked product rules:**
- **Scrolling Identify is fine** — iterate on layout after ship.
- **Strict Analyze gate:** block Analyze until photos exist AND listing prefs are valid (value required when status is For Sale / Sell+Trade). Intent: cataloging workflow, not casual reverse-image lookup.
- **Prefs on draft insert:** extend `createDraftCollectible` to write status, value, visibility, tags at row creation (mirror `batch-processor.ts` insert). Showcase junction rows stay on **Catalog** commit to avoid orphan links on abandoned drafts.
- **Review primary CTA:** **Catalog** (lexicon = confirm & add to collection), not "Add to Collection". Finalize step removed from the state machine.
- **Speculative upload** (already shipped) overlaps with time spent on Identify prefs — keep it.

**Implementation touchpoints:** `apps/native/components/upload-entry.tsx` (merge `ScanStep` + `FinalizeStep` UI, remove `finalize` step, gate Analyze), `apps/native/lib/api/collectibles.ts` (`createDraftCollectible` signature + insert payload), `commitDraftCollectible` (lighter — AI fields + `published_at`; prefs already on row unless user edits on Review).

**Web parity (deferred):** When the authenticated web app gets a single-item catalog flow, it must follow this same Identify → Theater → Review → Catalog pattern — not the legacy 5-step `catalog/single/page.tsx` machine. Bulk uploader already matches Identify-first prefs; single-lane web should converge when built.

### Marketing site real testimonials
The `PressSection` on `/` ships with a refactored `Quote` shape (`{ quote, name, role, placeholder? }`) so real testimonials can drop in cleanly. The third card is wired as an explicit `placeholder: true` entry rendering "[Your name here]" / "OPEN SLOT · HELLO@VITRINE.APP" with a dashed-border treatment. The first two cards are also generic ("Collector / 22 YR · CARDS" + "Collector / 8 YR · WATCHES") and should become real names + roles before launch. Edit `PRESS_QUOTES` in `apps/web/lib/marketing/constants.ts` and remove the `placeholder` flag once the third card is real.

### Marketing site real photos
The 8 image URLs in `apps/web/lib/marketing/photos.ts` remain Unsplash placeholders where still referenced, and real testimonial/collector photography is still pending. The Hero phone now uses real production screenshots from `apps/web/public/marketing/screens/*`, and the home Explore grid is DB-backed from `@fmazza821` instead of static Unsplash cards.

### ThesisSection real app screenshots
The multi-page restructure plan (Phase 6) called for inline visuals in `ThesisSection` of FramedHero, lens architecture, and a dossier card. No real assets are available yet — the section currently leans on type + frost layout without screenshots. When real visuals land, drop them into `apps/web/components/marketing/sections/ThesisSection.tsx`.

### Mobile pass on deep pages (`/pricing`, `/intelligence`, `/product`)
The May 12 mobile pass treated the home `/` as a first-class mobile surface — added a 420px breakpoint, restored the Hero phone (was hidden), forced 2-up RapidFire, kept Problem 2×2, hid decorative elements that don't translate. The three deep pages were intentionally NOT touched in that pass and still rely on only the base 2-tier responsive layer (1024 / 768) plus whatever inline `flexWrap` each section happens to carry. They need the same audit:
- `/pricing` — `PricingCards` (3 plans side-by-side), `ComparisonTable` (collapsible matrix), `MarketplaceFeeMath` (tier recommender). Tables especially.
- `/intelligence` — `MultiVerticalExamples`, `BeforeAfterComparison`, `VAR/AAR/PulseLensExplanation` cards, `CompsArea`. Heavy on side-by-side comparison cards.
- `/product` — the longest page. ~11 areas. Worth profiling weight + reflow on mobile.
The pattern is established: add `data-marketing-*` hooks to elements that need conditional layout, then write rules in the "ENHANCED MOBILE PASS" block in `apps/web/app/globals.css` (don't edit the older layer).

### Legal review on `/privacy` + `/terms`
Both pages ship with a sticky DRAFT banner via `LegalPage.tsx` and `metadata.robots = { index: false, follow: false }`. Plain-English placeholder copy covers the right surface area (data collection, sharing/visibility, retention/export, marketplace, fees, acceptable use) but needs real legal review before public launch. The "first 10K Pro subscribers locked at $9.99 forever" founders pricing is referenced in both `/pricing` (`FoundersPricingBanner`) and `/terms` placeholder — keep them in sync if the offer changes.

### `/explore` real DB-backed page
The home page Explore grid is now DB-backed as a lightweight sample: 8 random public collectibles from `@fmazza821`, rendered as status + listing title + value with static fallback. A full `/explore` page wired to Supabase (real-time browsing + facets + collector discovery) is still its own engineering project (~2-3 weeks), explicitly out of scope for the marketing home refresh. Defer until product appetite returns.

### `/changelog` page
The Live Now / Roadmap content from the deleted `LiveComingSection` could revive on a future `/changelog` page (live shipped features + roadmap teases). Currently the home page doesn't surface either. Defer until there's a meaningful update cadence to publish.

### `/login` becomes real authenticated surface
Currently a "Web App Coming Soon" placeholder with App Store + Play badges. Activate when the web app exists. The page is noindexed and excluded from `sitemap.ts` so SEO doesn't pick it up prematurely.

### Marketing site shadcn `ui/*` cleanup
`apps/web/components/ui/*` (shadcn) currently has zero importers but was deliberately retained for the eventual authenticated web app. If a year passes without web auth shipping, prune to remove the dead weight.

### Showcase curated sort + drag-to-reorder (v2)
The COLLECTION lens on showcase detail defaults to `recent` sort. The right long-term owner experience is curated/manual ordering with drag-to-reorder. Requires a `position` column on `showcase_collectibles`, write-path support, and a sort handle on each card primitive.

### Variant retry / backfill after Assembly timeout
If Assembly hits the 45s timeout (or the app is killed mid-Assembly), the collectible is already committed but some `_200` / `_400` / `_800` variants may be missing — collection grid thumbnails can 404 until variants exist. No client backfill exists yet. Follow-up: background retry on next app launch, admin regen tool, or storage cron. Monitor Sentry `assembly_complete` breadcrumbs for `timedOut: true` rate > 5%.

### Post-Assembly variant generation
**Status: Open (2026-06-02).** Assembly step removed in Identify-first wave (`assembly-step.tsx` deleted; client `assemblyVariants` path gone). Upload now sends originals via `uploadImage` only. Collection grid thumbnails may rely on originals until a replacement strategy ships. Options: edge `generate-variants` trigger on Catalog commit, background retry on app launch, storage cron, or accept originals-only for single-lane until batch lane needs variants. Decide before scaling uploads.

### Theater 1 extraction reliability (poll never completes — extraction axis)
**Status: Partially addressed (2026-06-02).** `job-status` proxy + reconciler deployed and live in Supabase; Theater polls engine `stage` via `pollEngineJobStatus`. Webhook idempotency + dropped-webhook reconcile in place. **Worker still required** (`vitrinedb/worker`) — queue stalls if PC worker off. Monitor after Lattice OTA soak on runtime-`2` preview binary. Remaining levers if repro persists: Supabase Realtime on `collectibles.extraction_status`, `raceForCompletion` wiring, Theater hard timeout UX polish.

### Migrate legacy V1 memorabilia photo grid to `PhotoReorderGrid`
The legacy V1 memorabilia upload flow (`components/upload/memorabilia-core-form.tsx` → `components/upload/photo-grid.tsx`) still consumes `react-native-draggable-flatlist@4.0.3` and is reachable via `/upload/memorabilia/[type]/[category]` from `memorabilia-type-selector.tsx`. The V3 upload flow (`components/upload-entry.tsx`) migrated to `<PhotoReorderGrid />` on 2026-05-26, but V1 was intentionally NOT touched in that PR to keep the diff focused. **DFL is therefore still in `package.json`.** Migrating V1 to consume `PhotoReorderGrid` is the cleanup that removes the last DFL dependency. Two complications: (1) V1 is a HORIZONTAL carousel, not the 3-column vertical grid V3 uses — needs either an `orientation` prop expansion on `PhotoReorderGrid` (passing `orientation: GridOrientation.Horizontal` + `rows` instead of `columns` into the underlying SortableGrid) OR a sibling `PhotoReorderCarousel` primitive; (2) V1 caps at 7 photos vs V3's 6 — the primitive's `maxPhotos` prop already accommodates. Open question: is the V1 memorabilia route still on the product roadmap, or is it slated for V3 unification eventually? If the latter, this thread becomes dead code cleanup; if the former, the primitive expansion is real work. Discuss with founder before sinking time. Once V1 is migrated, remove `react-native-draggable-flatlist` from `apps/native/package.json` and refresh DO_NOT_BREAK.

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

### Push notification settings UI
`settings-notifications.tsx` exists but per-verb toggle preferences are not wired to the backend `notification_preferences` table. The `activity-verbs.ts` `pushDefault` flags define which verbs send push by default, but users can't customize yet.

### Feeds push (activity notifications)
Stream Chat push is verified on device. Stream Feeds push (activity notifications → lock screen) requires additional Stream Dashboard configuration for the `notification` feed group. Not yet verified on device.

### expo-notifications + native picker conflict (REVERSED — monitoring)
**Status flipped 2026-05-24 (evening).** The custom `photo-library-picker.tsx` was retired in commit `5e72933` in favor of native `PHPickerViewController` via `ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection, selectionLimit, orderedSelection })`. The Promise-hang issue that drove the custom picker has not recurred with the current `expo-image-picker` / `expo-notifications` stack on the current EAS preview binary. This is an **assumption to monitor** — the original hang was load-bearing for months. If it recurs (signs: indefinite Promise hang on library pick, especially with iCloud-only/HEIC photos), the rollback is to resurrect `photo-library-picker.tsx` from `git show 5e72933^:apps/native/components/photo-library-picker.tsx`. Camera (`launchCameraAsync`) was always fine and is unchanged.

### Managed showcase manual ↔ managed conversion
V1 decision: conversion between manual and managed showcase types is immutable. Future versions may allow conversion paths.

### Managed showcase rule grammar — remaining candidates
V2 shipped `franchise`, `item_type`, `year`, `maker`. Remaining deferred candidates: `category`/`subcategory` (polymorphic inconsistency unresolved), `grade`/`grading_company` (not yet in `filter_traits`), custom metadata fields from AI schema.

## Data / Backend Threads

### Native app logout on web sign-in (ACTIVE BUG)
When a user signs into the web portal, the native app logs out. Supabase "Enforce single session per user" is confirmed disabled. Root cause analysis: native `onAuthStateChange` listener only clears session on `SIGNED_OUT` events. The native app's `autoRefreshToken` mechanism likely attempts to refresh a token that was invalidated by the web auth session (refresh token rotation). Additionally, explicit `signOut()` calls in native use `global` scope (default), which invalidates all sessions across devices. Fix approach: (1) ensure web signOut uses `scope: 'local'`, (2) verify native signOut also uses `scope: 'local'` unless user intent is to sign out everywhere, (3) investigate if Supabase refresh token rotation is causing false `SIGNED_OUT` events on the native client.

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

### Push `main` to `origin` (ACTIVE — founder action)
**Status 2026-06-02:** Local `main` is **2 commits ahead** of `origin/main` (`feb0c25` Identify-first/Lattice, `e83f6e4` edit collectible + provenance fix). OTAs already published from local tree. Run `git push origin main` to sync remote.

### Preview binary runtime 2 distribution (ACTIVE — founder action)
**Status 2026-05-30:** `runtimeVersion` bumped to `"2"` on `main` (`33ec04f`). Preview IPA **not yet built** this session — founder running manually.

**Why:** May 24 preview (`e5113d4a`, commit `c357fae`) has Reanimated 4.1.1 and **no** `react-native-reanimated-dnd` — JS with `PhotoReorderGrid` crashes upload. May 26 preview (`c69ae9b1`, `fd26b591`) had native deps but shared runtime `1` with May 24, so incompatible OTAs could still deliver. Runtime `2` isolates the channel.

**Ship checklist:**
1. `cd apps/native && eas build --profile preview --platform ios --message "preview runtime 2 baseline"`
2. Distribute IPA (Expo install link / TestFlight). **Team must reinstall** — delete old preview app if needed.
3. Smoke: upload Scan reorder, Assembly, collectible detail edge-back, keyboard on Scan context field.
4. Optional: `eas update --channel preview --message "runtime 2 baseline"` for JS-only fixes after soak.
5. Consider first Android preview build (`--platform android`) — none in EAS history today.

**Dev client note:** Latest cloud **development** build `f0a71aef` (2026-05-26, `cbc131b`) predates full `main` upload stack — use Metro for JS or rebuild `eas build --profile development` if testing native parity. Download: `eas build:list --profile development` then `eas build:download --id <ID>`.

### app.json production name
Resolved 2026-05-13. `app.json` name is now `MyVitrine`, matching the App Store listing.

### EAS / TestFlight readiness
EAS migration active as of 2026-05-13. Phase 1 complete (dev client on device). Phase 2: Sentry live (verified 2026-05-13), push notifications live (verified on device 2026-05-14), keyboard-controller installed (code migrated 2026-05-14, awaiting EAS rebuild). See `docs/EAS_MIGRATION_PLAN.md` for full plan.

**EAS secrets configured:**
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_STREAM_API_KEY` — app runtime
- `EXPO_PUBLIC_SENTRY_DSN` — Sentry crash reporting DSN
- `SENTRY_AUTH_TOKEN` — build-time only, for source map uploads to Sentry

**APNs credentials:**
- Key ID: `L7S5Z47YPL` (generated 2026-05-13)
- Team ID: `3RFDYDWUUV`
- Bundle ID: `com.vitrine`
- `.p8` file: `docs/AuthKey_L7S5Z47YPL.p8` (gitignored)
- Uploaded to Stream Dashboard Chat push config as provider "MyVitrine iOS"

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
- ~~Edit collectible flow (post-catalog owner edits, LG rerun staging, custom fields, Edited provenance chips)~~ → Resolved 2026-06-02 (`e83f6e4`, OTAs `fd922925` / `db889dfe`). Stale Edited badges after rerun-only save fixed via provenance reconcile in `computeMetadataProvenance`.
- ~~Collectible detail swipe-back blocked in middle content (LensPager vs stack pop)~~ → Resolved 2026-05-27 (`5d32845`, preview OTA `a3610490-8612-4e9f-858f-ece6e2ca932b`). Root cause: symmetric `activeOffsetX([-12, 12])` on page 0 claimed rightward drags. Fix: asymmetric offset on index 0 only; no back chevron added (display `LensSelector` remains sole top chrome). Founder dev-client validated edge-back from middle of DETAILS + lens swipes intact.
- ~~Theater cosmetic "stuck at 90%" pacing~~ → Resolved 2026-05-27 (`f09e891`, preview OTA `7356da1c-9b2c-4a34-b3d3-486c07796c54`). 25s linear crawl to 85% cap, ring gated on `extractionJobId`, percent label floored/capped. Poll sprint to 100% unchanged. Does not resolve poll-never-completes extraction hang — see open Theater 1 extraction reliability thread.
- ~~Upload photo grid drag-reorder polish (Layer 2)~~ → Resolved 2026-05-26, merged to `main` (`c474d7c`–`c69300a`). `PhotoReorderGrid` at `apps/native/components/vault/photo-reorder-grid.tsx`. **Binary rebuild** (Reanimated 4.3.1 + Worklets 0.8) still required for devices on pre-migration preview builds — JS OTAs alone insufficient. DFL retained for V1 memorabilia. See DECISION_LOG + IMPLEMENTATION_LOG.
- ~~Cross-upload showcase state leak~~ → Resolved 2026-05-24 (evening). Founder flagged that selecting showcases during one upload caused them to persist as pre-selected on the next upload. Root cause: `resetFlow` in `apps/native/components/upload-entry.tsx` was only clearing photos + extraction state, leaving `selectedShowcaseIds` / `localShowcases` / `tags` / `status` / `visibility` / `estimatedValue` hot. Fixed by extending `resetFlow` to scrub all of them. Also extracted showcase fetching into a `fetchShowcases` callback fired on mount AND via `useFocusEffect`, so the picker always reflects the current showcase list when the user returns to the upload tab. Selected showcases now render as removable chips on the finalize screen (replacing the static summary row) so users can dismiss them inline. Shipped in commit `49aae14` as OTA.
- ~~Keyboard "hiding"/awkward rendering across native input surfaces~~ → Resolved 2026-05-24 (evening) in commit `fd7ce61`. Built three canonical wrapper primitives (`KeyboardSafeScroll` / `KeyboardSafeSheet` / `KeyboardSafeComposer`) in `apps/native/components/vault/`, configured Android `KeyboardController.setInputMode(SOFT_INPUT_ADJUST_RESIZE)` globally, mounted a globally themed `<KeyboardToolbar />`, and migrated all 23 input surfaces (5 V3 gap surfaces + 14 raw `KeyboardAvoidingView` surfaces + 4 sheet primitives) off ad-hoc keyboard handling. Removed non-existent `automaticOffset` prop while migrating (wasn't doing anything anyway). New input surfaces should always reach for the wrappers — see DO_NOT_BREAK.
- ~~Upload photo grid: static 6-tile layout, no reorder~~ → Resolved 2026-05-24 (evening) in commit `5e72933`. Replaced the fixed 3×2 grid with a dynamic `DraggableFlatList<GridItem>` that starts with a single `+` tile and grows as photos are added. Long-press lifts a tile for reorder with haptic feedback (`Haptics.selectionAsync()` on drag begin, `Haptics.impactAsync(Light)` on each placeholder change). `COVER` badge anchored to photo[0]. Note: visual polish (drop indicator + shuffle-out-of-the-way animation) is **deferred to Layer 2** — see open thread above. The current functional state is stable; the founder noted it "still feels janky" but works.
- ~~Camera roll feels janky / non-native scrolling~~ → Resolved 2026-05-24 (evening) in commit `5e72933`. Custom `photo-library-picker.tsx` (which rendered a paginated grid via `expo-media-library`) was retired in favor of the native `PHPickerViewController` accessed via `ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit, orderedSelection: true })`. The native picker provides buttery-smooth scrolling, search, albums, smart suggestions, and ordered multi-select for free. **This reverses the prior "do not use launchImageLibraryAsync" rule** — see "expo-notifications + native picker conflict" above (now in Monitoring status). DO_NOT_BREAK and DECISION_LOG updated accordingly.
- ~~Drag-tile lift-border using legacy neon `#C8FA38`~~ → Resolved 2026-05-24 (evening) in commit `cbc131b`. The first drag-reorder ship hardcoded `#C8FA38` inside a static `StyleSheet.create()` call for the `isActive` border state. V3 renamed `brandVolt` to warm ivory months ago (`#E8E0D4` dark / `#7A7168` light), so the legacy hex clashed with the rest of the V3 palette. Fix: replaced static style entry with an inline `isActive && { borderColor: colors.brandVolt, ... }` branch on the `Pressable` style array so it reads from the live theme. Any future "active state" / "highlight" / "lift" color in upload surfaces should follow the same inline-from-`useTheme()` pattern — captured as a constraint in DO_NOT_BREAK.
- ~~batch_uploads INSERT returning empty error~~ → Resolved 2026-05-24. Root cause was the original `20260518000000_create_batch_uploads.sql` migration enabling RLS and creating restrictive policies but never granting table-level privileges to the `authenticated` role. PostgREST requires both grants AND RLS-pass for any operation, so the table was unreachable from the browser even when policies were simplified to `true` during debugging. Fixed via reconciliation migration `20260525003750_reconcile_batch_uploads_access.sql` which added the GRANT and restored restrictive policies. The original migration was amended to include the GRANT clause so fresh installs produce a correct table on the first try.
- ~~Edge Function deployment (managed-evaluate, managed-sweep-worker)~~ → Resolved. Both are ACTIVE in live DB since April 4 (verified via MCP `list_edge_functions` during the priming audit 2026-05-24). Their source has been in `supabase/functions/` since the Managed Showcase V1 build; the entry was misleading. `stream-token` and `test-push` edge functions (which were genuinely untracked locally) were committed during the 2026-05-24 priming wave.
- ~~react-native-keyboard-controller migration~~ → Resolved 2026-05-24. EAS preview build with keyboard-controller (and Sentry + push + expo-updates) verified on device. All KAV instances using `automaticOffset` work as expected.
- ~~Marketing site copy iteration~~ → Resolved by Phase 6 of the multi-page restructure. Hero refreshed into tighter beats ("One photo. Every field, extracted..."). Intelligence section retitled "Tell us nothing. We read the piece." Activity narrative rewritten as the social-signal feed (followers, status changes, comp alerts) with concrete examples. Community section's three identical "Followed because of:" lines replaced with three distinct hooks (What she owns / How he curates / Why he matters). Misleading follower-count stat replaced with "Cataloging since YYYY" — depth signal, not engagement-bait. Testimonials data shape refactored from `{ q, a }` to `{ quote, name, role, placeholder? }` so real quotes drop in cleanly.
- ~~Marketing site multi-page restructure~~ → Resolved by 7 atomic phases (`marketing: phase 1` through `marketing: phase 7` in `git log`). Single-page lander expanded into a tight 10-section `/` plus three deep pages (`/pricing`, `/intelligence`, `/product`), `/login` placeholder, draft `/privacy` + `/terms`. Routes grew from 8 → 16. Pulse → Activity rename eliminated the in-app-Pulse-lens naming collision on the marketing side. `/lab` snapshot route deleted in Phase 7 along with two orphaned section files. Build green at every step.
- ~~Web marketing site visual misalignment with V3~~ → Resolved by full V3 rebuild. Single-page, dark-first, frost-on-void, brand-correct ivory accent. 20 sections ported from the `vitrine-2026` mockup, share resolvers re-skinned to match, 6 legacy routes 301'd, dynamic icon/OG endpoints rendering the canonical crown mark, mobile responsive across 3 breakpoints. Six atomic commits in `git log`. (Subsequently restructured into multi-page architecture — see above.)
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
