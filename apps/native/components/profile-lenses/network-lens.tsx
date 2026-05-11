/**
 * NetworkLens — V3 NETWORK surface.
 *
 * Mounted on both owner and visitor profiles. Chip strip toggles between
 * four (visitor) or three (owner) data subsurfaces:
 *
 *   SUGGESTED · MUTUAL (visitor-only) · FOLLOWERS · FOLLOWING
 *
 * SUGGESTED is the default chip — cold-start-friendly discovery > alphabet
 * soup of empty connection lists. Suggested rows stay visible after the
 * Follow CTA flips; the list only re-shuffles when the viewer pulls to
 * refresh (which busts the per-viewer cache via p_force_recompute=true).
 *
 * MUTUAL implements IG/Twitter "Followed by" semantics — the intersection
 * of the viewer's following with the profile's followers. Self-comparisons
 * always render an empty list since owners see no MUTUAL chip.
 *
 * FOLLOWERS / FOLLOWING gate visibility behind the profile owner's
 * `follow_lists_visibility` column. Owners always bypass the gate when
 * viewing their own profile.
 *
 * Per-chip data is loaded lazily — first time a chip becomes active, we
 * fetch its data; subsequent visits show the cached list until a manual
 * pull-to-refresh.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Brackets, Chip } from '@/components/vault';
import {
  ConnectionRow,
  MutualRow,
  PrivateListState,
  SuggestedRow,
} from '@/components/network';
import {
  getSuggestedCollectors,
  getMutualFollowsV2,
  getFollowersWithPrivacy,
  getFollowingWithPrivacy,
  type SuggestedCollector,
  type FollowListResult,
} from '@/lib/api';
import {
  followUser,
  getFollowingIds,
  unfollowUser,
  type FollowUser,
} from '@/lib/api/follows';
import { useTheme, SPACING, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('NetworkLens');
const GUTTER = SPACING.zoneIntra;

export type NetworkTab = 'suggested' | 'mutual' | 'followers' | 'following';

const TAB_LABEL: Record<NetworkTab, string> = {
  suggested: 'Suggested',
  mutual: 'Mutual',
  followers: 'Followers',
  following: 'Following',
};

export interface NetworkLensProps {
  /**
   * Currently signed-in user id. Null when the viewer isn't authenticated;
   * in that case the Follow CTAs are disabled and Suggested falls back to
   * an empty state.
   */
  viewerId: string | null;
  /** The profile owner whose network is being inspected. */
  profileId: string;
  /** Viewer === profile owner. Hides MUTUAL and bypasses the privacy gate. */
  isOwner: boolean;
  /**
   * Chip to land on when the lens first mounts. Updates after mount when
   * a deep-link entry point (tappable counts on the ProfileSurface) flips
   * it. Falls back to 'suggested'.
   */
  initialTab?: NetworkTab;
  /** Bottom inset to clear chrome below the lens (e.g., bottom-tab dock). */
  bottomOffset?: number;
}

