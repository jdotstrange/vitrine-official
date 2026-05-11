import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Plus, AlertCircle } from 'lucide-react-native';
import { SearchBar } from './search-bar';
import { PillTabs } from './pill-tabs';
import { YourGroupsList } from './community/your-groups-list';
import { RecentDMsStrip } from './community/recent-dms-strip';
import { ActivityHeartbeat } from './community/activity-heartbeat';
import { DiscoverFilterBar } from './community/discover-filter-bar';
import { DiscoverFilterModal } from './community/discover-filter-modal';
import { HappeningNow } from './community/happening-now';
import { ForYouSection } from './community/for-you-section';
import { NewThisWeek } from './community/new-this-week';
import { OfficialGroupsSection } from './community/official-groups-section';
import { JoinSuccessModal } from './community/join-success-modal';
import { colors } from '@/lib/colors';
import { SkeletonProvider } from './skeleton';
import { CommunityHubSkeleton } from './skeletons/community-hub';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useDiscoverJoin } from '@/hooks/use-discover-join';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MessagingAPI from '@/lib/api/messaging';
import type { Conversation, Group } from '@/lib/api/messaging';
import type { RecommendedGroup, ActivityItem } from '@/lib/mock-messaging';
import { logger } from '@/lib/logger';

const log = logger.create('Community');

type Tab = 'your-groups' | 'discover';

interface CommunityHubProps {
  onScrollDirectionChange?: (direction: 'up' | 'down' | null) => void;
}

