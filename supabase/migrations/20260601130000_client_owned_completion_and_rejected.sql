-- ============================================================================
-- Client-owned single-lane completion + 'rejected' terminal state
-- ----------------------------------------------------------------------------
-- Part of the Images/Engine/Upload overhaul. See docs/EXTRACTION_CONTRACT.md.
--
-- 1. Adds 'rejected' to the extraction_status CHECK (engine recognized the
--    input but rejected it, e.g. not a collectible).
-- 2. Makes single-lane completion CLIENT-OWNED: the trigger still promotes
--    extracted -> complete (so the piece lands in My Queue -> Review), but it
--    no longer sets published_at for single-lane rows. Publishing is the user's
--    "Add to Collection" action (commitDraftCollectible sets published_at).
--    Batch lanes continue to honor batch_uploads.auto_publish unchanged.
-- ============================================================================

-- ── 1. Widen the extraction_status CHECK to include 'rejected' ───────────────
ALTER TABLE public.collectibles
  DROP CONSTRAINT IF EXISTS collectibles_extraction_status_check;

ALTER TABLE public.collectibles
  ADD CONSTRAINT collectibles_extraction_status_check
  CHECK (
    extraction_status IS NULL
    OR extraction_status IN (
      'queued', 'processing', 'extracted', 'complete', 'failed', 'rejected'
    )
  );

-- ── 2. Client-owned completion for single-lane ───────────────────────────────
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

    -- Server-side commit: promote 'extracted' to 'complete' so the piece is
    -- ready and lands in My Queue -> Review (complete + published_at NULL).
    NEW.extraction_status := 'complete';

    -- Conditional publish:
    --   - Single-lane (batch_id IS NULL) -> CLIENT-OWNED: do NOT publish here.
    --     The user's "Add to Collection" (commitDraftCollectible) sets
    --     published_at. Abandoned pieces remain in My Queue -> Review.
    --   - Batch lane -> honor the batch's auto_publish flag.
    IF NEW.batch_id IS NULL THEN
      NULL;  -- intentionally no publish for single-lane
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
  'Server-side completion. Promotes extracted -> complete. Single-lane is client-owned (no auto-publish; user commit sets published_at). Batch lanes honor batch_uploads.auto_publish.';

-- Trigger definition is unchanged (BEFORE UPDATE OF extraction_status); the
-- function body above is replaced in place.
