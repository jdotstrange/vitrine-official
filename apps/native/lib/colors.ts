// Vitrine Design System — "White Cube" Contemporary Gallery palette
// Stark white backgrounds, crisp charcoal typography, delicate borders.
// Mint and warm neutrals reserved strictly for semantic accents.

export const colors = {
  // --- Foundation (stark light) ---
  background: '#FFFFFF',
  foreground: '#111111',

  // --- Surfaces (elevated layers) ---
  card: '#FFFFFF',
  cardForeground: '#111111',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F5F0',

  // --- Brand primary (deep charcoal for high-end editorial feel) ---
  primary: '#111111',
  primaryForeground: '#FFFFFF',
  primaryMuted: 'rgba(17, 17, 17, 0.05)',
  primaryGlow: 'rgba(17, 17, 17, 0.05)',

  // --- Secondary ---
  secondary: '#F5F5F0',
  secondaryForeground: '#3A3A38',

  // --- Muted ---
  muted: '#F5F5F0',
  mutedForeground: '#8A8A82',

  // --- Accent (mint — reserved for highlights/success) ---
  accent: '#2D9B4C',
  accentForeground: '#FFFFFF',
  accentMuted: 'rgba(45, 155, 76, 0.10)',
  accentGlow: 'rgba(45, 155, 76, 0.10)',

  // --- Warm UI palette (for subtle card tints) ---
  warmSand: '#E7D5BA',
  warmSage: '#EAEFDE',
  warmIvory: '#FAFAF7',

  // --- Borders (delicate) ---
  border: 'rgba(0, 0, 0, 0.08)',

  // --- Status quartet (muted jewels, scannable by hue) ---
  statusSale: '#B44A3E',
  statusTrade: '#4A7E95',
  statusSellTrade: '#A47B3A',
  statusNfst: '#8A8A82',

  // --- Glass effects (frosted white) ---
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  gradientOverlay: 'rgba(255, 255, 255, 0.85)',

  // --- Glow (subtle shadow/glow) ---
  glowGold: 'rgba(0, 0, 0, 0.03)',

  // --- Attention (deep green) ---
  attention: '#2D9B4C',

  // --- Semantic / functional ---
  destructive: '#B44A3E',
  destructiveForeground: '#FFFFFF',
  success: '#2D9B4C',
  successForeground: '#FFFFFF',
  warning: '#A47B3A',

  // --- Detail coverage density ---
  densityLow: '#8A8A82',
  densityMedium: '#3A3A38',
  densityHigh: '#111111',

  // --- QR code rendering ---
  qrBackground: '#FFFFFF',
  qrForeground: '#111111',

  // --- Upload flow gradients (subtle light tints) ---
  gradientCyan: '#EAEFDE',
  gradientTeal: '#F5F5F0',
  gradientPink: '#F9EAE8',
  gradientRose: '#F0D4D0',

  // --- Value change indicators ---
  positive: '#2D9B4C',
  negative: '#B44A3E',
  neutral: '#8A8A82',

  // --- Skeleton loading states ---
  skeletonBase: '#F5F5F0',
  skeletonHighlight: '#FFFFFF',

  // --- Misc UI ---
  onlineDot: '#2D9B4C',
  offlineText: '#8A8A82',

  // =========================================================
  // Legacy aliases — point to new values for backward compat.
  // Will be removed once all references are cleaned up.
  // =========================================================
  cyberCyan: '#111111',
  neonMagenta: '#111111',
  holoGreen: '#2D9B4C',
  plasmaOrange: '#A47B3A',
  voidPurple: '#8A8A82',
  smartAmber: '#A47B3A',

  glowCyan: 'rgba(0,0,0,0.03)',
  glowMagenta: 'rgba(0,0,0,0.03)',
  glowAmber: 'rgba(0,0,0,0.03)',
} as const;
