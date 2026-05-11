# Monorepo Structure Plan — Phase 0 Restructure

**Status:** Ready to begin. **Prerequisite for both `EAS_MIGRATION_PLAN.md` and `VITRINE_WEB_PLAN.md` execution.**
**Document version:** 1.0
**Last updated:** 2026-05-11
**Owner:** John
**Estimated effort:** ~3 days
**Drives toward:** Single `MyVitrine` monorepo containing both the native and web apps with shared packages

---

## Purpose

Captures the complete plan for restructuring Vitrine's two existing repos (`vitrinev0` for native, `vitrinemarketing` for web) into a single pnpm + turborepo monorepo. Designed to be picked up cold and executed by a single agent / session before any further EAS or web product work begins.

This is **Phase 0** — it must complete before:
- `docs/EAS_MIGRATION_PLAN.md` execution begins (which writes `eas.json`, modifies `app.json`, generates an EAS project ID — all of which should land in `apps/native/` from the start)
- `docs/VITRINE_WEB_PLAN.md` execution begins (which builds the web app inside the monorepo, importing from shared packages)

After Phase 0 completes, both downstream plans run in parallel.

---

## Why monorepo (decision context)

Decided after extended analysis. Summary of the case:

- **Atomic schema-to-types-to-UI changes** in one PR (cannot be replicated across multiple repos even with AI assistance)
- **Type-safe API contracts** across both apps via shared `packages/types` (the type system enforces correctness, not just discipline)
- **Single source of truth for design tokens** (drift is structurally impossible, not just monitored)
- **Cross-app refactoring in one operation** (rename a domain concept once, propagates atomically)
- **AI sessions get full repo context** rather than having to swap between workspaces
- **Setup cost is fixed (~3 days); ongoing cost of multi-repo grows linearly with feature work**
- **Now is the cheapest moment** — both repos are still small; restructuring later is meaningfully more work

The concerns we considered and resolved:
- **Versioning:** independent app versions are the default in monorepos via Changesets — apps are independently versioned, only shared packages have synchronized versions
- **AI mitigates multi-repo costs:** true but doesn't replace structural benefits (atomic CI, type-safe contracts, single-source design tokens)
- **EAS / Vercel monorepo support:** both have first-class support, well-documented patterns

---

## Core decisions locked in

| Decision | Value | Reasoning |
|----------|-------|-----------|
| Repo strategy | **Single monorepo** | All structural benefits, AI works better with full context |
| App count | **Two apps** (`native`, `web`) | Marketing site collapses into web Next.js project; share routes naturally bridge them |
| Repo / folder name | **`MyVitrine`** | Matches product brand; honored exactly as requested |
| Migration strategy | **Brand new GitHub repo `MyVitrine`** with fresh history; both `vitrinev0` and `vitrinemarketing` archived as v1 reference snapshots | Clean v2 kickoff; backout is trivial (legacy repos untouched); symmetric handling of both legacy codebases |
| Legacy repo handling | Both `vitrinev0` and `vitrinemarketing` **archived (read-only) on GitHub** after monorepo verified working | Snapshot tagged before archive; serves as canonical v1 reference if needed |
| Native v1 snapshot commit | **Already pushed to `vitrinev0` `main` as commit `30ce5a6`** on 2026-05-11 | Recovery point established before any restructure work begins |
| Workspace tool | **pnpm + turborepo** | Industry standard 2026; fast; well-supported by Vercel and EAS |
| Workspace package scope | **`@vitrine/*`** | Lowercase npm convention; brand-aligned; short imports |
| Vercel project | **Create new Vercel project named `vitrineweb`** pointed at `apps/web/`. John handles DNS cutover. | Clean break from legacy `vitrinemarketing` naming; fresh project URL `vitrineweb.vercel.app`; old project archived alongside old repo |
| EAS project | **Initialize fresh from `apps/native/` after Phase 0** | Project doesn't exist yet (no migration needed); `eas init` lands in correct location first time |
| Shared packages (Phase 0) | `design-tokens`, `types`, `api`, `constants`, `domain` (empty) | Standard initial extraction set |
| `supabase/` location | **Root level**, not under either app | Migrations and Edge Functions are infrastructure shared by both apps |
| `docs/` location | **Root level** | Repo-wide documentation |
| `.cursor/` location | **Root level** | Rules apply across the whole repo |

