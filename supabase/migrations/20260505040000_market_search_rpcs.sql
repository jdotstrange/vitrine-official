-- market_search_rpcs: tiered search RPCs for the Market Surface.
--
-- 1. browse_market_v2 is recreated with two new optional params:
--    p_search_person and p_search_team, which both do ILIKE against
--    listing_title (the "listing title cheat" — AI-generated titles
--    encode athlete/character names and team/IP in virtually every row).
--    AND semantics: all of p_search, p_search_person, p_search_team must
--    match when provided.
--
-- 2. search_collectors_tiered — two-tier collector search:
--    Tier 1: display_name / username ILIKE match
--    Tier 2: aggregated item matches by listing_title ILIKE (with chip filters)
--    Returns match_count (items in their collection matching the query),
--    preview_thumbs (top-3 by value), and match_tier for client ranking.
--
-- 3. search_showcases_tiered — two-tier showcase search:
--    Tier 1: showcase title / description ILIKE match
--    Tier 2: showcases containing items whose listing_title ILIKE matches
--    Returns match_count, preview_thumbs, item_count, and match_tier.
--
-- Chip filters (p_traits, p_types, p_statuses) apply to item-level
-- queries in both tiered search functions so that a "Signed" chip
-- correctly narrows collector and showcase results.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. browse_market_v2 extended with p_search_person / p_search_team
--    (DROP + recreate — Postgres does not allow adding params to an existing
--    function without a drop when the parameter list changes.)
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.browse_market_v2(
  integer, integer, text, text[], text[], text[], numeric, numeric, text, text
);

