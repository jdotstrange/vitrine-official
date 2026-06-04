import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SkeletonGroup, SkeletonRect } from '@/components/vault';
import { SPACING, useTheme } from '@/lib/design';

export interface TrackingOverviewSkeletonProps {
  bottomPadding: number;
}

export function TrackingOverviewSkeleton({ bottomPadding }: TrackingOverviewSkeletonProps) {
  const { colors } = useTheme();

  return (
    <SkeletonGroup style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.telemetryCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <SkeletonRect width={100} height={12} radius={4} />
          <SkeletonRect width={140} height={10} radius={3} style={styles.gap8} />
          <SkeletonRect width="100%" height={88} radius={10} style={styles.gap16} />
          <View style={styles.panelRow}>
            <SkeletonRect width={0} height={64} radius={8} style={styles.panel} />
            <SkeletonRect width={0} height={64} radius={8} style={styles.panel} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonRect width={120} height={11} radius={4} />
            <SkeletonRect width={24} height={20} radius={10} />
          </View>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.changeRow, { borderColor: colors.frostDivider }]}
            >
              <SkeletonRect width={36} height={36} radius={8} />
              <View style={styles.changeText}>
                <SkeletonRect width="80%" height={13} radius={4} />
                <SkeletonRect width="50%" height={11} radius={4} style={styles.gap4} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonRect width={130} height={11} radius={4} />
            <SkeletonRect width={56} height={11} radius={4} />
          </View>
          <View style={styles.recentStrip}>
            {[0, 1, 2].map((i) => (
              <SkeletonRect key={i} width={140} height={168} radius={12} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SkeletonRect width={90} height={11} radius={4} style={styles.sectionLabel} />
          <SkeletonRect width="100%" height={100} radius={14} style={styles.gap8} />
          <SkeletonRect width="100%" height={88} radius={14} />
        </View>
      </ScrollView>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingTop: SPACING.gutter,
    paddingHorizontal: SPACING.gutter,
  },
  telemetryCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  panelRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  panel: { flex: 1 },
  section: { marginTop: SPACING.zoneCluster },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: { marginBottom: 12 },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  changeText: { flex: 1 },
  recentStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  gap4: { marginTop: 4 },
  gap8: { marginTop: 8 },
  gap16: { marginTop: 16 },
});
