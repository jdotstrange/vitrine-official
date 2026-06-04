/**
 * OverviewLens — the RADAR intelligence surface.
 *
 * TelemetryCard-anchored layout (distinct DNA from the Profile / Showcase
 * Detail dossier surfaces — observability/monitoring composition) surfacing:
 *   1. RADAR TelemetryCard — value/count/collector panels with sparklines
 *      + window deltas + live channel strip
 *   2. Recent Changes — up to 5 tracking-relevant notifications (last 24h)
 *   3. Recently Tracked — horizontal strip of 6 latest additions
 *   4. RADAR DNA — AssetMatrixCard + StatusBreakdownGrid + TraitMixCard
 *   5. Top Collectors — who you track from most (client-side derived)
 */

import React, { useMemo, useCallback, useRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Target, Clock } from 'lucide-react-native';

import { TrackingOverviewSkeleton } from '@/components/skeleton';
import { useFeeds, type FeedActivity, type NotificationGroup } from '@/lib/contexts/feeds-context';
import {
  TelemetryCard,
  AssetMatrixCard,
  StatusBreakdownGrid,
  TraitMixCard,
  type TelemetryPanel,
} from '@/components/vault';
import {
  deriveAssetMatrix,
  deriveStatusBreakdown,
  deriveTraitMix,
  type CollectionItem,
} from '@/components/collectibles/collection';
import { SocialRow, SignalRow } from '@/components/activity';
import {
  getVerbConfig,
  getTrackingCategory,
  type VerbContext,
} from '@/lib/design/activity-verbs';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { deriveTrackedTelemetry, type OwnerInfo } from '@/lib/api/tracking';
import type { TrackingLensKey, TrackingOverviewStats } from '../tracking-hub';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

/**
 * Hero treatment — keep full precision under $1M, abbreviate above.
 * `$153,427` reads more confidently than `$153.4K` when there's room.
 */
function formatHeroValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  return Math.round(v).toLocaleString();
}

function formatSignedValue(v: number): string {
  if (v === 0) return '0';
  const sign = v > 0 ? '+' : '-';
  return `${sign}$${formatValue(Math.abs(v))}`;
}

function formatSignedHeroValue(v: number): string {
  if (v === 0) return '0';
  const sign = v > 0 ? '+' : '-';
  return `${sign}$${formatHeroValue(Math.abs(v))}`;
}

function formatSignedCount(v: number): string {
  if (v === 0) return '0';
  const sign = v > 0 ? '+' : '-';
  return `${sign}${Math.abs(v).toLocaleString()}`;
}

function formatRelativeTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < 60_000) return 'JUST NOW';
  if (elapsed < 60 * 60_000) return `${Math.floor(elapsed / 60_000)}M AGO`;
  if (elapsed < 24 * 60 * 60_000) return `${Math.floor(elapsed / (60 * 60_000))}H AGO`;
  return `${Math.floor(elapsed / (24 * 60 * 60_000))}D AGO`;
}

function isWithin24h(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() < 24 * 60 * 60 * 1000;
}