---

## Final folder structure

```
MyVitrine/                            # repo root (renamed from vitrinev0)
│
├── apps/
│   ├── native/                       # all current vitrinev0/ contents moved here
│   │   ├── app/                      # Expo Router routes
│   │   ├── components/
│   │   ├── lib/                      # native-specific only after extractions
│   │   ├── assets/
│   │   ├── scripts/
│   │   ├── content/
│   │   ├── app.json
│   │   ├── eas.json                  # created during EAS plan execution
│   │   ├── babel.config.js
│   │   ├── metro.config.js           # updated for monorepo
│   │   ├── tsconfig.json             # extends ../../tsconfig.base.json
│   │   ├── package.json              # name: "@vitrine/native", native deps only
│   │   └── ...
│   │
│   └── web/                          # all current vitrinemarketing/ contents moved here
│       ├── app/                      # Next.js App Router routes
│       ├── components/
│       ├── lib/
│       ├── hooks/
│       ├── public/
│       ├── next.config.mjs
│       ├── tailwind.config.ts (or @theme in globals.css for Tailwind v4)
│       ├── tsconfig.json             # extends ../../tsconfig.base.json
│       ├── package.json              # name: "@vitrine/web", web deps only
│       └── ...
│
├── packages/
│   ├── design-tokens/                # SHARED — single source of truth for visual tokens
│   │   ├── src/
│   │   │   ├── colors.ts             # canonical color values (ported from native lib/colors.ts)
│   │   │   ├── typography.ts         # type scale, font families
│   │   │   ├── spacing.ts            # spacing scale, radii
│   │   │   ├── motion.ts             # durations, easings
│   │   │   ├── tailwind-preset.ts    # Tailwind v4 preset for web app
│   │   │   └── index.ts              # native-friendly TS exports
│   │   ├── package.json              # name: "@vitrine/design-tokens"
│   │   └── tsconfig.json
│   │
│   ├── types/                        # SHARED — TS interfaces, generated DB types
│   │   ├── src/
│   │   │   ├── database.ts           # generated by `supabase gen types typescript`
│   │   │   ├── domain.ts             # hand-written entities: Collectible, Showcase, etc.
│   │   │   └── index.ts
│   │   ├── package.json              # name: "@vitrine/types"
│   │   └── tsconfig.json
│   │
│   ├── api/                          # SHARED — Supabase query functions
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── collectibles.ts
│   │   │   ├── market.ts
│   │   │   ├── showcases.ts
│   │   │   ├── tracking.ts
│   │   │   ├── managed-rules.ts
│   │   │   ├── extraction.ts
│   │   │   ├── client.ts             # accepts a Supabase client instance — caller-owned
│   │   │   └── index.ts
│   │   ├── package.json              # name: "@vitrine/api", peer-deps on @supabase/supabase-js
│   │   └── tsconfig.json
│   │
│   ├── constants/                    # SHARED — share domain, App Store URLs, env keys, etc.
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json              # name: "@vitrine/constants"
│   │   └── tsconfig.json
│   │
│   └── domain/                       # SHARED — pure business logic / derivations (initially empty)
│       ├── src/
│       │   └── index.ts
│       ├── package.json              # name: "@vitrine/domain"
│       └── tsconfig.json
│
├── supabase/                         # SHARED infrastructure (moved from apps/native)
│   ├── migrations/
│   ├── functions/
│   │   ├── enqueue-extraction/
│   │   ├── looking-glass-webhook/
│   │   ├── managed-evaluate/
│   │   ├── managed-sweep-worker/
│   │   ├── stream-token/
│   │   └── _shared/
│   └── config.toml
│
├── docs/                             # SHARED docs (moved from apps/native)
│   ├── ai-context/
│   │   ├── ARCHITECTURE.md
│   │   ├── CURRENT_STATE.md
│   │   ├── DECISION_LOG.md
│   │   ├── DO_NOT_BREAK.md
│   │   ├── HANDOFF.md
│   │   ├── IMPLEMENTATION_LOG.md
│   │   └── OPEN_THREADS.md
│   ├── EAS_MIGRATION_PLAN.md         # paths updated to apps/native/
│   ├── VITRINE_WEB_PLAN.md           # paths updated to apps/web/
│   ├── MONOREPO_STRUCTURE.md         # this document
│   ├── COLLECTIBLE_DETAIL_REDESIGN.md
│   ├── COMPS_ALGORITHM_SPEC.md
│   └── (other existing native docs)
│
├── .cursor/                          # rules apply across the whole repo
│   └── rules/
│       └── (existing rules, paths updated)
│
├── .github/                          # NEW — workflows for monorepo CI
│   └── workflows/
│
├── pnpm-workspace.yaml               # NEW — workspace config
├── turbo.json                        # NEW — turborepo task config
├── package.json                      # NEW — root, devDeps only
├── tsconfig.base.json                # NEW — shared TS config inherited by each package
├── .gitignore                        # updated for monorepo
├── .npmrc                            # NEW — pnpm settings
├── README.md                         # NEW — monorepo overview, dev commands
└── AGENTS.md                         # moved from native, repo-wide guidance
```

