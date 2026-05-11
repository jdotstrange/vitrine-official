/**
 * ShowcaseIcon — branded glyph that signals "a curated collection
 * presentation" (the vitrine itself, glass + shelf + a small array of
 * staged collectibles).
 *
 * Composition: glass-cabinet outline with reflection ticks + base
 * shelf + three stylized collectibles inside (graded slab, medallion
 * on stand, gem on pedestal). Reads as a tiny museum case at a glance.
 *
 * Drop-in replacement for `lucide-react-native` icons — same prop shape
 * (`size`, `color`, `strokeWidth`).
 *
 * Inheritance pattern matches CollectibleIcon: presentation attributes
 * live on a single `<G>` wrapper so cross-platform fill defaults
 * never silently flip an outline into a black blob.
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

export interface ShowcaseIconProps extends SvgProps {
  size?: number;
  color?: string;
  /**
   * Caller-facing stroke width. Internally scaled by `BRAND_STROKE_SCALE`
   * before render so a value of 2 here produces a stroke that visually
   * matches a Lucide icon at strokeWidth=2 — see comment on the constant.
   */
  strokeWidth?: number;
}

/**
 * Stroke-density compensation. The vitrine + 3 staged collectibles
 * compose ~24 strokes inside a 24×24 viewBox versus Lucide's typical
 * 2-8. At identical raw strokeWidth this icon reads visibly chunkier
 * because adjacent strokes compound. Multiplying the caller's
 * strokeWidth by 0.65 brings perceived weight in line with Lucide
 * siblings. Tune this constant to dial all branded icons at once.
 */
const BRAND_STROKE_SCALE = 0.45;

export function ShowcaseIcon({
  size = 24,
  color = '#000',
  strokeWidth = 2,
  accessibilityRole = 'image',
  ...props
}: ShowcaseIconProps) {
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
        {/* Top vitrine lid */}
        <Path d="M3.2 5.5 4.1 4.5h15.8l.9 1" />
        <Line x1="3.2" y1="5.5" x2="20.8" y2="5.5" />

        {/* Vitrine frame */}
        <Line x1="4" y1="5.5" x2="4" y2="16" />
        <Line x1="20" y1="5.5" x2="20" y2="16" />

        {/* Shelf / base */}
        <Line x1="4" y1="16" x2="20" y2="16" />
        <Rect x="3" y="16" width="18" height="4.25" rx="1.2" />

        {/* Little feet */}
        <Line x1="4.8" y1="20.25" x2="4.8" y2="21" />
        <Line x1="19.2" y1="20.25" x2="19.2" y2="21" />

        {/* Glass reflections */}
        <Line x1="5.7" y1="8" x2="6.8" y2="6.9" />
        <Line x1="6.5" y1="8.8" x2="7.6" y2="7.7" />
        <Line x1="17.2" y1="8" x2="18.3" y2="6.9" />
        <Line x1="18" y1="8.8" x2="19.1" y2="7.7" />

        {/* Left collectible: graded slab */}
        <Rect x="5.8" y="10" width="3.7" height="4.9" rx="0.5" />
        <Line x1="6.5" y1="11" x2="8.6" y2="11" />
        <Circle cx="7.65" cy="12.5" r="0.7" />
        <Path d="M6.7 14.05v-.25c0-.62.51-1.13 1.13-1.13h.04c.62 0 1.13.51 1.13 1.13v.25" />
        <Path d="M5.5 15.8v-1.1c0-.22.18-.4.4-.4M9.8 15.8v-1.1c0-.22-.18-.4-.4-.4" />

        {/* Center collectible: medallion on stand */}
        <Circle cx="13" cy="12.3" r="1.55" />
        <Path d="M13 11.2l.33.84.9.06-.69.57.22.88-.76-.48-.76.48.22-.88-.69-.57.9-.06.33-.84Z" />
        <Line x1="12.55" y1="13.85" x2="12.55" y2="15" />
        <Line x1="13.45" y1="13.85" x2="13.45" y2="15" />
        <Rect x="12.1" y="15" width="1.8" height="0.75" rx="0.2" />

        {/* Right collectible: gem on base */}
        <Path d="M16.6 11.55 17.4 10.75h1.6l.8.8-1.6 1.85-1.6-1.85Z" />
        <Path d="M17.4 10.75 18.2 13.4 19 10.75" />
        <Rect x="17.2" y="15" width="2" height="0.75" rx="0.2" />
      </G>
    </Svg>
  );
}
