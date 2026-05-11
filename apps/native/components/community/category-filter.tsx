import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

export type CategoryFilterValue = 'all' | 'memorabilia' | 'trading_cards';

interface CategoryFilterProps {
  active: CategoryFilterValue;
  onChange: (filter: CategoryFilterValue) => void;
}

const CHIPS: Array<{ id: CategoryFilterValue; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'memorabilia', label: 'Memorabilia' },
  { id: 'trading_cards', label: 'Trading Cards' },
];

function getChipStyle(id: CategoryFilterValue, isActive: boolean) {
  if (!isActive) return { bg: colors.surfaceElevated, text: colors.mutedForeground };
  switch (id) {
    case 'memorabilia': return { bg: colors.primaryMuted, text: colors.primary };
    case 'trading_cards': return { bg: colors.accentMuted, text: colors.accent };
    default: return { bg: colors.primary, text: colors.primaryForeground };
  }
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <View style={styles.container}>
      {CHIPS.map((chip) => {
        const isActive = active === chip.id;
        const { bg, text } = getChipStyle(chip.id, isActive);
        return (
          <TouchableOpacity
            key={chip.id}
            style={[styles.chip, { backgroundColor: bg }]}
            onPress={() => onChange(chip.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${chip.label}`}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, { color: text }]}>{chip.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