---

## Naming conventions

| Item | Convention | Examples |
|------|-----------|----------|
| Repo / folder | `MyVitrine` (PascalCase, brand-aligned) | `MyVitrine` |
| GitHub URL | `github.com/<org>/MyVitrine` | preserves redirect from `vitrinev0` |
| npm root package | `myvitrine` (lowercase) | root `package.json` `name: "myvitrine"`, `private: true` |
| Workspace package scope | `@vitrine/*` (lowercase) | `@vitrine/design-tokens`, `@vitrine/api` |
| App package names | `@vitrine/native`, `@vitrine/web` | inside `apps/*/package.json` |
| Native app display name | `MyVitrine` (per `app.json` `name` field) | what users see on their home screen |
| Brand | "Vitrine" (verbal), "MyVitrine" (App Store + Play Store listing) | continuity with existing listings |

---

## Phase 0 migration plan — day by day

### Day 1: Skeleton

Goal: brand new `MyVitrine` monorepo exists locally with both apps imported; both apps build standalone; nothing is broken; legacy repos remain 100% untouched.

1. **Create new GitHub repo** `MyVitrine` (private) under the same org/user. Empty (no README, no license — those will be added during the import).
2. **Create new local folder** `C:\Users\johnj\MyVitrine` and `cd` into it.
3. **Initialize git** in the new folder:
   ```bash
   git init
   git remote add origin https://github.com/<org>/MyVitrine.git
   ```
4. **Create top-level structure**:
   ```bash
   mkdir apps packages
   mkdir apps/native apps/web
   ```
5. **Import `vitrinev0` content into `apps/native/`** via filesystem copy (no git merge):
   - Copy all contents of `C:\Users\johnj\vitrinev0\*` into `C:\Users\johnj\MyVitrine\apps\native\` EXCEPT:
     - `.git/` (don't copy the legacy git repo)
     - `node_modules/` (will reinstall)
     - `supabase/` (going to repo root instead — copy separately)
     - `docs/` (going to repo root — copy separately)
     - `.cursor/` (going to repo root — copy separately)
     - `AGENTS.md` (going to repo root — copy separately)
   - Powershell: `Copy-Item -Path "C:\Users\johnj\vitrinev0\*" -Destination "C:\Users\johnj\MyVitrine\apps\native\" -Recurse -Force -Exclude ".git", "node_modules", "supabase", "docs", ".cursor", "AGENTS.md"`
6. **Copy shared infrastructure to repo root**:
   - `Copy-Item "C:\Users\johnj\vitrinev0\supabase" "C:\Users\johnj\MyVitrine\" -Recurse`
   - `Copy-Item "C:\Users\johnj\vitrinev0\docs" "C:\Users\johnj\MyVitrine\" -Recurse`
   - `Copy-Item "C:\Users\johnj\vitrinev0\.cursor" "C:\Users\johnj\MyVitrine\" -Recurse`
   - `Copy-Item "C:\Users\johnj\vitrinev0\AGENTS.md" "C:\Users\johnj\MyVitrine\"`
7. **Import `vitrinemarketing` content into `apps/web/`** via filesystem copy:
   - Copy all contents of `C:\Users\johnj\vitrinemarketing\*` into `C:\Users\johnj\MyVitrine\apps\web\` EXCEPT `.git/`, `node_modules/`, `.next/`
   - `Copy-Item -Path "C:\Users\johnj\vitrinemarketing\*" -Destination "C:\Users\johnj\MyVitrine\apps\web\" -Recurse -Force -Exclude ".git", "node_modules", ".next"`
