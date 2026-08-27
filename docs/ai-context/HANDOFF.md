# Handoff

Last updated: 2026-08-27
Last verified: 2026-08-27

## Session Summary (2026-08-27 — Security Wave 2 storage policies)
- Applied `lock_storage_object_policies` (`20260827140913`) on the shared production app DB. Writes must use `{public.users.id}/…` — not `auth.uid()`. UPDATE policies added so avatar upsert can succeed. Migrated-tree deletes go through collectible ownership.
- Branch `fix/security-storage-policies`. SQL-only — **do not OTA**. Founder confirmed preview: photo upload + avatar upsert (previously broken) both work.

## Session Summary (2026-08-27 — Admin Slice 1 spec locked)
- Founder accepted vault census as Slice 1: Accounts vs Collectors (≥1 published item), ET time windows with prior-period deltas, People + Catalog click-through, Browse-by dimensions, Overview activation + top collectors + health counts. Auth shell ships with Slice 1. Canonical spec: `docs/ai-context/ADMIN_SLICE_1.md`. No scaffold until kicked.

## Session Summary (2026-08-27 — Security Wave 1 DEFINER RPCs)
- After merging Android PR #3 to `main`, started the locked security-audit Wave 1 on the **shared production** app DB (preview and production are the same Supabase project).
- Applied `lock_dangerous_definer_rpcs` (`20260827134743`). Photos / Firebase dump / cron unschedule are no longer client-callable; DM and unread RPCs require the caller to be a participant; trigger helpers reject `/rest/v1/rpc` calls.
- Repo work on `fix/security-definer-rpcs` — SQL-only, **do not OTA**. The live DB already has this migration; the git commit is the undo record.

## Session Summary (2026-08-27 — Admin portal pre–slice 1 lock)
- Founder accepted: separate `apps/admin` from day one; authenticator-app TOTP (Google Authenticator / Duo Mobile as TOTP, not Duo SSO); phone and desktop as equal surfaces (responsive web, not a native admin app); **Apple HIG (`apple-hig-designer`) as design authority** for admin (V3 vault does not apply); plus roster+domain, AAL2, session isolation, no RLS widening, invite-only.
- Locked in DECISION_LOG. Slice 1 product scope is the next conversation — no scaffold yet.

## Session Summary (2026-08-14 — Android-first compat, wait on APK)
- Audited native app for Android landmines (never had an Android EAS build; iOS-only soak). No iOS-only native packages. Five product bugs would fail on first install.
- Implemented OS-seam adapters on branch `feat/android-first-compat` (one codebase, not a fork). `runtimeVersion` `"2"` → `"3"` because `expo-clipboard` is a native module and the image-picker plugin config changed.
- **Founder gate: check in before cutting the preview APK.** Do not preview-OTA this onto existing runtime-`2` iOS IPAs.

## Current State
- Waves 1–2 are **live on prod**. Wave 2 matching migration is on `fix/security-storage-policies`.
- Wave 1 is on `main` (PR #4, `21598f6`).
- `main` includes Android-first compat (`156bb32`, runtime `"3"`). TestFlight iOS stays on runtime `"2"` until a new IPA.
- Looking Glass engine still on Railway `942f4d2` from 2026-08-08.
- Admin portal: architecture + Slice 1 spec locked (`ADMIN_SLICE_1.md`); not scaffolded.

## Incomplete Work
- Founder smoke Wave 2: **passed on preview** (photo upload + avatar upsert).
- Wave 3 RLS on `collectible_field_values` + `user_category_interests`.
- Later iOS IPA on runtime `3` if we want new JS on TestFlight.
- FCM `google-services.json` + Stream `MyVitrineAndroid` for push.
- Bullion/coins category decision (John + Frank).
- `extract-asset` edge PAT deploy.
- Admin Slice 1 spec locked (`ADMIN_SLICE_1.md`); scaffold on `feat/admin-portal` when founder says go.

## Validation Performed
- Post-apply: 15 `storage.objects` policies; `current_profile_id` / `owns_collectible` EXECUTE authenticated-only.
- Founder preview smoke: photo upload + avatar change succeeded (avatar was previously un-updatable).

## Risks And Warnings
- Storage folder check is `public.users.id`, never `auth.uid()`. Binding to auth uid would reject every live upload.
- Shared prod DB. If photo upload or avatar change fails, revert `20260827140913`.
- Do not `eas update --channel production` from runtime-`3` `main` onto runtime-`2` TestFlight.

## Next Best Task
**Wave 3 RLS** on `collectible_field_values` + `user_category_interests`. Admin Slice 1 remains a separate founder kick.
