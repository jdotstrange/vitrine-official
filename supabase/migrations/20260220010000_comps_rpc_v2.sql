-- Comps v2: weighted subcategory + meaningful-signal filter
--
-- v1 problems this fixes:
--   1. Toggle fields default to `false` (82.5% of rows). A pocket schedule and
--      a jersey both having Autographed=false, Game Used=false, etc. would
--      produce 6+ "matching signals" that are semantically void.
--   2. Slider fields default to `0` (47.8% of rows). Same problem.
--   3. Subcategory was weighted equally to a single field match, so items
--      sharing subcategory lost relevance when a random item happened to have
--      many default-equal fields.
--   4. subcategory='other' matching 'other' was treated as a positive signal
--      even though "other" is the absence of classification.
--
-- v2 rules:
--   - Subcategory weight = 3 (single match == 3 field matches).
--   - subcategory='other' (or NULL) on source contributes 0 to source total.
--   - subcategory='other' (or NULL) on candidate never earns the subcategory bonus.
--   - Toggle fields only count when source.value = true.
--   - Slider fields only count when source.value != 0.
--   - Text/textarea/textList/radio fields always count when present.
--   - Because candidate matches require equal jsonb to source's meaningful
--     value, candidate meaningfulness is implicit (both=true, both!=0, etc.).

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
        THEN v_subcat_weight
        ELSE 0
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
          THEN cb.subcat_signal_weight
          ELSE 0
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

COMMENT ON FUNCTION public.get_collectible_comps(text, integer) IS
  'v2: subcategory weighted 3x + meaningful-signal filter (skips toggle=false / slider=0 / subcategory=other).';
