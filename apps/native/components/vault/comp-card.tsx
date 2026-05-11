/**
 * CompCard — single comparable-listing card for the comps grid.
 *
 * Composition pattern:
 *   CompCard = <GridCard /> shell + <CompMeta /> content slot.
 *
 * Data contract matches the shape the (future) universal comps RPC will
 * return:
 *   { id, photoUrl?, title, subtitle, price, matchPct, status }
 *
 * The card is pure data — no chrome, no frame. The photo well borrows
 * GridCard's standard treatment; the meta block is a three-line stack:
 *
 *   [matchPct]  [price]       ← baseline row, mono medium, peer weight
 *   [title]                   ← bold identity line (Inter SemiBold)
 *   [subtitle]                ← variant/year line (Inter)
 *
 * Status is communicated by a <StatusDot variant="overlay" /> on the
 * photo; there's no textual status label on the card by design — the
 * dot is enough at this density.
 *
 * Usage:
 *   <CompCard comp={comp} onPress={() => nav(comp.id)} width={cardWidth} />
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, TYPE, type ListingStatus } from '@/lib/design';

import { GridCard } from './grid-card';
import { MatchPercent } from './match-percent';
import { StatusDot } from './status-dot';

export type CompData = {
  id: string;
  photoUrl?: string | null;
  title: string;
  subtitle: string;
  price: number;
  matchPct: number;
  status: ListingStatus;
};

type Props = {
  comp: CompData;
  onPress?: () => void;
  width?: number;
};

export function CompCard({ comp, onPress, width }: Props) {
  return (
    <GridCard
      photoUrl={comp.photoUrl}
      overlay={<StatusDot status={comp.status} variant="overlay" />}
      onPress={onPress}
      width={width}
      accessibilityLabel={`${comp.title}, ${comp.subtitle}, ${comp.matchPct}% match, $${comp.price}`}
    >
      <CompMeta {...comp} />
    </GridCard>
  );
}

/**
 * CompMeta — the content portion of a CompCard.
 * Exported so variant galleries (design-system screen) can render it
 * standalone when demonstrating the composition pattern.
 */
export function CompMeta({
  title,
  subtitle,
  price,
  matchPct,
}: Pick<CompData, 'title' | 'subtitle' | 'price' | 'matchPct'>) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.row}>
        <MatchPercent pct={matchPct} />
        <Text style={[styles.price, { color: colors.textPrimary }]}>
          ${price.toLocaleString()}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,                                 // spacing.card.metaRow-to-title
  },
  price: {
    fontFamily: TYPE.monoMedium,
    fontSize: 13,                                    // peer to match %
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 16,
  },
});
