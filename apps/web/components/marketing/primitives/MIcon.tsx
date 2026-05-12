"use client"

import * as React from "react"
import * as Icons from "lucide-react"
import type { LucideProps } from "lucide-react"

export interface MIconProps extends Omit<LucideProps, "size" | "color"> {
  /** kebab-case icon name (e.g. "chevron-down", "search", "trending-up") */
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}

function pascalize(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("")
}

const iconCache = new Map<string, React.ComponentType<LucideProps> | null>()

function resolveIcon(
  name: string
): React.ComponentType<LucideProps> | null {
  if (iconCache.has(name)) return iconCache.get(name) ?? null
  const pascal = pascalize(name)
  const candidate = (Icons as unknown as Record<string, unknown>)[pascal]
  const Cmp =
    typeof candidate === "function"
      ? (candidate as React.ComponentType<LucideProps>)
      : null
  iconCache.set(name, Cmp)
  return Cmp
}

/**
 * MIcon — drop-in lucide wrapper that mirrors the marketing mockup API.
 *
 * Accepts kebab-case names (`<MIcon name="chevron-down" />`), resolves
 * them to lucide-react PascalCase components at runtime. Bundle size
 * trade-off: includes the full lucide-react icon set; acceptable for the
 * marketing surface (one-page) and keeps section ports 1:1 with the
 * source mockup.
 */
export function MIcon({
  name,
  size = 18,
  color,
  strokeWidth = 1.75,
  style,
  ...props
}: MIconProps) {
  const Cmp = resolveIcon(name)
  if (!Cmp) return null
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      style={{ color: color || "currentColor", display: "inline-flex", ...style }}
      {...props}
    />
  )
}
