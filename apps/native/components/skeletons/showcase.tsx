import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_W = (SCREEN_WIDTH - 44) / 2;

export function ShowcaseSkeleton() {
  return (
    <View style={s.root}>
      {/* Title */}
      <Skeleton width={200} height={24} borderRadius={6} style={s.title} />

      {/* Owner section */}
      <View style={s.ownerSection}>
        <View style={s.ownerCard}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Skeleton width={120} height={16} borderRadius={4} />
            <Skeleton width={80} height={14} borderRadius={4} style={{ marginTop: 3 }} />
          </View>
        </View>
        <View style={s.ownerStats}>
          <View style={s.ownerStatGroup}>
            <Skeleton width={30} height={16} borderRadius={4} />
            <Skeleton width={40} height={12} borderRadius={4} style={{ marginTop: 2 }} />
          </View>
          <View style={s.statDivider} />
          <View style={s.ownerStatGroup}>
            <Skeleton width={30} height={16} borderRadius={4} />
            <Skeleton width={40} height={12} borderRadius={4} style={{ marginTop: 2 }} />
          </View>
        </View>
        {/* Description */}
        <Skeleton width="100%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
      </View>

      {/* Showcase DNA */}
      <View style={s.dna}>
        <Skeleton width="100%" height={10} borderRadius={5} />
        <View style={s.dnaLegend}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.dnaLegendItem}>
              <Skeleton width={8} height={8} borderRadius={4} />
              <Skeleton width={50} height={11} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Search section */}
      <View style={s.searchSection}>
        <Skeleton width="100%" height={40} borderRadius={12} />
      </View>

      {/* Tabs */}
      <View style={s.pillTabs}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} width={70} height={28} borderRadius={20} />
        ))}
      </View>

      {/* Controls row */}
      <View style={s.controls}>
        <Skeleton width={80} height={36} borderRadius={20} />
        <Skeleton width={72} height={40} borderRadius={12} />
      </View>

      {/* Grid */}
      <View style={s.grid}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={s.gridCard}>
            <Skeleton width="100%" height={0} borderRadius={0} style={{ aspectRatio: 4 / 5 }} />
            <View style={s.gridCardInfo}>
              <Skeleton width="85%" height={13} borderRadius={4} />
              <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  title: { paddingHorizontal: 16, marginBottom: 4 },

  ownerSection: { padding: 16 },
  ownerCard: { flexDirection: 'row', alignItems: 'center' },
  ownerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  ownerStatGroup: { alignItems: 'center' },
  statDivider: { width: 1, height: 16, backgroundColor: colors.border },

  dna: { paddingHorizontal: 16, marginBottom: 12 },
  dnaLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dnaLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  searchSection: { paddingHorizontal: 16, marginBottom: 12 },

  pillTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  gridCard: {
    width: CARD_W,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridCardInfo: { padding: 10 },
});
