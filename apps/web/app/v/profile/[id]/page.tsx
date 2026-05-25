"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { useCollectibles } from "@/lib/hooks/use-collectibles"
import { useShowcases } from "@/lib/hooks/use-showcases"
import { useFollow } from "@/lib/hooks/use-follow"
import {
  Avatar,
  CollectibleCard,
  CrownJewelCard,
  EmptyState,
  FeaturedShowcaseCard,
  LensSelector,
  MetricCardRow,
  METRIC_VALUE_STYLE,
  ShowcaseCard,
  type LensItem,
} from "@/components/vault"
import { createClient } from "@/lib/supabase/client"
import { recordView } from "@/lib/views"

type LensKey = "collection" | "showcases"

const LENSES: LensItem<LensKey>[] = [
  { key: "collection", label: "Collection" },
  { key: "showcases", label: "Showcases" },
]

export default function VisitorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { profile: me } = useUser()
  const { profile: target, loading } = useUserProfile(id)
  const { collectibles } = useCollectibles({ userId: id })
  const { showcases } = useShowcases({ userId: id })
  const { isFollowing, followersCount, toggle: toggleFollow, pending: followPending } = useFollow(id)
  const [lens, setLens] = useState<LensKey>("collection")
  const [crownJewel, setCrownJewel] = useState<any>(null)
  const [featuredShowcase, setFeaturedShowcase] = useState<any>(null)

  const isOwn = me?.id === id

  useEffect(() => {
    if (!target || collectibles.length === 0) return
    const targetId = target.crownJewelCollectibleId
    const jewelRow = targetId
      ? collectibles.find((c) => c.id === targetId)
      : [...collectibles].sort((a, b) => b.value - a.value)[0]

    if (jewelRow) {
      setCrownJewel(jewelRow)
    }
  }, [target, collectibles])

  useEffect(() => {
    if (!target?.id) return
    recordView("profile", target.id, target.id)
  }, [target?.id])

  useEffect(() => {
    if (!target || !target.featuredShowcaseId) return
    const supabase = createClient()
    async function load() {
      const { data: showcase } = await supabase
        .from("showcases")
        .select("id, title")
        .eq("id", target!.featuredShowcaseId!)
        .single()
      if (!showcase) return
      const { data: items } = await supabase
        .from("showcase_collectibles")
        .select(
          "collectibles!inner (id, photos)",
        )
        .eq("showcase_id", showcase.id)
        .limit(4)
      const previewImages = (items ?? [])
        .map((r: any) => r.collectibles?.photos?.[0])
        .filter(Boolean)
      setFeaturedShowcase({
        id: showcase.id,
        title: showcase.title,
        itemCount: items?.length ?? 0,
        previewImages,
      })
    }
    load().catch(() => {})
  }, [target])

  if (loading) {
    return <div className="px-8 py-12 text-fg2 text-sm">Loading...</div>
  }

  if (!target) {
    return (
      <div className="px-8 py-24">
        <EmptyState
          title="Collector not found"
          subtitle="This profile may not exist or may be private."
        />
      </div>
    )
  }

  const collectionValue = collectibles.reduce((sum, c) => sum + (c.value || 0), 0)

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href="/v"
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="flex items-center gap-2">
          {!isOwn && (
            <>
              <Link
                href={`/v/messages/new?to=${id}`}
                className="flex items-center gap-2 rounded-md border border-frost-border px-3 py-1.5 text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors text-[12px] uppercase font-semibold tracking-wider"
              >
                <MessageSquare size={12} />
                Message
              </Link>
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followPending}
                className={`rounded-md px-4 py-1.5 text-[12px] uppercase font-semibold tracking-wider transition-colors ${
                  isFollowing
                    ? "border border-frost-border text-fg2 hover:text-fg1 hover:border-frost-border-strong"
                    : "bg-brand-volt text-text-inverse hover:opacity-90"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile header */}
      <div className="px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-start gap-6 mb-8">
          <Avatar
            src={target.avatar}
            name={target.displayName ?? target.username}
            size={80}
          />
          <div className="flex-1">
            <h1
              className="text-fg1"
              style={{
                fontFamily: "var(--font-grotesk)",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {target.displayName ?? target.username ?? "Collector"}
            </h1>
            {target.username && (
              <p className="text-fg2 text-sm mt-0.5">@{target.username}</p>
            )}
            {target.bio && (
              <p className="text-fg1 text-sm mt-3 max-w-2xl">{target.bio}</p>
            )}
            <div className="flex gap-6 mt-4">
              <div>
                <span className="text-fg1 font-mono font-semibold">
                  {followersCount}
                </span>
                <span className="text-fg3 text-[11px] uppercase font-mono ml-1">
                  Followers
                </span>
              </div>
              <div>
                <span className="text-fg1 font-mono font-semibold">
                  {target.followingCount}
                </span>
                <span className="text-fg3 text-[11px] uppercase font-mono ml-1">
                  Following
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <MetricCardRow
          metrics={[
            {
              label: "TOTAL VALUE",
              value: (
                <span style={METRIC_VALUE_STYLE}>
                  <span style={{ color: "var(--fg2)" }}>$</span>
                  <span style={{ color: "var(--fg1)" }}>
                    {formatAbbrValue(collectionValue)}
                  </span>
                </span>
              ),
            },
            {
              label: "COLLECTION SIZE",
              value: collectibles.length.toLocaleString(),
            },
          ]}
        />

        {/* Crown Jewel + Featured Showcase */}
        {(crownJewel || featuredShowcase) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {crownJewel && (
              <CrownJewelCard
                collectibleId={crownJewel.id}
                title={crownJewel.title}
                image={crownJewel.photoUrl}
                value={crownJewel.value}
                status={crownJewel.status}
                username={target.username}
                traits={crownJewel.traits}
                createdAt={crownJewel.createdAt}
              />
            )}
            {featuredShowcase && (
              <FeaturedShowcaseCard showcase={featuredShowcase} />
            )}
          </div>
        )}
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
        {lens === "collection" && (
          <>
            {collectibles.length === 0 ? (
              <EmptyState
                title="No public collectibles"
                subtitle={`${target.displayName ?? "This collector"} hasn't published any items yet.`}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collectibles.map((item) => (
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
          </>
        )}

        {lens === "showcases" && (
          <>
            {showcases.length === 0 ? (
              <EmptyState
                title="No showcases yet"
                subtitle="Showcases are curated collections this collector publishes."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {showcases.map((s) => (
                  <ShowcaseCard
                    key={s.id}
                    showcase={{
                      id: s.id,
                      title: s.title,
                      itemCount: s.items,
                      totalValue: s.totalValue,
                      showcaseType: s.showcaseType,
                      previewImages: s.images ?? [],
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatAbbrValue(n: number): string {
  if (n < 1000) return n.toFixed(0)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}K`
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`
  if (n < 10_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  return `${(n / 1_000_000).toFixed(0)}M`
}
