/**
 * SectionHeader — kicker + optional right link.
 *
 * Mirrors the section header pattern used across native profile screens
 * (icon + small uppercase title + optional "VIEW ALL" link on the right).
 */

import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

interface SectionHeaderProps {
  title: string
  icon?: ReactNode
  rightLabel?: string
  rightHref?: string
  onRightClick?: () => void
  className?: string
}

export function SectionHeader({
  title,
  icon,
  rightLabel = "VIEW ALL",
  rightHref,
  onRightClick,
  className,
}: SectionHeaderProps) {
  const right = (
    <span
      className="flex items-center gap-1 text-fg2 hover:text-fg1 transition-colors"
      style={{
        fontFamily: "var(--font-grotesk)",
        fontSize: 10,
        letterSpacing: 1.2,
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {rightLabel}
      <ChevronRight size={10} />
    </span>
  )

  return (
    <div
      className={`flex items-center justify-between mb-3 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3
          className="text-fg1 uppercase"
          style={{
            fontFamily: "var(--font-grotesk)",
            fontSize: 11,
            letterSpacing: 1.5,
            fontWeight: 700,
          }}
        >
          {title}
        </h3>
      </div>
      {rightHref ? (
        <Link href={rightHref}>{right}</Link>
      ) : onRightClick ? (
        <button type="button" onClick={onRightClick}>
          {right}
        </button>
      ) : null}
    </div>
  )
}
