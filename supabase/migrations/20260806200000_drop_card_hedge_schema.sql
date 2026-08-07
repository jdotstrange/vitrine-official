-- Card Hedge / trading-card dual-schema purge.
-- Preflight (2026-08-06): trading_card_details=0, card_catalog=2 (orphan),
-- trading_card_price_history=0, collectibles.trading_card=263 (unchanged).
-- Does NOT alter collectible_type values.

-- ─────────────────────────────────────────────────────────────────────────────
-- collectibles_unified — drop Card Hedge joins; keep column shape with NULLs
-- for retired trading-card detail fields so search RPCs stay stable.
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
    c.value AS display_price,
    c.category AS unified_category,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN c.category
        ELSE NULL::text
    END AS memorabilia_category,
    CASE
        WHEN c.collectible_type = 'memorabilia'::text THEN c.subcategory
        ELSE NULL::text
    END AS memorabilia_subcategory,
    NULL::text AS trading_card_details_id,
    NULL::text AS card_catalog_id,
    NULL::pricing_mode AS pricing_mode,
    NULL::integer AS margin_percentage,
    NULL::numeric AS manual_price,
    NULL::text AS certificate_number,
    NULL::text AS card_hedge_id,
    NULL::text AS card_name,
    NULL::text AS player_name,
    NULL::integer AS card_year,
    NULL::text AS set_name,
    NULL::text AS card_number,
    NULL::text AS variant,
    NULL::text AS grade,
    NULL::text AS grading_company,
    NULL::text AS card_hedge_category,
    NULL::text AS category_group,
    NULL::boolean AS is_rookie,
    NULL::text AS card_image_url,
    NULL::numeric AS api_price,
    NULL::boolean AS api_price_available,
    NULL::timestamptz AS api_price_updated_at,
    NULL::integer AS sales_7day,
    NULL::integer AS sales_30day,
    NULL::numeric AS gain_7day,
    NULL::numeric AS gain_30day,
    (((COALESCE(c.listing_title, c.title, ''::text) || ' '::text) || COALESCE(c.description, ''::text)) || ' '::text) || COALESCE(c.category, ''::text) AS search_text,
    c.published_at,
    c.extraction_status
   FROM public.collectibles c;

-- Drop tables first (removes trigger_update_effective_price dependency)
DROP TABLE IF EXISTS public.trading_card_price_history;
DROP TABLE IF EXISTS public.trading_card_details;
DROP TABLE IF EXISTS public.card_catalog;

-- Retire Card Hedge PL/pgSQL surface
DROP FUNCTION IF EXISTS public.create_trading_card(text, jsonb);
DROP FUNCTION IF EXISTS public.update_trading_card_pricing(text, text, text, integer, numeric);
DROP FUNCTION IF EXISTS public.refresh_effective_prices_for_catalog(text);
DROP FUNCTION IF EXISTS public.update_trading_card_effective_price();
