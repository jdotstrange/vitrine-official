-- Add 'extracted' to the extraction_status CHECK constraint.
-- 'extracted' means: engine finished, data ready, user has not yet confirmed.

ALTER TABLE public.collectibles
  DROP CONSTRAINT IF EXISTS collectibles_extraction_status_check;

ALTER TABLE public.collectibles
  ADD CONSTRAINT collectibles_extraction_status_check
  CHECK (
    extraction_status IS NULL
    OR extraction_status IN ('queued', 'processing', 'extracted', 'complete', 'failed')
  );

-- Enable Realtime on collectibles so the Theater can subscribe to row changes.
ALTER PUBLICATION supabase_realtime ADD TABLE public.collectibles;
