import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonCircle, SkeletonGroup, SkeletonRect } from '@/components/vault';
import { useTheme } from '@/lib/design';

export function ConversationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup>
      <View style={styles.list}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={`convo-${i}`} style={styles.convoRow}>
            <SkeletonCircle size={48} />
            <View style={styles.convoText}>
              <SkeletonRect width="60%" height={14} />
              <SkeletonRect width="85%" height={12} style={styles.gap4} />
            </View>
            <SkeletonRect width={36} height={11} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

export function MessageBubbleSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonGroup>
      <View style={styles.bubbleList}>
        {Array.from({ length: count }).map((_, i) => {
          const isRight = i % 3 !== 0;
          const width = [180, 220, 140, 200, 160][i % 5];
          return (
            <View
              key={`msg-${i}`}
              style={[styles.bubbleRow, isRight ? styles.bubbleRight : styles.bubbleLeft]}
            >
              <SkeletonRect width={width} height={36} radius={16} />
            </View>
          );
        })}
      </View>
    </SkeletonGroup>
  );
}

export function GroupCardSkeleton({ variant = 'discover' }: { variant?: 'discover' | 'list' } = {}) {
  const { colors } = useTheme();

  if (variant === 'list') {
    return (
      <View style={[styles.groupListCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <SkeletonRect width="100%" height={80} radius={0} />
        <View style={styles.groupListInfo}>
          <SkeletonRect width="65%" height={14} />
          <SkeletonRect width="40%" height={10} style={styles.gap4} />
          <SkeletonRect width="85%" height={12} style={styles.gap4} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.groupCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <SkeletonRect width="100%" height={80} radius={0} />
      <View style={styles.groupInfo}>
        <SkeletonRect width="70%" height={14} />
        <SkeletonRect width="40%" height={11} style={styles.gap4} />
      </View>
    </View>
  );
}

export function GroupCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup>
      <View style={styles.groupCardList}>
        {Array.from({ length: count }).map((_, i) => (
          <GroupCardSkeleton key={`group-${i}`} />
        ))}
      </View>
    </SkeletonGroup>
  );
}

export function MemberListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonGroup>
      <View style={styles.list}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={`member-${i}`} style={styles.memberRow}>
            <SkeletonCircle size={40} />
            <View style={styles.memberText}>
              <SkeletonRect width="55%" height={14} />
              <SkeletonRect width={50} height={11} style={styles.gap4} />
            </View>
            <SkeletonRect width={52} height={20} radius={10} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 4,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  convoText: {
    flex: 1,
  },
  gap4: {
    marginTop: 4,
  },
  bubbleList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  groupCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  groupCardList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  groupInfo: {
    padding: 10,
  },
  groupListCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  groupListInfo: {
    padding: 12,
    gap: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  memberText: {
    flex: 1,
  },
});
