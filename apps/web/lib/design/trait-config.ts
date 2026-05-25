/**
 * Trait config re-export.
 *
 * Mirrors apps/native — uses TRAIT_CONFIG from @vitrine/design-tokens.
 * Web converts the COLORS-based palette to CSS vars at the call site.
 */

export {
  TRAIT_CONFIG,
  TRAIT_ORDER,
  getTraitChrome,
  isTraitKey,
  type TraitKey,
  type TraitChrome,
} from "@vitrine/design-tokens"
