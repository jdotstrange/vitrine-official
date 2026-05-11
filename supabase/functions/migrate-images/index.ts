// Migrate collectible images from Firebase Storage to Supabase Storage.
// Null-safe: skips null/undefined photo URLs to avoid "Cannot read properties of null (reading 'includes')".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isFirebaseUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false;
  return url.includes("firebasestorage");
}

function safeString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body?.batch_size) || 50, 1), 100);
    const dryRun = Boolean(body?.dry_run);

    const { data: rows, error: fetchError } = await supabase.rpc("get_firebase_image_collectibles", {
      batch_limit: batchSize,
    });

    if (fetchError) {
      console.error("get_firebase_image_collectibles error:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, migrated: 0, failed: 0, has_more: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let migrated = 0;
    let failed = 0;

    async function processRow(row: { id?: string; photos?: unknown[]; user_id?: string }) {
      const id = safeString(row?.id);
      const userId = safeString(row?.user_id);
      const rawPhotos = row?.photos;
      if (!id || !userId || !Array.isArray(rawPhotos)) return;

      const photos: string[] = [];
      for (let i = 0; i < rawPhotos.length; i++) {
        const p = rawPhotos[i];
        const url = safeString(p);
        if (url) photos.push(url);
      }

      const newUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const url = photos[i];
        if (!url || !isFirebaseUrl(url)) {
          newUrls.push(url ?? "");
          continue;
        }
        if (dryRun) {
          newUrls.push(url);
          continue;
        }
        try {
          const res = await fetch(url, { redirect: "follow" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const ext = (url.split(".").pop()?.replace(/\?.*/, "") || "jpg").slice(0, 4);
          const path = `${userId}/${id}-${i}-${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("collectible-images")
            .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("collectible-images").getPublicUrl(path);
          newUrls.push(urlData.publicUrl);
          migrated++;
        } catch (e) {
          console.error("Migration failed for", id, "photo", i, e);
          newUrls.push(url);
          failed++;
        }
      }

      if (!dryRun && newUrls.length > 0) {
        const { error: updateErr } = await supabase.rpc("update_collectible_photos", {
          p_id: id,
          p_photos: newUrls,
        });
        if (updateErr) {
          console.error("update_collectible_photos error:", updateErr);
          failed++;
        }
      }
    }

    await Promise.all(rows.map(processRow));

    return new Response(
      JSON.stringify({
        processed: rows.length,
        migrated,
        failed,
        has_more: rows.length >= batchSize,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("migrate-images error:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
