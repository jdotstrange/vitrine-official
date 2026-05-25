"use client"

import { useEffect, useState } from "react"
import { Radar } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { CollectibleCard, EmptyState } from "@/components/vault"
import { mapRowToCollectible, type CollectibleListItem } from "@/lib/hooks"

export default function TrackedLensPage() {
  const { profile } = useUser()
  const [items, setItems] = useState<CollectibleListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const supabase = createClient()
    async function load() {
      const { data: tracks } = await supabase
        .from("user_tracks")
        .select("collectible_id, created_at")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })

      const ids = (tracks ?? []).map((t: any) => t.collectible_id)
      if (ids.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const { data: rows } = await supabase
        .from("collectibles")
        .select(
          "id, title, photos, value, available_for_sale, available_for_trade, trait_metadata, view_count, created_at, category, description, privacy, visibility, extraction_status, published_at",
        )
        .in("id", ids)
        .not("published_at", "is", null)

      setItems((rows ?? []).map(mapRowToCollectible))
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [profile?.id])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-frost-border/10 rounded-lg animate-pulse"
            style={{ aspectRatio: "4 / 5" }}
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Radar size={20} color="var(--fg2)" />}
        title="No tracked items yet"
        subtitle="Track items from any collectible page to watch them here."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <CollectibleCard
          key={item.id}
          item={{
            id: item.id,
            title: item.title,
            photoUrl: item.photoUrl,
            status: item.status,
            viewCount: item.viewCount,
          }}
        />
      ))}
    </div>
  )
}
