-- Allow users to feature one showcase on their profile.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS featured_showcase_id text REFERENCES public.showcases(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.featured_showcase_id IS 'Optional showcase to display as hero on the user profile.';

-- RLS: users can update their own featured_showcase_id (existing update policies may already allow this).
-- If not, add: (e.g. policy that allows update on users where id = auth.uid() equivalent for public.users)
-- For public.users we use id (our app user id), not auth.uid(). So ensure there is an update policy for authenticated users on their own row.
