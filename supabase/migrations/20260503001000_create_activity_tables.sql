-- Activity Surface V1: schema additions
--
-- Four tables back the new Activity surface:
--   1. collectible_change_log  — audit trail of status/value mutations.
--      Source of truth for the JOURNAL stream's `you_changed_status` and
--      `you_changed_value` rows, and reusable for owner-side analytics
--      (top-edited items, edit cadence, etc.).
--   2. recent_views            — 30-day rolling per-target view buffer.
--      Daily-deduped via (target, day, viewer_anon_id). Powers unique-
--      viewer counts and feeds the weekly rollup. Anonymous-only by
--      design — viewer identity is intentionally not surfaced anywhere.
--   3. view_counters           — aggregate counters per target.
--      Cheap reads for card view-count badges; recomputed weekly for the
--      7-day windows used by the activity-feed digest.
--   4. comp_alert_state        — per-(tracked_item, surfaced_comp) dedupe.
--      Prevents `comp_alert` from re-firing for already-known matches as
--      the daily worker iterates the comps RPC.

-- ───────────────────────────────────────────────────────────────────────
-- 1. collectible_change_log
-- ───────────────────────────────────────────────────────────────────────
--
-- One row per status or value mutation on a collectible. `user_id` is
-- denormalized to the collectible owner so journal queries can index
-- straight off (user_id, created_at) without a join.
--
-- prev_value / new_value are jsonb so the same table cleanly carries
-- both shapes:
--   status: { "for_sale": bool, "for_trade": bool }
--   value:  { "amount": numeric }

CREATE TABLE IF NOT EXISTS public.collectible_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collectible_id text NOT NULL REFERENCES public.collectibles(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('status', 'value')),
  prev_value jsonb,
  new_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_log_user_recent
  ON public.collectible_change_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_change_log_collectible
  ON public.collectible_change_log (collectible_id, created_at DESC);

COMMENT ON TABLE public.collectible_change_log IS
  'Audit trail of collectible status/value mutations. Source for JOURNAL stream rows and owner-side change history.';

-- ───────────────────────────────────────────────────────────────────────
-- 2. recent_views
-- ───────────────────────────────────────────────────────────────────────
--
-- 30-day rolling per-(target, day, viewer) ledger. The unique constraint
-- enforces daily dedupe — one row per anon viewer per target per day.
-- viewer_anon_id is sha256(deviceId + ISO date) computed client-side, so
-- the same device gets a different ID each day. This gives us meaningful
-- daily unique-viewer counts without persisting cross-day identity.
--
-- target_type is a text union (collectible | showcase | profile) rather
-- than an enum so we can extend later (e.g., 'group') without a schema
-- migration.
--
-- viewed_on is a `date` not a timestamp — we collapse the dedupe key to
-- a calendar day. Use `created_at` for chronological queries.

CREATE TABLE IF NOT EXISTS public.recent_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('collectible', 'showcase', 'profile')),
  target_id text NOT NULL,
  viewed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  viewer_anon_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_recent_views_target_day_viewer
  ON public.recent_views (target_type, target_id, viewed_on, viewer_anon_id);

CREATE INDEX IF NOT EXISTS idx_recent_views_target
  ON public.recent_views (target_type, target_id, viewed_on DESC);

CREATE INDEX IF NOT EXISTS idx_recent_views_purge
  ON public.recent_views (viewed_on);

COMMENT ON TABLE public.recent_views IS
  '30-day rolling view ledger. Anonymous viewer identity (sha256 of deviceId + date). Powers view counters and weekly digest. Purged by view-rollup-worker.';

-- ───────────────────────────────────────────────────────────────────────
-- 3. view_counters
-- ───────────────────────────────────────────────────────────────────────
--
-- One row per target. total_views and unique_viewers are incrementally
-- maintained by the record_view RPC; views_7d / unique_viewers_7d are
-- recomputed weekly by view-rollup-worker. last_milestone tracks the
-- highest-crossed threshold so view-milestone-checker doesn't re-fire.

CREATE TABLE IF NOT EXISTS public.view_counters (
  target_type text NOT NULL CHECK (target_type IN ('collectible', 'showcase', 'profile')),
  target_id text NOT NULL,
  total_views bigint NOT NULL DEFAULT 0,
  unique_viewers bigint NOT NULL DEFAULT 0,
  views_7d bigint NOT NULL DEFAULT 0,
  unique_viewers_7d bigint NOT NULL DEFAULT 0,
  last_milestone bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (target_type, target_id)
);

COMMENT ON TABLE public.view_counters IS
  'Aggregate per-target view counters. total_views/unique_viewers maintained by record_view RPC; weekly windows by view-rollup-worker; last_milestone gated by view-milestone-checker.';

-- ───────────────────────────────────────────────────────────────────────
-- 4. comp_alert_state
-- ───────────────────────────────────────────────────────────────────────
--
-- Dedupe table for comp-alert-worker. Each row marks a (tracked item,
-- surfaced comp) pair as already-notified. The worker filters fresh
-- candidates with NOT EXISTS against this table.

CREATE TABLE IF NOT EXISTS public.comp_alert_state (
  tracked_collectible_id text NOT NULL REFERENCES public.collectibles(id) ON DELETE CASCADE,
  surfaced_comp_id text NOT NULL REFERENCES public.collectibles(id) ON DELETE CASCADE,
  first_surfaced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tracked_collectible_id, surfaced_comp_id)
);

COMMENT ON TABLE public.comp_alert_state IS
  'Dedupe ledger for comp-alert-worker. Prevents re-firing comp_alert for already-known strong-match comps.';
