import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import {
  Chip,
  FilterSheet,
  StatusPill,
  TraitPill,
} from '@/components/vault';
import {
  useTheme,
  RADII,
  TYPE,
  isTraitKey,
  type ListingStatus,
} from '@/lib/design';

export type CollectionFilters = {
  statuses: string[];
  traits: string[];
  types: string[];
  valueRange: { min: number | null; max: number | null };
  people: string[];
  teams: string[];
};

export type FilterOption = {
  value: string;
  label: string;
  count: number;
};

export type CollectionFilterOptions = {
  statuses: FilterOption[];
  traits: FilterOption[];
  types: FilterOption[];
  valueBounds: { min: number; max: number };
  people: FilterOption[];
  teams: FilterOption[];
};

export type CollectionSortOption<T extends string = string> = {
  key: T;
  label: string;
  description: string;
};

export interface CollectionFilterSheetProps {
  visible: boolean;
  filters: CollectionFilters;
  options: CollectionFilterOptions;
  resultCount: number;
  onClose: () => void;
  onReset: () => void;
  onChange: (filters: CollectionFilters) => void;
  formatPrice?: (value: number | null) => string;
  getStatusLabel?: (value: string) => string;
}

export function CollectionFilterSheet({
  visible,
  filters,
  options,
  resultCount,
  onClose,
  onReset,
  onChange,
  formatPrice = defaultFormatPrice,
  getStatusLabel = defaultStatusLabel,
}: CollectionFilterSheetProps) {
  const update = (patch: Partial<CollectionFilters>) => onChange({ ...filters, ...patch });

  return (
    <FilterSheet
      visible={visible}
      title="Filter Collection"
      applyLabel={`Show ${resultCount.toLocaleString()} Items`}
      onClose={onClose}
      onReset={onReset}
      onApply={() => {}}
    >
      <FilterSection title="Listing Status">
        <StatusFilterGrid
          options={options.statuses.map((option) => ({
            ...option,
            label: getStatusLabel(option.value),
          }))}
          selected={filters.statuses}
          onToggle={(value) => update({ statuses: toggleArrayValue(filters.statuses, value) })}
        />
      </FilterSection>

      <FilterSection title="Traits">
        <SignalFilterBadges
          options={options.traits}
          selected={filters.traits}
          onToggle={(value) => update({ traits: toggleArrayValue(filters.traits, value) })}
        />
      </FilterSection>

      <FilterSection title="People / Athletes">
        <EntitySearchInput
          options={options.people}
          selected={filters.people}
          onToggle={(value) => update({ people: toggleArrayValue(filters.people, value) })}
          placeholder="Search people…"
        />
      </FilterSection>

      <FilterSection title="Teams / Franchise / IP">
        <EntitySearchInput
          options={options.teams}
          selected={filters.teams}
          onToggle={(value) => update({ teams: toggleArrayValue(filters.teams, value) })}
          placeholder="Search teams…"
        />
      </FilterSection>

      <FilterSection title="Collectible Type">
        <EntitySearchInput
          options={options.types}
          selected={filters.types}
          onToggle={(value) => update({ types: toggleArrayValue(filters.types, value) })}
          placeholder="Search types…"
        />
      </FilterSection>

      <FilterSection title="Value">
        <ValueRangeSlider
          bounds={options.valueBounds}
          value={filters.valueRange}
          onChange={(valueRange) => update({ valueRange })}
          formatPrice={formatPrice}
        />
      </FilterSection>
    </FilterSheet>
  );
}

export interface CollectionSortSheetProps<T extends string = string> {
  visible: boolean;
  sortKey: T;
  options: readonly CollectionSortOption<T>[];
  defaultKey: T;
  onChange: (sortKey: T) => void;
  onClose: () => void;
}

