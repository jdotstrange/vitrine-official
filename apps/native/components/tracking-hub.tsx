/**
 * TrackingHub — V3 four-lens tracking experience.
 *
 * Mirrors the six-lens Profile Hub pattern: LensSelector (display variant) +
 * LensPager orchestrate four purpose-built lenses. Data is loaded once on
 * mount and shared across lenses via props.
 *
 * Lenses:
 *   OVERVIEW  — intelligence surface: RADAR dossier, recent changes, DNA
 *   TRACKED   — full CollectionSurface of tracked items
 *   ACTIVITY  — tracking-scoped activity (STATUS | VALUE | COMPS chips)
 *   COMPS     — blended comparable sales across the tracked portfolio
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/contexts/auth-context';
import {
  getTrackedCollectionItems,
  getTrackingIds,
  deriveTrackedOverviewStats,
  type OwnerInfo,
} from '@/lib/api/tracking';
import {
  type CollectionItem,
  EMPTY_COLLECTION_FILTERS,
  type CollectionFilters,
  type CollectionSortKey,
} from '@/components/collectibles/collection';
import { type CollectionViewMode } from '@/components/collectibles';
import {
  LensSelector,
  LensPager,
  type LensPagerHandle,
  type LensItem,
} from '@/components/vault';
import { useTheme } from '@/lib/design';

import { OverviewLens } from './tracking-lenses/overview-lens';
import { TrackedLens } from './tracking-lenses/tracked-lens';
import { TrackingActivityLens } from './tracking-lenses/tracking-activity-lens';
import { TrackingCompsLens } from './tracking-lenses/tracking-comps-lens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackingLensKey = 'OVERVIEW' | 'TRACKED' | 'ACTIVITY' | 'COMPS';

const VALID_LENSES = new Set<TrackingLensKey>(['OVERVIEW', 'TRACKED', 'ACTIVITY', 'COMPS']);

const TRACKING_LENSES: readonly LensItem<TrackingLensKey>[] = [
  { key: 'OVERVIEW', label: 'Overview' },
  { key: 'TRACKED', label: 'Tracked' },
  { key: 'ACTIVITY', label: 'Activity' },
  { key: 'COMPS', label: 'Comps' },
];

const LENS_INDEX: Record<TrackingLensKey, number> = {
  OVERVIEW: 0,
  TRACKED: 1,
  ACTIVITY: 2,
  COMPS: 3,
};

export interface TrackingHubProps {
  initialLens?: TrackingLensKey;
  onScrollDirectionChange?: (dir: 'up' | 'down' | null) => void;
}

// ---------------------------------------------------------------------------
// Overview stats shape
// ---------------------------------------------------------------------------

export interface TrackingOverviewStats {
  totalValue: number;
  itemCount: number;
  ownerCount: number;
  topCollectors: { owner: OwnerInfo; count: number }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackingHub({ initialLens, onScrollDirectionChange }: TrackingHubProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<LensPagerHandle>(null);

  // ── Lens state ────────────────────────────────────────────────────────
  const initialIndex = initialLens ? (LENS_INDEX[initialLens] ?? 0) : 0;
  const [lensIndex, setLensIndex] = useState(initialIndex);

  const activeLensKey = TRACKING_LENSES[lensIndex]?.key ?? 'OVERVIEW';

  const handleLensChange = useCallback((key: TrackingLensKey) => {
    const idx = LENS_INDEX[key];
    if (idx !== undefined) {
      setLensIndex(idx);
      pagerRef.current?.setPage(idx);
    }
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [ownerMap, setOwnerMap] = useState<Map<string, OwnerInfo>>(new Map());
  const [trackingIds, setTrackingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [trackingResult, ids] = await Promise.all([
        getTrackedCollectionItems(user.id),
        getTrackingIds(user.id),
      ]);
      setItems(trackingResult.items);
      setOwnerMap(trackingResult.ownerMap);
      setTrackingIds(ids);
    } catch (err) {
      // Silent fail — empty states handle it
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
  }, [loadData]);

  // ── Derived overview stats ────────────────────────────────────────────
  const overviewStats = useMemo<TrackingOverviewStats>(
    () => deriveTrackedOverviewStats(items, ownerMap),
    [items, ownerMap],
  );

  // ── TRACKED lens state ────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<CollectionViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_COLLECTION_FILTERS);
  const [sortKey, setSortKey] = useState<CollectionSortKey>('recent');

  // ── Track/untrack handlers ────────────────────────────────────────────
  const handleTrackItem = useCallback(
    (id: string) => {
      setTrackingIds((prev) => new Set([...prev, id]));
    },
    [],
  );

  const handleTrackToggleItem = useCallback(
    (id: string) => {
      setTrackingIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          // Optimistically remove from items list in tracked view
          setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [],
  );

  const handleOpenItem = useCallback((id: string) => {
    // Navigation handled inside lens via router.push
    void id;
  }, []);

  // ── Cross-lens navigation ─────────────────────────────────────────────
  const navigateToLens = useCallback((key: TrackingLensKey) => {
    handleLensChange(key);
  }, [handleLensChange]);

  const bottomPadding = insets.bottom + 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.void }]} edges={['top']}>
      <LensSelector
        items={TRACKING_LENSES}
        activeKey={activeLensKey}
        onChange={handleLensChange}
        variant="display"
      />
      <LensPager
        ref={pagerRef}
        index={lensIndex}
        onIndexChange={setLensIndex}
        lazy
      >
        <OverviewLens
          items={items}
          ownerMap={ownerMap}
          overviewStats={overviewStats}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onNavigateToLens={navigateToLens}
          onScrollDirectionChange={onScrollDirectionChange}
          bottomPadding={bottomPadding}
        />
        <TrackedLens
          items={items}
          ownerMap={ownerMap}
          trackingIds={trackingIds}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onTrackItem={handleTrackItem}
          onTrackToggleItem={handleTrackToggleItem}
          onOpenItem={handleOpenItem}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          bottomPadding={bottomPadding}
        />
        <TrackingActivityLens
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          bottomPadding={bottomPadding}
        />
        <TrackingCompsLens
          userId={user?.id}
          bottomPadding={bottomPadding}
        />
      </LensPager>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
