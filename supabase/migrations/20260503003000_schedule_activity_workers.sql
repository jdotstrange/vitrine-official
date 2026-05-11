-- Schedule the three Activity Surface cron workers.
--
-- All three workers share a single CRON_SECRET that pg_cron passes via
-- Authorization: Bearer <secret>. The secret lives in Supabase Vault
-- so the schedule definition is committable to source control.
--
-- After applying this migration, the operator must mirror the value
-- of `vault.secrets.cron_secret` into the Edge Function environment
-- (Dashboard → Edge Functions → Secrets → CRON_SECRET=<value>) so the
-- workers can validate the inbound Authorization header. The migration
-- prints the value via RAISE NOTICE on first run for that purpose.
--
-- Cadences (UTC):
--   02:15 daily  — comp-alert-worker
--   02:30 daily  — view-milestone-checker
--   02:45 Mon    — view-rollup-worker
--
-- Times are staggered to keep the workers from contending for the same
-- HTTP queue slots and to keep their log streams readable.

-- ───────────────────────────────────────────────────────────────────────
-- Bootstrap secrets (idempotent; only writes on first migration run)
-- ───────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_secret text;
  v_project_url text := 'https://fxmiongkckkrllgyfwyw.supabase.co';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret') THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    PERFORM vault.create_secret(
      v_secret,
      'cron_secret',
      'Shared bearer secret for Activity Surface cron workers'
    );
    RAISE NOTICE '────────────────────────────────────────────────────────────';
    RAISE NOTICE 'Activity Surface cron_secret generated:';
    RAISE NOTICE '  %', v_secret;
    RAISE NOTICE 'Mirror this value into Edge Function env as CRON_SECRET';
    RAISE NOTICE '(Dashboard → Edge Functions → Secrets).';
    RAISE NOTICE '────────────────────────────────────────────────────────────';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret(
      v_project_url,
      'project_url',
      'Project base URL used by activity cron jobs to invoke Edge Functions'
    );
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────
-- Helper: drop existing schedule with the given name, if any.
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unschedule_if_exists(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = p_name;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────
-- comp-alert-worker — daily at 02:15 UTC
-- ───────────────────────────────────────────────────────────────────────
SELECT public.unschedule_if_exists('activity-comp-alert-daily');
SELECT cron.schedule(
  'activity-comp-alert-daily',
  '15 2 * * *',
  $job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/comp-alert-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $job$
);

-- ───────────────────────────────────────────────────────────────────────
-- view-milestone-checker — daily at 02:30 UTC
-- ───────────────────────────────────────────────────────────────────────
SELECT public.unschedule_if_exists('activity-view-milestone-daily');
SELECT cron.schedule(
  'activity-view-milestone-daily',
  '30 2 * * *',
  $job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/view-milestone-checker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $job$
);

-- ───────────────────────────────────────────────────────────────────────
-- view-rollup-worker — weekly Mondays at 02:45 UTC
-- ───────────────────────────────────────────────────────────────────────
SELECT public.unschedule_if_exists('activity-view-rollup-weekly');
SELECT cron.schedule(
  'activity-view-rollup-weekly',
  '45 2 * * 1',
  $job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/view-rollup-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $job$
);
