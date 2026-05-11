-- browse_market_v2: AI-enriched public marketplace browse RPC.
--
-- Returns CollectionItem-shaped rows for the Market Hub BROWSE lens.
-- Key differences from legacy browse_collectibles:
--   - Returns listing_title (AI catalog title) via COALESCE fallback to title
--   - Returns classification, collectible_type, traits[], ai_metadata, trait_metadata
--   - Returns owner info (id, display_name, username, avatar) for spatial card attribution
--   - Returns track_count and view_count for card badges
--   - Supports p_traits[] filter via GIN array overlap (@>)
--   - Search covers listing_title, title, and classification
--
-- Caller: lib/api/market.ts browseMarket()
-- Migration naming follows 20260505NNNNNN_ convention.

CREATE OR REPLACE FUNCTION public.browse_market_v2(
  p_limit          integer DEFAULT 20,
  p_offset         integer DEFAULT 0,
  p_sort           text    DEFAULT 'recent',
  p_types          text[]  DEFAULT NULL,
  p_statuses       text[]  DEFAULT NULL,  -- 'FOR_SALE', 'FOR_TRADE', 'SELL_TRADE', 'NFST'
  p_traits         text[]  DEFAULT NULL,  -- 'is_rookie', 'is_autographed', etc.
  p_value_min      numeric DEFAULT NULL,
  p_value_max      numeric DEFAULT NULL,
  p_search         text    DEFAULT NULL,
  p_exclude_user_id text   DEFAULT NULL
)
RETURNS TABLE (
  id                text,
  title             text,
  classification    text,
  image             text,
  available_for_sale   boolean,
  available_for_trade  boolean,
  value             numeric,
  collectible_type  text,
  traits            text[],
  ai_metadata       jsonb,
  trait_metadata    jsonb,
  category          text,
  subcategory       text,
  created_at        timestamptz,
  track_count       bigint,
  view_count        bigint,
  owner_id          text,
  owner_display_name text,
  owner_username    text,
  owner_avatar      text
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
    (c.created_at AT TIME ZONE 'UTC') AS created_at,

    -- Track count: count from tracked_items
    COALESCE(tc.track_count, 0)::bigint            AS track_count,

    -- View count: lifetime daily-unique views from view_counters
    COALESCE(vc.total_views, 0)::bigint            AS view_count,

    -- Owner
    u.id::text                                     AS owner_id,
    COALESCE(u.display_name, u.username, 'Collector')::text AS owner_display_name,
    COALESCE(u.username, 'user')::text             AS owner_username,
    u.avatar::text                                 AS owner_avatar

  FROM public.collectibles c
  INNER JOIN public.users u ON u.id = c.user_id

  -- Track count subquery
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS track_count
    FROM public.tracked_items ti
    WHERE ti.collectible_id = c.id
  ) tc ON true

  -- View count: at most one row in view_counters per (target_type, target_id)
  -- thanks to its ON CONFLICT upsert in record_view (see 20260503002000).
  LEFT JOIN public.view_counters vc
         ON vc.target_type = 'collectible'
        AND vc.target_id = c.id

  WHERE
    -- Must have at least one photo
    c.photos IS NOT NULL
    AND array_length(c.photos, 1) > 0

    -- Must be public
    AND c.visibility = 'public'

    -- Exclude current user's own items
    AND (p_exclude_user_id IS NULL OR c.user_id != p_exclude_user_id)

    -- Status filter: derive status from boolean flags
    AND (
      p_statuses IS NULL
      OR (
        'FOR_SALE'   = ANY(p_statuses) AND c.available_for_sale AND NOT c.available_for_trade
        OR 'FOR_TRADE'  = ANY(p_statuses) AND c.available_for_trade AND NOT c.available_for_sale
        OR 'SELL_TRADE' = ANY(p_statuses) AND c.available_for_sale AND c.available_for_trade
        OR 'NFST'       = ANY(p_statuses) AND NOT c.available_for_sale AND NOT c.available_for_trade
      )
    )

    -- Type filter
    AND (p_types IS NULL OR c.collectible_type = ANY(p_types))

    -- Trait filter: item must have ALL specified traits (array contains)
    AND (p_traits IS NULL OR c.traits @> p_traits)

    -- Value range
    AND (p_value_min IS NULL OR c.value >= p_value_min)
    AND (p_value_max IS NULL OR c.value <= p_value_max)

    -- Text search: listing_title, title, classification (case-insensitive)
    AND (
      p_search IS NULL
      OR c.listing_title ILIKE '%' || p_search || '%'
      OR c.title ILIKE '%' || p_search || '%'
      OR c.classification ILIKE '%' || p_search || '%'
    )

  ORDER BY
    CASE
      WHEN p_sort = 'price_high'    THEN NULL
      WHEN p_sort = 'price_low'     THEN NULL
      WHEN p_sort = 'alpha'         THEN NULL
      WHEN p_sort = 'most_tracked'  THEN NULL
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


-- browse_market_stats: lightweight aggregation for the DISCOVER lens DossierCard.
-- Returns total public items, estimated total value, and active listing count.

CREATE OR REPLACE FUNCTION public.browse_market_stats(
  p_exclude_user_id text DEFAULT NULL
)
RETURNS TABLE (
  total_items      bigint,
  total_value      numeric,
  active_listings  bigint,
  added_last_24h   bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint                                                 AS total_items,
    COALESCE(SUM(c.value), 0)::numeric                              AS total_value,
    COUNT(*) FILTER (
      WHERE c.available_for_sale OR c.available_for_trade
    )::bigint                                                        AS active_listings,
    COUNT(*) FILTER (
      WHERE c.created_at >= NOW() - INTERVAL '24 hours'
    )::bigint                                                        AS added_last_24h
  FROM public.collectibles c
  WHERE
    c.visibility = 'public'
    AND c.photos IS NOT NULL
    AND array_length(c.photos, 1) > 0
    AND (p_exclude_user_id IS NULL OR c.user_id != p_exclude_user_id);
END;
$$;

-- Grant execute on both RPCs so the client can call them via supabase.rpc().
GRANT EXECUTE ON FUNCTION public.browse_market_v2(
  integer, integer, text, text[], text[], text[], numeric, numeric, text, text
) TO authenticated, anon;

GRANT EXECUTE ON FUNCTION public.browse_market_stats(text)
  TO authenticated, anon;
