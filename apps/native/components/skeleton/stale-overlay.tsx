import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/design';

/**
 * Dim overlay while search/market refetches — keeps prior results visible
 * underneath (stale-while-revalidate) without blocking scroll.
 */
export function SearchRefetchOverlay() {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityElementsHidden>
      <View style={[styles.scrim, { backgroundColor: colors.void }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  scrim: {
    flex: 1,
    opacity: 0.45,
  },
});
