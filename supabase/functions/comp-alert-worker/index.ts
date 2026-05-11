/**
 * comp-alert-worker — daily cron worker that surfaces "strong-match"
 * comparable collectibles for items the user is tracking.
 *
 * Trigger: pg_cron daily (see `cron.schedule` migration).
 *
 * Algorithm (per run):
 *   1. Page through `tracked_items` (no Stream feed write happens for
 *      a tracked item whose owner has already maxed their daily cap).
 *   2. For each (user, tracked_collectible) pair, call get_collectible_comps
 *      with limit=30 to get a ranked match list.
 *   3. Keep candidates with score_fraction >= 0.75 (the user-greenlit
 *      "strong match" threshold) AND not already in comp_alert_state.
 *   4. Cap at (5 - alerts_already_fired_today) per user. The cap is
 *      enforced in-memory because this worker is the only writer.
 *   5. Insert dedupe rows into comp_alert_state and POST to stream-notify
 *      with verb 'comp_alert'.
 *
 * Auth: shared secret via Authorization: Bearer <CRON_SECRET>. Set in
 * both the function's env and Supabase Vault so the pg_cron command can
 * read it without leaking the secret into source control.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRONG_MATCH_THRESHOLD = 0.75;
const DAILY_CAP_PER_USER = 5;

interface CompRow {
  id: string;
  title: string;
  image: string | null;
  score_fraction: number;
}

interface TrackedRow {
  user_id: string;
  collectible_id: string;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const startedAt = Date.now();
  let scanned = 0;
  let alertsFired = 0;
  let usersCapped = 0;

  // Load tracked items in batches. tracked_items is small enough that
  // a single query is fine for V1; if it grows past ~50k we should
  // switch to keyset pagination.
  const { data: tracked, error: trackedErr } = await admin
    .from("tracked_items")
    .select("user_id, collectible_id");

  if (trackedErr) {
    console.error("Failed to load tracked_items:", trackedErr);
    return new Response(JSON.stringify({ error: trackedErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Per-user counter for the daily cap. Resets each run because the
  // cron cadence is daily.
  const alertsByUser = new Map<string, number>();

  for (const row of (tracked || []) as TrackedRow[]) {
    scanned++;
    const userAlerts = alertsByUser.get(row.user_id) ?? 0;
    if (userAlerts >= DAILY_CAP_PER_USER) {
      usersCapped++;
      continue;
    }

    const { data: comps, error: compsErr } = await admin.rpc("get_collectible_comps", {
      p_source_id: row.collectible_id,
      p_limit: 30,
    });
    if (compsErr) {
      console.warn(`comps failed for ${row.collectible_id}:`, compsErr.message);
      continue;
    }

    const strong = ((comps || []) as CompRow[])
      .filter((c) => c.id !== row.collectible_id)
      .filter((c) => Number(c.score_fraction) >= STRONG_MATCH_THRESHOLD);
    if (strong.length === 0) continue;

    const ids = strong.map((c) => c.id);
    const { data: alreadyKnown } = await admin
      .from("comp_alert_state")
      .select("surfaced_comp_id")
      .eq("tracked_collectible_id", row.collectible_id)
      .in("surfaced_comp_id", ids);
    const knownSet = new Set((alreadyKnown || []).map((r) => r.surfaced_comp_id));

    const fresh = strong.filter((c) => !knownSet.has(c.id));
    if (fresh.length === 0) continue;

    const remaining = DAILY_CAP_PER_USER - userAlerts;
    const slice = fresh.slice(0, remaining);

    if (slice.length === 0) continue;

    // Pull source collectible metadata once per tracked item so the
    // notification payload can render without an extra client fetch.
    const { data: source } = await admin
      .from("collectibles")
      .select("id, title, primary_image, image_urls")
      .eq("id", row.collectible_id)
      .single();
    const sourceImage =
      source?.primary_image ||
      (Array.isArray(source?.image_urls) ? source!.image_urls[0] : null) ||
      null;

    const dedupeRows = slice.map((c) => ({
      tracked_collectible_id: row.collectible_id,
      surfaced_comp_id: c.id,
    }));
    const { error: insertErr } = await admin
      .from("comp_alert_state")
      .insert(dedupeRows);
    if (insertErr) {
      console.warn(`dedupe insert failed for ${row.collectible_id}:`, insertErr.message);
      continue;
    }

    for (const comp of slice) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/stream-notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            type: "comp_alert",
            recipientIds: [row.user_id],
            // System verb: actor is the tracker themselves so the
            // activity has a valid identity to publish under.
            actorId: row.user_id,
            data: {
              objectType: "collectible",
              collectibleId: row.collectible_id,
              collectibleTitle: source?.title || null,
              collectibleImage: sourceImage,
              compId: comp.id,
              compTitle: comp.title,
              compImage: comp.image,
              compMatchPercent: Math.round(Number(comp.score_fraction) * 100),
            },
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          console.warn(`stream-notify ${res.status}:`, txt.slice(0, 200));
          continue;
        }
        alertsFired++;
        alertsByUser.set(row.user_id, userAlerts + 1);
      } catch (err) {
        console.warn(`stream-notify error:`, err);
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      scanned,
      alertsFired,
      usersCapped,
      durationMs: Date.now() - startedAt,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
