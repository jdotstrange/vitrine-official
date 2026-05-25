/**
 * CrownJewelCard — featured collectible with holographic frame.
 *
 * Mirrors apps/native/components/collector-profile.tsx (CROWN JEWEL block,
 * styles pS.crownCard / crownMain / crownImageFrame / crownInfo / crownRail).
 *
 * Visual contract (from native):
 *   - Holographic frame wraps a sheet-bg card, RADII.card (16px) corners
 *   - Top half: 116px image frame (5:7 aspect) + info column
 *   - Image: bordered "frame" with 3px inner padding, sub-radius 5px
 *   - Info: status pill + @username; bold 18px title; trait pills row;
 *     mono 23px price (negative letter-spacing)
 *   - Bottom rail: pressOverlay backdrop, 45px min-height, "CATALOGED ON"
 *     + date on left, tracking pill on right (target icon + count)
 */

"use client"

import Link from "next/link"
import { Target } from "lucide-react"
import { HolographicFrame } from "./holographic-frame"
import { StatusPill } from "./status-pill"
import { TraitPill } from "./trait-pill"
import type { ListingStatus } from "@/lib/design"

interface CrownJewelCardProps {
  collectibleId: string
  title: string
  image?: string
  value: number
  status: ListingStatus
  username?: string | null
  traits?: string[]
  createdAt: string
  trackingCount?: number
  isTracked?: boolean
  onTrackToggle?: () => void
  href?: string
}

export function CrownJewelCard({
  collectibleId,
  title,
  image,
  value,
  status,
  username,
  traits = [],
  createdAt,
  trackingCount = 0,
  isTracked = false,
  onTrackToggle,
  href,
}: CrownJewelCardProps) {
  const linkHref = href ?? `/v/collectible/${collectibleId}`

  return (
    <HolographicFrame borderRadius={16}>
      <Link
        href={linkHref}
        className="block rounded-[16px] overflow-hidden bg-sheet-bg hover:opacity-95 transition-opacity"
      >
        {/* Top half — image + info */}
        <div className="flex gap-[14px] p-[14px] border-b border-frost-divider">
          {/* Image frame — 116px × (5:7 aspect) */}
          <div
            className="shrink-0 rounded-lg border border-frost-border-strong bg-void overflow-hidden p-[3px]"
            style={{
              width: 116,
              aspectRatio: "5 / 7",
            }}
          >
            <div className="w-full h-full rounded-[5px] overflow-hidden bg-void">
              {image ? (
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sheet-bg" />
              )}
            </div>
          </div>

          {/* Info column */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-[2px]">
            {/* Top — status + username */}
            <div className="flex items-center gap-2 min-w-0">
              <StatusPill status={status} />
              {username && (
                <span className="flex-1 truncate text-[12px] font-inter font-semibold text-fg2">
                  @{username}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-grotesk font-bold text-[18px] leading-[22px] tracking-[0.2px] text-fg1 mt-2.5 line-clamp-2">
              {title}
            </h3>

            {/* Traits */}
            {traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {traits.map((t) => (
                  <TraitPill key={t} traitKey={t} />
                ))}
              </div>
            )}

            {/* Price */}
            <p
              className="text-fg1 mt-3"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 23,
                letterSpacing: "-0.4px",
                fontWeight: 500,
              }}
            >
              {formatPrice(value)}
            </p>
          </div>
        </div>

        {/* Bottom rail — cataloged on / tracking pill */}
        <div
          className="flex items-center justify-between px-[14px] py-[9px]"
          style={{
            backgroundColor: "var(--press-overlay)",
            minHeight: 45,
          }}
        >
          <div>
            <p
              className="font-grotesk font-bold uppercase text-fg3"
              style={{ fontSize: 8, letterSpacing: 1.1 }}
            >
              CATALOGED ON
            </p>
            <p
              className="text-fg2 mt-0.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {formatCatalogDate(createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onTrackToggle?.()
            }}
            className="flex items-center gap-[7px] rounded-full border px-2.5 py-[7px] hover:bg-frost-border/10 transition-colors"
            style={{
              borderColor: "var(--frost-border)",
              backgroundColor: "rgba(0, 0, 0, 0.34)",
            }}
          >
            <Target
              size={16}
              style={{
                color: isTracked ? "var(--trait-olive)" : "var(--fg2)",
              }}
              fill={isTracked ? "var(--trait-olive)" : "none"}
            />
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: 0.5,
                color: isTracked ? "var(--trait-olive)" : "var(--fg2)",
                fontWeight: 500,
              }}
            >
              {trackingCount.toLocaleString()} TRACKING
            </span>
          </button>
        </div>
      </Link>
    </HolographicFrame>
  )
}

function formatPrice(value: number): string {
  if (!value || value === 0) return "$0"
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
  return `$${value.toFixed(2)}`
}

function formatCatalogDate(iso: string): string {
  const d = new Date(iso)
  return d
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()
}
