/**
 * StatusBreakdownGrid — 2-up wrapping grid of status summary cards.
 *
 * Mirrors apps/native/components/vault/status-breakdown-grid.tsx exactly.
 * Each card: status-tinted bg + border, title (10px bold), pct (14px mono),
 * subtitle (9px hero display), count, 6-segment progress bar.
 */

import { STATUS_CONFIG, type ListingStatus } from "@/lib/design"

export interface StatusBreakdownEntry {
  key: string
  count: number
  pct: number
}

interface StatusBreakdownGridProps {
  entries: StatusBreakdownEntry[]
  className?: string
}

const SUMMARY_COPY: Record<ListingStatus, { title: string; subtitle: string }> = {
  NFST: { title: "NFS", subtitle: "NOT FOR SALE" },
  FOR_SALE: { title: "FOR SALE", subtitle: "LIQUIDATING" },
  FOR_TRADE: { title: "FOR TRADE", subtitle: "OPEN TO OFFERS" },
  SELL_TRADE: { title: "BUY + TRADE", subtitle: "ACQUIRING" },
}

const PROGRESS_LEVELS = 6

function resolveSummary(rawKey: string) {
  const key = rawKey as ListingStatus
  const copy = SUMMARY_COPY[key] ?? SUMMARY_COPY.NFST
  const chrome = STATUS_CONFIG[key] ?? STATUS_CONFIG.NFST
  return {
    ...copy,
    bg: chrome.fill,
    border: chrome.border,
    text: key === "NFST" ? "var(--fg2)" : chrome.text,
    fill: chrome.dot,
  }
}

export function StatusBreakdownGrid({ entries, className }: StatusBreakdownGridProps) {
  return (
    <div className={`flex flex-wrap ${className ?? ""}`} style={{ gap: 12 }}>
      {entries.map((entry) => {
        const summary = resolveSummary(entry.key)
        const level = Math.min(
          PROGRESS_LEVELS,
          Math.round((entry.pct / 100) * PROGRESS_LEVELS),
        )
        return (
          <div
            key={entry.key}
            className="border"
            style={{
              flexBasis: "48%",
              flexGrow: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: summary.bg,
              borderColor: summary.border,
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="font-grotesk font-bold uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: 1.35,
                  color: summary.text,
                }}
              >
                {summary.title}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: summary.text,
                }}
              >
                {entry.pct}%
              </span>
            </div>
            <div
              className="text-fg2"
              style={{
                fontFamily: "var(--font-electrolize, var(--font-grotesk))",
                fontSize: 9,
                letterSpacing: 0.8,
                marginTop: 2,
                textTransform: "uppercase",
              }}
            >
              {summary.subtitle}
            </div>
            <div
              className="text-fg2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                fontWeight: 500,
                marginTop: 8,
              }}
            >
              {entry.count.toLocaleString()} ITEMS
            </div>
            <div
              className="flex"
              style={{ gap: 2, marginTop: 6, width: 48 }}
            >
              {Array.from({ length: PROGRESS_LEVELS }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1"
                  style={{
                    height: 6,
                    borderRadius: 1,
                    backgroundColor: i < level ? summary.fill : "var(--frost-divider)",
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
