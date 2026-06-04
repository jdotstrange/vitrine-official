import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';
import { SpatialCard } from './spatial-card';
import { ShowcaseOrb } from './showcase-orb';
import { colors } from '@/lib/colors';
import { getFeedCollectibles, type FeedCollectible } from '@/lib/api/collectibles';
import type { ListingStatus } from '@/lib/status-utils';
import { useAuth } from '@/lib/contexts/auth-context';
import { FeedSkeleton, SpatialCardSkeleton } from '@/components/skeleton';
import { logger } from '@/lib/logger';

const log = logger.create('Feed');

const MOCK_SHOWCASES = [
  {
    id: 'showcase-1',
    title: 'Grail Wall',
    curator: '@sneakerhead99',
    items: 24,
    followers: '12.4K',
    preview: [
      '/air-jordan-1-chicago-red-white-sneaker.jpg',
      '/new-balance-550.jpg',
      '/generic-basketball-shoe.png',
    ],
  },
  {
    id: 'showcase-2',
    title: 'Vintage Watches',
    curator: '@timepiececo',
    items: 18,
    followers: '8.2K',
    preview: [
      '/rolex-daytona-paul-newman-vintage-watch.jpg',
      '/vintage-omega-speedmaster-watch.jpg',
    ],
  },
];

function formatValue(value: number | null): string {
  if (!value) return '--';
  return `$${Math.round(value).toLocaleString()}`;
}

export function DiscoveryFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedCollectible[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 15;

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getFeedCollectibles({ limit: PAGE_SIZE, excludeUserId: user?.id });
      setFeedItems(items);
      setHasMore(items.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load:', err);
      setError('Could not load your feed right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const items = await getFeedCollectibles({
        limit: PAGE_SIZE,
        offset: feedItems.length,
        excludeUserId: user?.id,
      });
      setFeedItems((prev) => [...prev, ...items]);
      setHasMore(items.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, feedItems.length]);

  const showcaseInsertIndices = [3, 8];

  const buildFeed = () => {
    const result: React.ReactNode[] = [];
    let showcaseIdx = 0;

    feedItems.forEach((item, i) => {
      if (showcaseInsertIndices.includes(i) && showcaseIdx < MOCK_SHOWCASES.length) {
        const showcase = MOCK_SHOWCASES[showcaseIdx];
        result.push(
          <ShowcaseOrb
            key={`showcase-${showcase.id}`}
            id={showcase.id}
            title={showcase.title}
            curator={showcase.curator}
            items={showcase.items}
            followers={showcase.followers}
            preview={showcase.preview}
          />
        );
        showcaseIdx++;
      }

      result.push(
        <SpatialCard
          key={item.id}
          id={item.id}
          image={item.image}
          title={item.title}
          listedAt={item.createdAt}
          price={formatValue(item.value)}
          collector={item.collector.name}
          collectorAvatar={item.collector.avatar || undefined}
          status={item.status as ListingStatus}
          tracks={0}
          index={i}
          onPress={() => router.push(`/collectible/${item.id}` as Href)}
          listingType={item.status}
          badgeClass=""
        />
      );
    });

    return result;
  };

  if (isLoading) {
    return <FeedSkeleton count={3} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.feedContainer}>
        {buildFeed()}

        {isLoadingMore && <SpatialCardSkeleton />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  feedContainer: {
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingVertical: 80,
  },
});
