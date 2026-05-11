-- get_tracked_comps: blended comparable-sales across all items a user tracks.
--
-- Analogous to get_collectible_comps v2 but operates across the full tracked
-- portfolio for a user, then deduplicates candidates that match multiple
-- tracked sources (keeping the best score + one source attribution).
--
-- Quality gates (prevent sparse sources from flooding the feed):
--   Gate 1 — Source quality floor: a tracked item must have >= v_min_source_fields
--            meaningful field values to contribute comps. Sparse/legacy items
--            with only a subcategory match are excluded.
--   Gate 2 — Match quality floor: a candidate must have matched_signals >=
--            v_min_matched_signals AND score_fraction >= v_min_score_fraction.
--            Prevents trivially-matched items from appearing.
--
-- Performance notes:
--   - tracked_sources is capped at 50 items (highest value) to keep the
--     cross-join manageable for large portfolios.
--   - Candidates are pre-filtered to public items in the same category,
--     not owned by p_user_id, and not already in the user's tracked_items.
--   - An existing index on tracked_items(user_id) covers the source CTE.
--     The existing collectibles(category) index covers candidate filtering.
--
-- Signal weighting mirrors v2 exactly (subcategory = 3x, meaningful-only).

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
  v_subcat_weight        constant integer := 3;
  v_min_source_fields    constant integer := 2;    -- Gate 1: source quality floor
  v_min_matched_signals  constant integer := 3;    -- Gate 2: minimum absolute matches
  v_min_score_fraction   constant numeric := 0.5;  -- Gate 2: minimum match percentage
