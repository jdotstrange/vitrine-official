import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Filter, X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import type { DiscoverFilterValue } from './discover-filter-modal';

interface DiscoverFilterBarProps {
  activeFilter: DiscoverFilterValue | null;
  onOpenModal: () => void;
  onClearFilter: () => void;
}

export function DiscoverFilterBar({
  activeFilter,
  onOpenModal,
  onClearFilter,
}: DiscoverFilterBarProps) {
  if (activeFilter) {
    const label = activeFilter.categoryName
      ? `${activeFilter.typeName} › ${activeFilter.categoryName}`
      : activeFilter.typeName;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.pillActive}
          onPress={onOpenModal}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Filter: ${label}. Tap to change.`}
        >
          <Text style={styles.pillText} numberOfLines={1}>
            {label}
          </Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={(e) => {
              e.stopPropagation();
              onClearFilter();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear filter"
          >
            <X size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pillTrigger}
        onPress={onOpenModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Browse by category"
      >
        <Filter size={14} color={colors.primary} />
        <Text style={styles.triggerText}>Browse by category</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pillTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  pillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingLeft: 14,
    paddingVertical: 8,
    paddingRight: 6,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    gap: 8,
    maxWidth: '100%',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flexShrink: 1,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
});
