/**
 * ActivityLens — V3 owner-profile activity surface.
 *
 * Replaces the legacy `NotificationsLens` placeholder. Mounted as a
 * lens in the profile-as-hub pager (`collector-profile.tsx`) and as the
 * body of the standalone `/notifications` route.
 *
 * Architecture:
 *   - Sources two streams: Stream Feeds notifications (INBOX + SIGNALS)
 *     and the local journal (JOURNAL).
 *   - Merges them chronologically via `mergeActivityStreams`.
 *   - Filters by chip selection (ALL / INBOX / SIGNALS / JOURNAL).
 *   - Buckets by relative time (TODAY / YESTERDAY / THIS WEEK / EARLIER).
 *   - Renders one of three row primitives based on verb category.
 *
 * Read-state contract:
 *   - Mounting clears the unseen badge (`markAllSeen()`).
 *   - Tapping a notification row marks that group read.
 *   - The "Mark all read" button calls `markAllRead()`.
 *   - JOURNAL rows have no read-state (they're your own actions).
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

import { useAuth } from '@/lib/contexts/auth-context';
import { useFeeds, type FeedActivity, type NotificationGroup } from '@/lib/contexts/feeds-context';
import {
  getJournalEntries,
  mergeActivityStreams,
  type JournalEntry,
  type MergedActivityItem,
} from '@/lib/api/activity';
import { Brackets, Chip } from '@/components/vault';
import {
  JournalRow,
  SignalRow,
  SocialRow,
  TimeBucketHeader,
} from '@/components/activity';
import {
  getVerbCategory,
  getVerbConfig,
  type VerbContext,
} from '@/lib/design/activity-verbs';
import { useTheme, SPACING, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('ActivityLens');

const GUTTER = SPACING.zoneIntra;

type ChipKey = 'ALL' | 'INBOX' | 'SIGNALS' | 'JOURNAL';

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'INBOX', label: 'Inbox' },
  { key: 'SIGNALS', label: 'Signals' },
  { key: 'JOURNAL', label: 'Journal' },
];

// ───────────────────────────────────────────────────────────────────────
// Time-bucket helpers
// ───────────────────────────────────────────────────────────────────────

type BucketKey = 'today' | 'yesterday' | 'week' | 'earlier';

const BUCKET_LABELS: Record<BucketKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  earlier: 'Earlier',
};

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

// ───────────────────────────────────────────────────────────────────────
// Verb context normalization
// ───────────────────────────────────────────────────────────────────────

/**
 * Squash a notification group + its primary activity into the shared
 * `VerbContext` shape the row primitives expect. Group-level fields
 * (actor count, latest activity) live alongside the activity payload.
 */
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
    showcaseId: latest.showcaseId || undefined,
    showcaseTitle: latest.showcaseTitle || undefined,
    showcaseImage: latest.showcaseImage || undefined,
    channelId: latest.channelId || undefined,
    newStatus: latest.newStatus || undefined,
    prevValue: latest.prevValue,
    newValue: latest.newValue,
    changedFields: latest.changedFields,
    compId: latest.compId || undefined,
    compTitle: latest.compTitle || undefined,
    compImage: latest.compImage || undefined,
    compMatchPercent: latest.compMatchPercent,
    viewCount: latest.viewCount,
    viewWindow: latest.viewWindow || undefined,
    viewMilestone: latest.viewMilestone,
    objectType: latest.objectType,
    actorCount: group.actor_count,
  };
}

function ctxFromJournal(entry: JournalEntry): VerbContext {
  return {
    collectibleId: entry.collectibleId,
    collectibleTitle: entry.collectibleTitle,
    collectibleImage: entry.collectibleImage,
    showcaseId: entry.showcaseId,
    showcaseTitle: entry.showcaseTitle,
    prevValue: entry.prevValue,
    newValue: entry.newValue,
  };
}

// ───────────────────────────────────────────────────────────────────────
// Empty / loading
// ───────────────────────────────────────────────────────────────────────

