/**
 * UploadCollectibleIcon — branded glyph for the bottom-dock SCAN tab,
 * which routes to the Upload flow.
 *
 * Composition: domed vitrine top + crown / collectible silhouette on a
 * pedestal + double-decker base. The shape reads as "stage your piece
 * for the vault" rather than the generic OCR scan glyph it replaces.
 *
 * Drop-in replacement for `lucide-react-native` icons — same prop shape
 * (`size`, `color`, `strokeWidth`).
 *
 * Inheritance pattern matches the rest of the branded icon set:
 * presentation attributes live on a single `<G>` wrapper for
 * cross-platform safety.
 */
import * as React from 'react';
import Svg, { G, Line, Path, Rect, type SvgProps } from 'react-native-svg';

export interface UploadCollectibleIconProps extends SvgProps {
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
 * Stroke-density compensation. The dome + pedestal + crown + double
 * base compose ~9 strokes inside a 24×24 viewBox — denser than the
 * typical Lucide icon (2-8). At identical raw strokeWidth this icon
 * reads chunkier than its dock siblings, so we scale the caller's
 * value by 0.65 for visual parity. Tune this constant to dial all
 * branded icons at once.
 */
const BRAND_STROKE_SCALE = 0.45;

export function UploadCollectibleIcon({
  size = 24,
  color = '#000',
  strokeWidth = 2,
  accessibilityRole = 'image',
  ...props
}: UploadCollectibleIconProps) {
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
        {/* Dome / vitrine */}
        <Path d="M6 14V8a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v6" />

        {/* Small top highlight */}
        <Line x1="10.1" y1="5.2" x2="13.9" y2="5.2" />

        {/* Inner pedestal */}
        <Rect x="8" y="12.1" width="8" height="2.5" rx="1" />

        {/* Crown / collectible */}
        <Path d="M9.2 12.1 8.2 9l2.7 1.35L12 8.2l1.1 2.15L15.8 9l-1 3.1" />

        {/* Mid base */}
        <Rect x="4" y="14" width="16" height="2.2" rx="1.1" />

        {/* Bottom base */}
        <Path d="M4.4 17.1H19.6c.77 0 1.4.63 1.4 1.4v.1c0 .77-.63 1.4-1.4 1.4H4.4c-.77 0-1.4-.63-1.4-1.4v-.1c0-.77.63-1.4 1.4-1.4Z" />

        {/* Small connectors from mid base to bottom base */}
        <Line x1="4.3" y1="16.2" x2="4.3" y2="17.1" />
        <Line x1="19.7" y1="16.2" x2="19.7" y2="17.1" />
      </G>
    </Svg>
  );
}
