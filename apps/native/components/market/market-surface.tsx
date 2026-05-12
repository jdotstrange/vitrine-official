/**
 * MarketSurface — Instagram-style search and discovery for the Market tab.
 *
 * State machine:
 *   mosaic  (State 1) — default: ChipRail + MosaicGrid
 *   drawer  (State 2) — search focused, no query: recent searches
 *   results (State 3) — query >= 2 chars: tiered search results
 *
 * Filter + Sort live inline in the SearchHeader (no separate toolbar row,
 * no Cancel button). The X button on the search input clears the query;
 * blurring an empty input transitions back to mosaic.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebounce } from 'use-debounce';

import { useAuth } from '@/lib/contexts/auth-context';
import { getExploreCategories } from '@/lib/api/explore';
import { CollectionSortSheet } from '@/components/collectibles/collection-filter-controls';
import {
  MarketSearchFilterSheet,
  EMPTY_MARKET_FILTER,
  type MarketFilterState,
} from '@/components/collectibles/market-search-filter-sheet';
import type { FilterOption } from '@/components/collectibles/collection-filter-controls';
import { TRAIT_CONFIG, TRAIT_ORDER } from '@vitrine/design-tokens';
import {
  addRecentSearch,
  getRecentSearches,
  removeRecentSearch,
  type RecentSearch,
} from '@/lib/storage/recent-searches';
import type { MarketSortKey } from '@/lib/api/market';
import { useTheme } from '@/lib/design';

import { SearchHeader } from './search-header';
import { ChipRail } from './chip-rail';
import { MosaicGrid } from './mosaic-grid';
import { SearchDrawer } from './search-drawer';
import { SearchResults } from './search-results';

const SORT_OPTIONS: { key: MarketSortKey; label: string; description: string }[] = [
  { key: 'recent',       label: 'Recently Added',  description: 'Newest items first' },
  { key: 'price_high',   label: 'Highest Value',   description: 'Estimated value, high to low' },
  { key: 'price_low',    label: 'Lowest Value',    description: 'Estimated value, low to high' },
  { key: 'alpha',        label: 'A – Z',           description: 'Listing title alphabetically' },
  { key: 'most_tracked', label: 'Most Tracked',    description: 'Highest tracking count first' },
] as const;

type SurfaceState = 'mosaic' | 'drawer' | 'results';

export interface MarketSurfaceProps {
  initialChipType?: string | null;
  initialChipTrait?: string | null;
  initialSearch?: string;
}

export function MarketSurface({
  initialChipType = null,
  initialChipTrait = null,
  initialSearch = '',
}: MarketSurfaceProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState(initialSearch);
  const [debouncedQuery] = useDebounce(query, 300);
  const [surfaceState, setSurfaceState] = useState<SurfaceState>(
    initialSearch.length >= 2 ? 'results' : 'mosaic',
  );

  // ── Chip state ────────────────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<string | null>(initialChipType ?? null);
  const [selectedTrait, setSelectedTrait] = useState<string | null>(initialChipTrait ?? null);

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [filters, setFilters] = useState<MarketFilterState>(EMPTY_MARKET_FILTER);
  const [sortKey, setSortKey] = useState<MarketSortKey>('recent');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  // ── Type chips from explore API ───────────────────────────────────────────
  const [typeChips, setTypeChips] = useState<{ code: string; label: string }[]>([]);

  useEffect(() => {
    getExploreCategories()
      .then((cats) =>
        setTypeChips(
          cats.map((c) => ({
            code: c.id,
            label: c.title,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  // ── Trait options for filter sheet (all 4 canonical traits) ──────────────
  const traitOptions: FilterOption[] = useMemo(
    () =>
      TRAIT_ORDER.map((key) => ({
        value: key,
        label: TRAIT_CONFIG[key].label,
        count: 0,
      })),
    [],
  );

  // ── Type options for filter sheet ─────────────────────────────────────────
  const typeOptions: FilterOption[] = useMemo(
    () => typeChips.map((t) => ({ value: t.code, label: t.label, count: 0 })),
    [typeChips],
  );

  // ── Recent searches ───────────────────────────────────────────────────────
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    getRecentSearches().then(setRecentSearches).catch(() => {});
  }, []);

  useEffect(() => {
    if (surfaceState !== 'results') return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) return;
    let cancelled = false;
    addRecentSearch(trimmed)
      .then(() => getRecentSearches())
      .then((next) => { if (!cancelled) setRecentSearches(next); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [surfaceState, debouncedQuery]);

  // ── Query transitions ─────────────────────────────────────────────────────
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (text.length >= 2) {
      setSurfaceState('results');
    } else if (text.length === 0) {
      setSurfaceState('drawer');
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (surfaceState === 'mosaic') {
      setSurfaceState('drawer');
    }
  }, [surfaceState]);

  const handleBlur = useCallback(() => {
    if (query.trim().length === 0) {
      setSurfaceState('mosaic');
    }
  }, [query]);

  const handleSelectRecentSearch = useCallback((q: string) => {
    setQuery(q);
    setSurfaceState('results');
  }, []);

  const handleDeleteRecentSearch = useCallback(async (q: string) => {
    setRecentSearches((curr) => curr.filter((r) => r.query !== q));
    try {
      const next = await removeRecentSearch(q);
      setRecentSearches(next);
    } catch {
      // Optimistic UI already updated; storage failure is non-critical here.
    }
  }, []);

  // ── Chip changes ──────────────────────────────────────────────────────────
  const handleChipChange = useCallback(
    ({ type, trait }: { type: string | null; trait: string | null }) => {
      setSelectedType(type);
      setSelectedTrait(trait);
    },
    [],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types.length) count += filters.types.length;
    if (filters.statuses.length) count += filters.statuses.length;
    if (filters.traits.length) count += filters.traits.length;
    if (filters.valueRange.min != null || filters.valueRange.max != null) count += 1;
    if (filters.person.trim()) count += 1;
    if (filters.team.trim()) count += 1;
    return count;
  }, [filters]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.void }]} edges={['top']}>
      {/* Persistent chrome — search + inline filter/sort affordances */}
      <SearchHeader
        value={query}
        onChange={handleQueryChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onFilter={() => setFilterSheetVisible(true)}
        onSort={() => setSortSheetVisible(true)}
        activeFilterCount={activeFilterCount}
        sortKey={sortKey}
      />

      <ChipRail
        types={typeChips}
        selectedType={selectedType}
        selectedTrait={selectedTrait}
        onChange={handleChipChange}
      />

      {/* State body */}
      {surfaceState === 'mosaic' && (
        <MosaicGrid
          filters={filters}
          sortKey={sortKey}
          selectedType={selectedType}
          selectedTrait={selectedTrait}
          currentUserId={user?.id}
        />
      )}

      {surfaceState === 'drawer' && (
        <SearchDrawer
          recentSearches={recentSearches}
          onSelectSearch={handleSelectRecentSearch}
          onDeleteSearch={handleDeleteRecentSearch}
        />
      )}

      {surfaceState === 'results' && (
        <SearchResults
          query={debouncedQuery}
          filters={filters}
          selectedType={selectedType}
          selectedTrait={selectedTrait}
          currentUserId={user?.id}
        />
      )}

      {/* Sheets */}
      <MarketSearchFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        typeOptions={typeOptions}
        traitOptions={traitOptions}
        onChange={setFilters}
        onClose={() => setFilterSheetVisible(false)}
        onReset={() => setFilters(EMPTY_MARKET_FILTER)}
      />

      <CollectionSortSheet
        visible={sortSheetVisible}
        sortKey={sortKey}
        options={SORT_OPTIONS}
        defaultKey="recent"
        onChange={(key) => setSortKey(key as MarketSortKey)}
        onClose={() => setSortSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
