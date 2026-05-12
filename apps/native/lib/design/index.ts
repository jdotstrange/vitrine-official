/**
 * Vault Design System — V3 barrel export (native).
 *
 * Consumers may import from `@/lib/design` (this barrel) or directly from
 * `@vitrine/design-tokens` for the platform-agnostic primitives. Native-only
 * surfaces (ThemeProvider, STATUS_CONFIG, VERB_CONFIG, etc.) live here and
 * are not exposed to the shared package because they couple lucide-react-native
 * icons, expo-router routes, or React Native context APIs.
 *
 * The trade-off: deep import or barrel both work; pick whichever clarifies
 * the dependency at the call site.
 */

// Re-export the platform-agnostic tokens from the shared package so existing
// `import { COLORS } from '@/lib/design'` call sites stay byte-identical.
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
} from '@vitrine/design-tokens';

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
} from '@vitrine/design-tokens';

// Native-only — React Native theme context.
export { ThemeProvider, useTheme } from './theme-context';
export type { ThemeMode } from './theme-context';

// Native-only — status config wires lucide-react-native icons into chrome.
export {
  STATUS_CONFIG,
  deriveStatus,
} from './status-config';

export type {
  ListingStatus,
  StatusAction,
  StatusChrome,
} from './status-config';

// Native-only — activity verbs reference RN icons + expo-router + native API
// types. Will likely split when web grows an activity surface.
export {
  VERB_CONFIG,
  getVerbConfig,
  getVerbCategory,
} from './activity-verbs';

export type {
  ActivityVerb,
  VerbConfig,
  VerbContext,
  VerbBodyCopy,
} from './activity-verbs';