export function NetworkLens({
  viewerId,
  profileId,
  isOwner,
  initialTab,
  bottomOffset = 0,
}: NetworkLensProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const tabs = useMemo<NetworkTab[]>(
    () =>
      isOwner
        ? ['suggested', 'followers', 'following']
        : ['suggested', 'mutual', 'followers', 'following'],
    [isOwner],
  );

  const [tab, setTab] = useState<NetworkTab>(() => {
    if (initialTab && tabs.includes(initialTab)) return initialTab;
    return 'suggested';
  });

  // Snap back to a valid tab if the prop changes (deep-link from a
  // tappable count block) or if the tab list shrinks (visitor → owner).
  useEffect(() => {
    if (initialTab && tabs.includes(initialTab) && initialTab !== tab) {
      setTab(initialTab);
    }
  }, [initialTab, tabs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tabs.includes(tab)) setTab('suggested');
  }, [tabs, tab]);

  // Per-chip lazy state — each chip stays "untouched" until it first
  // becomes active, at which point it fetches its data and flips to the
  // loaded state. Subsequent visits read from the cached state until a
  // manual pull-to-refresh.
  const [suggested, setSuggested] = useState<SuggestedCollector[]>([]);
  const [suggestedLoaded, setSuggestedLoaded] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  const [mutual, setMutual] = useState<FollowUser[]>([]);
  const [mutualLoaded, setMutualLoaded] = useState(false);
  const [mutualLoading, setMutualLoading] = useState(false);

  const [followers, setFollowers] = useState<FollowListResult>({
    visibility: 'public',
    users: [],
  });
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);

  const [following, setFollowing] = useState<FollowListResult>({
    visibility: 'public',
    users: [],
  });
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Viewer's followingIds set — drives the Follow/Following CTA state on
  // every row uniformly. Re-pulled with the chip data on every refresh so
  // it stays in sync with the rest of the lens.
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followBusy, setFollowBusy] = useState<Set<string>>(new Set());

  // Track refresh-control state separately from per-chip loading so the
  // top spinner reflects pull-to-refresh, not first-mount fetches.
  const [refreshing, setRefreshing] = useState(false);

  // ────────────────────────────────────────────────────────────────────
  // Loaders
  // ────────────────────────────────────────────────────────────────────

  const loadSuggested = useCallback(
    async (forceRecompute = false) => {
      if (!viewerId) {
        setSuggestedLoaded(true);
        return;
      }
      setSuggestedLoading(true);
      try {
        const rows = await getSuggestedCollectors(viewerId, {
          limit: 20,
          forceRecompute,
        });
        setSuggested(rows);
      } catch (e) {
        log.warn('suggested load failed:', e);
      } finally {
        setSuggestedLoading(false);
        setSuggestedLoaded(true);
      }
    },
    [viewerId],
  );

  const loadMutual = useCallback(async () => {
    if (!viewerId || isOwner) {
      setMutualLoaded(true);
      return;
    }
    setMutualLoading(true);
    try {
      const rows = await getMutualFollowsV2(viewerId, profileId, 50, 0);
      setMutual(rows);
    } catch (e) {
      log.warn('mutual load failed:', e);
    } finally {
      setMutualLoading(false);
      setMutualLoaded(true);
    }
  }, [viewerId, profileId, isOwner]);

  const loadFollowers = useCallback(async () => {
    setFollowersLoading(true);
    try {
      const result = await getFollowersWithPrivacy(profileId, {
        isOwner,
        limit: 50,
      });
      setFollowers(result);
    } catch (e) {
      log.warn('followers load failed:', e);
    } finally {
      setFollowersLoading(false);
      setFollowersLoaded(true);
    }
  }, [profileId, isOwner]);

  const loadFollowing = useCallback(async () => {
    setFollowingLoading(true);
    try {
      const result = await getFollowingWithPrivacy(profileId, {
        isOwner,
        limit: 50,
      });
      setFollowing(result);
    } catch (e) {
      log.warn('following load failed:', e);
    } finally {
      setFollowingLoading(false);
      setFollowingLoaded(true);
    }
  }, [profileId, isOwner]);

  const loadFollowingIds = useCallback(async () => {
    if (!viewerId) {
      setFollowingIds(new Set());
      return;
    }
    try {
      const ids = await getFollowingIds(viewerId);
      setFollowingIds(ids);
    } catch (e) {
      log.warn('followingIds load failed:', e);
    }
  }, [viewerId]);

  // First-mount: pull the followingIds set. Per-chip fetches happen lazily.
  useEffect(() => {
    loadFollowingIds();
  }, [loadFollowingIds]);

  // Lazy per-chip activation. Each chip's first mount fetches its data;
  // subsequent activations are no-ops until pull-to-refresh.
  useEffect(() => {
    if (tab === 'suggested' && !suggestedLoaded) loadSuggested();
    if (tab === 'mutual' && !mutualLoaded) loadMutual();
    if (tab === 'followers' && !followersLoaded) loadFollowers();
    if (tab === 'following' && !followingLoaded) loadFollowing();
  }, [
    tab,
    suggestedLoaded,
    mutualLoaded,
    followersLoaded,
    followingLoaded,
    loadSuggested,
    loadMutual,
    loadFollowers,
    loadFollowing,
  ]);

  // ────────────────────────────────────────────────────────────────────
  // Pull-to-refresh
  // ────────────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadFollowingIds(),
        // Refreshing the active chip is non-negotiable. Other already-loaded
        // chips also re-pull so the lens stays consistent. Suggested gets
        // the force-recompute flag — the whole point of pull-to-refresh on
        // that surface is to bust the 36h cache.
        tab === 'suggested' || suggestedLoaded ? loadSuggested(true) : null,
        tab === 'mutual' || mutualLoaded ? loadMutual() : null,
        tab === 'followers' || followersLoaded ? loadFollowers() : null,
        tab === 'following' || followingLoaded ? loadFollowing() : null,
      ].filter(Boolean) as Promise<unknown>[]);
    } finally {
      setRefreshing(false);
    }
  }, [
    tab,
    suggestedLoaded,
    mutualLoaded,
    followersLoaded,
    followingLoaded,
    loadFollowingIds,
    loadSuggested,
    loadMutual,
    loadFollowers,
    loadFollowing,
  ]);

  // ────────────────────────────────────────────────────────────────────
  // Follow toggle (shared across all chips)
  // ────────────────────────────────────────────────────────────────────

  const markBusy = useCallback((id: string, busy: boolean) => {
    setFollowBusy((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleToggleFollow = useCallback(
    async (targetId: string) => {
      if (!viewerId || viewerId === targetId) return;
      const wasFollowing = followingIds.has(targetId);

      // Optimistic flip
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.delete(targetId);
        else next.add(targetId);
        return next;
      });
      markBusy(targetId, true);

      try {
        const ok = wasFollowing
          ? await unfollowUser(viewerId, targetId)
          : await followUser(viewerId, targetId);
        if (!ok) {
          // Rollback if the underlying call reported a no-op.
          setFollowingIds((prev) => {
            const next = new Set(prev);
            if (wasFollowing) next.add(targetId);
            else next.delete(targetId);
            return next;
          });
        }
      } catch {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (wasFollowing) next.add(targetId);
          else next.delete(targetId);
          return next;
        });
      } finally {
        markBusy(targetId, false);
      }
    },
    [viewerId, followingIds, markBusy],
  );

  const openProfile = useCallback(
    (id: string) => {
      router.push(`/profile/${id}` as Href);
    },
    [router],
  );

  // ────────────────────────────────────────────────────────────────────
  // Body renderer for the active chip
  // ────────────────────────────────────────────────────────────────────

  const body = useMemo(() => {
    switch (tab) {
      case 'suggested': {
        if (suggestedLoading && !suggestedLoaded) return <LoadingState />;
        if (suggested.length === 0) return <SuggestedEmpty viewerLoggedIn={!!viewerId} />;
        return (
          <View style={styles.list}>
            {suggested.map((row) => (
              <SuggestedRow
                key={row.id}
                id={row.id}
                displayName={row.displayName}
                username={row.username}
                avatar={row.avatar}
                collectiblesCount={row.collectiblesCount}
                reasonCode={row.reasonCode}
                reasonMeta={row.reasonMeta}
                previewItems={row.previewItems}
                isFollowing={followingIds.has(row.id)}
                followBusy={followBusy.has(row.id)}
                onPress={() => openProfile(row.id)}
                onToggleFollow={() => handleToggleFollow(row.id)}
              />
            ))}
          </View>
        );
      }
      case 'mutual': {
        if (mutualLoading && !mutualLoaded) return <LoadingState />;
        if (mutual.length === 0) return <MutualEmpty />;
        return (
          <View style={styles.list}>
            {mutual.map((u) => (
              <MutualRow
                key={u.id}
                user={u}
                isFollowing={followingIds.has(u.id)}
                followBusy={followBusy.has(u.id)}
                onPress={() => openProfile(u.id)}
                onToggleFollow={() => handleToggleFollow(u.id)}
              />
            ))}
          </View>
        );
      }
      case 'followers':
      case 'following': {
        const result = tab === 'followers' ? followers : following;
        const loading = tab === 'followers' ? followersLoading : followingLoading;
        const loaded = tab === 'followers' ? followersLoaded : followingLoaded;
        const label = tab === 'followers' ? 'FOLLOWERS' : 'FOLLOWING';

        if (loading && !loaded) return <LoadingState />;
        if (result.visibility === 'private') {
          return <PrivateListState label={label} />;
        }
        if (result.users.length === 0) {
          return <ConnectionEmpty label={label} isOwner={isOwner} />;
        }
        return (
          <View style={styles.list}>
            {result.users.map((u) => (
              <ConnectionRow
                key={u.id}
                user={u}
                isFollowing={followingIds.has(u.id)}
                isSelf={u.id === viewerId}
                followBusy={followBusy.has(u.id)}
                onPress={() => openProfile(u.id)}
                onToggleFollow={() => handleToggleFollow(u.id)}
              />
            ))}
          </View>
        );
      }
    }
  }, [
    tab,
    suggested,
    suggestedLoaded,
    suggestedLoading,
    mutual,
    mutualLoaded,
    mutualLoading,
    followers,
    followersLoaded,
    followersLoading,
    following,
    followingLoaded,
    followingLoading,
    followingIds,
    followBusy,
    viewerId,
    isOwner,
    handleToggleFollow,
    openProfile,
  ]);

  return (
    <View style={[styles.root, { backgroundColor: colors.void }]}>
      <View style={[styles.chipRail, { borderBottomColor: colors.frostDivider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRailContent}
        >
          {tabs.map((t) => (
            <Chip
              key={t}
              label={TAB_LABEL[t]}
              selected={tab === t}
              onPress={() => setTab(t)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomOffset + 32 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textSecondary}
          />
        }
      >
        {body}
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Empty / loading sub-states
// ────────────────────────────────────────────────────────────────────────

function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={loadingS.wrap}>
      <ActivityIndicator color={colors.textSecondary} />
      <Text style={[loadingS.text, { color: colors.textSecondary }]}>LOADING NETWORK…</Text>
    </View>
  );
}

function SuggestedEmpty({ viewerLoggedIn }: { viewerLoggedIn: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Text style={[emptyS.title, { color: colors.textPrimary }]}>NO SUGGESTIONS YET</Text>
        <Text style={[emptyS.subtitle, { color: colors.textSecondary }]}>
          {viewerLoggedIn
            ? 'Add a few collectibles to seed the recommendation engine. Suggested collectors will appear here within a day or two.'
            : 'Sign in to see collectors picked for you.'}
        </Text>
      </View>
    </View>
  );
}

function MutualEmpty() {
  const { colors } = useTheme();
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Text style={[emptyS.title, { color: colors.textPrimary }]}>NO MUTUALS</Text>
        <Text style={[emptyS.subtitle, { color: colors.textSecondary }]}>
          You and this collector don&apos;t share any follows yet.
        </Text>
      </View>
    </View>
  );
}

function ConnectionEmpty({ label, isOwner }: { label: string; isOwner: boolean }) {
  const { colors } = useTheme();
  const subtitle =
    label === 'FOLLOWERS'
      ? isOwner
        ? 'Once collectors start following you, they&apos;ll appear here.'
        : 'This collector hasn&apos;t picked up any followers yet.'
      : isOwner
        ? 'Find collectors to follow on the Suggested chip.'
        : 'This collector isn&apos;t following anyone yet.';
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Text style={[emptyS.title, { color: colors.textPrimary }]}>NO {label} YET</Text>
        <Text style={[emptyS.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  chipRail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipRailContent: {
    paddingHorizontal: GUTTER,
    gap: 8,
    flexGrow: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  list: {
    paddingTop: 4,
  },
});

const loadingS = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  text: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.5,
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
