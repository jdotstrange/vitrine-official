-- Upload Lane Unification — RPC + view updates.
--
-- Adds `c.published_at IS NOT NULL` to every public-facing query path in
-- our SQL surface, mirroring the `applyPublishedFilter` pass over the
-- TypeScript codebase. Together with the 20260519170000 migration's
-- backfill (which set published_at on every existing 'complete' row),
-- this should produce identical results for legacy data and add the
-- visibility gate for newly-unpublished rows going forward.
--
-- Touched objects:
--   * collectibles_unified VIEW — adds published_at and extraction_status
--   * browse_market_v2     RPC — public market grid
--   * get_collectible_comps RPC — comps for a single source item
--   * _comps_v2_legacy     RPC — fallback path for items lacking filter_traits
--   * get_tracked_comps    RPC — comps across the user's tracked portfolio
--   * search_collectors_tiered RPC — collector search (item subquery)
--   * search_showcases_tiered  RPC — showcase search (item subquery)
--   * search_collectibles  RPC — search via collectibles_unified
--   * browse_collectibles  RPC — generic browse RPC
--   * get_hot_items        RPC — explore "hot" carousel
--
-- For each, the only behavior change is the addition of one filter:
--   AND c.published_at IS NOT NULL
-- (or the equivalent inside a join subquery).

-- ─────────────────────────────────────────────────────────────────────────────
-- collectibles_unified VIEW — add published_at + extraction_status
-- The DROP+CREATE form is required because CREATE OR REPLACE VIEW won't
-- accept new columns inserted in the middle of the column list.
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.collectibles_unified;

CREATE VIEW public.collectibles_unified AS
 SELECT c.id,
    c.collectible_type,
    c.user_id,
    c.title,
    c.description,
    c.photos,
    c.visibility,
    c.privacy,
    c.tags,
    c.available_for_sale,
    c.available_for_trade,
    c.saves_count,
    c.created_at,
    c.updated_at,
    c.ai_metadata,
    c.trait_metadata,
    c.classification,
    c.traits,
    c.confidence,
    c.listing_title,
    c.listing_description,
    c.autograph_assessment,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN c.value
        WHEN c.collectible_type = 'trading_card'::text THEN tcd.effective_price
        ELSE c.value
    END AS display_price,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN c.category
        WHEN c.collectible_type = 'trading_card'::text THEN cc.category_code
        ELSE c.category
    END AS unified_category,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN c.category
        ELSE NULL::text
    END AS memorabilia_category,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN c.subcategory
        ELSE NULL::text
    END AS memorabilia_subcategory,
    tcd.id AS trading_card_details_id,
    tcd.card_catalog_id,
    tcd.pricing_mode,
    tcd.margin_percentage,
    tcd.manual_price,
    tcd.certificate_number,
    cc.card_hedge_id,
    cc.card_name,
    cc.player_name,
    cc.year AS card_year,
    cc.set_name,
    cc.card_number,
    cc.variant,
    cc.grade,
    cc.grading_company,
    cc.card_hedge_category,
    cc.category_group,
    cc.is_rookie,
    cc.image_url AS card_image_url,
    cc.api_price,
    cc.api_price_available,
    cc.api_price_updated_at,
    cc.sales_7day,
    cc.sales_30day,
    cc.gain_7day,
    cc.gain_30day,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN (((((COALESCE(c.title, ''::text) || ' '::text) || COALESCE(c.description, ''::text)) || ' '::text) || COALESCE(c.category, ''::text)) || ' '::text) || COALESCE(c.subcategory, ''::text)
        WHEN c.collectible_type = 'trading_card'::text THEN (((((((COALESCE(cc.card_name, ''::text) || ' '::text) || COALESCE(cc.player_name, ''::text)) || ' '::text) || COALESCE(cc.set_name, ''::text)) || ' '::text) || COALESCE(cc.variant, ''::text)) || ' '::text) || COALESCE(cc.grade, ''::text)
        ELSE (COALESCE(c.title, ''::text) || ' '::text) || COALESCE(c.description, ''::text)
    END AS search_text,
    c.published_at,
    c.extraction_status
   FROM public.collectibles c
     LEFT JOIN public.trading_card_details tcd ON c.id = tcd.collectible_id AND c.collectible_type = 'trading_card'::text
     LEFT JOIN public.card_catalog cc ON tcd.card_catalog_id = cc.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- browse_market_v2 — same shape as 20260506040000 (v3 filter_traits) plus the
-- new c.published_at IS NOT NULL gate alongside visibility = 'public'.
-- ─────────────────────────────────────────────────────────────────────────────

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
AS $func$
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
    AND c.published_at IS NOT NULL
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
$func$;

