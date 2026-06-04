import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonCircle, SkeletonGroup, SkeletonRect } from '@/components/vault';
import { useTheme } from '@/lib/design';

import {
  COLLECTIBLE_GRID_COLUMN_GAP,
  COLLECTIBLE_GRID_EDGE_PADDING,
  getCollectibleGridCardWidth,
} from './collectible-grid-layout';
import { GridCardSkeleton } from './feed';

const CARD_WIDTH = getCollectibleGridCardWidth();

export function MarketMosaicSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkeletonGroup style={styles.mosaicWrap}>
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.cell}>
            <GridCardSkeleton cardWidth={CARD_WIDTH} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

/** All-pill search: collectibles grid + list sections. */
export function SearchResultsAllSkeleton() {
  const { colors } = useTheme();

  return (
    <SkeletonGroup style={styles.flex}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonRect width={90} height={11} radius={4} />
          <SkeletonRect width={72} height={11} radius={4} />
        </View>
        <View style={styles.gridRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.cell}>
              <GridCardSkeleton cardWidth={CARD_WIDTH} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonRect width={80} height={11} radius={4} />
          <SkeletonRect width={72} height={11} radius={4} />
        </View>
        <SearchResultsListRowsSkeleton rows={3} variant="showcase" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonRect width={85} height={11} radius={4} />
          <SkeletonRect width={72} height={11} radius={4} />
        </View>
        <SearchResultsListRowsSkeleton rows={3} variant="collector" />
      </View>
    </SkeletonGroup>
  );
}

export function SearchResultsCollectiblesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup style={styles.gridList}>
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.cell}>
            <GridCardSkeleton cardWidth={CARD_WIDTH} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

export function SearchResultsListRowsSkeleton({
  rows = 5,
  variant = 'showcase',
}: {
  rows?: number;
  variant?: 'showcase' | 'collector';
}) {
  const { colors } = useTheme();

  return (
    <SkeletonGroup>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[styles.listRow, { borderBottomColor: colors.frostDivider }]}
        >
          {variant === 'collector' ? (
            <SkeletonCircle size={48} />
          ) : (
            <SkeletonRect width={56} height={56} radius={12} />
          )}
          <View style={styles.listRowText}>
            <SkeletonRect width="65%" height={14} radius={4} />
            <SkeletonRect width="45%" height={11} radius={4} style={styles.gap4} />
            {variant === 'collector' ? (
              <View style={styles.thumbRow}>
                <SkeletonRect width={32} height={32} radius={6} />
                <SkeletonRect width={32} height={32} radius={6} />
                <SkeletonRect width={32} height={32} radius={6} />
              </View>
            ) : null}
          </View>
          {variant === 'collector' ? (
            <SkeletonRect width={64} height={28} radius={14} />
          ) : null}
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cell: {
    width: CARD_WIDTH,
  },
  mosaicWrap: {
    paddingHorizontal: COLLECTIBLE_GRID_EDGE_PADDING,
    paddingTop: COLLECTIBLE_GRID_EDGE_PADDING,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLLECTIBLE_GRID_COLUMN_GAP,
  },
  gridList: {
    paddingHorizontal: COLLECTIBLE_GRID_EDGE_PADDING,
    paddingBottom: 120,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLLECTIBLE_GRID_COLUMN_GAP,
    paddingHorizontal: COLLECTIBLE_GRID_EDGE_PADDING,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: COLLECTIBLE_GRID_EDGE_PADDING,
    paddingVertical: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: COLLECTIBLE_GRID_EDGE_PADDING,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listRowText: {
    flex: 1,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  gap4: { marginTop: 4 },
});
