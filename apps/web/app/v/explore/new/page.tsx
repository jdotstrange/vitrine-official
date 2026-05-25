"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { getClientApi } from "@/lib/api-client"
import { CollectibleCard, EmptyState } from "@/components/vault"
import type { NewListing } from "@vitrine/api"

export default function NewListingsPage() {
  const [items, setItems] = useState<NewListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClientApi()
      .explore.getNewListings(60)
      .then(setItems)
      .catch((err) => console.warn("[New] failed", err))
      .finally(() => setLoading(false))
  }, [])

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
        icon={<Sparkles size={20} color="var(--fg2)" />}
        title="No new listings right now"
        subtitle="Items listed in the last 24 hours will surface here."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((it) => (
        <div key={it.id} className="space-y-1">
          <CollectibleCard
            item={{
              id: it.id,
              title: it.title,
              photoUrl: it.image,
              status: it.status,
            }}
          />
          <p className="text-fg3 text-[10px] font-mono uppercase">
            {it.listedAgo}
          </p>
        </div>
      ))}
    </div>
  )
}
