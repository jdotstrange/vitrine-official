"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { mapRowToCollectible, type CollectibleListItem } from "./use-collectibles"

export interface CollectibleDetail extends CollectibleListItem {
  userId: string
  ownerUsername?: string | null
  ownerDisplayName?: string | null
  ownerAvatar?: string | null
  listingTitle?: string | null
  listingDescription?: string | null
  acquisitionPrice?: number | null
  aiMetadata?: Record<string, unknown> | null
  traitMetadata?: string[] | null
  spatialMetadata?: Record<string, unknown> | null
  yearMin?: number | null
  yearMax?: number | null
  collectibleType?: string | null
  subcategory?: string | null
}

interface UseCollectibleOptions {
  /**
   * The current viewer's user_id. If provided, the hook will hide rows
   * that haven't been published when the viewer is not the owner. If
   * omitted, the hook only ever returns published rows (safe public
   * default).
   */
  viewerUserId?: string | null
}

export function useCollectible(
  collectibleId: string | null | undefined,
  options: UseCollectibleOptions = {},
) {
  const { viewerUserId } = options
  const [collectible, setCollectible] = useState<CollectibleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!collectibleId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      const { data, error: queryError } = await supabase
        .from("collectibles")
        .select(
          `
          *,
          users!collectibles_user_id_fkey (
            id, username, display_name, avatar
          )
        `,
        )
        .eq("id", collectibleId)
        .maybeSingle()

      if (queryError) throw queryError
      if (!data) {
        setCollectible(null)
        return
      }

      // Visibility gate: non-owners can only see rows that have been
      // published. Owners can always see their own rows (queue review,
      // queue errors, etc.). When the viewer identity is unknown, treat
      // it as "not the owner" — fail closed.
      const isOwner = !!viewerUserId && viewerUserId === data.user_id
      if (!isOwner && !data.published_at) {
        setCollectible(null)
        return
      }

      const base = mapRowToCollectible(data)
      const owner = data.users || {}

      setCollectible({
        ...base,
        userId: data.user_id,
        ownerUsername: owner.username ?? null,
        ownerDisplayName: owner.display_name ?? null,
        ownerAvatar: owner.avatar ?? null,
        listingTitle: data.listing_title ?? null,
        listingDescription: data.listing_description ?? null,
        acquisitionPrice: data.acquisition_price ?? null,
        aiMetadata: data.ai_metadata ?? null,
        traitMetadata: data.trait_metadata ?? null,
        spatialMetadata: data.spatial_metadata ?? null,
        yearMin: data.year_min ?? null,
        yearMax: data.year_max ?? null,
        collectibleType: data.collectible_type ?? null,
        subcategory: data.subcategory ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [collectibleId, viewerUserId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { collectible, loading, error, refetch }
}
