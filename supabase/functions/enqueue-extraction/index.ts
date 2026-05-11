/**
 * enqueue-extraction — thin proxy between the mobile app and Looking Glass.
 *
 * The mobile app calls this with its user JWT. This function:
 *   1. Validates the JWT (Supabase handles this via verify_jwt: true)
 *   2. Resolves the caller's public users.id
 *   3. Forwards the request to Looking Glass /queue-extraction with
 *      the ENGINE_SHARED_SECRET bearer token
 *   4. Returns the 202 response unchanged
 *
 * This keeps the engine secret out of the mobile binary.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const LOOKING_GLASS_URL =
  "https://nhshzyktaarbknzpsvtr.supabase.co/functions/v1/queue-extraction";
const CALLBACK_URL =
  "https://fxmiongkckkrllgyfwyw.supabase.co/functions/v1/looking-glass-webhook";
const CLIENT_ID = "vitrine-collector";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const engineSecret = Deno.env.get("ENGINE_SHARED_SECRET") ?? "";

  if (!engineSecret) {
    console.error("[enqueue-extraction] ENGINE_SHARED_SECRET not configured");
    return new Response(
      JSON.stringify({ error: "server_misconfigured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Resolve calling user from their JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_auth_id", authUser.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: "user_not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    imageUrls?: string[];
    title?: string;
    hint?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (
    !body.imageUrls ||
    !Array.isArray(body.imageUrls) ||
    body.imageUrls.length === 0
  ) {
    return new Response(
      JSON.stringify({ error: "imageUrls required (non-empty array)" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  if (!body.title || typeof body.title !== "string") {
    return new Response(
      JSON.stringify({ error: "title required (string)" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Forward to Looking Glass engine
  const enginePayload = {
    image_urls: body.imageUrls,
    title: body.title,
    hint: body.hint ?? undefined,
    callback_url: CALLBACK_URL,
    client_id: CLIENT_ID,
    user_id: profile.id,
    // TODO: read from users.subscription_tier once RevenueCat is integrated
    user_tier: "free" as const,
  };

  console.log(
    "[enqueue-extraction] forwarding to engine:",
    JSON.stringify({
      title: enginePayload.title,
      image_urls_count: enginePayload.image_urls.length,
      image_urls: enginePayload.image_urls,
      user_id: enginePayload.user_id,
    }),
  );

  try {
    const engineRes = await fetch(LOOKING_GLASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${engineSecret}`,
      },
      body: JSON.stringify(enginePayload),
    });

    const engineBody = await engineRes.text();

    if (!engineRes.ok) {
      console.error(
        "[enqueue-extraction] engine rejected:",
        engineRes.status,
        engineBody,
      );
    }

    return new Response(engineBody, {
      status: engineRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("[enqueue-extraction] engine call failed:", err);
    return new Response(
      JSON.stringify({ error: "engine_unavailable" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
