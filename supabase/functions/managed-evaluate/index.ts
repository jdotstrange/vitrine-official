/**
 * managed-evaluate — immediate evaluation of a managed showcase's rules
 * against the owner's full collectible set.
 *
 * Called synchronously after rule save (create or update). The client blocks
 * on the response so the user sees the new membership reflected immediately.
 *
 * Input:  POST { showcaseId }
 * Output: { matched, added, removed }
 *
 * Auth: Supabase service-role key via Authorization header (same pattern as
 * stream-notify).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  evalRowFromDbRow,
  evaluateManagedRules,
  type DbCollectibleRow,
  type ManagedRules,
} from "../_shared/managed-eval.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateId(): string {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.includes(serviceRoleKey) && auth !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  let body: { showcaseId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const showcaseId = body.showcaseId;
  if (!showcaseId) {
    return new Response(
      JSON.stringify({ error: "showcaseId required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── 1. Load the showcase ────────────────────────────────────────────────
  const { data: showcase, error: scErr } = await admin
    .from("showcases")
    .select("id, user_id, type, rules, rules_match")
    .eq("id", showcaseId)
    .single();

  if (scErr || !showcase) {
    console.error("Showcase lookup failed:", scErr?.message);
    return new Response(
      JSON.stringify({ error: "showcase not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (showcase.type !== "managed") {
    return new Response(
      JSON.stringify({ error: "not a managed showcase" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const rules: ManagedRules = {
    match: showcase.rules_match ?? "all",
    conditions: Array.isArray(showcase.rules) ? showcase.rules : [],
  };

  if (rules.conditions.length === 0) {
    return new Response(
      JSON.stringify({ error: "no rules defined" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── 2. Load owner's collectibles ───────────────────────────────────────
  const { data: rawRows, error: colErr } = await admin
    .from("collectibles")
    .select(
      "id, collectible_type, listing_title, title, value, available_for_sale, available_for_trade, traits, tags, filter_traits",
    )
    .eq("user_id", showcase.user_id);

  if (colErr) {
    console.error("Collectibles fetch failed:", colErr.message);
    return new Response(
      JSON.stringify({ error: "failed to load collectibles" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const evalItems = ((rawRows ?? []) as DbCollectibleRow[]).map(
    evalRowFromDbRow,
  );

  // ── 3. Run the evaluator ───────────────────────────────────────────────
  const { matchingIds } = evaluateManagedRules(evalItems, rules);
  const matchingSet = new Set(matchingIds);

  // ── 4. Diff against current showcase_collectibles ──────────────────────
  const { data: currentJunction, error: jnErr } = await admin
    .from("showcase_collectibles")
    .select("id, collectible_id")
    .eq("showcase_id", showcaseId);

  if (jnErr) {
    console.error("Junction fetch failed:", jnErr.message);
    return new Response(
      JSON.stringify({ error: "failed to load current membership" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const currentIds = new Set(
    (currentJunction ?? []).map(
      (r: { collectible_id: string }) => r.collectible_id,
    ),
  );
  const junctionById = new Map(
    (currentJunction ?? []).map(
      (r: { id: string; collectible_id: string }) => [r.collectible_id, r.id],
    ),
  );

  const toAdd = matchingIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !matchingSet.has(id));

  // ── 5. Apply diff ─────────────────────────────────────────────────────
  if (toRemove.length > 0) {
    const removeJunctionIds = toRemove
      .map((cid) => junctionById.get(cid))
      .filter(Boolean) as string[];
    if (removeJunctionIds.length > 0) {
      const { error: delErr } = await admin
        .from("showcase_collectibles")
        .delete()
        .in("id", removeJunctionIds);
      if (delErr) console.error("Delete failed:", delErr.message);
    }
  }

  if (toAdd.length > 0) {
    const insertRows = toAdd.map((collectibleId, i) => ({
      id: generateId(),
      showcase_id: showcaseId,
      collectible_id: collectibleId,
      display_order: currentIds.size + i,
    }));
    const { error: insErr } = await admin
      .from("showcase_collectibles")
      .insert(insertRows);
    if (insErr) console.error("Insert failed:", insErr.message);
  }

  // ── 6. Update evaluation watermark ────────────────────────────────────
  const { error: upErr } = await admin
    .from("showcases")
    .update({
      rules_last_evaluated_at: new Date().toISOString(),
      rules_last_evaluation_status: "ok",
      updated_at: new Date().toISOString(),
    })
    .eq("id", showcaseId);

  if (upErr) console.error("Watermark update failed:", upErr.message);

  console.log(
    `managed-evaluate: showcase=${showcaseId} matched=${matchingIds.length} added=${toAdd.length} removed=${toRemove.length}`,
  );

  return new Response(
    JSON.stringify({
      matched: matchingIds.length,
      added: toAdd.length,
      removed: toRemove.length,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
