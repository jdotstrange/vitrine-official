/**
 * looking-glass-webhook — receives extraction status updates from Looking Glass.
 *
 * Public endpoint (no JWT). Authenticated via HMAC-SHA256 signature using
 * ENGINE_SHARED_SECRET. Looks up the collectible by extraction_job_id and
 * writes results back.
 *
 * On engine status "complete" we set extraction_status to 'extracted' (not
 * 'complete') because 'complete' is reserved for when the user taps
 * "Add to Collection".
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lookingglass-signature",
};

// ---------------------------------------------------------------------------
// HMAC verification
// ---------------------------------------------------------------------------

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const provided = signatureHeader.slice("sha256=".length);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (provided.length !== computed.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ computed.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Engine response → collectibles columns
// ---------------------------------------------------------------------------

function mapEngineResponseToColumns(
  results: Record<string, unknown>,
): Record<string, unknown> {
  const cls = results.classification as {
    rejected?: string | null;
    collectible_type?: string | null;
    type_code?: string | null;
    category_code?: string | null;
    sub_type?: string | null;
    domain?: string | null;
  } | null;

  const isRejected = cls?.rejected != null;

  let classification: string;
  if (!cls) {
    classification = "unknown";
  } else if (isRejected) {
    classification = cls.collectible_type ?? "unknown";
  } else if (cls.collectible_type === "memorabilia") {
    classification = [cls.collectible_type, cls.type_code, cls.category_code]
      .filter(Boolean)
      .join(".");
  } else {
    classification = [cls.collectible_type, cls.sub_type, cls.domain]
      .filter(Boolean)
      .join(".");
  }

  const rawTraits = results.traits as Record<string, boolean> | null;
  const traits = rawTraits
    ? Object.entries(rawTraits)
        .filter(([_, v]) => v === true)
        .map(([k]) => k)
    : [];

  const schemaMeta = results.schema_meta as {
    field_schema?: unknown;
    mode?: string;
  } | null;

  const verification = results.verification as {
    available?: boolean;
    url?: string;
  } | null;

  // Derive category/subcategory from classification path
  const classificationParts = classification.split(".");
  const category = classificationParts[1] ?? null;
  const subcategory = classificationParts[2] ?? null;

  return {
    collectible_type: cls?.collectible_type ?? null,
    classification,
    category,
    subcategory,
    confidence: (results.confidence as string) ?? null,
    traits,
    ai_metadata: results.ai_metadata ?? null,
    trait_metadata: results.trait_metadata ?? null,
    filter_traits: results.filter_traits ?? null,
    listing_title: (results.listing_title as string) ?? null,
    listing_description: (results.listing_description as string) ?? null,
    field_schema: schemaMeta?.field_schema ?? null,
    schema_mode: schemaMeta?.mode ?? null,
    verification_url:
      verification?.available === true ? verification.url ?? null : null,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const secret = Deno.env.get("ENGINE_SHARED_SECRET") ?? "";
  if (!secret) {
    console.error("[webhook] ENGINE_SHARED_SECRET not configured");
    return new Response("Server misconfigured", {
      status: 500,
      headers: corsHeaders,
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("X-LookingGlass-Signature");

  if (!(await verifySignature(rawBody, signature, secret))) {
    return new Response("Invalid signature", {
      status: 401,
      headers: corsHeaders,
    });
  }

  let payload: {
    job_id?: string;
    status?: string;
    results?: Record<string, unknown>;
    error?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { job_id, status, results } = payload;

  if (!job_id || !status) {
    return new Response(
      JSON.stringify({ error: "missing job_id or status" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: row, error: lookupErr } = await admin
    .from("collectibles")
    .select("id, extraction_status")
    .eq("extraction_job_id", job_id)
    .maybeSingle();

  if (lookupErr) {
    console.error("[webhook] lookup failed:", lookupErr.message);
    return new Response("Lookup failed", {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!row) {
    return new Response(
      JSON.stringify({ ignored: true, reason: "unknown_job_id" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Idempotency: never overwrite a terminal state
  const terminalStates = ["complete", "failed", "extracted"];
  if (
    row.extraction_status &&
    terminalStates.includes(row.extraction_status)
  ) {
    return new Response(
      JSON.stringify({ ignored: true, reason: "already_terminal" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();

  if (status === "processing") {
    const { error: upErr } = await admin
      .from("collectibles")
      .update({ extraction_status: "processing", updated_at: now })
      .eq("id", row.id)
      .not("extraction_status", "in", "(extracted,complete,failed)");

    if (upErr) console.error("[webhook] processing update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → processing`);
  } else if (status === "complete" && results) {
    const cols = mapEngineResponseToColumns(results);

    const { error: upErr } = await admin
      .from("collectibles")
      .update({
        extraction_status: "extracted",
        ...cols,
        updated_at: now,
      })
      .eq("id", row.id)
      .not("extraction_status", "in", "(extracted,complete,failed)");

    if (upErr) console.error("[webhook] extracted update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → extracted (${Object.keys(cols).length} columns)`);
  } else if (status === "failed") {
    const { error: upErr } = await admin
      .from("collectibles")
      .update({ extraction_status: "failed", updated_at: now })
      .eq("id", row.id)
      .not("extraction_status", "in", "(extracted,complete,failed)");

    if (upErr) console.error("[webhook] failed update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → failed: ${payload.error ?? "unknown"}`);
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