function EmptyState({ chip }: { chip: ChipKey }) {
  const { colors } = useTheme();
  const copy: Record<ChipKey, { title: string; subtitle: string }> = {
    ALL: {
      title: 'NOTHING TO REPORT',
      subtitle: 'Activity from your network and collection will surface here.',
    },
    INBOX: {
      title: 'INBOX QUIET',
      subtitle: 'Follows, tracks, shares, and chat moments will land here.',
    },
    SIGNALS: {
      title: 'NO SIGNALS YET',
      subtitle:
        'Comp matches, view milestones, and weekly digests show up here once your collection has data to talk about.',
    },
    JOURNAL: {
      title: 'JOURNAL EMPTY',
      subtitle: 'Your own listings, showcases, and edits log here automatically.',
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
      <Text style={[loadingS.text, { color: colors.textSecondary }]}>LOADING ACTIVITY…</Text>
    </View>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Main lens
// ───────────────────────────────────────────────────────────────────────

export interface ActivityLensProps {
  /**
   * Bottom inset to clear chrome below the lens (e.g., bottom-tab dock
   * when this body lives inside the profile hub). Defaults to 0.
   */
  bottomOffset?: number;
}

export function ActivityLens({ bottomOffset = 0 }: ActivityLensProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
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

  const [chip, setChip] = useState<ChipKey>('ALL');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Clear unseen badge on mount — covers both standalone and lens
  // mounts. Idempotent if already zero.
  useEffect(() => {
    if (feedsReady) markAllSeen();
  }, [feedsReady, markAllSeen]);

  // Pull journal entries for the signed-in user. Re-runs on identity
  // change. The journal source pulls 25 from each underlying table —
  // plenty for the merged-list display window.
  const loadJournal = useCallback(async () => {
    if (!user?.id) {
      setJournal([]);
      setJournalLoading(false);
      return;
    }
    try {
      const entries = await getJournalEntries(user.id, { limit: 25 });
      setJournal(entries);
    } catch (err) {
      log.warn('journal load failed:', err);
    } finally {
      setJournalLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadJournal()]);
    setRefreshing(false);
  }, [refresh, loadJournal]);

  // Merge notifications + journal into a single chronological list.
  // The merge logic guarantees notifications win timestamp ties so
  // user-facing INBOX/SIGNALS rows can't get hidden behind own-action
  // journal rows when both occur at the same instant.
  const merged: MergedActivityItem[] = useMemo(() => {
    const notifShape = notifications.map((g) => ({
      ...g,
      created_at: g.created_at,
      updated_at: g.updated_at,
    }));
    return mergeActivityStreams(notifShape, journal);
  }, [notifications, journal]);

  // Apply chip filter. JOURNAL chip filters down to journal items only;
  // INBOX / SIGNALS filter notifications by the verb's category.
  const filtered = useMemo(() => {
    if (chip === 'ALL') return merged;
    if (chip === 'JOURNAL') return merged.filter((m) => m.kind === 'journal');
    return merged.filter((m) => {
      if (m.kind !== 'notification') return false;
      const verb = m.group.activities?.[0]?.verb || m.group.verb;
      return getVerbCategory(verb) === chip;
    });
  }, [merged, chip]);

  // Group filtered items into time buckets.
  const buckets = useMemo(() => {
    const empty: Record<BucketKey, MergedActivityItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      earlier: [],
    };
    for (const item of filtered) {
      empty[bucketOf(item.time)].push(item);
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

  const handleJournalPress = useCallback(
    (entry: JournalEntry) => {
      const config = getVerbConfig(entry.verb);
      const target = config.route(ctxFromJournal(entry));
      if (target) router.push(target as Href);
    },
    [router],
  );

  const isLoading = feedLoading || journalLoading;

  return (
    <View style={[styles.root, { backgroundColor: colors.void }]}>
      {/* Sticky chip rail — ALL / INBOX / SIGNALS / JOURNAL + Mark all
          read CTA when there's anything to clear. */}
      <View style={[styles.chipRail, { borderBottomColor: colors.frostDivider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRailContent}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomOffset + 32, flexGrow: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textSecondary}
          />
        }
      >
        {isLoading && filtered.length === 0 ? (
          <LoadingState />
        ) : buckets.length === 0 ? (
          <EmptyState chip={chip} />
        ) : (
          buckets.map((b) => (
            <View key={b.key}>
              <TimeBucketHeader label={b.label} />
              {b.items.map((item) => {
                if (item.kind === 'notification') {
                  const verb =
                    item.group.activities?.[0]?.verb || item.group.verb;
                  const category = getVerbCategory(verb);
                  const ctx = ctxFromGroup(item.group);
                  const isUnread = !item.group.is_read;
                  if (category === 'SIGNALS') {
                    return (
                      <SignalRow
                        key={item.group.id}
                        verb={verb}
                        ctx={ctx}
                        time={item.time}
                        isUnread={isUnread}
                        onPress={() => handleNotificationPress(item.group)}
                      />
                    );
                  }
                  return (
                    <SocialRow
                      key={item.group.id}
                      verb={verb}
                      ctx={ctx}
                      time={item.time}
                      isUnread={isUnread}
                      onPress={() => handleNotificationPress(item.group)}
                    />
                  );
                }
                return (
                  <JournalRow
                    key={item.entry.id}
                    verb={item.entry.verb}
                    ctx={ctxFromJournal(item.entry)}
                    time={item.time}
                    onPress={() => handleJournalPress(item.entry)}
                  />
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  chipRail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingRight: GUTTER,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipRailContent: {
    paddingHorizontal: GUTTER,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
});

const emptyS = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: GUTTER,
    paddingTop: 48,
  },
  card: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 16,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
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
    letterSpacing: 1.5,
  },
});