-- ─────────────────────────────────────────────────────────────────────────────
-- search_collectibles, browse_collectibles, get_hot_items
-- (legacy generic RPCs that don't have a tracked migration in the repo)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_collectibles(
  p_query text DEFAULT NULL,
  p_collectible_type text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_available_for_sale boolean DEFAULT NULL,
  p_available_for_trade boolean DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_exclude_user_id text DEFAULT NULL
)
RETURNS TABLE(
  id text, collectible_type text, user_id text, title text, display_price numeric,
  unified_category text, photos text[], card_name text, player_name text, grade text,
  visibility text, available_for_sale boolean, available_for_trade boolean,
  created_at timestamp without time zone
)
LANGUAGE plpgsql
STABLE
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    cu.id, cu.collectible_type, cu.user_id, cu.title, cu.display_price,
    cu.unified_category, cu.photos, cu.card_name, cu.player_name, cu.grade,
    cu.visibility, cu.available_for_sale, cu.available_for_trade, cu.created_at
  FROM public.collectibles_unified cu
  WHERE
    cu.visibility = 'public'
    AND cu.published_at IS NOT NULL
    AND (p_query IS NULL OR cu.search_text ILIKE '%' || p_query || '%')
    AND (p_collectible_type IS NULL OR cu.collectible_type = p_collectible_type)
    AND (p_category IS NULL OR cu.unified_category ILIKE p_category)
    AND (p_min_price IS NULL OR cu.display_price >= p_min_price)
    AND (p_max_price IS NULL OR cu.display_price <= p_max_price)
    AND (p_available_for_sale IS NULL OR cu.available_for_sale = p_available_for_sale)
    AND (p_available_for_trade IS NULL OR cu.available_for_trade = p_available_for_trade)
    AND (p_exclude_user_id IS NULL OR cu.user_id != p_exclude_user_id)
  ORDER BY cu.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$func$;

CREATE OR REPLACE FUNCTION public.browse_collectibles(
  p_types text[] DEFAULT NULL,
  p_statuses text[] DEFAULT NULL,
  p_value_min numeric DEFAULT NULL,
  p_value_max numeric DEFAULT NULL,
  p_owner_ids text[] DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'recent',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_exclude_user_id text DEFAULT NULL
)
RETURNS TABLE(
  id text, title text, image text, category text, subcategory text,
  item_value numeric, available_for_sale boolean, available_for_trade boolean,
  owner_id text, owner_name text, owner_username text, owner_avatar text,
  track_count bigint, created_at timestamp without time zone
)
LANGUAGE plpgsql
STABLE
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.photos[1] AS image,
    c.category,
    c.subcategory,
    c.value AS item_value,
    c.available_for_sale,
    c.available_for_trade,
    c.user_id AS owner_id,
    COALESCE(u.display_name, u.username, 'Collector') AS owner_name,
    COALESCE(u.username, 'collector') AS owner_username,
    u.avatar AS owner_avatar,
    COALESCE(tc.cnt, 0) AS track_count,
    c.created_at
  FROM public.collectibles c
  LEFT JOIN public.users u ON u.id = c.user_id
  LEFT JOIN (
    SELECT ti.collectible_id, COUNT(*) AS cnt
    FROM public.tracked_items ti
    GROUP BY ti.collectible_id
  ) tc ON tc.collectible_id = c.id
  WHERE
    c.photos IS NOT NULL
    AND array_length(c.photos, 1) > 0
    AND c.published_at IS NOT NULL
    AND (p_types IS NULL OR c.category = ANY(p_types))
    AND (p_owner_ids IS NULL OR c.user_id = ANY(p_owner_ids))
    AND (p_value_min IS NULL OR c.value >= p_value_min)
    AND (p_value_max IS NULL OR c.value <= p_value_max)
    AND (p_search IS NULL OR c.title ILIKE '%' || p_search || '%')
    AND (p_exclude_user_id IS NULL OR c.user_id != p_exclude_user_id)
    AND (
      p_statuses IS NULL
      OR (
        ('FOR_SALE' = ANY(p_statuses) AND c.available_for_sale = true AND (c.available_for_trade IS NULL OR c.available_for_trade = false))
        OR ('FOR_TRADE' = ANY(p_statuses) AND c.available_for_trade = true AND (c.available_for_sale IS NULL OR c.available_for_sale = false))
        OR ('SELL_TRADE' = ANY(p_statuses) AND c.available_for_sale = true AND c.available_for_trade = true)
        OR ('NFST' = ANY(p_statuses) AND (c.available_for_sale IS NULL OR c.available_for_sale = false) AND (c.available_for_trade IS NULL OR c.available_for_trade = false))
      )
    )
  ORDER BY
    CASE WHEN p_sort = 'recent' THEN EXTRACT(EPOCH FROM c.created_at) END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_high' THEN c.value END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_low' THEN c.value END ASC NULLS LAST,
    CASE WHEN p_sort = 'alpha' THEN c.title END ASC NULLS LAST,
    c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$func$;

