# Handoff

Last updated: 2026-05-24
Last verified: 2026-05-24

## Session Summary
- Shipped the **priming wave**: 11 commits that brought the project into a known-clean source-of-truth state. Backend (4 commits — push tokens migration, upload-lane-unification cluster, batch_uploads reconciliation, deployed edge functions), shared API (1 — published_at filter pass + collection-queries module), web (3 — SSR auth + vault shell + feature surfaces), marketing + share resolver tweaks (1), and docs (2 — subscription + handoffs, then memory refresh).
- **Diagnosed and fixed the batch_uploads INSERT empty `{}` error bug.** Root cause was missing `GRANT SELECT, INSERT, UPDATE ON batch_uploads TO authenticated` in the original migration. PostgREST requires both grants AND RLS-pass; the prior debug pass had correctly simplified policies to `true` to rule out RLS, but grants were always the real culprit. Reconciliation migration `20260525003750_reconcile_batch_uploads_access.sql` applied via Supabase MCP; restrictive policies restored.
- **Built and verified a new EAS preview iOS binary** (`e5113d4a-13c4-4e39-b276-3cf86e229435`, runtime version `1`, channel `preview`, fingerprint `6617dd77`) with `expo-updates` baked in. IPA installed on device. Smoke test passed: app boots clean, one upload completes end-to-end (validates the upload polling fix from commit `6d26a72`), push permission prompt appears. The OTA pipeline is now live — JS-only hotfixes ship via `eas update --channel preview` in ~90 seconds end-to-end.
- **Corrected two factual errors in memory docs** that surfaced during the priming audit: the `complete_and_publish` trigger description in DO_NOT_BREAK + DECISION_LOG was claiming it sets `extraction_completed_at` and inserts showcase rows. Neither is true. The trigger only flips `extraction_status` `'extracted'` → `'complete'` and sets `published_at = now()` (conditionally for the batch lane based on `auto_publish`).

## Current State
- **Source of truth aligned with reality** — every piece of work that's running in production is now committed. Local working tree should be clean except for ephemeral `supabase/.temp/*` files (gitignore pass deferred).
- **EAS dev client** active; OTA pipeline live on `preview` channel.
- **Authenticated web app fully scaffolded** but not deployed anywhere yet.
- **Subscription architecture locked** (9 docs in `docs/subscription/`); implementation not started.
- **Native binary on device** has: Sentry, push notifications, react-native-keyboard-controller, expo-updates (OTA), custom photo-library-picker, upload polling fix (handles both `'extracted'` and `'complete'` terminal statuses).

## Files Changed Recently
See `IMPLEMENTATION_LOG.md` entry "2026-05-24 - Priming wave" for the full file-by-commit breakdown. Headline:
- 4 backend commits (5 migrations + 2 edge functions + 1 design doc)
- 1 shared API commit (4 files)
- 3 web commits (~115 files total)
- 1 marketing tweaks commit (4 files)
- 2 docs commits (12 + 7 files)

## Incomplete Work
- **97% hang on single-lane uploads** — intermittent. Most uploads complete fine; signed items with no context provided seem most affected. Plan: Sentry-instrument `apps/native/components/upload-entry.tsx` to capture timing + extraction status at hang points, then diagnose. Deferred this session per user direction (priming first, data-driven fix after).
- **Native session conflict** — web sign-in logs out native app. Root cause identified in prior session (refresh token rotation + global `signOut` scope) but no fix applied.
- **Upload Lane Chunks B-D** — native MyQ surface (Review + Errors tabs), single-lane refactor, push notifications for batch completion. Not started.
- **Subscription Phase 1** schema work — locked architecture, no code.
- **`supabase/.temp/` gitignore pass** — these are ephemeral Supabase CLI working files. Adding `supabase/.temp/` to `.gitignore` and `git rm --cached supabase/.temp/cli-latest` deferred to a future hygiene commit.
- **Hand-off web app to hosting** — web app is fully scaffolded but no Vercel/etc deployment wired yet.

## Validation Performed
- Reconciliation migration applied via Supabase MCP `apply_migration`. Post-state verified by three queries: `authenticated` role now has SELECT/INSERT/UPDATE grants on `batch_uploads`; all 3 policies restored to restrictive; migration tracked in `supabase_migrations.schema_migrations` as `20260525003750_reconcile_batch_uploads_access`.
- EAS build completed in 7m 43s. Build dashboard: https://expo.dev/accounts/jlocastostack/projects/myvitrine/builds/e5113d4a-13c4-4e39-b276-3cf86e229435
- OTA channel created server-side (`Created update channel "preview" and branch "preview" on @jlocastostack/myvitrine`).
- Smoke test passed on device per user confirmation: "All good on all of these. native app preview build is working perfectly on device."
- All 11 commits landed cleanly. No pre-commit hook interventions.

