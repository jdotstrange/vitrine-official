"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Flame } from "lucide-react"
import { getClientApi } from "@/lib/api-client"
import { CollectibleCard, EmptyState } from "@/components/vault"
import type { HotItem } from "@vitrine/api"

export default function HotPage() {
  const [items, setItems] = useState<HotItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClientApi()
      .explore.getHotItems(60)
      .then(setItems)
      .catch((err) => console.warn("[Hot] failed", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonGrid />

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Flame size={20} color="var(--fg2)" />}
        title="No hot items right now"
        subtitle="Check back later — the list refreshes throughout the day."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((it) => (
        <CollectibleCard
          key={it.id}
          item={{
            id: it.id,
            title: it.title,
            photoUrl: it.image,
            status: it.status,
            viewCount: it.savesCount,
          }}
        />
      ))}
    </div>
  )
}

function SkeletonGrid() {
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