CREATE OR REPLACE FUNCTION public.get_hot_items(
  p_limit integer DEFAULT 8,
  p_exclude_user_id text DEFAULT NULL
)
RETURNS TABLE(
  id text, title text, photos text[], value numeric,
  available_for_sale boolean, available_for_trade boolean,
  display_name text, username text, track_count bigint
)
LANGUAGE sql
STABLE
AS $func$
  SELECT
    c.id, c.title, c.photos, c.value,
    c.available_for_sale, c.available_for_trade,
    u.display_name, u.username,
    COALESCE(t.cnt, 0) AS track_count
  FROM public.collectibles c
  JOIN public.users u ON u.id = c.user_id
  LEFT JOIN (
    SELECT collectible_id, COUNT(*) AS cnt
    FROM public.tracked_items
    GROUP BY collectible_id
  ) t ON t.collectible_id = c.id
  WHERE c.visibility = 'public'
    AND c.published_at IS NOT NULL
    AND c.photos IS NOT NULL
    AND (c.available_for_sale = true OR c.available_for_trade = true)
    AND (p_exclude_user_id IS NULL OR c.user_id != p_exclude_user_id)
  ORDER BY track_count DESC, c.created_at DESC
  LIMIT p_limit;
$func$;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_collectible_comps + _comps_v2_legacy + get_tracked_comps
-- (Comps RPCs — same body as 20260506020000/030000 plus the
--  c.published_at IS NOT NULL gate on every candidate query.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_collectible_comps(
  p_source_id text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id text,
  title text,
  image text,
  category text,
  subcategory text,
  value numeric,
  available_for_sale boolean,
  available_for_trade boolean,
  owner_id text,
  owner_name text,
  owner_username text,
  owner_avatar text,
  saves_count integer,
  matched_signals integer,
  total_signals integer,
  score_fraction numeric,
  value_fallback boolean
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $func$
#variable_conflict use_column
DECLARE
  v_source_filter_traits jsonb;
  v_source_traits        text[];
  v_source_category      text;
  v_source_user_id       text;
  v_source_value         numeric;
  v_has_filter_traits    boolean;
  W_SUBJECT    constant integer := 5;
  W_ITEM_TYPE  constant integer := 4;
  W_TRAIT      constant integer := 4;
  W_FRANCHISE  constant integer := 2;
  W_YEAR       constant integer := 1;
  W_MAKER      constant integer := 1;
  W_SERIAL     constant integer := 1;
  W_FINISH     constant integer := 1;
  V_MIN_SCORE_FRACTION constant numeric := 0.25;
BEGIN
  SELECT
    c.filter_traits,
    c.traits,
    c.category,
    c.user_id,
    c.value::numeric
  INTO
    v_source_filter_traits,
    v_source_traits,
    v_source_category,
    v_source_user_id,
    v_source_value
  FROM public.collectibles c
  WHERE c.id = p_source_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  v_has_filter_traits := v_source_filter_traits IS NOT NULL
    AND v_source_filter_traits != '{}'::jsonb;
  IF NOT v_has_filter_traits THEN
    RETURN QUERY
    SELECT * FROM public._comps_v2_legacy(p_source_id, p_limit);
    RETURN;
  END IF;
  RETURN QUERY
  WITH source_subjects AS (
    SELECT jsonb_array_elements_text(
      COALESCE(v_source_filter_traits->'subject', '[]'::jsonb)
    ) AS person
  ),
  source_traits AS (
    SELECT unnest(COALESCE(v_source_traits, ARRAY[]::text[])) AS trait
  ),
  source_signal_budget AS (
    SELECT (
      (SELECT COUNT(*) FROM source_subjects) * W_SUBJECT
      + CASE WHEN v_source_filter_traits->>'item_type' IS NOT NULL THEN W_ITEM_TYPE ELSE 0 END
      + (SELECT COUNT(*) FROM source_traits) * W_TRAIT
      + CASE WHEN v_source_filter_traits->>'franchise' IS NOT NULL THEN W_FRANCHISE ELSE 0 END
      + CASE WHEN v_source_filter_traits->>'year' IS NOT NULL THEN W_YEAR ELSE 0 END
      + CASE WHEN v_source_filter_traits->>'maker' IS NOT NULL THEN W_MAKER ELSE 0 END
      + CASE WHEN v_source_filter_traits->>'serial_number' IS NOT NULL THEN W_SERIAL ELSE 0 END
      + CASE WHEN (v_source_filter_traits->>'special_finish')::boolean THEN W_FINISH ELSE 0 END
    )::integer AS total_possible
  ),
  candidates AS (
    SELECT
      c.id AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale, false) AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer AS saves_count,
      c.filter_traits AS cand_ft,
      c.traits AS cand_traits
    FROM public.collectibles c
    WHERE c.category = v_source_category
      AND c.id <> p_source_id
      AND c.user_id IS DISTINCT FROM v_source_user_id
      AND c.visibility = 'public'
      AND c.published_at IS NOT NULL
      AND c.filter_traits IS NOT NULL
  ),
  scored AS (
    SELECT
      cand.*,
      (
        (SELECT COALESCE(COUNT(*), 0) FROM source_subjects ss
         WHERE ss.person IN (
           SELECT jsonb_array_elements_text(
             COALESCE(cand.cand_ft->'subject', '[]'::jsonb)
           )
         )) * W_SUBJECT
        + CASE WHEN cand.cand_ft->>'item_type' = v_source_filter_traits->>'item_type'
               AND v_source_filter_traits->>'item_type' IS NOT NULL
          THEN W_ITEM_TYPE ELSE 0 END
        + (SELECT COALESCE(COUNT(*), 0) FROM source_traits st
           WHERE st.trait = ANY(COALESCE(cand.cand_traits, ARRAY[]::text[]))
          ) * W_TRAIT
        + CASE WHEN cand.cand_ft->>'franchise' = v_source_filter_traits->>'franchise'
               AND v_source_filter_traits->>'franchise' IS NOT NULL
          THEN W_FRANCHISE ELSE 0 END
        + CASE WHEN (cand.cand_ft->>'year')::integer = (v_source_filter_traits->>'year')::integer
               AND v_source_filter_traits->>'year' IS NOT NULL
               AND cand.cand_ft->>'year' IS NOT NULL
          THEN W_YEAR ELSE 0 END
        + CASE WHEN cand.cand_ft->>'maker' = v_source_filter_traits->>'maker'
               AND v_source_filter_traits->>'maker' IS NOT NULL
          THEN W_MAKER ELSE 0 END
        + CASE WHEN cand.cand_ft->>'serial_number' IS NOT NULL
               AND v_source_filter_traits->>'serial_number' IS NOT NULL
          THEN W_SERIAL ELSE 0 END
        + CASE WHEN (cand.cand_ft->>'special_finish')::boolean = true
               AND (v_source_filter_traits->>'special_finish')::boolean = true
          THEN W_FINISH ELSE 0 END
      )::integer AS matched_sig,
      (SELECT total_possible FROM source_signal_budget)::integer AS total_sig
    FROM candidates cand
  ),
  qualified AS (
    SELECT *,
      CASE WHEN total_sig > 0
        THEN matched_sig::numeric / total_sig
        ELSE 0::numeric
      END AS scr
    FROM scored
    WHERE matched_sig > 0
      AND CASE WHEN total_sig > 0
        THEN matched_sig::numeric / total_sig
        ELSE 0::numeric
      END >= V_MIN_SCORE_FRACTION
  ),
  primary_limited AS (
    SELECT * FROM qualified
    ORDER BY scr DESC, saves_count DESC NULLS LAST, cid
    LIMIT p_limit
  ),
  primary_count AS (
    SELECT COUNT(*)::integer AS cnt FROM primary_limited
  ),
  fallback_pick AS (
    SELECT
      c.id AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale, false) AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer AS saves_count,
      0::integer AS matched_sig,
      0::integer AS total_sig,
      0::numeric AS scr
    FROM public.collectibles c
    CROSS JOIN primary_count pc
    WHERE pc.cnt < 3
      AND c.category = v_source_category
      AND c.id <> p_source_id
      AND c.user_id IS DISTINCT FROM v_source_user_id
      AND c.visibility = 'public'
      AND c.published_at IS NOT NULL
      AND c.id NOT IN (SELECT pl.cid FROM primary_limited pl)
      AND v_source_value IS NOT NULL
      AND c.value IS NOT NULL
      AND c.value::numeric BETWEEN v_source_value * 0.6 AND v_source_value * 1.4
    ORDER BY ABS(c.value::numeric - v_source_value) ASC, c.id
    LIMIT GREATEST(0, p_limit - (SELECT cnt FROM primary_count))
  ),
  combined AS (
    SELECT cid, user_id, title, category, subcategory, item_value,
           available_for_sale, available_for_trade, saves_count,
           matched_sig, total_sig, scr, false AS is_fallback
    FROM primary_limited
    UNION ALL
    SELECT cid, user_id, title, category, subcategory, item_value,
           available_for_sale, available_for_trade, saves_count,
           matched_sig, total_sig, scr, true AS is_fallback
    FROM fallback_pick
  )
  SELECT
    comb.cid::text AS id,
    comb.title::text,
    COALESCE(NULLIF(c.photos[1], ''), '')::text AS image,
    comb.category::text,
    comb.subcategory::text,
    comb.item_value AS value,
    comb.available_for_sale,
    comb.available_for_trade,
    comb.user_id::text AS owner_id,
    COALESCE(u.display_name, '')::text AS owner_name,
    COALESCE(u.username, '')::text AS owner_username,
    COALESCE(u.avatar, '')::text AS owner_avatar,
    comb.saves_count,
    comb.matched_sig AS matched_signals,
    comb.total_sig AS total_signals,
    comb.scr AS score_fraction,
    comb.is_fallback AS value_fallback
  FROM combined comb
  INNER JOIN public.collectibles c ON c.id = comb.cid
  LEFT JOIN public.users u ON u.id = comb.user_id
  ORDER BY
    comb.is_fallback ASC,
    comb.scr DESC,
    comb.saves_count DESC NULLS LAST,
    comb.cid
  LIMIT p_limit;
