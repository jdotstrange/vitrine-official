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
import {
  mapEngineResponseToColumns,
  mapFailureCodeToReason,
  TERMINAL_STATES,
} from "../_shared/engine-mapping.ts";

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
    outcome?: "extracted" | "rejected";
    rejection_reason?: string | null;
    failure_code?: string;
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
  if (
    row.extraction_status &&
    (TERMINAL_STATES as readonly string[]).includes(row.extraction_status)
  ) {
    return new Response(
      JSON.stringify({ ignored: true, reason: "already_terminal" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();

  // Guard string excludes ALL terminal states so a late webhook never clobbers
  // a row the user has already acted on (or the reconciler already resolved).
  const nonTerminalGuard = `(${TERMINAL_STATES.join(",")})`;

  if (status === "processing") {
    const { error: upErr } = await admin
      .from("collectibles")
      .update({ extraction_status: "processing", updated_at: now })
      .eq("id", row.id)
      .not("extraction_status", "in", nonTerminalGuard);

    if (upErr) console.error("[webhook] processing update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → processing`);
  } else if (status === "complete" && payload.outcome === "rejected") {
    // Engine recognized the input but rejected it (e.g. not a collectible).
    // Terminal: store the reason, do NOT map columns or publish.
    const { error: upErr } = await admin
      .from("collectibles")
      .update({
        extraction_status: "rejected",
        extraction_failure_reason: payload.rejection_reason ?? "content_unclear",
        extraction_failed_at: now,
        updated_at: now,
      })
      .eq("id", row.id)
      .not("extraction_status", "in", nonTerminalGuard);

    if (upErr) console.error("[webhook] rejected update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → rejected: ${payload.rejection_reason ?? "unknown"}`);
  } else if (status === "complete" && results) {
    // Successful extraction. Set 'extracted'; the complete_and_publish trigger
    // promotes single-lane to 'complete' (no publish — client-owned).
    const cols = mapEngineResponseToColumns(results);

    const { error: upErr } = await admin
      .from("collectibles")
      .update({
        extraction_status: "extracted",
        ...cols,
        updated_at: now,
      })
      .eq("id", row.id)
      .not("extraction_status", "in", nonTerminalGuard);

    if (upErr) console.error("[webhook] extracted update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → extracted (${Object.keys(cols).length} columns)`);
  } else if (status === "failed") {
    const { error: upErr } = await admin
      .from("collectibles")
      .update({
        extraction_status: "failed",
        extraction_failure_reason: mapFailureCodeToReason(payload.failure_code),
        extraction_failed_at: now,
        updated_at: now,
      })
      .eq("id", row.id)
      .not("extraction_status", "in", nonTerminalGuard);

    if (upErr) console.error("[webhook] failed update failed:", upErr.message);

    console.log(`[webhook] job=${job_id} → failed: ${payload.failure_code ?? payload.error ?? "unknown"}`);
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