8. **Create root configuration files**:
    - `pnpm-workspace.yaml`:
      ```yaml
      packages:
        - "apps/*"
        - "packages/*"
      ```
    - `turbo.json`:
      ```json
      {
        "$schema": "https://turbo.build/schema.json",
        "tasks": {
          "build": {
            "dependsOn": ["^build"],
            "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
          },
          "dev": {
            "cache": false,
            "persistent": true
          },
          "lint": {},
          "typecheck": {
            "dependsOn": ["^build"]
          }
        }
      }
      ```
    - Root `package.json`:
      ```json
      {
        "name": "myvitrine",
        "private": true,
        "scripts": {
          "dev": "turbo dev",
          "build": "turbo build",
          "lint": "turbo lint",
          "typecheck": "turbo typecheck",
          "native:dev": "turbo dev --filter=@vitrine/native",
          "web:dev": "turbo dev --filter=@vitrine/web"
        },
        "devDependencies": {
          "turbo": "^2.x",
          "typescript": "~5.9.2",
          "prettier": "^3.x"
        },
        "packageManager": "pnpm@9.x"
      }
      ```
    - `tsconfig.base.json`:
      ```json
      {
        "compilerOptions": {
          "strict": true,
          "esModuleInterop": true,
          "skipLibCheck": true,
          "forceConsistentCasingInFileNames": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "moduleResolution": "bundler",
          "module": "ESNext",
          "target": "ES2022"
        }
      }
      ```
    - `.npmrc`:
      ```
      auto-install-peers=true
      shamefully-hoist=false
      ```
9. **Update per-app `package.json`**:
    - `apps/native/package.json` — change `name` to `@vitrine/native`
    - `apps/web/package.json` — change `name` to `@vitrine/web`
10. **Update per-app `tsconfig.json`** to extend root `tsconfig.base.json`
11. **Run `pnpm install` from root** — installs all workspace packages and their deps with hoisting
12. **Verify both apps build standalone**:
    - `pnpm web:dev` — verify Next.js dev server runs
    - `pnpm native:dev` — verify Expo dev server runs (Metro)
    - Both should serve correctly. Fix any path issues that surface.
13. **Initial commits to new repo**:
    ```bash
    git add -A
    git commit -m "chore: initial monorepo structure (Phase 0 day 1)"
    git branch -M main
    git push -u origin main
    ```

### Day 2: Extract shared packages

Goal: shared packages exist, native app imports from them, web app is ready to import as it builds out.

1. **Create `packages/design-tokens/`**:
   - `package.json` with `name: "@vitrine/design-tokens"`, `main: "./src/index.ts"`, `types: "./src/index.ts"`
   - Move canonical color values from `apps/native/lib/colors.ts` → `packages/design-tokens/src/colors.ts`
   - Re-export from `apps/native/lib/colors.ts` (`export * from "@vitrine/design-tokens/colors"`) so existing native imports continue to work
   - Add typography, spacing, motion modules (port from `apps/native/lib/design/*` if present)
   - Add `tailwind-preset.ts` that exports a Tailwind v4 preset object referencing the same values
2. **Create `packages/types/`**:
   - `package.json` with `name: "@vitrine/types"`
   - Generate `database.ts` via `npx supabase gen types typescript --project-id <id> > packages/types/src/database.ts`
   - Move hand-written entity types (e.g., `Collectible`, `Showcase`, `User` interfaces) from native into `packages/types/src/domain.ts`
   - Update native imports to use `@vitrine/types`
3. **Create `packages/api/`**:
   - `package.json` with `name: "@vitrine/api"`, `peerDependencies: { "@supabase/supabase-js": "^2.x" }`
   - Move `apps/native/lib/api/*` files into `packages/api/src/`
   - Refactor each module to accept a Supabase client instance as parameter rather than importing `supabase` directly (this lets web supply its SSR client and native supply its AsyncStorage-backed client):
     ```typescript
     // packages/api/src/collectibles.ts
     import type { SupabaseClient } from '@supabase/supabase-js'
     export function createCollectiblesApi(supabase: SupabaseClient) {
       return {
         async getById(id: string) { ... },
         async list(userId: string) { ... },
         // etc.
       }
     }
     ```
   - Update native to use `createCollectiblesApi(supabase)` pattern
   - Web will adopt the same pattern as it builds out
