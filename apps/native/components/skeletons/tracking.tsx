import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const INTENT_CARD_W = (SCREEN_WIDTH - 32 - 8) / 2;

export function TrackingDashboardSkeleton() {
  return (
    <View style={s.root}>
      {/* Summary card */}
      <View style={s.summaryCard}>
        <View style={s.summaryTop}>
          <View style={s.summaryMain}>
            <Skeleton width={80} height={10} borderRadius={3} />
            <Skeleton width={120} height={28} borderRadius={6} style={{ marginTop: 4 }} />
            <View style={s.sparkRow}>
              <Skeleton width={80} height={24} borderRadius={4} />
              <Skeleton width={40} height={12} borderRadius={4} />
            </View>
          </View>
          <View style={s.summaryStats}>
            <View style={s.summaryStat}>
              <Skeleton width={28} height={28} borderRadius={8} />
              <View>
                <Skeleton width={40} height={14} borderRadius={4} />
                <Skeleton width={50} height={10} borderRadius={3} style={{ marginTop: 2 }} />
              </View>
            </View>
            <View style={s.summaryStat}>
              <Skeleton width={28} height={28} borderRadius={8} />
              <View>
                <Skeleton width={40} height={14} borderRadius={4} />
                <Skeleton width={50} height={10} borderRadius={3} style={{ marginTop: 2 }} />
              </View>
            </View>
          </View>
        </View>
        <View style={s.summaryBottom}>
          <Skeleton width={140} height={12} borderRadius={4} />
          <Skeleton width={32} height={32} borderRadius={10} />
        </View>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Skeleton width="100%" height={40} borderRadius={12} />
      </View>

      {/* Movers */}
      <View style={s.section}>
        <Skeleton width={60} height={10} borderRadius={3} style={s.sectionLabel} />
        <View style={s.horizontalRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={`m-${i}`} style={s.moverCard}>
              <Skeleton width={130} height={0} borderRadius={0} style={{ aspectRatio: 1 }} />
              <View style={{ padding: 8 }}>
                <Skeleton width={80} height={11} borderRadius={4} />
                <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 3 }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Hot From Your List */}
      <View style={s.section}>
        <Skeleton width={130} height={10} borderRadius={3} style={s.sectionLabel} />
        {[0, 1, 2].map(i => (
          <View key={`h-${i}`} style={s.hotRow}>
            <Skeleton width={48} height={48} borderRadius={10} />
            <View style={s.hotText}>
              <Skeleton width="70%" height={13} borderRadius={4} />
              <Skeleton width="40%" height={11} borderRadius={4} style={{ marginTop: 3 }} />
            </View>
            <Skeleton width={50} height={14} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Intent Breakdown */}
      <View style={s.section}>
        <Skeleton width={70} height={10} borderRadius={3} style={s.sectionLabel} />
        <View style={s.intentGrid}>
          {[0, 1, 2, 3].map(i => (
            <View key={`int-${i}`} style={s.intentCard}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={30} height={18} borderRadius={4} style={{ marginTop: 4 }} />
              <Skeleton width={50} height={9} borderRadius={3} style={{ marginTop: 2 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Status Distribution */}
      <View style={s.section}>
        <Skeleton width={120} height={10} borderRadius={3} style={s.sectionLabel} />
        <View style={s.statusBarWrap}>
          <Skeleton width="100%" height={8} borderRadius={4} />
          <View style={s.statusLegend}>
            {[0, 1, 2, 3].map(i => (
              <View key={`sl-${i}`} style={s.statusLegendItem}>
                <Skeleton width={8} height={8} borderRadius={4} />
                <Skeleton width={50} height={11} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Recently Tracked */}
      <View style={s.section}>
        <Skeleton width={120} height={10} borderRadius={3} style={s.sectionLabel} />
        <View style={s.horizontalRow}>
          {[0, 1, 2].map(i => (
            <View key={`r-${i}`} style={s.recentCard}>
              <Skeleton width={140} height={0} borderRadius={0} style={{ aspectRatio: 1.2 }} />
              <View style={{ padding: 8 }}>
                <Skeleton width={100} height={11} borderRadius={4} />
                <Skeleton width={60} height={9} borderRadius={3} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Group By */}
      <View style={s.section}>
        <Skeleton width={60} height={10} borderRadius={3} style={s.sectionLabel} />
        <View style={s.chipRow}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={`ch-${i}`} width={80} height={32} borderRadius={20} />
          ))}
        </View>
        {[0, 1, 2].map(i => (
          <View key={`g-${i}`} style={s.groupRow}>
            <Skeleton width={40} height={40} borderRadius={12} />
            <View style={s.groupText}>
              <Skeleton width="60%" height={14} borderRadius={4} />
              <Skeleton width={30} height={12} borderRadius={4} style={{ marginTop: 2 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {},

  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryMain: { flex: 1 },
  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  summaryStats: { gap: 12 },
  summaryStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  searchWrap: { paddingHorizontal: 16, marginBottom: 16 },

  section: { marginBottom: 24 },
  sectionLabel: { marginBottom: 12, marginHorizontal: 16 },

  horizontalRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  moverCard: {
    width: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  hotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hotText: { flex: 1 },

  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  intentCard: {
    width: INTENT_CARD_W,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  statusBarWrap: { paddingHorizontal: 16 },
  statusLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  statusLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  recentCard: {
    width: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  groupText: { flex: 1 },
});
