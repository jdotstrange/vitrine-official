# Current State

Last updated: 2026-08-27
Last verified: 2026-08-27


## Current Build Phase
Active V3 redesign and feature build-out, hosted in a pnpm + Turborepo monorepo with two apps (`@vitrine/native`, `@vitrine/web`) and four shared workspace packages (`@vitrine/design-tokens`, `@vitrine/constants`, `@vitrine/types`, `@vitrine/api`). All primary native surfaces are V3. The web marketing site is now a hybrid multi-page site (10-section `/` lander plus deep `/pricing`, `/intelligence`, `/product`, plus `/login` placeholder and draft `/privacy` + `/terms` legal pages). Approaching deployment readiness with a five-lens profile hub, four-lens Tracking Hub, Instagram-style Market Surface, dedicated Messages tab, V3 Settings, Light/Dark/Auto theme system, and extensive backend infrastructure (Edge Functions, cron jobs, RPC functions).

## Current Priority
**2026-08-27 — Security Wave 2 applied (storage policies).** Writes on `collectible-images` / `user-avatars` / `message-attachments` must land under `{public.users.id}/…` (not `auth.uid()` — those never match). UPDATE policies added (Sentry upsert RLS). Migrated-tree DELETE uses collectible ownership. Branch `fix/security-storage-policies`, migration `20260827140913_lock_storage_object_policies`. SQL-only — no OTA. Next: Wave 3 RLS on writable tables.

**2026-08-27 — Admin Slice 1 spec locked.** Vault census analytics (`docs/ai-context/ADMIN_SLICE_1.md`). Collectors = ≥1 published collectible; ET ranges; Overview / People / Catalog; HIG; separate `apps/admin`. **Do not scaffold until founder kicks implementation.** Unrelated to security Wave 1 / Android soak.

**2026-08-27 — Security Wave 1 applied (DEFINER RPCs).** Shared production app DB locked: photo/cron/Firebase-dump RPCs are service_role-only; DM/unread IDOR bound to `auth.uid()`; trigger helpers reject direct RPC. Merged PR #4 (`21598f6`). SQL-only — no OTA.

**2026-08-14 — Android-first compat on `feat/android-first-compat` (not shipped).** Read-only audit found no iOS-only native packages; five product bugs would fail on first Android install. Branch implements: (1) `materializeLocalImageUri` so Android `content://` picker URIs become `file://` before the upload gate (iOS `file://` is a no-op); (2) share payload puts URL in `message` (Android ignores `url`); (3) `usePreventRemove` so hardware back uses the existing upload discard Alert; (4) `expo-clipboard` replacing removed RN `Clipboard`; (5) Android back on Settings email/delete modals; (6) image-picker `microphonePermission: false`. **`runtimeVersion` bumped `"2"` → `"3"`** (native clipboard + plugin). **Founder gate: do not cut APK until check-in.** Do not preview-OTA this onto runtime-`2` iOS IPAs. Remaining soak-only: FCM/`google-services.json`, verified App Links fingerprint, BlurView dock, Stream keyboard offset.

**2026-08-08 — Looking Glass AI_FORMAT_ERROR incident fixed (engine deploy, vitrinedb).** Root cause: `gemini-3-flash-preview` returned valid JSON with correct extractions but stochastically omitted the seven universal filter-trait keys (`subject`, `franchise`, `item_type`, `maker`, `serial_number`, `year`, `special_finish`) from `fields` or emitted them top-level; strict Zod validator in the Looking Glass engine discarded perfect extractions as `AI_FORMAT_ERROR` (user-facing "unreadable image"). ~34 jobs failed Aug 4–7 (peak 26.6% of all jobs Aug 4, all users). No engine deploy since Jul 9 — preview-model drift plus Frank's autograph-card batch (autograph overlay makes traits look redundant to the model). Raw outputs recovered from Railway worker logs. **Fix shipped** in lookingglassAI repo (`C:\Users\johnj\vitrinedb`), commit `942f4d2` on `main`, Railway worker auto-deployed successfully ~9:57 PM ET: (a) deterministic repair pass before Zod — hoists top-level filter traits into `fields` (top-level values also rescue nested nulls), backfills missing traits with defaults; (b) placement rule added to unified extraction prompts only (discovery prompts excluded); (c) `AI_FORMAT_ERROR` forensics (zod paths + raw prefix, sized to 500-char attempt-detail RPC cap) persisted to `attempt_history`. 133 engine tests pass. **Live verified:** founder re-uploaded previously-failing Blake Mazza SAGE autograph card via `john@myvitrine.app` — extracted cleanly in ~16s (job `d176e240`). **Open:** `extract-asset` edge deploy blocked — `SUPABASE_ACCESS_TOKEN` in `vitrinedb/.env.local` returns 401 (expired PAT); sync HTTP path only, production queue path (Railway worker) is deployed. Needs fresh PAT then `npx supabase functions deploy extract-asset --project-ref nhshzyktaarbknzpsvtr --no-verify-jwt`. **Monitor:** format-error rate for a day or two post-deploy (expect ~0). See OPEN_THREADS for bullion classifier decision + misleading app copy mapping.

