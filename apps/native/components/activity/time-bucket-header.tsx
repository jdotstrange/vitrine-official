/**
 * TimeBucketHeader — section divider between time buckets in the
 * Activity lens (TODAY / YESTERDAY / THIS WEEK / EARLIER).
 *
 * Visual DNA mirrors the messages-lens kicker treatment: mono uppercase
 * text in textTertiary at 11pt with generous letter-spacing. Sticks to
 * the gutter rhythm and never gets a trailing rule (rows themselves
 * carry their own dividers via the surrounding lens).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, SPACING, TYPE } from '@/lib/design';

export interface TimeBucketHeaderProps {
  label: string;
}

export function TimeBucketHeader({ label }: TimeBucketHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, { color: colors.textTertiary }]} accessibilityRole="header">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.zoneIntra,
    paddingTop: 24,
    paddingBottom: 8,
  },
  text: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
  },
});
