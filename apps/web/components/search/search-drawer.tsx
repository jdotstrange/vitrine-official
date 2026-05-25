"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { getClientApi } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"
import { Avatar, EmptyState } from "@/components/vault"
import type { SearchCollectibleResult, SearchUserResult } from "@vitrine/api"

type Tab = "all" | "collectibles" | "collectors" | "showcases"

interface ShowcaseHit {
  id: string
  title: string
  thumbs: string[]
  itemCount: number
}

interface Props {
  open: boolean
  onClose: () => void
}

const RECENT_KEY = "vitrine.search.recent"

function loadRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(list: string[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 10)))
  } catch {
    /* ignore */
  }
}

export function SearchDrawer({ open, onClose }: Props) {
  const router = useRouter()
  const { profile } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [recent, setRecent] = useState<string[]>([])

  const [collectibles, setCollectibles] = useState<SearchCollectibleResult[]>([])
  const [collectors, setCollectors] = useState<SearchUserResult[]>([])
  const [showcases, setShowcases] = useState<ShowcaseHit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setRecent(loadRecent())
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setCollectibles([])
      setCollectors([])
      setShowcases([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      const api = getClientApi()
      const supabase = createClient()
      const [cRes, uRes, sRes] = await Promise.allSettled([
        api.search.searchCollectibles(trimmed, {
          limit: 12,
          excludeUserId: profile?.id,
        }),
        api.search.searchUsers(trimmed, {
          limit: 12,
          excludeUserId: profile?.id,
        }),
        supabase.rpc("search_showcases_tiered", {
          p_query: trimmed,
          p_limit: 12,
        }),
      ])
      if (cancelled) return
      if (cRes.status === "fulfilled") setCollectibles(cRes.value)
      if (uRes.status === "fulfilled") setCollectors(uRes.value)
      if (sRes.status === "fulfilled") {
        const rows = (sRes.value.data ?? []) as Array<Record<string, any>>
        setShowcases(
          rows.map((r) => ({
            id: String(r.showcase_id ?? r.id ?? ""),
            title: String(r.title ?? "Untitled"),
            thumbs: Array.isArray(r.preview_thumbs) ? r.preview_thumbs : [],
            itemCount: Number(r.item_count ?? 0),
          })),
        )
      }
      setLoading(false)
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, open, profile?.id])

  const commitRecent = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 10)
    setRecent(next)
    saveRecent(next)
  }

  const goToBrowse = (q: string) => {
    commitRecent(q)
    onClose()
    router.push(`/v/explore/browse?q=${encodeURIComponent(q.trim())}`)
  }

  const trimmed = query.trim()
  const hasQuery = trimmed.length >= 2
  const showCol = tab === "all" || tab === "collectibles"
  const showUsers = tab === "all" || tab === "collectors"
  const showSc = tab === "all" || tab === "showcases"

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-sheet-bg border border-frost-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "calc(100vh - 6rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="border-b border-frost-border p-4 flex items-center gap-3">
          <Search size={18} className="text-fg2 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed) goToBrowse(trimmed)
            }}
            placeholder="Search collectibles, collectors, showcases..."
            className="flex-1 bg-transparent text-fg1 placeholder:text-fg3 outline-none text-base"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-fg3 hover:text-fg1 transition-colors shrink-0"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        {hasQuery && (
          <div className="border-b border-frost-border px-4 py-2 flex gap-1">
            {(["all", "collectibles", "collectors", "showcases"] as const).map(
              (t) => {
                const active = tab === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-brand-volt/15 text-fg1 border border-brand-volt/30"
                        : "text-fg3 hover:text-fg1 border border-transparent"
                    }`}
                  >
                    {t}
                  </button>
                )
              },
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!hasQuery ? (
            <RecentSection
              recent={recent}
              onSelect={(q) => {
                setQuery(q)
              }}
              onClear={() => {
                setRecent([])
                saveRecent([])
              }}
              onRemove={(q) => {
                const next = recent.filter((r) => r !== q)
                setRecent(next)
                saveRecent(next)
              }}
            />
          ) : loading &&
            collectibles.length === 0 &&
            collectors.length === 0 &&
            showcases.length === 0 ? (
            <div className="p-8 text-center text-fg3 text-sm">Searching...</div>
          ) : !loading &&
            collectibles.length === 0 &&
            collectors.length === 0 &&
            showcases.length === 0 ? (
            <EmptyState
              title="No results"
              subtitle="Try a different query."
            />
          ) : (
            <div className="divide-y divide-frost-border/50">
              {showCol && collectibles.length > 0 && (
                <Section title="Collectibles" count={collectibles.length}>
                  {collectibles.map((c) => (
                    <Link
                      key={c.id}
                      href={`/v/collectible/${c.id}`}
                      onClick={() => {
                        commitRecent(trimmed)
                        onClose()
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-frost-border/[0.06] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded shrink-0 bg-frost-border/20 overflow-hidden"
                        style={{
                          backgroundImage: c.image
                            ? `url(${c.image})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-fg1 truncate">{c.title}</p>
                        <p className="text-[11px] text-fg3 truncate">
                          {c.category}
                        </p>
                      </div>
                      {c.price ? (
                        <span className="text-[11px] font-mono text-fg2">
                          ${Math.round(c.price)}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </Section>
              )}

              {showUsers && collectors.length > 0 && (
                <Section title="Collectors" count={collectors.length}>
                  {collectors.map((u) => (
                    <Link
                      key={u.id}
                      href={`/v/profile/${u.id}`}
                      onClick={() => {
                        commitRecent(trimmed)
                        onClose()
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-frost-border/[0.06] transition-colors"
                    >
                      <Avatar
                        src={u.avatar ?? undefined}
                        name={u.displayName}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-fg1 truncate">
                          {u.displayName}
                        </p>
                        <p className="text-[11px] text-fg3 truncate">
                          @{u.username} · {u.collectiblesCount} items
                        </p>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}

              {showSc && showcases.length > 0 && (
                <Section title="Showcases" count={showcases.length}>
                  {showcases.map((s) => (
                    <Link
                      key={s.id}
                      href={`/v/showcase/${s.id}`}
                      onClick={() => {
                        commitRecent(trimmed)
                        onClose()
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-frost-border/[0.06] transition-colors"
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {(s.thumbs.length > 0
                          ? s.thumbs.slice(0, 3)
                          : [null, null, null]
                        ).map((t, i) => (
                          <div
                            key={i}
                            className="w-7 h-9 rounded-sm bg-frost-border/20 overflow-hidden"
                            style={{
                              backgroundImage: t ? `url(${t})` : undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-fg1 truncate">{s.title}</p>
                        <p className="text-[11px] text-fg3 truncate">
                          {s.itemCount}{" "}
                          {s.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecentSection({
  recent,
  onSelect,
  onClear,
  onRemove,
}: {
  recent: string[]
  onSelect: (q: string) => void
  onClear: () => void
  onRemove: (q: string) => void
}) {
  if (recent.length === 0) {
    return (
      <div className="p-8 text-center text-fg3 text-sm">
        Search anywhere with{" "}
        <kbd className="rounded border border-frost-border px-1.5 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-frost-border/50">
        <span className="text-[10px] text-fg3 uppercase tracking-wider font-grotesk font-bold">
          Recent
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-fg3 hover:text-fg1 transition-colors"
        >
          Clear all
        </button>
      </div>
      {recent.map((q) => (
        <div
          key={q}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-frost-border/[0.06] transition-colors group cursor-pointer"
          onClick={() => onSelect(q)}
        >
          <Search size={14} className="text-fg3 shrink-0" />
          <span className="flex-1 text-sm text-fg2">{q}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(q)
            }}
            className="text-fg3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-frost-border/[0.04]">
        <span className="text-[10px] text-fg3 uppercase tracking-wider font-grotesk font-bold">
          {title}
        </span>
        <span className="text-[10px] text-fg3 font-mono">{count}</span>
      </div>
      <div>{children}</div>
    </div>
  )
}
