# Architecture

Last updated: 2026-05-06
Last verified: 2026-05-06

## System Overview
Vitrine is an Expo React Native app with Expo Router screens, Supabase-backed data/auth/Edge Functions/cron, Stream-backed messaging/feeds, and a V3 design system with Light/Dark/Auto theming. The app uses a profile-as-home architecture where the collector's profile hub (five lenses) is the landing surface. Messages is a dedicated tab. The HUD overlay has been removed. Shared surface components and a hybrid client/server evaluation model power the managed showcase system.

## Frontend Architecture
- Routes live under `app/`.
- Design-lab/sandbox work lives under `app/(design-lab)/`.
- Shared UI lives in `components/`.
- V3 reusable UI lives in `components/vault/` (barrel-exported via `index.ts`).
- Feature-specific components live in `components/activity/`, `components/network/`, `components/collectibles/`, `components/market/`, `components/detail/`, `components/profile/`, `components/upload/`.
- Shared cross-feature components live in `components/shared/` (e.g., `qr-code-modal.tsx`).
- Design tokens/config live in `lib/design/` (`tokens.ts`, `status-config.ts`, `trait-config.ts`, `match-tiers.ts`, `theme-context.tsx`).
- Context providers live in `lib/contexts/` (auth) and `lib/design/` (theme).
- Custom branded SVG icons live in `components/ui/custom-icons.tsx`.

## Backend Architecture
- Supabase is the primary app backend.
- `lib/supabase.ts` owns the React Native Supabase client and auth helpers.
- API modules in `lib/api/` wrap table queries and Edge Function calls.
- Supabase migrations live in `supabase/migrations/`.
- Edge Functions live in `supabase/functions/`.
- Shared Edge Function code lives in `supabase/functions/_shared/` (e.g., `managed-eval.ts`).
- `pg_cron` jobs schedule periodic Edge Function invocations via `net.http_post`.
- Vault secrets (`vault.decrypted_secrets`) store `cron_secret` and `project_url` for cron auth.

## Key Architectural Patterns

### Profile-as-Home (Five-Lens Profile Hub)
The profile hub (`collector-profile.tsx`) is the app's landing surface, mounted at `app/(tabs)/index.tsx`. It uses `LensSelector` + `LensPager` to present five swipeable lenses: PROFILE, COLLECTION, SHOWCASE, ACTIVITY, NETWORK. Messages graduated to a dedicated tab. URL params (`?lens=`, `?tab=`) enable deep linking.

