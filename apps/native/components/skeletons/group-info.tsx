import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

export function GroupInfoSkeleton() {
  return (
    <View style={s.root}>
      {/* Cover */}
      <Skeleton width="100%" height={128} borderRadius={0} />

      {/* Avatar overlapping cover */}
      <View style={s.avatarWrap}>
        <Skeleton width={96} height={96} borderRadius={16} />
      </View>

      {/* Info */}
      <View style={s.info}>
        <Skeleton width={160} height={18} borderRadius={5} />
        <View style={s.badgeRow}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={50} height={20} borderRadius={10} />
        </View>
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="75%" height={14} borderRadius={4} style={{ marginTop: 3 }} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 3 }} />

        {/* Stats row */}
        <View style={s.statsRow}>
          <Skeleton width={50} height={14} borderRadius={4} />
          <Skeleton width={50} height={14} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={s.actions}>
        <Skeleton width={0} height={40} borderRadius={12} style={{ flex: 1 }} />
        <Skeleton width={0} height={40} borderRadius={12} style={{ flex: 1 }} />
      </View>

      {/* Divider */}
      <Skeleton width="100%" height={8} borderRadius={0} style={{ marginVertical: 8 }} />

      {/* Members list */}
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={s.memberRow}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={s.memberText}>
            <Skeleton width="55%" height={14} borderRadius={4} />
            <Skeleton width="30%" height={11} borderRadius={4} style={{ marginTop: 2 }} />
          </View>
          <Skeleton width={52} height={20} borderRadius={10} />
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
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  memberText: { flex: 1 },
});
