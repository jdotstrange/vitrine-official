"use client"

import { useMemo, useState } from "react"
import { useUser } from "@/lib/contexts/user-context"
import { useCollectibles } from "@/lib/hooks"
import { CollectibleCard, EmptyState, LensSelector } from "@/components/vault"
import { Boxes } from "lucide-react"

type SortKey = "newest" | "oldest" | "value-desc" | "title"

const SORT_ITEMS = [
  { key: "newest", label: "Newest" },
  { key: "value-desc", label: "Value" },
  { key: "title", label: "Title" },
  { key: "oldest", label: "Oldest" },
] as const

export default function CollectionPage() {
  const { profile } = useUser()
  const { collectibles, loading } = useCollectibles({ userId: profile?.id })
  const [sort, setSort] = useState<SortKey>("newest")
  const [filter, setFilter] = useState("")

  const sorted = useMemo(() => {
    const filtered = filter
      ? collectibles.filter((c) =>
          c.title.toLowerCase().includes(filter.toLowerCase()),
        )
      : collectibles

    const list = [...filtered]
    switch (sort) {
      case "newest":
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      case "oldest":
        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        break
      case "value-desc":
        list.sort((a, b) => b.value - a.value)
        break
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
    }
    return list
  }, [collectibles, sort, filter])

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-frost-border">
        <div className="px-8 py-6">
          <h1
            className="text-fg1 uppercase"
            style={{
              fontFamily: "var(--font-grotesk)",
              fontSize: 28,
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            Collection
          </h1>
          <p className="text-fg2 text-sm mt-1">
            {collectibles.length.toLocaleString()} item
            {collectibles.length === 1 ? "" : "s"}
          </p>
        </div>
        <LensSelector
          items={SORT_ITEMS}
          activeKey={sort}
          onChange={(k) => setSort(k as SortKey)}
        />
      </div>

      {/* Filter bar */}
      <div className="px-8 pt-6">
        <input
          type="search"
          placeholder="Search your collection..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
        />
      </div>

      {/* Grid */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-frost-border/10 rounded-lg animate-pulse"
                style={{ aspectRatio: "4 / 5" }}
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Boxes size={20} color="var(--fg2)" />}
            title="No collectibles yet"
            subtitle={
              filter
                ? "No items match your search."
                : "Use Catalog to add your first piece."
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sorted.map((item) => (
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
        )}
      </div>
    </div>
  )
}
