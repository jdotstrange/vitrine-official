# Monorepo Layout

Last updated: 2026-05-11
Last verified: 2026-05-11

This document describes the workspace layout, tooling, and conventions for the Vitrine monorepo. For per-feature architecture see `ARCHITECTURE.md`. For API surface see `API_CONTRACTS.md`.

## Tooling
- **Package manager**: pnpm 10+ (workspaces).
- **Build orchestrator**: Turborepo (`turbo.json`).
- **Workspace config**: `pnpm-workspace.yaml`, root `tsconfig.base.json`.
- **Node**: 20+.

## Top-level layout

```
.
├── apps/
│   ├── native/        # @vitrine/native — Expo SDK 54 + Expo Router + RN 0.81
│   └── web/           # @vitrine/web    — Next.js 16 + React 19 + Tailwind v4
├── packages/
│   ├── design-tokens/ # @vitrine/design-tokens
│   ├── constants/     # @vitrine/constants
│   ├── types/         # @vitrine/types
│   └── api/           # @vitrine/api
├── supabase/          # migrations + Edge Functions (single project, both apps)
├── docs/              # canonical specs, ai-context/, brand operating system
└── .cursor/           # repo-wide Cursor rules + AI agent configuration
```

## Apps

### `@vitrine/native` (`apps/native`)
Expo Router app. Routes under `app/`. Components under `components/`. Native-only API modules at `lib/api/*` (a mix of shim files re-exporting `@vitrine/api` and genuinely native modules — see API_CONTRACTS.md). Theme glue (`useTheme`, `ThemeProvider`) lives in `lib/design/theme-context.tsx` and re-exports `@vitrine/design-tokens`.

Calls `bindToSingleton({ supabase, logger, env })` once at module load via `lib/api/index.ts` so existing flat imports (`import { sendNotification } from '@/lib/api/notifications'`) keep working through shim files.

### `@vitrine/web` (`apps/web`)
Next.js App Router. Marketing pages plus three public share resolvers:
- `/s/c/[id]` — collectible (still direct supabase queries; depends on native-only `collectibles` module)
- `/s/p/[id]` — profile (still direct supabase queries; depends on native-only `auth` module)
- `/s/s/[id]` — showcase (uses `getServerApi().showcases.getShowcaseById(id)`)

Web uses **per-request** `VitrineApi` instances via `apps/web/lib/api.ts`'s `getServerApi()` instead of the singleton. This keeps RSC isolation intact and avoids singleton mutation across requests.

## Shared packages

### `@vitrine/design-tokens` (`packages/design-tokens`)
Pure TS, no React Native imports. Exports color tokens (`DARK_COLORS`, `LIGHT_COLORS`, `COLORS` alias), typography, spacing, radii, status helpers (`STATUS_LABELS`, etc.), trait config, comps match-tier thresholds, activity verbs.

### `@vitrine/constants` (`packages/constants`)
Cross-platform constants. App Store / Play Store URLs, share URL helpers (`buildShareUrl(type, id)`), image upload limits, pagination defaults.

### `@vitrine/types` (`packages/types`)
Type-only. Domain types (`User`, `Collectible`, `ShowcaseDetail`, `MarketItem`, `ManagedRules`, `JournalEntry`, `ListingStatus`, …) plus the generated Supabase `Database` type.

### `@vitrine/api` (`packages/api`)
Supabase API client. Two consumption styles:

**Factory style** (preferred for web RSC, edge functions, tests):
```ts
import { createApi } from '@vitrine/api';
const api = createApi({ supabase, logger, env: { supabaseUrl, supabaseAnonKey } });
await api.showcases.getShowcaseById(id);
```

Each module exports a `createXApi(supabase, logger, ...deps)` factory. The mega-factory `createApi()` composes them all and wires cross-module deps (showcases → notifications, follows → notifications) so consumers don't have to.

**Singleton style** (preferred for native, where flat function imports map onto pre-monorepo call sites):
```ts
import { bindToSingleton, sendNotification } from '@vitrine/api';
bindToSingleton({ supabase, logger, env });
await sendNotification(payload);
```

Modules that still depend on platform-only APIs (image upload via expo-image-manipulator, AsyncStorage device id, react-native components) stay in `apps/native/lib/api/` for now: `auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`. The native facade (`apps/native/lib/api/index.ts`) imports from BOTH `@vitrine/api` AND those local modules.

## Conventions

### Workspace dependencies
Use `"workspace:*"` for cross-package deps. Example:
```json
"dependencies": {
  "@vitrine/api": "workspace:*",
  "@vitrine/types": "workspace:*"
}
```

### TypeScript
- Each package owns its own `tsconfig.json` extending `tsconfig.base.json`.
- Type-checking validation: `pnpm --filter <pkg> exec tsc --noEmit`.
- Native baseline: 125 errors (all pre-existing in legacy components — do not regress).

### Adding a new shared package
1. `mkdir packages/<name>` with `package.json` (`"name": "@vitrine/<name>"`, `"type": "module"`, exports), `tsconfig.json`, `src/index.ts`.
2. Add `"workspace:*"` deps from consumer apps.
3. Run `pnpm install` from repo root.
4. Add to README.md "Shared packages" table and to this MONOREPO.md.

### Adding a new API module
1. Create `packages/api/src/modules/<name>.ts` exporting `createXApi(supabase, logger, ...deps): XApi`.
2. Wire it into `createApi()` in `packages/api/src/index.ts`.
3. Add flat re-exports to `packages/api/src/index.ts` for any methods called from native flat imports.
4. (If native call sites exist) Create a shim file at `apps/native/lib/api/<name>.ts` that does `import '@/lib/api'` (to ensure singleton bind) and re-exports the relevant symbols from `@vitrine/api`.

### Avoid
- Importing RN-only or Expo-only code from a shared package.
- Reaching for `process.env` directly inside a shared package — accept env via factory args (see `notifications`, `extraction`).
- Duplicating types across packages — domain types live in `@vitrine/types`.
- Forking design tokens — extend `@vitrine/design-tokens` instead.

## Validation matrix

| Check | Command |
|---|---|
| Install | `pnpm install` (from repo root) |
| Web build | `pnpm --filter @vitrine/web build` |
| Web type-check | `pnpm --filter @vitrine/web exec tsc --noEmit` |
| API package type-check | `pnpm --filter @vitrine/api exec tsc --noEmit` |
| Native type-check | `pnpm --filter @vitrine/native exec tsc --noEmit` |
| Native dev server | `pnpm dev:native` |
| Web dev server | `pnpm dev:web` |
