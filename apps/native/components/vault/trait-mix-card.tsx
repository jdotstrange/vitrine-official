import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, COLORS, TYPE, getTraitChrome } from '@/lib/design';

import { Brackets } from './brackets';

export type TraitMixEntry = {
  /** Trait key (e.g. `is_rookie`, `is_autographed`). Resolved via TRAIT_CONFIG. */
  traitKey: string;
  count: number;
  pct: number;
};

export interface TraitMixCardProps {
  traits: TraitMixEntry[];
  title?: string;
  /** Cap the number of bars rendered. Falsy/0 = no cap. */
  topN?: number;
  style?: ViewStyle | ViewStyle[];
}

const FALLBACK_CHROME = {
  label: '',
  fill: COLORS.frostBorder,
  border: COLORS.frostBorderStrong,
  text: COLORS.textSecondary,
};

const TRACK_HEIGHT = 6;

/**
 * Per-trait composition card. Renders one horizontal bar per trait, sorted by
 * caller order (typically count desc), with the trait's canonical color from
 * TRAIT_CONFIG. Caps at `topN` if provided.
 *
 * Chrome rhythm matches AssetMatrixCard so both can stack inside a Collection
 * DNA section without visual drift.
 */
export function TraitMixCard({
  traits,
  title = 'TRAIT MIX',
  topN,
  style,
}: TraitMixCardProps) {
  const { colors } = useTheme();
  const visible = topN && topN > 0 ? traits.slice(0, topN) : traits;
  const traitLabel = `${traits.length} TRAIT${traits.length !== 1 ? 'S' : ''}`;

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, style]}>
      <Brackets />
      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{traitLabel}</Text>
      </View>

      <View style={styles.rows}>
        {visible.map((entry) => {
          const chrome = getTraitChrome(entry.traitKey) ?? FALLBACK_CHROME;
          const label = chrome.label || entry.traitKey.replace(/^is_/, '').replace(/_/g, ' ');
          const fillWidth = `${Math.max(0, Math.min(100, entry.pct))}%` as const;
          return (
            <View key={entry.traitKey} style={styles.row}>
              <View style={styles.labelCol}>
                <View style={[styles.dot, { backgroundColor: chrome.text }]} />
                <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
                  {label.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.frostDivider }]}>
                <View
                  style={[
                    styles.fill,
                    { width: fillWidth, backgroundColor: chrome.text },
                  ]}
                />
              </View>
              <Text style={[styles.pct, { color: colors.textPrimary }]}>{entry.pct}%</Text>
            </View>
          );
        })}
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
    marginBottom: 14,
  },
  subLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 110,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    flex: 1,
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
  },
  pct: {
    width: 38,
    textAlign: 'right',
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
  },
});
