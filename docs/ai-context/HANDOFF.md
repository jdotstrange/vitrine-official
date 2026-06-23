# Handoff

Last updated: 2026-06-22
Last verified: 2026-06-22

## Session Summary
- **Catch-up wave shipped** (one commit absorbed ~20 days of working-tree drift): void-continuous **boot screen**, **unified auth** (`AuthScreen`, email→OTP, deletes login/signup pages), dark **complete-profile**, **skeleton system reset** (new `components/skeleton/` barrel + composed skeletons, legacy deleted), `profile-hub-cache`, **Pro ship-dark** paywall, AAR no-signature variant, global `KeyboardToolbar` removed, **Supabase OTP email templates** (repo only).
- **Deployed:** git `a0bfd8d` pushed to `origin/main`; **preview OTA** group `668da060-6c25-4a52-a8c7-1113117db615` (runtime `2`). Production OTA not shipped.
- **Battery-drain audit** performed (read-only) — findings reported in chat, captured as OPEN_THREADS entry. No optimization code written yet.

## Current State
- **`main` at `a0bfd8d`** — pushed, in sync with `origin/main` (no longer ahead).
- **Preview channel** has the new boot/auth/skeleton bundle on runtime `2`; **production channel still on the 2026-06-02 edit-collectible OTA**.
- All native surfaces V3; auth funnel now unified and dark end-to-end (boot → login OTP → complete-profile → tabs).

## Files Changed Recently (commit `a0bfd8d`, 81 files)
- `components/vitrine-boot-screen.tsx` + `lib/splash-contain-layout.ts` — splash-continuous boot.
- `components/auth-screen.tsx` (new) — unified email→OTP; `login-page.tsx`/`signup-page.tsx` deleted.
- `app/{index,_layout,login/index,signup/index,complete-profile/index}.tsx` — boot wiring, auth routing, dark profile, KeyboardToolbar removal.
- `components/skeleton/*` (new barrel) + `components/skeletons/{collectible-detail,profile-hub,showcase-detail,tracking-overview}.tsx`; legacy skeleton files deleted; `components/vault/skeleton.tsx` shared pulse.
- `lib/profile-hub-cache.ts` (new), `lib/pro-ship-dark.ts` (new), `components/vault/vitrine-pro-coming-soon-sheet.tsx` (new).
- `detail/lenses/{aar-lens,aar-lens-no-signature,pulse-lens,var-lens}.tsx`, `vault/lens-paywall-card.tsx` — Pro ship-dark paywall.
- `supabase/templates/auth/*` + `supabase/scripts/upload-auth-email-icon.mjs` — OTP email (Dashboard paste, NOT OTA).

## Incomplete Work
- **Production OTA** not shipped — only preview. Promote with `eas update --channel production` after soak.
- **Supabase Dashboard (manual):** paste `supabase/templates/auth/email-otp.html` into Authentication → Email Templates (Magic Link / OTP); upload `apps/native/assets/icon.png` to Storage `brand-assets/logos/icon.png` (public) for the email logo.
- **Battery optimizations** — audit only; nothing implemented. Top candidates: dock `BlurView` on dark, AppState socket pause (Stream Chat + Feeds), tab/lens unmount, upload-theater interval/loop pause when backgrounded.
- **Device soak** of boot → auth OTP autofill → complete-profile → tabs on a preview binary after cold restart — not recorded.
- Carry-overs unchanged: native session conflict (web sign-in logs out native), Upload Lane B-D, variant strategy post-Assembly, Subscription Phase 1, V1 memorabilia → `PhotoReorderGrid`.

## Validation Performed
- `git push` + `eas update --channel preview` (iOS + Android bundled, published) — succeeded.
- Battery audit: read-only static analysis only.
- No `tsc`, no automated tests, no device soak this session.

## Risks And Warnings
- **OTA needs cold restart** (force-quit + reopen twice) to apply; testers won't see boot/auth changes immediately.
- **Email OTP will look unstyled / logo-broken** until the Dashboard template paste + Storage logo upload are done — these are NOT shipped by OTA.
- **Auth funnel rewrite is broad** — if OTP autofill or routing regresses, the single-`TextInput` `oneTimeCode` contract in `auth-screen.tsx` is the likely culprit (six boxes were removed specifically for autofill).
- **Skeleton imports moved** — anything importing the old `@/components/skeleton.tsx` / `skeleton-community` / `skeleton-messaging` or deleted `skeletons/*` must now use the new `components/skeleton/` barrel.
- Production channel diverges from preview until you promote.

## Next Best Task
**Decide battery-optimization scope**, then implement the quick wins (dock blur on dark + AppState pause for Stream Chat/Feeds). If not battery: **promote production OTA** + complete the two Supabase Dashboard manual steps so email OTP renders correctly.

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. main is a0bfd8d (pushed); preview OTA 668da060 on runtime 2 has boot screen + unified auth + skeleton reset. Production OTA not yet promoted. Pending manual: paste email-otp.html in Supabase Auth templates + upload icon.png to Storage brand-assets/logos. Battery audit done (read-only) — implement quick wins: dock BlurView on dark, AppState pause for Stream Chat + Feeds.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — appended 2026-06-22 boot/auth/skeleton/email + battery-audit entry.
- `HANDOFF.md` — rewritten.
- `CURRENT_STATE.md` — Current Priority updated to 2026-06-22; auth/boot/skeleton sections added.
- `DECISION_LOG.md` — added unified-auth, boot-screen, skeleton-barrel, Pro ship-dark decisions.
- `DO_NOT_BREAK.md` — added auth funnel / boot-splash continuity / skeleton barrel / email-template-not-OTA constraints; refreshed verified date.
- `OPEN_THREADS.md` — added battery-optimization + email-template-manual + production-OTA-promote threads; marked push/runtime threads resolved/updated.
- `QUICK_REFERENCE.md` — sprint focus updated to 2026-06-22.

## What Not To Touch
- `auth-screen.tsx` single-`TextInput` `oneTimeCode`/`autoComplete` contract — required for iOS OTP autofill; don't split into six boxes.
- Boot splash continuity: `SPLASH_BG` / `SPLASH_SOURCE` / `getContainRect` must keep matching `app.json` splash (`#020202`, `splash-icon.png`, `contain`). Splash hide lives in the boot component, not `_layout.tsx`.
- `runtimeVersion` stays `"2"` until the next native change.
- `supabase/.temp/*` — never commit.
- `computeMetadataProvenance` baseline contract; `LensPager` page-0 gesture; Lattice stage mapping.

## Proposed Updates To Watch For
- If battery quick wins ship, add an AppState-pause constraint to DO_NOT_BREAK and a decision entry.
- Once email template + Storage logo are confirmed live, note it in CURRENT_STATE and close the OPEN_THREADS manual step.
- Consider tagging the clean `a0bfd8d` source as the runtime-`2` preview baseline if a new IPA is cut.
