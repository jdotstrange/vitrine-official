import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, RADII, TYPE } from '@/lib/design';

import { Brackets } from './brackets';

export interface DossierCardProps {
  children: React.ReactNode;
  watermark?: string;
  style?: ViewStyle | ViewStyle[];
  bracketSize?: number;
  bracketColor?: string;
}

/**
 * Vault dossier chrome — bracket-marked card with optional oversized watermark
 * glyph in the bottom-right corner. Used as the identity-zone shell for the
 * collector profile (`Vault ID Card`) and the showcase detail screen
 * (`Showcase Dossier`).
 *
 * Pure presentational shell — caller owns all interior layout.
 */
export function DossierCard({
  children,
  watermark,
  style,
  bracketSize,
  bracketColor,
}: DossierCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, style]}>
      <Brackets size={bracketSize} color={bracketColor} />
      {watermark ? <Text style={[styles.watermark, { color: colors.pressOverlay }]}>{watermark}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: RADII.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    bottom: -10,
    right: -5,
    fontSize: 120,
    fontFamily: TYPE.heroDisplay,
  },
});