**2026-06-22 — Boot screen + unified auth V3 + skeleton reset (OTA + git shipped).** `a0bfd8d` on `main`, **pushed to `origin/main`** (in sync). One commit absorbed ~20 days of working-tree drift (81 files). Shipped: void-continuous **boot screen** (`vitrine-boot-screen.tsx` reuses native splash PNG/bg/contain layout), **unified auth** (`auth-screen.tsx` email→OTP, deletes `login-page`/`signup-page`), dark **complete-profile**, **skeleton system reset** (new `components/skeleton/` barrel + composed skeletons, legacy deleted), `lib/profile-hub-cache.ts`, **Pro ship-dark** paywall (`PRO_SHIP_DARK` on PULSE/VAR/AAR), AAR no-signature variant, global `<KeyboardToolbar />` removed, **Supabase OTP email templates** (`supabase/templates/auth/*`, repo only). **Preview OTA** group `668da060-6c25-4a52-a8c7-1113117db615` (runtime `2`). **Production OTA NOT promoted.** **Founder manual steps:** (1) paste `email-otp.html` into Supabase Auth → Email Templates; (2) upload `icon.png` to Storage `brand-assets/logos/icon.png` (public); (3) cold-restart preview app to pick up OTA; (4) optionally promote production OTA after soak. **Battery audit** done this session (read-only) — see OPEN_THREADS for the optimization backlog.

**2026-06-02 — Edit collectible + provenance fix (OTA + git shipped).** `e83f6e4` on `main` (local, **2 commits ahead of `origin`**). Owners edit cataloged items via `UploadEntry` edit mode: metadata-only save vs photo-rerun LG staging (`reextraction_of` draft → merge). `custom_fields`, `metadata_provenance` Edited chips on Specs. Provenance reconcile clears stale markers when values match baseline after rerun. OTAs runtime `2`: preview `fd922925`, production `db889dfe`. Migration `20260602120000_*` on prod Supabase. **Founder action:** cold-restart app; soak edit + photo-rerun provenance; `git push origin main`.

**2026-06-02 — Identify-first upload + Lattice Theater (shipped prior commit).** `feb0c25`. Flow: Identify → Theater (Lattice) → Review → Catalog → Success. Preview OTA group `8e9655e9-2eff-44c4-a157-6e3446788fbb` superseded for edit flow by newer OTAs above.

**2026-05-30 — Preview runtime `2` committed; binary cut still pending** if team on runtime-`1` installs. `eas build --profile preview --platform ios` → team reinstall. No Android preview builds in EAS history.

**2026-05-27 — Upload + detail polish (superseded for upload UX by 2026-06-02 wave).** LensPager page-0 edge-back (`5d32845`) remains active. Old Theater 25s/85% ring replaced by Lattice.

**2026-05-24 — Native polish wave (evening) shipped.** The OTA pipeline that landed in the priming wave was exercised in production for the first time: four real OTAs to the `preview` channel, including a roll-forward hotfix after one shipment crashed the upload tab. Recovery turnaround was <2 minutes. Six commits, in order:
- **`299dbe4` V3 token hygiene** — assorted iOS HIG cleanup, carousel dot fix, token tidy.
- **`fd7ce61` keyboard system** — `KeyboardSafeScroll` / `KeyboardSafeSheet` / `KeyboardSafeComposer` wrapper primitives built. Android `setInputMode(SOFT_INPUT_ADJUST_RESIZE)` configured globally. `<KeyboardToolbar />` mounted globally with V3 theming. **23 input surfaces migrated** off raw `KeyboardAvoidingView` (5 V3 gap surfaces + 14 KAV surfaces + 4 sheet primitives). Now the canonical pattern.
- **`49aae14` upload state-leak fix** — `resetFlow` in `upload-entry.tsx` was leaving showcase / tag / status / visibility / value state hot across uploads. Now scrubs all of it. Showcase fetch refactored into `fetchShowcases` callback fired on mount AND via `useFocusEffect` on tab focus so the picker always reflects the current showcase list. **Selected showcases now render as removable chips** on the finalize screen (mirroring the tag UX) so users can see and dismiss selections without re-opening the picker.
- **`5e72933` dynamic photo grid + native PHPicker** — replaced the fixed 3×2 photo grid with `DraggableFlatList<GridItem>` (`numColumns={3}`, long-press lift, haptic on drag begin + each placeholder change). Grid starts with a single `+` tile and grows as photos are added. `COVER` badge anchored to photo[0]. **Reverses the prior custom-picker decision**: `components/photo-library-picker.tsx` was deleted; `pickFromLibrary` now calls `ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit, orderedSelection: true })` to use the native `PHPickerViewController`. The hang issue that drove the custom picker has not recurred with the current expo-image-picker / expo-notifications stack — but treat as an assumption (see OPEN_THREADS).
- **`553fe46` HIG-align drag visuals (CRASHED)** — bundled three experimental DFL/Reanimated features at once: a `<Animated.View layout={CurvedTransition.duration(220)}>` wrapper nested inside DFL's `ScaleDecorator`, the `enableLayoutAnimationExperimental` flag, and a `renderPlaceholder` callback. Crashed the upload tab on open. Root cause: nested layout-animation managers (`ScaleDecorator` already uses Reanimated internally) + experimental flag incompatibility with `numColumns` grid mode.
- **`cbc131b` crash hotfix** — stripped all three suspect features. Kept only the safe `colors.brandVolt` inline color swap on the drag-active border (which was the actual founder-reported issue — the legacy `#C8FA38` neon-volt hardcode was clashing against the new V3 warm-ivory palette). Drag-reorder now works without crashing. **Drop-indicator + shuffle-animation polish is deferred** to a future Layer-2 migration to `react-native-reanimated-drag-list`.

