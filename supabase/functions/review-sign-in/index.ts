/**
 * review-sign-in — passwordless App Review / TestFlight demo login.
 *
 * Accepts a fixed email + 6-digit OTP for a single allowlisted review account.
 * Validates credentials against REVIEW_AUTH_EMAIL and REVIEW_AUTH_CODE secrets,
 * then returns a one-time-use token hash for the client to verify.
 *
 * Contract:
 *   POST { email: string, code: string }
 *   → 200 { token_hash: string, verification_type: string }
 *   → 401 invalid credentials
 *
 * The client completes sign-in with
 *   verifyOtp({ token_hash, type: verification_type })
 * which is the same primitive normal email-OTP login uses (RN/Hermes safe).
 * We deliberately do NOT verify the token here — token hashes are one-time
 * use, so consuming it server-side would leave nothing for the client.
 *
 * Secrets (supabase secrets set …):
 *   REVIEW_AUTH_EMAIL  — e.g. appreview@myvitrine.app
 *   REVIEW_AUTH_CODE   — 6-digit string, e.g. 847291
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function resolveAuthUserId(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string> {
  const { data: profile } = await admin
    .from("users")
    .select("supabase_auth_id")
    .eq("email", email)
    .maybeSingle();

  if (profile?.supabase_auth_id) {
    return String(profile.supabase_auth_id);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { review_account: true },
  });

  if (created?.user?.id) {
    return created.user.id;
  }

  if (createError?.message?.includes("already been registered")) {
    let page = 1;
    while (page <= 20) {
      const { data: listData, error: listError } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (listError) {
        throw listError;
      }

      const match = listData.users.find(
        (user) => normalizeEmail(user.email ?? "") === email,
      );
      if (match?.id) {
        return match.id;
      }

      if (listData.users.length < 200) {
        break;
      }
      page += 1;
    }
  }

  throw createError ?? new Error("auth_user_not_found");
}

async function ensurePublicUser(
  admin: ReturnType<typeof createClient>,
  authUserId: string,
  email: string,
): Promise<void> {
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("supabase_auth_id", authUserId)
    .maybeSingle();

  if (existing?.id) {
    return;
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("users").insert({
    id: crypto.randomUUID(),
    supabase_auth_id: authUserId,
    email,
    username: "vitrine-review",
    display_name: "Vitrine Review",
    onboarding_completed_at: now,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    if (error.code === "23505") {
      return;
    }
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const reviewEmail = Deno.env.get("REVIEW_AUTH_EMAIL")?.trim().toLowerCase();
  const reviewCode = Deno.env.get("REVIEW_AUTH_CODE")?.trim();

  if (!reviewEmail || !reviewCode) {
    return jsonResponse({ error: "review_auth_not_configured" }, 500);
  }

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const email = normalizeEmail(body.email ?? "");
  const code = (body.code ?? "").trim();

  if (!email || code.length !== 6) {
    return jsonResponse({ error: "invalid_credentials" }, 401);
  }

  if (email !== reviewEmail || code !== reviewCode) {
    return jsonResponse({ error: "invalid_credentials" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "supabase_not_configured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const authUserId = await resolveAuthUserId(admin, email);
    await ensurePublicUser(admin, authUserId, email);

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const tokenHash = linkData?.properties?.hashed_token;
    const verificationType = linkData?.properties?.verification_type ?? "magiclink";

    if (linkError || !tokenHash) {
      console.error("review-sign-in generateLink error:", linkError);
      return jsonResponse({ error: "session_create_failed" }, 500);
    }

    return jsonResponse({
      token_hash: tokenHash,
      verification_type: verificationType,
    });
  } catch (error) {
    console.error("review-sign-in error:", error);
    return jsonResponse({ error: "review_sign_in_failed" }, 500);
  }
});