END;
$func$;

-- ─────────────────────────────────────────────────────────────────────────────
-- _comps_v2_legacy — fallback comps for items without filter_traits
-- (same body as 20260506020000, plus `c.published_at IS NOT NULL`)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._comps_v2_legacy(p_source_id text, p_limit integer DEFAULT 30)
 RETURNS TABLE(id text, title text, image text, category text, subcategory text, value numeric, available_for_sale boolean, available_for_trade boolean, owner_id text, owner_name text, owner_username text, owner_avatar text, saves_count integer, matched_signals integer, total_signals integer, score_fraction numeric, value_fallback boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subcat_weight constant integer := 3;
BEGIN
  RETURN QUERY
  WITH source AS (
    SELECT
      c.id,
      c.user_id,
      c.category,
      c.subcategory,
      c.value::numeric AS src_value
    FROM public.collectibles c
    WHERE c.id = p_source_id
  ),
  src_meaningful_fields AS (
    SELECT cfv.field_id, cfv.field_type, cfv.value
    FROM public.collectible_field_values cfv
    INNER JOIN source s ON s.id = cfv.collectible_id
    WHERE (
      (cfv.field_type = 'toggle' AND cfv.value = 'true'::jsonb) OR
      (cfv.field_type = 'slider' AND cfv.value <> '0'::jsonb) OR
      (cfv.field_type IN ('text', 'textarea', 'textList', 'radio'))
    )
  ),
  src_meta AS (
    SELECT
      s.*,
      CASE
        WHEN s.subcategory IS NOT NULL AND s.subcategory <> 'other'
        THEN v_subcat_weight ELSE 0
      END AS subcat_signal_weight,
      (SELECT COUNT(*) FROM src_meaningful_fields)::integer AS meaningful_field_count
    FROM source s
  ),
  totals AS (
    SELECT (sm.subcat_signal_weight + sm.meaningful_field_count)::integer AS total_sig
    FROM src_meta sm
  ),
  candidates_base AS (
    SELECT
      c.id AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale, false) AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer AS saves_count,
      sm.id AS source_id,
      sm.user_id AS source_user_id,
      sm.subcategory AS source_sub,
      sm.subcat_signal_weight,
      t.total_sig
    FROM public.collectibles c
    CROSS JOIN src_meta sm
    CROSS JOIN totals t
    WHERE c.category = sm.category
      AND c.id <> sm.id
      AND c.user_id IS DISTINCT FROM sm.user_id
      AND c.visibility = 'public'
      AND c.published_at IS NOT NULL
  ),
  field_match_counts AS (
    SELECT cfv.collectible_id AS cid, COUNT(*)::integer AS field_matches
    FROM public.collectible_field_values cfv
    INNER JOIN src_meaningful_fields sf
      ON sf.field_id = cfv.field_id
     AND cfv.value IS NOT DISTINCT FROM sf.value
    WHERE cfv.collectible_id IN (SELECT cid FROM candidates_base)
    GROUP BY cfv.collectible_id
  ),
  scored AS (
    SELECT
      cb.*,
      (
        CASE
          WHEN cb.subcat_signal_weight > 0
           AND cb.subcategory IS NOT NULL
           AND cb.subcategory <> 'other'
           AND cb.subcategory = cb.source_sub
          THEN cb.subcat_signal_weight ELSE 0
        END
        + COALESCE(fmc.field_matches, 0)
      )::integer AS matched_sig
    FROM candidates_base cb
    LEFT JOIN field_match_counts fmc ON fmc.cid = cb.cid
  ),
  primary_ranked AS (
    SELECT
      sc.*,
      CASE
        WHEN sc.total_sig > 0 THEN (sc.matched_sig::numeric / sc.total_sig)
        ELSE 0::numeric
      END AS scr
    FROM scored sc
    WHERE sc.matched_sig >= 1
  ),
  primary_limited AS (
    SELECT * FROM primary_ranked
    ORDER BY scr DESC, saves_count DESC NULLS LAST, cid
    LIMIT p_limit
  ),
  primary_count AS (
    SELECT COUNT(*)::integer AS cnt FROM primary_limited
  ),
  fallback_pick AS (
    SELECT
      c.id AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale, false) AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer AS saves_count,
      0::integer AS matched_sig,
      (SELECT t.total_sig FROM totals t LIMIT 1) AS total_sig_local,
      0::numeric AS scr
    FROM public.collectibles c
    CROSS JOIN source s
    CROSS JOIN primary_count pc
    WHERE pc.cnt < 3
      AND c.category = s.category
      AND c.id <> s.id
      AND c.user_id IS DISTINCT FROM s.user_id
      AND c.visibility = 'public'
      AND c.published_at IS NOT NULL
      AND c.id NOT IN (SELECT pl.cid FROM primary_limited pl)
      AND s.src_value IS NOT NULL
      AND c.value IS NOT NULL
      AND c.value::numeric BETWEEN s.src_value * 0.6 AND s.src_value * 1.4
    ORDER BY ABS(c.value::numeric - s.src_value) ASC, c.id
    LIMIT GREATEST(0, p_limit - (SELECT cnt FROM primary_count))
  ),
  combined AS (
    SELECT
      pl.cid, pl.user_id, pl.title, pl.category, pl.subcategory, pl.item_value,
      pl.available_for_sale, pl.available_for_trade, pl.saves_count,
      pl.matched_sig, pl.total_sig, pl.scr, false AS is_fallback
    FROM primary_limited pl
    UNION ALL
    SELECT
      fp.cid, fp.user_id, fp.title, fp.category, fp.subcategory, fp.item_value,
      fp.available_for_sale, fp.available_for_trade, fp.saves_count,
      fp.matched_sig, fp.total_sig_local, fp.scr, true
    FROM fallback_pick fp
  )
  SELECT
    comb.cid::text AS id,
    comb.title::text,
    COALESCE(NULLIF(c.photos[1], ''), '')::text AS image,
    comb.category::text,
    comb.subcategory::text,
    comb.item_value AS value,
    comb.available_for_sale,
    comb.available_for_trade,
    comb.user_id::text AS owner_id,
    COALESCE(u.display_name, '')::text AS owner_name,
    COALESCE(u.username, '')::text AS owner_username,
    COALESCE(u.avatar, '')::text AS owner_avatar,
    comb.saves_count,
    comb.matched_sig AS matched_signals,
    comb.total_sig::integer AS total_signals,
    comb.scr AS score_fraction,
    comb.is_fallback AS value_fallback
  FROM combined comb
  INNER JOIN public.collectibles c ON c.id = comb.cid
  LEFT JOIN public.users u ON u.id = comb.user_id
  ORDER BY
    comb.is_fallback ASC,
    comb.scr DESC,
    comb.saves_count DESC NULLS LAST,
    comb.cid
  LIMIT p_limit;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_tracked_comps — comps for items the user is tracking
