import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function DetailSkeleton() {
  return (
    <View style={s.root}>
      {/* Hero image */}
      <Skeleton
        width={SCREEN_WIDTH}
        height={SCREEN_WIDTH * 1.25}
        borderRadius={0}
      />

      {/* Content overlapping hero */}
      <View style={s.content}>
        {/* TitleCard */}
        <View style={s.titleCard}>
          <Skeleton width={70} height={24} borderRadius={6} />
          <Skeleton width="85%" height={28} borderRadius={6} style={{ marginTop: 12 }} />
          <View style={s.ownerRow}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={120} height={14} borderRadius={4} />
          </View>
          <View style={s.statsRow}>
            <Skeleton width={80} height={14} borderRadius={4} />
            <Skeleton width={80} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Value card */}
        <View style={s.valueCard}>
          <Skeleton width={60} height={10} borderRadius={3} />
          <Skeleton width={100} height={22} borderRadius={5} style={{ marginTop: 6 }} />
          <Skeleton width={40} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>

        {/* Detail coverage */}
        <View style={s.coverageCard}>
          <Skeleton width="100%" height={6} borderRadius={3} />
          {[0, 1, 2].map(i => (
            <View key={i} style={s.fieldRow}>
              <Skeleton width="35%" height={12} borderRadius={4} />
              <Skeleton width="55%" height={12} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Dynamic details */}
        <View style={s.dynamicCard}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.detailPair}>
              <Skeleton width={80} height={10} borderRadius={3} />
              <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 3 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    marginTop: -64,
    paddingHorizontal: 16,
    gap: 16,
  },
  titleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  valueCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverageCard: {
    borderRadius: 12,
    padding: 14,
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dynamicCard: {
    borderRadius: 12,
    padding: 16,
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailPair: {},
});
