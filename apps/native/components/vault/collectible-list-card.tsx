/**
 * CollectibleListCard — dense 1-column horizontal row for a collectible.
 *
 * The information-dense cousin of SpatialCard. Thumb on the leading edge,
 * compact trailing meta — status + traits, title, and price. Intended
 * for users who want to see a lot of items at a glance and trade visual
 * scale for density.
 *
 * Composition pattern: wraps the `ListCard` shell and owns only the meta
 * layout, same discipline as `CollectibleGridCard` over `GridCard`.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, TYPE, STATUS_CONFIG, getTraitChrome } from '@/lib/design';
import { ListCard } from './list-card';
import { StatusDot } from './status-dot';
import { ViewCountBadge } from './view-count-badge';
import type { CollectibleCardData } from './spatial-card';

export interface CollectibleListCardProps {
  item: CollectibleCardData;
  onPress?: () => void;
  /** Multi-select selection chrome — see ListCard's `selected` prop. */
  selected?: boolean;
}

export function CollectibleListCard({
  item,
  onPress,
  selected = false,
}: CollectibleListCardProps) {
  const { colors } = useTheme();
  const statusLabel = STATUS_CONFIG[item.status]?.label ?? '';

  return (
    <ListCard
      photoUrl={item.photoUrl}
      onPress={onPress}
      selected={selected}
      accessibilityLabel={[item.title, statusLabel, item.price]
        .filter(Boolean)
        .join(', ')}
    >
      <View style={styles.badgeRow}>
        <StatusDot status={item.status} />
        {item.traits?.map((trait) => {
          const chrome = getTraitChrome(trait);
          if (!chrome) return null;
          return <View key={trait} style={[styles.traitDot, { backgroundColor: chrome.text }]} />;
        })}
      </View>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.price ? (
          <Text style={[styles.price, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.price}
          </Text>
        ) : null}
      </View>
      {item.viewCount ? (
        <View style={styles.viewBadgeRow}>
          <ViewCountBadge count={item.viewCount} compact />
        </View>
      ) : null}
    </ListCard>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  traitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  price: {
    fontFamily: TYPE.mono,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  viewBadgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
