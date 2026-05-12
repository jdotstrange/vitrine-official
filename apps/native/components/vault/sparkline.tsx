import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design';
import { DARK_COLORS } from '@vitrine/design-tokens';

export interface SparklineProps {
  /** Numeric series, oldest → newest. Empty array renders a flat baseline. */
  data: number[];
  /** Bar fill color. Defaults to brandVolt. Pass a token name from COLORS or a raw hex. */
  color?: string;
  /** Total component height in dp. */
  height?: number;
  /** Per-bar width in dp. Use 2-4 for tight density, 6-8 for sparse strokes. */
  barWidth?: number;
  /** Gap between bars in dp. */
  gap?: number;
  /** Outer container style. */
  style?: ViewStyle | ViewStyle[];
  /** Minimum bar height for non-zero values, so very small values stay visible. */
  minBarHeight?: number;
}

/**
 * Tiny bar-style sparkline. Pure View / no SVG dependency. Used inside
 * TelemetryCard panels and anywhere a glanceable trend shape is wanted.
 *
 * Renders bars from baseline (bottom-aligned) with each bar's height as a
 * proportion of the series max. A `minBarHeight` (default 1dp) keeps near-zero
 * values from disappearing entirely.
 */
export function Sparkline({
  data,
  color = DARK_COLORS.brandVolt,
  height = 18,
  barWidth = 3,
  gap = 2,
  style,
  minBarHeight = 1,
}: SparklineProps) {
  const { colors } = useTheme();

  const max = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data, 1);
  }, [data]);

  if (data.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { height, backgroundColor: colors.frostDivider },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[styles.row, { height, gap }, style]}>
      {data.map((v, i) => {
        const ratio = Math.max(0, v) / max;
        const barH = Math.max(v > 0 ? minBarHeight : 0, ratio * height);
        return (
          <View
            key={i}
            style={{
              width: barWidth,
              height: barH,
              backgroundColor: v > 0 ? color : colors.frostDivider,
              borderRadius: 1,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  empty: {
    height: 1,
    borderRadius: 1,
  },
});
