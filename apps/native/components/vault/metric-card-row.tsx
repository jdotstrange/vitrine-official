import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, TYPE } from '@/lib/design';

import { Brackets } from './brackets';

export type MetricCardEntry = {
  label: string;
  value: React.ReactNode;
};

export interface MetricCardRowProps {
  metrics: MetricCardEntry[];
  style?: ViewStyle | ViewStyle[];
  gap?: number;
}

/**
 * N-up bracket-marked metric cards. Renders a horizontal row of equal-flex
 * cards, each with a small uppercase label and a mono-typed value. `value` is
 * a ReactNode so callers can compose mixed-color spans (e.g. `$` muted +
 * digits primary).
 *
 * Default usage is two metrics (matches profile + showcase chrome). Three+
 * works but cards compress fast — design carefully past two.
 */
export function MetricCardRow({ metrics, style, gap = 16 }: MetricCardRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { gap }, style]}>
      {metrics.map((metric, index) => (
        <View
          key={`${metric.label}-${index}`}
          style={[
            styles.card,
            { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
          ]}
        >
          <Brackets />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {metric.label}
          </Text>
          {typeof metric.value === 'string' || typeof metric.value === 'number' ? (
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {metric.value}
            </Text>
          ) : (
            metric.value
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  label: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: {
    fontFamily: TYPE.monoMedium,
    fontSize: 24,
    letterSpacing: -0.5,
  },
});

/**
 * Base style for metric card values. Exported so callers passing a composite
 * `value` ReactNode (mixed-color spans, etc.) can wrap their custom Text in
 * the same base typography.
 */
export const metricValueTextStyle = styles.value;
