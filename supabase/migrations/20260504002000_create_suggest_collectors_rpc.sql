-- Network Surface V3 — Suggested Collectors RPC
--
-- The Suggested chip on the NETWORK lens always leads off (the design
-- decision: cold-start-friendly discovery is more valuable than alphabet
-- soup of empty Followers/Following lists). This RPC scores candidate
-- collectors against five weighted signals and persists the result in
-- `suggested_collectors_cache` for 24-48h.
--
-- Signal weights (locked V1 — tunable later):
--   30 | comp        — collector owns items strong-matched (>=0.75) to
--                      the viewer's collection. Comprehensive path: we
--                      LATERAL-join get_collectible_comps for each viewer
--                      collectible. Bounded by capping viewer_collectibles
--                      at the most recent 50.
--   25 | inventory   — Jaccard-like overlap on collectibles.category and
--                      collectibles.tags between viewer and candidate.
--   20 | tracking    — count of candidate's collectibles that the viewer
--                      is currently tracking.
--   15 | network     — second-degree overlap: candidate is followed by
--                      people the viewer follows.
--   10 | authority   — log-scaled blend of collectibles_count,
--                      followers_count, and view_counters.total_views.
--
-- Hard filters: exclude self, exclude already-followed, require recent
-- activity (a collectible added in the last 90 days), require onboarding
-- completion. Any candidate scoring 0 across all signals is dropped.
--
-- Serendipity: 1 in every 5 returned slots is a random qualified candidate
-- with reason_code='serendipity'. Keeps the surface from collapsing into
-- the same five collectors forever.
--
-- Cache TTL: 36 hours (midpoint of the 24-48h window).
--
-- Three return modes:
--   * Cache hit AND NOT p_force_recompute -> read straight from cache.
--   * Cache miss OR p_force_recompute     -> delete viewer's stale rows,
--                                            rescore, upsert, then read.

