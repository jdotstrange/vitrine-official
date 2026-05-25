/**
 * HolographicFrame — overlay frame with iridescent border.
 *
 * Mirrors apps/native/components/vault/holographic-frame.tsx visually
 * via the .holo-frame CSS class already in globals.css.
 *
 * Wraps any child with rounded corners and an animated gradient border.
 */

import type { ReactNode, CSSProperties } from "react"

interface HolographicFrameProps {
  children: ReactNode
  className?: string
  borderRadius?: number | string
  style?: CSSProperties
}

export function HolographicFrame({
  children,
  className,
  borderRadius,
  style,
}: HolographicFrameProps) {
  const radius =
    typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius

  return (
    <div
      className={`holo-frame relative ${className ?? ""}`}
      style={{ borderRadius: radius, ...style }}
    >
      {children}
    </div>
  )
}
