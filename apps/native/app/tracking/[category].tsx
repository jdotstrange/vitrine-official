import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Target,
  Send,
  Trash2,
  Eye,
  Search,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/colors';
import { SearchBar } from '@/components/search-bar';
import { OptimizedImage } from '@/components/optimized-image';
import { ActionIcon } from '@/components/ui/action-icon';
import { useAuth } from '@/lib/contexts/auth-context';
import { getTrackedItems, untrackItem, type TrackedCollectible } from '@/lib/api/tracking';
import { getStatusConfig, STATUS_CONFIG, type ListingStatus } from '@/lib/status-utils';
import { logger } from '@/lib/logger';

const log = logger.create('TrackingCategory');
const PAGE_SIZE = 30;
const SWIPE_THRESHOLD = 80;

const STATUS_FILTERS: { key: ListingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'FOR_SALE', label: 'For Sale' },
  { key: 'FOR_TRADE', label: 'For Trade' },
  { key: 'SELL_TRADE', label: 'Sell + Trade' },
  { key: 'NFST', label: 'NFST' },
];

function OwnerBadge({ owner }: { owner: TrackedCollectible['owner'] }) {
  return (
    <View style={styles.ownerBadge}>
      {owner.avatar ? (
        <OptimizedImage source={{ uri: owner.avatar }} style={styles.ownerAvatar} />
      ) : (
        <View style={styles.ownerAvatarPlaceholder}>
          <Text style={styles.ownerAvatarInitial}>{owner.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.ownerName} numberOfLines={1}>@{owner.username}</Text>
    </View>
  );
}

function SwipeableRow({ children, onUntrack, onMessage }: { children: React.ReactNode; onUntrack: () => void; onMessage: () => void }) {
  const translateX = useRef(0);
  const viewRef = useRef<View>(null);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        translateX.current = gs.dx;
        viewRef.current?.setNativeProps({ style: { transform: [{ translateX: Math.max(-160, Math.min(0, gs.dx)) }] } });
      },
      onPanResponderRelease: (_, gs) => {
        viewRef.current?.setNativeProps({
          style: { transform: [{ translateX: gs.dx < -SWIPE_THRESHOLD ? -160 : 0 }] },
        });
        translateX.current = 0;
      },
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeActions}>
        <TouchableOpacity onPress={onMessage} style={[styles.swipeAction, styles.swipeActionMessage]} activeOpacity={0.7}>
          <Send size={18} color={colors.foreground} />
          <Text style={styles.swipeActionText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onUntrack} style={[styles.swipeAction, styles.swipeActionUntrack]} activeOpacity={0.7}>
          <Trash2 size={18} color={colors.foreground} />
          <Text style={styles.swipeActionText}>Untrack</Text>
        </TouchableOpacity>
      </View>
      <View ref={viewRef} {...panResponder.panHandlers} style={styles.swipeContent}>{children}</View>
    </View>
  );
}

