import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

export function InboxSkeleton() {
  return (
    <View style={s.root}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <Skeleton width="100%" height={40} borderRadius={24} />
      </View>

      {/* Conversation rows */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View key={i} style={s.row}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={s.rowText}>
            <Skeleton width="60%" height={14} borderRadius={4} />
            <Skeleton width="85%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={36} height={11} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowText: { flex: 1 },
});
