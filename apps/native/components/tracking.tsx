import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Search,
  Settings,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Target,
  Bell,
  Send,
  Layers,
  Activity,
  Clock,
  Eye,
  Crosshair,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SearchBar } from './search-bar';
import { OptimizedImage } from './optimized-image';
import { colors } from '@/lib/colors';
import { useAuth } from '@/lib/contexts/auth-context';
import { useCategories } from '@/lib/contexts/category-context';
import { STATUS_CONFIG, getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { formatTimeAgo } from '@/lib/format-time';
import { getTrackedItems, getTrackedCategoryCounts, untrackItem, type TrackedCollectible, type CategoryCount } from '@/lib/api/tracking';
import { logger } from '@/lib/logger';

const log = logger.create('Tracking');
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;
const PAGE_SIZE = 50;

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 10000) return `$${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

// ── Owner Badge ──

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

// ── Swipeable Row ──

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

// ── Summary Card ──

function TrackingSummaryCard({ items, onSettingsPress }: { items: TrackedCollectible[]; onSettingsPress: () => void }) {
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of items) counts[i.status] = (counts[i.status] || 0) + 1;
    return counts;
  }, [items]);
  const forSaleCount = (statusCounts['FOR_SALE'] || 0) + (statusCounts['SELL_TRADE'] || 0);

  return (
    <View style={styles.summaryCard}>
      <LinearGradient colors={[colors.primary + '12', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.summaryTop}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryLabel}>TRACKED VALUE</Text>
          <Text style={styles.summaryValue}>{formatCurrencyFull(totalValue)}</Text>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <View style={[styles.summaryStatIcon, { backgroundColor: colors.primary + '1A' }]}>
              <Target size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.summaryStatValue, { color: colors.primary }]}>{items.length}</Text>
              <Text style={styles.summaryStatLabel}>items</Text>
            </View>
          </View>
          {forSaleCount > 0 && (
            <View style={styles.summaryStat}>
              <View style={[styles.summaryStatIcon, { backgroundColor: colors.success + '1A' }]}>
                <TrendingUp size={14} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.summaryStatValue, { color: colors.success }]}>{forSaleCount}</Text>
                <Text style={styles.summaryStatLabel}>for sale</Text>
              </View>
            </View>
          )}
        </View>
      </View>
      <View style={styles.summaryBottom}>
        <View style={styles.summaryBottomLeft}>
          <Text style={styles.summaryItemCount}>{items.length} items tracked</Text>
        </View>
        <TouchableOpacity onPress={onSettingsPress} style={styles.summarySettingsButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Tracking settings">
          <Settings size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Tracked Item Row ──

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
            <View style={styles.itemActivity}>
              <Eye size={11} color={colors.mutedForeground} />
              <Text style={styles.itemActivityText}>{item.trackCount} tracking</Text>
            </View>
          )}
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemPrice}>{item.value > 0 ? formatCurrency(item.value) : ''}</Text>
          <View style={[styles.statusChip, { backgroundColor: statusConfig.textColor + '1A' }]}>
            <View style={[styles.statusChipDot, { backgroundColor: statusConfig.textColor }]} />
            <Text style={[styles.statusChipText, { color: statusConfig.textColor }]}>{statusConfig.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

// ── Group Header ──

function GroupHeader({ title, count, icon: Icon, onPress }: { title: string; count: number; icon: typeof Target; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.groupHeader} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${title}, ${count} items`}>
      <View style={styles.groupIconContainer}><Icon size={18} color={colors.primary} /></View>
      <View style={styles.groupContent}>
        <Text style={styles.groupName}>{title}</Text>
        <Text style={styles.groupCount}>{count} items</Text>
      </View>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

// ── Empty State ──

function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.emptyOnboarding}>
      <View style={styles.emptyIconRing}><Crosshair size={40} color={colors.primary} /></View>
      <Text style={styles.emptyTitle}>Start Tracking</Text>
      <Text style={styles.emptySubtitle}>Keep tabs on collectibles you love. Track items from any collector's profile to monitor them here.</Text>
      <View style={styles.emptyFeatures}>
        {[
          { icon: Target, label: 'Track items from any profile' },
          { icon: Eye, label: 'See how popular items are' },
          { icon: Bell, label: 'Alerts coming soon with Pro' },
        ].map((f, i) => (
          <View key={i} style={styles.emptyFeatureRow}><f.icon size={16} color={colors.primary} /><Text style={styles.emptyFeatureText}>{f.label}</Text></View>
        ))}
      </View>
      <TouchableOpacity onPress={onExplore} style={styles.emptyButton} activeOpacity={0.7}>
        <Search size={16} color={colors.primaryForeground} />
        <Text style={styles.emptyButtonText}>Explore Collectibles</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Status Distribution Bar ──

