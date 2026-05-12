# Handoff

Last updated: 2026-05-11
Last verified: 2026-05-11

## Session Summary
Completed Day 2 of the monorepo migration: extracted four shared `@vitrine/*` workspace packages (`design-tokens`, `constants`, `types`, `api`) from the native codebase, with a backwards-compatible singleton facade so the native app's hundreds of legacy `@/lib/api/...` import sites kept working unchanged. The web app now consumes the showcase share resolver via a typed `getServerApi()` instead of direct Supabase queries. End-to-end smoke-tested on a physical iPhone via Expo Go (sign in, browse Vault, open collectible, create manual showcase) — all four flows pass.

Two cheap close-out passes followed: (1) a Metro `fs` stub fix that unblocked the iOS bundler after `stream-chat-expo`'s transitive `mime` import surfaced post-monorepo; (2) a token-typing + jest-types pass that took the native tsc baseline from 137 (pre-Day-2) → 125 (post-Day-2) → 107.

## Current State
- pnpm + Turborepo monorepo with two apps and four shared packages.
- `apps/native` boots and runs end-to-end on Expo Go on iPhone. Both iOS and Android Hermes bundles export cleanly.
- `apps/web` builds cleanly with all 12 routes including the migrated `/s/s/[id]` showcase resolver.
- `@vitrine/api` factory + singleton facade pattern is wired and validated; cross-module deps (showcases ↔ notifications, follows ↔ notifications, env injection for notifications + extraction) all work in real flows.
- `@supabase/supabase-js` declarations now aligned across apps and packages at `^2.98.0` (runtime version `2.105.4`).

## Files Changed Recently

### New packages (Day 2)
- `packages/design-tokens/` — `@vitrine/design-tokens`. Pure TS color/typography/spacing/radii/trait/match-tier helpers.
- `packages/constants/` — `@vitrine/constants`. Share URLs, store URLs, upload limits, pagination defaults.
- `packages/types/` — `@vitrine/types`. Domain types + generated Supabase `Database` type.
- `packages/api/` — `@vitrine/api`. 12 portable Supabase modules as `createXApi()` factories, mega-factory `createApi()`, singleton facade `bindToSingleton()`, ~60 flat re-exports.

### Native rewire
- `apps/native/lib/api/index.ts` — calls `bindToSingleton()` once, re-exports `@vitrine/api` plus native-only modules.
- `apps/native/lib/api/{blocked,comps,fields,search,activity,notifications,follows,network,categories,extraction,explore,showcases,managed-rules}.ts` — replaced with shim files that re-export from `@vitrine/api` with type aliases where old barrel names differed.
- `apps/native/lib/design/index.ts` — re-exports `@vitrine/design-tokens` plus the native-only `theme-context.tsx`.
- `apps/native/metro.config.js` — added `fs` to the `EMPTY_MODULES` set so `mime` (transitively imported by `stream-chat-expo`) resolves cleanly on Hermes.
- `apps/native/package.json` — added `@vitrine/api`, `@vitrine/constants`, `@vitrine/design-tokens`, `@vitrine/types` as `workspace:*` deps; added `@types/jest` devDep; bumped `@supabase/supabase-js` declaration to `^2.98.0`.

### Web rewire
- `apps/web/lib/api.ts` (new) — `getServerApi()` lazily builds a `VitrineApi` per request.
- `apps/web/app/s/s/[id]/page.tsx` — showcase share resolver migrated to `getServerApi().showcases.getShowcaseById(id)`.
- `apps/web/package.json` — added `@vitrine/api`, `@vitrine/constants`, `@vitrine/types` as `workspace:*` deps.

### Polish
- `packages/design-tokens/src/tokens.ts` — replaced `as const` with explicit `ThemeColors` interface so palette values are `string` instead of literal hex tokens (allows reassigning colors of the same shape, e.g. `statusColor = completeColor`).

