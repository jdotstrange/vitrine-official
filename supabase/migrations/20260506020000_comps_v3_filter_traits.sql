-- Comps V3: filter_traits + traits-based scoring
--
-- Replaces the collectible_field_values join pattern with direct JSONB
-- comparison on filter_traits and text[] intersection on traits.
--
-- Signal hierarchy (reflects collector value intuition):
--   Tier 1 — Value-defining:
--     subject overlap:   5 per matched person (WHO)
--     item_type match:   4 (WHAT)
--     trait overlap:     4 per shared trait (VALUE TIER)
--   Tier 2 — Contextual refinement:
--     franchise match:   2
--     year proximity:    1 (same year)
--     maker match:       1
--     serial both exist: 1
--     special_finish:    1
--
-- Graceful degradation: if the source has no filter_traits, falls back
-- to v2-style collectible_field_values matching. This allows the v3 RPC
-- to serve all collectibles during the backfill period.

-- Index for containment queries on filter_traits
CREATE INDEX IF NOT EXISTS idx_collectibles_filter_traits
  ON public.collectibles USING gin (filter_traits);

-- Index for trait array overlap
CREATE INDEX IF NOT EXISTS idx_collectibles_traits
  ON public.collectibles USING gin (traits);

-- ============================================================================
-- get_collectible_comps V3 — single-item comps
-- ============================================================================

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
AS $$
#variable_conflict use_column
DECLARE
  v_source_filter_traits jsonb;
  v_source_traits        text[];
  v_source_category      text;
  v_source_user_id       text;
  v_source_value         numeric;
  v_has_filter_traits    boolean;

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
  V_MIN_SCORE_FRACTION constant numeric := 0.25;
BEGIN
  -- Load source collectible data
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

  -- If no filter_traits, fall back to legacy v2 scoring path
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
      AND c.filter_traits IS NOT NULL
  ),
  scored AS (
    SELECT
      cand.*,
      (
        -- Subject overlap: count matched persons * W_SUBJECT
        (SELECT COALESCE(COUNT(*), 0) FROM source_subjects ss
         WHERE ss.person IN (
           SELECT jsonb_array_elements_text(
             COALESCE(cand.cand_ft->'subject', '[]'::jsonb)
           )
         )) * W_SUBJECT

        -- Item type match
        + CASE WHEN cand.cand_ft->>'item_type' = v_source_filter_traits->>'item_type'
               AND v_source_filter_traits->>'item_type' IS NOT NULL
          THEN W_ITEM_TYPE ELSE 0 END

        -- Trait overlap: count shared traits * W_TRAIT
        + (SELECT COALESCE(COUNT(*), 0) FROM source_traits st
           WHERE st.trait = ANY(COALESCE(cand.cand_traits, ARRAY[]::text[]))
          ) * W_TRAIT

        -- Franchise match
        + CASE WHEN cand.cand_ft->>'franchise' = v_source_filter_traits->>'franchise'
               AND v_source_filter_traits->>'franchise' IS NOT NULL
          THEN W_FRANCHISE ELSE 0 END

        -- Year proximity (same year = 1 point)
        + CASE WHEN (cand.cand_ft->>'year')::integer = (v_source_filter_traits->>'year')::integer
               AND v_source_filter_traits->>'year' IS NOT NULL
               AND cand.cand_ft->>'year' IS NOT NULL
          THEN W_YEAR ELSE 0 END

        -- Maker match
        + CASE WHEN cand.cand_ft->>'maker' = v_source_filter_traits->>'maker'
               AND v_source_filter_traits->>'maker' IS NOT NULL
          THEN W_MAKER ELSE 0 END

        -- Serial number both present
        + CASE WHEN cand.cand_ft->>'serial_number' IS NOT NULL
               AND v_source_filter_traits->>'serial_number' IS NOT NULL
          THEN W_SERIAL ELSE 0 END

        -- Special finish both true
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
$$;

COMMENT ON FUNCTION public.get_collectible_comps(text, integer) IS
  'V3: filter_traits + traits-based scoring. '
  'Tier 1 (value-defining): subject 5/person, item_type 4, trait 4/trait. '
  'Tier 2 (contextual): franchise 2, year 1, maker 1, serial 1, finish 1. '
  'Falls back to v2 collectible_field_values path when source lacks filter_traits.';


-- ============================================================================
-- Legacy v2 helper — extracted for fallback use by v3.
-- Same logic as the original get_collectible_comps v2, wrapped as internal fn.
-- ============================================================================

CREATE OR REPLACE FUNCTION public._comps_v2_legacy(
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
AS $$
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
$$;

COMMENT ON FUNCTION public._comps_v2_legacy(text, integer) IS
  'Internal: v2 comps scoring (collectible_field_values). Called by v3 as fallback for items without filter_traits.';
