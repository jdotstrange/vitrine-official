"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { deriveStatus, type ListingStatus } from "@/lib/design"

export interface CollectibleListItem {
  id: string
  title: string
  photoUrl: string | null
  photos: string[]
  status: ListingStatus
  value: number
  traits: string[]
  viewCount?: number
  trackingCount?: number
  createdAt: string
  category?: string | null
  description?: string | null
  visibility?: string | null
}

interface UseCollectiblesOptions {
  userId?: string
  limit?: number
  /**
   * When true (default), filters to rows that have been published —
   * `published_at IS NOT NULL`. Set to false only for owner-side
   * surfaces that need to surface unpublished items (e.g. queue review).
   */
  publicOnly?: boolean
}

/**
 * Fetch a user's collectibles via direct Supabase query.
 *
 * Web mirrors apps/native/lib/api/collectibles.ts (getUserCollectibles)
 * but inlined here because the native module depends on
 * expo-image-manipulator and isn't safe to import in the web bundle.
 */
export function useCollectibles({
  userId,
  limit,
  publicOnly = true,
}: UseCollectiblesOptions = {}) {
  const [collectibles, setCollectibles] = useState<CollectibleListItem[]>([])
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
      let query = supabase
        .from("collectibles")
        .select(
          "id, title, photos, value, available_for_sale, available_for_trade, trait_metadata, category, description, privacy, visibility, view_count, created_at, extraction_status, published_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (publicOnly) {
        query = query.not("published_at", "is", null)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setCollectibles(
        (data ?? []).map((row: any) => mapRowToCollectible(row)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [userId, limit, publicOnly])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { collectibles, loading, error, refetch }
}

export function mapRowToCollectible(row: any): CollectibleListItem {
  const traits = Array.isArray(row.trait_metadata)
    ? row.trait_metadata
        .filter((t: any) => typeof t === "string")
        .map((t: string) => t.toString())
    : []

  return {
    id: row.id,
    title: row.title || "Untitled",
    photoUrl: Array.isArray(row.photos) && row.photos[0] ? row.photos[0] : null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    status: deriveStatus(row.available_for_sale, row.available_for_trade),
    value:
      typeof row.value === "number" ? row.value : parseFloat(row.value) || 0,
    traits,
    viewCount: typeof row.view_count === "number" ? row.view_count : 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    category: row.category ?? null,
    description: row.description ?? null,
    visibility: row.visibility ?? row.privacy ?? "public",
  }
}
