# Current State

Last updated: 2026-05-10
Last verified: 2026-05-10

## Current Build Phase
Active V3 redesign and feature build-out. All primary surfaces are now V3. The app is approaching deployment readiness with a five-lens profile hub (the app's landing surface), a four-lens Tracking Hub, an Instagram-style Market Surface, a dedicated Messages tab, a fully redesigned Settings screen (V3), a Light/Dark/Auto theme system, and extensive backend infrastructure (Edge Functions, cron jobs, RPC functions).

## Current Priority
The most recent major change — **Profile-as-Home Architecture Restructure** — eliminated the legacy home screen entirely. The collector's profile hub is now the app's landing surface (`app/(tabs)/index.tsx`). Messages graduated from a profile hub lens to a dedicated tab. The HUD overlay (logo/messages/notifications top bar) has been removed. The BottomDock now leads with the profile avatar (with activity badge dot) and includes a messages icon with unread count. All V3 surfaces are operational.

## What Works

### Core App Infrastructure
- Expo app configuration in `app.json`.
- Supabase client, auth helpers, API modules, migrations, Edge Functions.
- Stream Chat/Feeds dependencies and contexts.
- V3 design tokens in `lib/design` with dual-theme support (`DARK_COLORS`, `LIGHT_COLORS`).
- `ThemeProvider` context + `useTheme()` hook (`lib/design/theme-context.tsx`). Persists preference to AsyncStorage, defaults to Dark.
- Vault components in `components/vault` exported via barrel.

### Settings (V3 — Complete)
Full V3 redesign of the settings experience:
- **Theme toggle**: 3-state segmented control (Light/Dark/Auto) in the settings header row.
- **Account section**: Edit Profile, Privacy, Blocked Users (wired to `blocked_users` table), Push Notifications (shipped dark).
- **Support section**: Help Center, Bug Report, Support Ticket (shipped dark).
- **Danger zone**: Sign Out (confirmation dialog), Delete Account (type-username confirmation via Edge Function).
- **Footer**: App version display (auto-updating from `expo-constants`).
- **Key files**: `app/settings/index.tsx`, `components/settings-*.tsx`, `supabase/functions/delete-account/`, `supabase/migrations/20260506010000_create_blocked_users.sql`, `lib/api/blocked.ts`.

### Light/Dark Theme System (V3 — Live)
Full theme infrastructure supporting Light, Dark, and Auto (system-follow) modes:
- **Token architecture**: `DARK_COLORS` and `LIGHT_COLORS` objects with identical interface (`ThemeColors` type). `COLORS` alias = `DARK_COLORS` for backward compatibility.
- **Context**: `ThemeProvider` wraps the app in `app/_layout.tsx`. Uses `useColorScheme()` for Auto mode. Preference persisted in AsyncStorage.
- **Hook**: `useTheme()` → `{ colors, mode, resolvedMode, setMode }`. All V3 surfaces consume dynamic `colors.xxx`.
- **Theme-immune elements**: `StatusPill` and `TraitPill` always use `DARK_COLORS.sheetBg` base (dark-backed). Exception: `StatusPill` accepts an `inverted` prop for light-mode NFST on detail screens.
- **Image overlays**: `SpatialCard` text, badge, and burst explicitly import `DARK_COLORS` for consistent legibility over image gradients.
- **BottomDock**: Dynamic background (`rgba(0,0,0,0.70)` dark / `rgba(255,255,255,0.82)` light), BlurView tint, and upload button inversion.
- **DossierCard / Crown Jewel**: `crownCard` and `crownRail` backgrounds use `colors.sheetBg` / `colors.pressOverlay` for theme-awareness.
- **Scope**: All V3 surfaces migrated. Legacy screens using `@/lib/colors` are untouched.

### Profile Hub — Five-Lens Architecture (Landing Surface)
The profile hub (`components/collector-profile.tsx`) is the app's landing surface, mounted at `app/(tabs)/index.tsx`. It runs a five-lens system:
**PROFILE | COLLECTION | SHOWCASE | ACTIVITY | NETWORK**

Messages graduated to a dedicated tab (`app/(tabs)/messages.tsx`). Each lens is accessible via `LensSelector` tap and `LensPager` swipe gestures. URL-driven deep linking (`?lens=` and `?tab=`) enables direct routing into specific lenses and sub-tabs from anywhere in the app.

### Messages Tab (Dedicated)
Messages now live at `app/(tabs)/messages.tsx` as a dedicated tab with its own BottomDock icon (Lucide `Send`). The tab wraps `MessageInboxBody` from `@/components/profile-lenses`. The standalone `/messages` stack route still exists for deep-link and external navigation. Unread message count badge renders on the Messages icon in the BottomDock via Stream Chat's `total_unread_count`.

### Tab Architecture
The app uses five tabs with a custom `BottomDock` (Expo Router's native tab bar is hidden):
**Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages**

The profile avatar in the BottomDock shows a `BadgeDot` (brandVolt color) when `useFeeds().unseenCount > 0`, signaling unseen activity. The HUD overlay (logo + messages + notifications + menu) has been removed entirely.

### Collection Surface
- `CollectionSurface` (`components/collectibles/collection-surface.tsx`) is the shared virtualized FlatList with toolbar, type pills, filter/sort sheets, grid/spatial/list rendering, refresh control, and crown-jewel holo framing.
- Used by: collector profile collection lens, showcase detail contents lens, create showcase curated picker, and share-collectible picker.
- Multi-select mode (`selectedIds` + `onToggleSelect`) with brandVolt border chrome.
- V3 filtering: Status, Traits, Types, Value min/max, People/Athletes, Teams/Franchise/IP.
- V3 sorting: Recently Added, Highest Value, Lowest Value, A-Z, Most Tracked.

### Activity Surface (V1 — Live) + Activity Banner
Full notification/activity system replacing the old "Notifications" lens. An **Activity Banner** on the PROFILE lens slides in when `unseenCount > 0`, showing a count label + smart summary of recent notifications. Tapping navigates to the ACTIVITY lens. Dismissible via X button; reappears on new activity.
- **Activity triggers**: new_follower, new_message, collectible_tracked, showcase_shared, collectible_shared, profile_shared, tracking_status_changed, tracking_value_changed, new_listing_followed, new_showcase_followed, comp_alert, you_listed, you_created_showcase, you_edited_status, you_edited_value.
- **Chip filters**: ALL | INBOX | SIGNALS | JOURNAL.
- **Backend**: `lib/api/activity.ts`, `lib/api/views.ts`, Edge Functions (`stream-notify`, `comp-alert-worker`, `view-rollup-worker`, `view-milestone-checker`), `pg_cron` jobs for comp alerts and view rollups.
- **Owner + Visitor**: Both can see the Activity lens; content is scoped by environment.

### Network Surface (V3 — Live)
Full social graph surface replacing legacy follower/following screen:
- **Lens chips**: SUGGESTED (default) | MUTUAL (visitor-only) | FOLLOWERS | FOLLOWING.
- **Suggested collectors algorithm**: 5-signal weighted (inventory affinity 25%, comp overlap 30%, tracking overlap 20%, network proximity 15%, authority 10%). On-demand computation, 24-48hr server-side cache, pull-to-refresh busts cache.
- **Privacy**: Binary public/private toggle for follower/following list visibility.
- **Backend**: `suggest_collectors_for` RPC, `suggested_collectors_cache` table, `network-suggested-cache-purge` Edge Function + `pg_cron` job, notification preferences table.
- **Deep linking**: Tapping FOLLOWERS/FOLLOWING counts on profile header routes to network lens with the correct tab preselected.

### Showcase System (V3 — Full)
- **Showcase Detail V3** (`components/showcase-detail-v3.tsx`): Two-lens INFO | COLLECTION, DossierCard, owner ActionSheet, featured HolographicFrame, visitor follow chip. Now includes MANAGED badge, rules-summary line, and "Edit Rules" owner action.
- **Create Showcase V3** (`components/create-showcase.tsx`): Lens-based CURATED | MANAGED with mutual exclusion. Curated uses multi-select CollectionSurface. Managed uses `ManagedRuleBuilder`. Both flow to a shared review screen.
- **Showcase Review** (`components/showcase-review.tsx`): Handles both curated (manual collectible IDs) and managed (rules + immediate eval) create paths.
- **Showcase toolbar**: Create Showcase CTA for user-owned profiles replaces irrelevant filter controls.

### Managed Showcase V2 (Full Stack — Live)
Shopify smart-collection-inspired auto-updating showcases:
- **Rule grammar**: 10 fields (`collectible_type`, `listing_title`, `value`, `status`, `traits`, `tags`, `franchise`, `item_type`, `year`, `maker`), 9 operators (`contains`, `starts_with`, `eq`, `gte`, `lte`, `between`, `is_one_of`, `is_all_of`, `is_none_of`), `ALL`/`ANY` match mode. The 4 new fields (`franchise`, `item_type`, `year`, `maker`) source from `filter_traits` JSONB column.
- **Schema**: `rules`, `rules_match`, `rules_last_evaluated_at`, `rules_last_evaluation_status` on `showcases`; `collectibles_last_changed_at` watermark on `users` with AFTER trigger on `collectibles`.
- **Evaluator**: Pure TypeScript in `lib/api/managed-rules.ts` (shared with Edge Functions via `supabase/functions/_shared/managed-eval.ts`). Single source of truth for rule semantics.
- **Edge Functions**: `managed-evaluate` (immediate on rule save), `managed-sweep-worker` (incremental every 5min + full nightly at 03:15 UTC).
- **UI**: `ManagedRuleBuilder` component (match mode toggle, condition stack, live preview card), edit-rules route at `app/upload/showcase/[id]/rules.tsx`.
- **Visibility**: Empty managed showcases hidden from visitors, visible to owners with empty-state body.

### AI Upload Flow (V3 — Live, Polished)
End-to-end wired in `components/upload-entry.tsx`:
- **Pipeline**: Scan → Theater (Looking Glass HUD) → Review → Finalize → Success. Real async extraction via `enqueue-extraction` Edge Function + Looking Glass engine; status tracked via 2s polling on the draft `collectibles` row; `extracted` triggers cascade-complete + 1s pause + transition to Review.
- **Capture screen**: Empty-tile tap opens `ActionSheet` with Take Photo (single shot) / Choose from Library (batch). Camera permission requested with deep-link to Settings on denial. Context input (90 char cap) wraps in KAV+ScrollView so the keyboard doesn't cover it.
- **Theater (Looking Glass HUD)**: Holographic-framed hero, gradient progress ring, 5-item checklist with per-row `traitCyan/traitViolet/traitPink/traitOlive/semanticGreen` colors on completion. Image fades in from 0 → 0.5 opacity over 30s while losing blur. All three animations unified on `Easing.inOut(Easing.quad)` for coordinated rhythm.
- **Review screen**: Uses the **same `FramedHero` component** as the production CollectibleDetail DETAILS lens — paginated photo carousel + tap-to-zoom lightbox. Trait pills above title (matches DetailsLens). Listing title (90 char) and description (420 char) are **inline editable** via `InlineEditableField` (always-on TextInput + always-visible `Pencil` icon + focus chrome + counter). Copy edits flow through `listingEdits` state, separate from the rapid-fire `fieldEdits` queue. Schema atoms (AI metadata + trait metadata) still use the tap-to-queue → rapid-fire batch-edit pattern via `SchemaRow` + `RapidFireEdit`.
- **Finalize → Success**: ActionDock-driven commit. On success, "View in My Collection" deep-links to `/collectible/{id}`. Navigating away from the upload tab (or after success) automatically resets the flow via `useFocusEffect` → `resetFlow`.
- **Listing copy character caps**: `LISTING_TITLE_MAX = 90`, `LISTING_DESCRIPTION_MAX = 420`. Sized tight to the observed max in `john@myvitrine.app`'s 529 production collectibles (max title 86, max desc 418). Same constant powers the Capture screen's context input.

### Shared Detail Hero — `FramedHero`
The `components/detail/framed-hero.tsx` component is the canonical photo carousel for any surface that displays a collectible's images:
- Paginated horizontal `ScrollView`, blurred backdrop + contain-fit foreground, frostBorder + sheetBg chrome, expanded-pill pagination dots.
- Tap-to-zoom **lightbox**: fullscreen Modal, paginated swipe between images, image counter, X-to-close. `enableLightbox={false}` opt-out for surfaces that handle zoom themselves.
- Used by: `components/detail/lenses/details-lens.tsx` (CollectibleDetail DETAILS lens) and `components/upload-entry.tsx` (Review step). Single source of truth — changes ship to both surfaces in lockstep.

### Custom Branded Icons
Three custom React Native SVG icons in `components/ui/custom-icons.tsx`:
- `CollectibleIcon` — used in Activity surface and conversations quick action bar.
- `ShowcaseIcon` — used in Activity surface and conversations quick action bar.
- `UploadCollectibleIcon` — legacy, no longer used in BottomDock.
- Lucide-safe patterns with `BRAND_STROKE_SCALE` (0.45) for consistent weight.

`VitrineMarkIcon` (`components/vault/icons/vitrine-mark-icon.tsx`) — Vitrine brand mark SVG, used in BottomDock center upload button (size=36, filled paths). Barrel-exported via `components/vault/index.ts`.

### Tracking Hub (V3 — Four-Lens Architecture)
Full redesign of the tracking tab replacing the legacy summary card + flat list:
- **Four lenses**: OVERVIEW | TRACKED | ACTIVITY | COMPS, navigable via `LensSelector` (display variant) + `LensPager` (lazy).
- **OVERVIEW lens**: DossierCard (watermark "RADAR") with MetricCardRow (tracked value, item count, collector count), Status Changes (filtered Stream notifications, last 24h, max 5), Recently Tracked strip (6 items), RADAR DNA section (AssetMatrixCard, StatusBreakdownGrid, TraitMixCard), Top Collectors (client-side derived).
- **TRACKED lens**: Full `CollectionSurface` with grid/spatial/list view modes, filter/sort, and untrack action. Spatial cards include owner avatar overlay.
- **ACTIVITY lens**: Tracking-specific activity feed with ALL | STATUS | VALUE | COMPS chip filters. Filters Stream Feed notifications to tracking-relevant verbs only (`status_change`, `value_change`, `comp_alert`, `tracking_alert`).
- **COMPS lens**: Blended comparable sales across the entire tracked portfolio via `get_tracked_comps` RPC. Each comp row attributes its source tracked item. Quality-gated: sources need >= 2 meaningful fields; candidates need >= 3 matched signals AND >= 50% score fraction.
- **Deep linking**: `?lens=OVERVIEW|TRACKED|ACTIVITY|COMPS` on the tab route.
- **Backend**: `getTrackedCollectionItems()` (full AI-enriched join), `deriveTrackedOverviewStats()`, `get_tracked_comps` RPC (V2 with quality gates), `getTrackingCategory()` verb helper.
- **Key files**: `components/tracking-hub.tsx`, `components/tracking-lenses/*`, `hooks/use-tracked-comps.ts`, `lib/api/tracking.ts`, `lib/api/comps.ts`, `lib/design/activity-verbs.ts`, `supabase/migrations/20260505020000_create_tracked_comps_rpc.sql`.

### Market Surface (V3 — Instagram-Style Search & Discovery)
Full redesign of the market/explore tab replacing the legacy search screen:
- **Three-state UI**: Mosaic (default browse grid) → Drawer (recent searches on focus) → Results (tiered search).
- **Mosaic state**: Persistent SearchBar with inline Filter (SlidersHorizontal) and Sort (ArrowUpDown) icon buttons, horizontal chip rail (collectible types + traits from `traits_config`), paginated 2-column grid via `browse_market_v2` RPC.
- **Drawer state**: AsyncStorage-backed recent searches shown on SearchBar focus. Per-item delete via `removeRecentSearch`. Transitions back to mosaic on blur with empty query.
- **Results state**: Tiered search across Collectibles, Showcases, and Collectors with ALL | Collectibles | Showcases | Collectors pill filter. Uses `Promise.allSettled` for graceful degradation.
- **SearchBar**: Extended with `forwardRef` and `SearchBarHandle` for programmatic focus/blur. `onFocus`/`onBlur` props drive state transitions.
- **Filter sheet**: Market-specific `MarketSearchFilterSheet` with Person/Character and Team/IP as free-text inputs (`listing_title ILIKE` pattern).
- **Backend**: `browse_market_v2` RPC (chip filtering, sort, pagination, person/team search), `search_collectors_tiered` RPC (display name → username → collection content tiering, tracking overlap), `search_showcases_tiered` RPC (title → collectible content tiering, item count via CTE).
- **Key files**: `components/market/*`, `components/collectibles/market-search-filter-sheet.tsx`, `components/vault/search-bar.tsx`, `lib/storage/recent-searches.ts`, `lib/api/explore.ts`, `supabase/migrations/20260505030000_browse_market_v2.sql`, `supabase/migrations/20260505040000_market_search_rpcs.sql`, `supabase/migrations/20260505050000_grant_market_read_access.sql`.

### Shared Infrastructure
- `CollectionSurface`: multi-purpose collection display (profile, showcase, picker, share, tracking).
- `LensSelector` + `LensPager`: swipeable lens architecture used across profile hub, showcase detail, create showcase, and tracking hub.
- `HolographicFrame`: semantic featured chrome for Crown Jewel, Featured Showcase, and QR Code Modal.
- `QRCodeModal` (`components/shared/qr-code-modal.tsx`): unified V3 QR modal with HolographicFrame border. Used by profile, showcase detail, collectible detail, and trading card detail.
- Vault primitives barrel: `components/vault/index.ts`.

## What Is Partially Implemented
- Crown Jewel detail-screen assignment/unassignment UI is not built yet.
- Total value, collection size, asset matrix, and status grid rely on fetched user collectibles.
- Profile screen is wired at the production tab route (no longer sandbox-only).

## What Is Broken Or Risky
- `app.json` name is `vitrinev0`; release guardrails say production build name must be `Vitrine`.
- Supabase migrations/RLS/auth areas require caution.
- Some older docs may drift from V3 direction; verify before treating historical docs as current.
- Managed showcase Edge Functions need deployment to Supabase (`supabase functions deploy`).

## Active Files Or Areas

### Upload Flow V3 (newest — polish pass)
- `components/upload-entry.tsx` — full state machine (Scan/Theater/Review/Finalize/Success/Failed). Capture sheet, KAV pattern, listingEdits state, InlineEditableField, theater easing, char caps.
- `components/detail/framed-hero.tsx` — shared photo carousel + lightbox. Used by Review step and CollectibleDetail DETAILS lens.
- `components/detail/lenses/details-lens.tsx` — imports shared FramedHero (no inline copy).
- `lib/api/extraction.ts` — `enqueueExtraction` (direct fetch), `pollJobStatus` (2s polling).
- `lib/api/collectibles.ts` — staging-row pattern (`createDraftCollectible`, `commitDraftCollectible`, `deleteDraftCollectible`, `sweepStaleStagingRows`).
- `supabase/functions/enqueue-extraction/index.ts` — proxy to Looking Glass engine.
- `supabase/functions/looking-glass-webhook/index.ts` — HMAC-verified webhook → updates `collectibles.extraction_status`.

### Market Surface V3
- `components/market/market-surface.tsx` — three-state orchestrator
- `components/market/mosaic-grid.tsx` — paginated 2-column browse grid
- `components/market/search-header.tsx` — persistent SearchBar with inline Filter/Sort icons
- `components/market/search-drawer.tsx` — recent searches
- `components/market/search-results.tsx` — tiered search results
- `components/market/collector-result-row.tsx` — collector result row
- `components/market/showcase-result-row.tsx` — showcase result row
- `components/collectibles/market-search-filter-sheet.tsx` — market-specific filter sheet
- `components/vault/search-bar.tsx` (extended) — forwardRef, SearchBarHandle
- `lib/storage/recent-searches.ts` — AsyncStorage recent search helper
- `lib/api/explore.ts` (extended) — market browse/search API wrappers
- `supabase/migrations/20260505030000_browse_market_v2.sql` — browse RPC
- `supabase/migrations/20260505040000_market_search_rpcs.sql` — tiered search RPCs
- `supabase/migrations/20260505050000_grant_market_read_access.sql` — permission grants

### Tracking Hub V3
- `components/tracking-hub.tsx` — main orchestrator (LensSelector + LensPager + data loading)
- `components/tracking-lenses/overview-lens.tsx` — DossierCard/RADAR intelligence surface
- `components/tracking-lenses/tracked-lens.tsx` — CollectionSurface integration
- `components/tracking-lenses/tracking-activity-lens.tsx` — tracking-filtered activity feed
- `components/tracking-lenses/tracking-comps-lens.tsx` — blended comps with source attribution
- `components/tracking-lenses/index.ts` — barrel export
- `hooks/use-tracked-comps.ts` — data hook for blended tracked comps
- `app/(tabs)/tracking.tsx` — tab route with deep-link support, SafeAreaView
- `lib/api/tracking.ts` (extended) — `getTrackedCollectionItems()`, `deriveTrackedOverviewStats()`
- `lib/api/comps.ts` (extended) — `TrackedCompItem`, `getTrackedComps()`
- `lib/design/activity-verbs.ts` (extended) — `TrackingChipCategory`, `getTrackingCategory()`
- `components/vault/spatial-card.tsx` (extended) — owner avatar overlay
- `components/collectibles/collection.ts` (extended) — `ownerAvatar`/`ownerName` on CollectionItem
- `supabase/migrations/20260505020000_create_tracked_comps_rpc.sql` — V2 RPC with quality gates

### Managed Showcase V1
- `lib/api/managed-rules.ts`
- `lib/api/showcases.ts` (discriminated create, updateShowcaseRules, previewRuleMatches)
- `supabase/functions/_shared/managed-eval.ts`
- `supabase/functions/managed-evaluate/index.ts`
- `supabase/functions/managed-sweep-worker/index.ts`
- `supabase/migrations/20260505000000_add_managed_showcases.sql`
- `supabase/migrations/20260505010000_schedule_managed_workers.sql`
- `components/managed-rule-builder.tsx`
- `components/create-showcase.tsx`
- `components/showcase-review.tsx`
- `components/showcase-detail-v3.tsx`
- `app/upload/showcase/[id]/rules.tsx`

### Settings V3
- `app/settings/index.tsx` — main settings screen with theme toggle
- `components/settings-account.tsx`, `components/settings-edit-profile.tsx`
- `components/settings-privacy.tsx`, `components/settings-blocked-users.tsx`
- `components/settings-notifications.tsx`, `components/settings-help.tsx`
- `components/settings-privacy-policy.tsx`, `components/settings-terms.tsx`
- `supabase/functions/delete-account/index.ts` — account deletion Edge Function
- `supabase/migrations/20260506010000_create_blocked_users.sql`
- `lib/api/blocked.ts`

### Theme System
- `lib/design/tokens.ts` — `DARK_COLORS`, `LIGHT_COLORS`, `ThemeColors` type
- `lib/design/theme-context.tsx` — `ThemeProvider`, `useTheme()` hook
- `lib/design/index.ts` — barrel exports theme utilities

### Activity Surface
- `lib/api/activity.ts`, `lib/api/views.ts`
- `components/activity/` (activity-row, journal-row, signal-row, inbox-row)
- `supabase/functions/stream-notify/`, `comp-alert-worker/`, `view-rollup-worker/`, `view-milestone-checker/`

### Network Surface
- `components/network/` (network-lens, suggested-row, follower-row, mutual-row)
- `supabase/functions/network-suggested-cache-purge/`
- `supabase/migrations/` (suggested_collectors_cache, notification_preferences, network RPC)

### Profile Hub
- `components/collector-profile.tsx`
- `components/collectibles/collection-surface.tsx`
- `components/vault/lens-pager.tsx`, `lens-selector.tsx`

### Core
- `lib/supabase.ts`, `lib/api/auth.ts`, `lib/contexts/auth-context.tsx`
- `lib/api/collectibles.ts`, `lib/api/follows.ts`
- `lib/design/*`, `components/vault/*`
- `supabase/migrations/`, `supabase/functions/`

## Important Context For Next Agent
- The **auth flow** is: Login/Signup (email OTP) → Complete Profile (display name, username, email → optional avatar/bio) → Tabs. There is **no onboarding quiz** — `onboarding_completed_at` is set at the end of profile completion. The column is still used as a "real user" filter in search/explore/suggested RPCs. The quiz tables (`user_usage_intents`, `user_marketplace_preferences`, `user_type_interests`) have been dropped.
- The app uses a **profile-as-home** architecture. The profile hub IS the landing surface at `app/(tabs)/index.tsx`. There is no separate home screen.
- The profile hub has **five lenses**: PROFILE | COLLECTION | SHOWCASE | ACTIVITY | NETWORK. Messages is a separate tab. All new profile surfaces should be lenses, not separate screens.
- **Messages** is a dedicated tab at `app/(tabs)/messages.tsx`. Navigate to messages via `/(tabs)/messages`, not via a profile lens.
- The **BottomDock** tab order is: Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages. The profile avatar shows an activity badge dot (brandVolt) when unseen feed items exist. The messages icon shows an unread count badge. The upload FAB uses `VitrineMarkIcon` (brand mark).
- **Brand color** is warm ivory (`#E8E0D4` dark / `#6B5B3E` light), not the original neon volt. Token names (`brandVolt`, `brandVoltFill`, `brandVoltBorder`) are deliberately kept for hot-swap capability. The monochrome palette lets collectibles own the color system.
- **Theming**: Import `useTheme()` from `@/lib/design` for dynamic colors. Use `DARK_COLORS` directly only for elements that must stay dark regardless of theme (image overlays, status/trait pills). The `COLORS` export is a backward-compat alias for `DARK_COLORS`.
- The **HUD overlay** (`components/hud-overlay.tsx`) has been deleted. There is no top navigation bar. Settings is accessible via gear icon on the DossierCard (top-right, owner-only) and a footer "SETTINGS" button at the bottom of the PROFILE lens scroll. QR Code and Share are paired in the action row.
- **`CollectionSurface`** is the canonical collectible grid/list. Use it (with appropriate props) rather than building new list views. Now also used by the Tracking Hub's TRACKED lens.
- **`LensSelector` + `LensPager`** is the canonical lens navigation pattern. Used by profile hub, showcase detail, create showcase, and **tracking hub**.
- The **Tracking Hub** (`components/tracking-hub.tsx`) is the tab-level orchestrator for four tracking lenses. It owns data loading, state management, and cross-lens navigation. Individual lenses live in `components/tracking-lenses/`.
- **Managed showcase rules** are evaluated by a pure TypeScript evaluator (`lib/api/managed-rules.ts`) that's shared between client and Edge Functions. If rule semantics change, update both `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` in lockstep.
- **Edge Functions** authenticate via either `SUPABASE_SERVICE_ROLE_KEY` (client-invoked) or `CRON_SECRET` (cron-invoked). Check `vault.decrypted_secrets` for cron patterns.
- For V3 UI, check existing vault components before building inline. Import tokens from `@/lib/design`, vault UI from `@/components/vault`.
- The **Market Surface** (`components/market/market-surface.tsx`) is the tab-level orchestrator for search & discovery. It manages three states (mosaic/drawer/results) and owns filter/sort state. Individual views live in `components/market/`.
- The upload flow's state machine lives in `components/upload-entry.tsx`. Changes there can break review, finalize, rapid-fire, or extraction overlay simultaneously. **Listing copy** (title/description) is edited inline via `InlineEditableField` and flows through `listingEdits` state — separate from the rapid-fire `fieldEdits` queue used for schema atoms. Listing char caps: title 90, description 420 (constants `LISTING_TITLE_MAX` / `LISTING_DESCRIPTION_MAX`).
- The **`FramedHero`** component (`components/detail/framed-hero.tsx`) is the canonical photo carousel + lightbox. Shared by CollectibleDetail DETAILS lens AND the upload Review step. Changes ship to both surfaces in lockstep — keep them visually identical.
- **Comps Lens** on the collectible detail screen uses a 75% match-score threshold to separate "strong matches" from "similar value range" fallback items. Fallback items are capped at 6 and rendered with a Realtor-style explanatory header. The legacy `app/collectible/[id]/comps.tsx` screen has been deleted — all comps display is now inline in the detail lenses.
- **Settings** is accessible via the gear icon on DossierCard and the footer button on the PROFILE lens. The theme toggle lives in the settings header row (far right). Settings sub-screens are: Account (Edit Profile, Privacy, Blocked Users, Notifications) | Support (Help, Bug Report, Tickets) | Danger Zone (Sign Out, Delete Account).

## Do Not Assume
- Do not assume mock data is acceptable where wiring has already started.
- Do not assume production readiness just because Expo Go renders.
- Do not assume Thinktank overrides project files.
- Do not assume Edge Functions are deployed — check `supabase functions list` first.
