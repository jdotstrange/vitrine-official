/**
 * Trait-badge config — the four canonical collectible traits that surface
 * as glass-pill chips in the identity strip.
 *
 * Keyed by the database column name (is_rookie, is_autographed, is_game_used,
 * is_graded) so rendering code can iterate Object.keys(TRAIT_CONFIG) against
 * a collectible row and emit pills only for trait flags that are truthy.
 *
 * Consumed by:
 *   - TraitPill       (the inline trait chip)
 *   - Any future surface that needs to label a collectible's traits
 *
 * Each trait owns a distinct hue zone (none overlap with status). Fills at
 * 18% alpha, borders at 40% — mirrors STATUS_CONFIG's glass treatment so
 * traits and status read as the same material language (colored glass on
 * void) even though their meanings are orthogonal.
 */

import { COLORS } from './tokens';

// ---------------------------------------------------------------------------
// TRAIT KEYS
// ---------------------------------------------------------------------------

export type TraitKey =
  | 'is_rookie'
  | 'is_autographed'
  | 'is_game_used'
  | 'is_graded';

// ---------------------------------------------------------------------------
// CHROME SHAPE
// ---------------------------------------------------------------------------

export type TraitChrome = {
  label: string;
  fill: string;
  border: string;
  text: string;
};

// ---------------------------------------------------------------------------
// THE CONFIG
// ---------------------------------------------------------------------------

export const TRAIT_CONFIG: Record<TraitKey, TraitChrome> = {
  is_rookie: {
    label: 'Rookie',
    fill: COLORS.traitPinkFill,
    border: COLORS.traitPinkBorder,
    text: COLORS.traitPink,
  },
  is_autographed: {
    label: 'Signed',
    fill: COLORS.traitVioletFill,
    border: COLORS.traitVioletBorder,
    text: COLORS.traitViolet,
  },
  is_game_used: {
    label: 'Game Used',
    fill: COLORS.traitOliveFill,
    border: COLORS.traitOliveBorder,
    text: COLORS.traitOlive,
  },
  is_graded: {
    label: 'Graded',
    fill: COLORS.traitCyanFill,
    border: COLORS.traitCyanBorder,
    text: COLORS.traitCyan,
  },
};

// Ordered iteration — the order pills appear on-screen when a collectible
// has multiple traits set. Mirrors reading priority from left to right.
export const TRAIT_ORDER: readonly TraitKey[] = [
  'is_rookie',
  'is_autographed',
  'is_game_used',
  'is_graded',
] as const;

// ---------------------------------------------------------------------------
// LOOKUP — narrow-safe helper for raw DB strings.
//
// `TRAIT_CONFIG` is keyed by the `TraitKey` union to enforce completeness at
// authoring time (adding a trait requires adding to the union). But traits
// arrive from the database as a `string[]`, so call sites can't index the
// record directly without a cast. This helper accepts any string and
// returns `undefined` for unknown keys — callers handle the null case.
// ---------------------------------------------------------------------------

export function getTraitChrome(key: string): TraitChrome | undefined {
  return TRAIT_CONFIG[key as TraitKey];
}

/** True if the given string is a recognized trait key. */
export function isTraitKey(key: string): key is TraitKey {
  return key in TRAIT_CONFIG;
}
