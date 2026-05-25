/**
 * StatusPill — inline glass chip for listing state.
 *
 * Mirrors apps/native/components/vault/status-pill.tsx exactly.
 * Same geometry (10px font, 1.0 letter-spacing, pill radius), same hue,
 * same label. Theme-immune (always dark backing).
 */

import { STATUS_CONFIG, type ListingStatus } from "@/lib/design"

interface StatusPillProps {
  status: ListingStatus
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const chrome = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2.5 py-[3px] text-[10px] font-grotesk font-semibold uppercase tracking-[1px] leading-[13px] ${className ?? ""}`}
      style={{
        backgroundColor: chrome.fill,
        borderColor: chrome.border,
        color: chrome.text,
        borderWidth: "1px",
      }}
    >
      {chrome.label.toUpperCase()}
    </span>
  )
}
