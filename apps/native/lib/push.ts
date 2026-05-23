/**
 * Push notification token management and Stream device registration.
 *
 * Stream Chat and Stream Feeds both deliver push natively via APNs/FCM.
 * expo-notifications handles permission, token acquisition, foreground
 * display, and deep-link routing — it never sends push itself.
 *
 * We use getDevicePushTokenAsync() (native APNs token) rather than
 * getExpoPushTokenAsync() because Stream does not support Expo push
 * tokens (open issue #3316).
 *
 * IMPORTANT: expo-notifications is loaded lazily via require() to avoid
 * a module-resolution crash caused by @ide/backoff → assert in Metro.
 */

import { Platform } from 'react-native';
import type { StreamChat } from 'stream-chat';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const log = logger.create('Push');

function getNotificationsModule() {
  return require('expo-notifications') as typeof import('expo-notifications');
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getPushPermissionStatus(): Promise<PermissionStatus> {
  const Notifications = getNotificationsModule();
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

export async function requestPushPermission(): Promise<PermissionStatus> {
  const Notifications = getNotificationsModule();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return 'granted';

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status as PermissionStatus;
}

// ---------------------------------------------------------------------------
// Token acquisition + Stream registration
// ---------------------------------------------------------------------------

let _registrationInFlight = false;
let _lastFailureAt = 0;
const FAILURE_BACKOFF_MS = 30_000;

export async function getAndRegisterPushToken(
  chatClient: StreamChat,
  userId: string,
): Promise<string | null> {
  const now = Date.now();
  if (_registrationInFlight) {
    log.info('Skipping registration — already in flight');
    return null;
  }
  // Only apply cooldown after a failure — successful registrations don't
  // need to be rate-limited (the auto-register flag prevents re-runs).
  if (_lastFailureAt > 0 && now - _lastFailureAt < FAILURE_BACKOFF_MS) {
    log.info('Skipping registration — failure backoff active');
    return null;
  }

  _registrationInFlight = true;

  try {
    const Notifications = getNotificationsModule();
    const { data: tokenData } = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenData === 'string' ? tokenData : String(tokenData);
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    log.info('Acquired device push token, registering with Stream...');

    const pushProvider = platform === 'ios' ? 'apn' : 'firebase';
    // Stream Dashboard has named push provider configs — must pass the name
    // so Stream knows which APNs/FCM credential to use for delivery.
    const pushProviderName = platform === 'ios' ? 'MyVitrineiOS' : 'MyVitrineAndroid';
    await chatClient.addDevice(token, pushProvider, userId, pushProviderName);
    log.info('Stream Chat device registered');

    await persistToken(userId, token, platform);

    _lastFailureAt = 0;
    return token;
  } catch (err) {
    _lastFailureAt = Date.now();
    log.error('Failed to register push token:', err);
    return null;
  } finally {
    _registrationInFlight = false;
  }
}

export async function unregisterPushToken(
  chatClient: StreamChat,
  userId: string,
): Promise<void> {
  try {
    const { data } = await supabase
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (data?.token) {
      await chatClient.removeDevice(data.token);
      log.info('Stream Chat device unregistered');
    }

    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId);

    log.info('Push token cleared from Supabase');
  } catch (err) {
    log.error('Failed to unregister push token:', err);
  }
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export async function setBadgeCount(count: number): Promise<void> {
  try {
    const Notifications = getNotificationsModule();
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch (err) {
    log.warn('Failed to set badge count:', err);
  }
}

// ---------------------------------------------------------------------------
// Notification setup (called from effects, not module scope)
// ---------------------------------------------------------------------------

export function setupNotificationHandler() {
  const Notifications = getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data ?? {};
      if (data.type === 'message.new' || data.stream_channel_cid) {
        return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
      }
      return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true };
    },
  });
}

export function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const Notifications = getNotificationsModule();
  Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
  });
  Notifications.setNotificationChannelAsync('social', {
    name: 'Social',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  Notifications.setNotificationChannelAsync('intelligence', {
    name: 'Intelligence',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  Notifications.setNotificationChannelAsync('digest', {
    name: 'Weekly Digest',
    importance: Notifications.AndroidImportance.LOW,
    sound: undefined,
  });
}

export function addNotificationResponseListener(
  handler: (response: { notification: { request: { identifier: string; content: { data: Record<string, unknown> } } } }) => void,
) {
  const Notifications = getNotificationsModule();
  return Notifications.addNotificationResponseReceivedListener(handler as any);
}

export function addPushTokenRefreshListener(
  handler: (event: { data: unknown }) => void,
) {
  const Notifications = getNotificationsModule();
  return Notifications.addPushTokenListener(handler as any);
}

// ---------------------------------------------------------------------------
// Supabase token persistence
// ---------------------------------------------------------------------------

async function persistToken(_profileUserId: string, token: string, platform: string): Promise<void> {
  // RLS checks auth.uid(), so we must use the Supabase auth UID (not the
  // public.users profile ID which is different).
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    log.warn('Cannot persist push token — no auth user');
    return;
  }

  const { error } = await supabase
    .from('user_push_tokens')
    .upsert(
      { user_id: authUser.id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' },
    );

  if (error) {
    log.warn('Failed to persist push token to Supabase:', error.message);
  } else {
    log.info('Push token persisted to Supabase');
  }
}
