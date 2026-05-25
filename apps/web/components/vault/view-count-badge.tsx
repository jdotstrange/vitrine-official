/**
 * ViewCountBadge — small eye icon + count badge.
 *
 * Mirrors apps/native/components/vault/view-count-badge.tsx.
 */

import { Eye } from "lucide-react"

interface ViewCountBadgeProps {
  count: number
  compact?: boolean
}

export function ViewCountBadge({ count, compact = false }: ViewCountBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 ${
        compact ? "" : "rounded-full bg-void/40 backdrop-blur-sm px-2 py-1"
      }`}
    >
      <Eye size={compact ? 9 : 10} color="var(--fg3)" />
      <span
        className="text-fg3"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: compact ? 9 : 10,
          fontWeight: 500,
        }}
      >
        {formatCount(count)}
      </span>
    </div>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1)}K`
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}
