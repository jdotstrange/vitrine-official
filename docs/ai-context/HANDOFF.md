# Handoff

Last updated: 2026-06-02
Last verified: 2026-06-02

## Session Summary
- **Edit collectible flow** shipped: detail Edit → `/collectible/[id]/edit`, `UploadEntry` edit mode, custom fields, provenance Edited chips, metadata-only vs photo-rerun LG staging (`reextraction_of` draft merge).
- **Provenance bugfix:** `computeMetadataProvenance` clears `ai.*` / `trait.*` markers when values match baseline (fixes stale Edited after rerun-only save).
- **Deployed:** OTA preview `fd922925` + production `db889dfe` (runtime `2`). **Git `e83f6e4`** committed on `main`.

## Current State
- **`main` at `e83f6e4`** — edit collectible + provenance fix; **2 commits ahead of `origin/main`** (`feb0c25` + `e83f6e4`) unless founder pushed.
- **OTAs live:** preview + production channels, runtime `2`, edit flow + provenance reconcile.
- **DB migration** `20260602120000_*` applied on prod Supabase (`fxmiongkckkrllgyfwyw`).

## Files Changed Recently
- `apps/native/components/upload-entry.tsx` — `mode="edit"`, S0 snapshot, photo multiset fork, commit fork.
- `apps/native/lib/api/collectibles.ts` — `commitMetadataUpdate`, `commitReExtraction`, `computeMetadataProvenance` reconcile.
- `apps/native/app/collectible/[id]/edit.tsx` — edit route shell.
- `apps/native/components/vault/custom-fields-editor.tsx` — owner custom fields on Review.
- `apps/native/components/detail/lenses/specs-lens.tsx` — provenance + custom fields display.
- `supabase/migrations/20260602120000_edit_collectible_custom_fields_provenance.sql` — new columns.

## Incomplete Work
- **`git push origin main`** — `feb0c25` + `e83f6e4` not pushed this session.
- **Founder soak on device** — edit + LG rerun + provenance fix after OTA cold restart not formally recorded post-`e83f6e4` OTA.
- **Preview runtime-`2` IPA cut** — still pending if team on runtime-`1` installs.
- **Worker always-on**, variant strategy post-Assembly, Upload Lane B-D, native session conflict, Subscription Phase 1 — unchanged.

## Validation Performed
- `eas update` preview + production — succeeded (runtime `2`).
- Git commit `e83f6e4` — 17 files.
- Founder reported provenance false-positive on Ohtani bat; fix landed in `computeMetadataProvenance`.
- No automated test run this handoff session.

## Risks And Warnings
- **OTA without cold restart** — users won't see edit flow until force-quit + reopen twice (download + apply).
- **Runtime-`1` binaries** — no edit OTA; need runtime-`2` IPA.
- **Stale provenance in DB** — pre-fix rows need one save (or rerun + save) to clear orphan Edited markers.
- **First OTA (`fd922925` / `db889dfe`)** may have shipped from dirty tree at `feb0c25*`; `e83f6e4` matches committed source — optional republish OTA if paranoid.

## Next Best Task
**`git push origin main`** then founder device soak: open Ohtani bat → Edit → change photo → LG rerun → save with no field edits → confirm Grip Tape / Inscribed no longer show Edited.

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. main is e83f6e4 with edit collectible + provenance reconcile. OTAs fd922925 (preview) and db889dfe (production) on runtime 2. Push to origin if not done. Soak edit + photo-rerun provenance on device after cold restart.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — 2026-06-02 edit collectible entry appended.
- `HANDOFF.md` — rewritten.
- `CURRENT_STATE.md` — edit collectible priority + upload/edit sections updated.
- `DECISION_LOG.md` — edit provenance reconcile decision added.
- `OPEN_THREADS.md` — edit collectible resolved; git push thread noted.

## What Not To Touch
- `computeMetadataProvenance` baseline contract without understanding metadata-only vs rerun paths.
- `runtimeVersion` — stay `"2"` until next native bump.
- `LensPager` page-0 gesture; Lattice stage mapping without `docs/EXTRACTION_CONTRACT.md`.
- `supabase/.temp/*` — never commit.

## Proposed Updates To Watch For
- DO_NOT_BREAK — add edit-collectible flow steps if founder confirms stable.
- Optional OTA republish from clean `e83f6e4` commit hash on EAS dashboard.
