/**
 * Vault Design System — V3 barrel export.
 *
 * Consumers should prefer `import { ... } from '@/lib/design'` over
 * deep-path imports from the individual submodules. This gives us one
 * stable entry point and makes future internal restructuring painless.
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

export { ThemeProvider, useTheme } from './theme-context';
export type { ThemeMode } from './theme-context';

export {
  STATUS_CONFIG,
  deriveStatus,
} from './status-config';

export type {
  ListingStatus,
  StatusAction,
  StatusChrome,
} from './status-config';

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
