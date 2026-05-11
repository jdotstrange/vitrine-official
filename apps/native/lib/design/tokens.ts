/**
 * Vault Design System — V3 tokens.
 *
 * Single source of truth for color, typography, spacing, and radii across
 * the V3 DNA. Every consumer (screens, components, the design-system gallery)
 * reads from this module.
 *
 * Rules:
 *   - Do NOT add raw hex/rgba values to consuming files. If you need a
 *     new color, add it here with its dotted token name in a comment.
 *   - Do NOT import from lib/colors (legacy "White Cube" system). The two
 *     systems coexist during the V3 rollout and must not cross-pollinate.
 *   - Numeric spacing/radii values are semantic, not raw — adjust the
 *     token, not the call site.
 *   - For themed colors, use `useTheme()` from `@/lib/design`. Only import
 *     DARK_COLORS / LIGHT_COLORS directly for elements that opt out of theming.
 *
 * The trailing comment on each line names the eventual dotted token path
 * (e.g. color.text.primary) so tools/generators can round-trip this
 * module into a platform-agnostic token JSON when we need to.
 */

// ---------------------------------------------------------------------------
// COLOR — DARK MODE (default, premium archive aesthetic)
// ---------------------------------------------------------------------------

export const DARK_COLORS = {
  // Canvas
  void: '#000000',                                   // color.bg.canvas
  
  // Text
  textPrimary: '#f0f0f0',                            // color.text.primary
  textSecondary: '#a1a4a5',                          // color.text.secondary
  textTertiary: '#5c5c5c',                           // color.text.tertiary
  textInverse: '#000000',                            // color.text.inverse (for brand-pill CTA)

  // Structure — "frost" = cool-white borders at varying alpha on void
  frostBorder: 'rgba(214, 235, 253, 0.19)',          // color.border.frost
  frostDivider: 'rgba(214, 235, 253, 0.12)',         // color.border.frost.soft
  frostBorderStrong: 'rgba(214, 235, 253, 0.32)',    // color.border.frost.strong

  // Surfaces
  sheetBg: '#0a0a0a',                                // color.bg.sheet
  pressOverlay: 'rgba(255, 255, 255, 0.06)',         // color.bg.pressed
  scrim: 'rgba(0, 0, 0, 0.7)',                       // color.bg.scrim

  // Brand accent — warm ivory monochrome
  brandVolt: '#E8E0D4',                              // color.brand.volt
  brandVoltFill: 'rgba(232, 224, 212, 0.10)',        // color.brand.volt.fill
  brandVoltBorder: 'rgba(232, 224, 212, 0.28)',      // color.brand.volt.border

  // Semantic accents — status + destructive
  semanticGreen: '#11ff99',                          // color.semantic.green (For Sale)
  semanticGreenFill: 'rgba(17, 255, 153, 0.18)',     // color.semantic.green.fill
  semanticGreenBorder: 'rgba(17, 255, 153, 0.35)',   // color.semantic.green.border

  semanticBlue: '#3b9eff',                           // color.semantic.blue (For Trade)
  semanticBlueFill: 'rgba(59, 158, 255, 0.20)',      // color.semantic.blue.fill
  semanticBlueBorder: 'rgba(59, 158, 255, 0.40)',    // color.semantic.blue.border

  semanticOrange: '#ff801f',                         // color.semantic.orange (Sell + Trade)
  semanticOrangeFill: 'rgba(255, 128, 31, 0.20)',    // color.semantic.orange.fill
  semanticOrangeBorder: 'rgba(255, 128, 31, 0.40)',  // color.semantic.orange.border

  semanticSilverFill: 'rgba(214, 235, 253, 0.12)',   // color.semantic.silver.fill (NFST / neutral)

  semanticRed: '#ff2047',                            // color.semantic.red (destructive)

  // Trait accents — fills at 18% alpha, borders at 40%
  traitPink: '#ec4899',                              // color.trait.rookie
  traitPinkFill: 'rgba(236, 72, 153, 0.18)',         // color.trait.rookie.fill
  traitPinkBorder: 'rgba(236, 72, 153, 0.40)',       // color.trait.rookie.border

  traitViolet: '#a78bfa',                            // color.trait.signed
  traitVioletFill: 'rgba(167, 139, 250, 0.18)',      // color.trait.signed.fill
  traitVioletBorder: 'rgba(167, 139, 250, 0.40)',    // color.trait.signed.border

  traitOlive: '#bbca3a',                             // color.trait.gameUsed
  traitOliveFill: 'rgba(187, 202, 58, 0.18)',        // color.trait.gameUsed.fill
  traitOliveBorder: 'rgba(187, 202, 58, 0.40)',      // color.trait.gameUsed.border

  traitCyan: '#22d3ee',                              // color.trait.graded
  traitCyanFill: 'rgba(34, 211, 238, 0.18)',         // color.trait.graded.fill
  traitCyanBorder: 'rgba(34, 211, 238, 0.40)',       // color.trait.graded.border
} as const;

