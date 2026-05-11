"use client"

import { useState } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltCard } from "@/components/tilt-card"
import { SpatialBackground } from "@/components/spatial-background"
import { SectionLabel } from "@/components/section-label"
import { DownloadModal } from "@/components/download-modal"
import { Target } from "lucide-react"
import { AdaptiveImage } from "@/components/adaptive-image"
import type { ExploreCollectible } from "@/lib/explore-data"

const statusStyles: Record<string, { color: string }> = {
  "FOR SALE": { color: "var(--status-sale)" },
  "FOR TRADE": { color: "var(--status-trade)" },
  "SELL + TRADE": { color: "var(--status-sell-trade)" },
  NFST: { color: "var(--status-nfst)" },
}

function formatValue(value: number | null): string {
  if (!value) return ""
  return `$${value.toLocaleString("en-US")}`
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

interface ExploreContentProps {
  collectibles: ExploreCollectible[]
  categories: string[]
}

export function ExploreContent({ collectibles, categories }: ExploreContentProps) {
  const [downloadOpen, setDownloadOpen] = useState(false)

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="absolute inset-0 bg-void-deep" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%2300d4ff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <SpatialBackground intensity={0.6} />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <ScrollReveal delay={0.1} duration={0.8} direction="up" blur>
              <div className="mb-6">
                <SectionLabel>Explore</SectionLabel>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15} duration={0.8} direction="up" blur>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-foreground">See what&apos;s</span>{" "}
                <span className="text-gradient-animated">already inside.</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.2} duration={0.8} direction="up" blur>
              <p className="text-lg md:text-xl text-muted-foreground">
                Real collectibles from real collectors. Browse the collection&nbsp;&mdash; then add yours.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Filters — hidden until more categories are in the DB */}

      {/* Collectible Grid */}
      <section className="relative py-12 md:py-16">
        <div className="absolute inset-0 bg-void-deep" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%2300d4ff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          {collectibles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {collectibles.map((item, index) => (
                <ScrollReveal key={item.id} delay={0.1 + index * 0.05} duration={0.6} direction="up" blur>
                  <div onClick={() => setDownloadOpen(true)} className="cursor-pointer">
                  <TiltCard tiltStrength={8} glareStrength={0.12}>
                    <div
                      className="group overflow-hidden text-left transition-all w-full"
                      style={{
                        borderRadius: 16,
                        backgroundColor: "rgba(15, 15, 25, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <div className="relative">
                        <AdaptiveImage
                          src={item.image}
                          alt={item.title}
                          targetAspectRatio={4 / 5}
                          className="group-hover:[&>img:last-child]:scale-105 transition-transform"
                        />
                        <div
                          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                        >
                          <Target className="w-4 h-4 text-[#EFEFE7]" />
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#EFEFE7] text-sm md:text-base line-clamp-1">{item.title}</h3>
                            <span className="text-xs text-[#C1C1C1]">{timeAgo(item.createdAt)}</span>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            {item.value ? (
                              <span className="font-price font-bold text-[#EFEFE7] text-sm md:text-base">
                                {formatValue(item.value)}
                              </span>
                            ) : null}
                            <span
                              className="text-[10px] tracking-wider font-semibold px-2.5 py-1 rounded-full mt-1"
                              style={{
                                backgroundColor: (statusStyles[item.status]?.color || "var(--status-nfst)") + "20",
                                color: statusStyles[item.status]?.color || "var(--status-nfst)",
                                border: `1px solid ${statusStyles[item.status]?.color || "var(--status-nfst)"}30`,
                              }}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </TiltCard>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-foreground mb-2">No items match that filter.</h3>
              <p className="text-muted-foreground">Try broadening your search&nbsp;&mdash; or download and add the first one.</p>
            </div>
          )}
        </div>
      </section>

      <DownloadModal open={downloadOpen} onOpenChange={setDownloadOpen} />
    </>
  )
}
