// trading-cards edge function
//
// Actions:
//   search          - proxy to Card Hedge search (legacy; prefer card-hedge-proxy)
//   details         - proxy to Card Hedge card details (legacy; prefer card-hedge-proxy)
//   create          - create a trading card listing (RPC: create_trading_card)
//   get             - fetch single listing (joins catalog + details)
//   list            - list authenticated user's trading cards
//   update-pricing  - change pricing mode/margin/manual (RPC: update_trading_card_pricing)
//   delete          - delete a listing (cascades to details + showcase_collectibles)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CARD_HEDGE_BASE_URL = "https://api.cardhedger.com";
const CARD_HEDGE_API_KEY = Deno.env.get("CARD_HEDGE_API_KEY") || "";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400, detail?: unknown): Response {
  const body: Record<string, unknown> = { error: message };
  if (detail !== undefined) body.detail = detail;
  return jsonResponse(body, status);
}

// Map PL/pgSQL raised exceptions to HTTP status codes + user-facing messages.
function mapPgError(error: { message?: string; code?: string; details?: string } | null): {
  status: number;
  message: string;
} {
  if (!error) return { status: 500, message: "unknown error" };
  const raw = String(error.message || "").toLowerCase();

  if (raw.includes("invalid_pricing_mode")) return { status: 400, message: "Invalid pricing mode" };
  if (raw.includes("margin_required_for_dynamic_margin"))
    return { status: 400, message: "marginPercentage is required when pricingMode=dynamic_margin" };
  if (raw.includes("manual_price_required_and_positive"))
    return { status: 400, message: "manualPrice must be > 0 when pricingMode=manual" };
  if (raw.includes("photos_required")) return { status: 400, message: "At least one photo is required" };
  if (raw.includes("showcase_not_found_or_not_owned"))
    return { status: 404, message: "Showcase not found or not owned by user" };
  if (raw.includes("trading_card_not_found")) return { status: 404, message: "Trading card not found" };
  if (raw.includes("not_owner")) return { status: 403, message: "Not authorized to modify this listing" };
  if (raw.includes("margin_percentage_check"))
    return { status: 400, message: "marginPercentage must be >= -99 and not equal to 0" };
  if (raw.includes("duplicate key") && raw.includes("trading_card_details_unique_collectible"))
    return { status: 409, message: "A trading card listing already exists for this collectible" };

  return { status: 500, message: error.message || "Internal error" };
}

// ------------------------------------------------------------------
// Card Hedge proxy helpers (legacy search/details actions)
// ------------------------------------------------------------------

async function searchCardHedge(query: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({ q: query, ...filters });
  const url = `${CARD_HEDGE_BASE_URL}/v1/search?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CARD_HEDGE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.text();
    console.error("Card Hedge API error:", error);
    throw new Error(`Card Hedge API error: ${response.status}`);
  }
  return response.json();
}

async function getCardDetailsUpstream(cardId: string) {
  const url = `${CARD_HEDGE_BASE_URL}/v1/cards/${cardId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CARD_HEDGE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`Card Hedge API error: ${response.status}`);
  return response.json();
}

// ------------------------------------------------------------------
// Action handlers
// ------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type AnyClient = any;

// status: ListingStatus enum on client → (available_for_sale, available_for_trade) tuple
function mapStatusToBooleans(status: unknown): { availableForSale: boolean; availableForTrade: boolean } {
  switch (status) {
    case "FOR_SALE":
      return { availableForSale: true, availableForTrade: false };
    case "FOR_TRADE":
      return { availableForSale: false, availableForTrade: true };
    case "SELL_TRADE":
      return { availableForSale: true, availableForTrade: true };
    case "NFST":
    default:
      return { availableForSale: false, availableForTrade: false };
  }
}

// Sanitize tag input: lowercase, trim, alphanumeric+dash, dedupe, max 20.
function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    if (typeof t !== "string") continue;
    const cleaned = t.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (!cleaned || cleaned.length > 40) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 20) break;
  }
  return out;
}

