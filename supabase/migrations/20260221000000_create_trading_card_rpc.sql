-- create_trading_card: atomic RPC for creating a trading card listing.
--
-- Does 4 writes in a single transaction:
--   1. UPSERT card_catalog keyed on (card_hedge_id, grade, grading_company)
--   2. INSERT collectibles (collectible_type='trading_card')
--   3. INSERT trading_card_details (1:1 with collectibles)
--   4. INSERT showcase_collectibles (optional, only if p_input.showcaseId set)
--
-- effective_price is computed server-side from pricingMode + apiPrice + margin/manual
-- and mirrored to collectibles.value so feeds/sort work.
--
-- Title is derived from catalog fields (never accepted from client) because
-- trading cards have canonical structured names.

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

  -- Photos array (required, min 1)
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
  v_title := TRIM(BOTH ' ' FROM
    CONCAT_WS(' ',
      NULLIF(p_input->>'year', ''),
      NULLIF(p_input->>'setName', ''),
      p_input->>'cardName',
      CASE
        WHEN NULLIF(p_input->>'cardNumber', '') IS NOT NULL
          THEN '#' || (p_input->>'cardNumber')
        ELSE NULL
      END,
      CASE
        WHEN NULLIF(p_input->>'variant', '') IS NOT NULL
          THEN '(' || (p_input->>'variant') || ')'
        ELSE NULL
      END,
      COALESCE(NULLIF(p_input->>'gradingCompany', ''), 'PSA'),
      p_input->>'grade'
    )
  );

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
    COALESCE(NULLIF(p_input->>'gradingCompany', ''), 'PSA'),
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
  -- Unique constraint on card_catalog is (card_hedge_id, grade); grading_company
  -- is tracked via the SET clause on conflict (card_hedge_id is expected to
  -- encode grader in CardHedge's scheme).
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


-- ----------------------------------------------------------------------
-- update_trading_card_pricing: atomic update of pricing mode + effective
-- price on both trading_card_details AND collectibles.value.
-- ----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_trading_card_pricing(
  p_user_id text,
  p_collectible_id text,
  p_pricing_mode text,
  p_margin_percentage int,
  p_manual_price numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pricing_mode pricing_mode;
  v_api_price numeric;
  v_effective_price numeric;
  v_owner text;
BEGIN
  BEGIN
    v_pricing_mode := p_pricing_mode::pricing_mode;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_pricing_mode' USING ERRCODE = '22023';
  END;

  IF v_pricing_mode = 'dynamic_margin' AND p_margin_percentage IS NULL THEN
    RAISE EXCEPTION 'margin_required_for_dynamic_margin' USING ERRCODE = '22023';
  END IF;

  IF v_pricing_mode = 'manual' AND (p_manual_price IS NULL OR p_manual_price <= 0) THEN
    RAISE EXCEPTION 'manual_price_required_and_positive' USING ERRCODE = '22023';
  END IF;

  -- Ownership check + fetch api_price
  SELECT c.user_id, cc.api_price
    INTO v_owner, v_api_price
    FROM collectibles c
    INNER JOIN trading_card_details tcd ON tcd.collectible_id = c.id
    INNER JOIN card_catalog cc ON cc.id = tcd.card_catalog_id
    WHERE c.id = p_collectible_id
      AND c.collectible_type = 'trading_card';

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'trading_card_not_found' USING ERRCODE = '02000';
  END IF;

  IF v_owner <> p_user_id THEN
    RAISE EXCEPTION 'not_owner' USING ERRCODE = '42501';
  END IF;

  -- Recompute effective price
  v_effective_price := CASE v_pricing_mode
    WHEN 'dynamic' THEN COALESCE(v_api_price, 0)
    WHEN 'dynamic_margin' THEN
      CASE WHEN v_api_price IS NOT NULL
        THEN ROUND(v_api_price * (1 + p_margin_percentage::numeric / 100), 2)
        ELSE 0
      END
    WHEN 'manual' THEN p_manual_price
  END;

  UPDATE trading_card_details
     SET pricing_mode      = v_pricing_mode,
         margin_percentage = CASE WHEN v_pricing_mode = 'dynamic_margin' THEN p_margin_percentage ELSE NULL END,
         manual_price      = CASE WHEN v_pricing_mode = 'manual' THEN p_manual_price ELSE NULL END,
         effective_price   = v_effective_price,
         updated_at        = now()
   WHERE collectible_id = p_collectible_id;

  UPDATE collectibles
     SET value      = v_effective_price,
         updated_at = now()
   WHERE id = p_collectible_id;

  RETURN jsonb_build_object(
    'collectibleId',  p_collectible_id,
    'pricingMode',    v_pricing_mode,
    'effectivePrice', v_effective_price
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_trading_card_pricing(text, text, text, int, numeric) TO service_role;