### Tab Architecture
Five tabs with a custom `BottomDock` (Expo Router's native tab bar is hidden): Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages. The profile avatar shows a `BadgeDot` when `useFeeds().unseenCount > 0`. The messages icon shows a `CountBadge` with Stream Chat unread count. The HUD overlay has been removed entirely.

### Four-Lens Tracking Hub
The tracking hub (`tracking-hub.tsx`) uses the same `LensSelector` (display variant) + `LensPager` (lazy) pattern as the profile hub, with four lenses: OVERVIEW, TRACKED, ACTIVITY, COMPS. The hub owns all data loading (`getTrackedCollectionItems`, `getTrackingIds`) and distributes items, ownerMap, and trackingIds to child lenses via props. Deep linking via `?lens=` URL param. The tab route uses `SafeAreaView edges={['top']}` with no HUD overlay.

### Shared Collection Surface
`CollectionSurface` is a multi-purpose virtualized FlatList with toolbar, filter/sort sheets, and grid/spatial/list rendering. Used by the profile collection lens, showcase detail contents lens, create showcase curated picker, share-collectible picker, and **tracking hub TRACKED lens**. Supports multi-select mode via `selectedIds` + `onToggleSelect` props.

### Managed Showcase Evaluation
The managed showcase system uses a single TypeScript evaluator as the source of truth for rule semantics. This evaluator lives in `lib/api/managed-rules.ts` (client-side) and is mirrored in `supabase/functions/_shared/managed-eval.ts` (Edge Functions). Three evaluation paths exist:
1. **Client-side preview**: `previewRuleMatches()` for live preview in the rule builder (zero network round-trip).
2. **Immediate evaluation**: `managed-evaluate` Edge Function called synchronously on rule save.
3. **Cron sweep**: `managed-sweep-worker` Edge Function called by `pg_cron` (incremental every 5min, full nightly).

### Edge Function Auth Patterns
- Client-invoked functions (e.g., `managed-evaluate`): authenticate via `SUPABASE_SERVICE_ROLE_KEY` in the Authorization header.
- Cron-invoked functions (e.g., `managed-sweep-worker`, `comp-alert-worker`): authenticate via `CRON_SECRET` from Vault secrets.

### Blended Comps with Quality Gates
The `get_tracked_comps` RPC provides blended comparable sales across a user's entire tracked portfolio. Two quality gates prevent sparse items from flooding results: (1) sources must have >= 2 meaningful field values; (2) candidates must have >= 3 matched signals AND >= 50% score fraction. Each result is attributed to its best-matching tracked source item. Three tunable constants are declared at the top of the function body.

### Light/Dark Theme System
The app supports three theme modes (Light, Dark, Auto) via a `ThemeProvider` context wrapping the app at `app/_layout.tsx`. Architecture:
1. **Token layer**: `lib/design/tokens.ts` exports two static objects (`DARK_COLORS`, `LIGHT_COLORS`) with an identical `ThemeColors` interface. `COLORS` is a backward-compat alias for `DARK_COLORS`.
2. **Context layer**: `lib/design/theme-context.tsx` provides `ThemeProvider` (reads/writes AsyncStorage key `vitrine:theme-preference`, uses `useColorScheme()` for Auto mode) and `useTheme()` hook returning `{ colors, mode, resolvedMode, setMode }`.
3. **Component consumption**: V3 components call `useTheme()` and use `colors.xxx` for dynamic values. Inline styles replace `StyleSheet.create` for any color that varies by theme.
4. **Theme-immune pattern**: Components that must always render on a dark surface (e.g., `StatusPill`, `TraitPill`, `SpatialCard` overlays) import `DARK_COLORS` directly instead of using the hook.
5. **Opt-in inversion**: `StatusPill` accepts an `inverted` prop for the NFST badge on light-background detail screens.
6. **Legacy screens**: Anything still importing from `@/lib/colors` (pre-V3) is NOT themed and should not be touched until a deliberate migration pass.

### Watermark-Based Incremental Sync
The managed showcase incremental sweep uses a watermark pattern: `users.collectibles_last_changed_at` (bumped by an AFTER trigger on `collectibles`) is compared against `showcases.rules_last_evaluated_at`. Only showcases whose owner's collection changed since the last eval are re-evaluated.

### Three-State Market Surface
The market surface (`components/market/market-surface.tsx`) uses a state machine with three states: `mosaic` (default browse grid), `drawer` (recent searches on focus), `results` (tiered search). SearchBar focus/blur and query changes drive transitions. The surface owns filter/sort state and distributes it to child views. Backend uses three RPCs: `browse_market_v2` (paginated browse with chip/sort/person/team filtering), `search_collectors_tiered` (priority-based: display name → username → collection content), `search_showcases_tiered` (priority-based: title → collectible content). Uses `Promise.allSettled` so individual RPC failures don't blank the entire results surface.

## Data Flow
Client screens use auth/context hooks and `lib/api/*` helpers. Supabase Auth session persists via AsyncStorage. Public app data comes from Supabase tables/RPCs/Edge Functions, then maps into screen or vault component data shapes. Edge Functions use the Supabase admin client (`createClient` with service role key) for privileged operations.

## Key Boundaries
- Auth/session: `lib/supabase.ts`, `lib/api/auth.ts`, `lib/contexts/auth-context.tsx`.
- Collectibles: `lib/api/collectibles.ts`, AI-enriched fields, Supabase tables.
- Tracking: `lib/api/tracking.ts` (track/untrack/counts + AI-enriched collection items + overview stats), `lib/api/comps.ts` (blended tracked comps), `get_tracked_comps` RPC, `components/tracking-hub.tsx`, `components/tracking-lenses/*`.
- Showcases: `lib/api/showcases.ts`, `lib/api/managed-rules.ts`.
- Activity: `lib/api/activity.ts`, `lib/api/views.ts`, Edge Functions for notifications/alerts. `lib/design/activity-verbs.ts` defines tracking-category tagging for verb filtering.
- Network: `lib/api/follows.ts`, `suggest_collectors_for` RPC, `suggested_collectors_cache` table.
- Market/Search: `lib/api/explore.ts` (market wrappers), `components/market/*`, `lib/storage/recent-searches.ts`, `browse_market_v2`/`search_collectors_tiered`/`search_showcases_tiered` RPCs.
- Messages: `app/(tabs)/messages.tsx` (tab route), `app/messages/*` (stack routes), `components/profile-lenses/message-lens.tsx` (`MessageInboxBody`).
- Settings: `app/settings/index.tsx`, `components/settings-*.tsx`, `supabase/functions/delete-account/`, `lib/api/blocked.ts`.
- Theme: `lib/design/theme-context.tsx` (provider + hook), `lib/design/tokens.ts` (DARK_COLORS, LIGHT_COLORS).
- V3 design: `lib/design/*`, `components/vault/*`, `app/(design-lab)/design-system.tsx`.
- Release constraints: `.cursor/rules/expo-release-guardrails.mdc`.

## Preferred Patterns
- Import `useTheme()` from `@/lib/design` for dynamic colors. Only import `DARK_COLORS` directly for theme-immune elements (image overlays, always-dark pills).
- Import V3 tokens from `@/lib/design`.
- Import vault UI from `@/components/vault`.
- Use `LensSelector` + `LensPager` for any lens-based surface (profile hub, showcase detail, create showcase, tracking hub).
- Use `CollectionSurface` for any collectible grid/list display (profile, showcase, picker, tracking).
- Use composition for card variants: shells plus purpose-built meta.
- Preserve Expo Go compatibility.
- Prefer incremental wiring and visual iteration before broad refactors.
- Share evaluation logic between client and Edge Functions via mirrored modules.
- Use `pg_cron` + `net.http_post` + Vault secrets for scheduled backend work.
- Use `Promise.allSettled` when multiple independent RPCs feed different UI sections.
- Use `SearchBarHandle` ref for programmatic focus/blur rather than overlay hacks.
- Navigate to profile via `/(tabs)` (it is the index route). Navigate to messages via `/(tabs)/messages`.

## Anti-Patterns
- Forking vault components.
- Deep-importing V3 component internals where barrel exports exist.
- Hardcoding secrets or env fallback values.
- Adding native dependencies or config plugins without Expo Go review.
- Treating design-lab prototypes as production without integration checks.
- Duplicating rule evaluation logic — always use the canonical evaluator.
- Writing SQL evaluators for rules — the TypeScript evaluator is the single source of truth.
- Using `COLORS` (or `DARK_COLORS`) directly in V3 components for theme-variable properties — use `useTheme().colors` instead.
- Using `StyleSheet.create` for colors that need to vary by theme — use inline styles with hook values.

## Known Architecture Risks
- Supabase RLS/migrations can affect live data if handled carelessly.
- Edge Functions need explicit deployment (`supabase functions deploy`) after creation.
- Managed showcase evaluator is mirrored, not shared — changes must update both copies.
- `pg_cron` jobs use Vault secrets; ensure `cron_secret` and `project_url` are set in all environments.
- Existing data migration quality varies; AI-enriched fields may be cleaner for future uploads than migrated legacy rows.
- Design system is still evolving; avoid premature abstractions but extract proven reusable components.
