"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"

// ─── Types ────────────────────────────────────────────────────

interface PortfolioData {
  collectionSize: number
  collectionValue: number
  followersCount: number
  followingCount: number
  crownJewel: {
    id: string
    title: string
    image: string
    value: number
    status: string
    createdAt: string
  } | null
  featuredShowcase: {
    id: string
    title: string
    itemCount: number
    previewImages: string[]
  } | null
  assetMatrix: { label: string; count: number; pct: number }[]
  statusBreakdown: { key: string; count: number; pct: number }[]
}

interface ActivityItem {
  id: string
  verb: string
  time: string
  title?: string
  image?: string
  detail?: string
}

// ─── Page ─────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { profile } = useUser()
  const [data, setData] = useState<PortfolioData | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return

    async function load() {
      const supabase = createClient()

      const [collectiblesRes, followersRes, followingRes, showcasesRes, userRow] =
        await Promise.all([
          supabase
            .from("collectibles")
            .select("id, title, photos, value, available_for_sale, available_for_trade, created_at, collectible_type, extraction_status")
            .eq("user_id", profile!.id)
            .not("published_at", "is", null)
            .not("listing_title", "is", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", profile!.id),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", profile!.id),
          supabase
            .from("showcases")
            .select("id, title")
            .eq("user_id", profile!.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("users")
            .select("crown_jewel_collectible_id, featured_showcase_id")
            .eq("id", profile!.id)
            .single(),
        ])

      const collectibles = collectiblesRes.data ?? []
      const followersCount = followersRes.count ?? 0
      const followingCount = followingRes.count ?? 0
      const collectionSize = collectibles.length
      const collectionValue = collectibles.reduce(
        (sum, c) => sum + (typeof c.value === "number" ? c.value : parseFloat(c.value) || 0), 0
      )

      // Asset Matrix
      const typeCounts = new Map<string, number>()
      collectibles.forEach((c) => {
        const t = (c.collectible_type || "other").toUpperCase().replace("_", " ")
        typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
      })
      const total = collectibles.length || 1
      const assetMatrix = Array.from(typeCounts.entries())
        .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)

      // Status Breakdown
      const statusCounts = { NFST: 0, FOR_SALE: 0, FOR_TRADE: 0, SELL_TRADE: 0 }
      collectibles.forEach((c) => {
        if (c.available_for_sale && c.available_for_trade) statusCounts.SELL_TRADE++
        else if (c.available_for_sale) statusCounts.FOR_SALE++
        else if (c.available_for_trade) statusCounts.FOR_TRADE++
        else statusCounts.NFST++
      })
      const statusBreakdown = Object.entries(statusCounts).map(([key, count]) => ({
        key, count, pct: Math.round((count / total) * 100),
      }))

      // Crown Jewel
      let crownJewel: PortfolioData["crownJewel"] = null
      const crownJewelId = userRow.data?.crown_jewel_collectible_id
      const resolveJewel = (c: any) => ({
        id: c.id, title: c.title || "Untitled", image: c.photos?.[0] || "",
        value: typeof c.value === "number" ? c.value : parseFloat(c.value) || 0,
        status: deriveStatus(c.available_for_sale, c.available_for_trade),
        createdAt: c.created_at,
      })
      if (crownJewelId) {
        const cj = collectibles.find((c) => c.id === crownJewelId)
        if (cj) crownJewel = resolveJewel(cj)
      }
      if (!crownJewel && collectibles.length > 0) {
        const sorted = [...collectibles].sort((a, b) => {
          const av = typeof a.value === "number" ? a.value : parseFloat(a.value) || 0
          const bv = typeof b.value === "number" ? b.value : parseFloat(b.value) || 0
          return bv - av
        })
        if (sorted[0]) crownJewel = resolveJewel(sorted[0])
      }

      // Featured Showcase
      let featuredShowcase: PortfolioData["featuredShowcase"] = null
      const featuredId = userRow.data?.featured_showcase_id
      const showcaseRow = featuredId
        ? showcasesRes.data?.find((s) => s.id === featuredId) ?? showcasesRes.data?.[0]
        : showcasesRes.data?.[0]
      if (showcaseRow) {
        const { data: scItems, count: scCount } = await supabase
          .from("showcase_collectibles")
          .select("collectible_id", { count: "exact" })
          .eq("showcase_id", showcaseRow.id)
          .order("display_order", { ascending: true })
          .limit(3)
        let previewImages: string[] = []
        if (scItems && scItems.length > 0) {
          const ids = scItems.map((s) => s.collectible_id)
          const { data: rows } = await supabase.from("collectibles").select("photos").in("id", ids)
          previewImages = (rows ?? []).map((r) => r.photos?.[0]).filter(Boolean) as string[]
        }
        featuredShowcase = { id: showcaseRow.id, title: showcaseRow.title, itemCount: scCount ?? 0, previewImages }
      }

      setData({ collectionSize, collectionValue, followersCount, followingCount, crownJewel, featuredShowcase, assetMatrix, statusBreakdown })

      // ─── Activity Feed (Journal entries) ──────────────────
      const [listedRes, showcasesJournalRes, changeLogRes, followActivityRes] = await Promise.all([
        supabase
          .from("collectibles")
          .select("id, title, photos, created_at")
          .eq("user_id", profile!.id)
          .not("published_at", "is", null)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("showcases")
          .select("id, title, created_at")
          .eq("user_id", profile!.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("collectible_change_log")
          .select("id, collectible_id, change_type, prev_value, new_value, created_at")
          .eq("user_id", profile!.id)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("follows")
          .select("id, follower_id, created_at")
          .eq("following_id", profile!.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      const activityItems: ActivityItem[] = []

      for (const r of listedRes.data ?? []) {
        activityItems.push({
          id: `listed:${r.id}`,
          verb: "listed",
          time: r.created_at,
          title: r.title || "Untitled",
          image: r.photos?.[0],
        })
      }
      for (const r of showcasesJournalRes.data ?? []) {
        activityItems.push({
          id: `showcase:${r.id}`,
          verb: "showcase",
          time: r.created_at,
          title: r.title || "Untitled",
        })
      }
      for (const r of changeLogRes.data ?? []) {
        const verb = r.change_type === "value" ? "value_change" : "status_change"
        const detail = r.change_type === "value"
          ? `→ $${(r.new_value as any)?.amount ?? "?"}`
          : `→ ${formatStatusChange(r.new_value)}`
        activityItems.push({
          id: `change:${r.id}`,
          verb,
          time: r.created_at,
          title: r.collectible_id.slice(0, 8),
          detail,
        })
      }
      for (const r of followActivityRes.data ?? []) {
        activityItems.push({
          id: `follow:${r.id}`,
          verb: "new_follower",
          time: r.created_at,
          title: r.follower_id,
        })
      }

      activityItems.sort((a, b) => (a.time < b.time ? 1 : -1))
      setActivity(activityItems.slice(0, 40))
      setIsLoading(false)
    }
    load()
  }, [profile])

  if (isLoading) {
    return (
      <div className="h-full flex gap-5 p-6">
        <div className="flex-1 space-y-4">
          <div className="h-12 rounded-lg bg-sheet-bg/50 animate-pulse" />
          <div className="h-64 rounded-2xl bg-sheet-bg/50 animate-pulse" />
          <div className="h-32 rounded-xl bg-sheet-bg/50 animate-pulse" />
        </div>
        <div className="w-80 rounded-xl bg-sheet-bg/50 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex gap-5 p-6 overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════
          LEFT PANEL — The Portrait (no scroll)
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
        {/* Profile strip + value — merged into one tight block */}
        <header className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg border border-frost-border overflow-hidden shrink-0">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sheet-bg flex items-center justify-center">
                <span className="text-xs font-grotesk text-fg3">{(profile?.display_name ?? "U").charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-grotesk font-semibold text-fg1 truncate">
              {profile?.display_name ?? profile?.username ?? "Collector"}
            </h1>
            <p className="text-[9px] font-mono text-brand-volt tracking-[1px]">
              @{(profile?.username ?? "collector").toUpperCase()}
            </p>
          </div>
          {/* Portfolio Value — inline with profile, not a separate section */}
          <div className="text-right">
            <p className="text-2xl font-mono font-semibold text-fg1 tracking-tight">
              <span className="text-fg3/50">$</span>{formatValue(data?.collectionValue ?? 0)}
            </p>
            <p className="text-[8px] text-fg3 uppercase tracking-wider">{data?.collectionSize} items</p>
          </div>
        </header>

        {/* Crown Jewel — the hero image, cinematic */}
        {data?.crownJewel && (
          <div className="relative rounded-xl overflow-hidden flex-1 min-h-0 group">
            <div className="absolute inset-0 bg-void">
              {data.crownJewel.image ? (
                <img
                  src={data.crownJewel.image}
                  alt={data.crownJewel.title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full bg-sheet-bg" />
              )}
              {/* Scrim — lighter than before, let the image breathe */}
              <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/30 to-transparent" />
            </div>

            {/* Content pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[7px] font-bold uppercase tracking-[2px] text-brand-volt">Crown Jewel</span>
                <StatusPill status={data.crownJewel.status} />
              </div>
              <h3 className="text-base font-medium text-fg1 line-clamp-1">{data.crownJewel.title}</h3>
              <div className="flex items-baseline gap-3 mt-0.5">
                <p className="text-xl font-mono font-semibold text-fg1">
                  <span className="text-fg3/50">$</span>{data.crownJewel.value.toLocaleString()}
                </p>
                <p className="text-[8px] text-fg3">
                  {new Date(data.crownJewel.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Subtle holo edge glow */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] pointer-events-none" />
            <div className="absolute inset-0 rounded-xl holo-frame pointer-events-none" />
          </div>
        )}

        {/* Bottom strip: Showcase + Composition + Status — compressed horizontal */}
        <div className="flex gap-3 shrink-0">
          {/* Featured Showcase — compact */}
          {data?.featuredShowcase && (
            <Link
              href="/v/showcases"
              className="flex-1 rounded-lg border border-frost-border bg-sheet-bg p-3 hover:border-brand-volt/20 transition-colors group min-w-0"
            >
              <p className="text-[7px] text-brand-volt font-bold uppercase tracking-[1.5px] mb-1.5">Showcase</p>
              <div className="flex gap-1 h-10 mb-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex-1 rounded overflow-hidden bg-void">
                    {data.featuredShowcase!.previewImages[i] ? (
                      <img src={data.featuredShowcase!.previewImages[i]} alt="" className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full" />}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-fg2 truncate">{data.featuredShowcase.title}</p>
              <p className="text-[8px] text-fg3">{data.featuredShowcase.itemCount} items</p>
            </Link>
          )}

          {/* Composition — stacked bar, tight */}
          {data?.assetMatrix && data.assetMatrix.length > 0 && (
            <div className="flex-1 rounded-lg border border-frost-border bg-sheet-bg p-3 min-w-0">
              <p className="text-[7px] text-fg3 font-bold uppercase tracking-[1.5px] mb-2">Composition</p>
              <div className="h-2 rounded-full overflow-hidden flex bg-void mb-2">
                {data.assetMatrix.map((seg, i) => (
                  <div
                    key={seg.label}
                    className="h-full"
                    style={{ width: `${seg.pct}%`, backgroundColor: MATRIX_COLORS[i % MATRIX_COLORS.length] }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {data.assetMatrix.slice(0, 4).map((seg, i) => (
                  <span key={seg.label} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MATRIX_COLORS[i % MATRIX_COLORS.length] }} />
                    <span className="text-[8px] text-fg3">{seg.label} {seg.pct}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status — dense vertical pills */}
          <div className="w-28 shrink-0 rounded-lg border border-frost-border bg-sheet-bg p-3">
            <p className="text-[7px] text-fg3 font-bold uppercase tracking-[1.5px] mb-2">Status</p>
            <div className="space-y-1.5">
              {data?.statusBreakdown.filter((s) => s.count > 0).map(({ key, count, pct }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CHROME[key]?.dot }} />
                    <span className="text-[8px] text-fg2">{STATUS_LABELS[key]}</span>
                  </div>
                  <span className="text-[9px] font-mono text-fg1">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL — Activity Feed (internal scroll)
      ═══════════════════════════════════════════════════════════ */}
      <aside className="w-72 xl:w-80 shrink-0 flex flex-col rounded-xl border border-frost-border bg-sheet-bg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-frost-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-fg3 uppercase tracking-[1.5px]">Activity</p>
            <Link href="/v/activity" className="text-[8px] text-fg3 hover:text-brand-volt transition-colors uppercase tracking-wide">
              All →
            </Link>
          </div>
        </div>

        {/* Feed — scrollable with fade-to-top */}
        <div className="flex-1 relative overflow-hidden">
          {/* Fade gradient at top */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-sheet-bg to-transparent z-10 pointer-events-none" />

          <div className="h-full overflow-y-auto px-4 pt-6 pb-3 space-y-0">
            {activity.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[10px] text-fg3">No activity yet</p>
              </div>
            ) : (
              activity.map((item, i) => (
                <ActivityRow key={item.id} item={item} isLast={i === activity.length - 1} />
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Activity Row ─────────────────────────────────────────────

function ActivityRow({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const config = VERB_CHROME[item.verb] ?? VERB_CHROME.default

  return (
    <div className={`flex gap-2.5 py-2 ${!isLast ? "border-b border-frost-border/20" : ""}`}>
      {/* Dot indicator */}
      <div className="pt-1.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: config.dot }}>
            {config.label}
          </span>
          <span className="text-[8px] text-fg3 font-mono">{formatTimeAgo(item.time)}</span>
        </div>
        <p className="text-[10px] text-fg2 truncate mt-0.5">
          {item.title}
          {item.detail && <span className="text-fg3"> {item.detail}</span>}
        </p>
      </div>

      {/* Thumbnail (if image exists) */}
      {item.image && (
        <div className="w-7 h-7 rounded shrink-0 overflow-hidden bg-void">
          <img src={item.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const chrome = STATUS_CHROME[status]
  const label = STATUS_LABELS[status] ?? status
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide border"
      style={{ backgroundColor: chrome?.fill, borderColor: chrome?.border, color: chrome?.text }}
    >
      {label}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function deriveStatus(forSale: boolean, forTrade: boolean): string {
  if (forSale && forTrade) return "SELL_TRADE"
  if (forSale) return "FOR_SALE"
  if (forTrade) return "FOR_TRADE"
  return "NFST"
}

function formatValue(dollars: number): string {
  if (dollars >= 1_000_000) return `${(dollars / 1_000_000).toFixed(2)}M`
  if (dollars >= 1_000) return `${(dollars / 1_000).toFixed(1)}K`
  if (dollars === 0) return "0"
  return dollars.toLocaleString()
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  const wks = Math.floor(days / 7)
  return `${wks}w`
}

function formatStatusChange(val: unknown): string {
  if (!val || typeof val !== "object") return "updated"
  const v = val as Record<string, any>
  if (v.for_sale && v.for_trade) return "Sale + Trade"
  if (v.for_sale) return "For Sale"
  if (v.for_trade) return "For Trade"
  return "NFST"
}

const STATUS_LABELS: Record<string, string> = {
  NFST: "NFST", FOR_TRADE: "Trade", FOR_SALE: "Sale", SELL_TRADE: "Sale+Trade",
}

const STATUS_CHROME: Record<string, { fill: string; border: string; text: string; dot: string }> = {
  NFST: { fill: "rgba(200,200,200,0.06)", border: "rgba(200,200,200,0.15)", text: "var(--fg3)", dot: "var(--fg3)" },
  FOR_TRADE: { fill: "rgba(59,158,255,0.08)", border: "rgba(59,158,255,0.2)", text: "var(--semantic-blue)", dot: "var(--semantic-blue)" },
  FOR_SALE: { fill: "rgba(17,255,153,0.08)", border: "rgba(17,255,153,0.2)", text: "var(--semantic-green)", dot: "var(--semantic-green)" },
  SELL_TRADE: { fill: "rgba(255,170,50,0.08)", border: "rgba(255,170,50,0.2)", text: "var(--semantic-orange)", dot: "var(--semantic-orange)" },
}

const VERB_CHROME: Record<string, { label: string; dot: string }> = {
  listed: { label: "Listed", dot: "var(--brand-volt)" },
  showcase: { label: "Showcase", dot: "var(--semantic-blue)" },
  value_change: { label: "Value", dot: "var(--semantic-green)" },
  status_change: { label: "Status", dot: "var(--semantic-orange)" },
  new_follower: { label: "Follow", dot: "var(--brand-volt)" },
  default: { label: "Event", dot: "var(--fg3)" },
}

const MATRIX_COLORS = ["#E8E0D4", "#6B9B8A", "#4A7A8C", "#8B5E3C", "#C4956A", "#7B6B8A", "#5C8A6B", "#A89F94"]
