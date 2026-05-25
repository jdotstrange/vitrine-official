-- Reconcile batch_uploads access: grant authenticated role privileges
-- and restore restrictive RLS policies that were simplified to `true`
-- during debugging (when the real cause was the missing GRANTs).
--
-- Background: 20260518000000_create_batch_uploads.sql enabled RLS and
-- created restrictive policies but never granted table-level privileges
-- to the `authenticated` role. PostgREST requires both grants AND
-- RLS-pass for any operation, so the table was effectively unreachable
-- from the browser regardless of how permissive the policies were.
-- Debugging temporarily simplified the SELECT/INSERT policies to `true`,
-- which didn't help (grants were always the real culprit). This
-- migration adds the missing grants and restores the restrictive
-- policies in one atomic step.
--
-- The 20260518000000 migration file is also amended (in the same
-- commit) to include the GRANT clause, so future `supabase db reset`
-- runs produce a correct table on the first try.

GRANT SELECT, INSERT, UPDATE ON public.batch_uploads TO authenticated;

DROP POLICY IF EXISTS "Users can insert batch uploads"     ON public.batch_uploads;
DROP POLICY IF EXISTS "Users can view own batch uploads"   ON public.batch_uploads;
DROP POLICY IF EXISTS "Users can update own batch uploads" ON public.batch_uploads;

CREATE POLICY "Users can view own batch uploads"
  ON public.batch_uploads FOR SELECT
  USING (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own batch uploads"
  ON public.batch_uploads FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can update own batch uploads"
  ON public.batch_uploads FOR UPDATE
  USING (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
