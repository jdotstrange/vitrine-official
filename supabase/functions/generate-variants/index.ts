/**
 * Generate pre-sized image variants for all existing images in Supabase Storage.
 *
 * For each original image in the target buckets, this function uses the
 * Supabase image transform endpoint (/render/image/) to fetch resized
 * versions, then uploads them as static files with a _<width> suffix.
 *
 * After running, getOptimizedUrl() in the client resolves to these static
 * variant files instead of hitting the transform endpoint — eliminating
 * ongoing transformation charges.
 *
 * Invoke: POST with optional { bucket, batch_size, dry_run }
 * - bucket: "collectible-images" | "user-avatars" | "all" (default: "all")
 * - batch_size: max files per bucket to process (default: 100, max: 500)
 * - dry_run: if true, lists what would be processed without uploading
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VARIANT_WIDTHS = [200, 400, 800];
const BUCKETS = ["collectible-images", "user-avatars"];
const VARIANT_SUFFIX_RE = /_(\d+)\.[^.]+$/;

function isVariantFile(name: string): boolean {
  return VARIANT_SUFFIX_RE.test(name);
}

function variantPath(basePath: string, width: number): string {
  const lastDot = basePath.lastIndexOf(".");
  if (lastDot === -1) return `${basePath}_${width}`;
  return `${basePath.slice(0, lastDot)}_${width}${basePath.slice(lastDot)}`;
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
    const targetBucket = body?.bucket || "all";
    const batchSize = Math.min(
      Math.max(Number(body?.batch_size) || 100, 1),
      500
    );
    const dryRun = Boolean(body?.dry_run);

    const bucketsToProcess =
      targetBucket === "all"
        ? BUCKETS
        : BUCKETS.includes(targetBucket)
          ? [targetBucket]
          : [];

    if (bucketsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ error: `Unknown bucket: ${targetBucket}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: Record<
      string,
      { originals: number; variants_created: number; skipped: number; failed: number; errors: string[] }
    > = {};

    for (const bucket of bucketsToProcess) {
      const bucketResult = {
        originals: 0,
        variants_created: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[],
      };
      results[bucket] = bucketResult;

      // List all folders (user IDs) in the bucket
      const { data: folders, error: folderError } = await supabase.storage
        .from(bucket)
        .list("", { limit: 1000 });

      if (folderError) {
        bucketResult.errors.push(`List folders error: ${folderError.message}`);
        continue;
      }

      if (!folders) continue;

      let processed = 0;

      for (const folder of folders) {
        if (processed >= batchSize) break;

        // Each folder is a user ID directory
        const { data: files, error: fileError } = await supabase.storage
          .from(bucket)
          .list(folder.name, { limit: 1000 });

        if (fileError || !files) continue;

        // Filter to originals only (not variant files)
        const originals = files.filter(
          (f) => f.name && !isVariantFile(f.name) && f.metadata?.mimetype?.startsWith("image/")
        );

        for (const file of originals) {
          if (processed >= batchSize) break;

          const filePath = `${folder.name}/${file.name}`;
          bucketResult.originals++;
          processed++;

          // Check which variants already exist
          const existingNames = new Set(files.map((f) => f.name));

          for (const width of VARIANT_WIDTHS) {
            const vFullPath = variantPath(filePath, width);
            const vName = variantPath(file.name, width);

            if (existingNames.has(vName)) {
              bucketResult.skipped++;
              continue;
            }

            if (dryRun) {
              bucketResult.variants_created++;
              continue;
            }

            try {
              // Use the transform endpoint to get the resized version
              const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath, {
                  transform: { width, quality: 75 },
                });

              const transformUrl = urlData.publicUrl;
              const res = await fetch(transformUrl);

              if (!res.ok) {
                throw new Error(`Transform fetch failed: HTTP ${res.status}`);
              }

              const blob = await res.blob();

              const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(vFullPath, blob, {
                  contentType: "image/jpeg",
                  upsert: true,
                });

              if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
              }

              bucketResult.variants_created++;
            } catch (err) {
              bucketResult.failed++;
              const msg = err instanceof Error ? err.message : String(err);
              if (bucketResult.errors.length < 20) {
                bucketResult.errors.push(`${filePath} @${width}: ${msg}`);
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ dry_run: dryRun, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-variants error:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
