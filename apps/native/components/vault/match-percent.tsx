/**
 * MatchPercent — tiered match-percentage label for comps.
 *
 * Text is rendered in monospace medium at a size peer to the card price
 * so the two numbers read as equal-weight data. Color is pulled from the
 * tier band: perfect (≥90) = green, strong (70–89) = blue, loose (<70) =
 * neutral primary text. See lib/design/match-tiers.ts for the contract.
 *
 * Usage:
 *   <MatchPercent pct={98} />
 *   <MatchPercent pct={74} />       // loose band
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { TYPE, getMatchTier } from '@/lib/design';

type Props = {
  pct: number;
};

export function MatchPercent({ pct }: Props) {
  const { color } = getMatchTier(pct);
  return <Text style={[styles.text, { color }]}>{pct}%</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: TYPE.monoMedium,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
