-- Patches create_trading_card's canonical title builder so it produces clean,
-- non-duplicated titles.
--
-- Problem observed with the original builder:
--   Input : setName="2016 Pokemon XY Evolutions",
--           cardName="Charizard Holo 2016 Pokemon XY Evolutions",
--           variant="Base",
--           gradingCompany="PSA",
--           grade="PSA 10"
--   Output: "2016 Pokemon XY Evolutions Charizard Holo 2016 Pokemon XY Evolutions #11 (Base) PSA PSA 10"
--
-- Fixes applied here:
--   1. Card Hedge's `cardName` often already contains `setName` — strip it
--      from `cardName` so "Charizard Holo 2016 Pokemon XY Evolutions" becomes
--      "Charizard Holo" when `setName` is "2016 Pokemon XY Evolutions".
--   2. Card Hedge's `grade` already carries the grader prefix (e.g. "PSA 10",
--      "BGS 9.5"), so we don't prepend `gradingCompany` when the grade already
--      starts with it. Still prepends when grade is bare (e.g. "10").
--   3. Drop `(Base)` from the title — "Base" is Card Hedge's default non-variant
--      label and adds visual noise, not information.
--
-- Target output for the Charizard example:
--   "2016 Pokemon XY Evolutions Charizard Holo #11 PSA 10"