-- (same body as 20260506030000, plus `c.published_at IS NOT NULL`)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_tracked_comps(p_user_id text, p_limit integer DEFAULT 30)
 RETURNS TABLE(id text, title text, image text, category text, subcategory text, value numeric, available_for_sale boolean, available_for_trade boolean, owner_id text, owner_name text, owner_username text, owner_avatar text, saves_count integer, matched_signals integer, total_signals integer, score_fraction numeric, value_fallback boolean, source_collectible_id text, source_title text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  W_SUBJECT    constant integer := 5;
  W_ITEM_TYPE  constant integer := 4;
  W_TRAIT      constant integer := 4;
  W_FRANCHISE  constant integer := 2;
  W_YEAR       constant integer := 1;
  W_MAKER      constant integer := 1;
  W_SERIAL     constant integer := 1;
  W_FINISH     constant integer := 1;
  V_MIN_SOURCE_FIELDS   constant integer := 2;
  V_MIN_SCORE_FRACTION  constant numeric := 0.25;
BEGIN
  RETURN QUERY
  WITH tracked_sources AS (
    SELECT
      ti.collectible_id AS src_id,
      c.title           AS src_title,
      c.category,
      c.user_id         AS src_owner_id,
      c.value::numeric  AS src_value,
      c.filter_traits   AS src_ft,
      c.traits          AS src_traits
    FROM public.tracked_items ti
    INNER JOIN public.collectibles c ON c.id = ti.collectible_id
    WHERE ti.user_id = p_user_id
      AND c.filter_traits IS NOT NULL
      AND c.filter_traits != '{}'::jsonb
    ORDER BY c.value DESC NULLS LAST, ti.created_at DESC
    LIMIT 50
  ),
  qualified_sources AS (
    SELECT ts.*,
      (
        (SELECT COUNT(*) FROM jsonb_array_elements_text(
          COALESCE(ts.src_ft->'subject', '[]'::jsonb)
        )) * W_SUBJECT
        + CASE WHEN ts.src_ft->>'item_type' IS NOT NULL THEN W_ITEM_TYPE ELSE 0 END
        + (SELECT COUNT(*) FROM unnest(COALESCE(ts.src_traits, ARRAY[]::text[]))) * W_TRAIT
        + CASE WHEN ts.src_ft->>'franchise' IS NOT NULL THEN W_FRANCHISE ELSE 0 END
        + CASE WHEN ts.src_ft->>'year' IS NOT NULL THEN W_YEAR ELSE 0 END
        + CASE WHEN ts.src_ft->>'maker' IS NOT NULL THEN W_MAKER ELSE 0 END
        + CASE WHEN ts.src_ft->>'serial_number' IS NOT NULL THEN W_SERIAL ELSE 0 END
        + CASE WHEN (ts.src_ft->>'special_finish')::boolean THEN W_FINISH ELSE 0 END
      )::integer AS total_possible
    FROM tracked_sources ts
    WHERE (
      (CASE WHEN ts.src_ft->>'item_type' IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN ts.src_ft->'subject' IS NOT NULL AND ts.src_ft->'subject' != '[]'::jsonb THEN 1 ELSE 0 END)
      + (CASE WHEN ts.src_ft->>'franchise' IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN ts.src_ft->>'maker' IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN ts.src_ft->>'year' IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN ts.src_ft->>'serial_number' IS NOT NULL THEN 1 ELSE 0 END)
    ) >= V_MIN_SOURCE_FIELDS
  ),
  tracked_ids AS (
    SELECT collectible_id FROM public.tracked_items WHERE user_id = p_user_id
  ),
  candidates AS (
    SELECT
      c.id   AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale, false)  AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer    AS saves_count,
      c.filter_traits AS cand_ft,
      c.traits AS cand_traits,
      qs.src_id,
      qs.src_title,
      qs.src_ft,
      qs.src_traits,
      qs.total_possible,
      qs.src_value
    FROM public.collectibles c
    INNER JOIN qualified_sources qs ON qs.category = c.category
    WHERE c.user_id IS DISTINCT FROM qs.src_owner_id
      AND c.user_id <> p_user_id
      AND c.visibility = 'public'
      AND c.published_at IS NOT NULL
      AND c.id <> qs.src_id
      AND c.id NOT IN (SELECT collectible_id FROM tracked_ids)
      AND c.filter_traits IS NOT NULL
  ),
  scored AS (
    SELECT
      cand.*,
      (
        (SELECT COALESCE(COUNT(*), 0)
         FROM jsonb_array_elements_text(COALESCE(cand.src_ft->'subject', '[]'::jsonb)) s_person
         WHERE s_person IN (
           SELECT jsonb_array_elements_text(COALESCE(cand.cand_ft->'subject', '[]'::jsonb))
         )) * W_SUBJECT
        + CASE WHEN cand.cand_ft->>'item_type' = cand.src_ft->>'item_type'
               AND cand.src_ft->>'item_type' IS NOT NULL
          THEN W_ITEM_TYPE ELSE 0 END
        + (SELECT COALESCE(COUNT(*), 0)
           FROM unnest(COALESCE(cand.src_traits, ARRAY[]::text[])) st
           WHERE st = ANY(COALESCE(cand.cand_traits, ARRAY[]::text[]))
          ) * W_TRAIT
        + CASE WHEN cand.cand_ft->>'franchise' = cand.src_ft->>'franchise'
               AND cand.src_ft->>'franchise' IS NOT NULL
          THEN W_FRANCHISE ELSE 0 END
        + CASE WHEN (cand.cand_ft->>'year')::integer = (cand.src_ft->>'year')::integer
               AND cand.src_ft->>'year' IS NOT NULL
               AND cand.cand_ft->>'year' IS NOT NULL
          THEN W_YEAR ELSE 0 END
        + CASE WHEN cand.cand_ft->>'maker' = cand.src_ft->>'maker'
               AND cand.src_ft->>'maker' IS NOT NULL
          THEN W_MAKER ELSE 0 END
        + CASE WHEN cand.cand_ft->>'serial_number' IS NOT NULL
               AND cand.src_ft->>'serial_number' IS NOT NULL
          THEN W_SERIAL ELSE 0 END
        + CASE WHEN (cand.cand_ft->>'special_finish')::boolean = true
               AND (cand.src_ft->>'special_finish')::boolean = true
          THEN W_FINISH ELSE 0 END
      )::integer AS matched_sig
    FROM candidates cand
  ),
  qualified AS (
    SELECT *,
      CASE WHEN total_possible > 0
        THEN matched_sig::numeric / total_possible
        ELSE 0::numeric
      END AS scr
    FROM scored
    WHERE matched_sig > 0
      AND CASE WHEN total_possible > 0
        THEN matched_sig::numeric / total_possible
        ELSE 0::numeric
      END >= V_MIN_SCORE_FRACTION
  ),
  deduped AS (
    SELECT DISTINCT ON (cid)
      cid, user_id, title, category, subcategory, item_value,
      available_for_sale, available_for_trade, saves_count,
      matched_sig, total_possible AS total_sig, scr,
      src_id AS best_src_id,
      src_title AS best_src_title,
      src_value,
      false AS is_fallback
    FROM qualified
    ORDER BY cid, scr DESC, saves_count DESC NULLS LAST
  ),
  primary_limited AS (
    SELECT * FROM deduped
    ORDER BY scr DESC, saves_count DESC NULLS LAST, cid
    LIMIT p_limit
  ),
  primary_count AS (
    SELECT COUNT(*)::integer AS cnt FROM primary_limited
  ),
  fallback_pick AS (
    SELECT
      c.id AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale, false)  AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer    AS saves_count,
      0::integer AS matched_sig,
      0::integer AS total_sig,
      0::numeric AS scr,
      qs.src_id AS best_src_id,
      qs.src_title AS best_src_title,
      qs.src_value,
      true AS is_fallback
    FROM public.collectibles c
    CROSS JOIN (SELECT * FROM qualified_sources LIMIT 1) qs
    CROSS JOIN primary_count pc
    WHERE pc.cnt < 3
      AND c.category = qs.category
      AND c.user_id <> p_user_id
      AND c.visibility = 'public'
      AND c.published_at IS NOT NULL
      AND c.id NOT IN (SELECT collectible_id FROM tracked_ids)
      AND c.id NOT IN (SELECT cid FROM primary_limited)
      AND qs.src_value IS NOT NULL
      AND c.value IS NOT NULL
      AND c.value::numeric BETWEEN qs.src_value * 0.6 AND qs.src_value * 1.4
    ORDER BY ABS(c.value::numeric - qs.src_value) ASC, c.id
    LIMIT GREATEST(0, p_limit - (SELECT cnt FROM primary_count))
  ),
  combined AS (
    SELECT * FROM primary_limited
    UNION ALL
    SELECT * FROM fallback_pick
  )
  SELECT
    comb.cid::text            AS id,
    comb.title::text,
    COALESCE(NULLIF(c.photos[1], ''), '')::text AS image,
    comb.category::text,
    comb.subcategory::text,
    comb.item_value           AS value,
    comb.available_for_sale,
    comb.available_for_trade,
    comb.user_id::text        AS owner_id,
    COALESCE(u.display_name, '')::text AS owner_name,
    COALESCE(u.username, '')::text     AS owner_username,
    COALESCE(u.avatar, '')::text       AS owner_avatar,
    comb.saves_count,
    comb.matched_sig          AS matched_signals,
    comb.total_sig            AS total_signals,
    comb.scr                  AS score_fraction,
    comb.is_fallback          AS value_fallback,
    comb.best_src_id::text    AS source_collectible_id,
    comb.best_src_title::text AS source_title
  FROM combined comb
  INNER JOIN public.collectibles c ON c.id = comb.cid
  LEFT JOIN  public.users u ON u.id = comb.user_id
  ORDER BY
    comb.is_fallback ASC,
    comb.scr DESC,
    comb.saves_count DESC NULLS LAST,
    comb.cid
  LIMIT p_limit;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- search_collectors_tiered — Tier 1 (collector name) + Tier 2 (item match)
