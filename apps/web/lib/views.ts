/**
 * View tracking on web.
 *
 * Mirrors apps/native/lib/api/views.ts:
 *   - Per-install random device id (cookie + localStorage), sha256-hashed
 *     with current UTC date so the same device gets a different anon id
 *     each day.
 *   - Self-views are skipped client-side; the server also enforces.
 *   - Best-effort: every error is swallowed.
 */

"use client"

import { createClient } from "@/lib/supabase/client"

const DEVICE_ID_KEY = "vitrine.device_anon_id"
const COOKIE_TTL_DAYS = 365

export type ViewTarget = "collectible" | "showcase" | "profile"

let cachedDeviceId: string | null = null

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + escapeRegex(name) + "=([^;]*)"),
  )
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // RFC4122 v4 fallback
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  buf[6] = (buf[6] & 0x0f) | 0x40
  buf[8] = (buf[8] & 0x3f) | 0x80
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId

  try {
    const fromStorage = window.localStorage.getItem(DEVICE_ID_KEY)
    if (fromStorage) {
      cachedDeviceId = fromStorage
      // Mirror to cookie for cross-tab + privacy-mode resilience.
      setCookie(DEVICE_ID_KEY, fromStorage, COOKIE_TTL_DAYS)
      return fromStorage
    }
  } catch {
    /* localStorage may be blocked */
  }

  const fromCookie = getCookie(DEVICE_ID_KEY)
  if (fromCookie) {
    cachedDeviceId = fromCookie
    try {
      window.localStorage.setItem(DEVICE_ID_KEY, fromCookie)
    } catch {
      /* ignore */
    }
    return fromCookie
  }

  const fresh = generateUuid()
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, fresh)
  } catch {
    /* ignore */
  }
  setCookie(DEVICE_ID_KEY, fresh, COOKIE_TTL_DAYS)
  cachedDeviceId = fresh
  return fresh
}

async function makeAnonViewerId(): Promise<string> {
  const deviceId = getDeviceId()
  const today = new Date().toISOString().slice(0, 10)
  const data = new TextEncoder().encode(`${deviceId}:${today}`)
  const hashBuf = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Record a view for the given target. No-op if `selfOwnerId` matches the
 * current Supabase user (self-views don't inflate counters).
 */
export async function recordView(
  targetType: ViewTarget,
  targetId: string,
  selfOwnerId?: string | null,
): Promise<void> {
  if (typeof window === "undefined" || !targetId) return
  try {
    const supabase = createClient()
    if (selfOwnerId) {
      const { data } = await supabase.auth.getUser()
      const myId = data.user?.id ?? null
      if (myId && myId === selfOwnerId) return
    }
    const viewerAnonId = await makeAnonViewerId()
    const { error } = await supabase.rpc("record_view", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_viewer_anon_id: viewerAnonId,
    })
    if (error) {
      console.warn("[views] record_view rpc failed:", error.message)
    }
  } catch (err) {
    console.warn("[views] recordView swallowed error:", err)
  }
}
