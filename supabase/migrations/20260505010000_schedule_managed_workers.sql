-- Managed Showcase V1 — cron scheduling
--
-- Two sweep jobs:
--   1. incremental (every 5 min) — re-evaluates showcases whose owner's
--      collection changed since the last eval. Most runs are no-ops.
--   2. full (nightly 03:15 UTC) — drift correction. Runs after the
--      network-suggested-cache-purge (03:00 UTC) so they don't contend.
--
-- Auth follows the existing pattern: cron_secret from Supabase Vault,
-- passed via Authorization Bearer header.

-- ── Unschedule any existing jobs first (idempotent) ─────────────────────
SELECT public.unschedule_if_exists('managed-sweep-incremental');
SELECT public.unschedule_if_exists('managed-sweep-nightly');

-- ── Incremental sweep — every 5 minutes ─────────────────────────────────
SELECT cron.schedule(
  'managed-sweep-incremental',
  '*/5 * * * *',
  $job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/managed-sweep-worker?mode=incremental',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    timeout_milliseconds := 120000
  );
  $job$
);

-- ── Nightly full sweep — 03:15 UTC ──────────────────────────────────────
SELECT cron.schedule(
  'managed-sweep-nightly',
  '15 3 * * *',
  $job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/managed-sweep-worker?mode=full',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    timeout_milliseconds := 120000
  );
  $job$
);
