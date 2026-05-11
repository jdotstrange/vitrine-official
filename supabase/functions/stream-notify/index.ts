/**
 * stream-notify — fan out a notification verb into recipients' Stream
 * Feeds notification feeds.
 *
 * Contract:
 *   POST { type, recipientIds, actorId, data? }
 *
 *   `type` is the verb name (free-form string; no whitelist). It rides
 *   through to Stream as both the activity `type` and `custom.verb` so
 *   the client can switch on it for rendering and routing.
 *
 *   `recipientIds` is the set of users whose notification feeds receive
 *   the activity. Per-user preferences in `notification_preferences`
 *   filter the set before the fan-out.
 *
 *   `actorId` is the user whose identity the activity is published
 *   under (display_name, username, avatar are joined and forwarded).
 *
 *   `data` is an optional bag of metadata. Recognized keys are passed
 *   through to `activity.custom`; unrecognized keys are dropped. Adding
 *   a new key requires updating the passthrough block below.
 *
 * Verb conventions:
 *   INBOX   — social signals from one user to another (new_follower,
 *             status_change, vitrine_attached_to_chat, share_initiated, etc.)
 *   SIGNALS — system-discovered events (comp_alert, weekly_view_digest,
 *             view_milestone). Actor for these is conventionally the
 *             collectible owner (or "system" for fully-automated ones).
 *   JOURNAL — the actor's own actions, never sent through this function
 *             (rendered client-side from source-of-truth tables).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyPayload {
  type: string;
  recipientIds: string[];
  actorId: string;
  data?: Record<string, unknown>;
}

function toBase64Url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateUserToken(apiSecret: string, userId: string): Promise<string> {
  const enc = new TextEncoder();
  const headerB64 = toBase64Url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify({ user_id: userId, iat: now, exp: now + 3600 })));
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

const FEEDS_BASE = "https://feeds.stream-io-api.com";

/**
 * Whitelist of `data` keys forwarded to `activity.custom`. Adding a new
 * verb that needs new metadata? Add the key here.
 *
 * We use a whitelist (rather than spread) so a noisy caller can't pollute
 * the activity object with arbitrary fields and bloat the feed payload.
 */
const PASSTHROUGH_KEYS = [
  // Object identity
  "objectType",        // 'collectible' | 'showcase' | 'profile'
  "collectibleId",
  "collectibleTitle",
  "collectibleImage",
  "showcaseId",
  "showcaseTitle",
  "showcaseImage",
  // Status / value mutations
  "newStatus",
  "prevValue",
  "newValue",
  "changedFields",     // string[] for metadata_change
  // Comp alert
  "compId",
  "compTitle",
  "compImage",
  "compMatchPercent",
  // View signals
  "viewCount",
  "viewWindow",        // '7d' | '24h' | etc.
  "viewMilestone",     // 100 | 500 | 1000 | 10000
  // Chat attach
  "channelId",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseJwt = authHeader.replace("Bearer ", "");
    if (!supabaseJwt) {
      return new Response(JSON.stringify({ error: "No auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Two callers are allowed:
    //   - end-user clients passing a Supabase user JWT (most verbs)
    //   - system cron workers (comp-alert-worker, view-* workers) passing
    //     the service-role key directly. They have no user identity.
    const isSystemCaller = supabaseJwt === serviceRoleKey;
    if (!isSystemCaller) {
      const { data: { user: authUser }, error: authError } =
        await supabase.auth.getUser(supabaseJwt);
      if (authError || !authUser) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body: NotifyPayload = await req.json();
    const { type, recipientIds, actorId, data } = body;
    if (!type || !recipientIds?.length || !actorId) {
      return new Response(
        JSON.stringify({ error: "Missing type, recipientIds, or actorId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // System verbs (comp_alert, view_milestone, weekly_view_digest) use
    // the recipient as the actor since there's no human actor — the
    // recipient is the owner of the thing the system surfaced. The
    // actor profile join handles this transparently.
    const { data: actorProfile } = await supabase
      .from("users")
      .select("display_name, username, avatar")
      .eq("id", actorId)
      .single();

    const actorName = actorProfile?.display_name || actorProfile?.username || "Someone";
    const actorUsername = actorProfile?.username || "";
    const actorAvatar = actorProfile?.avatar || "";

    const { data: prefRows } = await supabase
      .from("notification_preferences")
      .select("user_id, disabled_types")
      .in("user_id", recipientIds);

    const disabledMap = new Map<string, Set<string>>();
    for (const row of prefRows || []) {
      disabledMap.set(row.user_id, new Set(row.disabled_types || []));
    }

    const eligibleRecipients = recipientIds.filter((id) => {
      const disabled = disabledMap.get(id);
      return !disabled || !disabled.has(type);
    });

    if (eligibleRecipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, skipped: recipientIds.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const streamApiKey = Deno.env.get("STREAM_API_KEY") ?? "";
    const streamApiSecret = Deno.env.get("STREAM_API_SECRET") ?? "";
    if (!streamApiKey || !streamApiSecret) {
      return new Response(
        JSON.stringify({ error: "Stream not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const actorToken = await generateUserToken(streamApiSecret, actorId);

    let sent = 0;
    let failed = 0;
    for (const recipientId of eligibleRecipients) {
      try {
        const custom: Record<string, unknown> = {
          verb: type,
          actorId,
          actorName,
          actorUsername,
          actorAvatar,
          objectId: data?.objectId || actorId,
        };

        // Forward only whitelisted keys. Drops unknowns to keep the
        // activity payload lean and predictable.
        if (data) {
          for (const key of PASSTHROUGH_KEYS) {
            if (data[key] !== undefined && data[key] !== null) {
              custom[key] = data[key];
            }
          }
        }

        const activityBody = {
          type,
          feeds: [`notification:${recipientId}`],
          custom,
        };

        const res = await fetch(
          `${FEEDS_BASE}/api/v2/feeds/activities?api_key=${streamApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": actorToken,
              "stream-auth-type": "jwt",
            },
            body: JSON.stringify(activityBody),
          },
        );

        if (res.ok) {
          sent++;
        } else {
          const errBody = await res.text();
          console.error(`Failed for ${recipientId}:`, res.status, errBody.slice(0, 300));
          failed++;
        }
      } catch (err) {
        console.error(`Error for ${recipientId}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, failed, total: eligibleRecipients.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("stream-notify error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
