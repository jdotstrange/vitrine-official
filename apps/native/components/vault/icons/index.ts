/**
 * Branded iconography — V3 vault icons.
 *
 * Drop-in replacements for `lucide-react-native` icons in spots where
 * the off-the-shelf Camera / Package / LayoutGrid / ScanText glyphs
 * felt generic. Same prop shape (`size`, `color`, `strokeWidth`) so
 * call sites swap without ceremony.
 *
 * All branded icons share a common implementation pattern:
 *   - 24×24 viewBox to match Lucide
 *   - presentation attributes (fill, stroke, strokeWidth, line caps)
 *     live on a single `<G>` wrapper for cross-platform inheritance
 *   - default `color = '#000'` (no `currentColor` — RN has no cascade)
 *   - default `accessibilityRole = 'image'`
 *
 * Re-exported through `@/components/vault` so consumers import alongside
 * the rest of the V3 design primitives.
 */

export { CollectibleIcon } from './collectible-icon';
export type { CollectibleIconProps } from './collectible-icon';

export { ShowcaseIcon } from './showcase-icon';
export type { ShowcaseIconProps } from './showcase-icon';

export { VitrineMarkIcon } from './vitrine-mark-icon';
export type { VitrineMarkIconProps } from './vitrine-mark-icon';
