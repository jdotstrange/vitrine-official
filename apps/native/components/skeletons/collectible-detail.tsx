import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailActionDock, SkeletonCircle, SkeletonGroup, SkeletonRect } from '@/components/vault';
import { SPACING, useTheme } from '@/lib/design';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_GUTTER = SPACING.gutter;
const HERO_FRAME_WIDTH = SCREEN_W - HERO_GUTTER * 2;
const HERO_FRAME_HEIGHT = HERO_FRAME_WIDTH / (4 / 5);

const LENS_TAB_WIDTHS = [52, 48, 44, 36, 32, 52] as const;

export interface CollectibleDetailSkeletonProps {
  bottomInset: number;
}

/**
 * Collectible detail loading shell — mirrors V3 chrome (lens strip,
 * framed hero, identity block, action dock) so tile → detail feels like
 * navigation, not a modal spinner.
 */
export function CollectibleDetailSkeleton({ bottomInset }: CollectibleDetailSkeletonProps) {
  const { colors } = useTheme();
  const dockReservedHeight = DetailActionDock.reservedHeight(bottomInset);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <SkeletonGroup style={styles.flex}>
        <View style={[styles.lensStrip, { borderBottomColor: colors.frostDivider }]}>
          <View style={styles.lensTrack}>
            {LENS_TAB_WIDTHS.map((width, i) => (
              <SkeletonRect key={i} width={width} height={12} radius={4} />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: bottomInset + dockReservedHeight + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonRect
            width={HERO_FRAME_WIDTH}
            height={HERO_FRAME_HEIGHT}
            radius={12}
            style={styles.hero}
          />
          <View style={styles.dotsRow}>
            <SkeletonRect width={18} height={4} radius={2} />
            <SkeletonCircle size={4} />
            <SkeletonCircle size={4} />
          </View>

          <View style={styles.identity}>
            <View style={styles.pillsRow}>
              <SkeletonRect width={72} height={24} radius={12} />
              <SkeletonRect width={88} height={24} radius={12} />
            </View>
            <SkeletonRect width="88%" height={28} radius={6} style={styles.title} />
            <View style={styles.collectorRow}>
              <SkeletonCircle size={22} />
              <SkeletonRect width={140} height={13} radius={4} />
              <SkeletonRect width={56} height={11} radius={4} />
            </View>
          </View>

          <View style={styles.story}>
            <SkeletonRect width="100%" height={14} radius={4} />
            <SkeletonRect width="92%" height={14} radius={4} style={styles.storyGap} />
            <SkeletonRect width="70%" height={14} radius={4} style={styles.storyGap} />
          </View>
        </ScrollView>

        <View
          style={[
            styles.dock,
            {
              backgroundColor: colors.sheetBg,
              borderTopColor: colors.frostBorder,
              paddingTop: Math.max(bottomInset, 14),
              paddingBottom: Math.max(bottomInset, 14),
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.dockRow}>
            <View style={styles.dockValue}>
              <SkeletonRect width={48} height={9} radius={3} />
              <SkeletonRect width={88} height={22} radius={5} style={styles.dockValueGap} />
            </View>
            <View style={styles.dockRail}>
              <SkeletonCircle size={36} />
              <SkeletonCircle size={36} />
              <SkeletonCircle size={36} />
              <SkeletonCircle size={36} />
            </View>
          </View>
        </View>
      </SkeletonGroup>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  lensStrip: {
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lensTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.gutter,
    gap: 28,
    minHeight: 44,
  },
  hero: {
    alignSelf: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  identity: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneCluster,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    marginTop: 10,
  },
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.zoneIntra,
  },
  story: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneCluster,
  },
  storyGap: {
    marginTop: 8,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.gutter,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  dockValue: {
    flex: 1,
    marginRight: 12,
  },
  dockValueGap: {
    marginTop: 4,
  },
  dockRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
