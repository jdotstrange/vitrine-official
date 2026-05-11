-- Add optional bio/tagline to user profiles (max 160 chars for display).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio text;

COMMENT ON COLUMN public.users.bio IS 'Optional short bio or tagline (e.g. 160 chars).';