Parallel tracks:
1. **Drag-reorder Layer 2** — **DONE 2026-05-26** (`PhotoReorderGrid` on `main`, `c474d7c`–`c69300a`). **Preview distribution:** runtime `2` bump committed 2026-05-30; new preview IPA pending `eas build`. Successor: migrate V1 memorabilia photo grid to `PhotoReorderGrid` to retire DFL (see OPEN_THREADS).
2. **Upload Lane Chunks B-D** — native MyQ surface (Review + Errors tabs), single-lane upload refactor, push notifications for batch completion. The Review tab's photo reorder UI is the next consumer of `PhotoReorderGrid`. Not started.
3. **Extraction reliability** — `job-status` proxy + reconciler shipped (2026-06-02). Aug 4–7 `AI_FORMAT_ERROR` spike from `gemini-3-flash-preview` filter-trait omission fixed engine-side 2026-08-08 (`942f4d2`, Railway worker). Watch format-error rate post-deploy. `extract-asset` edge sync path deploy still blocked (expired Supabase PAT). Lattice soak on preview binary pending.
4. **Subscription Phase 1** — schema work (locked architecture in `docs/subscription/`). Not started.
5. **Native session conflict** — web sign-in logs out native app. Root cause identified (refresh token rotation + global signOut scope) but no fix applied. See OPEN_THREADS.

## What Works

