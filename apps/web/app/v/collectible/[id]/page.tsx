"use client"

import { use, useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Lock, Target, Eye } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useCollectible } from "@/lib/hooks/use-collectible"
import { useTrack } from "@/lib/hooks/use-track"
import {
  HolographicFrame,
  LensSelector,
  StatusPill,
  TraitPill,
  EmptyState,
  type LensItem,
} from "@/components/vault"
import { recordView } from "@/lib/views"

type LensKey = "specs" | "pulse" | "aar" | "var" | "comps" | "showcases"

const LENSES: LensItem<LensKey>[] = [
  { key: "specs", label: "Specs" },
  { key: "pulse", label: "Pulse" },
  { key: "aar", label: "AAR", locked: true },
  { key: "var", label: "VAR", locked: true },
  { key: "comps", label: "Comps" },
  { key: "showcases", label: "Showcases" },
]

export default function CollectibleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { profile } = useUser()
  const { collectible, loading, error, refetch } = useCollectible(id, {
    viewerUserId: profile?.id,
  })
  const { isTracked, trackCount, toggle: toggleTrack, pending: trackPending } = useTrack(id)
  const [lens, setLens] = useState<LensKey>("specs")
  const [photoIdx, setPhotoIdx] = useState(0)

  const isOwner = !!profile && !!collectible && profile.id === collectible.userId

  useEffect(() => {
    if (!collectible) return
    recordView("collectible", collectible.id, collectible.userId)
  }, [collectible])

  if (loading) {
    return (
      <div className="px-8 py-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-frost-border/10 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-[5/7] bg-frost-border/10 rounded" />
            <div className="space-y-4">
              <div className="h-10 bg-frost-border/10 rounded" />
              <div className="h-4 bg-frost-border/10 rounded w-3/4" />
              <div className="h-4 bg-frost-border/10 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !collectible) {
    return (
      <div className="px-8 py-24">
        <EmptyState
          title="Collectible not found"
          subtitle="It may have been deleted or you may not have permission to view it."
          action={
            <Link
              href="/v/collection"
              className="text-brand-volt text-sm hover:underline"
            >
              Back to collection
            </Link>
          }
        />
      </div>
    )
  }

  const photos = collectible.photos.length > 0 ? collectible.photos : [null]

  return (
    <div className="min-h-screen">
      {/* Top nav strip */}
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href="/v/collection"
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Collection</span>
        </Link>
        {isOwner && (
          <Link
            href={`/v/collectible/${collectible.id}/edit`}
            className="flex items-center gap-2 rounded-md border border-frost-border px-3 py-1.5 text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors text-[12px] uppercase font-semibold tracking-wider"
          >
            <Pencil size={12} />
            Edit
          </Link>
        )}
      </div>

      {/* Hero */}
      <div className="px-8 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Photo well */}
          <div>
            <HolographicFrame borderRadius={12}>
              <div
                className="rounded-xl overflow-hidden bg-void border border-frost-border-strong p-1"
                style={{ aspectRatio: "5 / 7" }}
              >
                {photos[photoIdx] ? (
                  <img
                    src={photos[photoIdx]!}
                    alt={collectible.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-fg3 font-mono text-4xl">
                    —
                  </div>
                )}
              </div>
            </HolographicFrame>
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`shrink-0 rounded border-2 overflow-hidden transition-colors ${
                      i === photoIdx ? "border-brand-volt" : "border-frost-border"
                    }`}
                    style={{ width: 56, height: 56 }}
                  >
                    {p ? (
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-sheet-bg" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Identity strip */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill status={collectible.status} />
              {collectible.traits.map((t) => (
                <TraitPill key={t} traitKey={t} />
              ))}
            </div>

            <h1
              className="text-fg1"
              style={{
                fontFamily: "var(--font-grotesk)",
                fontSize: 32,
                lineHeight: "38px",
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {collectible.title}
            </h1>

            <Link
              href={`/v/profile/${collectible.userId}`}
              className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors w-fit"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-frost-border/20 flex items-center justify-center">
                {collectible.ownerAvatar ? (
                  <img
                    src={collectible.ownerAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px]">
                    {(collectible.ownerDisplayName ?? collectible.ownerUsername ?? "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[13px]">
                {collectible.ownerDisplayName ?? `@${collectible.ownerUsername}`}
              </span>
            </Link>

            {/* Value */}
            <div className="border-t border-frost-divider pt-4">
              <p
                className="uppercase text-fg3"
                style={{
                  fontFamily: "var(--font-grotesk)",
                  fontSize: 9,
                  letterSpacing: 1.35,
                  fontWeight: 700,
                }}
              >
                Estimated Value
              </p>
              <p
                className="text-fg1"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 28,
                  letterSpacing: -0.5,
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                ${collectible.value.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 border-t border-frost-divider pt-4">
              <div>
                <p className="text-fg3 text-[10px] font-mono">VIEWS</p>
                <p className="text-fg1 font-mono mt-0.5 flex items-center gap-1.5">
                  <Eye size={12} />
                  {(collectible.viewCount ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-fg3 text-[10px] font-mono">TRACKING</p>
                <p className="text-fg1 font-mono mt-0.5 flex items-center gap-1.5">
                  <Target size={12} />
                  {trackCount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action */}
            {!isOwner && (
              <button
                type="button"
                onClick={toggleTrack}
                disabled={trackPending}
                className={`mt-2 flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-[12px] uppercase font-semibold tracking-wider transition-colors ${
                  isTracked
                    ? "border-trait-olive text-trait-olive"
                    : "border-frost-border text-fg2 hover:text-fg1 hover:border-frost-border-strong"
                }`}
                style={{
                  color: isTracked ? "var(--trait-olive)" : undefined,
                  borderColor: isTracked ? "var(--trait-olive)" : undefined,
                }}
              >
                <Target size={14} fill={isTracked ? "var(--trait-olive)" : "none"} />
                {isTracked ? "Tracking" : "Track"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lens selector */}
      <div className="sticky top-0 z-10 bg-void">
        <LensSelector
          items={LENSES}
          activeKey={lens}
          onChange={(k) => setLens(k)}
        />
      </div>

      {/* Lens content */}
      <div className="px-8 py-8 max-w-7xl mx-auto">
        {lens === "specs" && <SpecsLens collectible={collectible} />}
        {lens === "pulse" && <PulseLens collectibleId={collectible.id} />}
        {lens === "aar" && <PaywallLens lens="AAR" />}
        {lens === "var" && <PaywallLens lens="VAR" />}
        {lens === "comps" && <CompsLens collectibleId={collectible.id} />}
        {lens === "showcases" && <ShowcasesLens collectibleId={collectible.id} userId={collectible.userId} />}
      </div>
    </div>
  )
}

// ─── Lens components ──────────────────────────────────────────

function SpecsLens({ collectible }: { collectible: any }) {
  const fields: { label: string; value: string | null }[] = [
    { label: "Type", value: collectible.collectibleType ?? null },
    { label: "Category", value: collectible.category ?? null },
    { label: "Subcategory", value: collectible.subcategory ?? null },
    {
      label: "Year",
      value:
        collectible.yearMin && collectible.yearMax
          ? collectible.yearMin === collectible.yearMax
            ? String(collectible.yearMin)
            : `${collectible.yearMin}–${collectible.yearMax}`
          : null,
    },
    { label: "Privacy", value: collectible.visibility ?? "public" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Description */}
      <div className="md:col-span-2">
        <h3 className="text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px] mb-2">
          Description
        </h3>
        <p className="text-fg1 text-sm leading-relaxed whitespace-pre-wrap">
          {collectible.listingDescription ||
            collectible.description ||
            "No description provided."}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px]">
          Details
        </h3>
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between border-b border-frost-divider py-2">
            <span className="text-fg2 text-[11px] uppercase tracking-wide">
              {f.label}
            </span>
            <span className="text-fg1 text-sm">{f.value ?? "—"}</span>
          </div>
        ))}
      </div>

      {collectible.aiMetadata && (
        <div>
          <h3 className="text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px] mb-2">
            AI Metadata
          </h3>
          <pre className="text-[11px] text-fg2 font-mono bg-sheet-bg border border-frost-border rounded-md p-3 overflow-x-auto max-h-64">
            {JSON.stringify(collectible.aiMetadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function PulseLens({ collectibleId }: { collectibleId: string }) {
  const [stats, setStats] = useState<{
    views7d: number
    views30d: number
    trackingCount: number
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ count: views7 }, { count: views30 }, { count: tracking }] =
        await Promise.all([
          supabase
            .from("recent_views")
            .select("id", { count: "exact", head: true })
            .eq("collectible_id", collectibleId)
            .gte(
              "viewed_at",
              new Date(Date.now() - 7 * 86400_000).toISOString(),
            ),
          supabase
            .from("recent_views")
            .select("id", { count: "exact", head: true })
            .eq("collectible_id", collectibleId)
            .gte(
              "viewed_at",
              new Date(Date.now() - 30 * 86400_000).toISOString(),
            ),
          supabase
            .from("user_tracks")
            .select("id", { count: "exact", head: true })
            .eq("collectible_id", collectibleId),
        ])
      setStats({
        views7d: views7 ?? 0,
        views30d: views30 ?? 0,
        trackingCount: tracking ?? 0,
      })
    }
    load().catch(() => {})
  }, [collectibleId])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PulseMetric label="Views · 7d" value={stats?.views7d ?? 0} />
      <PulseMetric label="Views · 30d" value={stats?.views30d ?? 0} />
      <PulseMetric label="Tracking" value={stats?.trackingCount ?? 0} />
    </div>
  )
}

function PulseMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-frost-border bg-sheet-bg p-5 relative overflow-hidden">
      <p className="text-fg3 uppercase text-[9px] font-grotesk font-bold tracking-[1.35px]">
        {label}
      </p>
      <p
        className="text-fg1 mt-2"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 28,
          letterSpacing: -0.5,
          fontWeight: 500,
        }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function PaywallLens({ lens }: { lens: string }) {
  return (
    <div className="rounded-xl border border-frost-border bg-sheet-bg p-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full border border-frost-border flex items-center justify-center mb-4">
        <Lock size={18} color="var(--brand-volt)" />
      </div>
      <h3 className="text-fg1 font-grotesk font-bold uppercase tracking-wider text-sm mb-2">
        {lens} — Pro Lens
      </h3>
      <p className="text-fg2 text-sm max-w-md">
        Upgrade to Pro to unlock the {lens} lens and surface deeper analytics
        for this collectible.
      </p>
      <Link
        href="/v/settings/billing"
        className="mt-5 rounded-md bg-brand-volt px-5 py-2 text-text-inverse text-[12px] uppercase font-semibold tracking-wider hover:opacity-90 transition-opacity"
      >
        See Pro
      </Link>
    </div>
  )
}

function CompsLens({ collectibleId }: { collectibleId: string }) {
  const [comps, setComps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data } = await supabase
        .from("collectible_comps")
        .select("id, comp_title, comp_image, comp_price, match_percent, sold_at")
        .eq("collectible_id", collectibleId)
        .order("match_percent", { ascending: false })
        .limit(20)
      setComps(data ?? [])
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [collectibleId])

  if (loading) {
    return <div className="text-fg3 text-sm">Loading comps...</div>
  }

  if (comps.length === 0) {
    return (
      <EmptyState
        title="No comps yet"
        subtitle="Comparable sales will appear here as we discover them."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {comps.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-frost-border bg-sheet-bg overflow-hidden"
        >
          <div
            className="bg-void"
            style={{ aspectRatio: "1 / 1" }}
          >
            {c.comp_image && (
              <img
                src={c.comp_image}
                alt={c.comp_title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-3">
            <p className="text-fg1 text-[12px] line-clamp-2 mb-1.5">
              {c.comp_title}
            </p>
            <div className="flex justify-between items-center">
              <span
                className="font-mono text-fg1 font-semibold text-[13px]"
              >
                ${(c.comp_price ?? 0).toLocaleString()}
              </span>
              <span className="font-mono text-fg3 text-[10px]">
                {Math.round((c.match_percent ?? 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ShowcasesLens({
  collectibleId,
  userId,
}: {
  collectibleId: string
  userId: string
}) {
  const [showcases, setShowcases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data } = await supabase
        .from("showcase_collectibles")
        .select(
          "showcase_id, showcases!inner (id, title, user_id, showcase_type)",
        )
        .eq("collectible_id", collectibleId)
      setShowcases((data ?? []).map((r: any) => r.showcases))
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [collectibleId])

  if (loading) {
    return <div className="text-fg3 text-sm">Loading...</div>
  }

  if (showcases.length === 0) {
    return (
      <EmptyState
        title="Not in any showcase yet"
        subtitle="Add this collectible to a showcase to feature it on your profile."
      />
    )
  }

  return (
    <div className="space-y-2">
      {showcases.map((s) => (
        <Link
          key={s.id}
          href={`/v/showcase/${s.id}`}
          className="flex items-center justify-between rounded-md border border-frost-border bg-sheet-bg p-4 hover:border-frost-border-strong transition-colors"
        >
          <div>
            <p className="text-fg1 text-sm font-semibold">{s.title}</p>
            <p className="text-fg3 text-[10px] uppercase font-mono tracking-wider mt-0.5">
              {s.showcase_type}
            </p>
          </div>
          <span className="text-fg2 text-sm">→</span>
        </Link>
      ))}
    </div>
  )
}