## Risks And Warnings
- **`published_at IS NOT NULL` is load-bearing across the entire system.** Accidentally NULLing this column on a collectible hides it everywhere (collection, market, search, comps, showcases, tracking). Re-confirmed during the priming audit.
- **Native signOut uses global scope by default.** Any explicit `signOut()` call on either platform kills all sessions until the session-conflict bug is fixed.
- **OTA runtime version is `"1"`.** Bumping it requires a new preview build. Any change to: native deps, Expo config plugins, `app.json` `ios.infoPlist` / `android` config, app icons / splash, or any prebuild artifact, → bump runtime version → rebuild. JS / TSX / asset edits in `assets/` that aren't system icons → OTA-safe, no bump.
- **PostgREST schema cache.** After any DDL change applied via MCP `apply_migration` or `execute_sql`, run `NOTIFY pgrst, 'reload schema'` (the reconciliation migration already does this for its own scope; other migrations should too).

## Next Best Task
**Sentry-instrument the upload flow to diagnose the intermittent 97% hang.** Specifically, in `apps/native/components/upload-entry.tsx`:
1. Add Sentry breadcrumbs at each step transition (Scan → Theater enter → polling start → each poll iteration → terminal status → Review enter)
2. Capture `extraction_status` + elapsed-since-enqueue on each poll tick
3. Add a Sentry capture if polling exceeds ~25 seconds (cosmetic 30s timer threshold)
4. Push via `eas update --channel preview` — first real OTA validation
5. Collect a few days of data; pattern (genuinely slow extraction vs webhook never firing vs client-side stuck poll) will tell us where to fix

Alternative if user prefers another priority: native Session Conflict fix (smaller scope, no telemetry needed) or Upload Lane Chunk B (native MyQ surface).

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. Then instrument apps/native/components/upload-entry.tsx with Sentry breadcrumbs and a hang-detection capture for the 97% intermittent hang. Push via eas update --channel preview as the first real OTA validation. Goal is to collect data on whether the root cause is slow extraction, missing webhook, or stuck client poll.`

## Memory Updates Made This Session
- `HANDOFF.md` — rewritten (this file)
- `CURRENT_STATE.md` — replaced "Active bug: batch_uploads INSERT" section with priming-wave summary + bug resolution; added 97% hang to parallel tracks
- `OPEN_THREADS.md` — moved 3 items to Resolved (batch_uploads bug, edge function deployment, keyboard-controller rebuild); bumped date stamps
- `DO_NOT_BREAK.md` — corrected `complete_and_publish` trigger description (no `extraction_completed_at` write, no showcase row insert); bumped date stamps
- `DECISION_LOG.md` — corrected the "Server-side auto-commit via DB trigger" decision body (same trigger description fix); marked "Expo Go remains the dev target" as SUPERSEDED; bumped date stamps
- `IMPLEMENTATION_LOG.md` — prepended "2026-05-24 - Priming wave" entry covering all 11 commits + validation + notes
- `QUICK_REFERENCE.md` — refreshed "Current Sprint Focus" to reflect priming wave shipped + bug resolved + OTA live; bumped date stamps

## What Not To Touch
- `supabase/migrations/20260513000000_create_user_push_tokens.sql` — applied remotely, now committed
- `supabase/migrations/20260518000000_create_batch_uploads.sql` — applied remotely (and amended with the previously-missing GRANT clause), now committed
- `supabase/migrations/20260519170000_upload_lane_unification.sql` — applied remotely, now committed
- `supabase/migrations/20260519170100_upload_lane_cron_jobs.sql` — applied remotely, now committed
- `supabase/migrations/20260519170200_upload_lane_publish_filter_rpcs.sql` — applied remotely, now committed
- `supabase/migrations/20260525003750_reconcile_batch_uploads_access.sql` — applied remotely, now committed
- `apps/native/components/photo-library-picker.tsx` — permanent native picker replacement
- `docs/subscription/*` — architecture is locked
- `apps/native/app/_layout.tsx` — Sentry + KeyboardProvider + PushProvider placement is load-bearing

## Proposed Updates To Watch For
- When the 97% hang is diagnosed and fixed, update DECISION_LOG with the root cause + chosen fix.
- When `/v/*` web app gets a hosting wire-up, update CURRENT_STATE to flag deployment status.
- When the native session conflict is fixed, document the chosen approach (likely `signOut({ scope: 'local' })` everywhere) in DECISION_LOG.
- When `supabase/.temp/` is added to `.gitignore`, do it in a single hygiene commit with `git rm --cached supabase/.temp/cli-latest`.
