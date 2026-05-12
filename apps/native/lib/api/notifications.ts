/**
 * Backwards-compat shim — `notifications` lives in `@vitrine/api` after Day 2.5.
 * Existing call sites (`import { sendNotification } from '@/lib/api/notifications'`)
 * keep working. New code should import directly from `@/lib/api` or `@vitrine/api`.
 *
 * Side-effect import on `@/lib/api` forces `bindToSingleton(...)` to run
 * before any flat exports from `@vitrine/api` are invoked.
 */

import '@/lib/api';
export {
  sendNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationType,
  type NotifyPayload,
  type NotificationPreference,
  type PreferenceSection,
} from '@vitrine/api';