const STATUS_ORDER: ListingStatus[] = ['FOR_SALE', 'FOR_TRADE', 'SELL_TRADE', 'NFST'];

function StatusDistribution({ items }: { items: TrackedCollectible[] }) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) counts[item.status] = (counts[item.status] || 0) + 1;
    return STATUS_ORDER.map((status) => ({ status, count: counts[status] || 0, config: STATUS_CONFIG[status] }));
  }, [items]);

  const total = items.length;
  if (total === 0) return null;

  return (
    <View style={styles.dashSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionLabel}>STATUS BREAKDOWN</Text>
        </View>
      </View>
      <View style={styles.statusBarContainer}>
        <View style={styles.statusBar}>
          {distribution.map(({ status, count, config }) => {
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return <View key={status} style={[styles.statusBarSegment, { width: `${pct}%` as any, backgroundColor: config.textColor }]} />;
          })}
        </View>
        <View style={styles.statusLegend}>
          {distribution.map(({ status, count, config }) => {
            if (count === 0) return null;
            return (
              <View key={status} style={styles.statusLegendItem}>
                <View style={[styles.statusLegendDot, { backgroundColor: config.textColor }]} />
                <Text style={styles.statusLegendText}>{config.label}</Text>
                <Text style={styles.statusLegendCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── Recently Tracked ──

function RecentlyTracked({ items, onItemPress }: { items: TrackedCollectible[]; onItemPress: (item: TrackedCollectible) => void }) {
  const recent = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime()).slice(0, 6);
  }, [items]);

  if (recent.length === 0) return null;

  return (
    <View style={styles.dashSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Clock size={14} color={colors.mutedForeground} />
          <Text style={styles.sectionLabel}>RECENTLY TRACKED</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
        {recent.map((item) => (
          <TouchableOpacity key={item.trackId} onPress={() => onItemPress(item)} style={styles.recentCard} activeOpacity={0.8}>
            <OptimizedImage source={{ uri: item.image }} style={styles.recentImage} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.recentTime}>Tracked {formatTimeAgo(item.trackedAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Most Tracked (popular items from user's list) ──

function MostTracked({ items, onItemPress }: { items: TrackedCollectible[]; onItemPress: (item: TrackedCollectible) => void }) {
  const popular = useMemo(() => {
    return [...items].filter((i) => i.trackCount > 1).sort((a, b) => b.trackCount - a.trackCount).slice(0, 6);
  }, [items]);

  if (popular.length === 0) return null;

  return (
    <View style={styles.dashSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Activity size={14} color={colors.warning} />
          <Text style={styles.sectionLabel}>MOST POPULAR ON YOUR LIST</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moversList}>
        {popular.map((item) => (
          <TouchableOpacity key={item.trackId} onPress={() => onItemPress(item)} style={styles.moverCard} activeOpacity={0.8}>
            <View style={styles.moverImageWrap}>
              <OptimizedImage source={{ uri: item.image }} style={styles.moverImage} />
              <LinearGradient colors={['transparent', 'rgba(12,12,16,0.85)']} style={styles.moverGradient} />
              <View style={[styles.moverBadge, { backgroundColor: colors.primary + '22' }]}>
                <Eye size={10} color={colors.primary} />
                <Text style={[styles.moverBadgeText, { color: colors.primary }]}>{item.trackCount}</Text>
              </View>
            </View>
            <Text style={styles.moverTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.moverPrice}>{item.value > 0 ? formatCurrency(item.value) : ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main Tracking Component ──

interface TrackingProps { onScroll?: (event: any) => void }

export function Tracking({ onScroll }: TrackingProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getTypeByCode } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [trackedItems, setTrackedItems] = useState<TrackedCollectible[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadItems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [data, counts] = await Promise.all([
        getTrackedItems(user.id, { limit: PAGE_SIZE, offset: 0 }),
        getTrackedCategoryCounts(user.id),
      ]);
      setTrackedItems(data);
      setCategoryCounts(counts);
      setOffset(PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load tracked items:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const loadMore = useCallback(async () => {
    if (!user?.id || !hasMore || loading) return;
    try {
      const more = await getTrackedItems(user.id, { limit: PAGE_SIZE, offset });
      setTrackedItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.trackId));
        const unique = more.filter((i) => !existingIds.has(i.trackId));
        return [...prev, ...unique];
      });
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(more.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load more:', err);
    }
  }, [user?.id, hasMore, loading, offset]);

  const handleUntrack = useCallback(async (item: TrackedCollectible) => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTrackedItems((prev) => prev.filter((i) => i.trackId !== item.trackId));
    const success = await untrackItem(user.id, item.collectibleId);
    if (!success) {
      setTrackedItems((prev) => [...prev, item]);
      Alert.alert('Error', 'Failed to untrack item. Please try again.');
    }
  }, [user?.id]);

  const handleMessageOwner = useCallback((item: TrackedCollectible) => {
    router.push(`/messages/new?userId=${item.owner.id}` as any);
  }, [router]);

  const groups = useMemo(() => {
    return categoryCounts.map((cc) => {
      const td = getTypeByCode(cc.category);
      return { key: cc.category, title: td?.title || cc.category, count: cc.count, icon: td?.icon || Layers };
    });
  }, [categoryCounts, getTypeByCode]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return trackedItems.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      i.owner.displayName.toLowerCase().includes(q) ||
      i.owner.username.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }, [trackedItems, searchQuery]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: 64 + insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (trackedItems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: 64 + insets.top }]}>
        <EmptyState onExplore={() => router.push('/(tabs)/explore' as any)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingTop: 64 + insets.top }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TrackingSummaryCard items={trackedItems} onSettingsPress={() => router.push('/settings/tracking')} />

        <View style={styles.inlineSearch}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search tracked items..." showVoice={false} />
        </View>

        {searchQuery ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
              <Text style={styles.sectionCount}>{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</Text>
            </View>
            {filteredItems.length > 0 ? (
              <View>
                {filteredItems.map((item) => (
                  <TrackedItemRow
                    key={item.trackId}
                    item={item}
                    onPress={() => router.push(`/collectible/${item.collectibleId}`)}
                    onUntrack={() => handleUntrack(item)}
                    onMessage={() => handleMessageOwner(item)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptySearch}>
                <Search size={36} color={colors.mutedForeground + '60'} />
                <Text style={styles.emptySearchText}>No tracked items match "{searchQuery}"</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <MostTracked items={trackedItems} onItemPress={(item) => router.push(`/collectible/${item.collectibleId}`)} />

            <StatusDistribution items={trackedItems} />

            <RecentlyTracked items={trackedItems} onItemPress={(item) => router.push(`/collectible/${item.collectibleId}`)} />

            {/* Group by Category */}
            <View style={styles.dashSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionLabel}>BY CATEGORY</Text>
                </View>
              </View>
              <View style={styles.groupList}>
                {groups.map((group) => (
                  <GroupHeader
                    key={group.key}
                    title={group.title}
                    count={group.count}
                    icon={group.icon}
                    onPress={() => router.push(`/tracking/${encodeURIComponent(group.key)}?title=${encodeURIComponent(group.title)}` as any)}
                  />
                ))}
              </View>
            </View>

            {/* Full List */}
            <View style={styles.dashSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionLabel}>ALL TRACKED ITEMS</Text>
                </View>
                <Text style={styles.sectionCount}>{trackedItems.length}</Text>
              </View>
              {trackedItems.map((item) => (
                <TrackedItemRow
                  key={item.trackId}
                  item={item}
                  onPress={() => router.push(`/collectible/${item.collectibleId}`)}
                  onUntrack={() => handleUntrack(item)}
                  onMessage={() => handleMessageOwner(item)}
                />
              ))}
              {hasMore && (
                <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton} activeOpacity={0.7}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 80 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  dashSection: { marginBottom: 32 },

  // Summary Card
  summaryCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: 16 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryMain: { flex: 1 },
  summaryLabel: { fontSize: 10, color: colors.mutedForeground, letterSpacing: 1.5, marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: '700', color: colors.foreground },
  summaryStats: { gap: 12 },
  summaryStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryStatIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  summaryStatValue: { fontSize: 14, fontWeight: '700' },
  summaryStatLabel: { fontSize: 10, color: colors.mutedForeground },
  summaryBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  summaryBottomLeft: { flexDirection: 'row', alignItems: 'center' },
  summaryItemCount: { fontSize: 12, color: colors.mutedForeground },
  summarySettingsButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },

  inlineSearch: { paddingHorizontal: 20, marginBottom: 20 },

  // Movers / Popular carousel
  moversList: { paddingHorizontal: 20, gap: 12 },
  moverCard: { width: 130, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  moverImageWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  moverImage: { width: '100%', height: '100%' },
  moverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  moverBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  moverBadgeText: { fontSize: 10, fontWeight: '700' },
  moverTitle: { fontSize: 11, fontWeight: '600', color: colors.foreground, paddingHorizontal: 8, paddingTop: 8, lineHeight: 14 },
  moverPrice: { fontSize: 12, fontWeight: '700', color: colors.foreground, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 3 },

  // Status distribution
  statusBarContainer: { paddingHorizontal: 20 },
  statusBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.card, gap: 2 },
  statusBarSegment: { borderRadius: 4 },
  statusLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  statusLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusLegendDot: { width: 8, height: 8, borderRadius: 4 },
  statusLegendText: { fontSize: 10, color: colors.mutedForeground },
  statusLegendCount: { fontSize: 10, fontWeight: '700', color: colors.foreground },

  // Recently tracked
  recentList: { paddingHorizontal: 20, gap: 12 },
  recentCard: { width: 140, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  recentImage: { width: '100%', aspectRatio: 1.2 },
  recentInfo: { padding: 10 },
  recentTitle: { fontSize: 11, fontWeight: '600', color: colors.foreground, lineHeight: 14, marginBottom: 4 },
  recentTime: { fontSize: 9, color: colors.mutedForeground },

  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 10, color: colors.mutedForeground, letterSpacing: 1.5 },
  sectionCount: { fontSize: 12, color: colors.mutedForeground },

  // Owner Badge
  ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ownerAvatar: { width: 14, height: 14, borderRadius: 7 },
  ownerAvatarPlaceholder: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  ownerAvatarInitial: { fontSize: 8, fontWeight: '700', color: colors.mutedForeground },
  ownerName: { fontSize: 11, color: colors.mutedForeground },

  // Swipe
  swipeContainer: { position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 12, marginHorizontal: 20 },
  swipeActions: { position: 'absolute', top: 0, right: 0, bottom: 0, flexDirection: 'row', width: 160 },
  swipeAction: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  swipeActionMessage: { backgroundColor: colors.surfaceElevated },
  swipeActionUntrack: { backgroundColor: colors.destructive },
  swipeActionText: { fontSize: 10, fontWeight: '600', color: colors.foreground },
  swipeContent: { backgroundColor: colors.background },

  // Item Row
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.card + '80', borderWidth: 1, borderColor: colors.border + '80', borderRadius: 12 },
  itemImageWrap: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  itemImage: { width: '100%', height: '100%' },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 1 },
  itemActivity: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  itemActivityText: { fontSize: 11, color: colors.mutedForeground },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.foreground },

  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusChipDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusChipText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Group
  groupList: { gap: 12, paddingHorizontal: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border + '80' },
  groupIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '1A', borderWidth: 1, borderColor: colors.primary + '33', alignItems: 'center', justifyContent: 'center' },
  groupContent: { flex: 1 },
  groupName: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 2 },
  groupCount: { fontSize: 12, color: colors.mutedForeground },

  // Load more
  loadMoreButton: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Empty States
  emptyOnboarding: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '1A', borderWidth: 1, borderColor: colors.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyFeatures: { gap: 12, marginBottom: 32, alignSelf: 'stretch' },
  emptyFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyFeatureText: { fontSize: 14, color: colors.foreground },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary },
  emptyButtonText: { fontSize: 14, fontWeight: '600', color: colors.primaryForeground },
  emptySearch: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptySearchText: { fontSize: 14, color: colors.mutedForeground, marginTop: 12, textAlign: 'center' },
});