export function CommunityHub({ onScrollDirectionChange }: CommunityHubProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollDirection, handleScroll } = useScrollDirection();
  const [activeTab, setActiveTab] = useState<Tab>('your-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [debouncedDiscoverSearch, setDebouncedDiscoverSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const discoverSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [recentDMs, setRecentDMs] = useState<Conversation[]>([]);
  const [yourGroups, setYourGroups] = useState<Conversation[]>([]);
  const [trendingGroups, setTrendingGroups] = useState<Group[]>([]);
  const [newestGroups, setNewestGroups] = useState<Group[]>([]);
  const [officialGroups, setOfficialGroups] = useState<Group[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommendedGroups: RecommendedGroup[] = useMemo(
    () =>
      trendingGroups.slice(0, 4).map((g) => ({
        ...g,
        recommendation_reason: 'Popular in your categories',
      })),
    [trendingGroups]
  );

  const discover = useDiscoverJoin({
    trendingGroups,
    newestGroups,
    officialGroups,
    recommendedGroups,
    setTrendingGroups: (fn) => setTrendingGroups((prev) => fn(prev)),
    setNewestGroups: (fn) => setNewestGroups((prev) => fn(prev)),
    setOfficialGroups: (fn) => setOfficialGroups((prev) => fn(prev)),
    discoverSearchQuery: debouncedDiscoverSearch,
  });

  useEffect(() => {
    discoverSearchTimerRef.current = setTimeout(() => {
      setDebouncedDiscoverSearch(discoverSearch);
    }, 400);
    return () => {
      if (discoverSearchTimerRef.current) clearTimeout(discoverSearchTimerRef.current);
    };
  }, [discoverSearch]);

  useEffect(() => {
    if (onScrollDirectionChange) onScrollDirectionChange(scrollDirection);
  }, [scrollDirection, onScrollDirectionChange]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [dmsRes, joinedRes, trendingRes, newestRes, officialRes] = await Promise.allSettled([
        MessagingAPI.getConversations({ type: 'direct', limit: 8 }),
        MessagingAPI.getConversations({ type: 'group', limit: 50 }),
        MessagingAPI.discoverGroups({ sort: 'largest', limit: 10 }),
        MessagingAPI.discoverGroups({ sort: 'newest', limit: 10 }),
        MessagingAPI.discoverGroups({ sort: 'trending', limit: 10 }),
      ]);

      if (dmsRes.status === 'fulfilled') {
        setRecentDMs(dmsRes.value.conversations.slice(0, 8));
      } else {
        setRecentDMs([]);
      }
      if (joinedRes.status === 'fulfilled') {
        setYourGroups(joinedRes.value.conversations);
      } else {
        setYourGroups([]);
      }
      if (trendingRes.status === 'fulfilled') {
        setTrendingGroups(trendingRes.value.groups);
      } else {
        setTrendingGroups([]);
      }
      if (newestRes.status === 'fulfilled') {
        setNewestGroups(newestRes.value.groups);
      } else {
        setNewestGroups([]);
      }
      if (officialRes.status === 'fulfilled') {
        setOfficialGroups(officialRes.value.groups.filter((g) => g.is_official));
      } else {
        setOfficialGroups([]);
      }
      setActivityItems([]);

      const failed = [dmsRes, joinedRes, trendingRes, newestRes, officialRes].filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        setError('Some data could not be loaded. Pull to refresh.');
      }
    } catch (err: unknown) {
      log.error('Failed to fetch community data:', err);
      setRecentDMs([]);
      setYourGroups([]);
      setTrendingGroups([]);
      setNewestGroups([]);
      setOfficialGroups([]);
      setActivityItems([]);
      setError('Failed to load community. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return yourGroups;
    const q = searchQuery.toLowerCase();
    return yourGroups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q)
    );
  }, [yourGroups, searchQuery]);

  const totalGroupUnread = useMemo(
    () => yourGroups.filter((g) => !g.is_muted).reduce((sum, g) => sum + g.unread_count, 0),
    [yourGroups]
  );

  const handleGroupPress = (id: string) => {
    router.push(`/community/${id}` as Href);
  };

  const handleCreateGroup = () => {
    router.push('/community/create' as Href);
  };

  const tabs = [
    { id: 'your-groups', label: 'Your Groups' },
    { id: 'discover', label: 'Discover' },
  ];

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 64 }]}>
        <SkeletonProvider>
          <CommunityHubSkeleton />
        </SkeletonProvider>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
            progressViewOffset={insets.top + 64}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Community</Text>
            {totalGroupUnread > 0 && (
              <Text style={styles.unreadSubtitle}>
                {totalGroupUnread} new {totalGroupUnread === 1 ? 'post' : 'posts'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleCreateGroup}
            style={styles.createBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Create new group"
          >
            <Plus size={16} color={colors.primaryForeground} />
            <Text style={styles.createBtnText}>New Group</Text>
          </TouchableOpacity>
        </View>

        {/* Recent DMs */}
        <RecentDMsStrip conversations={recentDMs} isLoading={isLoading} />

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBg}>
            <SearchBar
              value={activeTab === 'discover' ? discoverSearch : searchQuery}
              onChange={activeTab === 'discover' ? setDiscoverSearch : setSearchQuery}
              onClear={activeTab === 'discover' ? () => setDiscoverSearch('') : () => setSearchQuery('')}
              placeholder={activeTab === 'discover' ? 'Search groups...' : 'Search your groups...'}
              showClear
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabSection}>
          <PillTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(key) => setActiveTab((key || 'your-groups') as Tab)}
          />
        </View>

        {/* Error */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => fetchData()}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Your Groups tab */}
        {activeTab === 'your-groups' && (
          <View>
            <ActivityHeartbeat items={activityItems} isLoading={isLoading} />
            <YourGroupsList
              groups={filteredGroups}
              isLoading={isLoading}
              onGroupPress={handleGroupPress}
            />
          </View>
        )}

        {/* Discover tab */}
        {activeTab === 'discover' && (
          <View>
            <DiscoverFilterBar
              activeFilter={discover.activeFilter}
              onOpenModal={() => setShowFilterModal(true)}
              onClearFilter={discover.clearFilter}
            />
            <DiscoverFilterModal
              visible={showFilterModal}
              onClose={() => setShowFilterModal(false)}
              onApplyFilter={(filter) => {
                discover.setActiveFilter(filter);
                setShowFilterModal(false);
              }}
            />
            <HappeningNow
              groups={discover.allDiscoverGroups}
              isLoading={isLoading}
              onGroupPress={handleGroupPress}
              onJoinSuccess={discover.handleJoinGroup}
            />
            <ForYouSection
              groups={discover.filteredRecommended}
              isLoading={isLoading}
              onGroupPress={handleGroupPress}
              onJoinSuccess={discover.handleJoinGroup}
            />
            <NewThisWeek
              groups={discover.filteredNewest}
              isLoading={isLoading}
              onGroupPress={handleGroupPress}
              onJoinSuccess={discover.handleJoinGroup}
            />
            <OfficialGroupsSection
              groups={discover.filteredOfficial}
              isLoading={isLoading}
              onGroupPress={handleGroupPress}
              onJoinSuccess={discover.handleJoinGroup}
            />
            <JoinSuccessModal
              visible={discover.joinModalVisible}
              group={discover.justJoinedGroup}
              onGoToGroup={(id) => {
                discover.setJoinModalVisible(false);
                handleGroupPress(id);
              }}
              onDismiss={() => discover.setJoinModalVisible(false)}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  unreadSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.attention,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBg: {
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  tabSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
});
