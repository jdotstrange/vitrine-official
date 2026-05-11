/**
 * Views API — anonymous, daily-deduped view tracking.
 *
 * Architecture:
 *   - `recordView` is called on every detail-screen mount. The viewer
 *     identity is intentionally anonymous: a per-install random device
 *     id, sha256-hashed with the current UTC date, so the same device
 *     gets a different anon id each day. The hash is one-way; nothing
 *     in the system can map an anon id back to a user or device.
 *
 *   - `getViewCounts` returns batch counters for card-surface badge
 *     rendering.
 *
 * Privacy posture (V1, locked):
 *   - No `viewer_id` is ever stored. We don't know who viewed what.
 *   - Self-views are filtered client-side using the caller's userId vs.
 *     the target owner's userId. Owners shouldn't inflate their own
 *     view counts.
 *   - Private collectibles / showcases are short-circuited server-side
 *     in the record_view RPC; the client cannot bypass.
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { logger } from '../logger';

const log = logger.create('ViewsAPI');

const DEVICE_ID_KEY = 'vitrine.device_anon_id';

export type ViewTarget = 'collectible' | 'showcase' | 'profile';

export interface ViewCounts {
  totalViews: number;
  views7d: number;
  uniqueViewers7d: number;
}

let cachedDeviceId: string | null = null;

/**
 * Resolve a stable per-install device id. Generated on first call and
 * persisted via AsyncStorage. The id itself is a random UUID — it has
 * no link to user identity by construction.
 *
 * The id never leaves the device — it's combined with the current UTC
 * date, sha256-hashed, and only the digest is sent to the server.
 */
async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
  } catch (err) {
    log.warn('AsyncStorage read failed:', err);
  }
  const fresh = Crypto.randomUUID();
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
  } catch (err) {
    log.warn('AsyncStorage write failed:', err);
  }
  cachedDeviceId = fresh;
  return fresh;
}

/**
 * Produce today's anon viewer id as sha256(deviceId + ':' + UTC date).
 * Rotates daily so cross-day correlation isn't possible at the row level.
 */
async function makeAnonViewerId(): Promise<string> {
  const deviceId = await getDeviceId();
  const today = new Date().toISOString().slice(0, 10);
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${deviceId}:${today}`,
  );
}

/**
 * Record a view for the given target. No-op if `selfOwnerId` matches
 * the current Supabase user (self-views shouldn't inflate counters).
 *
 * Best-effort: every error is swallowed. View tracking is a side
 * channel; never block the UI on it.
 */
export async function recordView(
  targetType: ViewTarget,
  targetId: string,
  selfOwnerId?: string | null,
): Promise<void> {
  if (!targetId) return;
  try {
    if (selfOwnerId) {
      const { data } = await supabase.auth.getUser();
      const myId = data.user?.id ?? null;
      if (myId && myId === selfOwnerId) return;
    }
    const viewerAnonId = await makeAnonViewerId();
    const { error } = await supabase.rpc('record_view', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_viewer_anon_id: viewerAnonId,
    });
    if (error) {
      log.warn('record_view rpc failed:', error.message);
    }
  } catch (err) {
    log.warn('recordView swallowed error:', err);
  }
}

/**
 * Batch-fetch view counters. Targets without any recorded views won't
 * appear in the response — callers should default to zero on miss.
 *
 * Returns a Map keyed by target id for direct lookup at render time.
 */
export async function getViewCounts(
  targetType: ViewTarget,
  targetIds: string[],
): Promise<Map<string, ViewCounts>> {
  const result = new Map<string, ViewCounts>();
  if (targetIds.length === 0) return result;

  try {
    const { data, error } = await supabase.rpc('get_view_counts', {
      p_target_type: targetType,
      p_target_ids: targetIds,
    });
    if (error) {
      log.warn('get_view_counts rpc failed:', error.message);
      return result;
    }
    for (const row of (data || []) as Array<{
      target_id: string;
      total_views: number;
      views_7d: number;
      unique_viewers_7d: number;
    }>) {
      result.set(row.target_id, {
        totalViews: Number(row.total_views) || 0,
        views7d: Number(row.views_7d) || 0,
        uniqueViewers7d: Number(row.unique_viewers_7d) || 0,
      });
    }
  } catch (err) {
    log.warn('getViewCounts swallowed error:', err);
  }
  return result;
}
