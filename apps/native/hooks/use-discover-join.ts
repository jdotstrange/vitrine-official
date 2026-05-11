import { useState, useCallback, useMemo } from 'react';
import type { Group } from '@/lib/api/messaging';
import type { RecommendedGroup } from '@/lib/mock-messaging';
import type { DiscoverFilterValue } from '@/components/community/discover-filter-modal';

function matchesTaxonomyFilter(
  group: { category_type?: string; category_code?: string },
  filter: DiscoverFilterValue | null
): boolean {
  if (!filter) return true;
  const type = group.category_type;
  if (type === undefined || type === null) return false;
  if (type !== filter.typeCode) return false;
  if (filter.categoryCode != null) return group.category_code === filter.categoryCode;
  return true;
}

function matchesSearch(
  group: { name: string; description?: string },
  query: string
): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    group.name.toLowerCase().includes(q) ||
    (group.description?.toLowerCase().includes(q) ?? false)
  );
}

function markJoined<T extends Group>(groups: T[], groupId: string): T[] {
  return groups.map((g) =>
    g.id === groupId ? { ...g, is_joined: true, member_count: g.member_count + 1 } : g
  );
}

interface UseDiscoverJoinOptions {
  trendingGroups: Group[];
  newestGroups: Group[];
  officialGroups: Group[];
  recommendedGroups: RecommendedGroup[];
  setTrendingGroups: (fn: (prev: Group[]) => Group[]) => void;
  setNewestGroups: (fn: (prev: Group[]) => Group[]) => void;
  setOfficialGroups: (fn: (prev: Group[]) => Group[]) => void;
  discoverSearchQuery?: string;
}

export function useDiscoverJoin({
  trendingGroups,
  newestGroups,
  officialGroups,
  recommendedGroups,
  setTrendingGroups,
  setNewestGroups,
  setOfficialGroups,
  discoverSearchQuery = '',
}: UseDiscoverJoinOptions) {
  const [activeFilter, setActiveFilterState] = useState<DiscoverFilterValue | null>(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [justJoinedGroup, setJustJoinedGroup] = useState<Group | null>(null);

  const setActiveFilter = useCallback((filter: DiscoverFilterValue | null) => {
    setActiveFilterState(filter);
  }, []);

  const clearFilter = useCallback(() => {
    setActiveFilterState(null);
  }, []);

  const handleJoinGroup = useCallback((groupId: string) => {
    const allGroups = [...trendingGroups, ...newestGroups, ...officialGroups];
    const joined = allGroups.find((g) => g.id === groupId);
    if (joined) {
      setJustJoinedGroup({ ...joined, is_joined: true, member_count: joined.member_count + 1 });
      setJoinModalVisible(true);
    }

    setTrendingGroups((prev) => markJoined(prev, groupId));
    setNewestGroups((prev) => markJoined(prev, groupId));
    setOfficialGroups((prev) => markJoined(prev, groupId));
  }, [trendingGroups, newestGroups, officialGroups, setTrendingGroups, setNewestGroups, setOfficialGroups]);

  const filterByTaxonomy = useCallback(
    (groups: Group[]) => groups.filter((g) => matchesTaxonomyFilter(g, activeFilter)),
    [activeFilter]
  );

  const filterBySearch = useCallback(
    (groups: Group[]) => groups.filter((g) => matchesSearch(g, discoverSearchQuery)),
    [discoverSearchQuery]
  );

  const filteredTrending = useMemo(
    () => filterBySearch(filterByTaxonomy(trendingGroups)),
    [trendingGroups, filterByTaxonomy, filterBySearch]
  );

  const filteredNewest = useMemo(
    () => filterBySearch(filterByTaxonomy(newestGroups)),
    [newestGroups, filterByTaxonomy, filterBySearch]
  );

  const filteredOfficial = useMemo(
    () => filterBySearch(filterByTaxonomy(officialGroups)),
    [officialGroups, filterByTaxonomy, filterBySearch]
  );

  const filteredRecommended = useMemo(
    () => filterBySearch(filterByTaxonomy(recommendedGroups)),
    [recommendedGroups, filterByTaxonomy, filterBySearch]
  );

  const allDiscoverGroups = useMemo(
    () => [...filteredTrending, ...filteredNewest, ...filteredOfficial],
    [filteredTrending, filteredNewest, filteredOfficial]
  );

  return {
    activeFilter,
    setActiveFilter,
    clearFilter,
    joinModalVisible,
    setJoinModalVisible,
    justJoinedGroup,
    handleJoinGroup,
    filteredTrending,
    filteredNewest,
    filteredOfficial,
    filteredRecommended,
    allDiscoverGroups,
  };
}
