/**
 * view-milestone-checker — daily cron worker that fires `view_milestone`
 * the first time a target crosses a celebration threshold.
 *
 * Thresholds: 100, 500, 1k, 10k. Each can fire at most once per target,
 * gated by view_counters.last_milestone (which is monotonically updated
 * to the highest threshold ever crossed).
 *
 * Why daily and not on the write path: thresholds are interesting moments
 * not real-time alerts. A 60-minute lag is fine and keeps record_view
 * trivially cheap.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MILESTONES = [100, 500, 1000, 10000] as const;

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

  // Pull every counter that COULD have a fresh milestone — anything
  // whose total_views is at least the lowest threshold AND whose
  // last_milestone is below the maximum.
  const { data: candidates, error: candErr } = await admin
    .from("view_counters")
    .select("target_type, target_id, total_views, last_milestone")
    .gte("total_views", MILESTONES[0])
    .lt("last_milestone", MILESTONES[MILESTONES.length - 1]);

  if (candErr) {
    console.error("counter scan failed:", candErr);
    return new Response(JSON.stringify({ error: candErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fresh: Array<{
    target_type: string;
    target_id: string;
    crossed: number;
  }> = [];
  for (const c of candidates || []) {
    const crossed = MILESTONES.filter((m) => c.total_views >= m && m > c.last_milestone);
    if (crossed.length === 0) continue;
    // Only fire the highest crossed threshold this run — collapsing
    // skipped levels into one notification.
    fresh.push({
      target_type: c.target_type,
      target_id: c.target_id,
      crossed: Math.max(...crossed),
    });
  }

  if (fresh.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, candidatesScanned: candidates?.length ?? 0, fired: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Resolve owners for collectibles + showcases. Profiles use target_id
  // as owner directly.
  const collectibleIds = fresh
    .filter((f) => f.target_type === "collectible")
    .map((f) => f.target_id);
  const showcaseIds = fresh
    .filter((f) => f.target_type === "showcase")
    .map((f) => f.target_id);

  const ownerByCollectible = new Map<string, string>();
  const collectibleMeta = new Map<string, { title: string | null; image: string | null }>();
  if (collectibleIds.length > 0) {
    const { data } = await admin
      .from("collectibles")
      .select("id, user_id, title, primary_image, image_urls")
      .in("id", collectibleIds);
    for (const r of data || []) {
      ownerByCollectible.set(r.id, r.user_id);
      const image =
        r.primary_image ||
        (Array.isArray(r.image_urls) ? r.image_urls[0] : null) ||
        null;
      collectibleMeta.set(r.id, { title: r.title, image });
    }
  }

  const ownerByShowcase = new Map<string, string>();
  const showcaseMeta = new Map<string, { title: string | null }>();
  if (showcaseIds.length > 0) {
    const { data } = await admin
      .from("showcases")
      .select("id, user_id, title")
      .in("id", showcaseIds);
    for (const r of data || []) {
      ownerByShowcase.set(r.id, r.user_id);
      showcaseMeta.set(r.id, { title: r.title });
    }
  }

  let fired = 0;
  for (const f of fresh) {
    let owner: string | undefined;
    if (f.target_type === "profile") owner = f.target_id;
    else if (f.target_type === "collectible") owner = ownerByCollectible.get(f.target_id);
    else if (f.target_type === "showcase") owner = ownerByShowcase.get(f.target_id);
    if (!owner) continue;

    const data: Record<string, unknown> = {
      objectType: f.target_type,
      viewCount: f.crossed,
      viewMilestone: f.crossed,
    };
    if (f.target_type === "collectible") {
      const meta = collectibleMeta.get(f.target_id);
      data.collectibleId = f.target_id;
      data.collectibleTitle = meta?.title ?? null;
      data.collectibleImage = meta?.image ?? null;
    } else if (f.target_type === "showcase") {
      const meta = showcaseMeta.get(f.target_id);
      data.showcaseId = f.target_id;
      data.showcaseTitle = meta?.title ?? null;
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/stream-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          type: "view_milestone",
          recipientIds: [owner],
          actorId: owner,
          data,
        }),
      });
      if (!res.ok) {
        console.warn(`milestone send ${res.status}:`, (await res.text()).slice(0, 200));
        continue;
      }
    } catch (err) {
      console.warn("milestone send failed:", err);
      continue;
    }

    // Mark the milestone as crossed AFTER successful send so a transient
    // failure doesn't permanently swallow the notification.
    await admin
      .from("view_counters")
      .update({ last_milestone: f.crossed, updated_at: new Date().toISOString() })
      .eq("target_type", f.target_type)
      .eq("target_id", f.target_id);
    fired++;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      candidatesScanned: candidates?.length ?? 0,
      fired,
      durationMs: Date.now() - startedAt,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