// ---------------------------------------------------------------------------
// COLOR — LIGHT MODE (clean catalog / gallery aesthetic)
// ---------------------------------------------------------------------------

export const LIGHT_COLORS = {
  // Canvas
  void: '#FFFFFF',                                   // color.bg.canvas

  // Text
  textPrimary: '#1A1A1A',                            // color.text.primary
  textSecondary: '#6B6B6B',                          // color.text.secondary
  textTertiary: '#A0A0A0',                           // color.text.tertiary
  textInverse: '#FFFFFF',                            // color.text.inverse (for brand-pill CTA)

  // Structure — warm gray borders on white
  frostBorder: 'rgba(0, 0, 0, 0.10)',                // color.border.frost
  frostDivider: 'rgba(0, 0, 0, 0.06)',               // color.border.frost.soft
  frostBorderStrong: 'rgba(0, 0, 0, 0.18)',          // color.border.frost.strong

  // Surfaces
  sheetBg: '#F5F5F5',                                // color.bg.sheet
  pressOverlay: 'rgba(0, 0, 0, 0.04)',               // color.bg.pressed
  scrim: 'rgba(0, 0, 0, 0.5)',                       // color.bg.scrim

  // Brand accent — warm gray-brown (ivory darkened for legibility on white)
  brandVolt: '#7A7168',                              // color.brand.volt
  brandVoltFill: 'rgba(122, 113, 104, 0.08)',        // color.brand.volt.fill
  brandVoltBorder: 'rgba(122, 113, 104, 0.20)',      // color.brand.volt.border

  // Semantic accents — same hues, adjusted for light backgrounds
  semanticGreen: '#0DBF73',                          // color.semantic.green (For Sale)
  semanticGreenFill: 'rgba(13, 191, 115, 0.10)',     // color.semantic.green.fill
  semanticGreenBorder: 'rgba(13, 191, 115, 0.28)',   // color.semantic.green.border

  semanticBlue: '#2B7FD4',                           // color.semantic.blue (For Trade)
  semanticBlueFill: 'rgba(43, 127, 212, 0.10)',      // color.semantic.blue.fill
  semanticBlueBorder: 'rgba(43, 127, 212, 0.28)',    // color.semantic.blue.border

  semanticOrange: '#E06B10',                         // color.semantic.orange (Sell + Trade)
  semanticOrangeFill: 'rgba(224, 107, 16, 0.10)',    // color.semantic.orange.fill
  semanticOrangeBorder: 'rgba(224, 107, 16, 0.28)',  // color.semantic.orange.border

  semanticSilverFill: 'rgba(0, 0, 0, 0.05)',         // color.semantic.silver.fill (NFST / neutral)

  semanticRed: '#E5183C',                            // color.semantic.red (destructive)

  // Trait accents — slightly reduced alpha for light backgrounds
  traitPink: '#D93F89',                              // color.trait.rookie
  traitPinkFill: 'rgba(217, 63, 137, 0.10)',         // color.trait.rookie.fill
  traitPinkBorder: 'rgba(217, 63, 137, 0.30)',       // color.trait.rookie.border

  traitViolet: '#8B6EE0',                            // color.trait.signed
  traitVioletFill: 'rgba(139, 110, 224, 0.10)',      // color.trait.signed.fill
  traitVioletBorder: 'rgba(139, 110, 224, 0.30)',    // color.trait.signed.border

  traitOlive: '#9BAA2E',                             // color.trait.gameUsed
  traitOliveFill: 'rgba(155, 170, 46, 0.10)',        // color.trait.gameUsed.fill
  traitOliveBorder: 'rgba(155, 170, 46, 0.30)',      // color.trait.gameUsed.border

  traitCyan: '#1AADCC',                              // color.trait.graded
  traitCyanFill: 'rgba(26, 173, 204, 0.10)',         // color.trait.graded.fill
  traitCyanBorder: 'rgba(26, 173, 204, 0.30)',       // color.trait.graded.border
} as const;

