-- browse_market_v3: adds filter_traits to the return set and upgrades
-- person/team search to use filter_traits.subject[] / filter_traits.franchise
-- with ILIKE fallback against listing_title for items that lack filter_traits.
--
-- This replaces the v2 function (same signature + one new return column).
-- Existing client code that ignores filter_traits will not break.

DROP FUNCTION IF EXISTS public.browse_market_v2(
  integer, integer, text, text[], text[], text[], numeric, numeric, text, text, text, text
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
  filter_traits      jsonb,
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
    c.filter_traits,
    c.category::text,
    c.subcategory::text,
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

    -- Person/subject filter: prefer filter_traits.subject array, fallback to title ILIKE
    AND (
      p_search_person IS NULL
      OR (
        c.filter_traits IS NOT NULL
        AND jsonb_typeof(c.filter_traits -> 'subject') = 'array'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(c.filter_traits -> 'subject') AS subj
          WHERE subj ILIKE '%' || p_search_person || '%'
        )
      )
      OR (
        (c.filter_traits IS NULL OR jsonb_typeof(c.filter_traits -> 'subject') != 'array')
        AND COALESCE(c.listing_title, c.title, '') ILIKE '%' || p_search_person || '%'
      )
    )

    -- Team/franchise filter: prefer filter_traits.franchise, fallback to title ILIKE
    AND (
      p_search_team IS NULL
      OR (
        c.filter_traits IS NOT NULL
        AND (c.filter_traits ->> 'franchise') ILIKE '%' || p_search_team || '%'
      )
      OR (
        (c.filter_traits IS NULL OR c.filter_traits ->> 'franchise' IS NULL)
        AND COALESCE(c.listing_title, c.title, '') ILIKE '%' || p_search_team || '%'
      )
    )

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
