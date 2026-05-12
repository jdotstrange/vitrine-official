# Implementation Log

Last updated: 2026-05-11
Last verified: 2026-05-11

## 2026-05-11 - Day 2 Shared Packages: design-tokens, constants, types, api

- Summary: Completed Day 2 of the monorepo migration by extracting four shared workspace packages from the native codebase. Day 2.1 lifted design tokens (`tokens.ts`, `status-config.ts`, `trait-config.ts`, `match-tiers.ts`, `activity-verbs.ts`) into `@vitrine/design-tokens` and unified `APP_STORE_URL` / `PLAY_STORE_URL` / share-domain constants into `@vitrine/constants`. Day 2.2 extracted shared domain types (User, Collectible, ShowcaseDetail, MarketItem, ManagedRules, JournalEntry, ListingStatus, …) into `@vitrine/types`, including a generated Supabase `Database` type, and rewired ~20 native components + every API module to import from `@vitrine/types`. Day 2.5 (the most invasive phase) rebuilt the API layer: 12 portable Supabase modules were converted from singleton imports to factory functions (`createXApi(supabase, logger, env?)`) and moved into `packages/api/src/modules/`. A mega-factory `createApi({ supabase, logger, env })` composes them all and returns a typed `VitrineApi`. To avoid breaking hundreds of existing native call sites, `bindToSingleton()` stores the composed instance and the package re-exports ~60 flat functions; the native app calls `bindToSingleton()` once at module load via `apps/native/lib/api/index.ts` and 14 thin shim files (`apps/native/lib/api/notifications.ts`, etc.) re-export the relevant symbols under their original paths. Five modules stayed native-only because they depend on Expo / React Native APIs (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`). The web app gained `apps/web/lib/api.ts` with a `getServerApi()` helper that lazily builds a `VitrineApi` against the web Supabase client; the showcase share resolver (`/s/s/[id]`) was migrated to use it. Notifications and extraction modules accept a small `env` object (`supabaseUrl`, `supabaseAnonKey`) so they don't reach for `process.env` directly. Follows now injects the notifications API for new-follower side effects. Showcases inlined `getTrackCounts` and the pure `previewRuleMatches` helper to stay portable without dragging in the native-only `tracking` module.
- Files Changed:
  - **New packages**:
    - `packages/design-tokens/` — colors, typography, spacing, radii, status/trait/match-tier helpers. Pure TS.
    - `packages/constants/` — share URL helpers, store URLs, image upload limits, pagination defaults.
    - `packages/types/` — domain types + generated `Database` type.
    - `packages/api/` — factory modules in `src/modules/` (`blocked`, `comps`, `fields`, `search`, `activity`, `notifications`, `follows`, `network`, `categories`, `extraction`, `explore`, `showcases`, `managed-rules`), `factory.ts`, `logger.ts`, `utils.ts`, `index.ts` (mega-factory + singleton facade + flat re-exports).
  - **Native rewire**:
    - `apps/native/package.json` — added `@vitrine/design-tokens`, `@vitrine/constants`, `@vitrine/types`, `@vitrine/api` (`workspace:*`).
    - `apps/native/lib/design/index.ts` — re-exports `@vitrine/design-tokens` plus the native-only `theme-context.tsx`.
    - `apps/native/lib/api/index.ts` — calls `bindToSingleton()` once, re-exports `@vitrine/api` plus native-only modules (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`).
    - `apps/native/lib/api/{blocked,comps,fields,search,activity,notifications,follows,network,categories,extraction,explore,showcases,managed-rules}.ts` — replaced with shim files that import `@/lib/api` for singleton bind, then re-export from `@vitrine/api` (with type aliases where old barrel names differed, e.g. `ResolveFieldsResponse`, `getMutualFollowsV2`).
    - ~20 components updated to import domain types from `@vitrine/types` and design primitives from `@vitrine/design-tokens`.
  - **Web rewire**:
    - `apps/web/package.json` — added `@vitrine/api`, `@vitrine/constants`, `@vitrine/types` (`workspace:*`).
    - `apps/web/lib/api.ts` (new) — `getServerApi()` lazy-builds a `VitrineApi` with the web Supabase client + console logger.
    - `apps/web/app/s/s/[id]/page.tsx` — share resolver migrated to `getServerApi().showcases.getShowcaseById(id)`.
- Validation:
  - `pnpm install` clean.
  - `pnpm --filter @vitrine/api exec tsc --noEmit` → 0 errors.
  - `pnpm --filter @vitrine/web build` → all 12 routes build.
  - `pnpm --filter @vitrine/native exec tsc --noEmit` → 125 errors (down from 137 pre-Day-2 baseline; all remaining errors are pre-existing in legacy components, not introduced by this work).
- Notes:
  - The factory pattern was chosen over a global `setSupabaseClient(...)` mutator because it (a) makes the API trivially testable with a mock Supabase client and (b) lets the web side spin up a per-request client without polluting native singleton state.
  - `bindToSingleton()` is the bridge that keeps the native app's hundreds of legacy `import { ... } from '@/lib/api/...'` call sites working unchanged. Long-term the plan is to migrate native call sites to the API instance directly, but that's a separate sweep.
  - `notifications` and `extraction` were the only modules that needed env injection; everything else is purely supabase + logger.
  - `managed-rules` stayed a pure module (no factory) because it has zero Supabase dependency and is also mirrored on the Edge Function side.
  - Web's collectible (`/s/c/[id]`) and profile (`/s/p/[id]`) share resolvers still use direct Supabase queries because the underlying data needs `collectibles` / `auth` modules that remain native-only. Migrating those is a Day 3 item.

## 2026-05-10 - Remove Onboarding Quiz: Simplify Auth Flow to Profile Completion Only

- Summary: Removed the multi-step onboarding quiz (usage intents → collectible type interests → marketplace personality) that was designed to feed a social feed home screen that no longer exists. The quiz data had zero consumers — `getUserPreferences` and `getOnboardingStatus` were defined but never called. The only downstream use of onboarding was `onboarding_completed_at IS NOT NULL` as a "real user" filter in RPCs. Solution: set `onboarding_completed_at` at the end of profile completion, remove the onboarding gate from auth routing, delete all quiz code and DB tables. Auth flow is now: Login/Signup (email OTP) → Complete Profile (name, username, email → optional avatar/bio) → Tabs.
- Files Changed:
  - `app/complete-profile/index.tsx` — added `markOnboardingComplete()` helper that sets `onboarding_completed_at` on the user row; called from both `handleFinishProfile` and `handleSkipFinish`.
  - `lib/contexts/auth-context.tsx` — removed `onboardingRequired` from `ProfileStatus`, removed `markOnboardingComplete` from context, removed `/onboarding` routing gate.
  - `lib/supabase.ts` — `checkProfileStatus` no longer returns `onboardingRequired`.
  - `lib/api/auth.ts` — `getProfileStatus` no longer selects `onboarding_completed_at`; `ProfileStatus` type updated.
  - `components/nav-menu.tsx` — removed "Onboarding (TEST)" from dev test links.
  - `supabase/migrations/20260510000000_drop_onboarding_quiz_tables.sql` (new) — drops `user_usage_intents`, `user_marketplace_preferences`, `user_type_interests`.
  - **Deleted**: `app/onboarding/index.tsx`, `components/onboarding.tsx`, `lib/api/user-preferences.ts`.
