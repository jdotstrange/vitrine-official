import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonGroup, SkeletonRect } from '@/components/vault';
import { useTheme } from '@/lib/design';

export function GroupPageSkeleton() {
  const { colors } = useTheme();

  return (
    <SkeletonGroup style={s.root}>
      <SkeletonRect width="100%" height={128} radius={0} />

      <View style={s.avatarWrap}>
        <SkeletonRect width={96} height={96} radius={16} />
      </View>

      <View style={s.info}>
        <SkeletonRect width={160} height={18} radius={5} />
        <View style={s.badgeRow}>
          <SkeletonRect width={60} height={20} radius={10} />
          <SkeletonRect width={50} height={20} radius={10} />
        </View>
        <SkeletonRect width="90%" height={14} radius={4} style={{ marginTop: 6 }} />
        <SkeletonRect width="60%" height={14} radius={4} style={{ marginTop: 3 }} />
      </View>

      <View style={s.actions}>
        <SkeletonRect width={0} height={40} radius={12} style={{ flex: 1 }} />
        <SkeletonRect width={0} height={40} radius={12} style={{ flex: 1 }} />
      </View>

      <SkeletonRect width="100%" height={8} radius={0} style={{ marginVertical: 8 }} />

      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.post, { borderBottomColor: colors.frostDivider }]}>
          <View style={s.postHeader}>
            <SkeletonRect width={36} height={36} radius={18} />
            <View style={s.postHeaderText}>
              <SkeletonRect width={100} height={14} radius={4} />
              <SkeletonRect width={40} height={11} radius={4} style={{ marginTop: 2 }} />
            </View>
          </View>
          <SkeletonRect width="100%" height={14} radius={4} style={{ marginTop: 8 }} />
          <SkeletonRect width="85%" height={14} radius={4} style={{ marginTop: 3 }} />
          <SkeletonRect width="60%" height={14} radius={4} style={{ marginTop: 3 }} />
          {i === 1 && (
            <SkeletonRect width="100%" height={180} radius={12} style={{ marginTop: 8 }} />
          )}
        </View>
      ))}
    </SkeletonGroup>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postHeaderText: { flex: 1 },
});