function TrackedItemRow({
  item,
  onPress,
  onUntrack,
  onMessage,
}: {
  item: TrackedCollectible;
  onPress: () => void;
  onUntrack: () => void;
  onMessage: () => void;
}) {
  const statusConfig = getStatusConfig(item.status);

  return (
    <SwipeableRow onUntrack={onUntrack} onMessage={onMessage}>
      <TouchableOpacity onPress={onPress} style={styles.itemRow} activeOpacity={0.7}>
        <View style={styles.itemImageWrap}>
          <OptimizedImage source={{ uri: item.image || '' }} style={styles.itemImage} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <OwnerBadge owner={item.owner} />
          {item.trackCount > 1 && (
            <View style={styles.itemMeta}>
              <Eye size={11} color={colors.mutedForeground} />
              <Text style={styles.itemMetaText}>{item.trackCount} tracking</Text>
            </View>
          )}
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemPrice}>{item.value > 0 ? `$${item.value.toLocaleString()}` : ''}</Text>
          <View style={[styles.statusChip, { backgroundColor: statusConfig.textColor + '1A' }]}>
            <View style={[styles.statusChipDot, { backgroundColor: statusConfig.textColor }]} />
            <Text style={[styles.statusChipText, { color: statusConfig.textColor }]}>{statusConfig.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

export default function TrackingCategoryScreen() {
  const { category, title } = useLocalSearchParams<{ category: string; title?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [items, setItems] = useState<TrackedCollectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ListingStatus | 'all'>('all');

  const displayTitle = title || category || 'Tracked Items';

  const loadItems = useCallback(async (reset = false) => {
    if (!user?.id || !category) return;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const currentOffset = reset ? 0 : offset;

    try {
      const data = await getTrackedItems(user.id, {
        limit: PAGE_SIZE,
        offset: currentOffset,
        category,
        search: searchQuery || undefined,
        status: activeFilter !== 'all' ? activeFilter : undefined,
      });

      if (reset) {
        setItems(data);
        setOffset(PAGE_SIZE);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.trackId));
          const unique = data.filter((i) => !existingIds.has(i.trackId));
          return [...prev, ...unique];
        });
        setOffset((prev) => prev + PAGE_SIZE);
      }
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load items:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, category, offset, searchQuery, activeFilter]);

  useEffect(() => {
    loadItems(true);
  }, [user?.id, category, searchQuery, activeFilter]);

  const handleUntrack = useCallback(async (item: TrackedCollectible) => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.trackId !== item.trackId));
    const success = await untrackItem(user.id, item.collectibleId);
    if (!success) {
      setItems((prev) => [...prev, item]);
      Alert.alert('Error', 'Failed to untrack item. Please try again.');
    }
  }, [user?.id]);

  const handleMessage = useCallback((item: TrackedCollectible) => {
    router.push(`/messages/new?userId=${item.owner.id}` as any);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TrackedCollectible }) => (
    <TrackedItemRow
      item={item}
      onPress={() => router.push(`/collectible/${item.collectibleId}`)}
      onUntrack={() => handleUntrack(item)}
      onMessage={() => handleMessage(item)}
    />
  ), [router, handleUntrack, handleMessage]);

  const ListHeader = useMemo(() => (
    <View style={styles.listHeader}>
      <View style={styles.searchRow}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${displayTitle.toLowerCase()}...`}
          showVoice={false}
        />
      </View>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const chipColor = f.key !== 'all' ? STATUS_CONFIG[f.key]?.textColor : colors.primary;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterChip,
                isActive && { backgroundColor: chipColor + '1A', borderColor: chipColor },
              ]}
              activeOpacity={0.7}
            >
              {f.key !== 'all' && (
                <View style={[styles.filterChipDot, { backgroundColor: chipColor }]} />
              )}
              <Text style={[styles.filterChipText, isActive && { color: chipColor }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.resultCount}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </Text>
    </View>
  ), [searchQuery, activeFilter, items.length, displayTitle]);

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Search size={36} color={colors.mutedForeground + '60'} />
        <Text style={styles.emptyText}>
          {searchQuery || activeFilter !== 'all'
            ? 'No items match your filters'
            : `No tracked items in ${displayTitle}`}
        </Text>
      </View>
    );
  }, [loading, searchQuery, activeFilter, displayTitle]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ActionIcon icon={ArrowLeft} onPress={() => router.back()} label="Go back" size={20} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
        </View>
        <View style={styles.headerRight}>
          <Target size={18} color={colors.primary} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.trackId}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasMore && !loadingMore) loadItems(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  headerRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 80 },

  listHeader: { paddingBottom: 12 },
  searchRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipDot: { width: 6, height: 6, borderRadius: 3 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground },
  resultCount: {
    fontSize: 11,
    color: colors.mutedForeground,
    paddingHorizontal: 20,
    paddingBottom: 12,
    letterSpacing: 0.5,
  },

  // Item Row
  swipeContainer: { position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 12, marginHorizontal: 20 },
  swipeActions: { position: 'absolute', top: 0, right: 0, bottom: 0, flexDirection: 'row', width: 160 },
  swipeAction: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  swipeActionMessage: { backgroundColor: colors.surfaceElevated },
  swipeActionUntrack: { backgroundColor: colors.destructive },
  swipeActionText: { fontSize: 10, fontWeight: '600', color: colors.foreground },
  swipeContent: { backgroundColor: colors.background },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.card + '80', borderWidth: 1, borderColor: colors.border + '80', borderRadius: 12 },
  itemImageWrap: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 1 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  itemMetaText: { fontSize: 11, color: colors.mutedForeground },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.foreground },

  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusChipDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusChipText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ownerAvatar: { width: 14, height: 14, borderRadius: 7 },
  ownerAvatarPlaceholder: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  ownerAvatarInitial: { fontSize: 8, fontWeight: '700', color: colors.mutedForeground },
  ownerName: { fontSize: 11, color: colors.mutedForeground },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.mutedForeground, marginTop: 12, textAlign: 'center' },

  footerLoading: { paddingVertical: 20, alignItems: 'center' },
});