### Monorepo + Shared Packages (Day 2 complete)
- pnpm + Turborepo monorepo. `apps/native` (`@vitrine/native`) + `apps/web` (`@vitrine/web`) + four shared packages.
- `@vitrine/design-tokens` — colors, typography, spacing, radii, trait/match-tier helpers. Pure TS.
- `@vitrine/constants` — share URLs, store URLs, upload limits.
- `@vitrine/types` — domain types + generated Supabase `Database` type.
- `@vitrine/api` — 12 portable Supabase modules as `createXApi()` factories. `createApi()` mega-factory composes them with cross-module deps wired (showcases ↔ notifications, follows ↔ notifications). `bindToSingleton()` + ~60 flat re-exports preserve native back-compat. Web uses `getServerApi()` per request.
- Native shim files at `apps/native/lib/api/<name>.ts` keep all legacy `@/lib/api/...` imports working unchanged.
- 5 native-only modules (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`) stay native because of Expo / RN dependencies.
- Metro config supports the monorepo (`watchFolders` + `nodeModulesPaths` + `disableHierarchicalLookup`). Includes `EMPTY_MODULES` shim for `@supabase/functions-js` and Node `fs`.

### Web Marketing Site (V3 — Multi-Page, Live)
Hybrid multi-page V3 marketing site: a tight 10-section `/` lander plus three deep pages (`/pricing`, `/intelligence`, `/product`), `/login` placeholder for the eventual web app, and draft `/privacy` + `/terms` legal pages. Restructured in 7 phases from the original single-page build (commits `marketing: phase 1` through `marketing: phase 7` in `git log`).
- **Routes (16 total)**: `/`, `/_not-found`, `/pricing`, `/intelligence`, `/product`, `/login`, `/privacy`, `/terms`, dynamic `/icon`, `/apple-icon`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, plus three share resolvers `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`. Five 308 redirects in `next.config.mjs` cover legacy URLs (`/about → /#thesis`, `/features → /product`, `/explore → /#explore`, `/contact → /#footer`, `/identity → /`). The `/pricing` legacy redirect was deleted in Phase 2 — it's a real page now.
- **`/` (home)**: SiteNav → Hero → Problem (`BEFORE VITRINE`) → Thesis (`WITH VITRINE`) → RapidFireFeatures (`HOW IT WORKS`, 12-tile collector-loop feature wall) → Intelligence (`Looking Glass AI`, VAR/AAR/Market Pulse Pro+ cards) → Explore (8 random public collectibles from `@fmazza821`, status/title/value) → FinalCTA → Footer. Lean and conversion-focused; depth lives on the deep pages.
- **`/pricing`**: PricingHero → FoundersPricingBanner ("Locked for life — first 10K Pro users pay $9.99 forever") → PricingCards (Free $0 / Pro $9.99 / Collector $24.99, monthly/annual toggle) → ViewVsGenerateSection (the "everyone views, Pro+ generates" keystone) → MarketplaceFeeMath (10% Free/Pro vs 7% Collector, tier-recommender) → ComparisonTable (collapsible full feature matrix) → PricingFAQ. All data lives in `apps/web/lib/marketing/pricing-data.ts` — single source of truth keyed to `vitrinedb/docs/pricing-model.md`.
- **`/intelligence`** (Looking Glass cornerstone deep page): IntelligenceHero ("Tell us nothing.") → MultiVerticalExamples (cards / watches / wine / coins / comics / vinyl extraction examples with field-level confidence) → BeforeAfterComparison (other apps make you fill 26 fields vs 1-photo extraction) → VARExplanation → AARExplanation → PulseLensExplanation (per-piece market intel — clarifies vs marketing-side Activity) → CompsArea (migrated from old CompsSection) → TechnicalCredibility (Gemini Flash / multi-pass / validation) → IntelligenceCTA. Data + report-card content in `apps/web/lib/marketing/intelligence-data.ts`. Shared `ReportExplanationCard` standardizes VAR/AAR/Pulse layouts.
- **`/product`** (the longest, deepest page — "we have features for days"): ProductHero (8 surfaces lined up) → CatalogArea → ShowcaseArea → TrackArea → ActivityArea (the social-signal feed for the network — formerly "Pulse" on the marketing side, renamed to eliminate the in-app-Pulse-lens collision) → ShareArea (drop a link in iMessage / `/s/c/[id]` resolvers) → TradeArea (marketplace summary + fee structure → `/pricing`) → DiscoverArea (network signals + suggested collectors) → CategoriesArea (6×6 category grid) → ProductFAQ → ProductCTA. ~11 areas total.
- **`/login`** placeholder: V3-styled "Web App Coming Soon" page with App Store + Play badges, "your collection lives in your pocket" headline, link back to home. Noindexed via metadata.
- **`/privacy` + `/terms`** drafts: shared `LegalPage` component with sticky DRAFT banner, plain-English placeholder copy flagged for legal review, structured by section (info we collect / how we use it / sharing / retention / etc. for privacy; account / content / intelligence reports / marketplace / acceptable use / billing / termination for terms). Both noindexed via metadata.
- **`robots.ts`**: `User-Agent: *  Allow: /` plus sitemap pointer to `https://vitrine.app/sitemap.xml`. No active disallow rules (the `/lab` rule was Phase 5 era and was removed in Phase 7 when `/lab` was deleted).
- **`sitemap.ts`**: includes `/`, `/pricing` (priority 0.9), `/intelligence` (0.9), `/product` (0.9), `/privacy` (0.3), `/terms` (0.3). Excludes `/login` and (now-deleted) `/lab`.
- **Footer**: `Footer.tsx` reads from `FOOTER_COLUMNS` constant. `FooterColumn.items` are now `FooterItem[] = { label, href? }`. Live links: Product → `/product`, Looking Glass → `/intelligence`, Pricing → `/pricing`, Get the app → `/#download`, Privacy → `/privacy`, Terms → `/terms`. Items without `href` (Company / Resources columns: About, Press, Careers, Contact, Help, Status, Changelog) render as muted "coming soon" text.
- **Design system**: `apps/web/app/globals.css` `:root` consumes `@vitrine/design-tokens` `DARK_COLORS` directly. Marketing vars (`--fg1/2/3`, `--frost-divider/border(-strong)`, `--brand-volt(-fill/-border)`, semantic + trait color sets, official PRO tier yellow vars, `--sheet-bg`, `--press-overlay`, `--scrim`). `apps/web/lib/marketing/tokens.ts` exports a `T` object resolving these as `T.void` / `T.volt` / `T.pro` etc.
- **Fonts**: Electrolize (display, `T.fontDisplay`), Space Grotesk (`T.fontGrotesk` for kickers/labels), Inter (`T.fontInter` body), Libre Caslon Text + italic (`T.fontCaslon` for accent italics in headlines/subtitles), JetBrains Mono (`T.fontMono` for stats/values). All via `next/font/google` in `apps/web/app/layout.tsx`.
- **Brand assets**: Canonical wordmark at `apps/web/public/logo.svg` with `fill="currentColor"`. React wrappers `apps/web/components/marketing/{VitrineLogo,VitrineMark}.tsx`. Both `VitrineMark` and the dynamic `/icon`, `/apple-icon`, `/opengraph-image` endpoints consume shared SVG path data from `apps/web/lib/marketing/brand-paths.ts`.
- **Mobile responsive**: Three-tier breakpoint layer in `globals.css`. ≤1024px (tablet), ≤768px (phone), ≤420px (small phone — new tier added in the May 12 mobile pass). Driven entirely by `data-marketing-*` attributes on section components — keeps breakpoint logic in one file. All overrides use `!important` (inline-style specificity). The home page (`/`) received a first-class mobile treatment in the May 12 pass — Hero phone mockup restored on mobile (was hidden) and scaled via CSS transform, RapidFireFeatures forced to 2-up at 768px (overrides the base 1-up), Problem brand-tile cards stay 2×2, Intelligence theater field rows collapse to label-over-value, App Store badges go full-width 50/50 grid → stacked at 420px. Decorative elements that don't translate (FinalCTA SVG line connector, Intelligence 6-stage marker bar) are hidden on mobile. Deep pages (`/pricing`, `/intelligence`, `/product`) still have only the base 2-tier mobile layer — first-class deep-page mobile treatment is open work.
- **Hamburger nav**: `MobileNav.tsx` mirrors `SiteNav.tsx` deep links. `usePathname()` for active state on both. Cross-page download CTA → `/#download`.
- **Share-resolver design**: `apps/web/components/share/share-landing.tsx` mirrors the marketing site aesthetic. Direct Supabase queries in `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]` unchanged — only the UI layer was rewritten. Mobile responsive via `data-share-*` attributes.
- **Dynamic icons + OG**: `apps/web/app/{icon,apple-icon,opengraph-image}.tsx` use `next/og` `ImageResponse` on the Edge runtime. Icon 64×64 ivory crown on void; apple-icon 180×180 same; OG 1200×630 with mark + ELECTROLIZE wordmark + headline + tagline + warm halo.
- **Key data modules** (`apps/web/lib/marketing/`):
  - `pricing-data.ts` — TIERS, FOUNDERS_PRICING, VIEW_VS_GENERATE, FEE_TABLE, COMPARISON_ROWS, PRICING_FAQS.
  - `intelligence-data.ts` — EXTRACTION_EXAMPLES (multi-vertical), BEFORE_AFTER_FIELDS, VAR_EXPLANATION, AAR_EXPLANATION, PULSE_EXPLANATION, TECH_CREDIBILITY.
  - `constants.ts` — RAPID_FIRE_TILES, KICKER_CYCLE, HERO_CATEGORIES, SCHEMAS (5 per-category schemas), CATS (38 categories), PILLARS, COLLECTORS (with new `since`/`hook`/`note` fields, no follower counts), PRESS_QUOTES (new `{quote, name, role, placeholder?}` shape with explicit `[Your name here]` slot), AUCTION_HOUSE_LOGOS, FAQS + PRODUCT_FAQS, FOOTER_COLUMNS (with hrefs), HOW_STEPS, EXPLORE_GRID, INTEL_STAGES, INTEL_CYCLE_MS, PULSE_TEMPLATES.
  - `photos.ts` — 8 Unsplash placeholder URLs (real assets pending).
  - `tokens.ts`, `hooks.ts`, `Reveal.tsx`, `Stagger.tsx`, `Parallax.tsx`, `brand-paths.ts`.
- **Key files**: `apps/web/app/**/page.tsx`, `apps/web/app/{robots,sitemap}.ts`, `apps/web/components/marketing/{MarketingSite,LegalPage,ComingSoonPage,VitrineLogo,VitrineMark}.tsx`, `apps/web/components/marketing/{sections,pricing,intelligence,product,primitives}/**`, `apps/web/lib/marketing/**`.

### Core App Infrastructure
- Expo app configuration in `apps/native/app.json`.
- Native Supabase client (`apps/native/lib/supabase.ts`) and auth helpers. Web Supabase client (`apps/web/lib/supabase.ts`).
- Stream Chat/Feeds dependencies and contexts (native).
- V3 design tokens in `@vitrine/design-tokens` with dual-theme support (`DARK_COLORS`, `LIGHT_COLORS`).
- `ThemeProvider` context + `useTheme()` hook (`apps/native/lib/design/theme-context.tsx`). Persists preference to AsyncStorage, defaults to Dark.
- Vault components in `apps/native/components/vault` exported via barrel.

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
- **BottomDock**: Dynamic background (`rgba(0,0,0,0.70)` dark / `rgba(255,255,255,0.82)` light), BlurView tint. Upload FAB: dark lifted circle (`rgba(255,255,255,0.08)`) with brandVolt logo mark in dark mode; white circle with dark mark in light mode.
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

### Edit Collectible (V3 — Live, OTA 2026-06-02)
Owners edit published cataloged items without re-uploading from scratch:
- **Entry:** Collectible detail owner menu → Edit → `app/collectible/[id]/edit.tsx` wraps `UploadEntry` with `mode="edit"` + `editCollectibleId`.
- **S0 snapshot:** On load, seeds photos, extraction, listing prefs, tags, showcases, `custom_fields`, `metadata_provenance`, provenance baseline for diffing.
- **Photo fork:** Multiset compare vs S0 — reorder-only → **Continue** (metadata-only `commitMetadataUpdate`, preserves `published_at`). Add/remove → **Rerun Looking Glass** (`createReExtractionDraft` + staging row `reextraction_of` → `commitReExtraction` merge onto original id, delete draft).
- **Review:** Same Lattice/Review UX as upload; **Update collectible** CTA; `CustomFieldsEditor` (owner fields never overwritten by LG).
- **Provenance:** `metadata_provenance` keys `ai.<field>`, `trait.<field>`, `listing_title`, `listing_description` → **Edited** chip on Specs lens (`schema-row` `userEdited`). Baseline = S0 at open (metadata-only) or fresh engine output after rerun; markers **cleared** when final matches baseline.
- **Key files:** `upload-entry.tsx`, `lib/api/collectibles.ts`, `lib/edit-collectible-helpers.ts`, `components/vault/custom-fields-editor.tsx`, `specs-lens.tsx`, migration `20260602120000_edit_collectible_custom_fields_provenance.sql`.

### Boot + Auth Funnel (V3 — Live, OTA 2026-06-22)
Void-continuous launch + unified passwordless auth, all dark:
- **Boot screen** (`components/vitrine-boot-screen.tsx`): post-splash loading state that reuses the native splash PNG, `#020202` background, and contain layout (`lib/splash-contain-layout.ts` exports `SPLASH_BG`, `SPLASH_SOURCE`, `getContainRect`) so launch→app never flashes. Hides the native splash on mount; shows only a volt progress hairline. Mounted in `app/index.tsx` while `auth.isLoading`. **Splash hide lives in the boot component, not `app/_layout.tsx`.**
- **Unified auth** (`components/auth-screen.tsx`): single email → 6-digit OTP flow, no passwords, `signInWithOtp` with `shouldCreateUser: true` for both login and signup. Matter-style email step ("What's your email?", borderless field, vault `Button`); Endel-style OTP step ("Check Your Email", Mail icon in 100px volt ring, single `TextInput` with `textContentType="oneTimeCode"` + `autoComplete` for iOS autofill + auto-submit on 6 digits). `app/login/index.tsx` renders `AuthScreen`; `app/signup/index.tsx` redirects to `/login`. **`login-page.tsx` and `signup-page.tsx` are deleted.**
- **Complete-profile** (`app/complete-profile/index.tsx`): dark V3 — `useTheme()`, vault `Button`, `SPLASH_BG`, volt accents.
- **OTP email** (`supabase/templates/auth/`): light-theme HTML (`email-otp.html`, `{{ .Token }}` / `{{ .Email }}`), subject/plain/README. **NOT OTA — Dashboard paste manual.** Logo expects `apps/native/assets/icon.png` at Storage `brand-assets/logos/icon.png` (public). Optional uploader: `supabase/scripts/upload-auth-email-icon.mjs`.
- Routing unchanged: `AuthProvider` → `/login` if no session → `/complete-profile` if incomplete → `/(tabs)` when complete.

### Skeleton System (V3 — Reset 2026-06-22)
Consolidated loading-state architecture:
- **New barrel** `components/skeleton/` — `primitives` (SkeletonRect/Circle/Group + shared pulse), `community`, `feed`, `market`, `messaging`, `stale-overlay`, `collectible-grid-layout`. Shared opacity-pulse driver in `components/vault/skeleton.tsx` (`SkeletonPulseProvider`, native-driver, no gradient shimmer).
- **Composed screen skeletons** in `components/skeletons/`: `collectible-detail`, `profile-hub`, `showcase-detail`, `tracking-overview` (plus retained `community-hub`, `group-page`).
- **Deleted:** legacy `components/{skeleton,skeleton-community,skeleton-messaging}.tsx` and dead `components/skeletons/{connections,detail,edit-profile,group-info,inbox,notifications,profile,showcase,thread,tracking,upload}.tsx`. Imports must use the new barrel.

### Pro Ship-Dark Paywall (2026-06-22)
- `lib/pro-ship-dark.ts` — `PRO_SHIP_DARK` flag + `PRO_FEATURE_COPY`. When set (or user not Pro), PULSE/VAR/AAR collectible-detail lenses render `LensPaywallCard` instead of the "coming soon" body.
- `components/vault/vitrine-pro-coming-soon-sheet.tsx` — Pro upsell sheet. AAR no-signature variant at `detail/lenses/aar-lens-no-signature.tsx`.

### Profile Hub Cache (2026-06-22)
- `lib/profile-hub-cache.ts` — module-level `Map` (45s TTL) holding the shared Collection/Showcase/Profile fetch bundle, plus `invalidateProfileHub(userId)` + `subscribeProfileHub(listener)`. `collector-profile.tsx` subscribes and refetches on invalidation after catalog/edit/delete/showcase-membership changes.

### AI Upload Flow (V3 — Live, Polished)
End-to-end wired in `components/upload-entry.tsx`:
- **Pipeline:** Identify (photos + context + owner prefs) → **Activate Looking Glass** → Theater (Lattice) → Review → **Catalog** → Success. No Finalize or Assembly steps. Real async extraction via `enqueue-extraction` + Looking Glass engine; engine `stage` polled via `job-status` proxy; row poll + webhook reconciliation as completion backstop. `complete_and_publish` trigger promotes `extracted` → `complete` but **does not publish** single-lane rows — Catalog commit sets `published_at`. **Edit mode** reuses same component with commit fork (see Edit Collectible above).
- **Identify screen:** Scrolling layout merging former Scan + Finalize. `<PhotoReorderGrid />` for photos (same primitive spec as before). Owner prefs (status, Personal Value with PRICELESS NFST placeholder, visibility, tags, showcases) collected here. Strict Analyze gate: photos + valid value when sale/trade required. Prefs written on `createDraftCollectible` at Analyze time. ActionDock: **Activate Looking Glass** (HIG 44pt floating pill).
- **State reset on focus:** `resetFlow` clears photos, showcases, tags, status, visibility, value, extraction state. Showcase list refetched via `useFocusEffect`.
- **Theater (The Lattice):** Full-bleed void stage. SVG reasoning graph choreographed to real engine `stage` (`classifying`, `routing`, `designing_schema`, `extracting`, etc.). Collectible photo is the core node; trait color blooms at verdict. Ambient loops keep 15s and 90s runs equally alive. No progress ring or fake %. Haptic tick on stage advance.
- **Review screen:** `FramedHero` carousel, trait pills, inline-editable listing copy, `SchemaRow` + `RapidFireEdit` for AI fields. ActionDock primary CTA: **Catalog** (or Make Edits when queue non-empty).
- **Success:** Deep-link to collectible. `useFocusEffect` → `resetFlow` on tab leave.
- **Variants:** Client Assembly path removed (`assembly-step.tsx` deleted). Originals uploaded at Analyze via `uploadImage`; variant strategy TBD (see OPEN_THREADS).
- **Listing copy character caps:** `LISTING_TITLE_MAX = 90`, `LISTING_DESCRIPTION_MAX = 420`.

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
- `LensSelector` + `LensPager`: swipeable lens architecture used across profile hub, showcase detail, create showcase, tracking hub, and collectible detail V3. **Page 0 gesture rule (2026-05-27):** pager claims leftward swipes only; rightward drags reserved for stack edge-back — see `lens-pager.tsx` and DECISION_LOG.
- `HolographicFrame`: semantic featured chrome for Crown Jewel, Featured Showcase, and QR Code Modal.
- `QRCodeModal` (`components/shared/qr-code-modal.tsx`): unified V3 QR modal with HolographicFrame border. Used by profile, showcase detail, collectible detail, and trading card detail.
- `KeyboardSafeScroll` / `KeyboardSafeSheet` / `KeyboardSafeComposer`: canonical input-surface wrappers built on `react-native-keyboard-controller`. 23 surfaces.
- **`PhotoReorderGrid` (`components/vault/photo-reorder-grid.tsx`)**: canonical multi-photo reorder primitive built on `react-native-reanimated-dnd@^2.0.0`. Current consumer: `upload-entry.tsx` Scan step. Future consumers: Upload Lane Chunk B (Batch Lane Review tab), eventual edit-existing-photos UI, possibly multi-image bug-report attachments. Owns the lift visual / live COVER / remove-X disable / haptics / 220ms long-press contract — do not reproduce at call sites.
- Vault primitives barrel: `components/vault/index.ts`.

## What Is Partially Implemented
- Crown Jewel detail-screen assignment/unassignment UI is not built yet.
- Total value, collection size, asset matrix, and status grid rely on fetched user collectibles.
- Profile screen is wired at the production tab route (no longer sandbox-only).

## What Is Broken Or Risky
- `app.json` name is now `MyVitrine` with confirmed bundle IDs (`com.vitrine` iOS, `com.vitrine.mobile` Android). EAS dev client replaces Expo Go.
- Supabase migrations/RLS/auth areas require caution.
- Some older docs may drift from V3 direction; verify before treating historical docs as current.
- Managed showcase Edge Functions need deployment to Supabase (`supabase functions deploy`).

## Active Files Or Areas

### Edit Collectible V3 (newest — 2026-06-02)
- `app/collectible/[id]/edit.tsx` — edit route
- `components/upload-entry.tsx` — `mode="edit"`, S0, photo fork, commit fork
- `lib/api/collectibles.ts` — `commitMetadataUpdate`, `commitReExtraction`, `computeMetadataProvenance`
- `lib/edit-collectible-helpers.ts`, `components/vault/custom-fields-editor.tsx`
- `supabase/migrations/20260602120000_edit_collectible_custom_fields_provenance.sql`

### Upload Flow V3
- `components/upload-entry.tsx` — full state machine (Identify/Theater/Review/Success/Failed). Capture sheet, KAV pattern, listingEdits state, InlineEditableField, Lattice theater, char caps.
- `components/detail/framed-hero.tsx` — shared photo carousel + lightbox. Used by Review step and CollectibleDetail DETAILS lens.
- `components/detail/lenses/details-lens.tsx` — imports shared FramedHero (no inline copy).
- `lib/api/extraction.ts` — `enqueueExtraction` (direct fetch), `pollJobStatus` (2s polling).
- `lib/api/collectibles.ts` — `createDraftCollectible`, `commitDraftCollectible` (legacy single-lane still uses commit client-side), `deleteCollectible`. Sweep functions deleted.
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
- `packages/design-tokens/src/tokens.ts` — `DARK_COLORS`, `LIGHT_COLORS`, `ThemeColors` interface (values typed as `string` to allow inter-palette assignment)
- `apps/native/lib/design/theme-context.tsx` — `ThemeProvider`, `useTheme()` hook (native-only)
- `apps/native/lib/design/index.ts` — re-exports `@vitrine/design-tokens` plus `theme-context`

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
- The **auth flow** is: Boot screen (while `auth.isLoading`) → **unified `AuthScreen`** (one email→6-digit-OTP screen for both login and signup, passwordless, `shouldCreateUser: true`) → Complete Profile (display name, username, email → optional avatar/bio) → Tabs. `app/login` renders `AuthScreen`; `app/signup` redirects to `/login`; `login-page.tsx`/`signup-page.tsx` are deleted. OTP autofill depends on the **single `TextInput`** with `oneTimeCode` — do not split into six boxes. There is **no onboarding quiz** — `onboarding_completed_at` is set at the end of profile completion. The column is still used as a "real user" filter in search/explore/suggested RPCs. The quiz tables (`user_usage_intents`, `user_marketplace_preferences`, `user_type_interests`) have been dropped.
- The app uses a **profile-as-home** architecture. The profile hub IS the landing surface at `app/(tabs)/index.tsx`. There is no separate home screen.
- The profile hub has **five lenses**: PROFILE | COLLECTION | SHOWCASE | ACTIVITY | NETWORK. Messages is a separate tab. All new profile surfaces should be lenses, not separate screens.
- **Messages** is a dedicated tab at `app/(tabs)/messages.tsx`. Navigate to messages via `/(tabs)/messages`, not via a profile lens.
- The **BottomDock** tab order is: Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages. The profile avatar shows an activity badge dot (brandVolt) when unseen feed items exist. The messages icon shows an unread count badge. The upload FAB uses `VitrineMarkIcon` (brand mark).
- **Brand color** is warm ivory (`#E8E0D4` dark / `#6B5B3E` light), not the original neon volt. Token names (`brandVolt`, `brandVoltFill`, `brandVoltBorder`) are deliberately kept for hot-swap capability. The monochrome palette lets collectibles own the color system.
- **Theming**: Import `useTheme()` from `@/lib/design` for dynamic colors. Use `DARK_COLORS` directly only for elements that must stay dark regardless of theme (image overlays, status/trait pills). The `COLORS` export is a backward-compat alias for `DARK_COLORS`.
- **EAS dev client** is the active development environment. `expo-dev-client` is installed. Native modules can be added freely; rebuild via `eas build --profile development`. JS/TSX changes still hot-reload as before. Target is v3.0.0 for App Store / Play Store.
- The **HUD overlay** (`components/hud-overlay.tsx`) has been deleted. There is no top navigation bar. Settings is accessible via gear icon on the DossierCard (top-right, owner-only) and a footer "SETTINGS" button at the bottom of the PROFILE lens scroll. QR Code and Share are paired in the action row.
- **`CollectionSurface`** is the canonical collectible grid/list. Use it (with appropriate props) rather than building new list views. Now also used by the Tracking Hub's TRACKED lens.
- **`LensSelector` + `LensPager`** is the canonical lens navigation pattern. Used by profile hub, showcase detail, create showcase, tracking hub, and **collectible detail V3**. Collectible detail uses display-variant selector as top bar with **no back chevron** — edge-back on DETAILS lens depends on `LensPager` page-0 asymmetric pan.
- The **Tracking Hub** (`components/tracking-hub.tsx`) is the tab-level orchestrator for four tracking lenses. It owns data loading, state management, and cross-lens navigation. Individual lenses live in `components/tracking-lenses/`.
- **Managed showcase rules** are evaluated by a pure TypeScript evaluator (`lib/api/managed-rules.ts`) that's shared between client and Edge Functions. If rule semantics change, update both `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` in lockstep.
- **Edge Functions** authenticate via either `SUPABASE_SERVICE_ROLE_KEY` (client-invoked) or `CRON_SECRET` (cron-invoked). Check `vault.decrypted_secrets` for cron patterns.
- For V3 UI, check existing vault components before building inline. Import tokens from `@/lib/design`, vault UI from `@/components/vault`.
- The **Market Surface** (`components/market/market-surface.tsx`) is the tab-level orchestrator for search & discovery. It manages three states (mosaic/drawer/results) and owns filter/sort state. Individual views live in `components/market/`.
- The upload flow's state machine lives in `components/upload-entry.tsx`. Changes there can break review, finalize, rapid-fire, or extraction overlay simultaneously. **Listing copy** (title/description) is edited inline via `InlineEditableField` and flows through `listingEdits` state — separate from the rapid-fire `fieldEdits` queue used for schema atoms. Listing char caps: title 90, description 420 (constants `LISTING_TITLE_MAX` / `LISTING_DESCRIPTION_MAX`). **Photo grid uses the canonical `<PhotoReorderGrid />` primitive** (`@/components/vault` → `photo-reorder-grid.tsx`, built on `react-native-reanimated-dnd@^2.0.0`); all reorder behavior (long-press 220ms, scale-1.12 lift, inner-glow + brandVolt border, live COVER, remove-X disable, haptics) is owned BY the primitive — don't reproduce it inline. The general "active / highlight / lift color values come from `useTheme()` at render time, not static `StyleSheet.create()`" rule still applies system-wide (legacy `#C8FA38` neon-volt is dead — `brandVolt` is now `#E8E0D4` dark / `#7A7168` light).
- The **`FramedHero`** component (`components/detail/framed-hero.tsx`) is the canonical photo carousel + lightbox. Shared by CollectibleDetail DETAILS lens AND the upload Review step. Changes ship to both surfaces in lockstep — keep them visually identical.
- **Comps Lens** on the collectible detail screen uses a 75% match-score threshold to separate "strong matches" from "similar value range" fallback items. Fallback items are capped at 6 and rendered with a Realtor-style explanatory header. The legacy `app/collectible/[id]/comps.tsx` screen has been deleted — all comps display is now inline in the detail lenses.
- **Settings** is accessible via the gear icon on DossierCard and the footer button on the PROFILE lens. The theme toggle lives in the settings header row (far right). Settings sub-screens are: Account (Edit Profile, Privacy, Blocked Users, Notifications) | Support (Help, Bug Report, Tickets) | Danger Zone (Sign Out, Delete Account).

## Do Not Assume
- Do not assume mock data is acceptable where wiring has already started.
- Do not assume production readiness just because the dev client renders.
- Do not assume Thinktank overrides project files.
- Do not assume Edge Functions are deployed — check `supabase functions list` first.
