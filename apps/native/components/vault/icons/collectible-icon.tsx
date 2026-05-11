/**
 * CollectibleIcon — branded glyph that signals "an individual collectible"
 * (a graded slab, a single item in the vault).
 *
 * Composition: outer slab outline + label zone + grade badge + inner card
 * window with corner brackets + bust silhouette + decorative sparkle. The
 * inner-window framing intentionally mirrors the SpatialCard chrome so the
 * icon reads as the same conceptual unit at a glance.
 *
 * Drop-in replacement for `lucide-react-native` icons — same prop shape
 * (`size`, `color`, `strokeWidth`) so existing call sites swap cleanly.
 *
 * Important platform note: presentation-attribute inheritance (`fill`,
 * `stroke`, `stroke-width`) on the outer `<Svg>` is reliable on iOS and
 * web but flaky on some Android renderer versions. The shared attributes
 * therefore live on a single `<G>` wrapper — bulletproof inheritance,
 * and the per-shape props collapse to just geometry.
 */
import * as React from 'react';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  type SvgProps,
} from 'react-native-svg';

export interface CollectibleIconProps extends SvgProps {
  size?: number;
  /** Defaults to `#000` — there is no `currentColor` in React Native. */
  color?: string;
  /**
   * Caller-facing stroke width. Internally scaled by `BRAND_STROKE_SCALE`
   * before render so a value of 2 here produces a stroke that visually
   * matches a Lucide icon at strokeWidth=2 — see comment on the constant.
   */
  strokeWidth?: number;
}

/**
 * Stroke-density compensation. Lucide icons render ~2-8 strokes inside
 * a 24×24 viewBox; this icon packs ~13. At identical raw strokeWidth
 * the branded icon reads visibly chunkier because adjacent strokes
 * compound and visually merge. Multiplying the caller's strokeWidth by
 * 0.65 brings the perceived weight in line with Lucide siblings without
 * forcing every call site to remember branded icons need a different
 * number. Tune this constant to dial all branded icons at once.
 */
const BRAND_STROKE_SCALE = 0.45;

export function CollectibleIcon({
  size = 24,
  color = '#000',
  strokeWidth = 2,
  accessibilityRole = 'image',
  ...props
}: CollectibleIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityRole={accessibilityRole}
      {...props}
    >
      <G
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * BRAND_STROKE_SCALE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer slab */}
        <Rect x="4" y="2" width="16" height="20" rx="2.25" />

        {/* Top label zone */}
        <Rect x="5.5" y="3.75" width="13" height="4.25" rx="1.1" />

        {/* Label lines */}
        <Line x1="7" y1="5.4" x2="10.8" y2="5.4" />
        <Line x1="7" y1="6.8" x2="9.6" y2="6.8" />

        {/* Simplified grade badge */}
        <Rect x="15.3" y="4.6" width="2" height="2.5" rx="0.5" />

        {/* Inner card window */}
        <Rect x="6.2" y="9.1" width="11.6" height="9.3" rx="1.4" />

        {/* Corner brackets */}
        <Path d="M7.4 11v-1.1c0-.22.18-.4.4-.4H9" />
        <Path d="M16.6 11v-1.1c0-.22-.18-.4-.4-.4H15" />
        <Path d="M7.4 16.5v1.1c0 .22.18.4.4.4H9" />
        <Path d="M16.6 16.5v1.1c0 .22-.18.4-.4.4H15" />

        {/* Collectible silhouette */}
        <Circle cx="12" cy="13.1" r="1.55" />
        <Path d="M9.8 16.9v-.7c0-1.02.83-1.85 1.85-1.85h.7c1.02 0 1.85.83 1.85 1.85v.7" />

        {/* Sparkle */}
        <Path d="M16.1 11.2l.25.65.65.25-.65.25-.25.65-.25-.65-.65-.25.65-.25.25-.65Z" />
      </G>
    </Svg>
  );
}
