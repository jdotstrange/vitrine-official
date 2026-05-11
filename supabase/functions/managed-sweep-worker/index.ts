/**
 * managed-sweep-worker — cron-driven re-evaluator for managed showcases.
 *
 * Two modes (via ?mode= query param):
 *
 *   incremental (every 5 minutes):
 *     Re-evaluates managed showcases whose owner's
 *     `collectibles_last_changed_at > showcases.rules_last_evaluated_at`.
 *     Most runs do zero work.
 *
 *   full (nightly at 03:15 UTC):
 *     Re-evaluates every managed showcase regardless of watermark.
 *     Drift correction.
 *
 * Auth: CRON_SECRET via Authorization header (same pattern as other workers).
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

interface ShowcaseRow {
  id: string;
  user_id: string;
  rules: unknown;
  rules_match: string | null;
  rules_last_evaluated_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "incremental";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const startedAt = Date.now();
  let showcasesProcessed = 0;
  let totalAdded = 0;
  let totalRemoved = 0;

  // ── 1. Find managed showcases to re-evaluate ──────────────────────────
  let showcases: ShowcaseRow[] = [];

  if (mode === "full") {
    const { data, error } = await admin
      .from("showcases")
      .select("id, user_id, rules, rules_match, rules_last_evaluated_at")
      .eq("type", "managed")
      .not("rules", "is", null);

    if (error) {
      console.error("Full sweep showcase fetch failed:", error.message);
      return new Response(
        JSON.stringify({ error: "showcase fetch failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    showcases = (data ?? []) as ShowcaseRow[];
  } else {
    // Incremental: find managed showcases whose owner's collection changed
    // after the showcase was last evaluated.
    //
    // Strategy: load all managed showcases (typically a small set in V1),
    // then batch-check their owners' watermarks. An RPC would be cleaner
    // at scale but this keeps V1 simple.
    const { data: managed, error: mErr } = await admin
      .from("showcases")
      .select("id, user_id, rules, rules_match, rules_last_evaluated_at")
      .eq("type", "managed")
      .not("rules", "is", null);

    if (mErr) {
      console.error("Incremental showcase fetch failed:", mErr.message);
      return new Response(
        JSON.stringify({ error: "showcase fetch failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (managed && managed.length > 0) {
      const ownerIds = [...new Set(managed.map((s: ShowcaseRow) => s.user_id))];

      const { data: owners, error: oErr } = await admin
        .from("users")
        .select("id, collectibles_last_changed_at")
        .in("id", ownerIds);

      if (oErr) {
        console.error("Owner watermark fetch failed:", oErr.message);
      }

      const ownerWatermark = new Map<string, string | null>();
      for (const o of owners ?? []) {
        ownerWatermark.set(
          o.id,
          o.collectibles_last_changed_at ?? null,
        );
      }

      showcases = (managed as ShowcaseRow[]).filter((s) => {
        const changed = ownerWatermark.get(s.user_id);
        if (!changed) return false;
        const lastEval = s.rules_last_evaluated_at;
        if (!lastEval) return true;
        return new Date(changed) > new Date(lastEval);
      });
    }
  }

  if (showcases.length === 0) {
    const elapsed = Date.now() - startedAt;
    console.log(
      `managed-sweep-worker [${mode}]: nothing to do (${elapsed}ms)`,
    );
    return new Response(
      JSON.stringify({
        mode,
        processed: 0,
        added: 0,
        removed: 0,
        elapsed_ms: elapsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── 2. Group showcases by owner for batch efficiency ──────────────────
  const byOwner = new Map<string, ShowcaseRow[]>();
  for (const s of showcases) {
    const existing = byOwner.get(s.user_id) ?? [];
    existing.push(s);
    byOwner.set(s.user_id, existing);
  }

  // ── 3. Process each owner's showcases ─────────────────────────────────
  for (const [userId, ownerShowcases] of byOwner) {
    const { data: rawRows, error: cErr } = await admin
      .from("collectibles")
      .select(
        "id, collectible_type, listing_title, title, value, available_for_sale, available_for_trade, traits, tags, filter_traits",
      )
      .eq("user_id", userId);

    if (cErr) {
      console.error(
        `Collectibles fetch for user ${userId} failed:`,
        cErr.message,
      );
      for (const s of ownerShowcases) {
        await admin
          .from("showcases")
          .update({
            rules_last_evaluated_at: new Date().toISOString(),
            rules_last_evaluation_status: `error:collectibles_fetch`,
          })
          .eq("id", s.id);
      }
      continue;
    }

    const evalItems = ((rawRows ?? []) as DbCollectibleRow[]).map(
      evalRowFromDbRow,
    );

    for (const showcase of ownerShowcases) {
      const rules: ManagedRules = {
        match: (showcase.rules_match as "all" | "any") ?? "all",
        conditions: Array.isArray(showcase.rules) ? showcase.rules : [],
      };

      if (rules.conditions.length === 0) {
        showcasesProcessed++;
        continue;
      }

      const { matchingIds } = evaluateManagedRules(evalItems, rules);
      const matchingSet = new Set(matchingIds);

      // Load current junction
      const { data: currentJunction, error: jnErr } = await admin
        .from("showcase_collectibles")
        .select("id, collectible_id")
        .eq("showcase_id", showcase.id);

      if (jnErr) {
        console.error(
          `Junction fetch for showcase ${showcase.id} failed:`,
          jnErr.message,
        );
        await admin
          .from("showcases")
          .update({
            rules_last_evaluated_at: new Date().toISOString(),
            rules_last_evaluation_status: `error:junction_fetch`,
          })
          .eq("id", showcase.id);
        showcasesProcessed++;
        continue;
      }

      const currentIds = new Set(
        (currentJunction ?? []).map(
          (r: { collectible_id: string }) => r.collectible_id,
        ),
      );
      const junctionById = new Map(
        (currentJunction ?? []).map(
          (r: { id: string; collectible_id: string }) => [
            r.collectible_id,
            r.id,
          ],
        ),
      );

      const toAdd = matchingIds.filter((id) => !currentIds.has(id));
      const toRemove = [...currentIds].filter(
        (id) => !matchingSet.has(id),
      );

      if (toRemove.length > 0) {
        const removeJunctionIds = toRemove
          .map((cid) => junctionById.get(cid))
          .filter(Boolean) as string[];
        if (removeJunctionIds.length > 0) {
          await admin
            .from("showcase_collectibles")
            .delete()
            .in("id", removeJunctionIds);
        }
      }

      if (toAdd.length > 0) {
        const insertRows = toAdd.map((collectibleId, i) => ({
          id: generateId(),
          showcase_id: showcase.id,
          collectible_id: collectibleId,
          display_order: currentIds.size + i,
        }));
        await admin
          .from("showcase_collectibles")
          .insert(insertRows);
      }

      await admin
        .from("showcases")
        .update({
          rules_last_evaluated_at: new Date().toISOString(),
          rules_last_evaluation_status: "ok",
          updated_at: new Date().toISOString(),
        })
        .eq("id", showcase.id);

      totalAdded += toAdd.length;
      totalRemoved += toRemove.length;
      showcasesProcessed++;
    }
  }

  const elapsed = Date.now() - startedAt;
  console.log(
    `managed-sweep-worker [${mode}]: processed=${showcasesProcessed} added=${totalAdded} removed=${totalRemoved} (${elapsed}ms)`,
  );

  return new Response(
    JSON.stringify({
      mode,
      processed: showcasesProcessed,
      added: totalAdded,
      removed: totalRemoved,
      elapsed_ms: elapsed,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
