/**
 * CollectibleGridCard — compact 2-column grid card for a collectible.
 *
 * Composition pattern: wraps the generic `GridCard` shell and provides
 * its own meta slot (`CollectibleGridMeta`). Mirrors the same architecture
 * as `CompCard` — shell + purpose-built meta — so both compositions share
 * the same photo well, overlay, press, and haptic behavior.
 *
 * Intended density: 2 columns with a 12pt gutter. Grid is a recognition
 * surface: image, title, and listing status only.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, TYPE } from '@/lib/design';
import { GridCard } from './grid-card';
import { StatusDot } from './status-dot';
import { ViewCountBadge } from './view-count-badge';
import type { CollectibleCardData } from './spatial-card';

export interface CollectibleGridCardProps {
  item: CollectibleCardData;
  onPress?: () => void;
  width?: number;
  /** Multi-select selection chrome — see GridCard's `selected` prop. */
  selected?: boolean;
}

export function CollectibleGridCard({
  item,
  onPress,
  width,
  selected = false,
}: CollectibleGridCardProps) {
  return (
    <GridCard
      photoUrl={item.photoUrl}
      onPress={onPress}
      width={width}
      aspectRatio={4 / 5}
      selected={selected}
      accessibilityLabel={[item.title, item.status]
        .filter(Boolean)
        .join(', ')}
    >
      <CollectibleGridMeta item={item} />
    </GridCard>
  );
}

export function CollectibleGridMeta({ item }: { item: CollectibleCardData }) {
  const { colors } = useTheme();

  return (
    <View style={styles.meta}>
      <View style={styles.titleRow}>
        <View style={styles.statusDotWrap}>
          <StatusDot status={item.status} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      {item.viewCount ? (
        <View style={styles.badgeRow}>
          <ViewCountBadge count={item.viewCount} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  statusDotWrap: {
    paddingTop: 6,
  },
  title: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
});
