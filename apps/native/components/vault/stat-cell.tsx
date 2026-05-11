/**
 * StatCell — diagnostic readout cell. Value over label.
 *
 * Used in summary bars and heads-up stat rails (comps summary bar,
 * portfolio overview, etc.). Centered by default so stacked cells align
 * with vertical dividers. Mono styling is on by default because these
 * almost always render numeric data; set `mono={false}` for label-style
 * values like status or category.
 *
 * Composition pattern: cells sit inside a parent row with hairline
 * dividers. Parents handle layout (flex, dividers); this component only
 * handles typographic presentation.
 *
 *   <View style={{ flexDirection: 'row' }}>
 *     <StatCell label="COMPS" value="24" />
 *     <View style={{ width: StyleSheet.hairlineWidth, ... }} />
 *     <StatCell label="MEDIAN" value="$2,400" />
 *   </View>
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, TYPE } from '@/lib/design';

type Props = {
  label: string;
  value: string;
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
};

export function StatCell({ label, value, mono = true, align = 'center' }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.cell, { alignItems: alignMap[align] }]}>
      <Text
        style={[
          styles.value,
          { color: colors.textPrimary },
          mono ? styles.valueMono : null,
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const alignMap = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
} as const;

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    gap: 6,
  },
  value: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 20,
  },
  valueMono: {
    fontFamily: TYPE.monoMedium,
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
});
