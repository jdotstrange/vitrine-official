import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { COLORS, useTheme, TYPE } from '@/lib/design';

import { Brackets } from './brackets';

export type AssetMatrixSegment = {
  label: string;
  count: number;
  pct: number;
};

export interface AssetMatrixCardProps {
  segments: AssetMatrixSegment[];
  title?: string;
  colors?: string[];
  style?: ViewStyle | ViewStyle[];
}

const DEFAULT_PALETTE = [
  COLORS.brandVolt,
  COLORS.textPrimary,
  COLORS.textSecondary,
  COLORS.frostBorderStrong,
  COLORS.traitCyan,
  COLORS.traitViolet,
];

const BAR_TRACK_HEIGHT = 32;
const BAR_DENSITY = 90;

/**
 * Visual breakdown of a collection's type composition rendered as a stylized
 * barcode-spectrum bar. Each segment owns a slice of the bar proportional to
 * its `pct`; the legend below maps colors to type labels and percentages.
 *
 * Pure presentational — caller computes the segments. Defaults to the V3
 * `MATRIX_COLORS` palette but accepts a `colors` override.
 */
export function AssetMatrixCard({
  segments,
  title = 'ASSET MATRIX',
  colors = DEFAULT_PALETTE,
  style,
}: AssetMatrixCardProps) {
  const { colors: themeColors } = useTheme();
  const typeLabel = `${segments.length} TYPE${segments.length !== 1 ? 'S' : ''}`;

  return (
    <View style={[styles.card, { backgroundColor: themeColors.sheetBg, borderColor: themeColors.frostBorder }, style]}>
      <Brackets />
      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: themeColors.textSecondary }]}>{title}</Text>
        <Text style={[styles.subLabel, { color: themeColors.textSecondary }]}>{typeLabel}</Text>
      </View>

      <View style={styles.barsContainer}>
        <View style={[styles.midline, { backgroundColor: themeColors.frostDivider }]} />
        <View style={styles.barsRow}>
          {segments.map((segment, segmentIndex) => {
            const barCount = Math.max(Math.round((segment.pct / 100) * BAR_DENSITY), 2);
            const color = colors[segmentIndex % colors.length];
            return Array.from({ length: barCount }).map((_, barIndex) => (
              <View
                key={`${segmentIndex}-${barIndex}`}
                style={{
                  width: 2,
                  borderRadius: 1,
                  backgroundColor: color,
                  opacity: segmentIndex === 0 ? 0.9 : 0.8 - segmentIndex * 0.15,
                  height:
                    ((40 + Math.abs(Math.sin(barIndex * (0.5 + segmentIndex * 0.3))) * 60) /
                      100) *
                    BAR_TRACK_HEIGHT,
                }}
              />
            ));
          })}
        </View>
      </View>

      <View style={styles.legendGrid}>
        {segments.map((segment, segmentIndex) => (
          <View key={segment.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors[segmentIndex % colors.length] },
              ]}
            />
            <Text style={[styles.legendLabel, { color: themeColors.textSecondary }]}>{segment.label}</Text>
            <Text style={[styles.legendPct, { color: themeColors.textPrimary }]}>{segment.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  barsContainer: {
    height: BAR_TRACK_HEIGHT,
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  midline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 16,
    height: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    height: BAR_TRACK_HEIGHT,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    flex: 1,
  },
  legendPct: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
  },
});
