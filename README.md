# MyVitrine

Collectibles-as-canvas. Native (Expo) + Web (Next.js) monorepo, sharing a single Supabase backend.

> **v2 kickoff (May 2026).** This monorepo replaces the legacy `vitrinev0` (native) and `vitrinemarketing` (web) repos. Both legacy repos are archived as read-only references at tag `archive/v1-pre-monorepo`.

---

## Apps

| Path | Package | Stack | Deploys to |
|---|---|---|---|
| `apps/native` | `@vitrine/native` | Expo SDK 54, React Native 0.81, Expo Router | iOS App Store + Google Play (via EAS) |
| `apps/web` | `@vitrine/web` | Next.js 16, React 19, Tailwind v4, shadcn/ui | Vercel (`myvitrine.app`) |

## Shared infrastructure

| Path | Purpose |
|---|---|
| `supabase/` | Database migrations + Edge Functions (single project, used by both apps) |
| `packages/` | Shared workspace packages — design tokens, types, API client, constants, domain logic (populated in Day 2 of monorepo migration) |
| `docs/` | All project documentation including `ai-context/` (project memory), brand operating system (`brand/`), and active plans |
| `.cursor/` | Repo-wide Cursor rules and AI agent configuration |

---

## Quick start

```bash
# Install everything (root only)
pnpm install

# Run the native app (Expo dev server)
pnpm dev:native

# Run the web app (Next.js dev server)
pnpm dev:web
```

Requires **Node 20+** and **pnpm 10+**.

## Per-app commands

```bash
# Native
pnpm --filter @vitrine/native start       # Expo dev server
pnpm --filter @vitrine/native ios         # Open in iOS simulator
pnpm --filter @vitrine/native android     # Open in Android emulator

# Web
pnpm --filter @vitrine/web dev            # Next.js dev server
pnpm --filter @vitrine/web build          # Production build
pnpm --filter @vitrine/web start          # Run production build locally
```

---

## Plans (canonical specs)

- **Monorepo structure** → `docs/MONOREPO_STRUCTURE.md`
- **Native EAS migration → App Store launch** → `docs/EAS_MIGRATION_PLAN.md`
- **Web product (marketing + app + share routes)** → `docs/VITRINE_WEB_PLAN.md`
- **Project memory** → `docs/ai-context/`

## Contributing notes

- All Supabase changes (migrations, Edge Functions) live at the repo root in `supabase/`. Both apps import the same Supabase project.
- Repo-wide AI rules and project memory are at the **monorepo root** (`AGENTS.md`, `.cursor/rules/`, `docs/ai-context/`). Per-app context goes in `apps/*/AGENTS.md` (does not exist yet — to be added if needed).
- Brand voice + messaging system lives at `docs/brand/` (32 files, full brand operating system). Applies to both apps.

## Legacy reference

If you need to consult the v1 codebases:
- Native v1: <https://github.com/jdotstrange/vitrine_v0> (tag `archive/v1-pre-monorepo`)
- Web v1: <https://github.com/jdotstrange/vitrinemarketing> (tag `archive/v1-pre-monorepo`)
