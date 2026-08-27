-- Wave 3 security: RLS on collectible_field_values.
-- Preview and production share this DB.
--
-- Writes bind to public.users.id via owns_collectible() (not auth.uid()).
-- SELECT mirrors parent collectibles visibility (EXISTS + parent RLS).
-- Do NOT owner-only SELECT — visitor Specs and comps v2 fallback would blank.
-- Specs UI itself reads collectibles.ai_metadata JSONB; this table is still
-- client-writable over REST and used on item delete + comps v2 fallback.

ALTER TABLE public.collectible_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read field values if parent visible"
  ON public.collectible_field_values;
DROP POLICY IF EXISTS "insert own collectible field values"
  ON public.collectible_field_values;
DROP POLICY IF EXISTS "update own collectible field values"
  ON public.collectible_field_values;
DROP POLICY IF EXISTS "delete own collectible field values"
  ON public.collectible_field_values;

CREATE POLICY "read field values if parent visible"
ON public.collectible_field_values
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.collectibles c
    WHERE c.id = collectible_id
  )
);

CREATE POLICY "insert own collectible field values"
ON public.collectible_field_values
FOR INSERT
TO authenticated
WITH CHECK (public.owns_collectible(collectible_id));

CREATE POLICY "update own collectible field values"
ON public.collectible_field_values
FOR UPDATE
TO authenticated
USING (public.owns_collectible(collectible_id))
WITH CHECK (public.owns_collectible(collectible_id));

CREATE POLICY "delete own collectible field values"
ON public.collectible_field_values
FOR DELETE
TO authenticated
USING (public.owns_collectible(collectible_id));
