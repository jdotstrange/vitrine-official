/**
 * TrackedLens — full CollectionSurface for the user's tracked portfolio.
 *
 * Uses the same CollectionSurface integration pattern as the Profile
 * COLLECTION lens. Items from other collectors' portfolios — owner
 * attribution appears only on Spatial view cards (there's room; grid/list
 * stay clean).
 *
 * Untrack: long-press on any card opens a confirmation, then calls
 * onTrackToggleItem which the hub wires to optimistic removal.
 */

import React, { useCallback, useRef } from 'react';
import { useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { CollectionSurface } from '@/components/collectibles/collection-surface';
import {
  type CollectionItem,
  type CollectionFilters,
  type CollectionSortKey,
} from '@/components/collectibles/collection';
import { type CollectionViewMode } from '@/components/collectibles';
import type { OwnerInfo } from '@/lib/api/tracking';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrackedLensProps {
  items: CollectionItem[];
  ownerMap: Map<string, OwnerInfo>;
  trackingIds: Set<string>;
  viewMode: CollectionViewMode;
  onViewModeChange: (mode: CollectionViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (f: CollectionFilters) => void;
  sortKey: CollectionSortKey;
  onSortChange: (k: CollectionSortKey) => void;
  onTrackItem: (id: string) => void;
  onTrackToggleItem: (id: string) => void;
  onOpenItem: (id: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  bottomPadding: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackedLens({
  items,
  trackingIds,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortKey,
  onSortChange,
  onTrackItem,
  onTrackToggleItem,
  isRefreshing,
  onRefresh,
  bottomPadding,
}: TrackedLensProps) {
  const router = useRouter();

  const handleOpenItem = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      router.push(`/collectible/${id}` as Href);
    },
    [router],
  );

  return (
    <CollectionSurface
      items={items}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      filters={filters}
      onFiltersChange={onFiltersChange}
      sortKey={sortKey}
      onSortChange={onSortChange}
      crownJewelCollectibleId={null}
      trackingIds={trackingIds}
      onTrackItem={onTrackItem}
      onTrackToggleItem={onTrackToggleItem}
      onOpenItem={handleOpenItem}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      searchPlaceholder="Search tracked items…"
      contentPaddingBottom={bottomPadding}
    />
  );
}
