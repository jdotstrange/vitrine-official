-- Activity Surface V1: view-tracking RPCs
--
-- Two functions back the view-tracking surface:
--   - record_view: called by the app on every screen mount (profile,
--     collectible-detail, showcase-detail). Daily-deduped via the
--     recent_views unique constraint; only bumps view_counters when a
--     new daily-unique view actually lands. Privacy-checked server-side
--     so a leaked target id can't be counted against a private item.
--   - get_view_counts: batch lookup for card view-count badges. Cheap
--     because it reads from the materialized view_counters table.
--
-- Self-view is suppressed CLIENT-SIDE (the app knows both the viewer's
-- userId and the target owner's userId, so it short-circuits the RPC
-- when they match). The anon viewer_id is intentionally identity-free,
-- so the RPC has no way to detect self-view server-side.

-- ───────────────────────────────────────────────────────────────────────
-- record_view
-- ───────────────────────────────────────────────────────────────────────
--
-- Returns void. Idempotent on the day for any given (target, viewer)
-- pair: subsequent calls within the same UTC day are no-ops.
--
-- Counter semantics (V1):
--   total_views = lifetime count of daily-unique views.
--                 Bumped once per (target, day, viewer) regardless of
--                 how many times the same viewer hits the screen that
--                 day. This is intentionally a "view-day" metric, not
--                 raw page hits — the latter is gameable and not what
--                 collectors care about.

CREATE OR REPLACE FUNCTION public.record_view(
  p_target_type text,
  p_target_id text,
  p_viewer_anon_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_privacy text;
  v_inserted integer;
BEGIN
  -- Validate target_type at the boundary so the unique constraint
  -- doesn't surface a confusing 23514 to clients.
  IF p_target_type NOT IN ('collectible', 'showcase', 'profile') THEN
    RAISE EXCEPTION 'invalid_target_type' USING ERRCODE = '22023';
  END IF;

  -- Skip private targets. Profiles don't currently have a per-profile
  -- privacy gate, so they always count.
  IF p_target_type = 'collectible' THEN
    SELECT privacy INTO v_privacy
      FROM collectibles WHERE id = p_target_id;
    IF v_privacy IS NULL OR v_privacy = 'private' THEN
      RETURN;
    END IF;
  ELSIF p_target_type = 'showcase' THEN
    SELECT visibility INTO v_privacy
      FROM showcases WHERE id = p_target_id;
    IF v_privacy IS NULL OR v_privacy = 'private' THEN
      RETURN;
    END IF;
  END IF;

  -- Try to mark the daily-unique view. If a row already exists for this
  -- (target, day, viewer), the insert is a no-op and FOUND stays false.
  INSERT INTO recent_views (target_type, target_id, viewer_anon_id)
  VALUES (p_target_type, p_target_id, p_viewer_anon_id)
  ON CONFLICT (target_type, target_id, viewed_on, viewer_anon_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    INSERT INTO view_counters (target_type, target_id, total_views, updated_at)
    VALUES (p_target_type, p_target_id, 1, now())
    ON CONFLICT (target_type, target_id) DO UPDATE SET
      total_views = view_counters.total_views + 1,
      updated_at = now();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_view(text, text, text) TO authenticated, anon;

COMMENT ON FUNCTION public.record_view(text, text, text) IS
  'Daily-deduped view recorder. Bumps view_counters.total_views once per (target, day, viewer). Skips private collectibles/showcases. Self-view filtering is client-side.';

-- ───────────────────────────────────────────────────────────────────────
-- get_view_counts
-- ───────────────────────────────────────────────────────────────────────
--
-- Batch lookup for card-surface badge rendering. Returns rows only for
-- targets with non-zero counters; the caller fills in zeros for misses.
-- STABLE because view_counters mutates on writes — but mid-transaction
-- callers don't observe their own writes within a single statement, so
-- STABLE is correct.

CREATE OR REPLACE FUNCTION public.get_view_counts(
  p_target_type text,
  p_target_ids text[]
)
RETURNS TABLE (
  target_id text,
  total_views bigint,
  views_7d bigint,
  unique_viewers_7d bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    vc.target_id,
    vc.total_views,
    vc.views_7d,
    vc.unique_viewers_7d
  FROM view_counters vc
  WHERE vc.target_type = p_target_type
    AND vc.target_id = ANY(p_target_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_view_counts(text, text[]) TO authenticated, anon;

COMMENT ON FUNCTION public.get_view_counts(text, text[]) IS
  'Batch view-counter lookup for card badge rendering. Returns one row per target that has been viewed at least once.';
