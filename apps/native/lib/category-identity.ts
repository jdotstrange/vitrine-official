import { colors } from './colors';

/**
 * Matches the Supabase `collectible_type` enum on the `collectibles` table.
 * 'memorabilia' = manual-entry physical collectibles (sneakers, watches, etc.)
 * 'trading_card' = API-driven card catalog items (sports cards, TCG, etc.)
 */
export type CollectibleType = 'memorabilia' | 'trading_card';

export interface CategoryAccentColors {
  accent: string;
  accentForeground: string;
  accentMuted: string;
  accentGlow: string;
}

const MEMORABILIA_ACCENT: CategoryAccentColors = {
  accent: colors.primary,
  accentForeground: colors.primaryForeground,
  accentMuted: colors.primaryMuted,
  accentGlow: colors.primaryGlow,
};

const TRADING_CARD_ACCENT: CategoryAccentColors = {
  accent: colors.accent,
  accentForeground: colors.accentForeground,
  accentMuted: colors.accentMuted,
  accentGlow: colors.accentGlow,
};

export function getCategoryAccent(type: CollectibleType): CategoryAccentColors;
export function getCategoryAccent(type: string | null | undefined): CategoryAccentColors;
export function getCategoryAccent(type: string | null | undefined): CategoryAccentColors {
  if (type === 'trading_card' || type === 'trading_cards' || type === 'trading-cards') return TRADING_CARD_ACCENT;
  return MEMORABILIA_ACCENT;
}

/**
 * Get just the accent color string for a category type.
 * Useful for border tints, badges, etc.
 */
export function getCategoryAccentColor(type: string | null | undefined): string {
  return getCategoryAccent(type).accent;
}
