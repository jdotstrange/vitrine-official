import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkeletonCircle, SkeletonGroup, SkeletonRect } from '@/components/vault';
import { RADII, SPACING, useTheme } from '@/lib/design';

const { width: SCREEN_W } = Dimensions.get('window');
const GUTTER = SPACING.gutter;
const COLLAGE_TILE_W = (SCREEN_W - GUTTER * 2 - 20) / 3;
const COLLAGE_TILE_H = COLLAGE_TILE_W / (4 / 5);

const LENS_TAB_WIDTHS = [56, 64] as const;

export function ShowcaseDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <SkeletonGroup style={styles.flex}>
        <View style={[styles.lensStrip, { borderBottomColor: colors.frostDivider }]}>
          <View style={styles.lensTrack}>
            {LENS_TAB_WIDTHS.map((width, i) => (
              <SkeletonRect key={i} width={width} height={12} radius={4} />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.dossier, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
            <SkeletonRect width="88%" height={26} radius={6} />
            <View style={styles.metaRow}>
              <SkeletonRect width={120} height={11} radius={4} />
              <SkeletonRect width={72} height={20} radius={10} />
            </View>

            <View style={styles.collageRow}>
              {[0, 1, 2].map((i) => (
                <SkeletonRect
                  key={i}
                  width={COLLAGE_TILE_W}
                  height={COLLAGE_TILE_H}
                  radius={12}
                />
              ))}
            </View>

            <View style={styles.metricsRow}>
              <SkeletonRect width={0} height={72} radius={12} style={styles.metricCard} />
              <SkeletonRect width={0} height={72} radius={12} style={styles.metricCard} />
            </View>

            <View style={styles.ownerRow}>
              <SkeletonRect width={44} height={44} radius={6} />
              <View style={styles.ownerText}>
                <SkeletonRect width="55%" height={14} radius={4} />
                <SkeletonRect width="40%" height={11} radius={4} style={styles.gap4} />
              </View>
              <SkeletonRect width={72} height={30} radius={RADII.pill} />
            </View>
          </View>

          <View style={styles.section}>
            <SkeletonRect width={100} height={11} radius={4} style={styles.sectionLabel} />
            <SkeletonRect width="100%" height={100} radius={14} />
          </View>
          <View style={styles.section}>
            <SkeletonRect width={90} height={11} radius={4} style={styles.sectionLabel} />
            <SkeletonRect width="100%" height={88} radius={14} />
          </View>
        </ScrollView>
      </SkeletonGroup>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  lensStrip: {
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lensTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    gap: 28,
    minHeight: 44,
  },
  scrollContent: {
    paddingHorizontal: GUTTER,
    paddingTop: 16,
    paddingBottom: 100,
  },
  dossier: {
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  collageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  metricCard: { flex: 1 },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  ownerText: { flex: 1 },
  section: { marginTop: 28 },
  sectionLabel: { marginBottom: 12 },
  gap4: { marginTop: 4 },
});
