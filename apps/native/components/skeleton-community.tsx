import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './skeleton';
import { colors } from '@/lib/colors';

export function RecentDMsSkeleton() {
  return (
    <View style={styles.dmStrip}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={`dm-skel-${i}`} style={styles.dmItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={40} height={8} style={styles.dmName} />
        </View>
      ))}
    </View>
  );
}

export function ActivityHeartbeatSkeleton() {
  return (
    <View style={styles.heartbeatStrip}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={`hb-skel-${i}`} width={140} height={36} borderRadius={18} />
      ))}
    </View>
  );
}

export function HappeningNowSkeleton() {
  return (
    <View style={styles.happeningRow}>
      <Skeleton width={280} height={100} borderRadius={14} />
      <Skeleton width={280} height={100} borderRadius={14} />
    </View>
  );
}

export function ForYouSkeleton() {
  return (
    <View style={styles.forYouList}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={`fy-skel-${i}`} style={styles.forYouCard}>
          <Skeleton width={60} height={60} borderRadius={12} />
          <View style={styles.forYouText}>
            <Skeleton width="65%" height={14} />
            <Skeleton width="85%" height={11} style={styles.gap4} />
            <Skeleton width="50%" height={11} style={styles.gap4} />
          </View>
          <Skeleton width={52} height={24} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}

export function NewThisWeekSkeleton() {
  return (
    <View style={styles.newGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`nw-skel-${i}`} style={styles.newCard}>
          <Skeleton width="100%" height={80} borderRadius={0} />
          <View style={styles.newCardInfo}>
            <Skeleton width="70%" height={12} />
            <Skeleton width="40%" height={10} style={styles.gap4} />
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
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
  },
  newCardInfo: {
    padding: 8,
    gap: 2,
  },
});
