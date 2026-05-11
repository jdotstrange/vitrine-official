import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './skeleton';
import { colors } from '@/lib/colors';

export function ConversationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={`convo-${i}`} style={styles.convoRow}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.convoText}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="85%" height={12} style={styles.gap4} />
          </View>
          <Skeleton width={36} height={11} />
        </View>
      ))}
    </View>
  );
}

export function MessageBubbleSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.bubbleList}>
      {Array.from({ length: count }).map((_, i) => {
        const isRight = i % 3 !== 0;
        const width = [180, 220, 140, 200, 160][i % 5];
        return (
          <View
            key={`msg-${i}`}
            style={[
              styles.bubbleRow,
              isRight ? styles.bubbleRight : styles.bubbleLeft,
            ]}
          >
            <Skeleton width={width} height={36} borderRadius={16} />
          </View>
        );
      })}
    </View>
  );
}

export function GroupCardSkeleton({ variant = 'discover' }: { variant?: 'discover' | 'list' } = {}) {
  if (variant === 'list') {
    return (
      <View style={styles.groupListCard}>
        <Skeleton width="100%" height={80} borderRadius={0} />
        <View style={styles.groupListInfo}>
          <Skeleton width="65%" height={14} />
          <Skeleton width="40%" height={10} style={styles.gap4} />
          <Skeleton width="85%" height={12} style={styles.gap4} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.groupCard}>
      <Skeleton width="100%" height={80} borderRadius={0} />
      <View style={styles.groupInfo}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={11} style={styles.gap4} />
      </View>
    </View>
  );
}

export function GroupCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.groupCardList}>
      {Array.from({ length: count }).map((_, i) => (
        <GroupCardSkeleton key={`group-${i}`} />
      ))}
    </View>
  );
}

export function MemberListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={`member-${i}`} style={styles.memberRow}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.memberText}>
            <Skeleton width="55%" height={14} />
            <Skeleton width={50} height={11} style={styles.gap4} />
          </View>
          <Skeleton width={52} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