- Validation: All lints clean on edited files. Grep confirms zero remaining references to `onboardingRequired`, `saveOnboardingPreferences`, or `user-preferences` imports. `onboarding_completed_at` still used correctly in `lib/api/search.ts`, `lib/api/explore.ts`, and RPC migrations. Migration applied manually via Supabase Dashboard SQL Editor.
- Notes: The `users.onboarding_completed_at` column is intentionally kept — it gates "real user" visibility in search/explore/suggested RPCs. If personalized discovery is needed later, collect preferences in-context rather than a gated quiz at signup.

## 2026-05-08 - Upload Flow Polish: Capture Sheet + Review Redesign + FramedHero Extraction + Theater Tuning

- Summary: Comprehensive polish pass on the AI upload flow following the prior session's async pipeline + Looking Glass HUD work. Five major deliverables: (1) **Capture screen UX** — added an `ActionSheet` (Take Photo / Choose from Library) on empty-tile tap so collectors can shoot in-hand instead of the library-only flow; added camera permission handling with deep-link to Settings on denial. (2) **Keyboard avoidance** — wrapped both Scan and Review steps in `KeyboardAvoidingView` using the proven `vault/rapid-fire-edit.tsx` pattern (`offset={0}` + ScrollView + docked footer); first attempt with `offset={insets.top + 62}` was wrong because RN's KAV offset compensates for native chrome RN can't measure, not for in-layout headers. (3) **Review screen redesign** — extracted `FramedHero` from `details-lens.tsx` into a shared `components/detail/framed-hero.tsx` (Path A — single source of truth, no inline copy), and added a fullscreen tap-to-zoom **lightbox** with paginated swipe + counter + X-to-close. Both DetailsLens and the upload Review now share the exact same hero component, giving collectors a 1:1 preview of the production surface. Removed "Identified" + classification breadcrumb, replaced single-image identity card with `FramedHero` carousel, moved trait pills above title (matching DetailsLens order), folded "Needs review" badge into the confidence hint card. (4) **Inline editable listing copy** — title and description now render as `InlineEditableField` components (always-on `TextInput` styled to look like display text + always-visible `Pencil` icon + focus chrome + counter on focus). Edits flow through new `listingEdits` state and the commit step, separate from the rapid-fire `fieldEdits` queue. Title is multiline-with-newlines-stripped to support visual wrap without semantic line breaks. Char caps tightened from initial 120/600 to **90/420** based on observed max in `john@myvitrine.app`'s 529 production collectibles (max title 86, max desc 418). Capture screen context input also unified to `LISTING_TITLE_MAX` (90, was 180) for consistency. (5) **Theater easing rebalance** — unified all three concurrent animations (progress ring, image reveal opacity, sharp-fade blur removal) on `Easing.inOut(Easing.quad)`. Previously the ring used `Easing.out(Easing.quad)` (front-loaded sprint) while images used `Easing.inOut(Easing.cubic)` (dramatic mid-burst), making the screen feel rushed and uncoordinated. Also fixed `ANALYZING` text in the ring being invisible — was `textTertiary` (#5c5c5c, blended into both backdrop and reveal image), bumped to `textPrimary` (#f0f0f0). Visual hierarchy preserved by 32pt vs 10pt size gap.
- Files Changed:
  - **New shared component**:
    - `components/detail/framed-hero.tsx` (new) — extracted from DetailsLens with new Lightbox subcomponent. `enableLightbox` prop defaults true; consumers can opt out.
  - **Detail lens (modified)**:
    - `components/detail/lenses/details-lens.tsx` — imports shared `FramedHero`, removed ~70 lines of inline carousel + 8 orphaned styles. Auto-inherits the new lightbox.
  - **Upload entry (extensive)**:
    - `components/upload-entry.tsx` — capture sheet (`openPhotoSourceSheet` + `pickFromCamera` + `pickFromLibrary`), review redesign (`InlineEditableField` component, `listingEdits` state, FramedHero integration, KAV wrapping, removed identity card overlay + "Identified" header), `LISTING_TITLE_MAX`/`LISTING_DESCRIPTION_MAX` constants (90/420), theater easing unified to `Easing.inOut(Easing.quad)` in 3 places, `ANALYZING` color fix (`textTertiary` → `textPrimary`), context input cap unified, dropped unused `AdaptiveImage` import + orphaned `featuredPhoto` local + ~80 lines of orphaned identity-card styles.
  - **Future ideas (modified)**:
    - `future-ideas.md` — added "Forms & Keyboard Polish — Migrate to `react-native-keyboard-controller`" section with rationale, what we'd unlock, why deferring (Expo Go), migration plan.
- Validation: All lints clean across `components/upload-entry.tsx`, `components/detail/framed-hero.tsx`, `components/detail/lenses/details-lens.tsx`. Char caps grounded in real production data via Supabase MCP query against john@myvitrine.app's 529 collectibles. Pattern parity with `vault/rapid-fire-edit.tsx` confirmed for keyboard handling.
- Notes:
  - The `FramedHero` lightbox is V1 — no pinch-to-zoom yet (would need `react-native-gesture-handler` integration). Both deps are already installed if/when we want to add it.
  - Title is `multiline={true}` with newline-stripping in `onChange` because RN `TextInput` only wraps when multiline is true; semantically the title is still single-line.
  - `listingEdits` is intentionally separate from `fieldEdits` because copy edits are conceptually different from schema atom edits — see DECISION_LOG entry "Listing copy edits inline, schema atoms via rapid-fire."
  - The keyboard offset fix applies a learning from this session: RN's `KeyboardAvoidingView.keyboardVerticalOffset` is meant to compensate for *native chrome RN can't measure* (e.g., `react-navigation`'s native stack header), NOT for in-layout headers. For surfaces with `headerShown: false` and an in-layout header, offset should be `0`.

## 2026-05-06 - filter_traits Rewire: Comps V3 + Filter Sheets + Market RPC + Managed Showcase V2 Grammar

- Summary: Comprehensive rewire of search, filter, comps, and managed showcase systems to leverage the new `filter_traits` JSONB column on the `collectibles` table. Four major deliverables: (1) Comps Scoring V3 — `get_collectible_comps` and `get_tracked_comps` RPCs rewritten with weighted `filter_traits` + `traits` array matching (Subject:5, ItemType:4, Trait:4, Franchise:2, Year:1, Maker:1, Serial:1, Finish:1), graceful degradation for items lacking `filter_traits`, GIN indexes. (2) Filter Sheet overhaul — new `EntitySearchInput` token/tag component for scalable high-cardinality filter options (people, teams, types), section reorganization, inline toolbar clear buttons, simplified value slider. Applied to both Collection and Market surfaces. (3) Market RPC enhancement — `browse_market_v2` rewritten to prefer `filter_traits.subject` and `filter_traits.franchise` for person/team search with fallback to `listing_title ILIKE`. (4) Managed Showcase V2 Grammar — expanded from 6 to 10 fields: added `franchise` (is_one_of/is_none_of), `item_type` (is_one_of/is_none_of), `year` (eq/gte/lte/between), `maker` (is_one_of/is_none_of). Updated rule builder UI with tag-style inputs for franchise/item_type/maker and numeric inputs for year. Edge Functions updated to select and hydrate `filter_traits`.
- Files Changed:
  - **Comps V3 (new migrations)**:
    - `supabase/migrations/20260506020000_comps_v3_filter_traits.sql` — `get_collectible_comps` V3 + `_comps_v2_legacy` fallback + GIN indexes.
    - `supabase/migrations/20260506030000_tracked_comps_v3_filter_traits.sql` — `get_tracked_comps` V3 with same scoring logic.
  - **Market RPC V3 (new migration)**:
    - `supabase/migrations/20260506040000_browse_market_v3_filter_traits.sql` — `browse_market_v2` rewrite with `filter_traits`-preferred search.
  - **API layer (modified)**:
    - `lib/api/collectibles.ts` — added `FilterTraits` type, mapped `filter_traits` in `mapRowToResponse`.
    - `lib/api/tracking.ts` — added `filter_traits` to SELECT, mapped in response.
    - `lib/api/showcases.ts` — added `filter_traits` to SELECT, mapped in `ShowcaseDetailItem`, extended `previewRuleMatches` type.
    - `lib/api/market.ts` — mapped `filter_traits` in `mapRowToMarketItem`.
    - `lib/api/comps.ts` — (consumed by existing hooks, no direct changes needed).
  - **Collection logic (modified)**:
    - `components/collectibles/collection.ts` — added `filterTraits` to `CollectionItem`, new helpers `getItemType`/`getItemPeople`/`getItemTeams` prioritizing `filter_traits`, rewired `deriveCollectionFilterOptions`/`itemMatchesCollectionFilters`/`deriveTypeFilters`.
  - **Filter UI (new + modified)**:
    - `components/collectibles/collection-filter-controls.tsx` — new `EntitySearchInput` component, section reorganization (Listing Status, Traits, People/Athletes, Teams/Franchise/IP, Collectible Type, Value), simplified `ValueRangeSlider`.
    - `components/collectibles/collection-toolbar.tsx` — inline per-button clear (X) replacing global clear-all.
    - `components/collectibles/collection-surface.tsx` — wired `onClearFilter`/`onClearSort` callbacks.
    - `components/collectibles/market-search-filter-sheet.tsx` — aligned sections, `EntitySearchInput` for types, updated placeholders.
    - `components/collectibles/index.ts` — exported `EntitySearchInput`.
  - **Comps UI (modified)**:
    - `components/detail/lenses/comps-lens.tsx` — added `StatusFilterRail` component for client-side status filtering.
  - **Managed Showcase V2 Grammar (modified)**:
    - `lib/api/managed-rules.ts` — expanded `RuleField` (4 new), `FIELD_OPS`, `FIELD_LABELS`, `EvalCollectible` (franchise/itemType/year/maker), `DbCollectibleRow` (filter_traits), both hydrators, `conditionMatches` switch.
    - `components/managed-rule-builder.tsx` — 4 new fields in `FIELD_OPTIONS`, value input cases (TagInput for franchise/item_type/maker, NumericInput for year), `TagInput` accepts `placeholder` prop, `getDefaultValue`/`needsValueReset` updated for `year`, live preview passes `filterTraits`.
    - `supabase/functions/_shared/managed-eval.ts` — mirror of all type/logic changes.
    - `supabase/functions/managed-evaluate/index.ts` — added `filter_traits` to SELECT.
    - `supabase/functions/managed-sweep-worker/index.ts` — added `filter_traits` to SELECT.
- Validation: All lints clean across all modified files. Comps RPC tested via Supabase MCP with real data. `browse_market_v2` tested with person/team searches against `filter_traits` data.
- Notes:
  - `subject` was explicitly excluded from managed showcase rules — the existing `listing_title contains` rule serves that use case better (works without `filter_traits`, more familiar to users).
  - `filter_traits` is only populated for one account currently (`d039f1eb-...`). Cross-user comps and market search improvements will become more visible as coverage scales.
  - The `EntitySearchInput` component shows top-5 suggestions by default, expands to 8 when searching, with a "No matches" empty state.
  - Inline toolbar clear buttons use `e.stopPropagation()` to avoid opening the filter/sort sheet when clearing.

## 2026-05-06 - Light/Dark Theme System + Settings V3 Overhaul + Comps Lens Polish
- Summary: Three major deliverables shipped in one session: (1) Settings V3 Overhaul — full redesign removing legacy features (Tracking Settings, Collection Defaults), wiring up Blocked Users, adding Sign Out/Delete Account with confirmations, shipping Push Notifications and Support dark, adding auto-updating app version. (2) Light/Dark/Auto theme system — dual token objects, ThemeProvider context, useTheme hook, AsyncStorage persistence, 3-state segmented control, migration of ~100 V3 components from static COLORS to dynamic theme hook. (3) Post-theme polish — BottomDock theme adaptation, Crown Jewel card background, SpatialCard overlay pinning, StatusPill/TraitPill theme-immunity with NFST inversion exception, detail screen badge reordering, and comps lens threshold + Realtor-style fallback display.
- Files Changed:
  - **Theme Infrastructure (new)**:
    - `lib/design/tokens.ts` (extended) — added `DARK_COLORS`, `LIGHT_COLORS`, `ThemeColors` type. `COLORS` = backward-compat alias.
    - `lib/design/theme-context.tsx` (new) — `ThemeProvider`, `useTheme()` hook, AsyncStorage persistence, Auto mode via `useColorScheme()`.
    - `lib/design/index.ts` (extended) — exports all theme utilities.
    - `app/_layout.tsx` (modified) — wraps app with `<ThemeProvider>`.
  - **Settings V3 (new/rewritten)**:
    - `app/settings/index.tsx` (rewritten) — V3 design, theme toggle, section navigation.
    - `components/settings-account.tsx` (rewritten) — Sign Out, Delete Account (type-username confirm).
    - `components/settings-edit-profile.tsx`, `components/settings-privacy.tsx`, `components/settings-blocked-users.tsx` (rewritten).
    - `components/settings-notifications.tsx`, `components/settings-help.tsx` (rewritten — shipped dark).
    - `components/settings-privacy-policy.tsx`, `components/settings-terms.tsx` (rewritten).
    - `supabase/functions/delete-account/index.ts` (new) — account deletion Edge Function.
    - `supabase/migrations/20260506010000_create_blocked_users.sql` (new).
    - `lib/api/blocked.ts` (new) — blocked users API.
  - **Settings V3 (deleted)**:
    - `app/settings/tracking/index.tsx`, `components/tracking-settings.tsx`, `lib/mock-tracking.ts`.
    - `app/settings/collection-defaults/index.tsx`, `components/settings-collection-defaults.tsx`.
    - `lib/mock-explore.ts`, `lib/mock-command-center.ts`, `lib/mock-feed.ts`.
  - **Theme migration (~100 files)**: All V3 components/screens migrated from static `COLORS` import to `useTheme()` hook. Key files: `components/collector-profile.tsx`, `components/bottom-dock.tsx`, `components/showcase-detail-v3.tsx`, all `components/vault/*` cards, all `components/market/*`, all `components/tracking-lenses/*`, all `components/detail/lenses/*`, `components/create-showcase.tsx`, all settings screens.
  - **Theme-immune elements**:
    - `components/vault/status-pill.tsx` (modified) — `DARK_COLORS.sheetBg` base + `inverted` prop for NFST exception.
    - `components/vault/trait-pill.tsx` (modified) — `DARK_COLORS.sheetBg` base.
    - `components/vault/spatial-card.tsx` (modified) — overlay text/badge pinned to `DARK_COLORS`.
  - **BottomDock theme**: `components/bottom-dock.tsx` (modified) — dynamic background, BlurView tint, upload button inversion.
  - **Crown Jewel**: `components/collector-profile.tsx` (modified) — `crownCard`/`crownRail` use dynamic `colors`.
  - **Comps Lens**: `components/detail/lenses/comps-lens.tsx` (modified) — 75% threshold, strong/fallback partition, Realtor-style headers, 6-item fallback cap, removed SeeAllFooter.
  - **Detail screen layout**: `components/detail/lenses/details-lens.tsx` (modified) — badge row above title, spacing adjustments. NFST `inverted` prop on detail screens.
  - **Deleted legacy**: `app/collectible/[id]/comps.tsx` (deleted) — consolidated into CompsLens.
- Validation: All lints clean. Live device testing confirmed light/dark/auto modes render correctly across all V3 surfaces. Theme toggle persists across app restarts. Comps threshold verified with real data.
- Notes:
  - Legacy screens using `@/lib/colors` remain untouched (intentional — will be deleted in a future pass).
  - Module-level constants that reference `COLORS` directly are legitimate cases (theme defaults, config objects, utility functions) and don't need migration.
  - The Metro bundler may serve stale cached versions after large migrations — `npx expo start --clear` resolves any phantom syntax errors.

## 2026-05-05 - Unified QR Code Modal with HolographicFrame
- Summary: Consolidated three separate QR code modal implementations (inline overlay in collector-profile, local QrModal in showcase-detail-v3, shared QRCodeModal in components/shared/) into a single unified V3 component with HolographicFrame treatment. The new modal uses the same animated holographic border seen on Crown Jewel and Featured Showcase cards. All five QR modal consumers across the app now render identically.
- Files Changed:
  - `components/shared/qr-code-modal.tsx` (rewritten) — V3 design system tokens, HolographicFrame wrap, dark glass card with frost divider, COPY LINK action with green confirmed state, full-width DONE close button.
  - `components/collector-profile.tsx` (modified) — removed inline QR overlay (~90 lines + 6 styles), replaced with `<QRCodeModal>`. Removed `react-native-qrcode-svg` direct import.
  - `components/showcase-detail-v3.tsx` (modified) — removed local `QrModal` component + `qrS` stylesheet (~60 lines), replaced with `<QRCodeModal>`. Removed unused `Modal` and `Platform` imports.
  - `components/collectible-detail-v3.tsx` — no changes needed (already used shared QRCodeModal, automatically inherits new design).
  - `components/trading-card-detail.tsx` — no changes needed (already used shared QRCodeModal).
  - `app/(design-lab)/collectible-detail.tsx` — no changes needed (already used shared QRCodeModal).
- Validation: Lints clean on all modified files. No remaining direct `react-native-qrcode-svg` imports outside the shared modal. All consumers verified against consistent prop interface (visible, onClose, value, title, subtitle).

## 2026-05-05 - VitrineMarkIcon replaces UploadCollectibleIcon in BottomDock
- Summary: Created a new `VitrineMarkIcon` SVG component from the Vitrine brand mark and replaced the `UploadCollectibleIcon` in the BottomDock center upload button. The brand mark now serves as the upload action icon, giving the logo presence in the app chrome.
- Files Changed:
  - `components/vault/icons/vitrine-mark-icon.tsx` (new) — React Native SVG component from user-provided SVG. Filled paths (not stroked), `size` and `color` props.
  - `components/vault/icons/index.ts` (modified) — added `VitrineMarkIcon` export.
  - `components/vault/index.ts` (modified) — added `VitrineMarkIcon` to barrel exports.
  - `components/bottom-dock.tsx` (modified) — replaced `UploadCollectibleIcon` with `VitrineMarkIcon`, size=36, removed strokeWidth (filled icon).
- Validation: Lints clean. Import chain verified (icons/index → vault/index → bottom-dock).

## 2026-05-05 - Settings entry point and QR/Share button swap
- Summary: Reorganized the profile surface buttons: Settings gear icon now lives on the DossierCard (top-right, next to Edit Profile), QR Code moved to the action button row (next to Share), and a redundant footer "SETTINGS" button was added at the bottom of the PROFILE lens scroll for discoverability.
- Files Changed:
  - `components/collector-profile.tsx` (modified) — DossierCard top-right: Settings icon for owner (was QR Code). Action row: QR Code button for owner (was Settings). Footer: new "SETTINGS" button visible to owner only. Visitor views unchanged (QR Code on DossierCard, MESSAGE in action row).
- Validation: Lints clean. Owner and visitor button permutations verified.

## 2026-05-05 - Activity Banner on PROFILE lens
- Summary: Built and wired the alive activity banner component for the PROFILE lens. When `useFeeds().unseenCount > 0`, a slide-in banner appears between the action buttons and key metrics on the PROFILE surface. Shows count label + smart summary of recent notifications (using `getVerbConfig` from activity-verbs). Tapping navigates to ACTIVITY lens. Dismiss via X button. Banner reappears when new activity arrives.
- Files Changed:
  - `components/collector-profile.tsx` (modified) — new `ActivityBanner` component with `SlideInUp`/`SlideOutUp` animation, `summarizeNotifications` helper, dismiss state, conditional rendering for owner-only. `handleNavigateToActivity` callback sets active lens to ACTIVITY. `ProfileSurface` accepts `onNavigateToActivity` prop.
- Validation: Lints clean. Test notifications seeded via temporary Edge Function verified banner renders and navigates correctly.

## 2026-05-05 - Brand color pivot: brandVolt to warm ivory
- Summary: Changed the brand accent color from neon volt (#CCFF00) to warm ivory (#E8E0D4) as part of a monochrome design philosophy shift. The design rationale: collectibles should own the color system (not the UI chrome), and a monochrome palette conveys permanence over energy — more appropriate for a collector app. The token names (`brandVolt`, `brandVoltFill`, `brandVoltBorder`) were deliberately kept for continuity even though the underlying color changed.
- Files Changed:
  - `lib/design/tokens.ts` (modified) — `brandVolt: '#E8E0D4'`, `brandVoltFill: 'rgba(232, 224, 212, 0.10)'`, `brandVoltBorder: 'rgba(232, 224, 212, 0.28)'`. Three-line change.
- Validation: Lints clean. Visual confirmation that all surfaces using brandVolt tokens automatically inherited the new color.

## 2026-05-05 - Profile-as-Home Architecture Restructure
- Summary: Eliminated the home screen entirely. Promoted the collector's profile hub to the app's landing surface at `app/(tabs)/index.tsx`. Graduated Messages from a profile hub lens (6→5 lenses) to a dedicated tab at `app/(tabs)/messages.tsx`. Removed the HUD overlay (logo/messages/notifications/menu top bar). Restructured the BottomDock: profile avatar with activity badge dot (brandVolt, driven by `useFeeds().unseenCount`) in first position, messages icon with unread count badge (semanticBlue, driven by Stream `total_unread_count`) in last position. New tab order: Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages. Updated all `/(tabs)/profile` navigation references to `/(tabs)`. Deleted 21 `components/home/*` widgets, 3 home-specific hooks/skeletons, and the HUD overlay component. Removed HUD imports from community, bulk upload, memorabilia type, and settings screens.
- Files Changed:
  - `app/(tabs)/index.tsx` (rewritten) — was home screen, now profile tab content.
  - `app/(tabs)/profile.tsx` (deleted) — merged into index.tsx.
  - `app/(tabs)/messages.tsx` (new) — dedicated messages tab wrapping MessageInboxBody.
  - `app/(tabs)/_layout.tsx` (rewritten) — removed profile screen, added messages screen.
  - `components/bottom-dock.tsx` (rewritten) — new tab order, avatar-first with BadgeDot, messages icon with CountBadge.
  - `components/collector-profile.tsx` (modified) — removed MESSAGE from LensKey and ME_PROFILE_LENSES (6→5), removed MessageInboxBody from LensPager.
  - `components/showcase-review.tsx` (modified) — route update.
  - `components/upload-entry.tsx` (modified) — route update.
  - `components/key-details-success.tsx` (modified) — route update.
  - `components/nav-menu.tsx` (modified) — route update.
  - `app/upload-trading-cards.tsx` (modified) — route update.
  - `app/(tabs)/community.tsx` (modified) — removed HUDOverlay.
  - `app/upload/bulk/index.tsx` (modified) — removed HUDOverlay.
  - `app/upload/memorabilia/[type]/index.tsx` (modified) — removed HUDOverlay.
  - `app/settings/index.tsx` (modified) — removed HUDOverlay.
  - `components/hud-overlay.tsx` (deleted).
  - `components/skeletons/home.tsx` (deleted).
  - `hooks/use-home-data.ts` (deleted).
  - `hooks/use-collection-affinity.ts` (deleted).
  - All 21 files in `components/home/` (deleted).
- Validation: Lints clean on all modified files. No remaining imports of deleted files. All `/(tabs)/profile` references updated.
- Notes:
  - The profile avatar badge uses brandVolt color (not semanticBlue like the old HUD notification dot) — this is a deliberate choice to tie the badge to the brand identity rather than a generic notification color.
  - The messages icon badge uses semanticBlue (matching the old HUD messages badge) for continuity.
  - Settings/Logout access is temporarily inaccessible — NavMenu component still exists but has no entry point. This is flagged as a deferred item.
  - `hooks/use-scroll-direction.ts` was NOT deleted — it's still used by `community-hub.tsx` and `settings/index.tsx`.

## 2026-05-05 - Market Surface V3 (Instagram-style Search & Discovery)
- Summary: Replaced the legacy search/explore tab with an Instagram-inspired three-state surface: (1) Mosaic — persistent SearchBar with inline Filter/Sort icons, horizontal chip rail (collectible types + traits), paginated 2-column grid via `browse_market_v2` RPC; (2) Drawer — recent searches (AsyncStorage-backed) shown on SearchBar focus; (3) Results — tiered search across Collectibles, Showcases, and Collectors via `search_collectors_tiered` and `search_showcases_tiered` RPCs, with ALL | Collectibles | Showcases | Collectors pill filter. Filter/Sort use existing V3 FilterSheet/SortSheet with market-specific `MarketSearchFilterSheet` (Person/Character and Team/IP as free-text `listing_title contains` filters). Uses `Promise.allSettled` for graceful degradation when individual search RPCs fail. SearchBar extended with `forwardRef` and imperative `SearchBarHandle` for programmatic focus/blur. Recent searches persisted via `lib/storage/recent-searches.ts`. Multiple rounds of bug fixes: database permission grants, RPC type mismatches (`timestamptz` casting), non-existent column references (`item_count` on showcases), PL/pgSQL `#variable_conflict` directives, `Promise.all` → `Promise.allSettled`, ScrollView `flexGrow: 0` constraints, BottomDock occlusion padding (120px), collector navigation route fix, filter/sort object memoization, and search header redesign (Cancel button replaced with inline Filter + Sort icon buttons).
- Files Changed:
  - `components/market/market-surface.tsx` (new) — three-state orchestrator (mosaic | drawer | results), filter/sort state, recent search management.
  - `components/market/mosaic-grid.tsx` (new) — paginated 2-column FlatList using `browse_market_v2`, chip rail for type/trait filtering.
  - `components/market/search-header.tsx` (new) — persistent SearchBar with inline Filter (SlidersHorizontal) and Sort (ArrowUpDown) icon buttons, active-state brandVolt highlighting, filter count badge.
  - `components/market/search-drawer.tsx` (new) — recent searches list with per-item delete, shown on SearchBar focus.
  - `components/market/search-results.tsx` (new) — tiered search results with ALL | Collectibles | Showcases | Collectors pill filter, `Promise.allSettled` for graceful degradation.
  - `components/market/collector-result-row.tsx` (new) — collector search result row with avatar, display name, username, item count, tracking overlap.
  - `components/market/showcase-result-row.tsx` (new) — showcase search result row with thumbnails, title, item count, owner info.
  - `components/collectibles/market-search-filter-sheet.tsx` (new) — market-specific FilterSheet with Person/Character and Team/IP free-text inputs (listing_title contains pattern).
  - `components/vault/search-bar.tsx` (extended) — added `forwardRef`, `SearchBarHandle` interface with `focus()`/`blur()`, `onFocus`/`onBlur` props.
  - `components/vault/index.ts` (extended) — exports `SearchBarHandle` type.
  - `lib/storage/recent-searches.ts` (new) — AsyncStorage-backed recent search helper with `addRecentSearch`, `getRecentSearches`, `removeRecentSearch`, `clearRecentSearches`.
  - `lib/api/explore.ts` (extended) — market browse/search API wrappers.
  - `supabase/migrations/20260505030000_browse_market_v2.sql` (new) — `browse_market_v2` RPC with chip filtering, sort options, offset pagination, `created_at AT TIME ZONE 'UTC'` cast.
  - `supabase/migrations/20260505040000_market_search_rpcs.sql` (new) — `search_collectors_tiered` and `search_showcases_tiered` RPCs with priority-based tiering.
  - `supabase/migrations/20260505050000_grant_market_read_access.sql` (new) — permanent GRANT SELECT on `view_counters` and `collectibles_unified` for authenticated/anon roles.
  - `components/market/toolbar.tsx` (deleted) — functionality merged into search-header.
- Validation: RPCs deployed and tested via Supabase MCP. Multiple rounds of live-device testing with user feedback. Lints clean on all modified files. `Promise.allSettled` verified: individual RPC failures no longer blank the entire results surface.
- Notes:
  - Search header uses inline Filter/Sort icons (no Cancel button) — "X" on the SearchBar handles clearing; blurring with empty query returns to mosaic state.
  - `browse_market_v2` supports `p_search_person` and `p_search_team` params as `listing_title ILIKE` patterns — avoids indexing full metadata while still surfacing person/team filtering.
  - `search_showcases_tiered` computes `item_count` via a CTE from `showcase_collectibles` (not a column on `showcases` table).
  - `search_collectors_tiered` provides `tracking_overlap` count for social proof in result rows.
  - Market-specific filter sheet removes descriptive hint text under Person/Character and Team/IP fields — users don't need instruction on how filters work.
  - All scrollable areas include `paddingBottom: 120` to avoid BottomDock occlusion.
  - Horizontal ScrollViews (chip rail, pill rail) use `flexGrow: 0` to prevent vertical expansion.

## 2026-05-05 - Tracking Hub V3 (four-lens redesign)
- Summary: Replaced the legacy tracking screen (summary card + flat list) with a four-lens hub: OVERVIEW | TRACKED | ACTIVITY | COMPS. Built on the same LensSelector + LensPager pattern as the profile hub. OVERVIEW is a DossierCard-anchored intelligence surface with RADAR watermark, 3-up metrics, status changes, recently tracked strip, DNA section (AssetMatrixCard, StatusBreakdownGrid, TraitMixCard), and top collectors. TRACKED reuses CollectionSurface with full view modes and spatial-card owner attribution. ACTIVITY filters Stream notifications to tracking-relevant verbs with ALL | STATUS | VALUE | COMPS chips. COMPS uses a new blended `get_tracked_comps` RPC (V2) with two quality gates: source quality floor (meaningful_field_count >= 2) and match quality floor (matched_signals >= 3 AND score_fraction >= 0.5). Each comp row attributes its source tracked item. Deep linking via `?lens=` param. HUD overlay removed from tracking tab to avoid LensSelector collision. SafeAreaView edges=['top'] for proper status bar avoidance.
- Files Changed:
  - `components/tracking-hub.tsx` (new) — main orchestrator with LensSelector (display variant), LensPager (lazy), data loading, state management, cross-lens navigation.
  - `components/tracking-lenses/overview-lens.tsx` (new) — DossierCard/RADAR, MetricCardRow, Status Changes, Recently Tracked, DNA section, Top Collectors.
  - `components/tracking-lenses/tracked-lens.tsx` (new) — CollectionSurface wrapper for tracked items.
  - `components/tracking-lenses/tracking-activity-lens.tsx` (new) — tracking-filtered activity feed with category chips.
  - `components/tracking-lenses/tracking-comps-lens.tsx` (new) — blended comps with TrackedCompRow and source attribution.
  - `components/tracking-lenses/index.ts` (new) — barrel export.
  - `hooks/use-tracked-comps.ts` (new) — data hook wrapping getTrackedComps().
  - `app/(tabs)/tracking.tsx` (updated) — mounts TrackingHub, removed HUDOverlay, added SafeAreaView, ?lens= deep linking.
  - `lib/api/tracking.ts` (extended) — `getTrackedCollectionItems()` with full AI-enriched join returning CollectionItem[] + ownerMap, `deriveTrackedOverviewStats()` for client-side metric derivation.
  - `lib/api/comps.ts` (extended) — `TrackedCompItem` interface, `mapTrackedRow()`, `getTrackedComps()` client wrapper.
  - `lib/design/activity-verbs.ts` (extended) — `TrackingChipCategory` type, `trackingCategory` field on VerbConfig, `getTrackingCategory()` helper.
  - `components/vault/spatial-card.tsx` (extended) — owner avatar overlay (ownerAvatar/ownerName on CollectibleCardData).
  - `components/collectibles/collection.ts` (extended) — ownerAvatar/ownerName on CollectionItem.
  - `supabase/migrations/20260505020000_create_tracked_comps_rpc.sql` (new) — V2 blended comps RPC with #variable_conflict use_column, Gate 1 (source quality floor), Gate 2 (match quality floor). Three tunable constants: v_min_source_fields=2, v_min_matched_signals=3, v_min_score_fraction=0.5.
- Validation: RPC deployed and tested via Supabase MCP — returns 30 comps distributed across 8 tracked sources (vs. single-source domination before quality gates). Pre-existing TS errors unrelated to new files. Lints clean on modified files.
- Notes:
  - LensSelector uses `display` variant (oversized, brandVolt active) matching the profile hub pattern.
  - Owner attribution is spatial-card-only (not grid or list cards).
  - Activity lens filters to tracking-relevant verbs only; no journal entries.
  - The Rawlings glove problem (sparse legacy items with 0 meaningful fields dominating comps) is fully solved by Gate 1.
  - Fallback comps (value-range matches when primary < 3) use src_totals not qualified_sources, so fallback still works when all sources are filtered out.

## 2026-05-05 - Managed Showcase V1 (full stack)
- Summary: Built the complete managed showcase system — Shopify smart-collection-inspired auto-updating showcases. 6-field rule grammar, 8 operators, ALL/ANY match mode. Pure TypeScript evaluator shared between client and Edge Functions. Immediate eval on rule save + incremental cron sweep (5min) + nightly full sweep. Rule builder UI with live preview, create/review integration, edit-rules route, and showcase detail updates (MANAGED badge, rules summary, Edit Rules action).
- Files Changed:
  - `supabase/migrations/20260505000000_add_managed_showcases.sql` (new) — rules columns on showcases, collectibles_last_changed_at watermark on users, AFTER trigger on collectibles.
  - `supabase/migrations/20260505010000_schedule_managed_workers.sql` (new) — pg_cron scheduling for incremental + nightly sweep.
  - `lib/api/managed-rules.ts` (new) — canonical rule evaluator: types, validation, matching, formatting, row hydration.
  - `supabase/functions/_shared/managed-eval.ts` (new) — Deno-compatible mirror of the evaluator for Edge Functions.
  - `supabase/functions/managed-evaluate/index.ts` (new) — immediate eval Edge Function.
  - `supabase/functions/managed-sweep-worker/index.ts` (new) — cron-driven sweep Edge Function (incremental + full modes).
  - `lib/api/showcases.ts` (extended) — discriminated `CreateShowcaseParams` (manual|managed), `updateShowcaseRules`, `previewRuleMatches`, `invokeManagedEvaluate`, visitor visibility filtering on `getUserShowcases`/`getShowcaseById`.
  - `lib/api/index.ts` (extended) — exports all managed-rules types and new showcase functions.
  - `components/managed-rule-builder.tsx` (new) — match mode toggle, condition stack with field/op/value controls, live preview card with count + value + thumbnails.
  - `components/create-showcase.tsx` (updated) — replaced ManagedComingSoon with ManagedRuleBuilder, wired managed draft state, updated mutual exclusion, bottom summary bar shows match count for managed mode.
  - `components/showcase-review.tsx` (updated) — handles `mode=managed` with rules param, branched create handler, rules summary in summary card.
  - `app/upload/showcase/[id]/rules.tsx` (new) — edit-rules route for existing managed showcases.
  - `components/showcase-detail-v3.tsx` (updated) — MANAGED badge, rules-summary line below title meta, "Edit Rules" in owner action sheet.
  - `components/collector-profile.tsx` (updated) — passes `viewer?.id` to `getUserShowcases` for visibility filtering.
- Validation: All lints clean. `tsc --noEmit` passes on `managed-rules.ts`. Cron jobs verified in `cron.job` table. Schema migration applied successfully.

## 2026-05-04 - Create Showcase V3 redesign
- Summary: Replaced the legacy 3-step wizard with a lens-based CURATED | MANAGED architecture. Multi-select CollectionSurface for curated, ManagedComingSoon placeholder (later replaced by rule builder) for managed. Shared review screen for both paths. Mutual exclusion logic prevents building in both modes simultaneously.
- Files Changed:
  - `components/create-showcase.tsx` (new) — lens-based create surface with LensSelector + LensPager.
  - `components/showcase-review.tsx` (new) — shared review/finalize screen.
  - `app/upload/showcase/index.tsx` (updated) — routes to new create surface.
  - `app/upload/showcase/review.tsx` (updated) — routes to review screen.
  - `components/collectibles/collection-surface.tsx` (extended) — added multi-select support via `selectedIds` + `onToggleSelect` props with brandVolt border chrome.
  - `components/vault/collectible-grid-card.tsx`, `components/vault/spatial-card.tsx`, `components/vault/collectible-list-card.tsx` (extended) — selection visual treatment.
  - Legacy `ManualShowcaseCreate`, `SmartShowcaseCreate`, `ShowcaseTypeSelect`, `ShowcaseSuccess` deleted.
- Validation: All lints clean.

## 2026-05-03 - Showcase toolbar refinement
- Summary: Removed irrelevant filter/sort controls from the Showcase surface toolbar on the profile screen. Added a "Create Showcase" CTA button visible only for user-owned profiles, taking remaining row width next to the view selector.
- Files Changed: `components/collector-profile.tsx` (showcase surface toolbar section).
- Validation: All lints clean.

## 2026-05-03 - Custom branded React Native SVG icons
- Summary: Created three custom icons: `CollectibleIcon`, `ShowcaseIcon`, `UploadCollectibleIcon`. Lucide-safe patterns with `BRAND_STROKE_SCALE` (0.45) for consistent weight. Integrated into conversations quick action bar, Activity surface, and bottom dock.
- Files Changed:
  - `components/ui/custom-icons.tsx` (new) — three branded SVG icons.
  - `components/bottom-dock.tsx` (updated) — `UploadCollectibleIcon` replaces `ScanText`, larger at 40px within circular background.
  - `components/messaging/quick-attach-bar.tsx` (updated) — `CollectibleIcon` and `ShowcaseIcon` replace generic lucide icons.
- Validation: All lints clean.

## 2026-05-02 - Network Surface V3
- Summary: Built the full Network lens replacing legacy follower/following screen. Four chips: SUGGESTED (default) | MUTUAL (visitor-only) | FOLLOWERS | FOLLOWING. 5-signal weighted suggested collectors algorithm via `suggest_collectors_for` RPC with server-side cache. Binary public/private privacy toggle. Deep linking from profile header follower/following counts.
- Files Changed:
  - `components/network/*` (new) — network lens, suggested/mutual/follower rows.
  - `supabase/migrations/` — `suggested_collectors_cache` table, `suggest_collectors_for` RPC, notification preferences table.
  - `supabase/functions/network-suggested-cache-purge/index.ts` (new) — cache invalidation Edge Function.
  - `lib/api/follows.ts` (extended) — mutual check, privacy settings.
  - `components/collector-profile.tsx` (updated) — Network lens integration, deep linking.
  - `app/profile/[id]/connections.tsx` (deleted) — legacy connections screen.
- Validation: All lints clean. RPC tested with real data. Cache round-trip verified.

## 2026-05-01 - Activity Surface V1
- Summary: Built the full Activity lens replacing the Notifications placeholder. 15 activity triggers across four chip categories (ALL | INBOX | SIGNALS | JOURNAL). Backend Edge Functions for notifications, comp alerts, view rollups, and view milestones. pg_cron scheduling for periodic workers.
- Files Changed:
  - `lib/api/activity.ts` (new) — activity feed queries.
  - `lib/api/views.ts` (new) — view recording and aggregation.
  - `components/activity/*` (new) — activity-row, journal-row, signal-row, inbox-row.
  - `supabase/functions/stream-notify/index.ts` (new/updated) — notification dispatch.
  - `supabase/functions/comp-alert-worker/index.ts` (new) — daily comp alert scan.
  - `supabase/functions/view-rollup-worker/index.ts` (new) — hourly view rollup.
  - `supabase/functions/view-milestone-checker/index.ts` (new) — milestone notification.
  - `supabase/migrations/` — views table, view_rollups, notification_preferences, pg_cron schedules.
  - `components/collector-profile.tsx` (updated) — Activity lens integration, settings.
- Validation: All lints clean. Edge Functions tested. Cron jobs scheduled and verified.

## 2026-05-01 - Profile Hub reordering to six lenses
- Summary: Reordered profile hub lenses to: PROFILE | COLLECTION | SHOWCASE | ACTIVITY | MESSAGE | NETWORK.
- Files Changed: `components/collector-profile.tsx`.
- Validation: All lints clean.

## 2026-04-30 (PM) - Showcase Detail V3 rebuild
- Summary: Replaced the legacy `ShowcaseView` with a V3 two-lens (`INFO | COLLECTION`) screen at the production route `app/showcase/[id]/index.tsx`. INFO lens is a single dossier card containing title + 3-up collage + Total Value/Showcase Size metrics + owner row (visitor FOLLOW chip / owner YOU pill) + action pair (owner: QR · SHARE; visitor: MESSAGE · SHARE) + Showcase DNA (Asset Matrix, Status Breakdown, Trait Mix). COLLECTION lens reuses the profile's `CollectionSurface` chrome scoped to the showcase items. Floating top nav with compact-title fade, owner-only `⋯` ActionSheet (Mark/Unmark Featured · Edit · Delete), native `Alert.alert` delete confirmation, haptics on lens swap and key actions. Featured showcases get a `<HolographicFrame intensity="standard">` wrap around the dossier card.
- Files Changed:
  - `components/showcase-detail-v3.tsx` (new) — main V3 screen.
  - `app/showcase/[id]/index.tsx` (rewrite) — production route now binds `ShowcaseDetailV3`.
  - `components/showcase-view.tsx` (deleted) — ~1170 LOC legacy screen.
  - `components/showcase-dna.tsx` (deleted) — superseded by `AssetMatrixCard` / `TraitMixCard` / `StatusBreakdownGrid`.
  - `components/vault/brackets.tsx` (new) — extracted bracket primitive.
  - `components/vault/dossier-card.tsx` (new) — bracketed shell + watermark glyph.
  - `components/vault/metric-card-row.tsx` (new) — N-up bracketed metric tiles, exports `metricValueTextStyle`.
  - `components/vault/asset-matrix-card.tsx` (new) — barcode-spectrum bar with legend.
  - `components/vault/status-breakdown-grid.tsx` (new) — 2-up status summary grid with progress bars.
  - `components/vault/trait-mix-card.tsx` (new) — per-trait horizontal bars (top-N, "+N more" counter).
  - `components/vault/action-sheet.tsx` (new) — cross-platform action sheet (native `ActionSheetIOS` on iOS, V3 modal on Android).
  - `components/vault/index.ts` (extended) — barrel adds the seven new primitives + their type exports.
  - `components/collectibles/collection.ts` (new) — shared `CollectionItem` type, sort keys/options, status copy, mappers (`mapToCollectionItem`, `resolveCrownJewel`, `normalizeTraitKey`, `toCardData`), formatters (`formatPrice`, `formatFilterLabel`), filter/sort derivation helpers (`itemMatchesCollectionFilters`, `sortCollectionItems`, `deriveTypeFilters`, `deriveCollectionFilterOptions`).
  - `components/collectibles/collection-surface.tsx` (new) — generic FlatList chrome (toolbar, type pills, filter/sort sheets, virtualized grid/spatial/list rendering, refresh control, crown-jewel holo framing) lifted from `collector-profile.tsx`.
  - `components/collectibles/index.ts` (extended) — re-exports collection types/helpers and `CollectionSurface`.
  - `components/collector-profile.tsx` (refactored) — now consumes the new vault primitives and `CollectionSurface` from `components/collectibles`. All inline equivalents removed; zero visual drift.
  - `lib/api/showcases.ts` (extended) — `getShowcaseById` enriched: expanded SELECT (`listing_title`, `collectible_type`, `classification`, `traits`, `ai_metadata`, `trait_metadata`), batched `getTrackCounts` enrichment, returns `items: ShowcaseDetailItem[]` (CollectionItem-shaped) plus `stats.totalValueNumeric`. Legacy `collectibles: ShowcaseDetailCollectible[]` retained for messaging vitrine-attachment preview.
  - `lib/api/index.ts` (extended) — exports `ShowcaseDetailCollectible` and `ShowcaseDetailItem` types.
- Validation: `ReadLints` passed across all touched files after each step. Manual trace of owner / visitor / featured / non-featured / small-vs-large permutations against schema.
- Notes:
  - "Straight production route" was approved up front: legacy screen removed in the same chunk as the new wiring.
  - INFO lens is allowed to scroll (~1.5 viewports). Quality of Showcase DNA section was prioritized over forced single-screen compression per user direction.
  - Showcase title placement = "Choice B" (inside the dossier card, not above the lens selector). The compact title in the floating nav appears on scroll.
  - Showcases do not use descriptions in production data (verified via Supabase MCP: `0 of 690` rows had a description). The DB column persists for backward compatibility but the UI no longer surfaces or accepts a description.
  - COLLECTION lens passes `crownJewelCollectibleId={null}` so no per-card holo competes with the dossier-level holo for featured showcases.
  - Visitor MESSAGE button routes to `/messages/new?userId=…`; the new-message screen does not yet consume `userId` to prefill, but the hook is in place (see OPEN_THREADS).
  - `Button` `variant="outline"` was attempted and corrected — that variant does not exist in `components/vault/button.tsx`. Use `'frost'` (or `'solid'` / `'ghost'`).
  - `setFeaturedShowcase` and `deleteShowcase` are wrapped in `try/catch` with `Alert.alert` user feedback (they throw `ApiException`, they don't return booleans).

## 2026-04-29 - Installed project memory system
- Summary: Added repo-local AI memory docs, AGENTS entrypoint, and Cursor rules for project memory, model routing, MCP usage, and handoff protocol.
- Files Changed: `AGENTS.md`, `docs/ai-context/*`, `.cursor/rules/*`.
- Validation: File creation verified by tool results; no product code changed.
- Notes: Thinktank synced and used as advisory source only.

## 2026-04-29 - Cleaned stale docs and artifacts
- Summary: Removed approved stale documentation, generated brainstorm artifacts, the Figma/Vite profile prototype folder, the React migration history folder, and a local Firebase export script with a hardcoded service-account path.
- Files Changed: Deleted `.superpowers/`, `temp_profile_design/`, `REACT_MIGRATION/`, `docs/superpowers/`, `scripts/firebase-export-baseball.js`, `WHITE_CUBE_REDESIGN.md`, `MIGRATION-TRACKING.md`, `docs/DESIGN_AUDIT_2026-04-10.md`, `trading-cards-edge-function-brief.md`, `BEST_PRACTICES.md`, and `WIRING_CHECKLIST.md`.
- Validation: Verified cleanup targets no longer appear in file searches.
- Notes: Product/source code cleanup was intentionally deferred until after the current design iteration.

## 2026-04-29 - Added memory-first Cursor rule
- Summary: Added an always-on Cursor rule requiring project memory to be consulted before relying on chat history.
- Files Changed: `.cursor/rules/000-memory-first.mdc`.
- Validation: File created successfully.
- Notes: Rule establishes priority order: project memory, current code, then chat context.

## Recent Context - Collector profile V3 sandbox
- Summary: `app/(design-lab)/collector-profile.tsx` has been iteratively redesigned and substantially wired to real auth, collection, follow, featured showcase, Crown Jewel, and showcase data.
- Files Changed: `app/(design-lab)/collector-profile.tsx`, related `lib/api/*`, vault components as consumed.
- Validation: Lint checks on edited screen reported no linter errors during recent changes.
- Notes: Current sandbox includes performance work, first-class filters/sort, tracking interactions, and semantic holo chrome for Crown Jewel/Featured Showcase.

## 2026-04-30 - Collector Profile V3 performance/filter/card pass
- Summary: Reworked collection rendering around virtualized lists, short-burst in-memory profile cache, pull-to-refresh, memoized derivations, first-class collection filters, and single-select sort.
- Files Changed: `app/(design-lab)/collector-profile.tsx`, `components/vault/spatial-card.tsx`, `components/vault/collectible-grid-card.tsx`, `components/vault/collectible-list-card.tsx`, `components/vault/grid-card.tsx`, `lib/api/tracking.ts`.
- Validation: Recent linter checks reported no errors on edited profile/card/auth files.
- Notes: Filter V1 covers Status, Traits, Types, Value Range, People/Athletes, Teams/Franchise/IP. Future production version should move facets/filter/sort server-side for large profiles.

## 2026-04-30 - Crown Jewel and Featured Showcase holo semantics
- Summary: Added reusable `HolographicFrame`; redesigned Crown Jewel hero; applied subtle holo treatment to Crown Jewel cards across collection card views and Featured Showcase cards across profile/showcase surfaces.
- Files Changed: `components/vault/holographic-frame.tsx`, `components/vault/index.ts`, `app/(design-lab)/collector-profile.tsx`.
- Validation: Recent linter checks reported no errors on edited files.
- Notes: Holo should stay subtle and semantic: Crown Jewel and Featured Showcase are "IYKYK" featured states, not generic decoration.

## 2026-04-30 - Crown Jewel user field/API helper
- Summary: Added optional `users.crown_jewel_collectible_id` schema field and surfaced it through user mapping/update helpers plus a setter with ownership validation.
- Files Changed: `supabase/migrations/20260430000000_add_users_crown_jewel_collectible.sql`, `lib/api/auth.ts`.
- Validation: Recent linter checks reported no errors on edited auth/profile files.
- Notes: Confirm migration application in Supabase before using the field in production routes.

## 2026-04-30 - AI Upload flow V3 rebuild
- Summary: Rebuilt the AI upload flow end-to-end around a seeded-prototype pipeline. Five steps wired: Scan (batch image picker, 180-char context, disabled-state CTA), Theater (staged AI animation landing a seeded extraction), Review (queue-to-edit pattern with Add-More-Details accordion and Complete-Extraction reward chip), Finalize (status grid, required-value gating, full-width visibility pair, showcase picker, tag chips), Success. Shipped five new canonical vault primitives and extended one.
- Files Changed:
  - `components/upload-entry.tsx` (full rewrite/extension)
  - `components/vault/action-dock.tsx` (new) — sticky-CTA primitive, sheetBg + blur + volt label, absolute-positioned, `reservedHeight()` helper for scroll padding.
  - `components/vault/input-dialog.tsx` (new) — cross-platform V3 single-input modal, replaces `Alert.prompt`.
  - `components/vault/showcase-selector-sheet.tsx` (new) — bottom-sheet multi-select with search, inline "Create new showcase" via `InputDialog`, item-count meta rows.
  - `components/vault/field-editor.tsx` (new) — type-aware input (string / number / boolean) for rapid-fire edit flows.
  - `components/vault/rapid-fire-edit.tsx` (new) — slide-up full-screen modal for batched field edits. Progress pips, back/close/swipe-down dismiss, save-or-discard confirm, keyboard-aware inline footer styled to match `ActionDock`.
  - `components/vault/schema-row.tsx` (extended) — optional `onPress` / `queued` / `edited` / `editedNonce` props. Queued state uses `brandVoltBorder + brandVoltFill` (same DNA as filter chips); `edited + editedNonce` drives a one-shot 900ms volt pulse. Non-interactive callers unchanged — chrome (border, radius, overflow) only applies when `onPress` is set so the collectible detail page keeps its original row heights and hairline rhythm.
  - `components/vault/index.ts` (barrel exports updated).
- Validation: `ReadLints` passed across all touched files. Queue, edit overlay, pulse, and accordion flows traced manually end-to-end.
- Notes:
  - Seeded extraction is DB row `3c89a535-f972-4a66-8d5d-3cf9dd509ec8`. Review rendering mirrors the production `SpecsLens` on the collectible detail page 1:1 (same `jsonbToRows`, `buildAuthentications`, `SchemaRow`, `AuthenticationsLedger`).
  - Queue model uses namespaced ids (`ai:Year`, `trait:signer_name`) so the same key in both buckets stays distinct.
  - Edit overlay: `fieldEdits: { ai: {...}, trait: {...} }` applied via `applyEdits()` onto the base extraction so Review and Finalize both see user corrections without mutating the seed.
  - Showcase picker consumes real user showcases via `getUserShowcases(user.id)`. Locally-created (unpersisted) showcases prepend to the list with `local-${ts}` ids and survive through the commit step.
  - Value required gating: `valueRequired = status !== 'NFST'`; `valueMissing = valueRequired && !(parseFloat(value) > 0)`. `0`, `0.00`, blank, and non-numeric all fail. Default after extraction is `'0.00'` (not the seed value) — collectors should consciously set an asking price.
  - Confidence banner renders when `extraction.confidence !== 'high'`; dormant on the current seed (`'high'`). Flip `SEED.confidence` to `'medium'` to preview.
