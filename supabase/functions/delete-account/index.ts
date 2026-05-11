/**
 * delete-account — permanently deletes a user's data and auth record.
 *
 * Authenticates via the user's own JWT (from Authorization header).
 * Cascades through owned data in dependency order, then calls
 * auth.admin.deleteUser to remove the auth identity.
 *
 * Input:  POST { confirmUsername: string }
 * Output: 200 { success: true } or 4xx/5xx error
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Create a client with the user's JWT to identify them
  const userClient = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify the user
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body and verify username confirmation
  let body: { confirmUsername?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Look up the user's public profile to verify username match
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile } = await adminClient
    .from("users")
    .select("id, username")
    .eq("supabase_auth_id", user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (
    !body.confirmUsername ||
    body.confirmUsername.toLowerCase() !== profile.username?.toLowerCase()
  ) {
    return new Response(
      JSON.stringify({ error: "Username confirmation does not match" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const userId = profile.id;

  try {
    // Delete in dependency order (children before parents)
    // showcase_collectibles references both showcases and collectibles
    await adminClient
      .from("showcase_collectibles")
      .delete()
      .or(`collectible_id.in.(select id from collectibles where user_id='${userId}'),showcase_id.in.(select id from showcases where user_id='${userId}')`);

    // Delete user's showcases
    await adminClient.from("showcases").delete().eq("user_id", userId);

    // Delete tracked items (where user is the tracker)
    await adminClient.from("tracked_collectibles").delete().eq("user_id", userId);

    // Delete follows (both directions)
    await adminClient.from("follows").delete().eq("follower_id", userId);
    await adminClient.from("follows").delete().eq("following_id", userId);

    // Delete blocked users (both directions)
    await adminClient.from("blocked_users").delete().eq("blocker_id", userId);
    await adminClient.from("blocked_users").delete().eq("blocked_id", userId);

    // Delete notification preferences
    await adminClient
      .from("notification_preferences")
      .delete()
      .eq("user_id", userId);

    // Delete views
    await adminClient.from("views").delete().eq("viewer_id", userId);

    // Delete suggested collectors cache
    await adminClient
      .from("suggested_collectors_cache")
      .delete()
      .or(`user_id.eq.${userId},candidate_id.eq.${userId}`);

    // Delete collectibles (this also cascades showcase_collectibles via FK)
    await adminClient.from("collectibles").delete().eq("user_id", userId);

    // Delete the public user row
    await adminClient.from("users").delete().eq("id", userId);

    // Finally, delete the auth user
    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ error: "Failed to delete auth record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error during account deletion" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
