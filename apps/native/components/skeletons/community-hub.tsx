import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

export function CommunityHubSkeleton() {
  return (
    <View style={s.root}>
      {/* Header */}
      <Skeleton width={140} height={26} borderRadius={6} style={s.title} />

      {/* RecentDMs strip */}
      <View style={s.dmStrip}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={s.dmItem}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={40} height={8} borderRadius={3} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Skeleton width="100%" height={40} borderRadius={12} />
      </View>

      {/* Pill tabs */}
      <View style={s.pillTabs}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} width={80} height={32} borderRadius={999} />
        ))}
      </View>

      {/* Your Groups */}
      <View style={s.section}>
        <Skeleton width={90} height={14} borderRadius={4} style={s.sectionLabel} />
        {[0, 1].map(i => (
          <View key={i} style={s.groupListCard}>
            <Skeleton width="100%" height={80} borderRadius={0} />
            <View style={s.groupListInfo}>
              <Skeleton width="65%" height={14} borderRadius={4} />
              <Skeleton width="40%" height={10} borderRadius={3} style={{ marginTop: 4 }} />
              <Skeleton width="85%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>

      {/* Happening Now */}
      <View style={s.section}>
        <Skeleton width={110} height={14} borderRadius={4} style={s.sectionLabel} />
        <View style={s.happeningRow}>
          <Skeleton width={280} height={100} borderRadius={14} />
          <Skeleton width={280} height={100} borderRadius={14} />
        </View>
      </View>

      {/* For You */}
      <View style={s.section}>
        <Skeleton width={60} height={14} borderRadius={4} style={s.sectionLabel} />
        {[0, 1, 2].map(i => (
          <View key={i} style={s.forYouCard}>
            <Skeleton width={60} height={60} borderRadius={12} />
            <View style={s.forYouText}>
              <Skeleton width="65%" height={14} borderRadius={4} />
              <Skeleton width="85%" height={11} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={52} height={24} borderRadius={12} />
          </View>
        ))}
      </View>

      {/* New This Week */}
      <View style={s.section}>
        <Skeleton width={100} height={14} borderRadius={4} style={s.sectionLabel} />
        <View style={s.newGrid}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={s.newCard}>
              <Skeleton width="100%" height={80} borderRadius={0} />
              <View style={s.newCardInfo}>
                <Skeleton width="70%" height={12} borderRadius={4} />
                <Skeleton width="40%" height={10} borderRadius={3} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
  },
  newCardInfo: { padding: 8 },
});
