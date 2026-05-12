import * as React from "react"
import { VITRINE_MARK_PATHS, VITRINE_MARK_VIEWBOX } from "@/lib/marketing/brand-paths"

export interface VitrineMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  color?: string
}

/**
 * VitrineMark — the standalone Vitrine brand mark.
 *
 * The crown-in-vitrine glyph that lives inside the full lockup. Use this
 * for app icons, favicons, OG tiles, and anywhere the wordmark would be
 * redundant. Path data is shared with the dynamic icon/OG endpoints via
 * `lib/marketing/brand-paths`.
 *
 * Source of truth: apps/native/components/vault/icons/vitrine-mark-icon.tsx.
 */
export function VitrineMark({
  size = 48,
  color,
  style,
  ...props
}: VitrineMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={VITRINE_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color, ...style }}
      role="img"
      aria-label="Vitrine"
      {...props}
    >
      {VITRINE_MARK_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </svg>
  )
}
