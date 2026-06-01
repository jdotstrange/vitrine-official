# Handoff

Last updated: 2026-05-30
Last verified: 2026-05-30

## Session Summary
- **Rehydrated** project memory; founder confirmed digest direction.
- **Audited EAS** via `eas build:list` / `eas update:list` — proved stale preview installs (May 24 runtime-`1` without `reanimated-dnd`) cannot run current upload JS; May 26 preview had natives but shared runtime `1` with incompatible OTAs.
- **Shipped `runtimeVersion: "2"`** in `apps/native/app.json`; synced ai-context; **pushed** `6a53a98` + `33ec04f` to `origin/main`.
- **Preview IPA not built this session** — founder cutting `eas build --profile preview` manually.

## Current State
- **`main` at `33ec04f`** — upload Assembly, LensPager edge-back, Theater 25s/85% cap, `PhotoReorderGrid`, `runtimeVersion` `"2"`.
- **Preview channel:** runtime-`1` OTAs (Assembly/LensPager/Theater) still exist; **only runtime-`2` binaries** should receive new OTAs after IPA ships.
- **Team blocked until new preview IPA** if still on May 24 install or never got May 26 build.

## Files Changed Recently
- `apps/native/app.json` — `runtimeVersion` `"1"` → `"2"`.
- `docs/ai-context/*` — 5/27 polish memory + 5/30 preview-cut audit (this session).
- `.cursor/rules/ota-update-discipline.mdc` — documents current runtime `"2"`.

## Incomplete Work
- **`eas build --profile preview --platform ios`** on `33ec04f+` — distribute IPA; team reinstall.
- Post-build: optional `eas update --channel preview` for runtime-`2` JS-only fixes.
- **Theater extraction reliability** — poll never completes; ~84% cap; not fixed this session.
- **Upload Lane B-D**, **V1 memorabilia → PhotoReorderGrid**, **native session conflict**, **Subscription Phase 1** — unchanged.

## Validation Performed
- `eas build:list` / `eas update:list` (read-only) — build IDs, fingerprints, OTA groups documented in `IMPLEMENTATION_LOG.md`.
- `git push origin main` — succeeded (`f09e891..33ec04f`).
- No device test, no `tsc`, no new preview build this session.

## Risks And Warnings
- **Do not OTA runtime-`2` JS expecting it to fix runtime-`1` devices** — they need a new IPA.
- **May 24 preview (`e5113d4a`)** — upload tab may already crash if runtime-`1` OTAs with `PhotoReorderGrid` applied.
- **No Android preview builds** in EAS — Android testers have no preview track.
- **Dev cloud build `f0a71aef` is stale** (`cbc131b`) — use Metro or rebuild development profile for native parity.
- All prior upload/detail gesture constraints still apply (LensPager page 0, no back chevron, Assembly owns variants, Theater cap cosmetic only).

## Next Best Task
**Complete preview binary cut:** from `apps/native/` run `eas build --profile preview --platform ios --message "preview runtime 2 baseline"`, distribute IPA, have team reinstall, run smoke checklist in `OPEN_THREADS` "Preview binary runtime 2 distribution". Then `eas update --channel preview` if any JS drift since build commit.

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. Preview runtime 2 is on main; confirm whether founder finished eas build --profile preview and IPA is distributed. If yes: soak + Theater extraction reliability. If no: unblock build/distribution first.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — 2026-05-30 runtimeVersion 2 + EAS audit entry.
- `DECISION_LOG.md` — runtimeVersion 2 isolation decision; PhotoReorderGrid status note.
- `DO_NOT_BREAK.md` — runtimeVersion 2 + OTA/binary pairing constraint.
- `CURRENT_STATE.md` — priority, parallel track 1 corrected (PhotoReorderGrid merged).
- `OPEN_THREADS.md` — "Preview binary runtime 2 distribution" active thread.
- `QUICK_REFERENCE.md` — runtime `2` critical constraint.
- `HANDOFF.md` — this file.

## What Not To Touch
- `runtimeVersion` — stay `"2"` until next native bump (then increment again).
- `LensPager` page-0 gesture; collectible detail lens chrome; Assembly variant deferral; `PhotoReorderGrid` primitive internals.
- `supabase/.temp/*` — never commit.

## Proposed Updates To Watch For
- After runtime-`2` IPA ships: Sentry upload-tab crash rate on preview vs prior week.
- Founder confirmation which build ID/fingerprint testers installed (`9c713ce6…` minimum for dnd; new build will differ after runtime `2` cut).
- Theater poll stall repro on runtime-`2` binary — drives extraction-reliability priority.
