# Handoff

Last updated: 2026-06-02
Last verified: 2026-06-02

## Session Summary
- **Identify-first upload + Lattice Theater** shipped in `upload-entry.tsx`; Assembly step removed; flow is `identify → theater → review → catalog → success`.
- **Committed `feb0c25`** and **preview OTA** runtime `2` group `8e9655e9-2eff-44c4-a157-6e3446788fbb`. Supabase migration + edge functions **already live** (MCP audit — no redeploy).

## Current State
- **`main` at `feb0c25`** (local, **1 commit ahead of origin** unless founder pushed separately).
- **Preview OTA:** Lattice + Identify-first on channel `preview`, runtime `2`. Cold restart required on preview binary.
- **Extraction worker:** still required on `vitrinedb/worker` (founder's PC today); not a localhost app issue.

## Files Changed Recently
- `apps/native/components/upload-entry.tsx` — Identify merge, Lattice Theater, stage polling, Catalog commit path.
- `apps/native/components/vault/action-dock.tsx` — HIG 44pt floating primary pill.
- `apps/native/lib/api/collectibles.ts` — prefs on draft insert; client-owned publish.
- `apps/native/lib/image-utils.ts` — `uploadImage` simplification; Assembly variants removed from client path.
- `apps/native/components/upload/assembly-step.tsx` — **deleted**.
- `packages/api/src/modules/extraction.ts` — `pollEngineJobStatus` / `EngineJobStatus`.
- `supabase/functions/job-status/`, `_shared/engine-mapping.ts`, `looking-glass-webhook/` — extraction contract (prod already deployed).
- `supabase/migrations/20260601130000_client_owned_completion_and_rejected.sql` — in repo; applied in prod as `20260601175504`.
- `docs/EXTRACTION_CONTRACT.md` — cross-system contract doc.

## Incomplete Work
- **`git push origin main`** — `feb0c25` not pushed this session.
- **Preview runtime-`2` IPA cut** — still pending if team on May 24/26 runtime-`1` installs (`eas build --profile preview --platform ios`).
- **Lattice soak on preview binary** — OTA shipped; founder device validation not recorded this session.
- **Worker always-on deployment** — extraction queues without PC worker running.
- **Variant strategy post-Assembly** — client `assemblyVariants` removed; grid thumbnails may rely on originals / future backfill.
- Upload Lane B-D, V1 memorabilia → PhotoReorderGrid, native session conflict, Subscription Phase 1 — unchanged.

## Validation Performed
- ESLint: clean on `upload-entry.tsx`.
- `tsc`: pre-existing native errors only; no new Lattice blockers identified.
- Supabase MCP: migration + `job-status` + `looking-glass-webhook` verified ACTIVE and matching repo logic.
- `eas update --channel preview` — succeeded (iOS + Android bundles, runtime `2`).
- No founder device soak of full upload → Lattice → Review → Catalog this session.

## Risks And Warnings
- **OTA without cold restart** — preview users won't see Lattice until force-quit + reopen.
- **Runtime-`1` devices** — this OTA does not apply; need runtime-`2` IPA reinstall.
- **Worker off = queued forever** — enqueue works; processing does not.
- **Client-owned publish** — pieces stay in My Queue until **Catalog**; old auto-publish expectation wrong.
- **Assembly removed** — DO_NOT_BREAK / CURRENT_STATE still describe old Scan→Finalize→Assembly flow until memory updated.
- **`ENGINE_SHARED_SECRET` in `.env`** — loaded during OTA export; never commit.

## Next Best Task
**Soak the Lattice on a runtime-`2` preview device:** cold restart after OTA, worker running, one full upload (Identify → Activate Looking Glass → watch stage choreography → Catalog). Then `git push origin main` if soak passes.

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. Preview OTA 8e9655e9 ships Lattice + Identify-first on runtime 2. Confirm founder soaked upload on preview binary with worker running. If good: push feb0c25 and cut runtime-2 preview IPA if team still on runtime-1. If Lattice stages stuck on cosmetic copy: check job-status logs + worker.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — 2026-06-02 entry appended.
- `HANDOFF.md` — rewritten.
- `CURRENT_STATE.md` — priority + AI Upload Flow updated (2026-06-02).
- `DECISION_LOG.md` — Lattice Theater decision added; 25s ring decision superseded.
- `OPEN_THREADS.md` — extraction reliability partially addressed; Post-Assembly variant thread added.

## What Not To Touch
- Lattice stage choreography / `STAGE_RANK` mapping without reading `docs/EXTRACTION_CONTRACT.md`.
- `runtimeVersion` — stay `"2"` until next native bump.
- `LensPager` page-0 gesture; collectible detail lens chrome.
- `PhotoReorderGrid` primitive internals.
- `supabase/.temp/*` — never commit.

## Proposed Updates To Watch For
- CURRENT_STATE upload section — still describes Scan/Finalize/Assembly/25s Theater (stale).
- DECISION_LOG — add Lattice Theater decision; supersede 25s ring Theater decision for new UX.
- OPEN_THREADS — mark Theater reliability partially addressed (job-status reconcile); note Assembly removal / variant gap.
- DO_NOT_BREAK — update upload flow steps if founder confirms Assembly is permanently gone.
