/**
 * FeaturedShowcaseCard — premium showcase preview on profile.
 *
 * Mirrors apps/native/components/collector-profile.tsx (FEATURED SHOWCASE
 * block). Holographic frame around a sheet-bg card with a 3-up image
 * cluster, title, item count, and a "View All" affordance.
 */

"use client"

import Link from "next/link"
import { ChevronRight, Layers } from "lucide-react"
import { HolographicFrame } from "./holographic-frame"

export interface FeaturedShowcaseData {
  id: string
  title: string
  itemCount: number
  previewImages: string[]
  totalValue?: number
}

interface FeaturedShowcaseCardProps {
  showcase: FeaturedShowcaseData
  href?: string
}

export function FeaturedShowcaseCard({ showcase, href }: FeaturedShowcaseCardProps) {
  const linkHref = href ?? `/v/showcase/${showcase.id}`
  const previews = showcase.previewImages.slice(0, 3)

  return (
    <HolographicFrame borderRadius={16}>
      <Link
        href={linkHref}
        className="block rounded-[16px] overflow-hidden bg-sheet-bg hover:opacity-95 transition-opacity"
      >
        {/* Image cluster panel */}
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: "var(--sheet-bg)",
            paddingTop: 28,
            paddingBottom: 28,
            borderBottom: "1px solid var(--frost-divider)",
          }}
        >
          {previews.length > 0 ? (
            <div className="flex">
              {previews.map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden border-2"
                  style={{
                    width: 88,
                    height: 88,
                    borderColor: "var(--void)",
                    marginLeft: i > 0 ? -16 : 0,
                    zIndex: 3 - i,
                    backgroundColor: "var(--sheet-bg)",
                  }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {showcase.itemCount > 3 && (
                <div
                  className="rounded-xl border-2 flex items-center justify-center"
                  style={{
                    width: 88,
                    height: 88,
                    borderColor: "var(--void)",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    marginLeft: -16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      color: "var(--fg2)",
                      fontWeight: 600,
                    }}
                  >
                    +{showcase.itemCount - 3}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 flex items-center justify-center rounded-full border border-frost-border">
              <Layers size={28} color="var(--fg3)" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-[14px] py-[12px]">
          <div className="min-w-0">
            <h4
              className="text-fg1 truncate"
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-grotesk)",
                letterSpacing: 0.2,
              }}
            >
              {showcase.title}
            </h4>
            <p
              className="text-fg2 mt-0.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: 0.5,
              }}
            >
              {showcase.itemCount} ITEM{showcase.itemCount !== 1 ? "S" : ""}
              {showcase.totalValue
                ? ` · $${showcase.totalValue.toLocaleString()}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 text-fg2">
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-grotesk)",
                fontSize: 10,
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              VIEW ALL
            </span>
            <ChevronRight size={10} />
          </div>
        </div>
      </Link>
    </HolographicFrame>
  )
}
