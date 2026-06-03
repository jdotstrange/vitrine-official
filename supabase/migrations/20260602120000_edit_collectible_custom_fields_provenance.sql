-- Edit Collectible flow: owner custom fields, post-catalog provenance, re-extraction staging tag.
--
-- custom_fields: owner-authored label/value pairs (never overwritten by Looking Glass).
-- metadata_provenance: tracks user corrections after catalog (ai.* / trait.* / listing_* keys).
-- reextraction_of: links a transient staging draft to the published collectible being re-scanned.

ALTER TABLE public.collectibles
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata_provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reextraction_of text NULL;

COMMENT ON COLUMN public.collectibles.custom_fields IS
  'Owner-authored fields: [{ id, label, value, created_at }]. Preserved across re-extraction.';

COMMENT ON COLUMN public.collectibles.metadata_provenance IS
  'Post-catalog edit provenance: { "ai.Year": { "source": "user", "at": "..." }, ... }.';

COMMENT ON COLUMN public.collectibles.reextraction_of IS
  'When set, this row is a staging draft for re-scanning the referenced published collectible.';

CREATE INDEX IF NOT EXISTS idx_collectibles_reextraction_of
  ON public.collectibles (reextraction_of)
  WHERE reextraction_of IS NOT NULL;

NOTIFY pgrst, 'reload schema';
