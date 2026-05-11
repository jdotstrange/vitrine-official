-- Install pg_cron + pg_net for source-controlled scheduled jobs.
--
-- Activity Surface V1 needs three workers on cadence:
--   - comp-alert-worker     (daily)
--   - view-rollup-worker    (weekly, Mondays)
--   - view-milestone-checker (daily)
--
-- pg_cron schedules the jobs; pg_net.http_post invokes the corresponding
-- Edge Functions over HTTP. Both extensions live under the `extensions`
-- schema per Supabase convention.

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- pg_cron's `cron` schema is created by the extension itself, but only
-- the postgres role can manage jobs by default. Grant USAGE so the
-- service_role can introspect schedules from RPCs/dashboards.
GRANT USAGE ON SCHEMA cron TO service_role;

-- pg_net's queue table needs read access for status checks.
GRANT USAGE ON SCHEMA net TO service_role;
