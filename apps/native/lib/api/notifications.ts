import { supabase, getAccessToken } from '@/lib/supabase';
import { logger } from '../logger';

const log = logger.create('NotificationsAPI');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Activity Surface verb taxonomy. Three sections — INBOX, SIGNALS, JOURNAL —
 * map 1:1 to the lens chips on the activity feed. Adding a new verb is
 * a one-step change here; the verb config in `lib/design/activity-verbs.ts`
 * picks up rendering + routing automatically.
 *
 * INBOX  — social signals from one person to another.
 * SIGNALS — system-discovered events tied to a thing the user owns or tracks.
 * JOURNAL — the user's own actions, sourced client-side from change-log
 *           tables; never travels through the notification feed.
 */
export type NotificationType =
  // INBOX
  | 'new_follower'
  | 'someone_tracked_your_item'
  | 'status_change'
  | 'value_change'
  | 'metadata_change'
  | 'new_item_from_followed'
  | 'new_showcase_from_followed'
  | 'share_initiated'
  | 'vitrine_attached_to_chat'
  // SIGNALS
  | 'comp_alert'
  | 'view_milestone'
  | 'weekly_view_digest'
  // Legacy alias retained so older client builds still resolve.
  | 'tracking_alert';

export type PreferenceSection = 'INBOX' | 'SIGNALS' | 'JOURNAL';

export interface NotifyPayload {
  type: NotificationType;
  recipientIds: string[];
  actorId: string;
  data?: Record<string, unknown>;
}

/**
 * Send a notification to one or more users via the stream-notify Edge Function.
 * Fire-and-forget by design — callers should not await this critically.
 */
export async function sendNotification(payload: NotifyPayload): Promise<void> {
  try {
    const jwt = await getAccessToken();
    if (!jwt) {
      log.warn('No JWT, skipping notification');
      return;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/stream-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      log.warn('Notification send failed:', res.status, body.error);
    }
  } catch (err) {
    log.warn('Notification send error (non-blocking):', err);
  }
}

export interface NotificationPreference {
  key: string;
  section: PreferenceSection;
  label: string;
  description: string;
  enabled: boolean;
}

/**
 * Source of truth for the settings UI.
 *
 * Every togglable verb appears here. Order within each section drives
 * the display order. Verbs not present in this catalog (e.g. legacy
 * `tracking_alert`) cannot be toggled — they remain forever-on.
 */
const PREFERENCE_CATALOG: Omit<NotificationPreference, 'enabled'>[] = [
  // ─── INBOX ────────────────────────────────────────────────────────
  {
    key: 'new_follower',
    section: 'INBOX',
    label: 'New Followers',
    description: 'When someone follows you',
  },
  {
    key: 'someone_tracked_your_item',
    section: 'INBOX',
    label: 'Item Tracked',
    description: 'When someone tracks one of your collectibles',
  },
  {
    key: 'status_change',
    section: 'INBOX',
    label: 'Status Changes',
    description: "Status updates on items you're tracking",
  },
  {
    key: 'value_change',
    section: 'INBOX',
    label: 'Value Updates',
    description: "Value updates on items you're tracking",
  },
  {
    key: 'metadata_change',
    section: 'INBOX',
    label: 'Metadata Edits',
    description: "Metadata edits on items you're tracking",
  },
  {
    key: 'new_item_from_followed',
    section: 'INBOX',
    label: 'New Listings from Follows',
    description: 'When collectors you follow add new items',
  },
  {
    key: 'new_showcase_from_followed',
    section: 'INBOX',
    label: 'New Showcases from Follows',
    description: 'When collectors you follow publish a showcase',
  },
  {
    key: 'share_initiated',
    section: 'INBOX',
    label: 'Shares of Your Stuff',
    description: 'When someone shares your collectible, showcase, or profile',
  },
  {
    key: 'vitrine_attached_to_chat',
    section: 'INBOX',
    label: 'Chat Attachments',
    description: 'When your collectible or showcase is attached in a chat',
  },
  // ─── SIGNALS ──────────────────────────────────────────────────────
  {
    key: 'comp_alert',
    section: 'SIGNALS',
    label: 'Comp Alerts',
    description: 'Strong-match comparable items for what you track (max 5/day)',
  },
  {
    key: 'view_milestone',
    section: 'SIGNALS',
    label: 'View Milestones',
    description: 'When your collectible, showcase, or profile crosses 100 / 500 / 1k / 10k views',
  },
  {
    key: 'weekly_view_digest',
    section: 'SIGNALS',
    label: 'Weekly View Digest',
    description: 'Mondays — total views your stuff got in the past week',
  },
];

/**
 * Load notification preferences for a user.
 * Returns the full catalog with enabled/disabled states.
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreference[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('disabled_types')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    log.error('Error loading notification preferences:', error);
  }

  const disabled = new Set<string>(data?.disabled_types ?? []);

  return PREFERENCE_CATALOG.map((pref) => ({
    ...pref,
    enabled: !disabled.has(pref.key),
  }));
}

/**
 * Save notification preferences for a user.
 * Stores only the disabled types as an array.
 */
export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreference[],
): Promise<boolean> {
  const disabledTypes = preferences
    .filter((p) => !p.enabled)
    .map((p) => p.key);

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        disabled_types: disabledTypes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    log.error('Error saving notification preferences:', error);
    return false;
  }
  return true;
}
