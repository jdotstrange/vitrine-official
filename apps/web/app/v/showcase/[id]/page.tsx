"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Layers } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import {
  Avatar,
  CollectibleCard,
  EmptyState,
  HolographicFrame,
  LensSelector,
  MetricCardRow,
  type LensItem,
} from "@/components/vault"
import { deriveStatus } from "@/lib/design"
import { recordView } from "@/lib/views"
import type { ShowcaseDetail } from "@vitrine/api"

type LensKey = "details" | "contents"

const LENSES: LensItem<LensKey>[] = [
  { key: "details", label: "Details" },
  { key: "contents", label: "Contents" },
]

export default function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { profile } = useUser()
  const [showcase, setShowcase] = useState<ShowcaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [lens, setLens] = useState<LensKey>("contents")

  useEffect(() => {
    const api = getClientApi()
    api.showcases
      .getShowcaseById(id, profile?.id)
      .then(setShowcase)
      .catch((err) => console.warn("[Showcase] load failed", err))
      .finally(() => setLoading(false))
  }, [id, profile?.id])

  useEffect(() => {
    if (!showcase) return
    recordView("showcase", showcase.id, showcase.owner.id)
  }, [showcase])

  const isOwner = !!profile && !!showcase && profile.id === showcase.owner.id

  if (loading) {
    return <div className="px-8 py-12 text-fg2 text-sm">Loading...</div>
  }

  if (!showcase) {
    return (
      <div className="px-8 py-24">
        <EmptyState
          title="Showcase not found"
          subtitle="It may have been deleted or set to private."
        />
      </div>
    )
  }

  const totalValue = showcase.items.reduce(
    (sum, c) => sum + (c.value || 0),
    0,
  )

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href="/v/showcases"
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Showcases
        </Link>
        {isOwner && (
          <Link
            href={`/v/showcase/${id}/edit`}
            className="flex items-center gap-2 rounded-md border border-frost-border px-3 py-1.5 text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors text-[12px] uppercase font-semibold tracking-wider"
          >
            <Pencil size={12} />
            Edit
          </Link>
        )}
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        {/* Hero */}
        <HolographicFrame borderRadius={16}>
          <div
            className="rounded-2xl bg-sheet-bg border border-frost-border-strong overflow-hidden p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Layers size={20} color="var(--brand-volt)" />
              <span
                className="uppercase text-fg2"
                style={{
                  fontFamily: "var(--font-grotesk)",
                  fontSize: 11,
                  letterSpacing: 1.5,
                  fontWeight: 700,
                }}
              >
                Showcase · {showcase.showcaseType}
              </span>
            </div>
            <h1
              className="text-fg1"
              style={{
                fontFamily: "var(--font-grotesk)",
                fontSize: 40,
                lineHeight: "44px",
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {showcase.title}
            </h1>
            {showcase.description && (
              <p className="text-fg2 mt-3 text-sm max-w-2xl leading-relaxed">
                {showcase.description}
              </p>
            )}
            <Link
              href={`/v/profile/${showcase.owner.id}`}
              className="flex items-center gap-2 mt-4 text-fg2 hover:text-fg1 transition-colors w-fit"
            >
              <Avatar src={showcase.owner.avatar} name={showcase.owner.name} size={28} />
              <span className="text-[13px]">
                {showcase.owner.name}
              </span>
            </Link>
          </div>
        </HolographicFrame>

        {/* Metrics */}
        <div className="mt-6">
          <MetricCardRow
            metrics={[
              {
                label: "ITEMS",
                value: showcase.items.length.toLocaleString(),
              },
              {
                label: "TOTAL VALUE",
                value: `$${totalValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`,
              },
            ]}
          />
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-void">
        <LensSelector items={LENSES} activeKey={lens} onChange={(k) => setLens(k)} />
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        {lens === "contents" && (
          <>
            {showcase.items.length === 0 ? (
              <EmptyState
                title="No items yet"
                subtitle={
                  isOwner
                    ? "Add collectibles to this showcase from the edit page."
                    : "This showcase is empty."
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {showcase.items.map((item) => (
                  <CollectibleCard
                    key={item.id}
                    item={{
                      id: item.id,
                      title: item.title,
                      photoUrl: item.image,
                      status: (item.status as any) || "NFST",
                      viewCount: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {lens === "details" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px] mb-2">
                Type
              </h3>
              <p className="text-fg1 text-sm capitalize">{showcase.showcaseType}</p>
            </div>
            <div>
              <h3 className="text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px] mb-2">
                Visibility
              </h3>
              <p className="text-fg1 text-sm capitalize">{showcase.visibility}</p>
            </div>
            {showcase.rules && (
              <div>
                <h3 className="text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px] mb-2">
                  Rules
                </h3>
                <pre className="text-[11px] text-fg2 font-mono bg-sheet-bg border border-frost-border rounded-md p-3 overflow-x-auto max-h-64">
                  {JSON.stringify(showcase.rules, null, 2)}
                </pre>
                {showcase.rulesLastEvaluatedAt && (
                  <p className="text-fg3 text-[11px] mt-2">
                    Last evaluated:{" "}
                    {new Date(showcase.rulesLastEvaluatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
