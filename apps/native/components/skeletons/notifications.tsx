import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

export function NotificationsSkeleton() {
  return (
    <View style={s.root}>
      {/* Pill tabs */}
      <View style={s.pillTabs}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} width={60} height={32} borderRadius={999} />
        ))}
      </View>

      {/* Milestone carousel */}
      <View style={s.section}>
        <Skeleton width={80} height={12} borderRadius={4} style={s.sectionLabel} />
        <View style={s.milestoneRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.milestoneCard}>
              <Skeleton width={144} height={0} borderRadius={0} style={{ aspectRatio: 4 / 5 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Notification rows */}
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={s.notifRow}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={s.notifText}>
            <Skeleton width="85%" height={14} borderRadius={4} />
            <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={30} height={11} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  pillTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },

  section: { marginBottom: 20 },
  sectionLabel: { marginBottom: 10, marginHorizontal: 16 },

  milestoneRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  milestoneCard: {
    width: 144,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 12,
  },
  notifText: { flex: 1 },
});
