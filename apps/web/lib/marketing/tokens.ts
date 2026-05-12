/**
 * Token bridge for V3 marketing inline styles.
 *
 * Section components use hundreds of inline styles like
 * `style={{ color: T.fg2, borderColor: T.frostBorder }}`. Each value here
 * resolves to a `var(--*)` reference defined in apps/web/app/globals.css,
 * which in turn mirrors the V3 dark palette in `@vitrine/design-tokens`.
 *
 * This is the only place in the web app that declares CSS-variable-string
 * literals — section files import `T` and reference its keys, so any future
 * palette change happens in one place.
 */

export const T = {
  // Canvas
  void: "var(--void)",

  // Text
  fg1: "var(--fg1)",
  fg2: "var(--fg2)",
  fg3: "var(--fg3)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textTertiary: "var(--text-tertiary)",
  textInverse: "var(--text-inverse)",

  // Frost
  frostBorder: "var(--frost-border)",
  frostDiv: "var(--frost-divider)",
  frostBorderStrong: "var(--frost-border-strong)",

  // Surface
  sheetBg: "var(--sheet-bg)",
  pressOverlay: "var(--press-overlay)",
  scrim: "var(--scrim)",

  // Brand
  volt: "var(--brand-volt)",
  voltFill: "var(--brand-volt-fill)",
  voltBorder: "var(--brand-volt-border)",

  // Semantic
  green: "var(--semantic-green)",
  greenFill: "var(--semantic-green-fill)",
  greenBorder: "var(--semantic-green-border)",
  blue: "var(--semantic-blue)",
  blueFill: "var(--semantic-blue-fill)",
  blueBorder: "var(--semantic-blue-border)",
  orange: "var(--semantic-orange)",
  orangeFill: "var(--semantic-orange-fill)",
  orangeBorder: "var(--semantic-orange-border)",
  silverFill: "var(--semantic-silver-fill)",
  red: "var(--semantic-red)",

  // Trait
  pink: "var(--trait-pink)",
  pinkFill: "var(--trait-pink-fill)",
  pinkBorder: "var(--trait-pink-border)",
  violet: "var(--trait-violet)",
  violetFill: "var(--trait-violet-fill)",
  violetBorder: "var(--trait-violet-border)",
  olive: "var(--trait-olive)",
  oliveFill: "var(--trait-olive-fill)",
  oliveBorder: "var(--trait-olive-border)",
  cyan: "var(--trait-cyan)",
  cyanFill: "var(--trait-cyan-fill)",
  cyanBorder: "var(--trait-cyan-border)",

  // Match grades
  matchPerfect: "var(--match-perfect)",
  matchStrong: "var(--match-strong)",
  matchLoose: "var(--match-loose)",

  // Fonts (string family references for inline styles)
  fontDisplay: "var(--font-electrolize), system-ui, sans-serif",
  fontGrotesk: "var(--font-grotesk), system-ui, sans-serif",
  fontInter: "var(--font-inter), system-ui, sans-serif",
  fontCaslon: "var(--font-caslon), Georgia, serif",
  fontMono: "var(--font-jetbrains-mono), ui-monospace, Menlo, monospace",
} as const

export type TokenKey = keyof typeof T