BEGIN
  RETURN QUERY
  WITH tracked_sources AS (
    -- Fetch the top 50 tracked items by value for this user.
    -- Capping prevents an O(N²) cross-join explosion for large portfolios.
    SELECT
      ti.collectible_id AS src_id,
      c.title           AS src_title,
      c.category,
      c.subcategory,
      c.value::numeric  AS src_value,
      c.user_id         AS src_owner_id
    FROM public.tracked_items ti
    INNER JOIN public.collectibles c ON c.id = ti.collectible_id
    WHERE ti.user_id = p_user_id
    ORDER BY c.value DESC NULLS LAST, ti.created_at DESC
    LIMIT 50
  ),
  -- IDs already tracked — exclude from candidates
  tracked_ids AS (
    SELECT collectible_id FROM public.tracked_items WHERE user_id = p_user_id
  ),
  -- Per-source: gather meaningful field values (v2 toggle/slider/text filter)
  src_meaningful_fields AS (
    SELECT
      cfv.collectible_id AS src_id,
      cfv.field_id,
      cfv.field_type,
      cfv.value
    FROM public.collectible_field_values cfv
    INNER JOIN tracked_sources ts ON ts.src_id = cfv.collectible_id
    WHERE (
      (cfv.field_type = 'toggle'   AND cfv.value = 'true'::jsonb) OR
      (cfv.field_type = 'slider'   AND cfv.value <> '0'::jsonb)   OR
      (cfv.field_type IN ('text', 'textarea', 'textList', 'radio'))
    )
  ),
  -- Per-source: total signal weight (subcategory bonus + meaningful field count)
  src_totals AS (
    SELECT
      ts.src_id,
      ts.src_title,
      ts.category,
      ts.subcategory,
      ts.src_value,
      ts.src_owner_id,
      CASE
        WHEN ts.subcategory IS NOT NULL AND ts.subcategory <> 'other'
        THEN v_subcat_weight ELSE 0
      END AS subcat_weight,
      COUNT(smf.field_id)::integer AS meaningful_field_count
    FROM tracked_sources ts
    LEFT JOIN src_meaningful_fields smf ON smf.src_id = ts.src_id
    GROUP BY ts.src_id, ts.src_title, ts.category, ts.subcategory, ts.src_value, ts.src_owner_id
  ),
  -- Gate 1: only sources with enough enrichment to produce meaningful comps
  qualified_sources AS (
    SELECT * FROM src_totals
    WHERE meaningful_field_count >= v_min_source_fields
  ),
  -- Candidate pool: public collectibles, same category, different owner, not tracked
  candidates_base AS (
    SELECT
      c.id    AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric         AS item_value,
      COALESCE(c.available_for_sale,  false) AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer    AS saves_count,
      st.src_id,
      st.src_title,
      st.subcategory           AS source_sub,
      st.subcat_weight,
      (st.subcat_weight + st.meaningful_field_count)::integer AS total_sig
    FROM public.collectibles c
    INNER JOIN qualified_sources st ON st.category = c.category
    WHERE c.user_id IS DISTINCT FROM st.src_owner_id
      AND c.user_id <> p_user_id
      AND c.visibility = 'public'
      AND c.id <> st.src_id
      AND c.id NOT IN (SELECT collectible_id FROM tracked_ids)
  ),
  -- Field-match counts: how many meaningful source fields match each candidate
  field_match_counts AS (
    SELECT
      cfv.collectible_id AS cid,
      smf.src_id,
      COUNT(*)::integer  AS field_matches
    FROM public.collectible_field_values cfv
    INNER JOIN src_meaningful_fields smf
      ON smf.field_id = cfv.field_id
     AND cfv.value IS NOT DISTINCT FROM smf.value
    WHERE cfv.collectible_id IN (SELECT DISTINCT cid FROM candidates_base)
    GROUP BY cfv.collectible_id, smf.src_id
  ),
  -- Score each candidate per source
  scored AS (
    SELECT
      cb.*,
      (
        CASE
          WHEN cb.subcat_weight > 0
           AND cb.subcategory IS NOT NULL
           AND cb.subcategory <> 'other'
           AND cb.subcategory = cb.source_sub
          THEN cb.subcat_weight ELSE 0
        END
        + COALESCE(fmc.field_matches, 0)
      )::integer AS matched_sig,
      CASE
        WHEN cb.total_sig > 0
        THEN (
          CASE
            WHEN cb.subcat_weight > 0
             AND cb.subcategory IS NOT NULL
             AND cb.subcategory <> 'other'
             AND cb.subcategory = cb.source_sub
            THEN cb.subcat_weight ELSE 0
          END
          + COALESCE(fmc.field_matches, 0)
        )::numeric / cb.total_sig
        ELSE 0::numeric
      END AS scr
    FROM candidates_base cb
    LEFT JOIN field_match_counts fmc
      ON fmc.cid = cb.cid AND fmc.src_id = cb.src_id
    WHERE (
      CASE
        WHEN cb.subcat_weight > 0
         AND cb.subcategory IS NOT NULL
         AND cb.subcategory <> 'other'
         AND cb.subcategory = cb.source_sub
        THEN cb.subcat_weight ELSE 0
      END
      + COALESCE(fmc.field_matches, 0)
    ) >= v_min_matched_signals
    AND CASE
      WHEN cb.total_sig > 0
      THEN (
        CASE
          WHEN cb.subcat_weight > 0
           AND cb.subcategory IS NOT NULL
           AND cb.subcategory <> 'other'
           AND cb.subcategory = cb.source_sub
          THEN cb.subcat_weight ELSE 0
        END
        + COALESCE(fmc.field_matches, 0)
      )::numeric / cb.total_sig
      ELSE 0::numeric
    END >= v_min_score_fraction
  ),
  -- Deduplicate: if a candidate matches multiple sources, keep the best score
  deduped AS (
    SELECT DISTINCT ON (cid)
      cid, user_id, title, category, subcategory, item_value,
      available_for_sale, available_for_trade, saves_count,
      matched_sig, total_sig, scr,
      src_id  AS best_src_id,
      src_title AS best_src_title,
      false AS is_fallback
    FROM scored
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
      c.id   AS cid,
      c.user_id,
      c.title,
      c.category,
      c.subcategory,
      c.value::numeric AS item_value,
      COALESCE(c.available_for_sale,  false) AS available_for_sale,
      COALESCE(c.available_for_trade, false) AS available_for_trade,
      COALESCE(c.saves_count, 0)::integer    AS saves_count,
      0::integer  AS matched_sig,
      0::integer  AS total_sig,
      0::numeric  AS scr,
      ts.src_id   AS best_src_id,
      ts.src_title AS best_src_title,
      true AS is_fallback
    FROM public.collectibles c
    CROSS JOIN (SELECT * FROM src_totals LIMIT 1) ts
    CROSS JOIN primary_count pc
    WHERE pc.cnt < 3
      AND c.category = ts.category
      AND c.user_id <> p_user_id
      AND c.visibility = 'public'
      AND c.id NOT IN (SELECT collectible_id FROM tracked_ids)
      AND c.id NOT IN (SELECT cid FROM primary_limited)
      AND ts.src_value IS NOT NULL
      AND c.value IS NOT NULL
      AND c.value::numeric BETWEEN ts.src_value * 0.6 AND ts.src_value * 1.4
    ORDER BY ABS(c.value::numeric - ts.src_value) ASC, c.id
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
  'V2: blended comparable sales across a user''s full tracked portfolio. '
  'Gate 1: sources need >= 2 meaningful fields to contribute. '
  'Gate 2: candidates need >= 3 matched signals AND >= 50% score fraction. '
  'Sources capped at 50 items; candidates deduplicate to best-scoring source. '
  'Mirrors get_collectible_comps v2 signal weighting (subcategory 3x + meaningful-only).';
