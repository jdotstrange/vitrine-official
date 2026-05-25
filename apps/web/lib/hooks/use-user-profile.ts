"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface UserProfileFull {
  id: string
  username: string | null
  displayName: string | null
  bio: string | null
  avatar: string | null
  email?: string | null
  featuredShowcaseId: string | null
  crownJewelCollectibleId: string | null
  followersCount: number
  followingCount: number
}

/**
 * Fetch a user's full profile.
 *
 * Mirrors apps/native/lib/api/auth.ts (getUserById).
 */
export function useUserProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfileFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from("users")
        .select(
          "id, username, display_name, bio, avatar, featured_showcase_id, crown_jewel_collectible_id, followers_count, following_count",
        )
        .eq("id", userId)
        .maybeSingle()

      if (queryError) throw queryError
      if (!data) {
        setProfile(null)
        return
      }

      setProfile({
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        avatar: data.avatar,
        featuredShowcaseId: data.featured_showcase_id,
        crownJewelCollectibleId: data.crown_jewel_collectible_id,
        followersCount: data.followers_count ?? 0,
        followingCount: data.following_count ?? 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { profile, loading, error, refetch }
}
