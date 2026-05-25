/**
 * Listing-status config — single source of truth for visual treatment.
 *
 * Mirrors apps/native/lib/design/status-config.ts (1:1) — same keys,
 * same colors (via CSS vars from globals.css). Web swaps Lucide RN
 * icons for lucide-react and uses CSS var strings.
 *
 * Visual DNA: identical to native. Pill geometry, hue, label.
 */

import type { LucideIcon } from "lucide-react"
import { ArrowLeftRight, DollarSign, Handshake } from "lucide-react"

export type ListingStatus = "FOR_SALE" | "FOR_TRADE" | "SELL_TRADE" | "NFST"

export type StatusAction = {
  Icon: LucideIcon
  label: string
}

export type StatusChrome = {
  label: string
  fill: string
  border: string
  text: string
  dot: string
  action: StatusAction | null
}

export const STATUS_CONFIG: Record<ListingStatus, StatusChrome> = {
  FOR_SALE: {
    label: "For Sale",
    fill: "var(--semantic-green-fill)",
    border: "var(--semantic-green-border)",
    text: "var(--semantic-green)",
    dot: "var(--semantic-green)",
    action: { Icon: DollarSign, label: "Buy" },
  },
  FOR_TRADE: {
    label: "For Trade",
    fill: "var(--semantic-blue-fill)",
    border: "var(--semantic-blue-border)",
    text: "var(--semantic-blue)",
    dot: "var(--semantic-blue)",
    action: { Icon: ArrowLeftRight, label: "Trade" },
  },
  SELL_TRADE: {
    label: "Sell + Trade",
    fill: "var(--semantic-orange-fill)",
    border: "var(--semantic-orange-border)",
    text: "var(--semantic-orange)",
    dot: "var(--semantic-orange)",
    action: { Icon: Handshake, label: "Deal" },
  },
  NFST: {
    label: "NFST",
    fill: "var(--semantic-silver-fill)",
    border: "var(--frost-border-strong)",
    text: "var(--fg1)",
    dot: "var(--fg3)",
    action: null,
  },
}

export function deriveStatus(
  forSale?: boolean | null,
  forTrade?: boolean | null,
): ListingStatus {
  if (forSale && forTrade) return "SELL_TRADE"
  if (forSale) return "FOR_SALE"
  if (forTrade) return "FOR_TRADE"
  return "NFST"
}