async function handleCreate(supabaseAdmin: AnyClient, publicUserId: string, body: Record<string, unknown>) {
  // --- Pre-flight validation of required fields ---
  const required = ["cardHedgeId", "cardName", "grade", "pricingMode"];
  for (const k of required) {
    if (!body[k] || typeof body[k] !== "string") {
      return errorResponse(`Missing required field: ${k}`, 400);
    }
  }
  if (!Array.isArray(body.photos) || body.photos.length === 0) {
    return errorResponse("At least one photo is required", 400);
  }

  // --- Status → booleans (client sends status OR the two booleans directly) ---
  const statusBooleans = body.status !== undefined
    ? mapStatusToBooleans(body.status)
    : {
        availableForSale: body.availableForSale === true,
        availableForTrade: body.availableForTrade === true,
      };

  // --- Assemble RPC input ---
  const rpcInput = {
    cardHedgeId: body.cardHedgeId,
    cardName: body.cardName,
    grade: body.grade,
    gradingCompany: body.gradingCompany,
    playerName: body.playerName,
    year: body.year,
    setName: body.setName,
    cardNumber: body.cardNumber,
    variant: body.variant,
    cardHedgeCategory: body.cardHedgeCategory,
    categoryGroup: body.categoryGroup,
    categoryCode: body.categoryCode,
    isRookie: body.isRookie,
    imageUrl: body.imageUrl,
    apiPrice: body.apiPrice,
    apiPriceAvailable: body.apiPriceAvailable,
    cardHedgeMetadata: body.cardHedgeMetadata,
    photos: body.photos,
    pricingMode: body.pricingMode,
    marginPercentage: body.marginPercentage,
    manualPrice: body.manualPrice,
    certificateNumber: body.certificateNumber,
    tags: sanitizeTags(body.tags),
    showcaseId: body.showcaseId,
    visibility: body.visibility,
    availableForSale: statusBooleans.availableForSale,
    availableForTrade: statusBooleans.availableForTrade,
  };

  const { data, error } = await supabaseAdmin.rpc("create_trading_card", {
    p_user_id: publicUserId,
    p_input: rpcInput,
  });

  if (error) {
    console.error("create_trading_card RPC error:", error);
    const mapped = mapPgError(error);
    return errorResponse(mapped.message, mapped.status, { code: error.code });
  }

  return jsonResponse({
    collectibleId: data.collectibleId,
    cardCatalogId: data.cardCatalogId,
    effectivePrice: Number(data.effectivePrice),
    pricingMode: data.pricingMode,
    title: data.title,
  });
}

async function handleGet(supabaseAdmin: AnyClient, publicUserId: string, body: Record<string, unknown>) {
  const collectibleId = body.collectibleId;
  if (typeof collectibleId !== "string" || !collectibleId) {
    return errorResponse("collectibleId is required", 400);
  }

  // Three explicit queries instead of one nested PostgREST embed:
  // embeds were returning obscure 500s (likely missing relationship metadata in
  // the cached schema), and splitting them makes failure modes observable.
  const { data: c, error: cErr } = await supabaseAdmin
    .from("collectibles")
    .select(
      `id, user_id, title, description, photos, category, subcategory,
       privacy, visibility, tags, available_for_sale, available_for_trade,
       value, collectible_type, created_at, updated_at`
    )
    .eq("id", collectibleId)
    .eq("collectible_type", "trading_card")
    .maybeSingle();

  if (cErr) {
    console.error("get collectibles error:", cErr);
    return errorResponse(cErr.message, 500, { code: cErr.code, hint: cErr.hint, details: cErr.details });
  }
  if (!c) return errorResponse("Trading card not found", 404);

  if (c.user_id !== publicUserId && c.visibility !== "public") {
    return errorResponse("Trading card not found", 404);
  }

  const { data: details, error: dErr } = await supabaseAdmin
    .from("trading_card_details")
    .select(
      `id, card_catalog_id, pricing_mode, margin_percentage, manual_price,
       effective_price, certificate_number`
    )
    .eq("collectible_id", collectibleId)
    .maybeSingle();

  if (dErr) {
    console.error("get trading_card_details error:", dErr);
    return errorResponse(dErr.message, 500, { code: dErr.code, hint: dErr.hint, details: dErr.details });
  }
  if (!details) return errorResponse("Trading card not found", 404);

  const { data: catalog, error: ccErr } = await supabaseAdmin
    .from("card_catalog")
    .select(
      `id, card_hedge_id, card_name, player_name, year, set_name,
       card_number, variant, grade, grading_company,
       card_hedge_category, category_group, category_code,
       is_rookie, image_url, api_price, api_price_available, api_price_updated_at,
       sales_7day, sales_30day, gain_7day, gain_30day`
    )
    .eq("id", details.card_catalog_id)
    .maybeSingle();

  if (ccErr) {
    console.error("get card_catalog error:", ccErr);
    return errorResponse(ccErr.message, 500, { code: ccErr.code, hint: ccErr.hint, details: ccErr.details });
  }

  const tradingCardDetails = {
    id: details.id,
    pricing_mode: details.pricing_mode,
    margin_percentage: details.margin_percentage,
    manual_price: details.manual_price,
    effective_price: details.effective_price,
    certificate_number: details.certificate_number,
    card_catalog: catalog,
  };

  return jsonResponse({
    tradingCard: {
      ...c,
      trading_card_details: tradingCardDetails,
    },
  });
}

