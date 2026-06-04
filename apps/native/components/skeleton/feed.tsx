import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonGroup, SkeletonRect } from '@/components/vault';
import { RADII, useTheme } from '@/lib/design';

import {
  COLLECTIBLE_GRID_COLUMN_GAP,
  COLLECTIBLE_GRID_EDGE_PADDING,
  getCollectibleGridCardWidth,
} from './collectible-grid-layout';

export function SpatialCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[spatialStyles.container, spatialStyles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <SkeletonRect width="100%" height={0} radius={0} style={spatialStyles.image} />
      <View style={spatialStyles.info}>
        <View style={spatialStyles.infoHeader}>
          <View style={spatialStyles.infoLeft}>
            <SkeletonRect width="70%" height={16} />
            <SkeletonRect width="40%" height={12} style={spatialStyles.itemSpacing} />
          </View>
          <View style={spatialStyles.infoRight}>
            <SkeletonRect width={70} height={16} />
            <SkeletonRect width={56} height={20} radius={20} style={spatialStyles.itemSpacing} />
          </View>
        </View>
        <View style={[spatialStyles.collector, { borderTopColor: colors.frostDivider }]}>
          <View style={spatialStyles.collectorLeft}>
            <SkeletonRect width={24} height={24} radius={12} />
            <SkeletonRect width={90} height={12} />
          </View>
          <SkeletonRect width={80} height={12} />
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonGroup>
      <View style={feedStyles.container}>
        {Array.from({ length: count }).map((_, i) => (
          <SpatialCardSkeleton key={i} />
        ))}
      </View>
    </SkeletonGroup>
  );
}

/** Matches `CollectibleGridCard` — RN `aspectRatio` is width / height. */
export const COLLECTIBLE_GRID_ASPECT = 4 / 5;

export function collectibleGridPhotoHeight(cardWidth: number): number {
  return cardWidth / COLLECTIBLE_GRID_ASPECT;
}

export interface GridCardSkeletonProps {
  /** Column width; defaults to standard 2-col market/search layout. */
  cardWidth?: number;
}

export function GridCardSkeleton({ cardWidth }: GridCardSkeletonProps = {}) {
  const { colors } = useTheme();
  const width = cardWidth ?? getCollectibleGridCardWidth();
  const photoHeight = collectibleGridPhotoHeight(width);

  return (
    <View style={[gridStyles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <SkeletonRect width="100%" height={photoHeight} radius={RADII.small} />
      <View style={gridStyles.meta}>
        <View style={gridStyles.titleRow}>
          <SkeletonRect width={8} height={8} radius={4} style={gridStyles.statusDot} />
          <View style={gridStyles.titleLines}>
            <SkeletonRect width="92%" height={13} radius={4} />
            <SkeletonRect width="70%" height={13} radius={4} style={gridStyles.titleGap} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function CollectionGridSkeleton({ count = 6 }: { count?: number }) {
  const cardWidth = getCollectibleGridCardWidth();

  return (
    <SkeletonGroup>
      <View style={gridStyles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ width: cardWidth }}>
            <GridCardSkeleton cardWidth={cardWidth} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

const spatialStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: { aspectRatio: 4 / 5 },
  info: { padding: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLeft: { flex: 1, marginRight: 16 },
  infoRight: { alignItems: 'flex-end' },
  collector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  collectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemSpacing: { marginTop: 6 },
});

const feedStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 16 },
});

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLLECTIBLE_GRID_COLUMN_GAP,
    paddingHorizontal: COLLECTIBLE_GRID_EDGE_PADDING,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  meta: { marginTop: 10, paddingHorizontal: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  statusDot: { marginTop: 6 },
  titleLines: { flex: 1 },
  titleGap: { marginTop: 4 },
});
