/**
 * CollectibleCard — grid-cell card for a collectible.
 *
 * Mirrors apps/native/components/vault/collectible-grid-card.tsx +
 * grid-card.tsx (the shell + collectible meta combo).
 *
 * Visual contract:
 *   - 4:5 aspect photo, RADII.small (8px) corners, photoPlaceholder bg
 *   - StatusDot + 13px inter semibold title (line-clamp 2)
 *   - 10px gap between photo and meta (matches native marginTop)
 */

"use client"

import Link from "next/link"
import { StatusDot } from "./status-dot"
import { type ListingStatus } from "@/lib/design"

export interface CollectibleCardData {
  id: string
  title: string
  photoUrl?: string | null
  status: ListingStatus
  viewCount?: number
  /** Optional traits (rendered as an overlay or below) — currently unused on grid */
  traits?: string[]
}

interface CollectibleCardProps {
  item: CollectibleCardData
  href?: string
  selected?: boolean
  onClick?: () => void
}

export function CollectibleCard({
  item,
  href,
  selected = false,
  onClick,
}: CollectibleCardProps) {
  const linkHref = href ?? `/v/collectible/${item.id}`
  const content = (
    <>
      {/* Photo well — 4:5 aspect */}
      <div
        className={`relative w-full overflow-hidden rounded-lg ${selected ? "ring-2 ring-[var(--brand-volt)]" : ""}`}
        style={{
          aspectRatio: "4 / 5",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
        }}
      >
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-fg3"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 24,
              }}
            >
              —
            </span>
          </div>
        )}
      </div>

      {/* Meta — 10px below photo */}
      <div className="mt-2.5">
        <div className="flex items-start gap-[7px]">
          <span className="pt-1.5">
            <StatusDot status={item.status} />
          </span>
          <h4
            className="flex-1 text-fg1 line-clamp-2"
            style={{
              fontFamily: "var(--font-inter, var(--font-grotesk))",
              fontSize: 13,
              lineHeight: "17px",
              letterSpacing: 0.1,
              fontWeight: 600,
            }}
          >
            {item.title}
          </h4>
        </div>
        {item.viewCount ? (
          <div
            className="mt-1.5 inline-flex items-center gap-1 text-fg3"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 500,
            }}
          >
            <span>👁</span>
            {item.viewCount.toLocaleString()}
          </div>
        ) : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left transition-opacity hover:opacity-90"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={linkHref}
      className="block transition-opacity hover:opacity-90"
    >
      {content}
    </Link>
  )
}