function ctxFromGroup(group: NotificationGroup): VerbContext {
  const latest = (group.activities[0] || {}) as FeedActivity;
  return {
    actorId: latest.actor || undefined,
    actorName: latest.actorName || undefined,
    actorUsername: latest.actorUsername || undefined,
    actorAvatar: latest.actorAvatar || undefined,
    collectibleId: latest.collectibleId || undefined,
    collectibleTitle: latest.collectibleTitle || undefined,
    collectibleImage: latest.collectibleImage || undefined,
    newStatus: latest.newStatus || undefined,
    prevValue: latest.prevValue,
    newValue: latest.newValue,
    actorCount: group.actor_count,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OverviewLensProps {
  items: CollectionItem[];
  ownerMap: Map<string, OwnerInfo>;
  overviewStats: TrackingOverviewStats;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateToLens: (lens: TrackingLensKey) => void;
  onScrollDirectionChange?: (dir: 'up' | 'down' | null) => void;
  bottomPadding: number;
}

// ---------------------------------------------------------------------------
// Inline sub-components
// ---------------------------------------------------------------------------

function RecentlyTrackedCard({ item }: { item: CollectionItem }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/collectible/${item.id}` as Href)}
      style={({ pressed }) => [styles.recentCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, pressed && styles.recentCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={[styles.recentThumb, { backgroundColor: colors.pressOverlay }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.recentThumbEmpty, { backgroundColor: colors.pressOverlay }]}>
          <Text style={[styles.recentThumbEmptyText, { color: colors.textTertiary }]}>—</Text>
        </View>
      )}
      <View style={styles.recentMeta}>
        <Text style={[styles.recentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.value != null ? (
          <Text style={[styles.recentValue, { color: colors.textSecondary }]}>${formatValue(item.value)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function CollectorAvatar({
  owner,
  count,
}: {
  owner: OwnerInfo;
  count: number;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/profile/${owner.id}` as Href)}
      style={styles.collectorItem}
      accessibilityRole="button"
      accessibilityLabel={`${owner.displayName}, ${count} tracked`}
    >
      {owner.avatar ? (
        <Image source={{ uri: owner.avatar }} style={[styles.collectorAvatar, { backgroundColor: colors.sheetBg }]} resizeMode="cover" />
      ) : (
        <View style={[styles.collectorAvatarFallback, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <Text style={[styles.collectorAvatarInitial, { color: colors.textTertiary }]}>
            {owner.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={[styles.collectorName, { color: colors.textSecondary }]} numberOfLines={1}>
        {owner.username}
      </Text>
      <Text style={[styles.collectorCount, { color: colors.brandVolt }]}>{count}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main lens
// ---------------------------------------------------------------------------

export function OverviewLens({
  items,
  ownerMap,
  overviewStats,
  isLoading,
  isRefreshing,
  onRefresh,
  onNavigateToLens,
  onScrollDirectionChange,
  bottomPadding,
}: OverviewLensProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { notifications, markGroupRead } = useFeeds();
  const lastScrollY = useRef(0);

  // ── DNA derivation ────────────────────────────────────────────────────
  const assetMatrix = useMemo(() => deriveAssetMatrix(items), [items]);
  const statusBreakdown = useMemo(() => deriveStatusBreakdown(items), [items]);
  const traitMix = useMemo(() => deriveTraitMix(items), [items]);

  // ── Recently tracked — 6 most recent ─────────────────────────────────
  const recentlyTracked = useMemo(() => items.slice(0, 6), [items]);

  // ── Recent changes — tracking notifications from last 24h, max 5 ─────
  const recentChanges = useMemo(() => {
    return notifications
      .filter((group) => {
        const verb = group.activities?.[0]?.verb || group.verb;
        if (!getTrackingCategory(verb)) return false;
        const time = group.updated_at || group.created_at;
        return isWithin24h(time);
      })
      .slice(0, 5);
  }, [notifications]);

  const handleNotificationPress = useCallback(
    (group: NotificationGroup) => {
      markGroupRead(group.id);
      const latest = (group.activities[0] || {}) as FeedActivity;
      const verb = latest.verb || group.verb;
      const config = getVerbConfig(verb);
      const ctx = ctxFromGroup(group);
      const href = config.route(ctx);
      if (href) router.push(href);
    },
    [router, markGroupRead],
  );

  // ── Telemetry — sparkline series + window deltas ─────────────────────
  const telemetry = useMemo(
    () => deriveTrackedTelemetry(items, ownerMap, 14),
    [items, ownerMap],
  );

  // ── Most-recent tracked-at, used as the channel-strip "last update" ───
  const lastTrackedAt = useMemo(() => {
    if (items.length === 0) return null;
    return items[0]?.createdAt ?? null;
  }, [items]);

  const panels = useMemo<TelemetryPanel[]>(() => [
    {
      label: 'TRACKED VALUE',
      valuePrefix: '$',
      value: formatHeroValue(overviewStats.totalValue),
      delta: telemetry.valueDelta24h !== 0
        ? formatSignedHeroValue(telemetry.valueDelta24h)
        : undefined,
      deltaWindow: telemetry.valueDelta24h !== 0 ? '/24H' : undefined,
      series: telemetry.valueSeries,
      hero: true,
    },
    {
      label: 'WATCHING',
      value: overviewStats.itemCount.toLocaleString(),
      delta: telemetry.countDelta7d !== 0
        ? formatSignedCount(telemetry.countDelta7d)
        : undefined,
      deltaWindow: telemetry.countDelta7d !== 0 ? '/7D' : undefined,
      series: telemetry.countSeries,
    },
    {
      label: 'COLLECTORS',
      value: overviewStats.ownerCount.toLocaleString(),
      delta: telemetry.collectorDelta7d !== 0
        ? formatSignedCount(telemetry.collectorDelta7d)
        : undefined,
      deltaWindow: telemetry.collectorDelta7d !== 0 ? '/7D' : undefined,
      series: telemetry.collectorSeries,
    },
  ], [overviewStats, telemetry]);

  if (isLoading) {
    return <TrackingOverviewSkeleton bottomPadding={bottomPadding} />;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: SPACING.gutter, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.textSecondary}
        />
      }
      scrollEventThrottle={16}
      onScroll={(e) => {
        if (!onScrollDirectionChange) return;
        const y = e.nativeEvent.contentOffset.y;
        const prev = lastScrollY.current;
        if (y > prev + 10) onScrollDirectionChange('down');
        else if (y < prev - 10) onScrollDirectionChange('up');
        lastScrollY.current = y;
      }}
    >
      {/* ── 1. RADAR Telemetry Card ─────────────────────────────────── */}
      <View style={styles.section}>
        <TelemetryCard
          title="YOUR RADAR"
          subtitle="TRACKING INTELLIGENCE"
          watermark="RADAR"
          liveStrip={{
            isLive: true,
            items: [`${overviewStats.itemCount} ITEMS`],
            lastUpdate: formatRelativeTime(lastTrackedAt),
          }}
          panels={panels}
        />
      </View>

      {/* ── 2. Recent Changes ────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT CHANGES</Text>
          {recentChanges.length > 0 ? (
            <View style={[styles.sectionBadge, { backgroundColor: colors.brandVoltFill, borderColor: colors.brandVoltBorder }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.brandVolt }]}>{recentChanges.length}</Text>
            </View>
          ) : null}
        </View>

        {recentChanges.length === 0 ? (
          <View style={styles.emptyChanges}>
            <Clock size={18} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyChangesText, { color: colors.textTertiary }]}>
              No changes to tracked items in the last 24 hours
            </Text>
          </View>
        ) : (
          <View style={styles.changesWrap}>
            {recentChanges.map((group) => {
              const verb = group.activities?.[0]?.verb || group.verb;
              const ctx = ctxFromGroup(group);
              const isUnread = !group.is_read;
              const time = group.updated_at || group.created_at;
              const category = getTrackingCategory(verb);

              return category === 'COMPS' ? (
                <SignalRow
                  key={group.id}
                  verb={verb}
                  ctx={ctx}
                  time={time}
                  isUnread={isUnread}
                  onPress={() => handleNotificationPress(group)}
                />
              ) : (
                <SocialRow
                  key={group.id}
                  verb={verb}
                  ctx={ctx}
                  time={time}
                  isUnread={isUnread}
                  onPress={() => handleNotificationPress(group)}
                />
              );
            })}

            {recentChanges.length >= 5 ? (
              <TouchableOpacity
                style={[styles.viewAllBtn, { borderColor: colors.frostBorder }]}
                onPress={() => onNavigateToLens('ACTIVITY')}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>VIEW ALL ACTIVITY →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {/* ── 3. Recently Tracked ──────────────────────────────────────── */}
      {recentlyTracked.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENTLY TRACKED</Text>
            <TouchableOpacity onPress={() => onNavigateToLens('TRACKED')} activeOpacity={0.7}>
              <Text style={[styles.sectionAction, { color: colors.brandVolt }]}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={recentlyTracked}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RecentlyTrackedCard item={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentStrip}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          />
        </View>
      ) : null}

      {/* ── 4. RADAR DNA ─────────────────────────────────────────────── */}
      {items.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RADAR DNA</Text>
            <Text style={[styles.sectionMeta, { color: colors.textTertiary }]}>{items.length} ITEMS</Text>
          </View>

          {assetMatrix.length > 0 ? (
            <AssetMatrixCard segments={assetMatrix} />
          ) : null}

          {statusBreakdown.length > 0 ? (
            <View style={styles.dnaCard}>
              <StatusBreakdownGrid entries={statusBreakdown} />
            </View>
          ) : null}

          {traitMix.length > 0 ? (
            <View style={styles.dnaCard}>
              <TraitMixCard traits={traitMix} />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── 5. Top Collectors ────────────────────────────────────────── */}
      {overviewStats.topCollectors.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TOP COLLECTORS</Text>
            <Text style={[styles.sectionMeta, { color: colors.textTertiary }]}>{overviewStats.ownerCount} TOTAL</Text>
          </View>
          <FlatList
            horizontal
            data={overviewStats.topCollectors}
            keyExtractor={({ owner }) => owner.id}
            renderItem={({ item: { owner, count } }) => (
              <CollectorAvatar owner={owner} count={count} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectorsStrip}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          />
        </View>
      ) : null}

      {/* Empty state when no tracked items */}
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Target size={32} color={colors.textTertiary} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>YOUR RADAR IS EMPTY</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Track collectibles from other collectors to build your intelligence surface.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.gutter,
    gap: 32,
  },

  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  sectionAction: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
  },

  // Recent changes
  changesWrap: { gap: 0 },
  emptyChanges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  emptyChangesText: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  viewAllBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },

  // Recently tracked strip
  recentStrip: {
    paddingRight: SPACING.gutter,
  },
  recentCard: {
    width: 130,
    borderRadius: RADII.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentCardPressed: { opacity: 0.7 },
  recentThumb: {
    width: '100%',
    height: 100,
  },
  recentThumbEmpty: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentThumbEmptyText: {
    fontFamily: TYPE.mono,
    fontSize: 22,
  },
  recentMeta: {
    padding: 10,
    gap: 4,
  },
  recentTitle: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  recentValue: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: -0.2,
  },

  // DNA section cards
  dnaCard: { marginTop: 8 },

  // Top collectors strip
  collectorsStrip: { paddingRight: SPACING.gutter },
  collectorItem: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  collectorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  collectorAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectorAvatarInitial: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
  },
  collectorName: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  collectorCount: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: -0.2,
  },

  // Global empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    letterSpacing: 1.4,
  },
  emptySubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
});
