import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SkeletonCircle, SkeletonGroup, SkeletonRect } from '@/components/vault';
import { RADII, SPACING, useTheme } from '@/lib/design';

const GUTTER = SPACING.zoneIntra;

export interface ProfileHubSkeletonProps {
  /** Owner hub shows settings affordance in the dossier header. */
  isOwnProfile?: boolean;
}

/**
 * PROFILE lens loading shell — mirrors CollectorProfile's ProfileSurface
 * layout so the tab's first paint reads as structure, not empty chrome.
 */
export function ProfileHubSkeleton({ isOwnProfile = true }: ProfileHubSkeletonProps) {
  const { colors } = useTheme();

  return (
    <SkeletonGroup style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dossier card */}
        <View style={[styles.dossier, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <View style={styles.idTop}>
            <SkeletonRect width={64} height={64} radius={8} />
            <View style={styles.nameBlock}>
              <SkeletonRect width="75%" height={22} radius={6} />
              <SkeletonRect width="50%" height={12} radius={4} style={styles.gap6} />
            </View>
            {isOwnProfile ? (
              <SkeletonRect width={28} height={28} radius={14} style={styles.topRight} />
            ) : (
              <View style={styles.visitorActions}>
                <SkeletonRect width={28} height={28} radius={14} />
                <SkeletonRect width={28} height={28} radius={14} />
              </View>
            )}
          </View>

          <View style={styles.spacer32} />

          <View style={styles.followRow}>
            <View style={styles.followBlock}>
              <SkeletonRect width={48} height={22} radius={5} />
              <SkeletonRect width={64} height={10} radius={3} style={styles.gap4} />
            </View>
            <View style={styles.followBlock}>
              <SkeletonRect width={48} height={22} radius={5} />
              <SkeletonRect width={64} height={10} radius={3} style={styles.gap4} />
            </View>
          </View>

          <SkeletonRect width="100%" height={40} radius={8} style={styles.followBtn} />
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <SkeletonRect width={0} height={38} radius={RADII.pill} style={styles.actionBtn} />
          <SkeletonRect width={0} height={38} radius={RADII.pill} style={styles.actionBtn} />
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <SkeletonRect width={0} height={72} radius={12} style={styles.metricCard} />
          <SkeletonRect width={0} height={72} radius={12} style={styles.metricCard} />
        </View>

        {/* Crown jewel */}
        <View style={styles.section}>
          <SkeletonRect width={120} height={12} radius={4} style={styles.sectionLabel} />
          <SkeletonRect width="100%" height={200} radius={16} />
        </View>

        {/* Featured showcase */}
        <View style={styles.section}>
          <SkeletonRect width={140} height={12} radius={4} style={styles.sectionLabel} />
          <SkeletonRect width="100%" height={120} radius={16} />
        </View>

        {/* Collection DNA */}
        <View style={styles.section}>
          <SkeletonRect width={130} height={12} radius={4} style={styles.sectionLabel} />
          <SkeletonRect width="100%" height={100} radius={14} style={styles.gap8} />
          <SkeletonRect width="100%" height={88} radius={14} />
        </View>
      </ScrollView>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GUTTER,
    paddingTop: 24,
    paddingBottom: 100,
  },
  dossier: {
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  idTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameBlock: {
    flex: 1,
    marginLeft: 14,
  },
  topRight: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  visitorActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    gap: 6,
  },
  spacer32: { height: 32 },
  followRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
  },
  followBlock: { alignItems: 'center' },
  followBtn: { marginTop: 16 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 4,
  },
  actionBtn: { flex: 1 },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  metricCard: { flex: 1 },
  section: { marginTop: 28 },
  sectionLabel: { marginBottom: 12 },
  gap4: { marginTop: 4 },
  gap6: { marginTop: 6 },
  gap8: { marginTop: 8 },
});
