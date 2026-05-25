"use client"

import { useState, useCallback, useEffect } from "react"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"

/**
 * Follow / unfollow a target user with optimistic updates.
 *
 * Wraps `@vitrine/api` follows module so the same RPCs back native and web.
 */
export function useFollow(targetUserId: string | null | undefined) {
  const { profile } = useUser()
  const myId = profile?.id
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [pending, setPending] = useState(false)

  const refresh = useCallback(async () => {
    if (!myId || !targetUserId) return
    try {
      const api = getClientApi()
      const [following, counts] = await Promise.all([
        api.follows.isFollowing(myId, targetUserId),
        api.follows.getFollowCounts(targetUserId),
      ])
      setIsFollowing(following)
      setFollowersCount(counts.followersCount)
    } catch (err) {
      console.warn("[useFollow] refresh failed", err)
    }
  }, [myId, targetUserId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggle = useCallback(async () => {
    if (!myId || !targetUserId || pending) return
    setPending(true)
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setFollowersCount((n) => (wasFollowing ? Math.max(0, n - 1) : n + 1))
    try {
      const api = getClientApi()
      if (wasFollowing) {
        await api.follows.unfollowUser(myId, targetUserId)
      } else {
        await api.follows.followUser(myId, targetUserId)
      }
    } catch (err) {
      setIsFollowing(wasFollowing)
      setFollowersCount((n) => (wasFollowing ? n + 1 : Math.max(0, n - 1)))
      console.warn("[useFollow] toggle failed", err)
    } finally {
      setPending(false)
    }
  }, [myId, targetUserId, isFollowing, pending])

  return { isFollowing, followersCount, toggle, pending, refresh }
}