CREATE OR REPLACE FUNCTION public.browse_market_v2(
  p_limit           integer DEFAULT 20,
  p_offset          integer DEFAULT 0,
  p_sort            text    DEFAULT 'recent',
  p_types           text[]  DEFAULT NULL,
  p_statuses        text[]  DEFAULT NULL,
  p_traits          text[]  DEFAULT NULL,
  p_value_min       numeric DEFAULT NULL,
  p_value_max       numeric DEFAULT NULL,
  p_search          text    DEFAULT NULL,
  p_exclude_user_id text    DEFAULT NULL,
  -- New: person / team text inputs (ILIKE against listing_title)
  p_search_person   text    DEFAULT NULL,
  p_search_team     text    DEFAULT NULL
)
RETURNS TABLE (
  id                 text,
  title              text,
  classification     text,
  image              text,
  available_for_sale    boolean,
  available_for_trade   boolean,
  value              numeric,
  collectible_type   text,
  traits             text[],
  ai_metadata        jsonb,
  trait_metadata     jsonb,
  category           text,
  subcategory        text,
  created_at         timestamptz,
  track_count        bigint,
  view_count         bigint,
  owner_id           text,
  owner_display_name text,
  owner_username     text,
  owner_avatar       text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    c.id::text,
    COALESCE(c.listing_title, c.title, '')::text  AS title,
    c.classification::text,
    (c.photos[1])::text                            AS image,
    c.available_for_sale,
    c.available_for_trade,
    c.value::numeric,
    c.collectible_type::text,
    COALESCE(c.traits, '{}'::text[])               AS traits,
    c.ai_metadata,
    c.trait_metadata,
    c.category::text,
    c.subcategory::text,
    -- collectibles.created_at is `timestamp without time zone`; cast to
    -- timestamptz (UTC anchor) to match this function's declared return
    -- column type. Without the cast Postgres throws 42804.
    (c.created_at AT TIME ZONE 'UTC')              AS created_at,
    COALESCE(tc.track_count, 0)::bigint            AS track_count,
    COALESCE(vc.total_views, 0)::bigint            AS view_count,
    u.id::text                                     AS owner_id,
    COALESCE(u.display_name, u.username, 'Collector')::text AS owner_display_name,
    COALESCE(u.username, 'user')::text             AS owner_username,
    u.avatar::text                                 AS owner_avatar

  FROM public.collectibles c
  INNER JOIN public.users u ON u.id = c.user_id

  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS track_count
    FROM public.tracked_items ti
    WHERE ti.collectible_id = c.id
  ) tc ON true

  LEFT JOIN public.view_counters vc
         ON vc.target_type = 'collectible'
        AND vc.target_id = c.id

  WHERE
    c.photos IS NOT NULL
    AND array_length(c.photos, 1) > 0
    AND c.visibility = 'public'
    AND (p_exclude_user_id IS NULL OR c.user_id != p_exclude_user_id)

    AND (
      p_statuses IS NULL
      OR (
           'FOR_SALE'   = ANY(p_statuses) AND c.available_for_sale AND NOT c.available_for_trade
        OR 'FOR_TRADE'  = ANY(p_statuses) AND c.available_for_trade AND NOT c.available_for_sale
        OR 'SELL_TRADE' = ANY(p_statuses) AND c.available_for_sale AND c.available_for_trade
        OR 'NFST'       = ANY(p_statuses) AND NOT c.available_for_sale AND NOT c.available_for_trade
      )
    )

    AND (p_types  IS NULL OR c.collectible_type = ANY(p_types))
    AND (p_traits IS NULL OR c.traits @> p_traits)
    AND (p_value_min IS NULL OR c.value >= p_value_min)
    AND (p_value_max IS NULL OR c.value <= p_value_max)

    AND (
      p_search IS NULL
      OR c.listing_title ILIKE '%' || p_search || '%'
      OR c.title         ILIKE '%' || p_search || '%'
      OR c.classification ILIKE '%' || p_search || '%'
    )

    -- Person/Character filter: must appear in listing_title
    AND (p_search_person IS NULL OR COALESCE(c.listing_title, c.title, '') ILIKE '%' || p_search_person || '%')

    -- Team/IP filter: must appear in listing_title
    AND (p_search_team   IS NULL OR COALESCE(c.listing_title, c.title, '') ILIKE '%' || p_search_team   || '%')

  ORDER BY
    CASE
      WHEN p_sort = 'price_high'   THEN NULL
      WHEN p_sort = 'price_low'    THEN NULL
      WHEN p_sort = 'alpha'        THEN NULL
      WHEN p_sort = 'most_tracked' THEN NULL
      ELSE c.created_at
    END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_high'   THEN c.value END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_low'    THEN c.value END ASC  NULLS LAST,
    CASE WHEN p_sort = 'alpha'        THEN COALESCE(c.listing_title, c.title) END ASC NULLS LAST,
    CASE WHEN p_sort = 'most_tracked' THEN COALESCE(tc.track_count, 0) END DESC NULLS LAST,
    c.created_at DESC NULLS LAST

  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.browse_market_v2(
  integer, integer, text, text[], text[], text[], numeric, numeric, text, text, text, text
) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. search_collectors_tiered
--
-- Tier 1: user whose display_name or username matches the query directly.
-- Tier 2: user who owns collectibles matching the query + chip filters,
--         but whose name does not match. Aggregates match_count and surfaces
--         up to 3 preview thumbnails (highest value first).
--
-- A user that qualifies for both tiers is returned as tier 1.
-- The match_count column is 0 for pure-tier-1 results (name match only,
-- no item-level match was checked) and >= 1 for tier-2 results.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_collectors_tiered(
  p_query           text,
  p_traits          text[]  DEFAULT NULL,
  p_types           text[]  DEFAULT NULL,
  p_statuses        text[]  DEFAULT NULL,
  p_limit           integer DEFAULT 20,
  p_exclude_user_id text    DEFAULT NULL
)
RETURNS TABLE (
  user_id            text,
  display_name       text,
  username           text,
  avatar             text,
  collectibles_count integer,
  match_count        integer,
  preview_thumbs     text[],
  match_tier         integer
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_query text := '%' || trim(p_query) || '%';
BEGIN
  RETURN QUERY
  WITH

  -- Tier 1: name-match users
  tier1 AS (
    SELECT
      u.id::text           AS user_id,
      u.display_name,
      u.username,
      u.avatar,
      u.collectibles_count,
      0                    AS match_count,
      ARRAY[]::text[]      AS preview_thumbs,
      1                    AS match_tier
    FROM public.users u
    WHERE
      u.onboarding_completed_at IS NOT NULL
      AND (p_exclude_user_id IS NULL OR u.id != p_exclude_user_id)
      AND (
        u.display_name ILIKE v_query
        OR u.username  ILIKE v_query
      )
    ORDER BY u.collectibles_count DESC NULLS LAST
    LIMIT p_limit
  ),

  -- Tier 2: item-match users (listing_title ILIKE + chip filters)
  item_matches AS (
    SELECT
      c.user_id::text                                     AS user_id,
      COUNT(*)::integer                                   AS match_count,
      -- Top 3 photos by value, highest first
      array_agg(c.photos[1] ORDER BY c.value DESC NULLS LAST)
        FILTER (WHERE c.photos[1] IS NOT NULL)            AS all_thumbs
    FROM public.collectibles c
    WHERE
      c.visibility = 'public'
      AND c.photos IS NOT NULL
      AND array_length(c.photos, 1) > 0
      AND (p_exclude_user_id IS NULL OR c.user_id != p_exclude_user_id)
      AND COALESCE(c.listing_title, c.title, '') ILIKE v_query
      AND (p_types  IS NULL OR c.collectible_type = ANY(p_types))
      AND (p_traits IS NULL OR c.traits @> p_traits)
      AND (
        p_statuses IS NULL
        OR (
             'FOR_SALE'   = ANY(p_statuses) AND c.available_for_sale AND NOT c.available_for_trade
          OR 'FOR_TRADE'  = ANY(p_statuses) AND c.available_for_trade AND NOT c.available_for_sale
          OR 'SELL_TRADE' = ANY(p_statuses) AND c.available_for_sale AND c.available_for_trade
          OR 'NFST'       = ANY(p_statuses) AND NOT c.available_for_sale AND NOT c.available_for_trade
        )
      )
    GROUP BY c.user_id
    ORDER BY match_count DESC
    LIMIT p_limit * 3  -- over-select before the join
  ),

  tier2 AS (
    SELECT
      u.id::text                                AS user_id,
      u.display_name,
      u.username,
      u.avatar,
      u.collectibles_count,
      im.match_count,
      im.all_thumbs[1:3]                        AS preview_thumbs,
      2                                         AS match_tier
    FROM item_matches im
    INNER JOIN public.users u ON u.id = im.user_id
    WHERE
      u.onboarding_completed_at IS NOT NULL
      -- Only include tier-2 rows for users NOT already in tier1
      AND u.id NOT IN (SELECT t1.user_id FROM tier1 t1)
  ),

  combined AS (
    SELECT * FROM tier1
    UNION ALL
    SELECT * FROM tier2
  )

  SELECT
    c.user_id,
    COALESCE(c.display_name, 'Collector') AS display_name,
    COALESCE(c.username, 'user')          AS username,
    c.avatar,
    COALESCE(c.collectibles_count, 0)     AS collectibles_count,
    c.match_count,
    COALESCE(c.preview_thumbs, ARRAY[]::text[]) AS preview_thumbs,
    c.match_tier
  FROM combined c
  ORDER BY c.match_tier ASC, c.match_count DESC, c.collectibles_count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_collectors_tiered(
  text, text[], text[], text[], integer, text
) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. search_showcases_tiered
--
-- Tier 1: showcase whose title or description matches the query.
-- Tier 2: public showcase that contains collectibles matching the query
--         + chip filters, but whose title/description does not match.
--
-- Preview thumbs: top-3 photos from matching items first; if fewer than 3
-- match, pad with any other showcase member photos (highest value first).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_showcases_tiered(
  p_query           text,
  p_traits          text[]  DEFAULT NULL,
  p_types           text[]  DEFAULT NULL,
  p_statuses        text[]  DEFAULT NULL,
  p_limit           integer DEFAULT 20,
  p_exclude_user_id text    DEFAULT NULL
)
RETURNS TABLE (
  showcase_id        text,
  title              text,
  description        text,
  owner_id           text,
  owner_username     text,
  owner_display_name text,
  owner_avatar       text,
  preview_thumbs     text[],
  item_count         integer,
  match_count        integer,
  match_tier         integer
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
-- #variable_conflict use_column: the OUT parameters declared in
-- RETURNS TABLE (showcase_id, title, ...) shadow the SELECT column
-- aliases of the same name inside the body, throwing 42702. This
-- directive tells PL/pgSQL to prefer the column over the OUT param.
#variable_conflict use_column
DECLARE
  v_query text := '%' || trim(p_query) || '%';
BEGIN
  RETURN QUERY
  WITH

  -- Per-showcase item counts derived from the junction table. The
  -- showcases table has no item_count column — counts must come from
  -- showcase_collectibles. Computed once and reused by both tiers.
  showcase_item_counts AS (
    SELECT
      sc.showcase_id::text AS showcase_id,
      COUNT(*)::integer    AS item_count
    FROM public.showcase_collectibles sc
    GROUP BY sc.showcase_id
  ),

  -- Tier 1: title / description match
  tier1_raw AS (
    SELECT
      s.id::text           AS showcase_id,
      s.title,
      s.description,
      u.id::text           AS owner_id,
      COALESCE(u.username, 'user')                         AS owner_username,
      COALESCE(u.display_name, u.username, 'Collector')    AS owner_display_name,
      u.avatar::text                                       AS owner_avatar,
      COALESCE(sic.item_count, 0)                          AS item_count,
      1                    AS match_tier
    FROM public.showcases s
    INNER JOIN public.users u ON u.id = s.user_id
    LEFT  JOIN showcase_item_counts sic ON sic.showcase_id = s.id
    WHERE
      s.visibility = 'public'
      AND (p_exclude_user_id IS NULL OR s.user_id != p_exclude_user_id)
      AND (
        s.title       ILIKE v_query
        OR s.description ILIKE v_query
      )
    ORDER BY s.created_at DESC
    LIMIT p_limit
  ),

  -- Item-level matches within showcases (for tier-2 detection + thumbs)
  item_matches AS (
    SELECT
      sc.showcase_id::text                                  AS showcase_id,
      COUNT(*)::integer                                     AS match_count,
      array_agg(c.photos[1] ORDER BY c.value DESC NULLS LAST)
        FILTER (WHERE c.photos[1] IS NOT NULL)              AS matched_thumbs
    FROM public.showcase_collectibles sc
    INNER JOIN public.collectibles c ON c.id = sc.collectible_id
    WHERE
      c.visibility = 'public'
      AND COALESCE(c.listing_title, c.title, '') ILIKE v_query
      AND (p_types  IS NULL OR c.collectible_type = ANY(p_types))
      AND (p_traits IS NULL OR c.traits @> p_traits)
      AND (
        p_statuses IS NULL
        OR (
             'FOR_SALE'   = ANY(p_statuses) AND c.available_for_sale AND NOT c.available_for_trade
          OR 'FOR_TRADE'  = ANY(p_statuses) AND c.available_for_trade AND NOT c.available_for_sale
          OR 'SELL_TRADE' = ANY(p_statuses) AND c.available_for_sale AND c.available_for_trade
          OR 'NFST'       = ANY(p_statuses) AND NOT c.available_for_sale AND NOT c.available_for_trade
        )
      )
    GROUP BY sc.showcase_id
  ),

  -- Fallback thumbs (any member, for padding)
  fallback_thumbs AS (
    SELECT
      sc.showcase_id::text                                  AS showcase_id,
      array_agg(c.photos[1] ORDER BY c.value DESC NULLS LAST)
        FILTER (WHERE c.photos[1] IS NOT NULL)              AS all_thumbs
    FROM public.showcase_collectibles sc
    INNER JOIN public.collectibles c ON c.id = sc.collectible_id
    WHERE c.photos IS NOT NULL
    GROUP BY sc.showcase_id
  ),

  -- Tier 2: showcases with item-level matches but no title/description match
  -- raw_thumbs is the unspliced concatenation; final SELECT slices [1:3]
  tier2_raw AS (
    SELECT
      s.id::text           AS showcase_id,
      s.title,
      s.description,
      u.id::text           AS owner_id,
      COALESCE(u.username, 'user')                         AS owner_username,
      COALESCE(u.display_name, u.username, 'Collector')    AS owner_display_name,
      u.avatar::text                                       AS owner_avatar,
      COALESCE(im.matched_thumbs, '{}'::text[]) || COALESCE(ft.all_thumbs, '{}'::text[]) AS raw_thumbs,
      COALESCE(sic.item_count, 0)                          AS item_count,
      im.match_count,
      2                    AS match_tier
    FROM item_matches im
    INNER JOIN public.showcases s ON s.id = im.showcase_id
    INNER JOIN public.users u ON u.id = s.user_id
    LEFT  JOIN fallback_thumbs ft       ON ft.showcase_id  = s.id
    LEFT  JOIN showcase_item_counts sic ON sic.showcase_id = s.id
    WHERE
      s.visibility = 'public'
      AND (p_exclude_user_id IS NULL OR s.user_id != p_exclude_user_id)
      AND s.id NOT IN (SELECT t1.showcase_id FROM tier1_raw t1)
  ),

  -- Enrich tier1 rows with preview thumbs
  tier1_enriched AS (
    SELECT
      t1.showcase_id,
      t1.title,
      t1.description,
      t1.owner_id,
      t1.owner_username,
      t1.owner_display_name,
      t1.owner_avatar,
      COALESCE(im.matched_thumbs, '{}'::text[]) || COALESCE(ft.all_thumbs, '{}'::text[]) AS raw_thumbs,
      t1.item_count,
      COALESCE(im.match_count, 0) AS match_count,
      t1.match_tier
    FROM tier1_raw t1
    LEFT JOIN item_matches im   ON im.showcase_id = t1.showcase_id
    LEFT JOIN fallback_thumbs ft ON ft.showcase_id = t1.showcase_id
  ),

  combined AS (
    SELECT
      showcase_id, title, description, owner_id, owner_username,
      owner_display_name, owner_avatar, raw_thumbs,
      item_count, match_count, match_tier
    FROM tier1_enriched
    UNION ALL
    SELECT
      showcase_id, title, description, owner_id, owner_username,
      owner_display_name, owner_avatar, raw_thumbs,
      item_count, match_count, match_tier
    FROM tier2_raw
  )

  SELECT
    c.showcase_id,
    c.title,
    c.description,
    c.owner_id,
    c.owner_username,
    c.owner_display_name,
    c.owner_avatar,
    c.raw_thumbs[1:3] AS preview_thumbs,
    c.item_count,
    c.match_count,
    c.match_tier
  FROM combined c
  ORDER BY c.match_tier ASC, c.match_count DESC, c.item_count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_showcases_tiered(
  text, text[], text[], text[], integer, text
) TO authenticated, anon;
