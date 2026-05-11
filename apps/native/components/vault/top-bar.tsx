import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, SPACING } from '@/lib/design';

/**
 * TopBar — V3 screen-level top navigation.
 *
 * Absolute-over-content by default (the screen scrolls under it), with
 * safe-area-aware top padding and a 44pt content row that hosts IconButtons
 * or labels. Three slots — `left`, `center`, `right` — each an arbitrary
 * `ReactNode`, keeps the shell composition-friendly.
 *
 * Two modes:
 *   overlay (default) — absolute-positioned, transparent background.
 *                        Use when imagery scrolls beneath it (detail, profile).
 *   solid             — in-flow, void-black fill with hairline bottom border.
 *                        Use when the screen has no hero and the nav needs
 *                        its own canvas edge.
 */

export interface TopBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  variant?: 'overlay' | 'solid';
  style?: ViewStyle;
}

export function TopBar({
  left,
  center,
  right,
  variant = 'overlay',
  style,
}: TopBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.base,
        variant === 'overlay'
          ? styles.overlay
          : [styles.solid, { backgroundColor: colors.void, borderBottomColor: colors.frostBorder }],
        { paddingTop: insets.top + 4 },
        style,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        <View style={styles.sideLeft}>{left}</View>
        <View style={styles.center} pointerEvents="box-none">
          {center}
        </View>
        <View style={styles.sideRight}>{right}</View>
      </View>
    </View>
  );
}

const HEIGHT = 44;

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: SPACING.gutter - 10,
    paddingBottom: 4,
    zIndex: 50,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  solid: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: HEIGHT,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: HEIGHT,
    justifyContent: 'flex-end',
  },
});
