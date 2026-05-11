import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../skeleton';
import { CollectionGridSkeleton } from '../skeleton';
import { colors } from '@/lib/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function ProfileSkeleton() {
  return (
    <View style={s.root}>
      {/* Identity row */}
      <View style={s.identity}>
        <Skeleton width={56} height={56} borderRadius={28} />
        <View style={s.identityText}>
          <Skeleton width={120} height={18} borderRadius={5} />
          <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 1 }} />
          <Skeleton width={200} height={32} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
        <View style={s.actionButtons}>
          <Skeleton width={80} height={32} borderRadius={18} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Connections row */}
      <View style={s.connectionsRow}>
        <View style={s.connectionGroup}>
          <Skeleton width={20} height={14} borderRadius={4} />
          <Skeleton width={50} height={13} borderRadius={4} />
        </View>
        <Skeleton width={3} height={3} borderRadius={2} />
        <View style={s.connectionGroup}>
          <Skeleton width={20} height={14} borderRadius={4} />
          <Skeleton width={50} height={13} borderRadius={4} />
        </View>
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={s.statCell}>
            <Skeleton width={30} height={15} borderRadius={4} />
            <Skeleton width={40} height={9} borderRadius={3} style={{ marginTop: 2 }} />
          </View>
        ))}
      </View>

      {/* DNA */}
      <View style={s.dna}>
        <Skeleton width={80} height={10} borderRadius={3} />
        <Skeleton width="100%" height={10} borderRadius={5} style={{ marginTop: 8 }} />
        <View style={s.dnaLegend}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.dnaLegendItem}>
              <Skeleton width={8} height={8} borderRadius={4} />
              <Skeleton width={50} height={11} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Featured showcase */}
      <View style={s.featuredShowcase}>
        <Skeleton width="100%" height={180} borderRadius={14} />
      </View>

      {/* Search controls */}
      <View style={s.searchControls}>
        <Skeleton width={0} height={40} borderRadius={24} style={{ flex: 1 }} />
        <Skeleton width={80} height={36} borderRadius={20} />
        <Skeleton width={72} height={40} borderRadius={12} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <View style={s.tab}>
          <Skeleton width={70} height={14} borderRadius={4} />
        </View>
        <View style={s.tab}>
          <Skeleton width={70} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Chips row */}
      <View style={s.chipsRow}>
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} width={70} height={28} borderRadius={20} />
        ))}
      </View>

      {/* Grid */}
      <CollectionGridSkeleton count={6} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  identity: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  identityText: { flex: 1 },
  actionButtons: { flexDirection: 'row', gap: 8 },

  connectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  connectionGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  statsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  dna: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  dnaLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dnaLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  featuredShowcase: { marginHorizontal: 16, marginBottom: 16 },

  searchControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 16,
    paddingVertical: 12,
  },
});