CREATE OR REPLACE FUNCTION public.suggest_collectors_for(
  p_viewer_id text,
  p_limit int DEFAULT 20,
  p_force_recompute boolean DEFAULT false
)
RETURNS TABLE (
  candidate_id text,
  display_name text,
  username text,
  avatar text,
  collectibles_count integer,
  followers_count integer,
  match_score numeric,
  reason_code text,
  reason_meta jsonb,
  preview_items text[]
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
-- Prefer column references over PL/pgSQL variable names whenever the
-- two collide. The RETURNS TABLE output declares names like
-- `candidate_id` and `match_score` that also appear as CTE columns
-- inside the recompute block; without this directive Postgres errors
-- with "column reference is ambiguous".
#variable_conflict use_column
DECLARE
  v_cache_hit boolean := false;
  v_ttl_hours int := 36;
  v_serendipity_slots int := GREATEST(p_limit / 5, 1);
  v_ranked_slots int := GREATEST(p_limit - v_serendipity_slots, 1);
BEGIN
  IF NOT p_force_recompute THEN
    SELECT EXISTS (
      SELECT 1 FROM suggested_collectors_cache
      WHERE viewer_id = p_viewer_id AND expires_at > now()
    ) INTO v_cache_hit;
  END IF;

  IF p_force_recompute OR NOT v_cache_hit THEN
    DELETE FROM suggested_collectors_cache WHERE viewer_id = p_viewer_id;

    INSERT INTO suggested_collectors_cache (
      viewer_id, candidate_id, match_score, reason_code, reason_meta, expires_at
    )
    WITH viewer_following AS (
      SELECT following_id FROM follows WHERE follower_id = p_viewer_id
    ),
    viewer_tracked AS (
      SELECT collectible_id FROM tracked_items WHERE user_id = p_viewer_id
    ),
    viewer_categories AS (
      SELECT DISTINCT lower(category) AS cat
      FROM collectibles
      WHERE user_id = p_viewer_id AND category IS NOT NULL AND category <> ''
    ),
    viewer_tags AS (
      SELECT DISTINCT lower(t) AS tag
      FROM collectibles c, unnest(coalesce(c.tags, ARRAY[]::text[])) t
      WHERE c.user_id = p_viewer_id
    ),
    -- Cap to most-recent 50 to bound the get_collectible_comps fan-out.
    viewer_collectibles AS (
      SELECT id FROM collectibles
      WHERE user_id = p_viewer_id
      ORDER BY created_at DESC
      LIMIT 50
    ),
    candidates AS (
      SELECT u.id, u.collectibles_count, u.followers_count
      FROM users u
      WHERE u.id <> p_viewer_id
        AND u.id NOT IN (SELECT following_id FROM viewer_following)
        AND u.onboarding_completed_at IS NOT NULL
        AND COALESCE(u.collectibles_count, 0) > 0
        AND EXISTS (
          SELECT 1 FROM collectibles c
          WHERE c.user_id = u.id
            AND c.created_at > (now() - interval '90 days')
        )
    ),
    -- Signal 1: inventory affinity (category + tag overlap, capped raw count)
    inv_affinity AS (
      SELECT
        c.user_id AS candidate_id,
        (
          (SELECT COUNT(DISTINCT lower(c2.category))
             FROM collectibles c2
             WHERE c2.user_id = c.user_id
               AND c2.category IS NOT NULL
               AND lower(c2.category) IN (SELECT cat FROM viewer_categories))
          +
          (SELECT COUNT(DISTINCT lower(t))
             FROM collectibles c2,
                  unnest(coalesce(c2.tags, ARRAY[]::text[])) t
             WHERE c2.user_id = c.user_id
               AND lower(t) IN (SELECT tag FROM viewer_tags))
        ) AS shared_count,
        ARRAY(
          SELECT DISTINCT lower(c2.category)
          FROM collectibles c2
          WHERE c2.user_id = c.user_id
            AND c2.category IS NOT NULL
            AND lower(c2.category) IN (SELECT cat FROM viewer_categories)
          LIMIT 3
        ) AS shared_categories
      FROM (SELECT DISTINCT user_id FROM collectibles WHERE user_id IN (SELECT id FROM candidates)) c
    ),
    -- Signal 2: comp overlap (the killer signal — comprehensive fan-out)
    comp_overlap AS (
      SELECT cmp.owner_id AS candidate_id, COUNT(*)::int AS comp_count
      FROM viewer_collectibles vc,
           LATERAL get_collectible_comps(vc.id, 30) cmp
      WHERE cmp.score_fraction >= 0.75
        AND cmp.owner_id IS NOT NULL
        AND cmp.owner_id <> p_viewer_id
        AND cmp.owner_id IN (SELECT id FROM candidates)
      GROUP BY cmp.owner_id
    ),
    -- Signal 3: tracking overlap
    tracking_overlap AS (
      SELECT c.user_id AS candidate_id, COUNT(*)::int AS tracked_count
      FROM collectibles c
      WHERE c.user_id IN (SELECT id FROM candidates)
        AND c.id IN (SELECT collectible_id FROM viewer_tracked)
      GROUP BY c.user_id
    ),
    -- Signal 4: network proximity (second-degree)
    net_proximity AS (
      SELECT
        f.following_id AS candidate_id,
        COUNT(DISTINCT f.follower_id)::int AS via_count,
        (SELECT array_agg(via)
           FROM (
             SELECT DISTINCT f2.follower_id AS via
             FROM follows f2
             WHERE f2.following_id = f.following_id
               AND f2.follower_id IN (SELECT following_id FROM viewer_following)
             LIMIT 5
           ) sub) AS via_user_ids
      FROM follows f
      WHERE f.follower_id IN (SELECT following_id FROM viewer_following)
        AND f.following_id IN (SELECT id FROM candidates)
      GROUP BY f.following_id
    ),
    -- Signal 5: authority (log-scaled blend, normalized against ln(10000))
    authority AS (
      SELECT
        c.id AS candidate_id,
        c.collectibles_count,
        c.followers_count,
        COALESCE(vc.total_views, 0)::int AS profile_views
      FROM candidates c
      LEFT JOIN view_counters vc
        ON vc.target_type = 'profile' AND vc.target_id = c.id
    ),
    scored AS (
      SELECT
        c.id AS candidate_id,
        LEAST(COALESCE(ia.shared_count, 0)::numeric / 10.0, 1.0) * 25 AS inv_score,
        ia.shared_categories,
        LEAST(COALESCE(co.comp_count, 0)::numeric / 10.0, 1.0) * 30 AS comp_score,
        COALESCE(co.comp_count, 0) AS comp_count,
        LEAST(COALESCE(t.tracked_count, 0)::numeric / 5.0, 1.0) * 20 AS track_score,
        COALESCE(t.tracked_count, 0) AS tracked_count,
        LEAST(COALESCE(n.via_count, 0)::numeric / 5.0, 1.0) * 15 AS net_score,
        COALESCE(n.via_count, 0) AS via_count,
        n.via_user_ids,
        LEAST(
          ln(GREATEST(
            COALESCE(a.collectibles_count, 0)
            + COALESCE(a.followers_count, 0)
            + COALESCE(a.profile_views, 0),
            1
          ))::numeric / ln(10000.0)::numeric,
          1.0
        ) * 10 AS auth_score
      FROM candidates c
      LEFT JOIN inv_affinity ia ON ia.candidate_id = c.id
      LEFT JOIN comp_overlap co ON co.candidate_id = c.id
      LEFT JOIN tracking_overlap t ON t.candidate_id = c.id
      LEFT JOIN net_proximity n ON n.candidate_id = c.id
      LEFT JOIN authority a ON a.candidate_id = c.id
    ),
    ranked AS (
      SELECT
        candidate_id,
        ROUND((inv_score + comp_score + track_score + net_score + auth_score)::numeric, 2) AS total_score,
        CASE
          WHEN comp_score >= GREATEST(inv_score, track_score, net_score, auth_score) AND comp_score > 0
            THEN 'comp'
          WHEN inv_score >= GREATEST(track_score, net_score, auth_score) AND inv_score > 0
            THEN 'inventory'
          WHEN track_score >= GREATEST(net_score, auth_score) AND track_score > 0
            THEN 'tracking'
          WHEN net_score >= auth_score AND net_score > 0
            THEN 'network'
          ELSE 'authority'
        END AS reason_code,
        jsonb_strip_nulls(jsonb_build_object(
          'sharedCategories', NULLIF(shared_categories, ARRAY[]::text[]),
          'compCount', NULLIF(comp_count, 0),
          'trackedCount', NULLIF(tracked_count, 0),
          'viaCount', NULLIF(via_count, 0),
          'viaUserIds', via_user_ids
        )) AS reason_meta
      FROM scored
      WHERE (inv_score + comp_score + track_score + net_score + auth_score) > 0
      ORDER BY (inv_score + comp_score + track_score + net_score + auth_score) DESC
      LIMIT v_ranked_slots
    ),
    serendipity AS (
      SELECT
        c.id AS candidate_id,
        ROUND((random() * 5 + 5)::numeric, 2) AS total_score,
        'serendipity'::text AS reason_code,
        '{}'::jsonb AS reason_meta
      FROM candidates c
      WHERE c.id NOT IN (SELECT candidate_id FROM ranked)
      ORDER BY random()
      LIMIT v_serendipity_slots
    ),
    all_picks AS (
      SELECT * FROM ranked
      UNION ALL
      SELECT * FROM serendipity
    )
    SELECT
      p_viewer_id,
      candidate_id,
      total_score,
      reason_code,
      reason_meta,
      now() + (v_ttl_hours || ' hours')::interval
    FROM all_picks
    ON CONFLICT (viewer_id, candidate_id) DO UPDATE SET
      match_score = EXCLUDED.match_score,
      reason_code = EXCLUDED.reason_code,
      reason_meta = EXCLUDED.reason_meta,
      computed_at = now(),
      expires_at = EXCLUDED.expires_at;
  END IF;

  RETURN QUERY
  SELECT
    sc.candidate_id,
    u.display_name,
    u.username,
    u.avatar,
    u.collectibles_count,
    u.followers_count,
    sc.match_score,
    sc.reason_code,
    sc.reason_meta,
    COALESCE(
      (SELECT array_agg(p.first_photo)
         FROM (
           SELECT (c.photos)[1] AS first_photo
           FROM collectibles c
           WHERE c.user_id = sc.candidate_id
             AND c.privacy = 'public'
             AND c.photos IS NOT NULL
             AND array_length(c.photos, 1) > 0
           ORDER BY c.created_at DESC
           LIMIT 3
         ) p),
      ARRAY[]::text[]
    ) AS preview_items
  FROM suggested_collectors_cache sc
  JOIN users u ON u.id = sc.candidate_id
  WHERE sc.viewer_id = p_viewer_id
    AND sc.expires_at > now()
  ORDER BY sc.match_score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.suggest_collectors_for(text, int, boolean) TO authenticated;

COMMENT ON FUNCTION public.suggest_collectors_for(text, int, boolean) IS
  'Returns ranked Suggested Collectors for the V3 NETWORK lens. Reads from per-viewer 36h cache; recomputes on miss or when p_force_recompute=true. Five weighted signals: comp(30) inventory(25) tracking(20) network(15) authority(10), plus a 1-in-5 serendipity slot.';
