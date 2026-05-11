-- Allow users to feature one collectible as their Crown Jewel on profile/card surfaces.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS crown_jewel_collectible_id text REFERENCES public.collectibles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.crown_jewel_collectible_id IS 'Optional collectible to display as the user profile Crown Jewel.';

