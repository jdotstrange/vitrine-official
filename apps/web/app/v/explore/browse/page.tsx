"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Filter } from "lucide-react"
import { getClientApi } from "@/lib/api-client"
import { useUser } from "@/lib/contexts/user-context"
import { CollectibleCard, EmptyState } from "@/components/vault"
import type { BrowseFilters, BrowseResult, ListingStatus } from "@vitrine/api"

type SortKey = "recent" | "price-high" | "price-low" | "alpha"

export default function BrowsePage() {
  const { profile } = useUser()
  const params = useSearchParams()
  const [search, setSearch] = useState(() => params.get("q") ?? "")
  const [statuses, setStatuses] = useState<ListingStatus[]>([])
  const [sort, setSort] = useState<SortKey>("recent")
  const [items, setItems] = useState<BrowseResult[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filters: BrowseFilters = {
        search: search || undefined,
        statuses: statuses.length > 0 ? statuses : undefined,
        sort,
        limit: 60,
        excludeUserId: profile?.id,
      }
      const result = await getClientApi().explore.browseCollectibles(filters)
      setItems(result)
    } catch (err) {
      console.warn("[Browse] failed", err)
    } finally {
      setLoading(false)
    }
  }, [search, statuses, sort, profile?.id])

  useEffect(() => {
    const timer = setTimeout(() => load(), 250)
    return () => clearTimeout(timer)
  }, [load])

  const toggleStatus = (s: ListingStatus) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3"
          />
          <input
            type="search"
            placeholder="Search across the marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-frost-border bg-sheet-bg pl-10 pr-3 py-3 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-fg3 text-[10px] uppercase font-grotesk font-bold tracking-[1.5px]">
            <Filter size={12} />
            Status
          </div>
          {(["FOR_SALE", "FOR_TRADE", "SELL_TRADE"] as ListingStatus[]).map((s) => {
            const active = statuses.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase font-semibold tracking-wider transition-colors ${
                  active
                    ? "border-brand-volt bg-brand-volt/10 text-fg1"
                    : "border-frost-border text-fg2 hover:text-fg1 hover:border-frost-border-strong"
                }`}
              >
                {s.replace("_", " + ")}
              </button>
            )
          })}

          <div className="flex-1" />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-frost-border bg-sheet-bg px-3 py-1.5 text-[12px] text-fg1"
          >
            <option value="recent">Recent</option>
            <option value="price-high">Price (high)</option>
            <option value="price-low">Price (low)</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

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
      ) : items.length === 0 ? (
        <EmptyState
          title="No matches"
          subtitle="Try adjusting your filters or search."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((it) => (
            <CollectibleCard
              key={it.id}
              item={{
                id: it.id,
                title: it.title,
                photoUrl: it.image,
                status: it.status,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
