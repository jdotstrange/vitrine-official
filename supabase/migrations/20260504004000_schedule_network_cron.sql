-- Network Surface V3 — daily purge for the Suggested Collectors cache.
--
-- The cache TTL is 36h, so any expired row is dead weight. We don't need
-- an Edge Function for this — a single in-database DELETE every day at
-- 03:00 UTC keeps the table lean. Slot 03:00 sits 15 minutes after the
-- last activity-surface job (02:45 view-rollup-weekly) so the workers
-- don't contend for shared resources.

SELECT public.unschedule_if_exists('network-suggested-cache-purge-daily');

SELECT cron.schedule(
  'network-suggested-cache-purge-daily',
  '0 3 * * *',
  $job$
  DELETE FROM public.suggested_collectors_cache
  WHERE expires_at <= now();
  $job$
);