4. **Create `packages/constants/`**:
   - `package.json` with `name: "@vitrine/constants"`
   - Move `apps/native/lib/constants.ts` shared values (App Store URLs, share domain, etc.)
   - Update both native and web imports
5. **Create `packages/domain/`** (empty stub for now):
   - `package.json` with `name: "@vitrine/domain"`
   - `src/index.ts` with a placeholder export
   - Future home for pure business logic helpers (comp matching, status derivation, validation)
6. **Run `pnpm install` and `pnpm typecheck`** from root — verify all packages resolve and types check
7. **Verify native still builds and runs** — Metro picks up the new package paths (may need watchFolders update — see Day 3)
8. **Commit** — `"chore: extract shared packages (Phase 0 day 2)"`

### Day 3: CI / deploy / tooling

Goal: CI/CD is monorepo-aware, both deploy targets work, tooling is updated.

1. **Update Metro config for monorepo** (`apps/native/metro.config.js`):
   ```javascript
   const { getDefaultConfig } = require('expo/metro-config');
   const path = require('path');

   const projectRoot = __dirname;
   const monorepoRoot = path.resolve(projectRoot, '../..');

   const config = getDefaultConfig(projectRoot);

   config.watchFolders = [monorepoRoot];
   config.resolver.nodeModulesPaths = [
     path.resolve(projectRoot, 'node_modules'),
     path.resolve(monorepoRoot, 'node_modules'),
   ];
   config.resolver.disableHierarchicalLookup = true;

   // Preserve the Hermes/@supabase/functions-js workaround
   config.resolver.alias = {
     '@': projectRoot,
   };
   const originalResolveRequest = config.resolver.resolveRequest;
   config.resolver.resolveRequest = (context, moduleName, platform) => {
     if (moduleName === '@supabase/functions-js') {
       return { type: 'empty' };
     }
     return originalResolveRequest
       ? originalResolveRequest(context, moduleName, platform)
       : context.resolveRequest(context, moduleName, platform);
   };

   module.exports = config;
   ```
2. **Create new Vercel project**:
   - Vercel dashboard → Add New → Project
   - Import the new `MyVitrine` GitHub repo
   - Project name: `vitrineweb` (replaces legacy `vitrinemarketing` naming; deploys at `vitrineweb.vercel.app`)
   - Framework preset: Next.js
   - Root Directory: `apps/web`
   - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
   - Build Command: `cd ../.. && pnpm build --filter=@vitrine/web`
   - Output Directory: `.next` (default)
   - Environment Variables: copy from the legacy `vitrinemarketing` Vercel project (Supabase URL, anon key, any others)
   - Trigger initial deploy from the `feat/monorepo-phase-0` branch first; verify the build succeeds and the deployed preview serves the marketing site correctly
   - **John handles DNS cutover** for `myvitrine.app`: update the A / CNAME records to point at the new `vitrineweb` Vercel project. Brief domain hand-off during DNS propagation is acceptable.
   - Once `myvitrine.app` is verified serving from the new project, **archive the legacy `vitrinemarketing` Vercel project** (Settings → General → Delete Project, or pause it for a grace period before deletion)
3. **Update `.gitignore`** for monorepo:
   ```
   node_modules/
   .turbo/
   .next/
   dist/
   .expo/
   ios/
   android/
   .env*.local
   ```
4. **Update `.cursor/rules/*` paths** — many rules currently reference paths like `lib/colors.ts` or `app.json` at root. Update to `apps/native/lib/colors.ts` etc. Specifically check:
   - `expo-release-guardrails.mdc`
   - `design-system-playbook.mdc`
   - `040-database-rules.mdc`
   - `020-frontend-rules.mdc`
   - any others referencing absolute paths
