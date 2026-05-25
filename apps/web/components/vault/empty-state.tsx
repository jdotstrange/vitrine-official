/**
 * EmptyState — placeholder when a list/grid has no items.
 *
 * Mirrors apps/native/components/vault/empty-state.tsx visually.
 */

import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-8 py-12 ${className ?? ""}`}
    >
      {icon && (
        <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-frost-border opacity-60">
          {icon}
        </div>
      )}
      <h4
        className="text-fg1 uppercase"
        style={{
          fontFamily: "var(--font-grotesk)",
          fontSize: 12,
          letterSpacing: 1.5,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {title}
      </h4>
      {subtitle && (
        <p
          className="text-fg2 max-w-sm"
          style={{
            fontFamily: "var(--font-inter, var(--font-grotesk))",
            fontSize: 13,
            lineHeight: "18px",
          }}
        >
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
