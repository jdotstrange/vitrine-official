/**
 * TrackingActivityLens — tracking-scoped activity surface.
 *
 * Adapted from ActivityLens (profile-lenses/activity-lens.tsx) with these
 * key differences:
 *   - Chip set: ALL | STATUS | VALUE | COMPS (tracking-action oriented)
 *   - Data source: Stream Feed notifications pre-filtered to tracking-relevant
 *     verbs only (getTrackingCategory != null). No journal — this surface
 *     shows external changes to items you track, not your own actions.
 *   - Time bucketing and row rendering mirrors the profile ActivityLens exactly.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { useFeeds, type FeedActivity, type NotificationGroup } from '@/lib/contexts/feeds-context';
import { Brackets, Chip } from '@/components/vault';
import { SignalRow, SocialRow, TimeBucketHeader } from '@/components/activity';
import {
  getTrackingCategory,
  getVerbConfig,
  type TrackingChipCategory,
  type VerbContext,
} from '@/lib/design/activity-verbs';
import { useTheme, SPACING, TYPE } from '@/lib/design';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrackingChipKey = 'ALL' | TrackingChipCategory;

const CHIPS: { key: TrackingChipKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'STATUS', label: 'Status' },
  { key: 'VALUE', label: 'Value' },
  { key: 'COMPS', label: 'Comps' },
];

type BucketKey = 'today' | 'yesterday' | 'week' | 'earlier';

const BUCKET_LABELS: Record<BucketKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  earlier: 'Earlier',
};

// ---------------------------------------------------------------------------
// Time bucket helper (mirrors profile ActivityLens)
// ---------------------------------------------------------------------------

function bucketOf(iso: string): BucketKey {
  if (!iso) return 'earlier';
  const now = new Date();
  const then = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (then >= startOfToday) return 'today';
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  if (then >= startOfYesterday) return 'yesterday';
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);
  if (then >= startOfWeek) return 'week';
  return 'earlier';
}

// ---------------------------------------------------------------------------
// Verb context normalization (mirrors profile ActivityLens ctxFromGroup)
// ---------------------------------------------------------------------------

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
    compId: latest.compId || undefined,
    compTitle: latest.compTitle || undefined,
    compImage: latest.compImage || undefined,
    compMatchPercent: latest.compMatchPercent,
    actorCount: group.actor_count,
  };
}

// ---------------------------------------------------------------------------
// Empty / loading states
// ---------------------------------------------------------------------------

function EmptyState({ chip }: { chip: TrackingChipKey }) {
  const { colors } = useTheme();
  const copy: Record<TrackingChipKey, { title: string; subtitle: string }> = {
    ALL: {
      title: 'RADAR QUIET',
      subtitle: 'Status changes, value updates, and comp matches for items you track will appear here.',
    },
    STATUS: {
      title: 'NO STATUS CHANGES',
      subtitle: 'When a tracked item changes listing status, it shows up here.',
    },
    VALUE: {
      title: 'NO VALUE UPDATES',
      subtitle: 'Value changes on tracked items surface here.',
    },
    COMPS: {
      title: 'NO COMP ALERTS',
      subtitle: 'Strong comparable-sale matches across your tracked items appear here.',
    },
  };
  const { title, subtitle } = copy[chip];
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Text style={[emptyS.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[emptyS.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={loadingS.wrap}>
      <ActivityIndicator color={colors.textSecondary} />
      <Text style={[loadingS.text, { color: colors.textTertiary }]}>LOADING ACTIVITY…</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrackingActivityLensProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  bottomPadding: number;
}

// ---------------------------------------------------------------------------
// Main lens
// ---------------------------------------------------------------------------

export function TrackingActivityLens({
  isRefreshing,
  onRefresh,
  bottomPadding,
}: TrackingActivityLensProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading: feedLoading,
    feedsReady,
    refresh,
    markAllSeen,
    markAllRead,
    markGroupRead,
  } = useFeeds();

  const [chip, setChip] = useState<TrackingChipKey>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Clear unseen badge when this lens mounts
  useEffect(() => {
    if (feedsReady) markAllSeen();
  }, [feedsReady, markAllSeen]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), onRefresh()]);
    setRefreshing(false);
  }, [refresh, onRefresh]);

  // Pre-filter to tracking-relevant verbs only
  const trackingNotifications = useMemo(
    () =>
      notifications.filter((group) => {
        const verb = group.activities?.[0]?.verb || group.verb;
        return getTrackingCategory(verb) !== null;
      }),
    [notifications],
  );

  // Apply chip filter
  const filtered = useMemo(() => {
    if (chip === 'ALL') return trackingNotifications;
    return trackingNotifications.filter((group) => {
      const verb = group.activities?.[0]?.verb || group.verb;
      return getTrackingCategory(verb) === chip;
    });
  }, [trackingNotifications, chip]);

  // Group into time buckets
  const buckets = useMemo(() => {
    const empty: Record<BucketKey, NotificationGroup[]> = {
      today: [],
      yesterday: [],
      week: [],
      earlier: [],
    };
    for (const group of filtered) {
      const time = group.updated_at || group.created_at;
      empty[bucketOf(time)].push(group);
    }
    return (Object.keys(BUCKET_LABELS) as BucketKey[])
      .map((key) => ({ key, label: BUCKET_LABELS[key], items: empty[key] }))
      .filter((b) => b.items.length > 0);
  }, [filtered]);

  const handleNotificationPress = useCallback(
    (group: NotificationGroup) => {
      const latest = (group.activities[0] || {}) as FeedActivity;
      const verb = latest.verb || group.verb;
      const config = getVerbConfig(verb);
      const ctx = ctxFromGroup(group);
      const target = config.route(ctx);
      if (!group.is_read) markGroupRead(group.id);
      if (target) router.push(target as Href);
    },
    [markGroupRead, router],
  );

  const isLoading = feedLoading;
  const GUTTER = SPACING.zoneIntra;

  return (
    <View style={[styles.root, { backgroundColor: colors.void }]}>
      <View style={[styles.chipRail, { borderBottomColor: colors.frostDivider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRailContent, { paddingHorizontal: GUTTER }]}
        >
          {CHIPS.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={chip === c.key}
              onPress={() => setChip(c.key)}
            />
          ))}
        </ScrollView>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={markAllRead}
            style={styles.markAllBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Mark all read"
          >
            <Text style={[styles.markAllText, { color: colors.brandVolt }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading && filtered.length === 0 ? (
        <LoadingState />
      ) : buckets.length === 0 ? (
        <EmptyState chip={chip} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.textSecondary}
            />
          }
        >
          {buckets.map((b) => (
            <View key={b.key}>
              <TimeBucketHeader label={b.label} />
              {b.items.map((group) => {
                const verb = group.activities?.[0]?.verb || group.verb;
                const trackingCat = getTrackingCategory(verb);
                const ctx = ctxFromGroup(group);
                const isUnread = !group.is_read;
                const time = group.updated_at || group.created_at;

                // COMPS verbs get SignalRow (system-discovered match); others SocialRow
                return trackingCat === 'COMPS' ? (
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
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  chipRail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingRight: SPACING.zoneIntra,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipRailContent: {
    gap: 8,
    flexGrow: 1,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  markAllText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
});

const emptyS = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: SPACING.zoneIntra,
    paddingTop: 48,
  },
  card: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
});

const loadingS = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
});
