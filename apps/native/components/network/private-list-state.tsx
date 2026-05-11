/**
 * PrivateListState — empty-state for the FOLLOWERS / FOLLOWING chips on
 * the V3 NETWORK lens when the profile owner has set
 * `follow_lists_visibility = 'private'` and the viewer isn't the owner.
 *
 * Visual language matches the EmptyState used elsewhere in the V3
 * surfaces (Brackets card on void), but the lock glyph and copy make
 * it clear this is a deliberate privacy choice rather than empty data.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { Brackets } from '@/components/vault/brackets';
import { useTheme, SPACING, TYPE } from '@/lib/design';

const GUTTER = SPACING.zoneIntra;

export interface PrivateListStateProps {
  /** "FOLLOWERS" or "FOLLOWING" — drives the headline. */
  label: string;
}

export function PrivateListState({ label }: PrivateListStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Lock size={20} color={colors.textSecondary} strokeWidth={1.6} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{label.toUpperCase()} HIDDEN</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This collector has chosen to keep this list private.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: GUTTER,
    paddingTop: 48,
  },
  card: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 16,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
