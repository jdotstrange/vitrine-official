-- Upload Lane Unification — schema foundation.
--
-- See docs/UPLOAD_LANE_UNIFICATION_PLAN.md for the full design.
--
-- This migration:
--   1. Adds publish/acknowledgment/failure-tracking columns to collectibles
--   2. Adds batch_id FK on collectibles → batch_uploads
--   3. Adds auto_publish flag to batch_uploads
--   4. Backfills existing rows so they're treated as "published + complete"
--   5. Creates the complete_and_publish trigger that flips
--      extraction_status → 'complete' and conditionally sets published_at
--   6. Creates partial indexes for the three primary query shapes:
--      - Owner / public collection (published)
--      - My Queue Review (held for review)
--      - My Queue Errors (failed extractions)

-- ── Schema additions on collectibles ─────────────────────────────────────
ALTER TABLE public.collectibles
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS extraction_acknowledged_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS extraction_retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extraction_failure_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS extraction_failed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS batch_id UUID NULL REFERENCES public.batch_uploads(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.collectibles.published_at IS
  'When the row became visible in the user''s collection. NULL = held for review (My Queue → Review). Set by the complete_and_publish trigger when extraction completes for auto-publish rows, or by the user when they tap Publish.';

COMMENT ON COLUMN public.collectibles.extraction_acknowledged_at IS
  'When the owner first viewed/edited this item''s AI-extracted fields. NULL = amber dot indicator visible to owner. Cleared by viewing specs surface or editing AI fields.';

COMMENT ON COLUMN public.collectibles.extraction_retry_count IS
  'Number of times the user has manually re-run extraction after a failure. Capped at 2 (3 total attempts).';

COMMENT ON COLUMN public.collectibles.extraction_failure_reason IS
  'Short reason code for failed extractions: unreadable_image | engine_error | timeout | enqueue_failed.';

COMMENT ON COLUMN public.collectibles.extraction_failed_at IS
  'When the row was marked failed. Drives the 45-day auto-purge timer.';

COMMENT ON COLUMN public.collectibles.batch_id IS
  'FK to batch_uploads when this row came from a batch. NULL for single-lane uploads. Used by the complete_and_publish trigger to look up the batch''s auto_publish flag.';

-- ── Schema addition on batch_uploads ─────────────────────────────────────
ALTER TABLE public.batch_uploads
  ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.batch_uploads.auto_publish IS
  'When true (default), items in this batch are published automatically when extraction completes. When false, items land in My Queue → Review for the user to publish manually.';

-- ── Backfill existing data ───────────────────────────────────────────────
-- All existing 'complete' rows have been in users' collections all along — they're published.
UPDATE public.collectibles
   SET published_at = updated_at
 WHERE extraction_status = 'complete'
   AND published_at IS NULL;

-- All NULL-status rows are legacy manual-entry items (predate the AI extraction system).
-- Mark them as complete + published; also acknowledge so they don't get the amber dot.
UPDATE public.collectibles
   SET extraction_status = 'complete',
       published_at = COALESCE(updated_at, created_at),
       extraction_acknowledged_at = COALESCE(updated_at, created_at)
 WHERE extraction_status IS NULL;

-- ── Trigger: server-side completion + conditional auto-publish ───────────
-- When the looking-glass-webhook flips a row to 'extracted', this trigger
-- fires BEFORE UPDATE, promotes the row to 'complete', and (depending on
-- the batch's auto_publish flag) sets published_at = now().

CREATE OR REPLACE FUNCTION public.complete_and_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_auto_publish BOOLEAN;
BEGIN
  -- Only act when the webhook is promoting a row to 'extracted'.
  IF NEW.extraction_status = 'extracted'
     AND (OLD.extraction_status IS NULL OR OLD.extraction_status <> 'extracted') THEN

    -- Server-side commit: promote 'extracted' to 'complete' immediately.
    NEW.extraction_status := 'complete';

    -- Conditional publish:
    --   - Single-lane (batch_id IS NULL) → always auto-publish
    --   - Batch lane → check the batch's auto_publish flag
    IF NEW.batch_id IS NULL THEN
      NEW.published_at := now();
    ELSE
      SELECT auto_publish INTO v_auto_publish
        FROM public.batch_uploads
       WHERE id = NEW.batch_id;

      -- Default to auto-publish if the batch row is missing for some reason.
      IF COALESCE(v_auto_publish, TRUE) THEN
        NEW.published_at := now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.complete_and_publish() IS
  'Trigger function for server-side upload completion. Flips extraction_status from extracted → complete and conditionally sets published_at based on batch.auto_publish (or always for single-lane).';

DROP TRIGGER IF EXISTS trg_complete_and_publish ON public.collectibles;
CREATE TRIGGER trg_complete_and_publish
  BEFORE UPDATE OF extraction_status ON public.collectibles
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_and_publish();

-- ── Indexes ──────────────────────────────────────────────────────────────
-- Owner collection / public surfaces — the hot path.
CREATE INDEX IF NOT EXISTS idx_collectibles_published
  ON public.collectibles (user_id, created_at DESC)
  WHERE published_at IS NOT NULL AND extraction_status = 'complete';

-- My Queue → Review (complete but not yet published).
CREATE INDEX IF NOT EXISTS idx_collectibles_queue_review
  ON public.collectibles (user_id, created_at DESC)
  WHERE extraction_status = 'complete' AND published_at IS NULL;

-- My Queue → Errors (failed extractions).
CREATE INDEX IF NOT EXISTS idx_collectibles_queue_errors
  ON public.collectibles (user_id, extraction_failed_at DESC)
  WHERE extraction_status = 'failed';

-- Watchdog scan: stuck queued/processing rows.
CREATE INDEX IF NOT EXISTS idx_collectibles_extraction_in_flight
  ON public.collectibles (extraction_status, updated_at)
  WHERE extraction_status IN ('queued', 'processing');

-- batch_id reverse lookup (for the trigger and history live-query).
CREATE INDEX IF NOT EXISTS idx_collectibles_batch_id
  ON public.collectibles (batch_id)
  WHERE batch_id IS NOT NULL;
