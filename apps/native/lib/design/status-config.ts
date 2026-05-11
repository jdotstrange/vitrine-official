/**
 * Listing-status config — the single source of truth for every visual
 * treatment of a collectible's listing state (For Sale / For Trade /
 * Sell + Trade / NFST).
 *
 * Consumed by:
 *   - StatusPill           (inline chip rendered in the identity strip)
 *   - StatusDot            (overlay on comp cards / grid cells)
 *   - CommercePill         (dynamic bottom-bar commerce action)
 *   - Any future surface that needs to communicate listing state
 *
 * Pattern:
 *   These sibling components share meaning but render differently — they
 *   consume the same config, they don't inherit from each other. If a new
 *   status ever gets added (e.g. 'AUCTION'), updating this file is the
 *   only change required to light it up across every surface.
 */

import type { LucideIcon } from 'lucide-react-native';
import { ArrowLeftRight, DollarSign, Handshake } from 'lucide-react-native';

import { COLORS } from './tokens';

// ---------------------------------------------------------------------------
// STATUS KEYS
// ---------------------------------------------------------------------------

export type ListingStatus = 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE' | 'NFST';

// ---------------------------------------------------------------------------
// CHROME SHAPE
// ---------------------------------------------------------------------------

export type StatusAction = {
  // Gateway icon for the bottom-bar commerce pill. On tap, opens the
  // buy/trade dispatcher sheet. Icon + label both flow from this config
  // so the pill's color, icon, and a11y label always match the listing
  // intent.
  Icon: LucideIcon;
  label: string;
};

export type StatusChrome = {
  label: string;      // human-facing text ("For Sale", "NFST", etc.)
  fill: string;       // pill background (glass, semantic hue at low alpha)
  border: string;     // pill border (semantic hue at mid alpha)
  text: string;       // pill label color (full semantic hue)
  dot: string;        // standalone dot color (when rendered without pill)
  action: StatusAction | null;  // null = hide the commerce pill (NFST)
};

// ---------------------------------------------------------------------------
// THE CONFIG
// ---------------------------------------------------------------------------

export const STATUS_CONFIG: Record<ListingStatus, StatusChrome> = {
  FOR_SALE: {
    label: 'For Sale',
    fill: COLORS.semanticGreenFill,
    border: COLORS.semanticGreenBorder,
    text: COLORS.semanticGreen,
    dot: COLORS.semanticGreen,
    action: { Icon: DollarSign, label: 'Buy' },        // green = buy-primary
  },
  FOR_TRADE: {
    label: 'For Trade',
    fill: COLORS.semanticBlueFill,
    border: COLORS.semanticBlueBorder,
    text: COLORS.semanticBlue,
    dot: COLORS.semanticBlue,
    action: { Icon: ArrowLeftRight, label: 'Trade' },  // blue = swap-primary
  },
  SELL_TRADE: {
    label: 'Sell + Trade',
    fill: COLORS.semanticOrangeFill,
    border: COLORS.semanticOrangeBorder,
    text: COLORS.semanticOrange,
    dot: COLORS.semanticOrange,
    action: { Icon: Handshake, label: 'Deal' },        // orange = either — opens dispatcher
  },
  NFST: {
    label: 'NFST',                                      // own the acronym
    fill: COLORS.semanticSilverFill,
    border: COLORS.frostBorderStrong,
    text: COLORS.textPrimary,
    dot: COLORS.textTertiary,                           // dim — no commerce pathway
    action: null,                                       // NFST = no commerce pill rendered
  },
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Collapse two boolean flags into the canonical ListingStatus enum.
 * (forSale && forTrade) → SELL_TRADE wins over either single flag.
 */
export function deriveStatus(
  forSale?: boolean,
  forTrade?: boolean,
): ListingStatus {
  if (forSale && forTrade) return 'SELL_TRADE';
  if (forSale) return 'FOR_SALE';
  if (forTrade) return 'FOR_TRADE';
  return 'NFST';
}
