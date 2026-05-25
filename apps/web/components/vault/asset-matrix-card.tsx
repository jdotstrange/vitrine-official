/**
 * AssetMatrixCard — barcode-spectrum visualization of collection composition.
 *
 * Mirrors apps/native/components/vault/asset-matrix-card.tsx exactly.
 * 32px bar track height, 90 bar density, sin-wave heights for organic feel,
 * 2-column legend with mono labels.
 */

import { Brackets } from "./brackets"

export interface AssetMatrixSegment {
  label: string
  count: number
  pct: number
}

interface AssetMatrixCardProps {
  segments: AssetMatrixSegment[]
  title?: string
  colors?: string[]
  className?: string
}

const DEFAULT_PALETTE = [
  "var(--brand-volt)",
  "var(--fg1)",
  "var(--fg2)",
  "var(--frost-border-strong)",
  "var(--trait-cyan)",
  "var(--trait-violet)",
]

const BAR_TRACK_HEIGHT = 32
const BAR_DENSITY = 90

export function AssetMatrixCard({
  segments,
  title = "ASSET MATRIX",
  colors = DEFAULT_PALETTE,
  className,
}: AssetMatrixCardProps) {
  const typeLabel = `${segments.length} TYPE${segments.length !== 1 ? "S" : ""}`

  return (
    <div
      className={`relative overflow-hidden bg-sheet-bg border border-frost-border ${className ?? ""}`}
      style={{
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <Brackets />

      {/* Sub-header */}
      <div className="flex justify-between mb-3">
        <span
          className="font-grotesk font-bold uppercase text-fg2"
          style={{ fontSize: 9, letterSpacing: 1.35 }}
        >
          {title}
        </span>
        <span
          className="font-grotesk font-bold uppercase text-fg2"
          style={{ fontSize: 9, letterSpacing: 1.35 }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Bars container */}
      <div
        className="relative mb-4 flex items-center justify-center"
        style={{ height: BAR_TRACK_HEIGHT }}
      >
        <div
          className="absolute left-0 right-0"
          style={{
            top: 16,
            height: 1,
            backgroundColor: "var(--frost-divider)",
          }}
        />
        <div
          className="flex items-end relative w-full"
          style={{ gap: 1, height: BAR_TRACK_HEIGHT }}
        >
          {segments.flatMap((segment, segmentIndex) => {
            const barCount = Math.max(Math.round((segment.pct / 100) * BAR_DENSITY), 2)
            const color = colors[segmentIndex % colors.length]
            return Array.from({ length: barCount }).map((_, barIndex) => (
              <span
                key={`${segmentIndex}-${barIndex}`}
                style={{
                  width: 2,
                  borderRadius: 1,
                  backgroundColor: color,
                  opacity: segmentIndex === 0 ? 0.9 : 0.8 - segmentIndex * 0.15,
                  height:
                    ((40 + Math.abs(Math.sin(barIndex * (0.5 + segmentIndex * 0.3))) * 60) /
                      100) *
                    BAR_TRACK_HEIGHT,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
            ))
          })}
        </div>
      </div>

      {/* Legend grid (2-up) */}
      <div className="flex flex-wrap" style={{ gap: 12 }}>
        {segments.map((segment, segmentIndex) => (
          <div
            key={segment.label}
            className="flex items-center"
            style={{ width: "46%", gap: 6 }}
          >
            <span
              className="rounded-full shrink-0"
              style={{
                width: 6,
                height: 6,
                backgroundColor: colors[segmentIndex % colors.length],
              }}
            />
            <span
              className="flex-1 truncate text-fg2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: 0.8,
                fontWeight: 500,
              }}
            >
              {segment.label}
            </span>
            <span
              className="text-fg1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {segment.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