CREATE OR REPLACE FUNCTION public.create_trading_card(
  p_user_id text,
  p_input jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_catalog_id text;
  v_collectible_id text;
  v_details_id text;
  v_effective_price numeric;
  v_title text;
  v_api_price numeric;
  v_pricing_mode pricing_mode;
  v_margin int;
  v_manual_price numeric;
  v_showcase_id text;
  v_next_order int;
  v_photos text[];
  v_tags text[];
  v_year text;
  v_set_name text;
  v_card_name text;
  v_card_name_core text;
  v_variant text;
  v_grading_company text;
  v_grade text;
  v_grade_display text;
  v_year_piece text;
BEGIN
  -- ---- Extract + validate pricing inputs ------------------------------
  BEGIN
    v_pricing_mode := (p_input->>'pricingMode')::pricing_mode;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_pricing_mode' USING ERRCODE = '22023';
  END;

  v_margin      := NULLIF(p_input->>'marginPercentage', '')::int;
  v_manual_price := NULLIF(p_input->>'manualPrice', '')::numeric;
  v_api_price   := NULLIF(p_input->>'apiPrice', '')::numeric;
  v_showcase_id := NULLIF(p_input->>'showcaseId', '');

  IF v_pricing_mode = 'dynamic_margin' AND v_margin IS NULL THEN
    RAISE EXCEPTION 'margin_required_for_dynamic_margin' USING ERRCODE = '22023';
  END IF;

  IF v_pricing_mode = 'manual' AND (v_manual_price IS NULL OR v_manual_price <= 0) THEN
    RAISE EXCEPTION 'manual_price_required_and_positive' USING ERRCODE = '22023';
  END IF;

  IF NOT (p_input ? 'photos') OR jsonb_array_length(p_input->'photos') = 0 THEN
    RAISE EXCEPTION 'photos_required' USING ERRCODE = '22023';
  END IF;
  v_photos := ARRAY(SELECT jsonb_array_elements_text(p_input->'photos'));

  v_tags := CASE
    WHEN p_input ? 'tags'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_input->'tags'))
    ELSE '{}'::text[]
  END;

  -- ---- Verify showcase ownership if provided --------------------------
  IF v_showcase_id IS NOT NULL THEN
    PERFORM 1 FROM showcases WHERE id = v_showcase_id AND user_id = p_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'showcase_not_found_or_not_owned' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- ---- Compute effective price ----------------------------------------
  v_effective_price := CASE v_pricing_mode
    WHEN 'dynamic' THEN COALESCE(v_api_price, 0)
    WHEN 'dynamic_margin' THEN
      CASE WHEN v_api_price IS NOT NULL
        THEN ROUND(v_api_price * (1 + v_margin::numeric / 100), 2)
        ELSE 0
      END
    WHEN 'manual' THEN v_manual_price
  END;

  -- ---- Derive canonical title -----------------------------------------
  v_year            := NULLIF(p_input->>'year', '');
  v_set_name        := NULLIF(p_input->>'setName', '');
  v_card_name       := NULLIF(p_input->>'cardName', '');
  v_variant         := NULLIF(p_input->>'variant', '');
  v_grading_company := COALESCE(NULLIF(p_input->>'gradingCompany', ''), 'PSA');
  v_grade           := NULLIF(p_input->>'grade', '');

  -- Strip setName from cardName when duplicated (Card Hedge's cardName
  -- frequently contains setName, e.g. "Charizard Holo 2016 Pokemon XY Evolutions").
  -- Use a case-insensitive match and rebuild from the unmatched chunks.
  v_card_name_core := v_card_name;
  IF v_set_name IS NOT NULL AND v_card_name IS NOT NULL
     AND position(lower(v_set_name) IN lower(v_card_name)) > 0 THEN
    v_card_name_core := TRIM(BOTH ' ' FROM regexp_replace(
      v_card_name,
      regexp_replace(v_set_name, '([().+*?\[\]{}|^$\\])', '\\\1', 'g'),
      '',
      'gi'
    ));
  END IF;

  -- If grade already begins with the grading_company (case-insensitive), use
  -- it as-is — avoid "PSA PSA 10". Otherwise prepend the grader.
  v_grade_display := NULL;
  IF v_grade IS NOT NULL THEN
    IF lower(v_grade) LIKE lower(v_grading_company) || '%' THEN
      v_grade_display := v_grade;
    ELSE
      v_grade_display := v_grading_company || ' ' || v_grade;
    END IF;
  END IF;

  -- Only include year as a standalone prefix when setName is null OR setName
  -- doesn't already begin with that year. Card Hedge's setName typically leads
  -- with the year (e.g. "2016 Pokemon XY Evolutions", "1952 Topps"), so this
  -- avoids emitting "1952 1952 Topps ...".
  IF v_year IS NULL THEN
    v_year_piece := NULL;
  ELSIF v_set_name IS NULL OR position(v_year IN v_set_name) <> 1 THEN
    v_year_piece := v_year;
  ELSE
    v_year_piece := NULL;
  END IF;

  v_title := TRIM(BOTH ' ' FROM
    CONCAT_WS(' ',
      v_year_piece,
      v_set_name,
      NULLIF(v_card_name_core, ''),
      CASE
        WHEN NULLIF(p_input->>'cardNumber', '') IS NOT NULL
          THEN '#' || (p_input->>'cardNumber')
        ELSE NULL
      END,
      -- Drop the variant label when it's "Base" (Card Hedge's default non-variant).
      CASE
        WHEN v_variant IS NOT NULL AND lower(v_variant) <> 'base'
          THEN '(' || v_variant || ')'
        ELSE NULL
      END,
      v_grade_display
    )
  );

  -- Collapse accidental double-spaces introduced by stripping.
  v_title := regexp_replace(v_title, '\s+', ' ', 'g');

  -- ---- Step 1: upsert card_catalog ------------------------------------
  INSERT INTO card_catalog (
    card_hedge_id, card_name, grade, grading_company,
    player_name, year, set_name, card_number, variant,
    card_hedge_category, category_group, category_code,
    is_rookie, image_url,
    api_price, api_price_available, api_price_updated_at,
    card_hedge_metadata
  ) VALUES (
    p_input->>'cardHedgeId',
    p_input->>'cardName',
    p_input->>'grade',
    v_grading_company,
    NULLIF(p_input->>'playerName', ''),
    NULLIF(p_input->>'year', '')::int,
    NULLIF(p_input->>'setName', ''),
    NULLIF(p_input->>'cardNumber', ''),
    NULLIF(p_input->>'variant', ''),
    NULLIF(p_input->>'cardHedgeCategory', ''),
    NULLIF(p_input->>'categoryGroup', ''),
    NULLIF(p_input->>'categoryCode', ''),
    COALESCE((p_input->>'isRookie')::boolean, false),
    NULLIF(p_input->>'imageUrl', ''),
    v_api_price,
    COALESCE((p_input->>'apiPriceAvailable')::boolean, v_api_price IS NOT NULL),
    CASE WHEN v_api_price IS NOT NULL THEN now() ELSE NULL END,
    p_input->'cardHedgeMetadata'
  )
  ON CONFLICT (card_hedge_id, grade) DO UPDATE SET
    card_name           = EXCLUDED.card_name,
    grading_company     = COALESCE(EXCLUDED.grading_company, card_catalog.grading_company),
    player_name         = COALESCE(EXCLUDED.player_name, card_catalog.player_name),
    year                = COALESCE(EXCLUDED.year, card_catalog.year),
    set_name            = COALESCE(EXCLUDED.set_name, card_catalog.set_name),
    card_number         = COALESCE(EXCLUDED.card_number, card_catalog.card_number),
    variant             = COALESCE(EXCLUDED.variant, card_catalog.variant),
    card_hedge_category = COALESCE(EXCLUDED.card_hedge_category, card_catalog.card_hedge_category),
    category_group      = COALESCE(EXCLUDED.category_group, card_catalog.category_group),
    category_code       = COALESCE(EXCLUDED.category_code, card_catalog.category_code),
    is_rookie           = EXCLUDED.is_rookie,
    image_url           = COALESCE(EXCLUDED.image_url, card_catalog.image_url),
    api_price           = COALESCE(EXCLUDED.api_price, card_catalog.api_price),
    api_price_available = EXCLUDED.api_price_available OR card_catalog.api_price_available,
    api_price_updated_at = CASE
      WHEN EXCLUDED.api_price IS NOT NULL THEN now()
      ELSE card_catalog.api_price_updated_at
    END,
    card_hedge_metadata = COALESCE(EXCLUDED.card_hedge_metadata, card_catalog.card_hedge_metadata),
    updated_at          = now()
  RETURNING id INTO v_card_catalog_id;

  -- ---- Step 2: insert collectibles ------------------------------------
  v_collectible_id := gen_random_uuid()::text;

  INSERT INTO collectibles (
    id, user_id, title, photos, category, subcategory,
    collectible_type, privacy, visibility, tags,
    available_for_sale, available_for_trade, value,
    created_at, updated_at
  ) VALUES (
    v_collectible_id,
    p_user_id,
    v_title,
    v_photos,
    COALESCE(
      NULLIF(p_input->>'categoryCode', ''),
      NULLIF(p_input->>'categoryGroup', ''),
      'trading_cards'
    ),
    'trading_card',
    'trading_card'::collectible_type,
    'public',
    COALESCE(NULLIF(p_input->>'visibility', ''), 'public'),
    v_tags,
    COALESCE((p_input->>'availableForSale')::boolean, false),
    COALESCE((p_input->>'availableForTrade')::boolean, false),
    v_effective_price,
    now(), now()
  );

  -- ---- Step 3: insert trading_card_details ----------------------------
  INSERT INTO trading_card_details (
    collectible_id, card_catalog_id,
    pricing_mode, margin_percentage, manual_price, effective_price,
    certificate_number
  ) VALUES (
    v_collectible_id, v_card_catalog_id,
    v_pricing_mode, v_margin, v_manual_price, v_effective_price,
    NULLIF(p_input->>'certificateNumber', '')
  )
  RETURNING id INTO v_details_id;

  -- ---- Step 4: optional showcase assignment ---------------------------
  IF v_showcase_id IS NOT NULL THEN
    SELECT COALESCE(MAX(display_order), -1) + 1
      INTO v_next_order
      FROM showcase_collectibles
      WHERE showcase_id = v_showcase_id;

    INSERT INTO showcase_collectibles (id, showcase_id, collectible_id, display_order)
    VALUES (gen_random_uuid()::text, v_showcase_id, v_collectible_id, v_next_order);
  END IF;

  RETURN jsonb_build_object(
    'collectibleId',  v_collectible_id,
    'cardCatalogId',  v_card_catalog_id,
    'detailsId',      v_details_id,
    'effectivePrice', v_effective_price,
    'pricingMode',    v_pricing_mode,
    'title',          v_title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_trading_card(text, jsonb) TO service_role;
