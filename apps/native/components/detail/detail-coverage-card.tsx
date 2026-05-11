import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

export interface DetailCoverageCardProps {
  fieldCount: number;
  density: string;
  densityColors: { text: string; bg: string; border: string };
}

export function DetailCoverageCard({ fieldCount, density, densityColors }: DetailCoverageCardProps) {
  return (
    <View style={styles.detailsCoverageCard}>
      <Text style={styles.sectionLabel}>DETAIL COVERAGE</Text>
      <View style={styles.detailsCoverageRow}>
        <Text style={[styles.detailsCoverageValue, { color: densityColors.text }]}>{fieldCount}</Text>
        <Text style={styles.detailsCoverageText}>
          {density === 'absent' ? 'No Unique Identifiers Provided' : 'Unique Identifiers Provided'}
        </Text>
        <View style={[styles.detailsCoverageBadge, { borderColor: densityColors.border, backgroundColor: densityColors.bg }]}>
          <Text style={[styles.detailsCoverageBadgeText, { color: densityColors.text }]}>
            {density.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  detailsCoverageCard: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 2,
    marginBottom: 12,
  },
  detailsCoverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsCoverageValue: {
    fontSize: 22,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: colors.primary,
  },
  detailsCoverageText: {
    fontSize: 12,
    color: colors.mutedForeground,
    flex: 1,
  },
  detailsCoverageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary + '59',
    backgroundColor: colors.primary + '1A',
  },
  detailsCoverageBadgeText: {
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1,
  },
});
