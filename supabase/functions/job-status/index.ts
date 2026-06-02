/**
 * job-status — proxy + reconciler between the mobile app and Looking Glass.
 *
 * The mobile app polls this with its user JWT to get the live extraction stage
 * and completion outcome. This function:
 *   1. Validates the caller's JWT (deploy with verify_jwt = true, like
 *      enqueue-extraction).
 *   2. Forwards to the engine GET /job-status?id=<jobId> with the
 *      ENGINE_SHARED_SECRET bearer token (keeps the secret out of the binary).
 *   3. RECONCILES: if the engine reports a terminal state but the app's
 *      collectibles row is still non-terminal (a dropped webhook), it writes
 *      the engine results into the row via the shared mapper — making polling
 *      an independent source of truth, not a "fake backstop".
 *   4. Returns a slim status payload; mapped item data reaches the client via
 *      the collectibles Realtime subscription.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  mapEngineResponseToColumns,
  mapFailureCodeToReason,
  TERMINAL_STATES,
} from "../_shared/engine-mapping.ts";

const ENGINE_JOB_STATUS_URL =
  "https://nhshzyktaarbknzpsvtr.supabase.co/functions/v1/job-status";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface EngineStatus {
  job_id?: string;
  status?: "queued" | "processing" | "complete" | "failed";
  stage?: string | null;
  outcome?: "extracted" | "rejected" | null;
  rejection_reason?: string | null;
  failure_code?: string | null;
  results?: Record<string, unknown> | null;
  error?: string | null;
  position?: number;
  eta_seconds?: number;
}

/**
 * Reconcile the app's collectibles row from an engine terminal response. Mirrors
 * the looking-glass-webhook receiver, honoring the same terminal-state guard so
 * it can never double-resolve or clobber user action.
 */
async function reconcile(
  admin: ReturnType<typeof createClient>,
  jobId: string,
  engine: EngineStatus,
): Promise<void> {
  if (engine.status !== "complete" && engine.status !== "failed") return;

  const { data: row } = await admin
    .from("collectibles")
    .select("id, extraction_status")
    .eq("extraction_job_id", jobId)
    .maybeSingle();

  if (!row) return;
  if (
    row.extraction_status &&
    (TERMINAL_STATES as readonly string[]).includes(row.extraction_status)
  ) {
    return; // already terminal — nothing to reconcile
  }

  const now = new Date().toISOString();
  const guard = `(${TERMINAL_STATES.join(",")})`;

  if (engine.status === "complete" && engine.outcome === "rejected") {
    await admin
      .from("collectibles")
      .update({
        extraction_status: "rejected",
        extraction_failure_reason: engine.rejection_reason ?? "content_unclear",
        extraction_failed_at: now,
        updated_at: now,
      })
      .eq("id", row.id)
      .not("extraction_status", "in", guard);
    console.log(`[job-status:reconcile] job=${jobId} → rejected`);
  } else if (engine.status === "complete" && engine.results) {
    const cols = mapEngineResponseToColumns(engine.results);
    await admin
      .from("collectibles")
      .update({ extraction_status: "extracted", ...cols, updated_at: now })
      .eq("id", row.id)
      .not("extraction_status", "in", guard);
    console.log(`[job-status:reconcile] job=${jobId} → extracted`);
  } else if (engine.status === "failed") {
    await admin
      .from("collectibles")
      .update({
        extraction_status: "failed",
        extraction_failure_reason: mapFailureCodeToReason(engine.failure_code),
        extraction_failed_at: now,
        updated_at: now,
      })
      .eq("id", row.id)
      .not("extraction_status", "in", guard);
    console.log(`[job-status:reconcile] job=${jobId} → failed`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const engineSecret = Deno.env.get("ENGINE_SHARED_SECRET") ?? "";

  if (!engineSecret) {
    console.error("[job-status] ENGINE_SHARED_SECRET not configured");
    return json({ error: "server_misconfigured" }, 500);
  }

  // Authenticate the caller via their JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId") ?? url.searchParams.get("id");
  if (!jobId || !UUID_RE.test(jobId)) {
    return json({ error: "jobId required (uuid)" }, 400);
  }

  // Forward to the engine job-status endpoint.
  let engine: EngineStatus;
  try {
    const engineRes = await fetch(
      `${ENGINE_JOB_STATUS_URL}?id=${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${engineSecret}` },
      },
    );
    const text = await engineRes.text();
    if (!engineRes.ok) {
      console.error("[job-status] engine error:", engineRes.status, text);
      return json({ error: "engine_error", status: engineRes.status }, 502);
    }
    engine = JSON.parse(text) as EngineStatus;
  } catch (err) {
    console.error("[job-status] engine call failed:", err);
    return json({ error: "engine_unavailable" }, 502);
  }

  // Reconcile a dropped webhook. Best-effort: never fail the poll on a
  // reconcile error (the client can still see completion and the row will be
  // healed on the next poll or a retried webhook).
  try {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    await reconcile(admin, jobId, engine);
  } catch (err) {
    console.warn("[job-status] reconcile non-fatal:", err);
  }

  // Slim payload for the client — heavy results reach it via Realtime.
  return json({
    job_id: jobId,
    status: engine.status ?? null,
    stage: engine.stage ?? null,
    outcome: engine.outcome ?? null,
    failure_code: engine.failure_code ?? null,
    rejection_reason: engine.rejection_reason ?? null,
    position: engine.position,
    eta_seconds: engine.eta_seconds,
  });
});
