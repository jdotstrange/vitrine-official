# Quick Reference

Last updated: 2026-06-22
Last verified: 2026-06-22

The fast-path memory file. Always loaded at chat start. Kept under 100 lines.

If the answer to a question is in this file, retrieve from here. Only load deeper memory files when this file is insufficient.

---

## Project

Vitrine is a mobile-first collecting app (Expo/RN) and marketing website (Next.js) for showcasing, managing, discovering, and communicating around high-value collectibles. AI-powered extraction (Looking Glass) enriches every piece from a single photo. Active V3 redesign across all surfaces. Approaching deployment readiness.

## Stack

pnpm + Turborepo monorepo: Expo SDK 54 / RN 0.81 / Expo Router (native), Next.js 16 / React 19 / Tailwind v4 (web), Supabase (auth/DB/Edge Functions), Stream Chat/Feeds, four shared packages. Detail in `ARCHITECTURE.md`.

## Current Sprint Focus

**2026-06-22 — boot screen + unified auth V3 + skeleton reset (shipped preview OTA).** `a0bfd8d` on `main` (pushed); preview OTA `668da060` on runtime `2`. Unified `AuthScreen` (email→OTP, deletes login/signup pages), void-continuous boot screen, `components/skeleton/` barrel reset, Pro ship-dark paywall, OTP email templates (Dashboard paste pending). **Founder manual:** paste `email-otp.html` in Supabase Auth templates + upload `icon.png` to Storage `brand-assets/logos`; optionally promote production OTA. **Battery audit done (read-only)** — quick wins queued: dock `BlurView` on dark, AppState pause for Stream Chat + Feeds, delete `live-ticker.tsx`. Open carry-overs: Theater extraction reliability, native session conflict, Upload Lane B-D, V1 memorabilia → `PhotoReorderGrid`.

## Critical Constraints (must respect)

- EAS dev client is the active dev environment. Native dep additions require `eas build --profile development` rebuild. Full list in `DO_NOT_BREAK.md`.
- **`published_at IS NOT NULL` gates all public collectible visibility.** Every new public-facing query must include this filter. NULLing the column hides the item everywhere.
- **After any DDL change, run `NOTIFY pgrst, 'reload schema'`** or PostgREST will silently fail on the new entity.
- Managed showcase evaluator in `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` must stay in lockstep.
- Do not hardcode secrets — use `EXPO_PUBLIC_*` env vars; keep `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Vault.
- **Preview `runtimeVersion` is `"2"`** — bump + rebuild after native changes; OTAs on `preview` channel only hit matching binaries. Runtime-`1` preview installs need fresh IPA, not OTA.
- `upload-entry.tsx` — **Identify → Theater (The Lattice) → Review → Catalog → Success** (Finalize + Assembly removed 2026-06-02). Lattice is a stage-choreographed SVG graph (no fake progress); Catalog commit sets `published_at`.
- **Auth:** unified `components/auth-screen.tsx` (email→OTP, login+signup). OTP field is a **single `TextInput`** with `oneTimeCode` for autofill — never six boxes. Boot screen (`vitrine-boot-screen.tsx`) reuses native splash; splash hidden in the boot component, not `_layout.tsx`.
- **Skeletons:** import from the `components/skeleton/` barrel; legacy `skeleton*.tsx` + dead `skeletons/*` deleted.
- **Keyboard:** global `<KeyboardToolbar />` removed from `_layout.tsx` (2026-06-22).
- **Collectible detail:** display `LensSelector` is the top bar — **no back chevron.** Edge-back on DETAILS requires `LensPager` page-0 asymmetric pan — do not revert to symmetric `activeOffsetX` on index 0.
- `FramedHero`, `CollectionSurface`, `QRCodeModal`, `SearchBar`, **`PhotoReorderGrid`**, `LensPager`, and the three `KeyboardSafe*` wrappers are multi-consumer — breaking prop/gesture contracts cascades.
- **Keyboard:** `KeyboardSafeScroll` / `KeyboardSafeSheet` / `KeyboardSafeComposer` only — not raw `KeyboardAvoidingView`.
- **Photo library:** native `launchImageLibraryAsync({ allowsMultipleSelection, orderedSelection: true })`.
- **Multi-photo reorder:** `<PhotoReorderGrid />` only — not `react-native-reanimated-dnd` at call sites.
- **Cross-platform consistency first** — no shadows in lift visuals; inner glow + brandVolt border.

## Key Decisions (active)

- Profile-as-home: 5-lens profile hub at `/(tabs)/index`. Messages = dedicated tab.
- Collectible detail Philosophy B: lens strip = chrome; stack edge-back on page 0 via asymmetric `LensPager` pan.
- Brand warm ivory (`#E8E0D4`), not neon volt. Light/Dark/Auto via ThemeProvider.
- **`published_at` publish gate** + `complete_and_publish` trigger for auto-commit.
- Upload is Identify-first; Theater = The Lattice (no fake progress). Assembly/Finalize removed; post-Assembly variant strategy is open (see OPEN_THREADS).
- Passwordless unified auth (`AuthScreen` email→OTP); void-continuous boot screen.

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