// ---------------------------------------------------------------------------
// BACKWARD COMPAT — `COLORS` alias points to DARK_COLORS.
// Consumers should migrate to `useTheme()` for theme-aware access.
// This alias allows non-component code (StyleSheet outside components,
// utility modules) to still import COLORS without breaking.
// ---------------------------------------------------------------------------

export const COLORS = DARK_COLORS;

// ---------------------------------------------------------------------------
// COLOR SHAPE — type derived from the token objects for the theme system.
// ---------------------------------------------------------------------------

export type ThemeColors = typeof DARK_COLORS;

// ---------------------------------------------------------------------------
// TYPOGRAPHY — font family keys (mapped to loaded @expo-google-fonts faces
// in app/_layout.tsx). These do NOT change between themes.
// ---------------------------------------------------------------------------

export const TYPE = {
  heroDisplay: 'Electrolize',                        // type.family.heroDisplay
  caslonText: 'LibreCaslonText',                     // type.family.serifText
  caslonItalic: 'LibreCaslonText-Italic',            // type.family.serifItalic
  grotesk: 'SpaceGrotesk',                           // type.family.geometric
  groteskMedium: 'SpaceGrotesk-Medium',
  groteskSemiBold: 'SpaceGrotesk-SemiBold',
  groteskBold: 'SpaceGrotesk-Bold',
  inter: 'Inter',                                    // type.family.body
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
  mono: 'JetBrainsMono',                             // type.family.mono
  monoMedium: 'JetBrainsMono-Medium',
} as const;

// ---------------------------------------------------------------------------
// SPACING — semantic scale. Raw numbers should not appear at call sites.
// These do NOT change between themes.
// ---------------------------------------------------------------------------

export const SPACING = {
  gutter: 20,                                        // spacing.gutter
  cardEdge: 4,                                       // spacing.cardEdge
  rowPadX: 16,                                       // spacing.row.x
  rowPadY: 14,                                       // spacing.row.y
  sectionGap: 24,                                    // spacing.section.gap
  kickerGap: 10,                                     // spacing.kicker.gap
  zoneIntra: 16,                                     // spacing.zone.intra
  zoneCluster: 32,                                   // spacing.zone.cluster
  zoneTransition: 48,                                // spacing.zone.transition
} as const;

// ---------------------------------------------------------------------------
// RADII — corner radii scale. These do NOT change between themes.
// ---------------------------------------------------------------------------

export const RADII = {
  sharp: 4,                                          // radius.sharp
  small: 8,                                          // radius.small
  medium: 12,                                        // radius.medium
  card: 16,                                          // radius.card
  pill: 9999,                                        // radius.pill
} as const;

// ---------------------------------------------------------------------------
// TYPES — narrow unions of token keys for compile-time safety at call sites.
// ---------------------------------------------------------------------------

export type ColorToken = keyof ThemeColors;
export type TypeToken = keyof typeof TYPE;
export type SpacingToken = keyof typeof SPACING;
export type RadiusToken = keyof typeof RADII;
