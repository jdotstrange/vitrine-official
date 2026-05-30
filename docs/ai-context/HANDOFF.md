# Handoff

Last updated: 2026-05-30
Last verified: 2026-05-30

## Session Summary
- Shipped **LensPager page-0 edge-back fix** — asymmetric `activeOffsetX` so collectible detail keeps display `LensSelector` as top bar (no back chevron) while stack swipe-back works in the content band. Founder dev-client validated; committed `5d32845`; preview OTA `a3610490-8612-4e9f-858f-ece6e2ca932b`.
- Shipped **Theater 25s linear / 85% cap** — ring/reveal after `extractionJobId`, linear easing, percent floor+cap until extraction done, poll sprint unchanged. Committed `f09e891`; preview OTA `7356da1c-9b2c-4a34-b3d3-486c07796c54`.
- Prior on `main` (same sprint): Assembly dossier seals + deferred variants (`62d8222`, OTA earlier in week).

## Current State
- **`main` is current** with upload Assembly, LensPager gesture fix, and Theater pacing. Prior preview OTAs shipped on **runtime `1`**; **`runtimeVersion` bumped to `2`** in `app.json` so old binaries stop receiving incompatible JS.
- **Collectible detail V3** — six lenses; back = edge swipe on DETAILS only (by design, no chevron in lens row).
- **Preview binary cut in flight** — team on May 24 runtime-`1` installs cannot run `PhotoReorderGrid`; founder running `eas build --profile preview` after commit.

## Files Changed Recently
- `apps/native/components/vault/lens-pager.tsx` — page-0 `activeOffsetX([-12, 1_000_000])`; docblock.
- `apps/native/components/collectible-detail-v3.tsx` — back-navigation comment only.
- `apps/native/components/upload-entry.tsx` — `THEATER_COSMETIC_MS`, `THEATER_PROGRESS_CAP`, linear Theater, checklist 25s, `extractionJobId` gates.
- `apps/native/components/upload/assembly-step.tsx` — dossier seals (prior commit).
- `apps/native/lib/image-utils.ts` — `assemblyVariants()` (prior commit).

## Incomplete Work
- **Theater extraction reliability** — when poll never returns `extracted`/`complete`, user still stuck (now at ~84% cap, not 97%). Realtime / webhook / hard timeout — see OPEN_THREADS.
- **Preview binary rebuild** — `runtimeVersion` `2` committed; run `eas build --profile preview` from `apps/native/`, distribute IPA, team reinstall (do not rely on OTA onto runtime-`1` installs).
- **Upload Lane Chunks B-D** — Batch Lane Review tab next `PhotoReorderGrid` consumer; not started.
- **V1 memorabilia → PhotoReorderGrid** — last DFL consumer; not started.
- **Native session conflict** — web sign-in logs out native; no fix applied.
- **Subscription Phase 1** — not started.

## Validation Performed
- Founder dev-client: collectible detail edge-back from middle of DETAILS; lens 0 → Specs swipe left; lens 1+ → Details swipe right; vertical scroll in lenses OK.
- Founder dev-client: Theater pacing approved before second OTA.
- `eas update --channel preview` published twice (lens + theater); both succeeded runtime `1`.
- No new `tsc` pass this session (project baseline ~107 errors unchanged).

## Risks And Warnings
- **Do not add a back chevron** beside DETAILS/SPECS to "fix" navigation — product rejected; asymmetric pan is the fix.
- **Do not restore symmetric `activeOffsetX([-12, 12])` on LensPager page 0** — regresses swipe-back in content band.
- **Do not re-add `generateVariantsBackground` at Identify** — Assembly owns variants.
- **Theater 85% cap is cosmetic** — poll failure still blocks Review; don't confuse pacing fix with extraction fix.
- **`PhotoReorderGrid` on old preview binary** — upload grid may break/crash without Reanimated 4.3 rebuild.

## Next Best Task
**Theater 1 extraction reliability** — if founder still sees upload hang after OTAs: instrument Theater exit path (Sentry breadcrumbs on poll timeout), add Realtime subscription on `collectibles.extraction_status` for active job, or hard timeout → Failed step with retry. Read `looking-glass-webhook` + `upload-entry.tsx` Theater poll effect first.

After preview binary ships: `eas update --channel preview --message "…"` for JS-only fixes (runtime `2` only).

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. Main has Assembly + LensPager page-0 edge-back + Theater 25s/85% cap on preview OTAs. Pick up Theater extraction reliability (poll stall / 84% cap forever) OR confirm preview binary includes Reanimated 4.3 for PhotoReorderGrid — founder preference.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — lens pager + theater OTA entry
- `DECISION_LOG.md` — LensPager page-0 gesture; Theater 25s/85%; Assembly/PhotoReorderGrid status corrections
- `DO_NOT_BREAK.md` — LensPager page-0 + Theater constants
- `CURRENT_STATE.md` — priority, Theater copy, LensPager note
- `OPEN_THREADS.md` — resolved swipe-back + theater cosmetic; updated extraction thread
- `QUICK_REFERENCE.md` — sprint focus + constraints
- `HANDOFF.md` — this file

## What Not To Touch
- Collectible detail lens-strip chrome (no back button without explicit product ask).
- `LensPager` page-0 gesture contract.
- Assembly variant deferral path.
- `PhotoReorderGrid` primitive internals unless founder asks for tactile tuning.
- `supabase/.temp/*` — never commit.

## Proposed Updates To Watch For
- Preview soak: any regression of edge-back on Android predictive back.
- Sentry: `assembly_complete` with `timedOut: true` rate after Assembly OTA.
- Founder rapid-fire upload repro after variant deferral — drives extraction-reliability priority.
