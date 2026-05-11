import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { CollectibleViewSelector, type ViewMode } from '../ui/collectible-view-selector';
import { SearchBar } from '../search-bar';
import { BottomSheetPicker } from '../ui/bottom-sheet-picker';

export interface ProfileSearchControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  activeTab: 'collection' | 'showcases';
  sortBy: string;
  showSortMenu: boolean;
  onToggleSortMenu: () => void;
  onSortChange: (sort: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOptions: string[];
}

export function ProfileSearchControls({
  searchQuery,
  onSearchChange,
  onSearchClear,
  activeTab,
  sortBy,
  showSortMenu,
  onToggleSortMenu,
  onSortChange,
  viewMode,
  onViewModeChange,
  sortOptions,
}: ProfileSearchControlsProps) {
  const sortSheetOptions = sortOptions.map((opt) => ({
    value: opt.toLowerCase(),
    label: opt,
  }));

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder={
            activeTab === 'collection'
              ? 'Search collection...'
              : 'Search showcases...'
          }
          showClear
        />

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={onToggleSortMenu}
            style={styles.sortButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sortBy}`}
          >
            <ArrowUpDown size={14} color={colors.mutedForeground} />
            <Text style={styles.sortText}>{sortBy.toUpperCase()}</Text>
          </TouchableOpacity>

          <CollectibleViewSelector
            viewMode={viewMode}
            onChange={onViewModeChange}
            allowedModes={['spatial', 'list']}
          />
        </View>
      </View>

      <BottomSheetPicker
        isOpen={showSortMenu}
        onClose={onToggleSortMenu}
        options={sortSheetOptions}
        selectedValue={sortBy}
        onSelect={onSortChange}
        label="Sort By"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    gap: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.mutedForeground,
    letterSpacing: 1,
  },
});
