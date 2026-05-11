import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';

import {
  CollectibleGridCard,
  CollectibleListCard,
  HolographicFrame,
  SpatialCard,
} from '@/components/vault';
import { useTheme, SPACING } from '@/lib/design';
import { getViewCounts } from '@/lib/api/views';

import {
  CollectionFilterSheet,
  CollectionSortSheet,
  CollectionToolbar,
  CollectionTypePills,
  type CollectionFilters,
  type CollectionViewMode,
} from '.';
import {
  COLLECTION_SORT_OPTIONS,
  EMPTY_COLLECTION_FILTERS,
  countActiveFilters,
  deriveCollectionFilterOptions,
  deriveTypeFilters,
  formatPrice,
  getStatusLabel,
  itemMatchesCollectionFilters,
  resolveCrownJewel,
  sortCollectionItems,
  toCardData,
  type CollectionItem,
  type CollectionSortKey,
} from './collection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUTTER = SPACING.zoneIntra;
const GRID_GAP = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GUTTER * 2 - GRID_GAP) / 2;

export interface CollectionSurfaceProps {
  items: CollectionItem[];
  viewMode: CollectionViewMode;
  onViewModeChange: (mode: CollectionViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  sortKey: CollectionSortKey;
  onSortChange: (sortKey: CollectionSortKey) => void;
  crownJewelCollectibleId?: string | null;
  trackingIds: Set<string>;
  onTrackItem: (id: string) => void;
  onTrackToggleItem: (id: string) => void;
  onOpenItem: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderAccessory?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  searchPlaceholder?: string;
  contentPaddingBottom?: number;
  contentPaddingTop?: number;
  hideViewModeSelector?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function CollectionSurface({
  items,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortKey,
  onSortChange,
  crownJewelCollectibleId,
  trackingIds,
  onTrackItem,
  onTrackToggleItem,
  onOpenItem,
  refreshing,
  onRefresh,
  ListHeaderAccessory,
  ListEmptyComponent,
  searchPlaceholder = 'Search collection…',
  contentPaddingBottom = 100,
  contentPaddingTop = 24,
  hideViewModeSelector = false,
  selectedIds,
  onToggleSelect,
}: CollectionSurfaceProps) {
  const { colors } = useTheme();
  const selectionMode = Boolean(selectedIds);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [viewCountMap, setViewCountMap] = useState<Map<string, number>>(new Map());

  const itemIdsKey = useMemo(() => items.map((i) => i.id).sort().join(','), [items]);
  useEffect(() => {
    const ids = itemIdsKey ? itemIdsKey.split(',') : [];
    if (ids.length === 0) {
      setViewCountMap(new Map());
      return;
    }
    let alive = true;
    getViewCounts('collectible', ids).then((counts) => {
      if (!alive) return;
      const next = new Map<string, number>();
      counts.forEach((value, id) => next.set(id, value.totalViews));
      setViewCountMap(next);
    });
    return () => {
      alive = false;
    };
  }, [itemIdsKey]);

  const typeFilters = useMemo(() => deriveTypeFilters(items), [items]);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const filterOptions = useMemo(() => deriveCollectionFilterOptions(items), [items]);
  const sortOption = COLLECTION_SORT_OPTIONS.find((option) => option.key === sortKey);

  const resolvedCrownJewelId = useMemo(() => {
    if (crownJewelCollectibleId === null) return null;
    return resolveCrownJewel(items, crownJewelCollectibleId)?.id ?? null;
  }, [crownJewelCollectibleId, items]);

  const searched = useMemo(() => {
    const filtered = items.filter((item) => itemMatchesCollectionFilters(item, filters));
    const query = searchQuery.trim().toLowerCase();
    const matching = !query
      ? filtered
      : filtered.filter(
          (i) =>
            i.title.toLowerCase().includes(query) ||
            (i.classification || '').toLowerCase().includes(query),
        );
    return sortCollectionItems(matching, sortKey);
  }, [filters, items, searchQuery, sortKey]);

  const renderItem = useCallback<ListRenderItem<CollectionItem>>(
    ({ item }) => {
      const hydrated: CollectionItem = {
        ...item,
        viewCount: viewCountMap.get(item.id) ?? item.viewCount,
      };
      const cardData = toCardData(hydrated);
      const isCrownJewel = !selectionMode && item.id === resolvedCrownJewelId;
      const isSelected = selectionMode && selectedIds!.has(item.id);
      const handleTap = () => {
        if (selectionMode) {
          onToggleSelect?.(item.id);
          return;
        }
        onOpenItem(item.id);
      };
      if (viewMode === 'grid') {
        const card = (
          <CollectibleGridCard
            item={cardData}
            width={isCrownJewel ? GRID_ITEM_WIDTH - 2 : GRID_ITEM_WIDTH}
            onPress={handleTap}
            selected={isSelected}
          />
        );
        return isCrownJewel ? (
          <HolographicFrame borderRadius={12} intensity="subtle" style={{ width: GRID_ITEM_WIDTH }}>
            {card}
          </HolographicFrame>
        ) : (
          card
        );
      }
      if (viewMode === 'spatial') {
        const card = (
          <SpatialCard
            item={cardData}
            isTracked={trackingIds.has(item.id)}
            onPress={handleTap}
            onTrack={selectionMode ? undefined : () => onTrackItem(item.id)}
            onTrackToggle={selectionMode ? undefined : () => onTrackToggleItem(item.id)}
            selected={isSelected}
          />
        );
        return (
          <View style={cS.fullWidthItem}>
            {isCrownJewel ? (
              <HolographicFrame borderRadius={16} intensity="subtle">
                {card}
              </HolographicFrame>
            ) : (
              card
            )}
          </View>
        );
      }
      const card = (
        <CollectibleListCard item={cardData} onPress={handleTap} selected={isSelected} />
      );
      return (
        <View style={cS.fullWidthItem}>
          {isCrownJewel ? (
            <HolographicFrame borderRadius={12} intensity="subtle">
              {card}
            </HolographicFrame>
          ) : (
            card
          )}
        </View>
      );
    },
    [
      onOpenItem,
      onToggleSelect,
      onTrackItem,
      onTrackToggleItem,
      resolvedCrownJewelId,
      selectedIds,
      selectionMode,
      trackingIds,
      viewMode,
      viewCountMap,
    ],
  );

  const listHeader = useMemo(
    () => (
      <>
        {ListHeaderAccessory}
        <CollectionToolbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onOpenFilter={() => setShowFilterSheet(true)}
          onOpenSort={() => setShowSortSheet(true)}
          onClearFilter={() => onFiltersChange(EMPTY_COLLECTION_FILTERS)}
          onClearSort={() => onSortChange('recent' as CollectionSortKey)}
          activeFilterCount={activeFilterCount}
          sortLabel={sortKey === 'recent' ? undefined : sortOption?.label}
          placeholder={searchPlaceholder}
          style={cS.toolbarOuter}
          hideViewModeSelector={hideViewModeSelector}
        />
        <CollectionTypePills
          types={typeFilters}
          selectedTypes={filters.types}
          onSelect={(types) => onFiltersChange({ ...filters, types })}
          style={cS.typePillsRow}
        />
      </>
    ),
    [
      ListHeaderAccessory,
      activeFilterCount,
      filters,
      hideViewModeSelector,
      onSearchChange,
      onFiltersChange,
      onViewModeChange,
      searchPlaceholder,
      searchQuery,
      sortKey,
      sortOption?.label,
      typeFilters,
      viewMode,
    ],
  );

  return (
    <>
      <FlatList
        key={viewMode}
        data={searched}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        style={{ flex: 1, backgroundColor: colors.void }}
        contentContainerStyle={{ paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={ListEmptyComponent ?? null}
        columnWrapperStyle={viewMode === 'grid' ? cS.gridRow : undefined}
        ItemSeparatorComponent={
          viewMode === 'grid'
            ? undefined
            : viewMode === 'spatial'
              ? SpatialSeparator
              : ListSeparator
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />
        }
        initialNumToRender={viewMode === 'spatial' ? 3 : 10}
        maxToRenderPerBatch={viewMode === 'spatial' ? 3 : 12}
        updateCellsBatchingPeriod={32}
        windowSize={viewMode === 'spatial' ? 5 : 7}
        removeClippedSubviews
        extraData={{ trackingIds, viewCountMap }}
      />
      <CollectionFilterSheet
        visible={showFilterSheet}
        filters={filters}
        options={filterOptions}
        resultCount={searched.length}
        onClose={() => setShowFilterSheet(false)}
        onReset={() => onFiltersChange(EMPTY_COLLECTION_FILTERS)}
        onChange={onFiltersChange}
        formatPrice={formatPrice}
        getStatusLabel={getStatusLabel}
      />
      <CollectionSortSheet
        visible={showSortSheet}
        sortKey={sortKey}
        options={COLLECTION_SORT_OPTIONS}
        defaultKey="recent"
        onChange={onSortChange}
        onClose={() => setShowSortSheet(false)}
      />
    </>
  );
}

function ListSeparator() {
  return <View style={cS.separator} />;
}

function SpatialSeparator() {
  return <View style={cS.spatialSeparator} />;
}

const cS = StyleSheet.create({
  toolbarOuter: {
    paddingHorizontal: GUTTER,
    marginBottom: 14,
  },
  typePillsRow: {
    paddingHorizontal: GUTTER,
  },
  gridRow: {
    gap: GRID_GAP,
    paddingHorizontal: GUTTER,
    marginBottom: 18,
  },
  fullWidthItem: {
    paddingHorizontal: GUTTER,
  },
  separator: {
    height: 8,
  },
  spatialSeparator: {
    height: 32,
  },
});
