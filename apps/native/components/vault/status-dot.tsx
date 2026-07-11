/**
 * StatusDot — dot-only form of <StatusPill />.
 *
 * Two variants:
 *
 *   inline   — plain colored dot, 6pt. Used next to labels in dense rows
 *              (e.g. compact legends, embedded in text).
 *
 *   overlay  — 7pt dot inside a 14pt dark bezel ring. Used on top of
 *              imagery (comp cards, grid cells) so the dot stays legible
 *              against any photo.
 *
 * Both read color from STATUS_CONFIG.dot (not the pill's text color) so
 * the dot can read cleanly on imagery where a bright-green fill would
 * risk glare.
 *
 * Usage:
 *   <StatusDot status="FOR_SALE" />                       // inline, default
 *   <StatusDot status="FOR_SALE" variant="overlay" />     // photo overlay
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { STATUS_CONFIG, type ListingStatus } from '@/lib/design';

type Props = {
  status: ListingStatus;
  variant?: 'inline' | 'overlay';
};

export function StatusDot({ status, variant = 'inline' }: Props) {
  const color = (STATUS_CONFIG[status] ?? STATUS_CONFIG.NFST).dot;

  if (variant === 'overlay') {
    return (
      <View style={styles.bezel}>
        <View style={[styles.core, { backgroundColor: color }]} />
      </View>
    );
  }

  return <View style={[styles.inline, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  inline: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bezel: {
    width: 14,                                       // size.dot.bezel
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',          // color.bg.dotBezel
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 7,                                        // size.dot.core
    height: 7,
    borderRadius: 3.5,
  },
});