export function CollectionSortSheet<T extends string = string>({
  visible,
  sortKey,
  options,
  defaultKey,
  onChange,
  onClose,
}: CollectionSortSheetProps<T>) {
  const { colors } = useTheme();

  return (
    <FilterSheet
      visible={visible}
      title="Sort Collection"
      onClose={onClose}
      onReset={() => onChange(defaultKey)}
    >
      <View style={sortStyles.stack}>
        {options.map((option) => {
          const active = option.key === sortKey;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => {
                onChange(option.key);
                onClose();
              }}
              style={[
                sortStyles.row,
                { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
                active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
              ]}
            >
              <View style={sortStyles.copy}>
                <Text
                  style={[
                    sortStyles.label,
                    { color: colors.textSecondary },
                    active && { color: colors.textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={[sortStyles.description, { color: colors.textTertiary }]}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  sortStyles.check,
                  { borderColor: colors.frostBorder },
                  active && { borderColor: colors.brandVolt },
                ]}
              >
                {active ? (
                  <View style={[sortStyles.checkCore, { backgroundColor: colors.brandVolt }]} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </FilterSheet>
  );
}

export interface CollectionTypePillsProps {
  types: string[];
  selectedTypes: string[];
  onSelect: (types: string[]) => void;
  style?: ViewStyle;
}

export function CollectionTypePills({
  types,
  selectedTypes,
  onSelect,
  style,
}: CollectionTypePillsProps) {
  const labels = ['All', ...types];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[filterStyles.typeRow, style]}
    >
      {labels.map((type) => {
        const active = type === 'All'
          ? selectedTypes.length === 0
          : selectedTypes.includes(type);
        const nextTypes = type === 'All' ? [] : toggleArrayValue(selectedTypes, type);

        return (
          <Chip
            key={type}
            label={formatTypeLabel(type)}
            selected={active}
            onPress={() => onSelect(nextTypes)}
          />
        );
      })}
    </ScrollView>
  );
}

export function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={filterStyles.section}>
      <Text style={[filterStyles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

export function FilterChipRow({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const { colors } = useTheme();

  if (options.length === 0) {
    return (
      <Text style={[filterStyles.emptyText, { color: colors.textTertiary }]}>
        No available signals
      </Text>
    );
  }

  return (
    <View style={filterStyles.chipRow}>
      {options.slice(0, 18).map((option) => {
        const active = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              filterStyles.chip,
              { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
              active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
            ]}
          >
            <Text
              style={[
                filterStyles.chipText,
                { color: colors.textSecondary },
                active && { color: colors.textPrimary },
              ]}
            >
              {option.label.toUpperCase()}
            </Text>
            <Text
              style={[
                filterStyles.chipCount,
                { color: colors.textTertiary },
                active && { color: colors.brandVolt },
              ]}
            >
              {option.count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function StatusFilterGrid({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={filterStyles.statusBadgeRow}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              filterStyles.statusBadgeOption,
              active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
            ]}
          >
            <View style={!active && filterStyles.statusBadgeMuted}>
              <StatusPill status={option.value as ListingStatus} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ValueRangeSlider({
  bounds,
  value,
  onChange,
  formatPrice,
}: {
  bounds: { min: number; max: number };
  value: { min: number | null; max: number | null };
  onChange: (value: { min: number | null; max: number | null }) => void;
  formatPrice: (value: number | null) => string;
}) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(1);
  const dragStartRef = useRef({ min: 0, max: 0 });
  const minBound = bounds.min;
  const maxBound = bounds.max;
  const span = Math.max(1, maxBound - minBound);
  const currentMin = value.min ?? minBound;
  const currentMax = value.max ?? maxBound;
  const step = span > 10_000 ? 500 : span > 1_000 ? 100 : 25;

  const clamp = (next: number) =>
    Math.min(maxBound, Math.max(minBound, Math.round(next / step) * step));
  const emitRange = (nextMin: number, nextMax: number) => {
    const normalizedMin = nextMin <= minBound ? null : nextMin;
    const normalizedMax = nextMax >= maxBound ? null : nextMax;
    onChange({ min: normalizedMin, max: normalizedMax });
  };

  const minResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = { min: currentMin, max: currentMax };
        },
        onPanResponderMove: (_, gesture) => {
          const next = clamp(dragStartRef.current.min + (gesture.dx / trackWidth) * span);
          emitRange(Math.min(next, currentMax), currentMax);
        },
      }),
    [currentMax, currentMin, maxBound, minBound, onChange, span, step, trackWidth],
  );

  const maxResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = { min: currentMin, max: currentMax };
        },
        onPanResponderMove: (_, gesture) => {
          const next = clamp(dragStartRef.current.max + (gesture.dx / trackWidth) * span);
          emitRange(currentMin, Math.max(next, currentMin));
        },
      }),
    [currentMax, currentMin, maxBound, minBound, onChange, span, step, trackWidth],
  );

  if (maxBound <= minBound) {
    return (
      <Text style={[filterStyles.emptyText, { color: colors.textTertiary }]}>No value data</Text>
    );
  }

  const minPct = ((currentMin - minBound) / span) * 100;
  const maxPct = ((currentMax - minBound) / span) * 100;

  return (
    <View
      style={[
        filterStyles.sliderWrap,
        { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
      ]}
    >
      <View
        style={[filterStyles.sliderTrack, { backgroundColor: colors.frostDivider }]}
        onLayout={(event) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width))}
      >
        <View
          style={[
            filterStyles.sliderFill,
            {
              left: `${minPct}%`,
              width: `${Math.max(0, maxPct - minPct)}%`,
              backgroundColor: colors.brandVolt,
            },
          ]}
        />
        <View
          {...minResponder.panHandlers}
          style={[
            filterStyles.sliderThumb,
            {
              left: `${minPct}%`,
              backgroundColor: colors.brandVolt,
              borderColor: colors.sheetBg,
            },
          ]}
        />
        <View
          {...maxResponder.panHandlers}
          style={[
            filterStyles.sliderThumb,
            {
              left: `${maxPct}%`,
              backgroundColor: colors.brandVolt,
              borderColor: colors.sheetBg,
            },
          ]}
        />
      </View>
      <View style={filterStyles.sliderBounds}>
        <Text style={[filterStyles.valueCount, { color: colors.textTertiary }]}>
          {formatPrice(currentMin)}
        </Text>
        <Text style={[filterStyles.valueCount, { color: colors.textTertiary }]}>
          {formatPrice(currentMax)}
        </Text>
      </View>
    </View>
  );
}

export function SignalFilterBadges({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const { colors } = useTheme();
  const badgeOptions = options.filter((option) => isTraitKey(option.value));
  if (badgeOptions.length === 0) {
    return (
      <Text style={[filterStyles.emptyText, { color: colors.textTertiary }]}>
        No available signals
      </Text>
    );
  }

  return (
    <View style={filterStyles.signalBadgeRow}>
      {badgeOptions.map((option) => {
        const active = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              filterStyles.signalBadgeOption,
              active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
            ]}
          >
            <View style={!active && filterStyles.statusBadgeMuted}>
              <TraitPill traitKey={option.value} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const SUGGESTION_CAP = 8;
const TOP_SUGGESTIONS = 5;

export function EntitySearchInput({
  options,
  selected,
  onToggle,
  placeholder = 'Search…',
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.includes(o.value)),
    [options, selected],
  );

  const suggestions = useMemo(() => {
    const unselected = options.filter((o) => !selected.includes(o.value));
    if (!query.trim()) {
      return unselected.slice(0, TOP_SUGGESTIONS);
    }
    const q = query.toLowerCase().trim();
    return unselected
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, SUGGESTION_CAP);
  }, [options, selected, query]);

  const noResults = query.trim().length > 0 && suggestions.length === 0;

  const handleSelect = useCallback(
    (value: string) => {
      onToggle(value);
      setQuery('');
    },
    [onToggle],
  );

  const handleRemove = useCallback(
    (value: string) => {
      onToggle(value);
    },
    [onToggle],
  );

  if (options.length === 0) {
    return (
      <Text style={[filterStyles.emptyText, { color: colors.textTertiary }]}>
        No enriched metadata yet
      </Text>
    );
  }

  return (
    <View style={searchInputStyles.container}>
      {selectedOptions.length > 0 && (
        <View style={searchInputStyles.chipRow}>
          {selectedOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => handleRemove(opt.value)}
              style={[
                searchInputStyles.selectedChip,
                { backgroundColor: colors.brandVoltFill, borderColor: colors.brandVoltBorder },
              ]}
              hitSlop={4}
            >
              <Text style={[searchInputStyles.selectedChipLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {opt.label}
              </Text>
              <Text style={[searchInputStyles.selectedChipX, { color: colors.textTertiary }]}>×</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View
        style={[
          searchInputStyles.inputWrap,
          { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[searchInputStyles.input, { color: colors.textPrimary }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>

      {suggestions.length > 0 && (
        <View style={searchInputStyles.suggestionList}>
          {suggestions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              style={[
                searchInputStyles.suggestionRow,
                { borderColor: colors.frostBorder },
              ]}
            >
              <Text
                style={[searchInputStyles.suggestionLabel, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
              <Text style={[searchInputStyles.suggestionCount, { color: colors.textTertiary }]}>
                {opt.count}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {noResults && (
        <Text style={[searchInputStyles.noResults, { color: colors.textTertiary }]}>
          No matches for "{query.trim()}"
        </Text>
      )}
    </View>
  );
}

function EntityFilterRows({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const { colors } = useTheme();

  if (options.length === 0) {
    return (
      <Text style={[filterStyles.emptyText, { color: colors.textTertiary }]}>
        No enriched metadata yet
      </Text>
    );
  }

  return (
    <View style={filterStyles.rowStack}>
      {options.slice(0, 10).map((option) => {
        const active = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              filterStyles.entityRow,
              { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
              active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
            ]}
          >
            <Text
              style={[
                filterStyles.entityLabel,
                { color: colors.textSecondary },
                active && { color: colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            <Text
              style={[
                filterStyles.entityCount,
                { color: colors.textTertiary },
                active && { color: colors.brandVolt },
              ]}
            >
              {option.count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function formatTypeLabel(value: string): string {
  return value.toUpperCase().replace('_', ' ');
}

function defaultStatusLabel(value: string): string {
  return value.replace('_', ' ');
}

function defaultFormatPrice(value: number | null): string {
  if (value == null) return '-';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

const filterStyles = StyleSheet.create({
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  chipCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
  },
  emptyText: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statusBadgeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  statusBadgeMuted: {
    opacity: 0.34,
  },
  sliderWrap: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  valueCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    borderWidth: 3,
  },
  sliderBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rowStack: {
    gap: 8,
  },
  signalBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalBadgeOption: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADII.medium,
    borderWidth: 1,
    padding: 10,
  },
  entityLabel: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
  },
  entityCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
  },
});

const sortStyles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADII.medium,
    borderWidth: 1,
    padding: 14,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontFamily: TYPE.groteskBold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  description: {
    fontFamily: TYPE.inter,
    fontSize: 11,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

const searchInputStyles = StyleSheet.create({
  container: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedChipLabel: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 12,
    maxWidth: 160,
  },
  selectedChipX: {
    fontFamily: TYPE.inter,
    fontSize: 16,
    lineHeight: 16,
  },
  inputWrap: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  suggestionList: {
    gap: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionLabel: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  suggestionCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
  },
  noResults: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
