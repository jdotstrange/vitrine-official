"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Radar } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import { EmptyState } from "@/components/vault"
import type { TrackedCompItem } from "@vitrine/api"

export default function TrackedCompsLensPage() {
  const { profile } = useUser()
  const [comps, setComps] = useState<TrackedCompItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    getClientApi()
      .comps.getTrackedComps(profile.id, 60)
      .then(setComps)
      .catch((err) => console.warn("[Comps] load failed", err))
      .finally(() => setLoading(false))
  }, [profile?.id])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-frost-border/10 rounded-lg animate-pulse"
            style={{ aspectRatio: "1 / 1.4" }}
          />
        ))}
      </div>
    )
  }

  if (comps.length === 0) {
    return (
      <EmptyState
        icon={<Radar size={20} color="var(--fg2)" />}
        title="No comps yet"
        subtitle="Comparable matches for items you track will surface here."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {comps.map((c) => (
        <Link
          key={c.id}
          href={`/v/collectible/${c.sourceCollectibleId}`}
          className="rounded-lg border border-frost-border bg-sheet-bg overflow-hidden hover:border-frost-border-strong transition-colors"
        >
          <div
            className="bg-void"
            style={{ aspectRatio: "1 / 1" }}
          >
            {c.image && (
              <img
                src={c.image}
                alt={c.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-3">
            <p className="text-fg3 text-[10px] uppercase font-mono mb-1 truncate">
              For: {c.sourceTitle}
            </p>
            <p className="text-fg1 text-[12px] line-clamp-2 mb-1.5">{c.title}</p>
            <div className="flex justify-between items-center">
              <span
                className="font-mono text-fg1 font-semibold text-[13px]"
              >
                ${c.value.toLocaleString()}
              </span>
              <span className="font-mono text-fg3 text-[10px]">
                {Math.round(c.scoreFraction * 100)}%
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
