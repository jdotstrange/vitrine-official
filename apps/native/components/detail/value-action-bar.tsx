import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Target, Pencil } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface ValueActionBarProps {
  price: string;
  isOwner: boolean;
  isTracked?: boolean;
  trackCount?: number;
  onTrackToggle?: () => void;
  onEditValue?: () => void;
}

export function ValueActionBar({
  price,
  isOwner,
  isTracked = false,
  trackCount,
  onTrackToggle,
  onEditValue,
}: ValueActionBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.valueBlock}>
        <Text style={styles.valueAmount}>{price || '--'}</Text>
        <Text style={styles.valueLabel}>Estimated Value</Text>
        {typeof trackCount === 'number' && trackCount > 0 && (
          <Text style={styles.trackCount}>
            {trackCount} collector{trackCount !== 1 ? 's' : ''} tracking
          </Text>
        )}
      </View>

      {isOwner ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditValue}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit value"
        >
          <Pencil size={16} color={colors.foreground} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.trackButton, isTracked && styles.trackButtonActive]}
          onPress={onTrackToggle}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isTracked ? 'Stop tracking' : 'Track this item'}
        >
          <Target size={16} color={isTracked ? colors.accentForeground : colors.primaryForeground} />
          <Text style={[styles.trackButtonText, isTracked && styles.trackButtonTextActive]}>
            {isTracked ? 'Tracking' : 'Track'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  valueBlock: {
    flex: 1,
    gap: 2,
  },
  valueAmount: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: colors.foreground,
  },
  valueLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    letterSpacing: 0.3,
  },
  trackCount: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  trackButtonActive: {
    backgroundColor: colors.accent,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  trackButtonTextActive: {
    color: colors.accentForeground,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
  },
});
