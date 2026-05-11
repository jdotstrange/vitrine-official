-- Allow authenticated users to insert their own row into public.users when missing.
-- Fixes "User not found" for auth users created before the auth trigger existed.
-- WITH CHECK ensures they can only set supabase_auth_id to their own auth.uid().

CREATE POLICY "Authenticated users can insert own profile once"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (supabase_auth_id = auth.uid());
