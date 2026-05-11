/**
 * view-rollup-worker — weekly cron worker that:
 *
 *   1. Recomputes the 7-day view windows on view_counters.
 *   2. Aggregates per-owner totals across collectibles + showcases +
 *      profile and fires `weekly_view_digest` for owners above the
 *      noise floor.
 *   3. Purges recent_views older than 30 days so the dedupe ledger
 *      stays bounded.
 *
 * Why weekly: a daily digest would dilute the perceived signal and
 * train ignore-by-default behavior. A weekly cadence aligns with the
 * Hooked-style "anticipated reward" pattern.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Owners need at least this many 7-day views before we fire a digest.
// Anything lower feels like a vanity ping and trains banner blindness.
const DIGEST_FLOOR = 10;

interface DigestRow {
  owner_id: string;
  total_views_7d: number;
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

  // Step 1: recompute 7-day windows in JS. Pulls every recent view row,
  // buckets by target, applies counters via upsert + zero-out. For V1
  // recent_views is small (anon-only, 30-day TTL) so a single read is
  // cheap. If it grows past ~1M rows we should move the aggregation to
  // a SQL RPC and call that here.
  const { data: aggRows, error: aggErr } = await admin
    .from("recent_views")
    .select("target_type, target_id, viewer_anon_id, viewed_on");
  if (aggErr) {
    console.error("recent_views read failed:", aggErr);
    return new Response(JSON.stringify({ error: aggErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const cutoffDay = cutoff.toISOString().slice(0, 10);

  type Bucket = { count: number; uniques: Set<string> };
  const window7: Map<string, Bucket> = new Map();
  for (const r of aggRows || []) {
    if ((r.viewed_on as string) < cutoffDay) continue;
    const key = `${r.target_type}::${r.target_id}`;
    const b = window7.get(key) ?? { count: 0, uniques: new Set<string>() };
    b.count += 1;
    b.uniques.add(r.viewer_anon_id);
    window7.set(key, b);
  }

  let countersUpdated = 0;

  // First, zero out anything no longer in the window.
  const { data: existingCounters } = await admin
    .from("view_counters")
    .select("target_type, target_id, views_7d, unique_viewers_7d");
  const idleRows = (existingCounters || []).filter((c) => {
    const key = `${c.target_type}::${c.target_id}`;
    return !window7.has(key) && (c.views_7d > 0 || c.unique_viewers_7d > 0);
  });
  for (const c of idleRows) {
    await admin
      .from("view_counters")
      .update({ views_7d: 0, unique_viewers_7d: 0, updated_at: new Date().toISOString() })
      .eq("target_type", c.target_type)
      .eq("target_id", c.target_id);
    countersUpdated++;
  }

  // Then update fresh aggregates.
  for (const [key, b] of window7) {
    const [target_type, target_id] = key.split("::");
    await admin
      .from("view_counters")
      .upsert(
        {
          target_type,
          target_id,
          views_7d: b.count,
          unique_viewers_7d: b.uniques.size,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "target_type,target_id" },
      );
    countersUpdated++;
  }

  // Step 2: per-owner digest aggregation. Resolve target_id -> owner_id
  // for collectibles and showcases; profiles already have user_id == target_id.
  const collectibleIds: string[] = [];
  const showcaseIds: string[] = [];
  for (const [key, b] of window7) {
    if (b.count === 0) continue;
    const [target_type, target_id] = key.split("::");
    if (target_type === "collectible") collectibleIds.push(target_id);
    else if (target_type === "showcase") showcaseIds.push(target_id);
  }

  const ownerByCollectible = new Map<string, string>();
  if (collectibleIds.length > 0) {
    const { data } = await admin
      .from("collectibles")
      .select("id, user_id")
      .in("id", collectibleIds);
    for (const r of data || []) ownerByCollectible.set(r.id, r.user_id);
  }

  const ownerByShowcase = new Map<string, string>();
  if (showcaseIds.length > 0) {
    const { data } = await admin
      .from("showcases")
      .select("id, user_id")
      .in("id", showcaseIds);
    for (const r of data || []) ownerByShowcase.set(r.id, r.user_id);
  }

  const totalsByOwner = new Map<string, number>();
  for (const [key, b] of window7) {
    const [target_type, target_id] = key.split("::");
    let owner: string | undefined;
    if (target_type === "profile") owner = target_id;
    else if (target_type === "collectible") owner = ownerByCollectible.get(target_id);
    else if (target_type === "showcase") owner = ownerByShowcase.get(target_id);
    if (!owner) continue;
    totalsByOwner.set(owner, (totalsByOwner.get(owner) ?? 0) + b.count);
  }

  const digestRows: DigestRow[] = [];
  for (const [owner_id, total_views_7d] of totalsByOwner) {
    if (total_views_7d >= DIGEST_FLOOR) {
      digestRows.push({ owner_id, total_views_7d });
    }
  }

  let digestsFired = 0;
  for (const row of digestRows) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/stream-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          type: "weekly_view_digest",
          recipientIds: [row.owner_id],
          actorId: row.owner_id,
          data: {
            viewCount: row.total_views_7d,
            viewWindow: "7d",
          },
        }),
      });
      if (res.ok) digestsFired++;
      else console.warn(`digest ${res.status}:`, (await res.text()).slice(0, 200));
    } catch (err) {
      console.warn("digest send failed:", err);
    }
  }

  // Step 3: purge anything older than 30 days. The unique constraint
  // means re-recording an old view-day after purge would just create
  // a fresh row, which is fine — the counter was already bumped.
  const purgeCutoff = new Date();
  purgeCutoff.setUTCDate(purgeCutoff.getUTCDate() - 30);
  const purgeCutoffDay = purgeCutoff.toISOString().slice(0, 10);
  const { count: purged } = await admin
    .from("recent_views")
    .delete({ count: "exact" })
    .lt("viewed_on", purgeCutoffDay);

  return new Response(
    JSON.stringify({
      ok: true,
      countersUpdated,
      digestsFired,
      ownersConsidered: totalsByOwner.size,
      purged: purged ?? 0,
      durationMs: Date.now() - startedAt,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
