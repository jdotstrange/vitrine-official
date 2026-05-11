-- Allow authenticated users to "claim" a public.users row that has no supabase_auth_id
-- when the row's email or phone matches the JWT (so they can link existing profile to auth).
-- WITH CHECK ensures they can only set supabase_auth_id to their own auth.uid().

CREATE POLICY "Users can claim row by email or phone"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    supabase_auth_id IS NULL
    AND (
      (auth.jwt() ->> 'email') IS NOT NULL AND email = (auth.jwt() ->> 'email')
      OR
      (auth.jwt() ->> 'phone') IS NOT NULL AND phone_number = (auth.jwt() ->> 'phone')
    )
  )
  WITH CHECK (supabase_auth_id = auth.uid());
