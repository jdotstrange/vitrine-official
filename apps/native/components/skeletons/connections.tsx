import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

export function ConnectionsSkeleton() {
  return (
    <View style={s.root}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <Skeleton width="100%" height={40} borderRadius={12} />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {[0, 1, 2].map(i => (
          <View key={i} style={s.tab}>
            <Skeleton width={50} height={14} borderRadius={4} />
            <Skeleton width={20} height={12} borderRadius={4} style={{ marginTop: 2 }} />
          </View>
        ))}
      </View>
      <View style={s.tabUnderline} />

      {/* Rows */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View key={i} style={s.row}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={s.rowText}>
            <Skeleton width={120} height={15} borderRadius={4} />
            <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 2 }} />
            <Skeleton width={140} height={11} borderRadius={4} style={{ marginTop: 2 }} />
          </View>
          <Skeleton width={72} height={28} borderRadius={18} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabUnderline: { height: 2, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  rowText: { flex: 1 },
});
