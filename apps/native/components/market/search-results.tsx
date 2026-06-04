/**
 * SearchResults — State 3 body.
 *
 * Pill row: All | Collectibles | Showcases | Collectors (single-select)
 *
 * All pill (sectioned):
 *   1. Collectibles (top 5, 2-col grid)
 *   2. Showcases    (top 3, list)
 *   3. Collectors   (top 3, list)
 *   Each section has a "VIEW ALL →" header action.
 *
 * Single-pill views: full paginated lists for each content type.
 *
 * Stability contract: filter/chip objects passed to child views are
 * memoized against primitive inputs so child useEffects only fire when
 * the actual values change (not on every parent render).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  SearchRefetchOverlay,
  SearchResultsAllSkeleton,
  SearchResultsCollectiblesSkeleton,
  SearchResultsListRowsSkeleton,
} from '@/components/skeleton';
import { Chip, CollectibleGridCard } from '@/components/vault';
import {
  browseMarket,
  searchCollectorsTiered,
  searchShowcasesTiered,
  type MarketItem,
  type MarketFilters,
  type MarketSearchChipFilters,
  type CollectorSearchResult,
  type ShowcaseSearchResult,
} from '@/lib/api/market';
import { toCardData } from '@/components/collectibles/collection';
import type { MarketFilterState } from '@/components/collectibles/market-search-filter-sheet';
import { useTheme, TYPE } from '@/lib/design';

import { CollectorResultRow } from './collector-result-row';
import { ShowcaseResultRow } from './showcase-result-row';

type ResultPill = 'all' | 'collectibles' | 'showcases' | 'collectors';

const PILLS: { key: ResultPill; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'showcases', label: 'Showcases' },
  { key: 'collectors', label: 'Collectors' },
];

const SCREEN_WIDTH  = Dimensions.get('window').width;
const EDGE_PADDING  = 16;
const COLUMN_GAP    = 10;
const NUM_COLUMNS   = 2;
const CARD_WIDTH    =
  (SCREEN_WIDTH - EDGE_PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const PAGE_SIZE     = 20;

interface SearchResultsProps {
  query: string;
  filters: MarketFilterState;
  selectedType: string | null;
  selectedTrait: string | null;
  currentUserId?: string;
}

export function SearchResults({
  query,
  filters,
  selectedType,
  selectedTrait,
  currentUserId,
}: SearchResultsProps) {
  const [activePill, setActivePill] = useState<ResultPill>('all');

  const chipFilters: MarketSearchChipFilters = useMemo(() => {
    const types =
      selectedType ? [selectedType] : filters.types.length ? filters.types : undefined;
    const traits =
      selectedTrait ? [selectedTrait] : filters.traits.length ? filters.traits : undefined;
    const statuses = filters.statuses.length ? filters.statuses : undefined;
    return { types, traits, statuses };
  }, [
    selectedType,
    selectedTrait,
    filters.types,
    filters.traits,
    filters.statuses,
  ]);

  const browseFilters: MarketFilters = useMemo(
    () => ({
      search: query,
      types:        chipFilters.types,
      traits:       chipFilters.traits,
      statuses:     chipFilters.statuses,
      valueMin:     filters.valueRange.min ?? undefined,
      valueMax:     filters.valueRange.max ?? undefined,
      searchPerson: filters.person || undefined,
      searchTeam:   filters.team || undefined,
    }),
    [
      query,
      chipFilters,
      filters.valueRange.min,
      filters.valueRange.max,
      filters.person,
      filters.team,
    ],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRail}
        style={styles.pillRailScroll}
      >
        {PILLS.map((pill) => (
          <Chip
            key={pill.key}
            label={pill.label}
            selected={activePill === pill.key}
            onPress={() => setActivePill(pill.key)}
          />
        ))}
      </ScrollView>

      {activePill === 'all' && (
        <AllView
          query={query}
          browseFilters={browseFilters}
          chipFilters={chipFilters}
          currentUserId={currentUserId}
          onViewAllCollectibles={() => setActivePill('collectibles')}
          onViewAllShowcases={() => setActivePill('showcases')}
          onViewAllCollectors={() => setActivePill('collectors')}
        />
      )}

      {activePill === 'collectibles' && (
        <CollectiblesView
          browseFilters={browseFilters}
          currentUserId={currentUserId}
        />
      )}

      {activePill === 'showcases' && (
        <ShowcasesView
          query={query}
          chipFilters={chipFilters}
          currentUserId={currentUserId}
        />
      )}

      {activePill === 'collectors' && (
        <CollectorsView
          query={query}
          chipFilters={chipFilters}
          currentUserId={currentUserId}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ALL VIEW — sectioned preview
// ---------------------------------------------------------------------------

interface AllViewProps {
  query: string;
  browseFilters: MarketFilters;
  chipFilters: MarketSearchChipFilters;
  currentUserId?: string;
  onViewAllCollectibles: () => void;
  onViewAllShowcases: () => void;
  onViewAllCollectors: () => void;
}

function AllView({
  query,
  browseFilters,
  chipFilters,
  currentUserId,
  onViewAllCollectibles,
  onViewAllShowcases,
  onViewAllCollectors,
}: AllViewProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [collectibles, setCollectibles] = useState<MarketItem[]>([]);
  const [showcases, setShowcases]       = useState<ShowcaseSearchResult[]>([]);
  const [collectors, setCollectors]     = useState<CollectorSearchResult[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refetching, setRefetching]     = useState(false);
  const hadResultsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (hadResultsRef.current) setRefetching(true);
    else setLoading(true);

    Promise.allSettled([
      browseMarket(browseFilters, 5, 0, currentUserId),
      searchShowcasesTiered(query, chipFilters, 3, currentUserId),
      searchCollectorsTiered(query, chipFilters, 3, currentUserId),
    ])
      .then(([cRes, sRes, colRes]) => {
        if (cancelled) return;
        const nextCollectibles =
          cRes.status === 'fulfilled' ? cRes.value : [];
        const nextShowcases =
          sRes.status === 'fulfilled' ? sRes.value : [];
        const nextCollectors =
          colRes.status === 'fulfilled' ? colRes.value : [];
        if (cRes.status !== 'fulfilled') console.warn('[AllView] collectibles', cRes.reason);
        if (sRes.status !== 'fulfilled') console.warn('[AllView] showcases', sRes.reason);
        if (colRes.status !== 'fulfilled') console.warn('[AllView] collectors', colRes.reason);
        setCollectibles(nextCollectibles);
        setShowcases(nextShowcases);
        setCollectors(nextCollectors);
        hadResultsRef.current =
          nextCollectibles.length > 0 ||
          nextShowcases.length > 0 ||
          nextCollectors.length > 0;
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, browseFilters, chipFilters, currentUserId]);

  const hasAny =
    collectibles.length > 0 || showcases.length > 0 || collectors.length > 0;

  if (loading && !hasAny) {
    return <SearchResultsAllSkeleton />;
  }

  if (!hasAny) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No results for &ldquo;{query}&rdquo;</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          Try a different search or adjust your filters.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.bodyWrap}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.allContent}
    >
      {collectibles.length > 0 && (
        <View style={styles.section}>
          <SectionHeader label="Collectibles" onViewAll={onViewAllCollectibles} />
          <View style={styles.gridSection}>
            {collectibles.map((item) => (
              <CollectibleGridCard
                key={item.id}
                item={toCardData(item)}
                width={CARD_WIDTH}
                onPress={() => router.push(`/collectible/${item.id}` as never)}
              />
            ))}
          </View>
        </View>
      )}

      {showcases.length > 0 && (
        <View style={styles.section}>
          <SectionHeader label="Showcases" onViewAll={onViewAllShowcases} />
          {showcases.map((s) => (
            <ShowcaseResultRow key={s.showcaseId} result={s} />
          ))}
        </View>
      )}

      {collectors.length > 0 && (
        <View style={styles.section}>
          <SectionHeader label="Collectors" onViewAll={onViewAllCollectors} />
          {collectors.map((c) => (
            <CollectorResultRow
              key={c.userId}
              result={c}
              currentUserId={currentUserId}
            />
          ))}
        </View>
      )}
    </ScrollView>
    {refetching ? <SearchRefetchOverlay /> : null}
    </View>
  );
}

function SectionHeader({
  label,
  onViewAll,
}: {
  label: string;
  onViewAll: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
      <Pressable onPress={onViewAll} hitSlop={8}>
        <Text style={[styles.viewAll, { color: colors.brandVolt }]}>VIEW ALL →</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// COLLECTIBLES PILL VIEW — full paginated grid
// ---------------------------------------------------------------------------

function CollectiblesView({
  browseFilters,
  currentUserId,
}: {
  browseFilters: MarketFilters;
  currentUserId?: string;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems]               = useState<MarketItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refetching, setRefetching]     = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(true);
  const pageRef       = useRef(0);
  const isFetchingRef = useRef(false);
  const itemsRef      = useRef<MarketItem[]>([]);

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
        if (replace) setItems(data);
        else setItems((p) => [...p, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        console.warn('[CollectiblesView] error', err);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setRefetching(false);
        setLoadingMore(false);
      }
    },
    [browseFilters, currentUserId],
  );

  itemsRef.current = items;

  useEffect(() => {
    pageRef.current = 0;
    if (itemsRef.current.length > 0) setRefetching(true);
    else setLoading(true);
    setHasMore(true);
    loadPage(0, true);
  }, [browseFilters, currentUserId, loadPage]);

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    setLoadingMore(true);
    loadPage(next, false);
  }, [hasMore, loadingMore, loading, loadPage]);

  if (loading && items.length === 0) {
    return <SearchResultsCollectiblesSkeleton />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No collectibles found</Text>
      </View>
    );
  }

  return (
    <View style={styles.bodyWrap}>
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.gridList}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
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
          onPress={() => router.push(`/collectible/${item.id}` as never)}
        />
      )}
    />
    {refetching ? <SearchRefetchOverlay /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SHOWCASES PILL VIEW
// ---------------------------------------------------------------------------

function ShowcasesView({
  query,
  chipFilters,
  currentUserId,
}: {
  query: string;
  chipFilters: MarketSearchChipFilters;
  currentUserId?: string;
}) {
  const { colors } = useTheme();
  const [items, setItems]     = useState<ShowcaseSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hadResultsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (hadResultsRef.current) setRefetching(true);
    else setLoading(true);
    searchShowcasesTiered(query, chipFilters, PAGE_SIZE, currentUserId)
      .then((d) => {
        if (cancelled) return;
        setItems(d);
        hadResultsRef.current = d.length > 0;
      })
      .catch((err) => console.warn('[ShowcasesView] error', err))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
        }
      });
    return () => { cancelled = true; };
  }, [query, chipFilters, currentUserId]);

  if (loading && items.length === 0) {
    return <SearchResultsListRowsSkeleton rows={6} variant="showcase" />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No showcases found</Text>
      </View>
    );
  }

  return (
    <View style={styles.bodyWrap}>
    <FlatList
      data={items}
      keyExtractor={(item) => item.showcaseId}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.pillList}
      renderItem={({ item }) => <ShowcaseResultRow result={item} />}
    />
    {refetching ? <SearchRefetchOverlay /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// COLLECTORS PILL VIEW
// ---------------------------------------------------------------------------

function CollectorsView({
  query,
  chipFilters,
  currentUserId,
}: {
  query: string;
  chipFilters: MarketSearchChipFilters;
  currentUserId?: string;
}) {
  const { colors } = useTheme();
  const [items, setItems]     = useState<CollectorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hadResultsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (hadResultsRef.current) setRefetching(true);
    else setLoading(true);
    searchCollectorsTiered(query, chipFilters, PAGE_SIZE, currentUserId)
      .then((d) => {
        if (cancelled) return;
        setItems(d);
        hadResultsRef.current = d.length > 0;
      })
      .catch((err) => console.warn('[CollectorsView] error', err))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
        }
      });
    return () => { cancelled = true; };
  }, [query, chipFilters, currentUserId]);

  if (loading && items.length === 0) {
    return <SearchResultsListRowsSkeleton rows={6} variant="collector" />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No collectors found</Text>
      </View>
    );
  }

  return (
    <View style={styles.bodyWrap}>
    <FlatList
      data={items}
      keyExtractor={(item) => item.userId}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.pillList}
      renderItem={({ item }) => (
        <CollectorResultRow result={item} currentUserId={currentUserId} />
      )}
    />
    {refetching ? <SearchRefetchOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bodyWrap: {
    flex: 1,
  },
  pillRailScroll: {
    flexGrow: 0,
  },
  pillRail: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingBottom: 120,
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
  allContent: {
    paddingBottom: 120,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  viewAll: {
    fontFamily: TYPE.interMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
    paddingHorizontal: EDGE_PADDING,
  },
  gridList: {
    padding: EDGE_PADDING,
    paddingBottom: 120,
    gap: COLUMN_GAP,
  },
  pillList: {
    paddingBottom: 120,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
