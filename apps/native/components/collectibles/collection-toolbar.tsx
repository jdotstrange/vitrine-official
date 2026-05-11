import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ArrowUpDown, SlidersHorizontal, X, type LucideIcon } from 'lucide-react-native';

import { SearchBar } from '@/components/vault';
import { useTheme, RADII, TYPE } from '@/lib/design';
import { ViewModeSelector, type CollectionViewMode } from './view-mode-selector';

export interface CollectionToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: CollectionViewMode;
  onViewModeChange: (value: CollectionViewMode) => void;
  onOpenFilter?: () => void;
  onOpenSort?: () => void;
  onClearFilter?: () => void;
  onClearSort?: () => void;
  activeFilterCount?: number;
  sortLabel?: string;
  placeholder?: string;
  style?: ViewStyle;
  hideViewModeSelector?: boolean;
}

export function CollectionToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onOpenFilter,
  onOpenSort,
  onClearFilter,
  onClearSort,
  activeFilterCount = 0,
  sortLabel,
  placeholder = 'Search collection...',
  style,
  hideViewModeSelector = false,
}: CollectionToolbarProps) {
  const hasActiveFilters = activeFilterCount > 0;
  const hasActiveSort = Boolean(sortLabel);

  return (
    <View style={[styles.outer, style]}>
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={placeholder}
      />

      <View style={styles.controlsRow}>
        <View style={styles.controlsLeft}>
          <ToolbarButton
            label={hasActiveFilters ? `FILTER ${activeFilterCount}` : 'FILTER'}
            active={hasActiveFilters}
            disabled={!onOpenFilter}
            onPress={onOpenFilter}
            onClear={hasActiveFilters ? onClearFilter : undefined}
            icon={SlidersHorizontal}
          />
          <ToolbarButton
            label={sortLabel ? `SORT ${sortLabel}` : 'SORT'}
            active={hasActiveSort}
            disabled={!onOpenSort}
            onPress={onOpenSort}
            onClear={hasActiveSort ? onClearSort : undefined}
            icon={ArrowUpDown}
          />
        </View>

        {hideViewModeSelector ? null : (
          <ViewModeSelector value={viewMode} onChange={onViewModeChange} />
        )}
      </View>
    </View>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onPress,
  onClear,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onClear?: () => void;
  icon: LucideIcon;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.ctrlBtn,
        { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
        active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
        disabled && styles.disabled,
        pressed && !disabled && { backgroundColor: colors.pressOverlay },
      ]}
    >
      <Icon size={14} color={active ? colors.textPrimary : colors.textSecondary} />
      <Text style={[styles.ctrlText, { color: colors.textSecondary }, active && { color: colors.textPrimary }]}>
        {label}
      </Text>
      {active && onClear && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          hitSlop={6}
          style={[styles.inlineClear, { backgroundColor: colors.frostDivider }]}
        >
          <X size={10} color={colors.textPrimary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsLeft: {
    flexDirection: 'row',
    gap: 10,
  },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  ctrlText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inlineClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