### Docs
- `docs/ai-context/MONOREPO.md` (new) — workspace layout, conventions, factory + singleton facade pattern.
- `docs/ai-context/ARCHITECTURE.md`, `API_CONTRACTS.md`, `IMPLEMENTATION_LOG.md` — reflect monorepo + shared packages.
- `README.md` — shared packages section.
- `docs/brand/` (27 files) — deleted; unused legacy from the v1 marketing repo.

## Files Deleted Recently
- `apps/native/lib/api/{blocked,comps,fields,search,activity,notifications,follows,network,categories,extraction,explore,showcases,managed-rules}.ts` — replaced with shim files (same paths, different contents).
- `docs/brand/` — entire 27-file directory.

## Incomplete Work
- **5 native-only API modules still in `apps/native/lib/api/`** (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`). These depend on Expo / RN APIs (image-manipulator, AsyncStorage, native HTTP client, expo-crypto) and stayed put deliberately. Migrating them is essentially Day 3 web-buildout work — only worth doing when web actually needs them.
- **Collectible (`/s/c/[id]`) and profile (`/s/p/[id]`) share resolvers still on direct Supabase queries.** Blocked by the 5 native-only modules above (specifically `collectibles` and `auth`). Same Day 3 dependency.
- **Web SSR Supabase client split** (`@supabase/ssr`, browser/server clients). The Day 2 plan called for this; today web still uses a single shared Supabase client wrapped by `getServerApi()`. Not needed for public share resolvers; becomes important only when web adds authenticated routes.
- **Native tsc baseline at 107 errors.** None block runtime. Largest single offender: `components/key-details/field-renderers.tsx` (31 errors — discriminated union not narrowed before property access). The rest are mostly custom component prop drift (`OptimizedImageProps`, `ButtonProps`), domain type mismatches, and tuple vs array issues. Pre-existing code rot, opportunistic to fix.
- **Edge Functions still mirror `managed-rules.ts`** instead of consuming `@vitrine/api` — would require Deno-side bundling. Day 3 deferral.
- **Web Tailwind tokens consuming `@vitrine/design-tokens` natively** — today web ports tokens to CSS vars by hand in an adapter file. Day 3 deferral.

## Validation Performed
- `pnpm install` clean.
- `pnpm --filter @vitrine/api exec tsc --noEmit` → 0 errors.
- `pnpm --filter @vitrine/web build` → all 12 routes generated.
- `pnpm --filter @vitrine/native exec tsc --noEmit` → 107 errors (down from 125 post-Day-2 baseline; was 137 pre-Day-2; no new errors introduced this session).
- `npx expo export --platform ios` → 12.6 MB Hermes bundle, no Metro resolver errors.
- `npx expo export --platform android` → 12.6 MB Hermes bundle.
- **Physical-device four-flow smoke test on Expo Go (iPhone)**: sign in, browse Vault, open collectible, create manual showcase — all pass. Confirmed by user.

## Risks And Warnings
- **Singleton facade lifecycle on native.** `bindToSingleton()` is called in `apps/native/lib/api/index.ts`. If anything in the app tries to call a flat `@vitrine/api` export *before* `@/lib/api` is first imported, you'll hit "API singleton not bound." In practice the auth context loads early enough at root that this is fine, but be careful adding any API call to a top-level module-load codepath that might run before `_layout.tsx`.
- **`fs` empty-module shim in Metro** is targeted at `mime`'s init-time `require('fs')`. If any *other* module starts importing `fs` for runtime work (rather than just declaration), the shim will silently return `{}` and break it. The shim only works because `mime`'s fs codepath is dead on mobile.
- **Native-only modules (`auth`, `collectibles`, etc.)** still import directly from `@/lib/supabase`. They cannot be moved to `@vitrine/api` without first abstracting their RN/Expo dependencies (image manipulation, AsyncStorage, native HTTP client).
- **Cross-module API deps** (showcases → notifications, follows → notifications) are wired in `createApi()`. If you add a new module that needs another module, wire it through the mega-factory rather than reaching into the singleton from a module file.
- **`docs/brand/` removed** — `apps/native/lib/icon-mapper.ts` and `apps/native/ai-upload-flow-v2.md` still reference "Brand" as a category name (collectible brand, e.g. Jordan / Topps). Those are unrelated and should not be changed.

## Next Best Task
Day 3 work. The deferred items split into three tracks — pick whichever matters most for product:
1. **Web product buildout** (`docs/VITRINE_WEB_PLAN.md`) — natural consumer of `@vitrine/api`. Would unblock the remaining native-only-module migrations as a side effect.
2. **EAS / TestFlight pipeline** (`docs/EAS_MIGRATION_PLAN.md`, `docs/TESTFLIGHT_CHECKLIST.md`) — gating any real device distribution.
3. **Product features** — Crown Jewel detail-screen assignment UI; AI upload flow QA pass (now that the device boots cleanly post-monorepo).

Pure infra Day 3 items (web Tailwind ↔ `@vitrine/design-tokens`, Edge Functions consuming `@vitrine/api`, GH Actions package boundary gates, expo-release-guardrails update) can be batched into a focused infra session whenever they become friction.

## Suggested Starter Prompt
```
/rehydrate-project-memory — then we're picking up Day 3 work. Read docs/ai-context/MONOREPO.md and the latest IMPLEMENTATION_LOG entry to understand the shared packages layout. The previous session ended with native tsc at 107 errors (clean baseline) and end-to-end working on iPhone via Expo Go. I want to start with [web buildout | EAS pipeline | Crown Jewel UI] today.
```

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — appended entry: "Day 2 Shared Packages: design-tokens, constants, types, api" covering Phases 2.1, 2.2, and 2.5.
- `MONOREPO.md` — new file. Workspace layout, factory + singleton facade pattern, conventions for adding packages and API modules.
- `ARCHITECTURE.md` — added Monorepo Layout section, split frontend architecture into native + web, added Shared API Factory + Singleton Facade pattern.
- `API_CONTRACTS.md` — replaced module list with `@vitrine/api` factory inventory plus native-only module list.
- `README.md` — shared packages table.
- `HANDOFF.md` — this file, full rewrite.
- `CURRENT_STATE.md` — added Monorepo + Shared Packages section, refreshed timestamps, updated theme system file refs.
- `OPEN_THREADS.md` — refreshed timestamps, added Day 3 deferred items thread.

## What Not To Touch
- The 5 native-only API modules (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`). They depend on RN/Expo APIs and the team accepted they stay put for now. Don't migrate them piecemeal — do it as a coordinated piece of Day 3 web work or not at all.
- The shim files in `apps/native/lib/api/*.ts`. They look trivial but are load-bearing: hundreds of legacy native call sites depend on them. Add to them, don't refactor them.
- `bindToSingleton()` — calling it more than once per process is fine (Fast Refresh re-runs are safe), but don't call it from multiple modules. The single call site is `apps/native/lib/api/index.ts`.
- The Metro `EMPTY_MODULES` set — only add to it for genuinely unreachable Node-stdlib imports, never for real RN modules.

## Proposed Updates To Watch For
- When a new shared API module is added, both `packages/api/src/index.ts` (factory + flat re-exports) AND `apps/native/lib/api/<name>.ts` (shim) need a corresponding entry. The MONOREPO.md "Adding a new API module" section documents this — keep it in sync if the convention evolves.
- If any native-only module starts being needed by web, the migration pattern is: extract the RN-specific dependency to a parameter, move the rest to `packages/api/src/modules/`, add a new flat re-export in `packages/api/src/index.ts`, replace `apps/native/lib/api/<name>.ts` with a shim.
- When web adds authenticated routes, that's the trigger to pull in `@supabase/ssr` and split the web Supabase client into browser/server. The `getServerApi()` helper in `apps/web/lib/api.ts` is the natural integration point.
