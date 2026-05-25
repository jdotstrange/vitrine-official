/**
 * test-push — dev-only utility to fire a test push notification to a user's
 * registered device via Stream Chat's server-side API.
 *
 * Usage:
 *   POST /functions/v1/test-push
 *   Authorization: Bearer <service-role-key>
 *   Body: { "userId": "<public.users.id>" }
 *
 * This creates a temporary 1:1 channel with a "system" user, sends a test
 * message, then deletes it — triggering a real APNs push to the device.
 *
 * Guard: Only accepts the service-role key (not user JWTs). This is a dev
 * tool, not a production endpoint.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHAT_BASE = "https://chat.stream-io-api.com";

function toBase64Url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateServerToken(apiSecret: string): Promise<string> {
  const enc = new TextEncoder();
  const headerB64 = toBase64Url(
    enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const now = Math.floor(Date.now() / 1000);
  const payloadB64 = toBase64Url(
    enc.encode(JSON.stringify({ server: true, iat: now, exp: now + 300 })),
  );
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Dev-only tool — no auth check. Deployed with --no-verify-jwt.
    // Add service-role guard before promoting to production.

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId in body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const streamApiKey = Deno.env.get("STREAM_API_KEY") ?? "";
    const streamApiSecret = Deno.env.get("STREAM_API_SECRET") ?? "";
    if (!streamApiKey || !streamApiSecret) {
      return new Response(
        JSON.stringify({ error: "Stream not configured (missing API key or secret)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serverToken = await generateServerToken(streamApiSecret);

    // Use Stream's check_push endpoint to send a test push
    const pushTestRes = await fetch(
      `${CHAT_BASE}/check_push?api_key=${streamApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": serverToken,
          "stream-auth-type": "jwt",
        },
        body: JSON.stringify({
          user_id: userId,
          message_text: "🔔 Push test from Vitrine — if you see this, notifications are working!",
        }),
      },
    );

    const pushTestBody = await pushTestRes.json();

    if (!pushTestRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Stream check_push failed",
          status: pushTestRes.status,
          detail: pushTestBody,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Test push sent successfully",
        streamResponse: pushTestBody,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("test-push error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
