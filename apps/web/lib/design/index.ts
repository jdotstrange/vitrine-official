/**
 * Web design system barrel.
 *
 * Mirrors apps/native/lib/design/index.ts but adapted for the web stack
 * (lucide-react instead of lucide-react-native, CSS-var-based color tokens
 * instead of useTheme()).
 */

// Pure tokens from shared package — same on every platform
export {
  COLORS,
  DARK_COLORS,
  LIGHT_COLORS,
  TYPE,
  SPACING,
  RADII,
  TRAIT_CONFIG,
  TRAIT_ORDER,
  getTraitChrome,
  isTraitKey,
  getMatchTier,
  MATCH_TIER_THRESHOLDS,
} from "@vitrine/design-tokens"

export type {
  ThemeColors,
  ColorToken,
  TypeToken,
  SpacingToken,
  RadiusToken,
  TraitKey,
  TraitChrome,
  MatchTier,
  MatchTierResult,
} from "@vitrine/design-tokens"

// Web-local status & verb chrome (mirror native design configs)
export {
  STATUS_CONFIG,
  deriveStatus,
  type ListingStatus,
  type StatusAction,
  type StatusChrome,
} from "./status-config"

export {
  VERB_CONFIG,
  getVerbConfig,
  getVerbCategory,
  getTrackingCategory,
  type ActivityVerb,
  type VerbConfig,
  type VerbContext,
  type VerbBodyCopy,
  type TrackingChipCategory,
} from "./verb-config"