-- (same body as 20260505040000, plus `c.published_at IS NOT NULL` in
--  the item_matches CTE)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_collectors_tiered(p_query text, p_traits text[] DEFAULT NULL::text[], p_types text[] DEFAULT NULL::text[], p_statuses text[] DEFAULT NULL::text[], p_limit integer DEFAULT 20, p_exclude_user_id text DEFAULT NULL::text)
 RETURNS TABLE(user_id text, display_name text, username text, avatar text, collectibles_count integer, match_count integer, preview_thumbs text[], match_tier integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_query text := '%' || trim(p_query) || '%';
BEGIN
  RETURN QUERY
  WITH
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
  item_matches AS (
    SELECT
      c.user_id::text                                     AS user_id,
      COUNT(*)::integer                                   AS match_count,
      array_agg(c.photos[1] ORDER BY c.value DESC NULLS LAST)
        FILTER (WHERE c.photos[1] IS NOT NULL)            AS all_thumbs
    FROM public.collectibles c
    WHERE
      c.visibility = 'public'
      AND c.published_at IS NOT NULL
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
    LIMIT p_limit * 3
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
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- search_showcases_tiered — Tier 1 (showcase metadata) + Tier 2 (item match)
-- (same body as 20260505040000, plus `c.published_at IS NOT NULL` in
--  both item_matches and fallback_thumbs CTEs)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_showcases_tiered(p_query text, p_traits text[] DEFAULT NULL::text[], p_types text[] DEFAULT NULL::text[], p_statuses text[] DEFAULT NULL::text[], p_limit integer DEFAULT 20, p_exclude_user_id text DEFAULT NULL::text)
 RETURNS TABLE(showcase_id text, title text, description text, owner_id text, owner_username text, owner_display_name text, owner_avatar text, preview_thumbs text[], item_count integer, match_count integer, match_tier integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_query text := '%' || trim(p_query) || '%';
BEGIN
  RETURN QUERY
  WITH
  showcase_item_counts AS (
    SELECT
      sc.showcase_id::text AS showcase_id,
      COUNT(*)::integer    AS item_count
    FROM public.showcase_collectibles sc
    GROUP BY sc.showcase_id
  ),
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
      AND c.published_at IS NOT NULL
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
  fallback_thumbs AS (
    SELECT
      sc.showcase_id::text                                  AS showcase_id,
      array_agg(c.photos[1] ORDER BY c.value DESC NULLS LAST)
        FILTER (WHERE c.photos[1] IS NOT NULL)              AS all_thumbs
    FROM public.showcase_collectibles sc
    INNER JOIN public.collectibles c ON c.id = sc.collectible_id
    WHERE c.photos IS NOT NULL
      AND c.published_at IS NOT NULL
    GROUP BY sc.showcase_id
  ),
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
$function$;
