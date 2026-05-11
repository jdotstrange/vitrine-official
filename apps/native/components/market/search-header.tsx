/**
 * SearchHeader — V3 SearchBar with persistent inline Filter + Sort
 * affordances on the right.
 *
 * Behavior:
 *   - The X clear button on the SearchBar handles "wipe the query" (the
 *     replacement for the previous Cancel button). No more expanded vs.
 *     collapsed input chrome.
 *   - Filter + Sort live inline next to the input as compact icon buttons
 *     so they're always one tap away regardless of surface state.
 *   - Filter shows a numeric badge when activeFilterCount > 0.
 *   - Sort renders in brand volt when sortKey != default.
 *   - onFocus / onBlur are forwarded so the parent can drive surface-state
 *     transitions (mosaic ↔ drawer ↔ results).
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react-native';

import { SearchBar, type SearchBarHandle } from '@/components/vault';
import { useTheme, RADII, TYPE } from '@/lib/design';
import type { MarketSortKey } from '@/lib/api/market';

interface SearchHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onFilter: () => void;
  onSort: () => void;
  activeFilterCount: number;
  sortKey: MarketSortKey;
  /** Imperatively blur the input. Useful when parent wants to dismiss
   *  the keyboard programmatically (e.g. on chip selection). */
  blurSignal?: number;
  placeholder?: string;
}

const DEFAULT_SORT: MarketSortKey = 'recent';

export function SearchHeader({
  value,
  onChange,
  onFocus,
  onBlur,
  onFilter,
  onSort,
  activeFilterCount,
  sortKey,
  blurSignal = 0,
  placeholder = 'Collectibles, showcases, collectors…',
}: SearchHeaderProps) {
  const { colors } = useTheme();
  const ref = useRef<SearchBarHandle>(null);

  useEffect(() => {
    if (blurSignal > 0) ref.current?.blur();
  }, [blurSignal]);

  const sortActive = sortKey !== DEFAULT_SORT;
  const filterActive = activeFilterCount > 0;

  return (
    <View style={styles.row}>
      <View style={styles.searchWrap}>
        <SearchBar
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClear={() => onChange('')}
          placeholder={placeholder}
        />
      </View>

      <HeaderIconButton
        accessibilityLabel="Filter market"
        active={filterActive}
        badge={filterActive ? String(activeFilterCount) : undefined}
        onPress={onFilter}
      >
        <SlidersHorizontal
          size={18}
          color={filterActive ? colors.brandVolt : colors.textPrimary}
          strokeWidth={1.75}
        />
      </HeaderIconButton>

      <HeaderIconButton
        accessibilityLabel="Sort market"
        active={sortActive}
        onPress={onSort}
      >
        <ArrowUpDown
          size={18}
          color={sortActive ? colors.brandVolt : colors.textPrimary}
          strokeWidth={1.75}
        />
      </HeaderIconButton>
    </View>
  );
}

interface HeaderIconButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  badge?: string;
}

function HeaderIconButton({
  children,
  onPress,
  accessibilityLabel,
  active,
  badge,
}: HeaderIconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconBtn,
        active && [styles.iconBtnActive, { backgroundColor: colors.brandVoltFill }],
        pressed && styles.iconBtnPressed,
      ]}
    >
      {children}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.brandVolt }]}>
          <Text style={[styles.badgeText, { color: colors.textInverse }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const ICON_BTN_SIZE = 44;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
  },
  searchWrap: {
    flex: 1,
  },
  iconBtn: {
    width: ICON_BTN_SIZE,
    height: ICON_BTN_SIZE,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnActive: {},
  iconBtnPressed: {
    opacity: 0.65,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    includeFontPadding: false,
  },
});
