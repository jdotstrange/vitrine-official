/**
 * stream-token — mint a short-lived Stream Chat / Feeds JWT for the
 * authenticated Vitrine user.
 *
 * Contract:
 *   POST (auth: Supabase user JWT)
 *   → 200 { token: string, userId: string }
 *
 * The function:
 *   1. Verifies the Supabase JWT from Authorization: Bearer …
 *   2. Resolves the Vitrine `users.id` (text PK) for that auth user
 *   3. Mints an HS256 JWT signed with STREAM_API_SECRET, payload `{ user_id }`
 *   4. Returns the token + the resolved userId so the client can pass them
 *      directly to Stream Chat / Feeds clients
 *
 * The same function is consumed by both the native app and the web app.
 *
 * ENV (set via `supabase secrets set …`):
 *   - STREAM_API_KEY        — public Stream key (informational; not used here)
 *   - STREAM_API_SECRET     — Stream HMAC secret used to sign the user JWT
 *   - SUPABASE_URL          — auto-injected
 *   - SUPABASE_SERVICE_ROLE_KEY — auto-injected (service role for users table)
 *
 * Token lifetime: 1 hour. Clients refresh proactively before expiry.
 *
 * Mirrors the `generateUserToken` helper in stream-notify so the two
 * functions sign identical payloads.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_TTL_SECONDS = 60 * 60;

function toBase64Url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateUserToken(
  apiSecret: string,
  userId: string,
): Promise<string> {
  const enc = new TextEncoder();
  const headerB64 = toBase64Url(
    enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const now = Math.floor(Date.now() / 1000);
  const payloadB64 = toBase64Url(
    enc.encode(
      JSON.stringify({
        user_id: userId,
        iat: now,
        exp: now + TOKEN_TTL_SECONDS,
      }),
    ),
  );
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(signingInput),
  );
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const apiSecret = Deno.env.get("STREAM_API_SECRET");
  if (!apiSecret) {
    return jsonResponse({ error: "stream_secret_not_configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "supabase_not_configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const { data: row, error: rowErr } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_auth_id", user.id)
    .maybeSingle();

  if (rowErr || !row?.id) {
    return jsonResponse({ error: "profile_not_found" }, 404);
  }

  const userId = String(row.id);
  const token = await generateUserToken(apiSecret, userId);

  return jsonResponse({ token, userId });
});
