/**
 * ChipRail — single-select horizontal pill row combining collectible types
 * and canonical trait chips.
 *
 * Types come from getExploreCategories() (loaded by the surface).
 * Traits are the four canonical TRAIT_ORDER keys from trait-config.
 *
 * Single-select across the entire rail: selecting a type clears any active
 * trait and vice versa. Tapping the active chip deselects it.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/vault';
import { TRAIT_CONFIG, TRAIT_ORDER } from '@/lib/design';

export interface ChipRailItem {
  kind: 'type' | 'trait';
  code: string;
  label: string;
}

export interface ChipRailProps {
  types: { code: string; label: string }[];
  selectedType: string | null;
  selectedTrait: string | null;
  onChange: (selection: { type: string | null; trait: string | null }) => void;
}

export function ChipRail({ types, selectedType, selectedTrait, onChange }: ChipRailProps) {
  const traitChips: ChipRailItem[] = TRAIT_ORDER.map((key) => ({
    kind: 'trait' as const,
    code: key,
    label: TRAIT_CONFIG[key].label,
  }));

  const typeChips: ChipRailItem[] = types.map((t) => ({
    kind: 'type' as const,
    code: t.code,
    label: t.label,
  }));

  const all: ChipRailItem[] = [...typeChips, ...traitChips];

  const handlePress = (item: ChipRailItem) => {
    if (item.kind === 'type') {
      const next = selectedType === item.code ? null : item.code;
      onChange({ type: next, trait: null });
    } else {
      const next = selectedTrait === item.code ? null : item.code;
      onChange({ type: null, trait: next });
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      // flexGrow:0 prevents the horizontal ScrollView from greedily
      // claiming vertical space inside the column-direction parent.
      // Without this, RN sizes the outer ScrollView to fill remaining
      // height and pushes everything below it to the bottom of the screen.
      style={styles.scroll}
    >
      {all.map((item) => {
        const active =
          item.kind === 'type'
            ? selectedType === item.code
            : selectedTrait === item.code;
        return (
          <Chip
            key={`${item.kind}-${item.code}`}
            label={item.label}
            selected={active}
            onPress={() => handlePress(item)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
