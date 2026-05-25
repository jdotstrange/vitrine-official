/**
 * StatusDot — small colored dot indicator.
 *
 * Mirrors apps/native/components/vault/status-dot.tsx.
 */

import { STATUS_CONFIG, type ListingStatus } from "@/lib/design"

interface StatusDotProps {
  status: ListingStatus
  size?: number
  className?: string
}

export function StatusDot({ status, size = 6, className }: StatusDotProps) {
  const chrome = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className ?? ""}`}
      style={{
        backgroundColor: chrome.dot,
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-hidden
    />
  )
}
