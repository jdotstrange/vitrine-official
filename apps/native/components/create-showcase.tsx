/**
 * CreateShowcase — V3 lens-based create surface.
 *
 * Replaces the legacy 3-step wizard (Name -> Select -> Visibility) with a
 * lens model that mirrors how the rest of the app pivots through
 * related views:
 *
 *   - CURATED: pick collectibles by hand. Same `CollectionSurface` the
 *     profile collection lens and share-collectible picker use, but in
 *     selection mode (multi-select via brandVolt border chrome).
 *   - MANAGED: rule-based showcases that auto-update as the collection
 *     changes. Currently dark-shipped behind a "coming soon" placeholder
 *     so the lens chip is real even when the feature isn't.
 *
 * Title / description / visibility don't live here — they live on the
 * shared Review screen. Keeping the create surface focused on the
 * actual selection problem ("which items?" or "what rules?") and
 * deferring metadata to a single review step gives both lenses the
 * exact same finalize experience.
 *
 * Top chrome mirrors the showcase-detail-v3 pattern: the LensSelector
 * IS the top bar, with the back arrow overlaying the left edge of the
 * selector band. Lens swipes are wired through `LensPager` so users
 * can swap CURATED ↔ MANAGED with the same horizontal swipe vocabulary
 * they already know from the showcase detail and profile hub screens.
 *
 * Mutual exclusion: a showcase is *either* curated *or* managed — it
 * can never be both. Once the user begins building in one lens, the
 * opposite lens is locked (taps + swipes refused) until they discard
 * the in-progress draft. CURATED has work when items are selected;
 * MANAGED has work when rules exist (today: never, since the rule
 * builder is dark-shipped — but the gate is wired so the future build
 * just flips `hasManagedDraft`).
 *
 * Bottom selection bar appears when at least one item is selected and
 * routes the user to `/upload/showcase/review` with the selected ids.
 *
 * Entry: `/upload/showcase` (the profile-hub Showcase lens CTA pushes
 * directly here).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';

import {
  CollectionSurface,
  EMPTY_COLLECTION_FILTERS,
  formatPrice,
  mapToCollectionItem,
  type CollectionFilters,
  type CollectionItem,
  type CollectionSortKey,
} from '@/components/collectibles';
import {
  LensPager,
  LensSelector,
  type LensPagerHandle,
} from '@/components/vault';
import { ManagedRuleBuilder } from '@/components/managed-rule-builder';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserCollectibles } from '@/lib/api/collectibles';
import { previewRuleMatches } from '@/lib/api/showcases';
import { getTrackCounts } from '@/lib/api/tracking';
import { type ManagedRules } from '@/lib/api/managed-rules';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('CreateShowcase');

type ShowcaseLens = 'curated' | 'managed';

const LENS_KEYS: readonly ShowcaseLens[] = ['curated', 'managed'];

export function CreateShowcase() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // ── Lens state ───────────────────────────────────────────────────
  // Index drives the pager; key drives the selector. They're bridged
  // through the LENS_KEYS array — same pattern as showcase-detail-v3.
  const [lensIndex, setLensIndex] = useState(0);
  const pagerRef = useRef<LensPagerHandle>(null);
  const activeLensKey = LENS_KEYS[lensIndex] ?? 'curated';

  // ── CURATED state ────────────────────────────────────────────────
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toolbar state — owned here so search/filter/sort survive lens flips.
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_COLLECTION_FILTERS);
  const [sortKey, setSortKey] = useState<CollectionSortKey>('recent');

  // Selection state. Set so toggle is O(1) and the surface can ask
  // "is this id selected?" without a list scan per row.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── MANAGED state ────────────────────────────────────────────────
  const [managedRules, setManagedRules] = useState<ManagedRules>({
    match: 'all',
    conditions: [],
  });

  const hasManagedDraft = managedRules.conditions.length > 0;

  // ── Mutual-exclusion lock state ─────────────────────────────────
  const hasCuratedDraft = selectedIds.size > 0;
  const curatedLocked = hasManagedDraft;
  const managedLocked = hasCuratedDraft;

  const lensItems = useMemo(
    () => [
      { key: 'curated' as const, label: 'Curated', locked: curatedLocked },
      { key: 'managed' as const, label: 'Managed', locked: managedLocked },
    ],
    [curatedLocked, managedLocked],
  );

  // ── Data load ───────────────────────────────────────────────────
  const loadCollectibles = useCallback(
    async (forceRefresh: boolean) => {
      if (!user?.id) return;
      if (forceRefresh) setRefreshing(true);
      try {
        const rows = await getUserCollectibles(user.id);
        const trackingCounts = await getTrackCounts(rows.map((r) => r.id));
        const next = rows.map((row) =>
          mapToCollectionItem(row, trackingCounts.get(row.id) ?? 0),
        );
        setItems(next);
      } catch (err) {
        log.error('Failed to load collectibles for create-showcase:', err);
      } finally {
        if (forceRefresh) setRefreshing(false);
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    loadCollectibles(false);
  }, [loadCollectibles]);

  const handleRefresh = useCallback(() => {
    loadCollectibles(true);
  }, [loadCollectibles]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Lens change gating ──────────────────────────────────────────
  // Both the LensSelector (tap) and the LensPager (swipe) route
  // through here. If the target lens is locked by the mutex (the
  // *other* lens has an in-progress draft), the change is refused
  // and the pager is snapped back to the current page so the swipe
  // visually undoes itself. The coming-soon lock on MANAGED is
  // intentionally NOT enforced here — the user is allowed into the
  // placeholder body to read the messaging.
  const isLensLockedByMutex = useCallback(
    (key: ShowcaseLens): boolean => {
      if (key === 'curated') return curatedLocked;
      if (key === 'managed') return managedLocked;
      return false;
    },
    [curatedLocked, managedLocked],
  );

  const handleLensChange = useCallback(
    (key: ShowcaseLens) => {
      if (isLensLockedByMutex(key)) {
        // Refused — snap pager back to the current page so a half-
        // swipe doesn't leave the track on the locked page.
        pagerRef.current?.setPage(lensIndex);
        return;
      }
      const idx = LENS_KEYS.indexOf(key);
      if (idx >= 0 && idx !== lensIndex) {
        setLensIndex(idx);
        pagerRef.current?.setPage(idx);
      }
    },
    [isLensLockedByMutex, lensIndex],
  );

  const handlePagerIndexChange = useCallback(
    (next: number) => {
      const targetKey = LENS_KEYS[next];
      if (targetKey && isLensLockedByMutex(targetKey)) {
        // Refused — pager already updated translateX past the commit
        // line, so explicitly snap it back to the current page.
        pagerRef.current?.setPage(lensIndex);
        return;
      }
      setLensIndex(next);
    },
    [isLensLockedByMutex, lensIndex],
  );

  // ── Continue → review ───────────────────────────────────────────

  // CURATED summary
  const curatedTotalValue = useMemo(() => {
    if (selectedIds.size === 0) return 0;
    return items.reduce((sum, i) => {
      if (!selectedIds.has(i.id)) return sum;
      return sum + (typeof i.value === 'number' ? i.value : 0);
    }, 0);
  }, [items, selectedIds]);

  // MANAGED live preview (cached by useMemo — only re-runs on rule or item change)
  const managedPreview = useMemo(() => {
    if (managedRules.conditions.length === 0) {
      return { matchingIds: [] as string[], totalValue: 0, previewImages: [] as string[] };
    }
    return previewRuleMatches(
      items.map((c) => ({
        id: c.id,
        title: c.title,
        collectibleType: c.collectibleType,
        value: c.value,
        status: c.status,
        traits: c.traits,
        image: c.image,
      })),
      managedRules,
    );
  }, [items, managedRules]);

  // Derive summary bar content from active lens
  const showSummaryBar = hasCuratedDraft || hasManagedDraft;
  const summaryCount = hasCuratedDraft ? selectedIds.size : managedPreview.matchingIds.length;
  const summaryValue = hasCuratedDraft ? curatedTotalValue : managedPreview.totalValue;

  const handleContinue = useCallback(() => {
    if (hasCuratedDraft) {
      const idsParam = Array.from(selectedIds).join(',');
      router.push(
        `/upload/showcase/review?mode=curated&ids=${encodeURIComponent(idsParam)}` as Href,
      );
    } else if (hasManagedDraft) {
      const rulesParam = btoa(JSON.stringify(managedRules));
      router.push(
        `/upload/showcase/review?mode=managed&rules=${encodeURIComponent(rulesParam)}` as Href,
      );
    }
  }, [hasCuratedDraft, hasManagedDraft, managedRules, router, selectedIds]);

  // Tracking handlers are no-ops while in selection mode — see the
  // CollectionSurface contract: when `selectedIds` is provided, the
  // surface routes taps to onToggleSelect and never invokes track
  // callbacks for grid mode (the only mode used here). The props are
  // still required for type contract.
  const noopTrack = useCallback(() => {}, []);
  const trackingIds = useMemo(() => new Set<string>(), []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      {/* Top bar — single band: the LensSelector IS the chrome, with
          the back arrow riding the left edge. Same pattern as
          showcase-detail-v3 and the profile hub. */}
      <View style={topBarS.wrap}>
        <LensSelector<ShowcaseLens>
          items={lensItems}
          activeKey={activeLensKey}
          onChange={handleLensChange}
          variant="display"
        />
        <View style={topBarS.leftSlot} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => router.back()}
            style={topBarS.iconBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pager — wires up swipe gestures between CURATED and MANAGED.
          Index changes are gated by handlePagerIndexChange so a swipe
          to a mutex-locked lens is refused and snapped back. */}
      <LensPager
        ref={pagerRef}
        index={lensIndex}
        onIndexChange={handlePagerIndexChange}
      >
        {/* CURATED ── pick collectibles by hand */}
        <View style={styles.lensBody}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          ) : (
            <CollectionSurface
              items={items}
              viewMode="grid"
              onViewModeChange={() => {
                /* pinned — view mode selector hidden in selection mode */
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
              sortKey={sortKey}
              onSortChange={setSortKey}
              crownJewelCollectibleId={null}
              trackingIds={trackingIds}
              onTrackItem={noopTrack}
              onTrackToggleItem={noopTrack}
              onOpenItem={handleToggleSelect}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              hideViewModeSelector
              searchPlaceholder="Search your collection…"
              contentPaddingTop={16}
              contentPaddingBottom={selectedIds.size > 0 ? 120 : 100}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </View>

        {/* MANAGED ── rule-based showcase builder */}
        <View style={styles.lensBody}>
          <ManagedRuleBuilder
            rules={managedRules}
            onRulesChange={setManagedRules}
            collectibles={items}
          />
        </View>
      </LensPager>

      {/* Bottom summary bar — renders for both curated (items selected)
          and managed (rules with matches) drafts. */}
      {showSummaryBar ? (
        <SafeAreaView edges={['bottom']} style={[styles.summaryBarWrap, { backgroundColor: colors.void, borderTopColor: colors.frostBorder }]}>
          <View style={styles.summaryBar}>
            <View style={styles.summaryLeft}>
              <Text style={[styles.summaryCount, { color: colors.textPrimary }]}>
                {summaryCount} {summaryCount === 1 ? 'item' : 'items'}
                {hasManagedDraft ? ' match' : ''}
              </Text>
              <View style={[styles.summaryDot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {formatPrice(summaryValue)}
              </Text>
            </View>
            <Pressable
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue to review"
              style={({ pressed }) => [
                styles.continueBtn,
                { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                pressed && { backgroundColor: colors.pressOverlay },
              ]}
            >
              <Text style={[styles.continueBtnText, { color: colors.textPrimary }]}>CONTINUE</Text>
              <ArrowRight size={14} color={colors.textPrimary} />
            </Pressable>
          </View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Pager body wrapper — gives each lens its own flex container so
  // the LensPager track measures correctly.
  lensBody: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary bar
  summaryBarWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 12,
    gap: 12,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  summaryCount: {
    fontFamily: TYPE.groteskBold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  summaryDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  summaryValue: {
    fontFamily: TYPE.mono,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  continueBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.4,
  },

});

// All top chrome lives inside one band. The display LensSelector is
// the headline; the back button rides the left edge of the same band
// — overlaying the empty space to the left of the centered display
// labels. Mirrors the showcase-detail-v3 and profile-hub pattern.
const topBarS = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  leftSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
