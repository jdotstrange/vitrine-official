import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonGroup, SkeletonRect } from '@/components/vault';
import { useTheme } from '@/lib/design';

export function RecentDMsSkeleton() {
  return (
    <View style={styles.dmStrip}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={`dm-skel-${i}`} style={styles.dmItem}>
          <SkeletonRect width={48} height={48} radius={24} />
          <SkeletonRect width={40} height={8} style={styles.dmName} />
        </View>
      ))}
    </View>
  );
}

export function ActivityHeartbeatSkeleton() {
  return (
    <View style={styles.heartbeatStrip}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonRect key={`hb-skel-${i}`} width={140} height={36} radius={18} />
      ))}
    </View>
  );
}

export function HappeningNowSkeleton() {
  return (
    <View style={styles.happeningRow}>
      <SkeletonRect width={280} height={100} radius={14} />
      <SkeletonRect width={280} height={100} radius={14} />
    </View>
  );
}

export function ForYouSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.forYouList}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={`fy-skel-${i}`} style={[styles.forYouCard, { backgroundColor: colors.sheetBg }]}>
          <SkeletonRect width={60} height={60} radius={12} />
          <View style={styles.forYouText}>
            <SkeletonRect width="65%" height={14} />
            <SkeletonRect width="85%" height={11} style={styles.gap4} />
            <SkeletonRect width="50%" height={11} style={styles.gap4} />
          </View>
          <SkeletonRect width={52} height={24} radius={12} />
        </View>
      ))}
    </View>
  );
}

export function NewThisWeekSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.newGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`nw-skel-${i}`} style={[styles.newCard, { backgroundColor: colors.sheetBg }]}>
          <SkeletonRect width="100%" height={80} radius={0} />
          <View style={styles.newCardInfo}>
            <SkeletonRect width="70%" height={12} />
            <SkeletonRect width="40%" height={10} style={styles.gap4} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dmStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 14,
  },
  dmItem: {
    alignItems: 'center',
    width: 64,
  },
  dmName: {
    marginTop: 6,
  },
  heartbeatStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  happeningRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  forYouList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  forYouCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  forYouText: {
    flex: 1,
  },
  gap4: {
    marginTop: 4,
  },
  newGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  newCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newCardInfo: {
    padding: 8,
    gap: 2,
  },
});
