/**
 * StatusPill — inline glass chip communicating a collectible's listing
 * state (For Sale / For Trade / Sell + Trade / NFST).
 *
 * Material language: colored glass on void. Fill + border + text color
 * all flow from STATUS_CONFIG so adding a new status anywhere in the
 * system means editing exactly one file (lib/design/status-config.ts).
 *
 * THEME-IMMUNE: These pills always render with dark-mode backing so they
 * look identical regardless of app theme. The semi-transparent fills are
 * designed to composite on a dark surface.
 *
 * Exception: pass `inverted` to render with a light surface-friendly
 * treatment (used on the detail screen where the pill sits on the canvas).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, DARK_COLORS, RADII, STATUS_CONFIG, TYPE, type ListingStatus } from '@/lib/design';

type Props = {
  status: ListingStatus;
  inverted?: boolean;
};

const INVERTED_NFST = {
  fill: 'rgba(0, 0, 0, 0.06)',
  border: 'rgba(0, 0, 0, 0.14)',
  text: '#1A1A1A',
};

export function StatusPill({ status, inverted = false }: Props) {
  const { resolvedMode } = useTheme();
  const chrome = STATUS_CONFIG[status];

  const useInverted = inverted && status === 'NFST' && resolvedMode === 'light';

  return (
    <View
      style={[
        styles.pill,
        useInverted
          ? { backgroundColor: INVERTED_NFST.fill, borderColor: INVERTED_NFST.border }
          : { backgroundColor: chrome.fill, borderColor: chrome.border },
      ]}
    >
      <Text style={[styles.text, { color: useInverted ? INVERTED_NFST.text : chrome.text }]}>
        {chrome.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 3,
    justifyContent: 'center',
    backgroundColor: DARK_COLORS.sheetBg,
  },
  text: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.0,
    lineHeight: 13,
  },
});
