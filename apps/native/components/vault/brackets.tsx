import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme, COLORS } from '@/lib/design';

export interface BracketsProps {
  size?: number;
  color?: string;
}

/**
 * Four corner-bracket marks rendered as absolute overlays inside a relatively-
 * positioned parent. Adds the V3 vault chrome cue without drawing a full border.
 *
 * Parent must have `position: 'relative'` and `overflow: 'hidden'` (or render
 * the brackets after content if no overflow clipping is desired).
 */
export function Brackets({ size = 8, color = COLORS.frostBorderStrong }: BracketsProps) {
  const { colors } = useTheme();
  return (
    <>
      <View
        style={[
          styles.corner,
          {
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderTopColor: color,
            borderLeftColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.corner,
          {
            top: 0,
            right: 0,
            width: size,
            height: size,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderTopColor: color,
            borderRightColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.corner,
          {
            bottom: 0,
            left: 0,
            width: size,
            height: size,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
            borderBottomColor: color,
            borderLeftColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.corner,
          {
            bottom: 0,
            right: 0,
            width: size,
            height: size,
            borderBottomWidth: 1,
            borderRightWidth: 1,
            borderBottomColor: color,
            borderRightColor: color,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute' },
});
