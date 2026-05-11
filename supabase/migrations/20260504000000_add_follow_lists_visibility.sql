-- Network Surface V3 — follow-list privacy column
--
-- Binary public/private gate for the visitor-facing Followers + Following
-- chips on the V3 NETWORK lens. Owners always see their own lists in full;
-- visitors see a privacy empty-state when this column is 'private'.
--
-- Why a column on `users` rather than a row in a separate `privacy_settings`
-- table: mirrors the existing `sharing_permission` and `messaging_permission`
-- columns already on `users`, keeps lookups single-row, and avoids a join
-- on every visitor profile load.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS follow_lists_visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_follow_lists_visibility_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_follow_lists_visibility_check
  CHECK (follow_lists_visibility IN ('public', 'private'));

COMMENT ON COLUMN public.users.follow_lists_visibility IS
  'Binary gate (public|private) for the visitor-facing Followers and Following chips on the V3 NETWORK lens. Owners always bypass the gate when viewing their own profile.';
