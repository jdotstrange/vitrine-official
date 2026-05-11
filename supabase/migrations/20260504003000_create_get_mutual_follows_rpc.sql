-- Network Surface V3 — Mutual Follows RPC (IG/Twitter semantics)
--
-- The MUTUAL chip on the V3 NETWORK lens (visitor-only) shows
-- "people you follow who also follow this profile" — the same pattern
-- IG and Twitter use under "Followed by". This is the directional join
-- (viewer's following) ∩ (profile's followers).
--
-- The legacy `get_mutual_follows` referenced from
-- `lib/api/follows.ts → getMutualFollows` was never deployed (the
-- client-side fallback was always doing the work). This is the real one.
--
-- Returns at most p_limit rows ordered by when the viewer started
-- following each mutual (most recent first).

CREATE OR REPLACE FUNCTION public.get_mutual_follows(
  p_viewer_id text,
  p_profile_id text,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id text,
  display_name text,
  username text,
  avatar text,
  bio text,
  followed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.display_name,
    u.username,
    u.avatar,
    u.bio,
    f1.created_at AS followed_at
  FROM follows f1
  JOIN follows f2
    ON f1.following_id = f2.follower_id
   AND f2.following_id = p_profile_id
  JOIN users u ON u.id = f1.following_id
  WHERE f1.follower_id = p_viewer_id
    AND p_viewer_id <> p_profile_id
  ORDER BY f1.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_mutual_follows(text, text, int, int) TO authenticated;

COMMENT ON FUNCTION public.get_mutual_follows(text, text, int, int) IS
  'IG/Twitter "Followed by" semantics: returns users that p_viewer_id follows AND that also follow p_profile_id. Used by the MUTUAL chip on the V3 NETWORK lens. Self-comparisons (viewer == profile) return zero rows.';
