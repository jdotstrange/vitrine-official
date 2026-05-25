/**
 * MetricCardRow — N-up bracket-marked metric cards.
 *
 * Mirrors apps/native/components/vault/metric-card-row.tsx exactly.
 * Each card: sheetBg + frostBorder + 12px radius + 16px padding + 100px
 * min-height. Brackets at corners. 9px bold uppercase label, 24px mono
 * value with -0.5 tracking.
 */

import type { ReactNode } from "react"
import { Brackets } from "./brackets"

export interface MetricCardEntry {
  label: string
  value: ReactNode
}

interface MetricCardRowProps {
  metrics: MetricCardEntry[]
  className?: string
  gap?: number
}

export function MetricCardRow({ metrics, className, gap = 16 }: MetricCardRowProps) {
  return (
    <div
      className={`flex ${className ?? ""}`}
      style={{ gap: `${gap}px` }}
    >
      {metrics.map((metric, index) => (
        <div
          key={`${metric.label}-${index}`}
          className="flex-1 relative overflow-hidden bg-sheet-bg border border-frost-border"
          style={{
            padding: 16,
            borderRadius: 12,
            minHeight: 100,
          }}
        >
          <Brackets />
          <div
            className="font-grotesk font-bold uppercase text-fg2"
            style={{
              fontSize: 9,
              letterSpacing: 1.35,
              marginBottom: 8,
            }}
          >
            {metric.label}
          </div>
          <div
            className="text-fg1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 24,
              letterSpacing: -0.5,
              fontWeight: 500,
            }}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Inline style for composing custom value spans (matches native export). */
export const METRIC_VALUE_STYLE = {
  fontFamily: "var(--font-mono)",
  fontSize: 24,
  letterSpacing: -0.5,
  fontWeight: 500,
}
