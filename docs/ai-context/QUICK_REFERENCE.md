# Quick Reference

Last updated: 2026-05-24
Last verified: 2026-05-24

The fast-path memory file. Always loaded at chat start. Kept under 100 lines.

If the answer to a question is in this file, retrieve from here. Only load deeper memory files when this file is insufficient.

---

## Project

Vitrine is a mobile-first collecting app (Expo/RN) and marketing website (Next.js) for showcasing, managing, discovering, and communicating around high-value collectibles. AI-powered extraction (Looking Glass) enriches every piece from a single photo. Active V3 redesign across all surfaces. Approaching deployment readiness.

## Stack

pnpm + Turborepo monorepo: Expo SDK 54 / RN 0.81 / Expo Router (native), Next.js 16 / React 19 / Tailwind v4 (web), Supabase (auth/DB/Edge Functions), Stream Chat/Feeds, four shared packages. Detail in `ARCHITECTURE.md`.

## Current Sprint Focus

**Priming wave shipped 2026-05-24** — the project is now in a known-clean state for fast iteration: Upload Lane Unification Chunk A backend + web foundation committed to source control, `batch_uploads` INSERT bug resolved (root cause: missing GRANT to `authenticated`), EAS OTA pipeline live on the preview channel (verified on device), native Phase 2 modernization shipped (Sentry, push notifications, keyboard-controller). The authenticated web app is fully scaffolded (`/login`, `/signup`, `/complete-profile`, `/v/*` shell + all feature surfaces) but not yet deployed. Next: Upload Lane Chunks B-D (native MyQ surface, single-lane refactor, push for batch complete) and intermittent "97% hang" on single-lane uploads (Sentry-instrument first). Detail in `CURRENT_STATE.md`.

## Critical Constraints (must respect)

- EAS dev client is the active dev environment. Native dep additions require `eas build --profile development` rebuild. Full list in `DO_NOT_BREAK.md`.
- **`published_at IS NOT NULL` gates all public collectible visibility.** Every new public-facing query must include this filter. NULLing the column hides the item everywhere.
- **After any DDL change, run `NOTIFY pgrst, 'reload schema'`** or PostgREST will silently fail on the new entity.
- Managed showcase evaluator in `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` must stay in lockstep.
- Do not hardcode secrets — use `EXPO_PUBLIC_*` env vars; keep `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Vault.
- `upload-entry.tsx` holds the full upload-flow state machine — changes cascade to review, finalize, rapid-fire, and extraction overlay simultaneously.
- `FramedHero`, `CollectionSurface`, `QRCodeModal`, `SearchBar` are multi-consumer shared components — breaking their prop interfaces cascades to 5+ surfaces.
- Do NOT use `ImagePicker.launchImageLibraryAsync` for photo library — use custom `PhotoLibraryPicker` component (expo-notifications breaks native picker delegates for iCloud/HEIC photos).

## Key Decisions (active)

- Profile-as-home: the collector's profile hub (5 lenses) IS the landing surface. No separate home screen. Rationale in `DECISION_LOG.md`.
- Messages is a dedicated tab, not a profile lens. Tab order: Profile | Tracking | [Upload FAB] | Market | Messages.
- Brand color is warm ivory (`#E8E0D4`), not neon volt. Token names kept for hot-swap capability.
- Light/Dark/Auto theme via dual static token objects + ThemeProvider context. Default is Dark.
- Market Surface uses Instagram-style three-state architecture (mosaic → drawer → results).
- **`published_at` is the publish gate** — server-side trigger sets it; `batch_uploads.auto_publish = false` holds for review. No client-side commit.
- **Server-side auto-commit** via `complete_and_publish` trigger — no client dependency for publishing.

## Where to Look

- Project state and what's in flight → `CURRENT_STATE.md`
- System shape and boundaries → `ARCHITECTURE.md`
- Why we chose what we chose → `DECISION_LOG.md`
- What will burn the project → `DO_NOT_BREAK.md`
- What got built and when → `IMPLEMENTATION_LOG.md`
- Unresolved questions and pending work → `OPEN_THREADS.md`
- What the last chat left for this one → `HANDOFF.md`

## Maintenance Rules

This file is updated when:
- A new critical constraint is added
- A major decision is made or reversed
- The current sprint focus changes
- The project enters a new build phase

This file is NOT updated for routine implementation work. Detail lives in deeper files; this file holds only what every chat needs to know in the first thirty seconds.