5. **Update `docs/ai-context/*` references** — `CURRENT_STATE.md`, `ARCHITECTURE.md`, `DO_NOT_BREAK.md`, `HANDOFF.md`, `DECISION_LOG.md` all reference paths. Update to monorepo paths. Add a section noting the monorepo restructure occurred.
6. **Update `EAS_MIGRATION_PLAN.md`** path references (`app.json` → `apps/native/app.json`, etc.)
7. **Update `VITRINE_WEB_PLAN.md`** path references (`vitrinemarketing/` → `apps/web/`, etc.)
8. **Write a `README.md` at the repo root** with monorepo overview:
   ```markdown
   # MyVitrine

   Monorepo for the Vitrine product family.

   ## Apps
   - `apps/native` — React Native / Expo iOS + Android app (App Store: MyVitrine)
   - `apps/web` — Next.js web app + marketing site + share routes (myvitrine.app)

   ## Shared packages
   - `@vitrine/design-tokens` — colors, typography, spacing, motion (single source of truth)
   - `@vitrine/types` — TypeScript interfaces + generated Supabase types
   - `@vitrine/api` — Supabase query functions
   - `@vitrine/constants` — share domain, App Store URLs
   - `@vitrine/domain` — pure business logic / derivations

   ## Backend
   - `supabase/` — migrations, edge functions (deployed once, called from both apps)

   ## Common commands
   - `pnpm install` — install all workspaces
   - `pnpm dev` — start everything via turbo
   - `pnpm web:dev` — only the web app
   - `pnpm native:dev` — only the Expo dev server
   - `pnpm build` — build all apps and packages
   - `pnpm typecheck` — type-check all workspaces
   - `pnpm lint` — lint all workspaces
   ```
9. **Commit** — `"chore: monorepo CI/deploy/tooling configured (Phase 0 day 3)"`
10. **Verify the live site is unaffected** — check `https://myvitrine.app` still serves the marketing site after the Vercel project root change

### After Phase 0

The monorepo is live. Both downstream plans can now execute:

- `docs/EAS_MIGRATION_PLAN.md` — execute when Frank's iOS bundle ID arrives. All work happens in `apps/native/`. EAS init creates `apps/native/eas.json` and writes the project ID into `apps/native/app.json`.
- `docs/VITRINE_WEB_PLAN.md` — web team can begin immediately after Phase 0 completes. All work happens in `apps/web/`. Imports come from `@vitrine/*` packages.

These two streams run in parallel, indefinitely.

---

## Special considerations

### Vercel migration (new project, John handles DNS)

The marketing site is currently live at `https://myvitrine.app`, served by a legacy Vercel project pointed at the `vitrinemarketing` repo (deployment URL: `vitrinemarketing.vercel.app`).

**Approach: create a fresh Vercel project, repoint DNS deliberately, retire the legacy project.**

This is cleaner than repointing the existing project — it gives the deployment a brand-aligned name (`vitrineweb`), allows fresh build/install configuration, and lets the legacy `vitrinemarketing` repo + Vercel project retire together as a unit.

Steps:

1. Restructure happens on a branch (`feat/monorepo-phase-0`)
2. Push the branch to the new `MyVitrine` repo
3. Create a new Vercel project named `vitrineweb` pointed at the `MyVitrine` repo, root directory `apps/web/` (full settings in Day 3 step 2)
4. Initial deploy from the branch produces `vitrineweb-<hash>.vercel.app` preview URL
5. Verify the preview serves the marketing site correctly
6. Merge `feat/monorepo-phase-0` to main; production deploy at `vitrineweb.vercel.app`
7. **John handles DNS cutover** for `myvitrine.app` — update DNS records to point at the new project (Vercel provides the A / CNAME values needed in the dashboard under Settings → Domains)
8. Verify `myvitrine.app` serves correctly from the new project
9. Archive the legacy `vitrinemarketing` Vercel project (or pause for a grace period)
10. Archive the legacy `vitrinemarketing` GitHub repo (read-only)

**Domain hand-off window:** during DNS propagation (typically minutes to a few hours), some users may still hit the legacy deploy. Both serve the same marketing content during this window so user impact is minimal. Acceptable per John.

**Backout:** if anything goes wrong with the new build, the legacy `vitrinemarketing` Vercel project + repo remain intact and serving until DNS is fully cut over. Revert DNS to restore the old deploy if needed.

### EAS monorepo configuration

