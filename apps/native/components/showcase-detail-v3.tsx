import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Crown,
  MessageSquare,
  MoreHorizontal,
  QrCode,
  Share2,
  UserCheck,
  UserPlus,
} from 'lucide-react-native';
import { QRCodeModal } from '@/components/shared/qr-code-modal';
import { useAuth } from '@/lib/contexts/auth-context';
import { setFeaturedShowcase } from '@/lib/api/auth';
import {
  followUser,
  getFollowCounts,
  isFollowing as checkIsFollowing,
  unfollowUser,
} from '@/lib/api/follows';
import {
  deleteShowcase,
  getShowcaseById,
  type ShowcaseDetail,
} from '@/lib/api/showcases';
import { formatRulesSummary } from '@/lib/api/managed-rules';
import { getTrackingIds, trackItem, untrackItem } from '@/lib/api/tracking';
import { sendNotification } from '@/lib/api/notifications';
import { recordView } from '@/lib/api/views';
import { SHARE_URLS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import {
  useTheme,
  RADII,
  SPACING,
  TYPE,
} from '@/lib/design';
import {
  ActionSheet,
  AssetMatrixCard,
  Brackets,
  Button,
  DossierCard,
  HolographicFrame,
  LensPager,
  LensSelector,
  MetricCardRow,
  StatusBreakdownGrid,
  TraitMixCard,
  metricValueTextStyle,
  type LensPagerHandle,
} from '@/components/vault';
import {
  CollectionSurface,
  EMPTY_COLLECTION_FILTERS,
  deriveAssetMatrix,
  deriveStatusBreakdown,
  deriveTraitMix,
  formatPrice,
  type CollectionFilters,
  type CollectionItem,
  type CollectionSortKey,
  type CollectionViewMode,
} from '@/components/collectibles';

const log = logger.create('ShowcaseDetailV3');

const GUTTER = SPACING.zoneIntra;

// ════════════════════════════════════════════════════════════════
// LENS CONFIG
// ════════════════════════════════════════════════════════════════

type ShowcaseLensKey = 'DETAILS' | 'CONTENTS';

const SHOWCASE_LENSES = [
  { key: 'DETAILS' as const, label: 'Details' },
  { key: 'CONTENTS' as const, label: 'Contents' },
] as const;

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function buildShareUrl(showcaseId: string): string {
  return SHARE_URLS.showcase(showcaseId);
}

// ════════════════════════════════════════════════════════════════
// SHOWCASE DETAIL V3 — main entry
// ════════════════════════════════════════════════════════════════

export interface ShowcaseDetailV3Props {
  showcaseId?: string;
  currentUserId?: string;
}

export default function ShowcaseDetailV3({ showcaseId, currentUserId }: ShowcaseDetailV3Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshProfileStatus } = useAuth();
  const { colors } = useTheme();

  // ── Data ───────────────────────────────────────────────────────────
  const [showcase, setShowcase] = useState<ShowcaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Lens state ─────────────────────────────────────────────────────
  const [lensIndex, setLensIndex] = useState(0);
  const pagerRef = useRef<LensPagerHandle>(null);

  // ── Collection lens state ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState<CollectionViewMode>('spatial');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_COLLECTION_FILTERS);
  const [sortKey, setSortKey] = useState<CollectionSortKey>('recent');

  // ── Tracking ───────────────────────────────────────────────────────
  const [trackingIds, setTrackingIds] = useState<Set<string>>(new Set());

  // ── Follow state (visitor-only) ───────────────────────────────────
  const [followStatus, setFollowStatus] = useState<{ isFollowing: boolean; followers: number }>({
    isFollowing: false,
    followers: 0,
  });
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  // ── Modals / sheets ────────────────────────────────────────────────
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // ── Owner branching ────────────────────────────────────────────────
  const isOwner = !!showcase?.owner.id && showcase.owner.id === currentUserId;
  const isFeatured = !!user?.featuredShowcaseId && user.featuredShowcaseId === showcase?.id;

  // ── Data fetch ────────────────────────────────────────────────────
  const loadShowcase = useCallback(
    async (silent = false) => {
      if (!showcaseId) {
        setLoadError('Missing showcase id');
        setIsLoading(false);
        return;
      }
      if (!silent) setIsLoading(true);
      try {
        const data = await getShowcaseById(showcaseId);
        if (!data) {
          setLoadError('Showcase not found');
          setShowcase(null);
        } else {
          setShowcase(data);
          setLoadError(null);
        }
      } catch (error) {
        log.error('Failed to load showcase:', (error as Error).message);
        setLoadError('Unable to load showcase');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showcaseId],
  );

  useEffect(() => {
    loadShowcase();
  }, [loadShowcase]);

  // ── View tracking ────────────────────────────────────────────────
  // Best-effort, fire-once-per-mount. Self-views are filtered inside
  // recordView using the resolved owner id.
  useEffect(() => {
    if (!showcaseId || !showcase?.owner.id) return;
    recordView('showcase', showcaseId, showcase.owner.id);
  }, [showcaseId, showcase?.owner.id]);

  // ── Tracking IDs ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    getTrackingIds(user.id).then(setTrackingIds).catch(() => {});
  }, [user?.id]);

  // ── Visitor follow check ─────────────────────────────────────────
  useEffect(() => {
    if (!showcase || isOwner || !currentUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const [following, counts] = await Promise.all([
          checkIsFollowing(currentUserId, showcase.owner.id),
          getFollowCounts(showcase.owner.id),
        ]);
        if (!cancelled) {
          setFollowStatus({
            isFollowing: following,
            followers: counts.followersCount ?? showcase.owner.followers,
          });
        }
      } catch {
        // Soft-fail: leave defaults.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showcase, isOwner, currentUserId]);

  // ── Enriched collection items (from server-side mapper) ─────────
  // `ShowcaseDetailItem[]` is structurally identical to `CollectionItem[]`,
  // so the cast is a zero-cost type narrowing.
  const items: CollectionItem[] = useMemo(
    () => (showcase?.items ?? []) as CollectionItem[],
    [showcase],
  );
  const totalValue = showcase?.stats.totalValueNumeric ?? 0;

  // ── Derived analytical lenses ────────────────────────────────────
  const assetMatrix = useMemo(() => deriveAssetMatrix(items), [items]);
  const statusBreakdown = useMemo(() => deriveStatusBreakdown(items), [items]);
  const traitMix = useMemo(() => deriveTraitMix(items), [items]);
  const collageImages = useMemo(
    () => items.map((item) => item.image).filter(Boolean).slice(0, 3),
    [items],
  );

  // ── Refresh control ──────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadShowcase(true);
  }, [loadShowcase]);

  // ── Tracking handlers ────────────────────────────────────────────
  const handleTrackToggle = useCallback(
    async (collectibleId: string) => {
      if (!user?.id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const wasTracked = trackingIds.has(collectibleId);
      setTrackingIds((prev) => {
        const next = new Set(prev);
        if (wasTracked) next.delete(collectibleId);
        else next.add(collectibleId);
        return next;
      });
      const success = wasTracked
        ? await untrackItem(user.id, collectibleId)
        : await trackItem(user.id, collectibleId);
      if (!success) {
        setTrackingIds((prev) => {
          const next = new Set(prev);
          if (wasTracked) next.add(collectibleId);
          else next.delete(collectibleId);
          return next;
        });
      }
    },
    [user?.id, trackingIds],
  );

  const handleTrack = useCallback(
    (collectibleId: string) => {
      if (trackingIds.has(collectibleId)) return;
      handleTrackToggle(collectibleId);
    },
    [handleTrackToggle, trackingIds],
  );

  // ── Open collectible ─────────────────────────────────────────────
  const handleOpenCollectible = useCallback((collectibleId: string) => {
    router.push(`/collectible/${collectibleId}`);
  }, []);

  // ── Share ────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!showcase) return;
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out "${showcase.title}" on Vitrine`,
        url: buildShareUrl(showcase.id),
      });
      // Notify the owner that someone shared their showcase. Owner-on-
      // owner shares are suppressed (no point in self-pinging).
      if (!isOwner && user?.id && showcase.owner.id && showcase.owner.id !== user.id) {
        sendNotification({
          type: 'share_initiated',
          recipientIds: [showcase.owner.id],
          actorId: user.id,
          data: {
            objectId: showcase.id,
            objectType: 'showcase',
            showcaseId: showcase.id,
            showcaseTitle: showcase.title,
            showcaseImage: showcase.images?.[0] ?? null,
          },
        }).catch(() => {});
      }
    } catch (error) {
      log.warn('Share dismissed:', (error as Error).message);
    }
  }, [showcase, isOwner, user?.id]);

  // ── Message owner ────────────────────────────────────────────────
  const handleMessageOwner = useCallback(() => {
    if (!showcase) return;
    Haptics.selectionAsync();
    // Mirrors the convention used by tracking.tsx; the new-message screen
    // currently ignores the param (TODO: prefill recipient), but keeps the
    // navigation hook in place for when that wiring lands.
    router.push(`/messages/new?userId=${showcase.owner.id}` as never);
  }, [showcase]);

  // ── Visitor follow toggle ────────────────────────────────────────
  const handleFollowToggle = useCallback(async () => {
    if (!currentUserId || !showcase || isOwner || isFollowBusy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFollowBusy(true);
    const wasFollowing = followStatus.isFollowing;
    setFollowStatus((prev) => ({
      isFollowing: !wasFollowing,
      followers: Math.max(0, prev.followers + (wasFollowing ? -1 : 1)),
    }));
    const success = wasFollowing
      ? await unfollowUser(currentUserId, showcase.owner.id)
      : await followUser(currentUserId, showcase.owner.id);
    if (!success) {
      setFollowStatus((prev) => ({
        isFollowing: wasFollowing,
        followers: Math.max(0, prev.followers + (wasFollowing ? 1 : -1)),
      }));
    }
    setIsFollowBusy(false);
  }, [currentUserId, showcase, isOwner, isFollowBusy, followStatus.isFollowing]);

  // ── Owner: Mark featured ─────────────────────────────────────────
  const handleMarkFeatured = useCallback(async () => {
    if (!user?.id || !showcase) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const targetId = isFeatured ? null : showcase.id;
    try {
      await setFeaturedShowcase(user.id, targetId);
      await refreshProfileStatus();
    } catch (error) {
      log.error('Mark featured failed:', (error as Error).message);
      Alert.alert('Could not update featured showcase', 'Please try again.');
    }
  }, [user?.id, showcase, isFeatured, refreshProfileStatus]);

  // ── Owner: Edit ──────────────────────────────────────────────────
  const handleEditShowcase = useCallback(() => {
    if (!showcase) return;
    Haptics.selectionAsync();
    router.push(`/showcase/${showcase.id}/edit`);
  }, [showcase]);

  // ── Owner: Delete (with native Alert confirm) ────────────────────
  const handleDeleteShowcase = useCallback(() => {
    if (!showcase) return;
    Alert.alert(
      'Delete showcase?',
      `"${showcase.title}" will be removed. The collectibles inside it stay in your vault.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              if (isFeatured && user?.id) {
                // Clear the featured pointer first so the profile doesn't try
                // to render a deleted showcase between delete + refresh.
                await setFeaturedShowcase(user.id, null).catch(() => {});
                await refreshProfileStatus();
              }
              await deleteShowcase(showcase.id);
              router.back();
            } catch (error) {
              log.error('Delete failed:', (error as Error).message);
              Alert.alert('Could not delete showcase', 'Please try again.');
            }
          },
        },
      ],
    );
  }, [showcase, isFeatured, user?.id, refreshProfileStatus]);

  // ── Lens index <-> selector key bridge ───────────────────────────
  const activeLensKey = SHOWCASE_LENSES[lensIndex]?.key ?? 'DETAILS';
  const handleLensChange = useCallback((key: ShowcaseLensKey) => {
    const idx = SHOWCASE_LENSES.findIndex((lens) => lens.key === key);
    if (idx >= 0) {
      setLensIndex(idx);
      pagerRef.current?.setPage(idx);
    }
  }, []);

  // ── Loading + error states ──────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.pageLoadingState, { backgroundColor: colors.void }]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>LOADING SHOWCASE…</Text>
      </View>
    );
  }
  if (loadError || !showcase) {
    return (
      <SafeAreaView style={[styles.pageErrorState, { backgroundColor: colors.void }]} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.errorContent}>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>{loadError ?? 'Showcase unavailable'}</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>This showcase may have been removed or made private.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      {/* ── Top bar: lens selector + edge-overlaid chrome ─────────── */}
      <View style={topBarS.wrap}>
        <LensSelector
          items={SHOWCASE_LENSES}
          activeKey={activeLensKey}
          onChange={handleLensChange}
          variant="display"
        />
        {/* Back rides the left edge of the selector band. */}
        <View style={topBarS.leftSlot} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => router.back()}
            style={topBarS.iconBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {/* Owner ⋯ rides the right edge of the selector band. */}
        {isOwner ? (
          <View style={topBarS.rightSlot} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setShowOwnerMenu(true);
              }}
              style={topBarS.iconBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Showcase actions"
              hitSlop={8}
            >
              <MoreHorizontal size={22} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ── Pager ─────────────────────────────────────────────────── */}
      <LensPager ref={pagerRef} index={lensIndex} onIndexChange={setLensIndex}>
        <InfoLens
          showcase={showcase}
          items={items}
          totalValue={totalValue}
          assetMatrix={assetMatrix}
          statusBreakdown={statusBreakdown}
          traitMix={traitMix}
          collageImages={collageImages}
          isOwner={isOwner}
          isFeatured={isFeatured}
          followStatus={followStatus}
          isFollowBusy={isFollowBusy}
          onShowQR={() => setShowQR(true)}
          onShare={handleShare}
          onMessageOwner={handleMessageOwner}
          onFollowToggle={handleFollowToggle}
          onOpenOwnerProfile={() => router.push(`/profile/${showcase.owner.id}`)}
          insets={insets}
        />
        <CollectionLens
          items={items}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          sortKey={sortKey}
          onSortChange={setSortKey}
          trackingIds={trackingIds}
          onTrackItem={handleTrack}
          onTrackToggleItem={handleTrackToggle}
          onOpenItem={handleOpenCollectible}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          insets={insets}
        />
      </LensPager>

      {/* ── Owner action sheet ─────────────────────────────────────── */}
      <ActionSheet
        visible={showOwnerMenu}
        title="Showcase actions"
        options={[
          {
            label: isFeatured ? 'Unmark Featured' : 'Mark Featured',
            preferred: !isFeatured,
            onPress: handleMarkFeatured,
          },
          { label: 'Edit Showcase', onPress: handleEditShowcase },
          ...(showcase?.showcaseType === 'managed'
            ? [{ label: 'Edit Rules', onPress: () => router.push(`/upload/showcase/${showcase.id}/rules`) }]
            : []),
          { label: 'Delete Showcase', destructive: true, onPress: handleDeleteShowcase },
        ]}
        onClose={() => setShowOwnerMenu(false)}
      />

      {/* ── QR modal ───────────────────────────────────────────────── */}
      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        value={buildShareUrl(showcase.id)}
        title="Scan to Open Showcase"
        subtitle={showcase.title}
      />
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// INFO LENS — Dossier cover
// ════════════════════════════════════════════════════════════════

interface InfoLensProps {
  showcase: ShowcaseDetail;
  items: CollectionItem[];
  totalValue: number;
  assetMatrix: ReturnType<typeof deriveAssetMatrix>;
  statusBreakdown: ReturnType<typeof deriveStatusBreakdown>;
  traitMix: ReturnType<typeof deriveTraitMix>;
  collageImages: string[];
  isOwner: boolean;
  isFeatured: boolean;
  followStatus: { isFollowing: boolean; followers: number };
  isFollowBusy: boolean;
  onShowQR: () => void;
  onShare: () => void;
  onMessageOwner: () => void;
  onFollowToggle: () => void;
  onOpenOwnerProfile: () => void;
  insets: { top: number; bottom: number };
}

function InfoLens({
  showcase,
  items,
  totalValue,
  assetMatrix,
  statusBreakdown,
  traitMix,
  collageImages,
  isOwner,
  isFeatured,
  followStatus,
  onShare,
  onShowQR,
  onMessageOwner,
  onFollowToggle,
  onOpenOwnerProfile,
  insets,
}: InfoLensProps) {
  const { colors } = useTheme();
  const dossierContent = (
    <DossierCard watermark="DOSSIER" style={infoS.dossierCard}>
      {/* Title */}
      <Text style={[infoS.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {showcase.title.toUpperCase()}
      </Text>
      <View style={infoS.titleMeta}>
        <Text style={[infoS.titleMetaText, { color: colors.textSecondary }]}>
          {showcase.showcaseType === 'managed'
            ? 'MANAGED COLLECTION'
            : showcase.showcaseType === 'auto'
              ? 'AUTO COLLECTION'
              : 'CURATED COLLECTION'}
        </Text>
        {showcase.showcaseType === 'managed' ? (
          <View style={[infoS.managedBadge, { borderColor: colors.semanticBlueBorder, backgroundColor: colors.semanticBlueFill }]}>
            <Text style={[infoS.managedBadgeText, { color: colors.semanticBlue }]}>MANAGED</Text>
          </View>
        ) : null}
        {isFeatured ? (
          <View style={[infoS.featuredPill, { backgroundColor: colors.brandVoltFill, borderColor: colors.brandVoltBorder }]}>
            <Crown size={9} color={colors.brandVolt} strokeWidth={2.5} />
            <Text style={[infoS.featuredPillText, { color: colors.brandVolt }]}>FEATURED</Text>
          </View>
        ) : null}
      </View>

      {showcase.showcaseType === 'managed' && showcase.rules ? (
        <Text style={[infoS.rulesSummary, { color: colors.textSecondary }]}>
          {formatRulesSummary(showcase.rules)}
        </Text>
      ) : null}

      {/* 3-up collage */}
      <CollageStrip images={collageImages} style={infoS.collage} />

      {/* Metrics */}
      <MetricCardRow
        style={infoS.metricsRow}
        metrics={[
          {
            label: 'SHOWCASE VALUE',
            value: (
              <Text style={metricValueTextStyle}>
                <Text style={{ color: colors.textSecondary }}>$</Text>
                <Text style={{ color: colors.textPrimary }}>{formatAbbr(totalValue)}</Text>
              </Text>
            ),
          },
          {
            label: 'SHOWCASE SIZE',
            value: items.length.toLocaleString(),
          },
        ]}
      />

      {/* Owner row */}
      <Pressable style={infoS.ownerRow} onPress={onOpenOwnerProfile} accessibilityRole="link">
        <View style={[infoS.ownerAvatarFrame, { borderColor: colors.frostBorder }]}>
          {showcase.owner.avatar ? (
            <Image
              source={{ uri: showcase.owner.avatar }}
              style={infoS.ownerAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[infoS.ownerAvatar, infoS.ownerAvatarFallback, { backgroundColor: colors.sheetBg }]}>
              <Text style={[infoS.ownerInitial, { color: colors.textTertiary }]}>{showcase.owner.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={infoS.ownerNameBlock}>
          <Text style={[infoS.ownerName, { color: colors.textPrimary }]} numberOfLines={1}>
            {showcase.owner.name}
          </Text>
          <Text style={[infoS.ownerHandle, { color: colors.brandVolt }]} numberOfLines={1}>
            @{showcase.owner.username}
          </Text>
        </View>
        {!isOwner ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onFollowToggle();
            }}
            style={[
              infoS.followChip,
              followStatus.isFollowing
                ? [infoS.followChipFollowing, { borderColor: colors.brandVolt }]
                : [infoS.followChipFollow, { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }],
            ]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={followStatus.isFollowing ? 'Unfollow owner' : 'Follow owner'}
          >
            {followStatus.isFollowing ? (
              <UserCheck size={11} color={colors.brandVolt} strokeWidth={2.5} />
            ) : (
              <UserPlus size={11} color={colors.textInverse} strokeWidth={2.5} />
            )}
            <Text
              style={[
                infoS.followChipText,
                followStatus.isFollowing
                  ? [infoS.followChipTextFollowing, { color: colors.brandVolt }]
                  : [infoS.followChipTextFollow, { color: colors.textInverse }],
              ]}
            >
              {followStatus.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[infoS.ownerSelfTag, { backgroundColor: colors.frostBorder }]}>
            <Text style={[infoS.ownerSelfText, { color: colors.textTertiary }]}>YOU</Text>
          </View>
        )}
      </Pressable>

      {/* Action button pair (owner = QR/Share, visitor = Message/Share) */}
      <View style={infoS.actionRow}>
        {isOwner ? (
          <Button
            label="QR CODE"
            variant="frost"
            size="md"
            icon={QrCode}
            onPress={onShowQR}
            fullWidth
            style={infoS.actionBtn}
          />
        ) : (
          <Button
            label="MESSAGE"
            variant="frost"
            size="md"
            icon={MessageSquare}
            onPress={onMessageOwner}
            fullWidth
            style={infoS.actionBtn}
          />
        )}
        <Button
          label="SHARE"
          variant="frost"
          size="md"
          icon={Share2}
          onPress={onShare}
          fullWidth
          style={infoS.actionBtn}
        />
      </View>
    </DossierCard>
  );

  return (
    <ScrollView
      style={[infoS.scroll, { backgroundColor: colors.void }]}
      contentContainerStyle={[
        infoS.scrollContent,
        { paddingTop: 16, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {isFeatured ? (
        <HolographicFrame intensity="standard" borderRadius={RADII.card}>
          {dossierContent}
        </HolographicFrame>
      ) : (
        dossierContent
      )}

      {/* ── Collection DNA section ─────────────────────────────────── */}
      <View style={infoS.sectionWrap}>
        <View style={infoS.sectionHeader}>
          <Text style={[infoS.sectionTitle, { color: colors.textPrimary }]}>SHOWCASE DNA</Text>
          <Text style={[infoS.sectionMeta, { color: colors.textSecondary }]}>{items.length} ITEMS</Text>
        </View>

        {assetMatrix.length > 0 ? (
          <AssetMatrixCard segments={assetMatrix} />
        ) : (
          <EmptyDnaCard label="No type data yet" />
        )}

        {statusBreakdown.length > 0 ? (
          <View style={infoS.statusGridWrap}>
            <StatusBreakdownGrid entries={statusBreakdown} />
          </View>
        ) : null}

        {traitMix.length > 0 ? (
          <View style={infoS.traitMixWrap}>
            <TraitMixCard traits={traitMix} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════════
// COLLAGE STRIP
// ════════════════════════════════════════════════════════════════

function CollageStrip({ images, style }: { images: string[]; style?: object }) {
  const { colors } = useTheme();
  if (images.length === 0) {
    return (
      <View style={[collageS.empty, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }, style]}>
        <Brackets />
        <Text style={[collageS.emptyText, { color: colors.textSecondary }]}>NO ITEMS YET</Text>
      </View>
    );
  }
  const slots = [images[0] ?? null, images[1] ?? null, images[2] ?? null];
  return (
    <View style={[collageS.row, style]}>
      {slots.map((uri, i) => (
        <View key={i} style={[collageS.tile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
          {uri ? (
            <Image source={{ uri }} style={collageS.tileImage} contentFit="cover" />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function EmptyDnaCard({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[infoS.emptyDnaCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <Brackets />
      <Text style={[infoS.emptyDnaText, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// COLLECTION LENS — wraps CollectionSurface, scoped to showcase items
// ════════════════════════════════════════════════════════════════

interface CollectionLensProps {
  items: CollectionItem[];
  viewMode: CollectionViewMode;
  onViewModeChange: (mode: CollectionViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (f: CollectionFilters) => void;
  sortKey: CollectionSortKey;
  onSortChange: (k: CollectionSortKey) => void;
  trackingIds: Set<string>;
  onTrackItem: (id: string) => void;
  onTrackToggleItem: (id: string) => void;
  onOpenItem: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  insets: { top: number; bottom: number };
}

function CollectionLens({
  items,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortKey,
  onSortChange,
  trackingIds,
  onTrackItem,
  onTrackToggleItem,
  onOpenItem,
  refreshing,
  onRefresh,
  insets,
}: CollectionLensProps) {
  // The lens selector + floating nav are absolute siblings layered above the
  // pager. CollectionSurface needs to clear them at the top, and clear the
  // bottom safe area + bottom dock at the bottom.
  return (
    <CollectionSurface
      items={items}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      filters={filters}
      onFiltersChange={onFiltersChange}
      sortKey={sortKey}
      onSortChange={onSortChange}
      crownJewelCollectibleId={null}
      trackingIds={trackingIds}
      onTrackItem={onTrackItem}
      onTrackToggleItem={onTrackToggleItem}
      onOpenItem={onOpenItem}
      refreshing={refreshing}
      onRefresh={onRefresh}
      searchPlaceholder="Search showcase…"
      contentPaddingTop={12}
      contentPaddingBottom={insets.bottom + 100}
    />
  );
}

// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// HELPERS — ABBREVIATED VALUE FORMAT (mirrors profile)
// ════════════════════════════════════════════════════════════════

function formatAbbr(dollars: number): string {
  if (dollars >= 1_000_000) return `${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `${(dollars / 1_000).toFixed(1)}K`;
  if (dollars === 0) return '0';
  return dollars.toLocaleString();
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pageLoadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageErrorState: {
    flex: 1,
  },
  errorBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 8,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  errorSubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  placeholderText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
});

// All top chrome lives inside one band. The display LensSelector is the
// headline, and the back / owner-⋯ buttons ride the left/right edges of
// the same band — overlaying the empty space on each side of the
// centered display labels. Mirrors the user-profile pattern (the lens
// selector IS the top bar) while keeping the showcase-route chrome
// available.
const topBarS = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  leftSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  rightSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    paddingRight: 8,
    justifyContent: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const infoS = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GUTTER,
  },
  dossierCard: {
    paddingTop: 24,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  titleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  titleMetaText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
  },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  featuredPillText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  managedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  managedBadgeText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  rulesSummary: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  collage: {
    marginTop: 20,
  },
  metricsRow: {
    marginTop: 24,
  },
  ownerRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerAvatarFrame: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    padding: 2,
    overflow: 'hidden',
  },
  ownerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  ownerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitial: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 16,
  },
  ownerNameBlock: {
    flex: 1,
    minWidth: 0,
  },
  ownerName: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
  },
  ownerHandle: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  followChipFollow: {
  },
  followChipFollowing: {
    backgroundColor: 'transparent',
  },
  followChipText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  followChipTextFollow: {
  },
  followChipTextFollowing: {
  },
  ownerSelfTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  ownerSelfText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
  },
  sectionWrap: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
  },
  statusGridWrap: {
    marginTop: 4,
  },
  traitMixWrap: {
    marginTop: 4,
  },
  emptyDnaCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 80,
  },
  emptyDnaText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.35,
  },
});

const collageS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  empty: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});


