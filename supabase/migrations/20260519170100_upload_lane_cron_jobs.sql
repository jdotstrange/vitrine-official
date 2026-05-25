-- Upload Lane Unification — background cron jobs.
--
-- Two pure-SQL cron jobs:
--   1. extraction-watchdog (every minute) — marks stuck queued/processing
--      rows as failed so the user can retry. Also fail-safes against
--      enqueue_extraction errors that left rows orphaned in 'queued'.
--   2. failed-extractions-purge (daily 04:00 UTC) — hard-deletes failed
--      collectibles after a 45-day grace period.
--
-- Neither requires HTTP calls (pg_net/edge functions) since the work is
-- all local SQL. They run as the postgres superuser via pg_cron.

-- ── Idempotent cleanup of any prior schedules ────────────────────────────
SELECT public.unschedule_if_exists('extraction-watchdog');
SELECT public.unschedule_if_exists('failed-extractions-purge');

-- ── Watchdog — every minute ──────────────────────────────────────────────
-- Thresholds:
--   - 'queued' > 2 minutes  → enqueue_extraction call probably failed silently
--   - 'processing' > 10 minutes → looking-glass-webhook never returned;
--     either timed out or crashed mid-extraction
--
-- updated_at is the heartbeat; the webhook updates it when transitioning
-- queued → processing → extracted, so a stale updated_at is the right signal.
SELECT cron.schedule(
  'extraction-watchdog',
  '* * * * *',
  $job$
  UPDATE public.collectibles
     SET extraction_status = 'failed',
         extraction_failure_reason = 'enqueue_failed',
         extraction_failed_at = now(),
         updated_at = now()
   WHERE extraction_status = 'queued'
     AND updated_at < now() - interval '2 minutes';

  UPDATE public.collectibles
     SET extraction_status = 'failed',
         extraction_failure_reason = 'timeout',
         extraction_failed_at = now(),
         updated_at = now()
   WHERE extraction_status = 'processing'
     AND updated_at < now() - interval '10 minutes';
  $job$
);

-- ── Auto-purge — daily at 04:00 UTC ──────────────────────────────────────
-- Runs after the existing nightly jobs (managed-sweep-nightly is at 03:15)
-- to avoid lock contention. Hard-deletes failed collectibles whose owner
-- has had 45 days to either retry or remove. The native app shows a 7-day
-- visible countdown when extraction_failed_at is within 7 days of expiry.
SELECT cron.schedule(
  'failed-extractions-purge',
  '0 4 * * *',
  $job$
  DELETE FROM public.collectibles
   WHERE extraction_status = 'failed'
     AND extraction_failed_at IS NOT NULL
     AND extraction_failed_at < now() - interval '45 days';
  $job$
);
