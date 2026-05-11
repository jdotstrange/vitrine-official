import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import {
  CollectionSurface,
  EMPTY_COLLECTION_FILTERS,
  mapToCollectionItem,
  type CollectionFilters,
  type CollectionItem,
  type CollectionSortKey,
} from '@/components/collectibles';
import { IconButton } from '@/components/vault';
import { useStream } from '@/lib/contexts/stream-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserCollectibles } from '@/lib/api/collectibles';
import { getTrackCounts } from '@/lib/api/tracking';
import { sendNotification } from '@/lib/api/notifications';
import { useTheme, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('ShareCollectible');

const HEADLINE = 'COLLECTIBLE';

/**
 * /messages/share-collectible — full-screen collectible picker for
 * attaching a single collectible to a Stream Chat channel.
 *
 * Architecture mirrors the user-profile Collection lens: same
 * `CollectionSurface` that ships search, filters, sort, and grid
 * rendering. Differences:
 *   - View mode is pinned to `grid`. The toolbar's view-mode selector
 *     is hidden via `hideViewModeSelector` — there's no curatorial
 *     reason to flip view mode while picking.
 *   - Tapping a collectible card sends the attachment immediately
 *     (fire-and-forget) and `router.back()`s to the thread; no
 *     confirmation modal. Stream's per-message indicator handles
 *     in-flight + failure UI in the thread.
 *   - Tracking handlers are no-ops. The toolbar in grid mode doesn't
 *     surface track buttons anyway, but `CollectionSurface` requires
 *     these props to satisfy its type contract.
 *
 * Entry point: QuickAttachBar's "Share Collectible" icon (the package
 * glyph) inside `<Channel>`.
 */
export default function ShareCollectiblePage() {
  const { colors } = useTheme();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const router = useRouter();
  const { client } = useStream();
  const { user } = useAuth();

  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toolbar state — owned here so search/filter/sort persist across
  // re-renders. Recent is the only V1 sort default; matches the
  // collection-lens default elsewhere.
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_COLLECTION_FILTERS);
  const [sortKey, setSortKey] = useState<CollectionSortKey>('recent');

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
        log.error('Failed to load collectibles for picker:', err);
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

  // Fire-and-forget send. We don't await `sendMessage` because the
  // user's intent is "send and keep moving" — Stream will surface a
  // per-message error indicator in the thread if the send fails, and
  // its native retry affordance handles recovery. Awaiting would
  // either block the picker (bad) or strand the user looking at a
  // half-state spinner (worse).
  const handleSelect = useCallback(
    (collectibleId: string) => {
      if (!channelId) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const channel = client.channel('messaging', channelId);
      channel
        .sendMessage({
          text: '',
          attachments: [{ type: 'collectible', collectible_id: collectibleId }],
        })
        .then(() => {
          // Fan-out vitrine_attached_to_chat to the other channel
          // members so it lands in their Activity inbox as a "shared
          // with you" signal. Self is filtered out below.
          if (!user?.id) return;
          const item = items.find((i) => i.id === collectibleId);
          const recipientIds = Object.values(channel.state.members)
            .map((m) => m.user_id)
            .filter((uid): uid is string => !!uid && uid !== user.id);
          if (recipientIds.length === 0) return;
          sendNotification({
            type: 'vitrine_attached_to_chat',
            recipientIds,
            actorId: user.id,
            data: {
              objectId: collectibleId,
              objectType: 'collectible',
              channelId,
              collectibleId,
              collectibleTitle: item?.title ?? null,
              collectibleImage: item?.image ?? null,
            },
          }).catch(() => {});
        })
        .catch((err) => {
          log.error('Collectible attachment send failed:', err);
        });
      router.back();
    },
    [channelId, client, router, user?.id, items],
  );

  // Tracking is a no-op in picker mode. CollectionSurface's grid view
  // doesn't render the track button (that's spatial-only), so these
  // never fire — but the prop contract requires them.
  const noopTrack = useCallback(() => {}, []);
  const noopOpenItem = useCallback(
    (id: string) => handleSelect(id),
    [handleSelect],
  );

  const trackingIds = useMemo(() => new Set<string>(), []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.frostDivider }]}>
        <Text style={[styles.headline, { color: colors.textPrimary }]} accessibilityRole="header">
          {HEADLINE}
        </Text>
        <View style={styles.leftSlot} pointerEvents="box-none">
          <IconButton
            icon={ArrowLeft}
            onPress={() => router.back()}
            label="Back"
            size={22}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : (
        <CollectionSurface
          items={items}
          viewMode="grid"
          onViewModeChange={() => {
            /* pinned — view mode selector is hidden */
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          sortKey={sortKey}
          onSortChange={setSortKey}
          // Disable crown-jewel framing — picker context shouldn't
          // privilege any one item visually. Match-on-tap is the only
          // thing that matters here.
          crownJewelCollectibleId={null}
          trackingIds={trackingIds}
          onTrackItem={noopTrack}
          onTrackToggleItem={noopTrack}
          onOpenItem={noopOpenItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          hideViewModeSelector
          searchPlaceholder="Search collection…"
          contentPaddingTop={16}
        />
      )}
    </SafeAreaView>
  );
}

const TOP_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'relative',
    height: TOP_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  headline: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  leftSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 4,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
