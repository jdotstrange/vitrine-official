-- Managed Showcase V1 — schema
--
-- A managed showcase is a persisted rule + a materialized membership table.
-- Rules express user intent; the materialized junction (`showcase_collectibles`)
-- keeps reads identical to manual showcases. An evaluator (TypeScript, one source
-- of truth) maintains the diff between the two on three triggers: rule save
-- (immediate), 5-minute incremental cron sweep, and a nightly full sweep.
--
-- The `collectibles_last_changed_at` watermark on `users` is the cheap signal
-- the 5-minute sweep uses to decide which owners need re-evaluation. An
-- AFTER INSERT/UPDATE/DELETE trigger on `collectibles` bumps the watermark
-- whenever an owner's collection changes — debounced naturally because the
-- sweep only runs every 5 minutes.

-- ── Showcases: rule storage ───────────────────────────────────────────────
ALTER TABLE public.showcases
  ADD COLUMN IF NOT EXISTS rules jsonb,
  ADD COLUMN IF NOT EXISTS rules_match text,
  ADD COLUMN IF NOT EXISTS rules_last_evaluated_at timestamptz,
  ADD COLUMN IF NOT EXISTS rules_last_evaluation_status text;

-- Constrain rules_match to the two valid match modes. Allow NULL because
-- manual showcases don't have a match mode.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'showcases_rules_match_check'
  ) THEN
    ALTER TABLE public.showcases
      ADD CONSTRAINT showcases_rules_match_check
      CHECK (rules_match IS NULL OR rules_match IN ('all', 'any'));
  END IF;
END
$$;

COMMENT ON COLUMN public.showcases.rules IS 'JSON array of {field, op, value} conditions evaluated against collectibles. NULL for manual showcases.';
COMMENT ON COLUMN public.showcases.rules_match IS 'Match mode for managed-showcase rules: "all" (AND) or "any" (OR). NULL for manual showcases.';
COMMENT ON COLUMN public.showcases.rules_last_evaluated_at IS 'Timestamp of the last successful rule evaluation against this owner''s collection. Used by the incremental sweep watermark check.';
COMMENT ON COLUMN public.showcases.rules_last_evaluation_status IS 'Status of the last evaluation attempt: "ok", "error:<reason>", etc. Surfaces in the rules-summary line on the showcase detail.';

-- Backfill any legacy `type = 'auto'` rows to the new canonical 'managed'.
-- Production data shows zero 'auto' rows today (all 690 showcases are 'manual'),
-- but keep this idempotent in case a stray exists in any branch / preview env.
UPDATE public.showcases SET type = 'managed' WHERE type = 'auto';

-- Predicate index for the 5-minute sweep query — find owners with managed
-- showcases without scanning the table.
CREATE INDEX IF NOT EXISTS idx_showcases_user_id_managed
  ON public.showcases (user_id) WHERE type = 'managed';

-- Watermark on the rules_last_evaluated_at for the same sweep — lets the
-- worker join `showcases` against `users.collectibles_last_changed_at`
-- and skip showcases whose owner hasn't changed anything since the last eval.
CREATE INDEX IF NOT EXISTS idx_showcases_rules_last_evaluated_at
  ON public.showcases (rules_last_evaluated_at) WHERE type = 'managed';

-- ── Users: per-owner change watermark ────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS collectibles_last_changed_at timestamptz;

COMMENT ON COLUMN public.users.collectibles_last_changed_at IS 'Bumped by an AFTER trigger on collectibles whenever this user''s collection changes (insert / update / delete). The managed-showcase incremental sweep uses this as a cheap "needs re-eval?" signal.';

-- Index supports the sweep predicate `users.collectibles_last_changed_at > showcases.rules_last_evaluated_at`.
CREATE INDEX IF NOT EXISTS idx_users_collectibles_last_changed_at
  ON public.users (collectibles_last_changed_at) WHERE collectibles_last_changed_at IS NOT NULL;

-- ── Collectibles: AFTER trigger that bumps the watermark ────────────────
CREATE OR REPLACE FUNCTION public.touch_collectibles_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
BEGIN
  -- COALESCE handles INSERT (NEW.user_id), UPDATE (NEW.user_id), and DELETE (OLD.user_id).
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF v_user_id IS NOT NULL THEN
    UPDATE public.users
      SET collectibles_last_changed_at = now()
      WHERE id = v_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.touch_collectibles_changed() IS 'Bumps users.collectibles_last_changed_at whenever a row in collectibles is inserted, updated, or deleted. Cheap watermark for the managed-showcase incremental sweep.';

DROP TRIGGER IF EXISTS trg_touch_collectibles_changed ON public.collectibles;

CREATE TRIGGER trg_touch_collectibles_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.collectibles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_collectibles_changed();
