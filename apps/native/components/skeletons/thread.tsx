import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';
import { colors } from '@/lib/colors';

const BUBBLE_WIDTHS = [180, 220, 140, 200, 160, 180, 200];

export function ThreadSkeleton() {
  return (
    <View style={s.root}>
      {/* Chat header */}
      <View style={s.header}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={100} height={14} borderRadius={4} />
      </View>

      {/* Bubbles */}
      <View style={s.bubbles}>
        {BUBBLE_WIDTHS.map((w, i) => {
          const isRight = i % 3 !== 0;
          return (
            <View key={i} style={[s.bubbleRow, isRight ? s.right : s.left]}>
              <Skeleton width={w} height={36} borderRadius={16} />
            </View>
          );
        })}
      </View>

      {/* Input bar */}
      <View style={s.inputBar}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={0} height={40} borderRadius={20} style={{ flex: 1 }} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bubbles: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
