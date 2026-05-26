# Quick Reference

Last updated: 2026-05-26
Last verified: 2026-05-26

The fast-path memory file. Always loaded at chat start. Kept under 100 lines.

If the answer to a question is in this file, retrieve from here. Only load deeper memory files when this file is insufficient.

---

## Project

Vitrine is a mobile-first collecting app (Expo/RN) and marketing website (Next.js) for showcasing, managing, discovering, and communicating around high-value collectibles. AI-powered extraction (Looking Glass) enriches every piece from a single photo. Active V3 redesign across all surfaces. Approaching deployment readiness.

## Stack

pnpm + Turborepo monorepo: Expo SDK 54 / RN 0.81 / Expo Router (native), Next.js 16 / React 19 / Tailwind v4 (web), Supabase (auth/DB/Edge Functions), Stream Chat/Feeds, four shared packages. Detail in `ARCHITECTURE.md`.

## Current Sprint Focus

**2026-05-26 — Drag-Reorder V2 Migration on `feature/drag-reorder-v2` (pending dev-client validation + PR merge).** Upload Scan-step photo grid migrated from `react-native-draggable-flatlist` to `react-native-reanimated-dnd@^2.0.0`, extracted as the canonical `<PhotoReorderGrid />` primitive at `components/vault/photo-reorder-grid.tsx`. New aesthetic: lift scale 1.12, inner glow + brandVolt border (NO shadow — cross-platform-consistency rule), live COVER badge re-anchoring during drag, remove-X disabled while dragging, 220ms long-press. Required bumping `react-native-reanimated` 4.1.7→4.3.1 and `react-native-worklets` 0.5→0.8 (native modules) so this is a binary rebuild, not OTA-eligible from the current preview binary. DFL retained in `package.json` because legacy V1 memorabilia flow still consumes it. Founder action: dev-client validate on iOS + Android, merge, `eas build --profile preview`, 24h soak. **Prior wave (2026-05-24):** keyboard wrapper system shipped (23 surfaces migrated), upload state-leak fix, native PHPicker swap-in (custom picker retired). Next-up tracks: (a) V1 memorabilia → `PhotoReorderGrid` cleanup, (b) Sentry-instrument the 97% upload hang, (c) Upload Lane Chunks B-D. Detail in `CURRENT_STATE.md`.

## Critical Constraints (must respect)

- EAS dev client is the active dev environment. Native dep additions require `eas build --profile development` rebuild. Full list in `DO_NOT_BREAK.md`.
- **`published_at IS NOT NULL` gates all public collectible visibility.** Every new public-facing query must include this filter. NULLing the column hides the item everywhere.
- **After any DDL change, run `NOTIFY pgrst, 'reload schema'`** or PostgREST will silently fail on the new entity.
- Managed showcase evaluator in `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` must stay in lockstep.
- Do not hardcode secrets — use `EXPO_PUBLIC_*` env vars; keep `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Vault.
- `upload-entry.tsx` holds the full upload-flow state machine — changes cascade to review, finalize, rapid-fire, photo grid, and extraction overlay simultaneously.
- `FramedHero`, `CollectionSurface`, `QRCodeModal`, `SearchBar`, **`PhotoReorderGrid`**, and the three `KeyboardSafe*` wrappers are multi-consumer shared components — breaking their prop interfaces cascades to 5+ surfaces.
- **Keyboard handling uses `KeyboardSafeScroll` / `KeyboardSafeSheet` / `KeyboardSafeComposer` wrappers (from `@/components/vault`), NOT raw `KeyboardAvoidingView`.** 23 surfaces migrated 2026-05-24.
- **Photo library picker is now native `PHPickerViewController` via `ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection, orderedSelection: true })`.** Custom `photo-library-picker.tsx` retired 2026-05-24 (evening); see DECISION_LOG and OPEN_THREADS for rollback path if hang regression recurs.
- **Multi-photo reorder = `<PhotoReorderGrid />`** from `@/components/vault` (built on `react-native-reanimated-dnd@^2.0.0`). NEVER reach for the underlying drag library directly; the primitive owns the lift visual, COVER live-anchor, remove-X disable, haptics, and 220ms long-press. Current consumer: upload Scan step. Future consumers: Batch Lane Review tab, edit-existing-photos UI.
- **Cross-platform consistency first**: when a UI decision has multiple valid implementations, pick the one that renders identically on iOS and Android. Drop shadows / `elevation` are PROHIBITED in new "elevated"/"lifted"/"selected" visuals — use inner-glow overlays + animated borders (the `PhotoReorderGrid` pattern). Full rule in `.cursor/rules/design-system-playbook.mdc`.

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