When the EAS plan executes (Phase 1, after Frank's credentials), it runs from `apps/native/`:

```bash
cd apps/native
eas init        # Creates EAS project, writes projectId to app.json
eas build --platform ios --profile development
```

EAS Build supports monorepos natively. Two requirements:
1. **Metro config** must include monorepo `watchFolders` and `nodeModulesPaths` (handled in Day 3)
2. **`eas.json`** can include `cli.requireCommit: true` and Expo handles the monorepo project root automatically

### npm dependencies — hoisting strategy

pnpm hoists shared dependencies to the root `node_modules/` by default, which works well for most cases. Two known edge cases for native:

- **Expo modules** sometimes resolve packages relative to the project root, not via Node resolution. The `metro.config.js` `nodeModulesPaths` configuration handles this. If issues arise, add specific packages to `apps/native/package.json` `dependencies` directly even if they're also in workspace deps (force them into the local node_modules).
- **React Native and Reanimated** are particularly sensitive. Pin them in `apps/native/package.json` and don't hoist. Use pnpm's `.npmrc` `public-hoist-pattern[]=react*` or `shamefully-hoist=false` to control.

If problems arise, the fallback is `shamefully-hoist=true` in `.npmrc` — flattens like npm/yarn. Less elegant, more compatible.

### TypeScript path aliases

Native currently uses `@/` to resolve to repo root. After restructure:

- Native's `@/` resolves to `apps/native/` (not the monorepo root)
- Web's path aliases stay scoped to `apps/web/`
- Shared packages are imported via `@vitrine/*` (workspace name resolution, not path alias)

Update each app's `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Cursor / IDE behavior

After the restructure:
- Open the new repo at `MyVitrine/` root in Cursor (not `apps/native/`)
- Cursor indexes the entire monorepo; AI sessions get full context
- Workspace-specific tasks (run native build, run web dev, etc.) work via root-level `pnpm` scripts
- Per-app `.cursor/` or `.vscode/` configs can override at the app level if needed (rare)

### `.cursor/rules/` repo-wide vs scoped

Some rules in `.cursor/rules/` are inherently app-specific (e.g., `expo-release-guardrails.mdc` only applies to native). Two options:
1. **Leave at repo root** — rules apply to all sessions; rule content explicitly says "when working in `apps/native/`..."
2. **Scope to app** — move app-specific rules to `apps/native/.cursor/rules/`; Cursor scopes them automatically

For Phase 0, recommendation: **leave all rules at root, update content to explicitly reference monorepo paths**. Less restructuring, clearer behavior. Move to scoped only if specific rules cause noise.

### Git history

- **Brand new monorepo** = fresh git history starting at v2 kickoff. Both legacy repo histories stay in their original locations, untouched.
- **Native v1 snapshot** already pushed to `vitrinev0` `main` as commit `30ce5a6` (2026-05-11) — captures all in-flight work as the recovery reference point.
- **Web v1 snapshot**: tag the current `vitrinemarketing` HEAD before archiving:
  ```bash
  cd C:\Users\johnj\vitrinemarketing
  git tag archive/v1-pre-monorepo
  git push --tags
  ```
- After monorepo verified working: **archive both legacy GitHub repos (read-only)** via Settings → General → Archive
- Both legacy repos remain accessible as canonical v1 references; clear visual signal that all new work happens in `MyVitrine`
- Backout if monorepo fails: legacy repos are untouched and can be reactivated instantly

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **Live `myvitrine.app` interruption during DNS cutover** | New Vercel project deploys and is verified before any DNS change; John handles DNS cutover deliberately; legacy project + repo stay live during propagation as backout; brief domain hand-off acceptable per John |
| **Metro config breaks Expo Go / dev client builds** | Test `npx expo start` from `apps/native/` after Day 1; fix path issues before Day 2 |
| **pnpm hoisting breaks React Native packages** | Use `shamefully-hoist=true` as fallback; pin sensitive deps locally; document the workaround |
| **Existing native imports break after package extraction** | Re-export from old paths during transition (e.g., `apps/native/lib/colors.ts` → `export * from "@vitrine/design-tokens"`); migrate imports gradually |
| **EAS Build can't find native dependencies** | Explicit `nodeModulesPaths` in Metro config; documented Expo monorepo pattern; verify with first dev build |
| **Cursor indexing degrades with monorepo size** | Acceptable cost; if it becomes an issue, use `.cursorignore` to exclude `node_modules/`, `.turbo/`, `.next/`, generated files |
| **Native team and web team make conflicting changes to shared packages** | Code review process for changes to `packages/*`; treat shared packages like internal APIs |
| **Lost git history** | Acceptable — both legacy codebases are still at their original GitHub URLs, archived but fully readable. Native v1 work is captured at `vitrinev0` commit `30ce5a6`; web v1 will be tagged before archive. |
| **`.cursor/rules/` paths get out of sync** | Day 3 explicitly updates all rule files; rule content uses explicit `apps/native/` and `apps/web/` paths |
| **Anything goes wrong with the new monorepo** | Both legacy repos and Vercel project remain 100% intact and serving until verified working. Backout = revert any DNS changes; legacy repos take over. |

---

## Validation checklist

After Phase 0 completes, verify:

- [ ] `pnpm install` from root succeeds
- [ ] `pnpm typecheck` passes for all workspaces
- [ ] `pnpm lint` passes (or known existing warnings only)
- [ ] `pnpm web:dev` starts the Next.js dev server; `http://localhost:3000` serves the marketing site
- [ ] `pnpm native:dev` starts Metro; can scan QR with Expo Go and load the app
- [ ] Native app builds and runs identically to before restructure
- [ ] Web app builds and runs identically to before restructure
- [ ] New `vitrineweb` Vercel project created, deployed, and serving the marketing site at the Vercel-provided URL
- [ ] John has handled DNS cutover; `https://myvitrine.app` serves from the new `vitrineweb` Vercel project
- [ ] Legacy `vitrinemarketing` Vercel project archived (or paused for grace period)
- [ ] All existing `.cursor/rules/*` updated for monorepo paths
- [ ] All `docs/ai-context/*` updated for monorepo paths
- [ ] `EAS_MIGRATION_PLAN.md` paths updated to `apps/native/`
- [ ] `VITRINE_WEB_PLAN.md` paths updated to `apps/web/`
- [ ] New `MyVitrine` GitHub repo created and pushed
- [ ] After verified working: `vitrinev0` GitHub repo archived (read-only)
- [ ] After verified working: `vitrinemarketing` GitHub repo tagged + archived (read-only)

---

## Pickup instructions

When the agent / session executing Phase 0 begins:

### Day 0 prep (before touching code)

1. Read this entire document
2. Read `docs/EAS_MIGRATION_PLAN.md` and `docs/VITRINE_WEB_PLAN.md` — context on what comes after
3. Confirm GitHub access (admin rights to create new repo, archive `vitrinev0` and `vitrinemarketing`)
4. Confirm Vercel access (admin rights to create a new project)
5. Confirm pnpm is installed locally (`pnpm --version`); if not, `npm install -g pnpm@9`
6. Verify the v1 native snapshot is on `vitrinev0` `main` (commit `30ce5a6` from 2026-05-11)
7. Verify `vitrinemarketing` has a clean working tree; commit any in-flight work first if not
8. Tag the current `vitrinemarketing` HEAD: `git tag archive/v1-pre-monorepo && git push --tags`

### Execute Day 1, Day 2, Day 3

Follow the day-by-day plan above. Commit at the end of each day. Don't merge to main until the validation checklist is fully green.

### After validation

1. Confirm everything in the validation checklist is green
2. **Archive both legacy GitHub repos** (`vitrinev0` and `vitrinemarketing`) — Settings → General → Archive
3. Update `docs/ai-context/HANDOFF.md` (now in the new monorepo) with the restructure outcome
4. Add a `docs/ai-context/DECISION_LOG.md` entry: "2026-MM-DD: Restructured to pnpm + turborepo monorepo as new MyVitrine repo (Phase 0 complete). Legacy vitrinev0 and vitrinemarketing repos archived."
5. Notify both downstream teams (EAS plan executor + web plan executor) that monorepo is ready

---

## Open questions (parking lot)

These can be resolved when relevant; none block Phase 0:

- **Changesets vs manual versioning** for shared packages — defer until first breaking change
- **GitHub Actions CI** — can run typecheck, lint, build via `turbo` on PRs; not blocking Phase 0 but recommended Day 4
- **Renovate or Dependabot** for monorepo dependency updates — recommended but not blocking
- **Storybook for shared components** — likely valuable as `packages/ui` matures; not Phase 0
- **Per-app Sentry projects vs shared** — separate projects make sense (different runtimes)
- **Database type generation automation** — should be a `pnpm db:types` script that updates `packages/types/src/database.ts`; codify after first manual generation
- **Monorepo `.cursorignore`** — likely needed to keep AI context focused; tune as we discover what's noisy
