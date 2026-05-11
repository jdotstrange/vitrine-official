/**
 * MosaicGrid — State 1 body for the Market Surface.
 *
 * Server-side paginated 2-column grid of CollectibleGridCards.
 * Mirrors the BrowseLens pagination contract: load page 0 on mount,
 * append pages on scroll end, refresh on pull-down.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { CollectibleGridCard } from '@/components/vault';
import type { MarketFilters, MarketItem, MarketSortKey } from '@/lib/api/market';
import { browseMarket } from '@/lib/api/market';
import { toCardData } from '@/components/collectibles/collection';
import { useTheme, TYPE } from '@/lib/design';
import type { MarketFilterState } from '@/components/collectibles/market-search-filter-sheet';

const PAGE_SIZE = 20;
const COLUMN_GAP = 10;
const EDGE_PADDING = 16;
const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - EDGE_PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface MosaicGridProps {
  filters: MarketFilterState;
  sortKey: MarketSortKey;
  selectedType: string | null;
  selectedTrait: string | null;
  currentUserId?: string;
}

export function MosaicGrid({
  filters,
  sortKey,
  selectedType,
  selectedTrait,
  currentUserId,
}: MosaicGridProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const isFetchingRef = useRef(false);

  const browseFilters: MarketFilters = useMemo(() => {
    const types = selectedType
      ? [selectedType]
      : filters.types.length > 0
        ? filters.types
        : undefined;
    const traits = selectedTrait
      ? [selectedTrait]
      : filters.traits.length > 0
        ? filters.traits
        : undefined;
    return {
      types,
      traits,
      statuses:     filters.statuses.length > 0 ? filters.statuses : undefined,
      valueMin:     filters.valueRange.min ?? undefined,
      valueMax:     filters.valueRange.max ?? undefined,
      searchPerson: filters.person || undefined,
      searchTeam:   filters.team   || undefined,
      sort:         sortKey,
    };
  }, [
    selectedType,
    selectedTrait,
    filters.types,
    filters.traits,
    filters.statuses,
    filters.valueRange.min,
    filters.valueRange.max,
    filters.person,
    filters.team,
    sortKey,
  ]);

  const loadPage = useCallback(
    async (page: number, replace: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const data = await browseMarket(
          browseFilters,
          PAGE_SIZE,
          page * PAGE_SIZE,
          currentUserId,
        );

        if (replace) {
          setItems(data);
        } else {
          setItems((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === PAGE_SIZE);
        setError(null);
      } catch (err) {
        setError('Failed to load market items');
        console.warn('[MosaicGrid] load error', err);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [browseFilters, currentUserId],
  );

  useEffect(() => {
    pageRef.current = 0;
    setLoading(true);
    setHasMore(true);
    loadPage(0, true);
  }, [loadPage]);

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setLoadingMore(true);
    loadPage(nextPage, false);
  }, [hasMore, loadingMore, loading, loadPage]);

  const handleRefresh = useCallback(() => {
    pageRef.current = 0;
    setLoading(true);
    setHasMore(true);
    loadPage(0, true);
  }, [loadPage]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandVolt} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: colors.textTertiary }]}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nothing here yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>Try adjusting your filters or chip selection.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onRefresh={handleRefresh}
      refreshing={loading}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.brandVolt} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <CollectibleGridCard
          item={toCardData(item)}
          width={CARD_WIDTH}
          onPress={() => router.push(`/collectible/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: EDGE_PADDING,
    paddingBottom: 120,
    gap: COLUMN_GAP,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingBottom: 120,
  },
  errorText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