async function handleList(supabaseAdmin: AnyClient, publicUserId: string, body: Record<string, unknown>) {
  const limitRaw = Number(body.limit ?? 20);
  const offsetRaw = Number(body.offset ?? 0);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);
  const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

  const { data: rows, error, count } = await supabaseAdmin
    .from("collectibles")
    .select(
      `id, user_id, title, description, photos, category, subcategory,
       privacy, visibility, tags, available_for_sale, available_for_trade,
       value, collectible_type, created_at, updated_at`,
      { count: "exact" }
    )
    .eq("user_id", publicUserId)
    .eq("collectible_type", "trading_card")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("list collectibles error:", error);
    return errorResponse(error.message, 500, { code: error.code });
  }

  const ids = (rows ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return jsonResponse({ tradingCards: [], total: count ?? 0 });

  const { data: detailRows, error: dErr } = await supabaseAdmin
    .from("trading_card_details")
    .select(
      `id, collectible_id, card_catalog_id, pricing_mode, margin_percentage,
       manual_price, effective_price, certificate_number`
    )
    .in("collectible_id", ids);

  if (dErr) {
    console.error("list trading_card_details error:", dErr);
    return errorResponse(dErr.message, 500, { code: dErr.code });
  }

  const catalogIds = Array.from(
    new Set((detailRows ?? []).map((d: { card_catalog_id: string }) => d.card_catalog_id).filter(Boolean))
  );
  const catalogById: Record<string, unknown> = {};
  if (catalogIds.length > 0) {
    const { data: catalogRows, error: ccErr } = await supabaseAdmin
      .from("card_catalog")
      .select(
        `id, card_hedge_id, card_name, player_name, year, set_name,
         card_number, variant, grade, grading_company,
         card_hedge_category, category_group, category_code,
         is_rookie, image_url, api_price, api_price_available, api_price_updated_at,
         sales_7day, sales_30day, gain_7day, gain_30day`
      )
      .in("id", catalogIds);

    if (ccErr) {
      console.error("list card_catalog error:", ccErr);
      return errorResponse(ccErr.message, 500, { code: ccErr.code });
    }
    for (const c of catalogRows ?? []) {
      catalogById[(c as { id: string }).id] = c;
    }
  }

  const detailByCollectible: Record<string, Record<string, unknown>> = {};
  for (const d of (detailRows ?? []) as Record<string, unknown>[]) {
    detailByCollectible[d.collectible_id as string] = {
      id: d.id,
      pricing_mode: d.pricing_mode,
      margin_percentage: d.margin_percentage,
      manual_price: d.manual_price,
      effective_price: d.effective_price,
      certificate_number: d.certificate_number,
      card_catalog: catalogById[d.card_catalog_id as string] ?? null,
    };
  }

  const tradingCards = (rows ?? [])
    .map((row: { id: string } & Record<string, unknown>) => {
      const details = detailByCollectible[row.id];
      if (!details) return null;
      return { ...row, trading_card_details: details };
    })
    .filter(Boolean);

  return jsonResponse({ tradingCards, total: count ?? tradingCards.length });
}

async function handleUpdatePricing(
  supabaseAdmin: AnyClient,
  publicUserId: string,
  body: Record<string, unknown>,
) {
  const collectibleId = body.collectibleId;
  const pricingMode = body.pricingMode;
  if (typeof collectibleId !== "string" || !collectibleId) {
    return errorResponse("collectibleId is required", 400);
  }
  if (typeof pricingMode !== "string") {
    return errorResponse("pricingMode is required", 400);
  }

  const marginPercentage =
    body.marginPercentage === undefined || body.marginPercentage === null || body.marginPercentage === ""
      ? null
      : Number(body.marginPercentage);
  const manualPrice =
    body.manualPrice === undefined || body.manualPrice === null || body.manualPrice === ""
      ? null
      : Number(body.manualPrice);

  const { data, error } = await supabaseAdmin.rpc("update_trading_card_pricing", {
    p_user_id: publicUserId,
    p_collectible_id: collectibleId,
    p_pricing_mode: pricingMode,
    p_margin_percentage: marginPercentage,
    p_manual_price: manualPrice,
  });

  if (error) {
    console.error("update_trading_card_pricing RPC error:", error);
    const mapped = mapPgError(error);
    return errorResponse(mapped.message, mapped.status, { code: error.code });
  }

  return jsonResponse({
    collectibleId: data.collectibleId,
    pricingMode: data.pricingMode,
    effectivePrice: Number(data.effectivePrice),
  });
}

