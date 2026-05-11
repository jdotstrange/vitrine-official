import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface EnrichCardProps {
  dynamicFieldCount: number;
  onPress: () => void;
}

export function EnrichCard({ dynamicFieldCount, onPress }: EnrichCardProps) {
  return (
    <TouchableOpacity
      style={styles.enrichCard}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Enrich this item with more details"
    >
      <View style={styles.enrichLeft}>
        <View style={styles.enrichKpi}>
          <Text style={styles.enrichKpiValue}>{dynamicFieldCount}</Text>
          <Text style={styles.enrichKpiMax}>/10+</Text>
        </View>
        <View style={styles.enrichContent}>
          <Text style={styles.enrichTitle}>Enrich This Item</Text>
          <Text style={styles.enrichSubtitle}>Add identifiers to boost trust & discoverability</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  enrichCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.primary + '0F',
    borderWidth: 1,
    borderColor: colors.primary + '26',
  },
  enrichLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  enrichKpi: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  enrichKpiValue: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: colors.primary,
  },
  enrichKpiMax: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono',
    color: colors.mutedForeground,
  },
  enrichContent: {
    flex: 1,
    gap: 2,
  },
  enrichTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  enrichSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
});
