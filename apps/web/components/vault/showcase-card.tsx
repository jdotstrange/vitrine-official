/**
 * ShowcaseCard — grid card for a showcase.
 *
 * Mirrors apps/native/components/profile/showcase-grid-card.tsx visually:
 *   - Tinted border (primary for manual, warning for managed)
 *   - 1:1 aspect image cluster with overlapping circular previews
 *   - Title (12px semi), Layers icon + count + value at bottom
 */

"use client"

import Link from "next/link"
import { Layers } from "lucide-react"

export interface ShowcaseCardData {
  id: string
  title: string
  itemCount: number
  totalValue?: number
  showcaseType?: "manual" | "auto" | "curated" | "managed"
  previewImages: string[]
}

interface ShowcaseCardProps {
  showcase: ShowcaseCardData
  href?: string
  className?: string
}

export function ShowcaseCard({ showcase, href, className }: ShowcaseCardProps) {
  const isManaged =
    showcase.showcaseType === "auto" || showcase.showcaseType === "managed"
  const dotColor = isManaged ? "var(--semantic-orange)" : "var(--brand-volt)"
  const borderColor = isManaged
    ? "var(--semantic-orange-border)"
    : "var(--brand-volt-border)"
  const previews = showcase.previewImages.slice(0, 3)

  return (
    <Link
      href={href ?? `/v/showcase/${showcase.id}`}
      className={`block overflow-hidden border-[1.5px] bg-sheet-bg hover:opacity-95 transition-opacity ${className ?? ""}`}
      style={{
        borderRadius: 16,
        borderColor,
      }}
    >
      {/* Image cluster */}
      <div
        className="w-full flex items-center justify-center"
        style={{
          aspectRatio: "1 / 1",
          backgroundColor: "var(--sheet-bg)",
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        {previews.length > 0 ? (
          <div className="flex items-center justify-center">
            {previews.map((img, i) => (
              <div
                key={i}
                className="rounded-full border-2 overflow-hidden"
                style={{
                  width: 56,
                  height: 56,
                  borderColor: "var(--void)",
                  marginLeft: i > 0 ? -12 : 0,
                  zIndex: 3 - i,
                  backgroundColor: "var(--sheet-bg)",
                }}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {showcase.itemCount > 3 && (
              <div
                className="rounded-full border-2 flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  borderColor: "var(--void)",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  marginLeft: -12,
                }}
              >
                <span
                  className="text-fg2"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  +{showcase.itemCount - 3}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: "var(--frost-border)",
            }}
          >
            <Layers size={20} color="var(--fg3)" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center mb-2">
          <span
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: dotColor,
            }}
          />
        </div>
        <h4
          className="text-fg1 mb-1.5 line-clamp-2"
          style={{
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {showcase.title}
        </h4>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Layers size={10} color="var(--fg2)" />
            <span className="text-fg2" style={{ fontSize: 10 }}>
              {showcase.itemCount}
            </span>
          </div>
          {typeof showcase.totalValue === "number" && showcase.totalValue > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-volt)",
              }}
            >
              ${showcase.totalValue.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