async function handleDelete(supabaseAdmin: AnyClient, publicUserId: string, body: Record<string, unknown>) {
  const collectibleId = body.collectibleId;
  if (typeof collectibleId !== "string" || !collectibleId) {
    return errorResponse("collectibleId is required", 400);
  }

  // Verify ownership before delete (RLS would handle this via user client, but we use admin).
  const { data: owner, error: ownerErr } = await supabaseAdmin
    .from("collectibles")
    .select("user_id")
    .eq("id", collectibleId)
    .eq("collectible_type", "trading_card")
    .maybeSingle();

  if (ownerErr) {
    console.error("delete ownership check error:", ownerErr);
    return errorResponse(ownerErr.message, 500);
  }
  if (!owner) return errorResponse("Trading card not found", 404);
  if (owner.user_id !== publicUserId) return errorResponse("Not authorized to delete this listing", 403);

  // trading_card_details.collectible_id_fkey ON DELETE CASCADE handles that row.
  // showcase_collectibles.collectible_id_fkey ON DELETE CASCADE handles junctions.
  const { error: delErr } = await supabaseAdmin.from("collectibles").delete().eq("id", collectibleId);
  if (delErr) {
    console.error("delete error:", delErr);
    return errorResponse(delErr.message, 500);
  }

  return jsonResponse({ success: true });
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // collectibles.user_id references public.users(id), not auth.users(id).
    const { data: publicUser, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("supabase_auth_id", user.id)
      .single();
    if (userErr || !publicUser) return errorResponse("User profile not found", 404);
    const publicUserId = publicUser.id as string;

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Parse body for POST actions
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      const text = await req.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          return errorResponse("Invalid JSON body", 400);
        }
      }
    }

    switch (action) {
      case "search": {
        const query = url.searchParams.get("q") || "";
        const category = url.searchParams.get("category");
        const grading = url.searchParams.get("grading");
        const year = url.searchParams.get("year");
        if (!query || query.length < 2) return errorResponse("Query must be at least 2 characters", 400);
        const filters: Record<string, string> = {};
        if (category) filters.category = category;
        if (grading) filters.grading = grading;
        if (year) filters.year = year;
        try {
          const results = await searchCardHedge(query, filters);
          // deno-lint-ignore no-explicit-any
          const cards = (results.data || results.cards || []).map((card: any) => ({
            card_hedge_id: card.id || card.card_id,
            card_name: card.name || card.card_name,
            player_name: card.player || card.player_name,
            year: card.year,
            set_name: card.set || card.set_name,
            card_number: card.number || card.card_number,
            variant: card.variant || card.parallel,
            grade: card.grade,
            grading_company: card.grading_company || card.grader,
            category: card.category || card.sport,
            is_rookie: card.is_rookie || false,
            image_url: card.image_url || card.image,
            market_price: card.price || card.market_price || card.value,
            price_available: !!(card.price || card.market_price || card.value),
          }));
          return jsonResponse({ cards, total: results.total || cards.length });
        } catch (err) {
          console.error("Search error:", err);
          return jsonResponse({ cards: [], total: 0, error: "Search temporarily unavailable" });
        }
      }

      case "details": {
        const cardId = url.searchParams.get("card_id");
        if (!cardId) return errorResponse("card_id is required", 400);
        try {
          const details = await getCardDetailsUpstream(cardId);
          return jsonResponse({ card: details });
        } catch (err) {
          console.error("Details error:", err);
          return errorResponse("Card details unavailable", 500);
        }
      }

      case "create":
        return await handleCreate(supabaseAdmin, publicUserId, body);
      case "get":
        return await handleGet(supabaseAdmin, publicUserId, body);
      case "list":
        return await handleList(supabaseAdmin, publicUserId, body);
      case "update-pricing":
        return await handleUpdatePricing(supabaseAdmin, publicUserId, body);
      case "delete":
        return await handleDelete(supabaseAdmin, publicUserId, body);
      default:
        return errorResponse("Invalid action", 400);
    }
  } catch (err) {
    console.error("trading-cards unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
