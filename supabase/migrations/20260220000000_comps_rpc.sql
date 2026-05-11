-- Comps / similar items: ranked RPC + supporting indexes
-- SECURITY INVOKER: respect RLS on collectibles / users
-- NOTE: collectible_field_values.value is jsonb; a btree on (field_id, value)
-- can exceed the 8KB page limit, so we only index field_id.

CREATE INDEX IF NOT EXISTS idx_collectibles_category_sub_public
  ON public.collectibles (category, subcategory)
  WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_cfv_field_id
  ON public.collectible_field_values (field_id);

CREATE INDEX IF NOT EXISTS idx_cfv_collectible
  ON public.collectible_field_values (collectible_id);

-- -----------------------------------------------------------------------------
-- get_collectible_comps
-- plpgsql because SQL-language functions can't use variables in LIMIT clauses.
-- -----------------------------------------------------------------------------
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
  src_fields AS (
    SELECT cfv.field_id, cfv.value
    FROM public.collectible_field_values cfv
    INNER JOIN source s ON s.id = cfv.collectible_id
  ),
  field_stats AS (
    SELECT COUNT(*)::integer AS dynamic_field_count
    FROM src_fields
  ),
  totals AS (
    SELECT (1 + fs.dynamic_field_count)::numeric AS total_sig
    FROM field_stats fs
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
      s.user_id AS source_user_id,
      s.subcategory AS source_sub,
      t.total_sig
    FROM public.collectibles c
    CROSS JOIN source s
    CROSS JOIN totals t
    WHERE c.category = s.category
      AND c.id <> s.id
      AND c.user_id IS DISTINCT FROM s.user_id
      AND c.visibility = 'public'
  ),
  field_match_counts AS (
    SELECT
      cb.cid,
      COUNT(*)::integer AS field_matches
    FROM candidates_base cb
    INNER JOIN src_fields sf ON true
    INNER JOIN public.collectible_field_values cfv
      ON cfv.collectible_id = cb.cid
      AND cfv.field_id = sf.field_id
      AND cfv.value IS NOT DISTINCT FROM sf.value
    GROUP BY cb.cid
  ),
  scored AS (
    SELECT
      cb.*,
      (
        CASE
          WHEN cb.subcategory IS NOT DISTINCT FROM cb.source_sub THEN 1
          ELSE 0
        END + COALESCE(fmc.field_matches, 0)
      )::integer AS matched_sig,
      cb.total_sig AS total_sig_local
    FROM candidates_base cb
    LEFT JOIN field_match_counts fmc ON fmc.cid = cb.cid
  ),
  primary_ranked AS (
    SELECT
      sc.cid,
      sc.user_id,
      sc.title,
      sc.category,
      sc.subcategory,
      sc.item_value,
      sc.available_for_sale,
      sc.available_for_trade,
      sc.saves_count,
      sc.matched_sig,
      sc.total_sig_local,
      CASE
        WHEN sc.total_sig_local > 0 THEN (sc.matched_sig::numeric / sc.total_sig_local)
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
      pl.matched_sig, pl.total_sig_local, pl.scr, false AS is_fallback
    FROM primary_limited pl
    UNION ALL
    SELECT
      fp.cid, fp.user_id, fp.title, fp.category, fp.subcategory, fp.item_value,
      fp.available_for_sale, fp.available_for_trade, fp.saves_count,
      fp.matched_sig, fp.total_sig_local, fp.scr, true AS is_fallback
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
    comb.total_sig_local::integer AS total_signals,
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
  'Rank similar public collectibles by subcategory + dynamic field matches; optional value-range fallback.';

GRANT EXECUTE ON FUNCTION public.get_collectible_comps(text, integer) TO authenticated, anon;
