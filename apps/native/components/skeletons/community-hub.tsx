import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonCircle, SkeletonGroup, SkeletonRect } from '@/components/vault';
import { useTheme } from '@/lib/design';

export function CommunityHubSkeleton() {
  const { colors } = useTheme();

  return (
    <SkeletonGroup style={s.root}>
      <SkeletonRect width={140} height={26} radius={6} style={s.title} />

      <View style={s.dmStrip}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={s.dmItem}>
            <SkeletonCircle size={48} />
            <SkeletonRect width={40} height={8} radius={3} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      <View style={s.searchWrap}>
        <SkeletonRect width="100%" height={40} radius={12} />
      </View>

      <View style={s.pillTabs}>
        {[0, 1, 2].map((i) => (
          <SkeletonRect key={i} width={80} height={32} radius={999} />
        ))}
      </View>

      <View style={s.section}>
        <SkeletonRect width={90} height={14} radius={4} style={s.sectionLabel} />
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[s.groupListCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}
          >
            <SkeletonRect width="100%" height={80} radius={0} />
            <View style={s.groupListInfo}>
              <SkeletonRect width="65%" height={14} />
              <SkeletonRect width="40%" height={10} radius={3} style={{ marginTop: 4 }} />
              <SkeletonRect width="85%" height={12} radius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <SkeletonRect width={110} height={14} radius={4} style={s.sectionLabel} />
        <View style={s.happeningRow}>
          <SkeletonRect width={280} height={100} radius={14} />
          <SkeletonRect width={280} height={100} radius={14} />
        </View>
      </View>

      <View style={s.section}>
        <SkeletonRect width={60} height={14} radius={4} style={s.sectionLabel} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.forYouCard, { backgroundColor: colors.sheetBg }]}>
            <SkeletonRect width={60} height={60} radius={12} />
            <View style={s.forYouText}>
              <SkeletonRect width="65%" height={14} />
              <SkeletonRect width="85%" height={11} radius={4} style={{ marginTop: 4 }} />
            </View>
            <SkeletonRect width={52} height={24} radius={12} />
          </View>
        ))}
      </View>

      <View style={s.section}>
        <SkeletonRect width={100} height={14} radius={4} style={s.sectionLabel} />
        <View style={s.newGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.newCard, { backgroundColor: colors.sheetBg }]}>
              <SkeletonRect width="100%" height={80} radius={0} />
              <View style={s.newCardInfo}>
                <SkeletonRect width="70%" height={12} />
                <SkeletonRect width="40%" height={10} radius={3} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}

const s = StyleSheet.create({
  root: {},
  title: { paddingHorizontal: 20, marginBottom: 16 },
  dmStrip: { flexDirection: 'row', paddingHorizontal: 16, gap: 14, marginBottom: 16 },
  dmItem: { alignItems: 'center', width: 64 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  pillTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { marginBottom: 10, marginHorizontal: 16 },
  groupListCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  groupListInfo: { padding: 12 },
  happeningRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  forYouCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 8,
  },
  forYouText: { flex: 1 },
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
  newCardInfo: { padding: 8 },
});
