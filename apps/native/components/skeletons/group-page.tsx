import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

export function GroupPageSkeleton() {
  return (
    <View style={s.root}>
      {/* Group header cover */}
      <Skeleton width="100%" height={128} borderRadius={0} />

      {/* Avatar overlapping cover */}
      <View style={s.avatarWrap}>
        <Skeleton width={96} height={96} borderRadius={16} />
      </View>

      {/* Group info */}
      <View style={s.info}>
        <Skeleton width={160} height={18} borderRadius={5} />
        <View style={s.badgeRow}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={50} height={20} borderRadius={10} />
        </View>
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 3 }} />
      </View>

      {/* Action buttons */}
      <View style={s.actions}>
        <Skeleton width={0} height={40} borderRadius={12} style={{ flex: 1 }} />
        <Skeleton width={0} height={40} borderRadius={12} style={{ flex: 1 }} />
      </View>

      {/* Divider */}
      <Skeleton width="100%" height={8} borderRadius={0} style={{ marginVertical: 8 }} />

      {/* Feed posts */}
      {[0, 1, 2].map(i => (
        <View key={i} style={s.post}>
          <View style={s.postHeader}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <View style={s.postHeaderText}>
              <Skeleton width={100} height={14} borderRadius={4} />
              <Skeleton width={40} height={11} borderRadius={4} style={{ marginTop: 2 }} />
            </View>
          </View>
          <Skeleton width="100%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width="85%" height={14} borderRadius={4} style={{ marginTop: 3 }} />
          <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 3 }} />
          {i === 1 && <Skeleton width="100%" height={180} borderRadius={12} style={{ marginTop: 8 }} />}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  avatarWrap: { alignItems: 'center', marginTop: -48 },
  info: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  post: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postHeaderText: { flex: 1 },
});
