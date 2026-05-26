# Handoff

Last updated: 2026-05-26
Last verified: 2026-05-26

## Session Summary
- **Drag-Reorder V2 migration** on branch `feature/drag-reorder-v2`: migrated the upload Scan-step photo grid from `react-native-draggable-flatlist` to `react-native-reanimated-dnd@^2.0.0` and extracted the implementation into the canonical `<PhotoReorderGrid />` vault primitive. Founder validated all 12 plan validation steps on dev client — lift/shuffle/COVER/remove-X/haptics/upload-flow regression all pass.

## Current State
- **Branch `feature/drag-reorder-v2`** — implementation complete, founder dev-client validated, commits landing now. Not yet merged to `main`.
- **Binary rebuild required** — bumped `react-native-reanimated` 4.1.7 → 4.3.1 and `react-native-worklets` 0.5 → 0.8 (native modules). Current preview binary cannot receive this via OTA alone. Next ship step: founder runs `eas build --profile preview` after merge.
- **DFL retained** in `package.json` — legacy V1 memorabilia flow (`upload/memorabilia-core-form.tsx` → `upload/photo-grid.tsx`) still consumes it. Full DFL removal is a follow-up thread.
- **Production / preview OTA** still at `cbc131b` on `main` until this branch merges and a new preview binary ships.

## Files Changed Recently
- `apps/native/components/vault/photo-reorder-grid.tsx` (new) — canonical multi-photo reorder primitive (SortableGrid, lift visual, live COVER, remove-X disable, haptics, `+` sentinel).
- `apps/native/components/vault/index.ts` — barrel export for `PhotoReorderGrid`, `PhotoReorderGridProps`, `PhotoAsset`.
- `apps/native/components/upload-entry.tsx` — ScanStep now consumes `<PhotoReorderGrid />`; ~140 lines of inline DFL grid logic deleted.
- `apps/native/package.json` + `pnpm-lock.yaml` — added `react-native-reanimated-dnd@^2.0.0`; bumped reanimated + worklets.
- Memory docs + `.cursor/rules/design-system-playbook.mdc` — cross-platform-consistency-first principle, PhotoReorderGrid as canonical primitive, Layer-2 thread closed.

## Incomplete Work
- **Merge + preview binary** — commit, PR review, merge to `main`, then `eas build --profile preview` for team distribution.
- **Migrate V1 memorabilia photo grid to `PhotoReorderGrid`** — removes last DFL dependency (horizontal carousel; needs orientation prop or sibling primitive). See OPEN_THREADS.
- **Upload Lane Chunks B-D** — Batch Lane Review tab is the next `PhotoReorderGrid` consumer. Not started.
- All prior open threads unchanged: 97% upload hang, native session conflict, subscription Phase 1, PHPicker regression watch, keyboardType audit, etc.

## Validation Performed
- Founder dev-client: all 12 §Validation steps from the drag-reorder plan passed (grid growth, long-press lift, shuffle, COVER live-anchor, drop positions, snap-back, remove-X disable, theme switch, full upload-flow regression).
- `npx tsc --noEmit` — 107-error baseline preserved; no new errors introduced.
- `ReadLints` clean on `upload-entry.tsx` and `photo-reorder-grid.tsx`.

## Risks And Warnings
- **Do NOT OTA this to the current preview binary** — native dep bump requires a new preview build first.
- **`PhotoReorderGrid` is a multi-consumer shared primitive** — breaking its prop interface cascades to every future multi-photo reorder surface. See DO_NOT_BREAK.
- **No shadows in lift visuals** — cross-platform consistency rule; inner glow + brandVolt border only.
- **Legacy DFL crash constraints still apply** to V1 memorabilia flow until that migration ships.
- All prior Do-Not-Touch areas still apply: keyboard wrappers, `published_at` gate, native PHPicker rollback path, etc.

## Next Best Task
1. Merge `feature/drag-reorder-v2` to `main`.
2. `eas build --profile preview` (iOS + Android as needed) — distribute to team.
3. 24h soak on preview; then JS-only polish can ship via `eas update --channel preview`.
4. Optional follow-up: V1 memorabilia → `PhotoReorderGrid` to retire DFL entirely.

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. Drag-reorder V2 is merged and preview binary is rebuilding. Pick up Upload Lane Chunk B (Batch Lane Review tab photo reorder via PhotoReorderGrid) OR the V1 memorabilia DFL migration — founder preference required.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md`, `DECISION_LOG.md`, `OPEN_THREADS.md`, `DO_NOT_BREAK.md`, `CURRENT_STATE.md`, `QUICK_REFERENCE.md`, `HANDOFF.md` (this file), `.cursor/rules/design-system-playbook.mdc`.

## What Not To Touch
- `PhotoReorderGrid` prop interface without migrating all consumers.
- Reach for `react-native-reanimated-dnd` directly at call sites — use the primitive.
- Re-introduce DFL experimental flags / nested Reanimated layout in V1 memorabilia flow.
- `supabase/.temp/*` — do not commit.

## Proposed Updates To Watch For
- After preview binary ships, confirm no upload-tab cold-open crash regression (24h Sentry watch).
- Founder tactile feedback on spring/haptic tuning — iterate inside `photo-reorder-grid.tsx` only (OTA-eligible after new binary).
- When V1 memorabilia migrates, remove `react-native-draggable-flatlist` from `package.json` and scrub legacy DFL constraints from DO_NOT_BREAK.
