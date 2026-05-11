import React, { useRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { FilterSheet } from '@/components/vault';
import { useTheme, RADII, TYPE } from '@/lib/design';

import {
  EntitySearchInput,
  FilterSection,
  SignalFilterBadges,
  StatusFilterGrid,
  ValueRangeSlider,
  type FilterOption,
} from './collection-filter-controls';

export interface MarketFilterState {
  types: string[];
  statuses: string[];
  traits: string[];
  valueRange: { min: number | null; max: number | null };
  person: string;
  team: string;
}

export const EMPTY_MARKET_FILTER: MarketFilterState = {
  types: [],
  statuses: [],
  traits: [],
  valueRange: { min: null, max: null },
  person: '',
  team: '',
};

export interface MarketSearchFilterSheetProps {
  visible: boolean;
  filters: MarketFilterState;
  typeOptions: FilterOption[];
  traitOptions: FilterOption[];
  onChange: (filters: MarketFilterState) => void;
  onClose: () => void;
  onReset: () => void;
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'FOR_SALE',   label: 'For Sale',    count: 0 },
  { value: 'FOR_TRADE',  label: 'For Trade',   count: 0 },
  { value: 'SELL_TRADE', label: 'Sell & Trade', count: 0 },
  { value: 'NFST',       label: 'Not Listed',  count: 0 },
];

const VALUE_BOUNDS = { min: 0, max: 100_000 };

function defaultFormatPrice(value: number | null): string {
  if (value == null) return '-';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function toggleArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function MarketSearchFilterSheet({
  visible,
  filters,
  typeOptions,
  traitOptions,
  onChange,
  onClose,
  onReset,
}: MarketSearchFilterSheetProps) {
  const { colors } = useTheme();
  const personRef = useRef<TextInput>(null);
  const teamRef   = useRef<TextInput>(null);

  const update = (patch: Partial<MarketFilterState>) =>
    onChange({ ...filters, ...patch });

  return (
    <FilterSheet
      visible={visible}
      title="Filter Market"
      applyLabel="Apply"
      onClose={onClose}
      onReset={onReset}
      onApply={onClose}
    >
      <FilterSection title="Listing Status">
        <StatusFilterGrid
          options={STATUS_OPTIONS}
          selected={filters.statuses}
          onToggle={(v) => update({ statuses: toggleArray(filters.statuses, v) })}
        />
      </FilterSection>

      <FilterSection title="Traits">
        <SignalFilterBadges
          options={traitOptions}
          selected={filters.traits}
          onToggle={(v) => update({ traits: toggleArray(filters.traits, v) })}
        />
      </FilterSection>

      <FilterSection title="People / Athletes">
        <TextInput
          ref={personRef}
          style={[styles.textInput, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg, color: colors.textPrimary }]}
          value={filters.person}
          onChangeText={(t) => update({ person: t })}
          placeholder="e.g. Mike Trout, Kobe Bryant"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          onSubmitEditing={() => teamRef.current?.focus()}
          autoCorrect={false}
          autoCapitalize="words"
        />
      </FilterSection>

      <FilterSection title="Teams / Franchise / IP">
        <TextInput
          ref={teamRef}
          style={[styles.textInput, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg, color: colors.textPrimary }]}
          value={filters.team}
          onChangeText={(t) => update({ team: t })}
          placeholder="e.g. Lakers, Yankees"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          onSubmitEditing={onClose}
          autoCorrect={false}
          autoCapitalize="words"
        />
      </FilterSection>

      <FilterSection title="Collectible Type">
        <EntitySearchInput
          options={typeOptions}
          selected={filters.types}
          onToggle={(v) => update({ types: toggleArray(filters.types, v) })}
          placeholder="Search types…"
        />
      </FilterSection>

      <FilterSection title="Value">
        <ValueRangeSlider
          bounds={VALUE_BOUNDS}
          value={filters.valueRange}
          onChange={(valueRange) => update({ valueRange })}
          formatPrice={defaultFormatPrice}
        />
      </FilterSection>
    </FilterSheet>
  );
}

const styles = StyleSheet.create({
  textInput: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
});
