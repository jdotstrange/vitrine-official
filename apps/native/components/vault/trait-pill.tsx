/**
 * TraitPill — inline glass chip communicating a collectible trait
 * (Rookie / Signed / Game Used / Graded).
 *
 * Visually symmetric to <StatusPill />: same geometry, same font,
 * same letter-spacing — so pills read as a single material language
 * (colored glass on void) with hue as the only differentiator.
 *
 * THEME-IMMUNE: These pills always render with dark-mode backing so they
 * look identical regardless of app theme. The semi-transparent fills are
 * designed to composite on a dark surface.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DARK_COLORS, RADII, TYPE, getTraitChrome } from '@vitrine/design-tokens';

type Props = {
  traitKey: string;
};

export function TraitPill({ traitKey }: Props) {
  const chrome = getTraitChrome(traitKey);
  if (!chrome) return null;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: chrome.fill, borderColor: chrome.border },
      ]}
    >
      <Text style={[styles.text, { color: chrome.text }]}>
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
