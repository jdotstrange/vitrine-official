/**
 * @vitrine/design-tokens — V3 design primitives shared across native and web.
 *
 * What's here: pure data tokens (colors, typography, spacing, radii, trait
 * config, comps match-tier thresholds). No platform dependencies, no React,
 * no icons.
 *
 * What's NOT here (lives in apps/native/lib/design/):
 *   - ThemeProvider / useTheme — React Native context (uses RN's useColorScheme
 *     and AsyncStorage)
 *   - STATUS_CONFIG — couples lucide-react-native icons into status chrome
 *   - VERB_CONFIG — couples lucide-react-native + expo-router + native API
 *     types into activity-feed verb config
 *
 * When web needs status pills or activity feeds, we'll either split those
 * files (data here, icon-attachment in app code) or introduce a peer-dep
 * pattern. For v1, native keeps full ownership.
 */

export {
  COLORS,
  DARK_COLORS,
  LIGHT_COLORS,
  TYPE,
  SPACING,
  RADII,
} from './tokens';

export type {
  ThemeColors,
  ColorToken,
  TypeToken,
  SpacingToken,
  RadiusToken,
} from './tokens';

export {
  TRAIT_CONFIG,
  TRAIT_ORDER,
  getTraitChrome,
  isTraitKey,
} from './trait-config';

export type {
  TraitKey,
  TraitChrome,
} from './trait-config';

export {
  getMatchTier,
  MATCH_TIER_THRESHOLDS,
} from './match-tiers';

export type {
  MatchTier,
  MatchTierResult,
} from './match-tiers';
