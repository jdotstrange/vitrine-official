"use client"

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"

/**
 * Track / untrack a collectible with optimistic updates.
 *
 * Mirrors apps/native/lib/api/tracking.ts (trackItem/untrackItem) but
 * inlined here as the native module isn't web-bundle-safe.
 */
export function useTrack(collectibleId: string | null | undefined) {
  const { profile } = useUser()
  const myId = profile?.id
  const [isTracked, setIsTracked] = useState(false)
  const [trackCount, setTrackCount] = useState(0)
  const [pending, setPending] = useState(false)

  const refresh = useCallback(async () => {
    if (!collectibleId) return
    const supabase = createClient()

    if (myId) {
      const { data: row } = await supabase
        .from("user_tracks")
        .select("id")
        .eq("user_id", myId)
        .eq("collectible_id", collectibleId)
        .maybeSingle()

      setIsTracked(!!row)
    }

    const { count } = await supabase
      .from("user_tracks")
      .select("id", { count: "exact", head: true })
      .eq("collectible_id", collectibleId)

    setTrackCount(count ?? 0)
  }, [myId, collectibleId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggle = useCallback(async () => {
    if (!myId || !collectibleId || pending) return
    setPending(true)
    const wasTracked = isTracked
    setIsTracked(!wasTracked)
    setTrackCount((n) => (wasTracked ? Math.max(0, n - 1) : n + 1))

    const supabase = createClient()
    try {
      if (wasTracked) {
        const { error } = await supabase
          .from("user_tracks")
          .delete()
          .eq("user_id", myId)
          .eq("collectible_id", collectibleId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("user_tracks")
          .insert({
            id: crypto.randomUUID(),
            user_id: myId,
            collectible_id: collectibleId,
          })
        if (error) throw error
      }
    } catch (err) {
      setIsTracked(wasTracked)
      setTrackCount((n) => (wasTracked ? n + 1 : Math.max(0, n - 1)))
      console.warn("[useTrack] toggle failed", err)
    } finally {
      setPending(false)
    }
  }, [myId, collectibleId, isTracked, pending])

  return { isTracked, trackCount, toggle, pending, refresh }
}
