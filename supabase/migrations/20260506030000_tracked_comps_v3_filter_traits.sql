-- get_tracked_comps V3: filter_traits + traits scoring across full portfolio.
--
-- Same signal hierarchy as get_collectible_comps V3:
--   Tier 1: subject 5/person, item_type 4, trait 4/trait
--   Tier 2: franchise 2, year 1, maker 1, serial 1, finish 1
--
-- Portfolio-specific behavior:
--   - Top 50 tracked items by value as sources (capped for performance).
--   - Gate 1: source must have filter_traits with >= 2 non-null fields.
--   - Cross-join scoring against public items in same category.
--   - Dedup: if a candidate matches multiple sources, keep best score + attribution.
--   - Fallback: value-range matches when primary results < 3.

CREATE OR REPLACE FUNCTION public.get_tracked_comps(
  p_user_id text,
  p_limit   integer DEFAULT 30
)
RETURNS TABLE (
  id                    text,
  title                 text,
  image                 text,
  category              text,
  subcategory           text,
  value                 numeric,
  available_for_sale    boolean,
  available_for_trade   boolean,
  owner_id              text,
  owner_name            text,
  owner_username        text,
  owner_avatar          text,
  saves_count           integer,
  matched_signals       integer,
  total_signals         integer,
  score_fraction        numeric,
  value_fallback        boolean,
  source_collectible_id text,
  source_title          text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  -- Tier 1 weights
  W_SUBJECT    constant integer := 5;
  W_ITEM_TYPE  constant integer := 4;
  W_TRAIT      constant integer := 4;
  -- Tier 2 weights
  W_FRANCHISE  constant integer := 2;
  W_YEAR       constant integer := 1;
  W_MAKER      constant integer := 1;
  W_SERIAL     constant integer := 1;
  W_FINISH     constant integer := 1;
  -- Quality gates
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
  -- Gate 1: sources must have >= V_MIN_SOURCE_FIELDS non-null filter_traits fields
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
  -- Cross-join: each qualified source vs all public items in same category
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
      AND c.id <> qs.src_id
      AND c.id NOT IN (SELECT collectible_id FROM tracked_ids)
      AND c.filter_traits IS NOT NULL
  ),
  scored AS (
    SELECT
      cand.*,
      (
        -- Subject overlap
        (SELECT COALESCE(COUNT(*), 0)
         FROM jsonb_array_elements_text(COALESCE(cand.src_ft->'subject', '[]'::jsonb)) s_person
         WHERE s_person IN (
           SELECT jsonb_array_elements_text(COALESCE(cand.cand_ft->'subject', '[]'::jsonb))
         )) * W_SUBJECT
        -- Item type
        + CASE WHEN cand.cand_ft->>'item_type' = cand.src_ft->>'item_type'
               AND cand.src_ft->>'item_type' IS NOT NULL
          THEN W_ITEM_TYPE ELSE 0 END
        -- Trait overlap
        + (SELECT COALESCE(COUNT(*), 0)
           FROM unnest(COALESCE(cand.src_traits, ARRAY[]::text[])) st
           WHERE st = ANY(COALESCE(cand.cand_traits, ARRAY[]::text[]))
          ) * W_TRAIT
        -- Franchise
        + CASE WHEN cand.cand_ft->>'franchise' = cand.src_ft->>'franchise'
               AND cand.src_ft->>'franchise' IS NOT NULL
          THEN W_FRANCHISE ELSE 0 END
        -- Year
        + CASE WHEN (cand.cand_ft->>'year')::integer = (cand.src_ft->>'year')::integer
               AND cand.src_ft->>'year' IS NOT NULL
               AND cand.cand_ft->>'year' IS NOT NULL
          THEN W_YEAR ELSE 0 END
        -- Maker
        + CASE WHEN cand.cand_ft->>'maker' = cand.src_ft->>'maker'
               AND cand.src_ft->>'maker' IS NOT NULL
          THEN W_MAKER ELSE 0 END
        -- Serial
        + CASE WHEN cand.cand_ft->>'serial_number' IS NOT NULL
               AND cand.src_ft->>'serial_number' IS NOT NULL
          THEN W_SERIAL ELSE 0 END
        -- Special finish
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
  -- Dedup: candidate matched by multiple sources → keep best score
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
  -- Fallback: value-range matches when primary results < 3
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
$$;

COMMENT ON FUNCTION public.get_tracked_comps(text, integer) IS
  'V3: filter_traits + traits scoring across tracked portfolio. '
  'Tier 1: subject 5/person, item_type 4, trait 4/trait. '
  'Tier 2: franchise 2, year 1, maker 1, serial 1, finish 1. '
  'Gate: sources need >= 2 non-null filter_traits fields. '
  'Sources capped at 50 by value; candidates dedup to best-scoring source.';
