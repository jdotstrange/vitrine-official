import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Brackets } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

/**
 * LensEmpty — affirmative empty-state card used inside lens bodies.
 *
 * Philosophy B (universal lens visibility) requires every lens to have
 * a designed "no content here" state. The empty card communicates the
 * absence as positive information rather than a dead end — a real
 * answer in its own right ("no signature detected", "no comps yet").
 *
 * The card mirrors the dossier shell language (sheetBg + frostBorder +
 * brackets) so the empty state still feels at home inside the V3 surface
 * even when it carries no data. Pad with `lensCardSpacing` from the
 * parent lens scroller so the card lands at a generous focal height.
 */

export interface LensEmptyProps {
  kicker?: string;
  title: string;
  message?: string;
  style?: ViewStyle;
}

export function LensEmpty({ kicker, title, message, style }: LensEmptyProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, style]}>
      <Brackets />
      {kicker ? <Text style={[styles.kicker, { color: colors.textTertiary }]}>{kicker}</Text> : null}
      <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: RADII.card,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  message: {
    marginTop: SPACING.zoneIntra,
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
  },
});
