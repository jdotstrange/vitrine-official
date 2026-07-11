import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import {
  Activity,
  ChevronRight,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  QrCode,
  ScanLine,
  Settings,
  Share2,
  ShieldCheck,
  Target,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react-native';
import { QRCodeModal } from '@/components/shared/qr-code-modal';
import { useFeeds, type NotificationGroup } from '@/lib/contexts/feeds-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserById, type User } from '@/lib/api/auth';
import { followUser, unfollowUser, isFollowing as checkIsFollowing, getFollowCounts } from '@/lib/api/follows';
import { getUserCollectibles } from '@/lib/api/collectibles';
import { getFeaturedShowcaseDetail, getUserShowcases, type HomeShowcaseDetail, type UserShowcase } from '@/lib/api/showcases';
import { getTrackCounts, getTrackingIds, trackItem, untrackItem } from '@/lib/api/tracking';
import { sendNotification } from '@/lib/api/notifications';
import { recordView } from '@/lib/api/views';
import { blockUser } from '@/lib/api/blocked';
import { formatCount } from '@/lib/format-count';
import { SHARE_URLS } from '@vitrine/constants';
import {
  AssetMatrixCard,
  CollectibleGridCard,
  DossierCard,
  HolographicFrame,
  LensPager,
  LensSelector,
  MetricCardRow,
  metricValueTextStyle,
  StatusBreakdownGrid,
  StatusPill as VaultStatusPill,
  TraitPill as VaultTraitPill,
} from '@/components/vault';
import {
  CollectionSurface,
  EMPTY_COLLECTION_FILTERS,
  formatPrice,
  mapToCollectionItem,
  normalizeTraitKey,
  resolveCrownJewel,
  type CollectionFilters,
  type CollectionItem,
  type CollectionSortKey,
  type CollectionViewMode,
} from '@/components/collectibles';
import { ShowcaseSurface } from '@/components/showcases';
import {
  getProfileCacheEntry,
  isProfileCacheFresh,
  setProfileCacheEntry,
  subscribeProfileHub,
  type ProfileCacheEntry,
} from '@/lib/profile-hub-cache';
import { ProfileHubSkeleton } from '@/components/skeleton';
import { SafeSection } from '@/components/safe-section';
import {
  ActivityLens,
  NetworkLens,
} from '@/components/profile-lenses';
import {
  useTheme,
  RADII,
  SPACING,
  TYPE,
  type ListingStatus,
} from '@/lib/design';
import { getVerbConfig } from '@/lib/design/activity-verbs';

// ════════════════════════════════════════════════════════════════
// COLLECTOR PROFILE — orchestrator surface
// ════════════════════════════════════════════════════════════════
//
// Collection-lens types, mappers, derive helpers, and the FlatList chrome
// itself live in `@/components/collectibles` — both the profile and showcase
// detail surfaces consume them. Anything below this banner is profile-
// specific composition (Vault ID Card, Crown Jewel, Featured Showcase, the
// `User's Showcases` lens, etc.).

function formatCatalogDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

function formatAbbrValue(dollars: number): string {
  if (dollars >= 1_000_000) return `${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `${(dollars / 1_000).toFixed(1)}K`;
  if (dollars === 0) return '0';
  return dollars.toLocaleString();
}

const GUTTER = SPACING.zoneIntra;

type LensKey =
  | 'PROFILE'
  | 'COLLECTION'
  | 'SHOWCASE'
  | 'ACTIVITY'
  | 'NETWORK';
type ViewMode = CollectionViewMode;

// Lens-list shape. The actual lenses rendered depend on whether the user
// is viewing their own profile (full hub: 6 lenses) or someone else's
// (public-facing surfaces only: 3 lenses). The runtime list is built
// inside the component via `useMemo`; these arrays are kept at module
// scope so their identity is stable across renders.
type ProfileLensItem = { key: LensKey; label: string };

// Public lenses — rendered for both me-profile and other-profile views.
// NETWORK joined the public set in the V3 redesign: visitors now see a
// MUTUAL chip + privacy-gated FOLLOWERS / FOLLOWING, and Suggested
// remains a viewer-personal feed regardless of whose profile they're on.
const PUBLIC_PROFILE_LENSES: ReadonlyArray<ProfileLensItem> = [
  { key: 'PROFILE', label: 'Profile' },
  { key: 'COLLECTION', label: 'Collection' },
  { key: 'SHOWCASE', label: 'Showcase' },
  { key: 'NETWORK', label: 'Network' },
];

// Owner-only hub: ACTIVITY slots between the public-facing surfaces
// (PROFILE/COLLECTION/SHOWCASE) and the relational endpoint (NETWORK).
// Messages graduated to a dedicated tab. The order is meaningful —
// left-to-right scans from "who I am" → "what I have" → "what's
// happening" → "who I know". The children array in <LensPager> below
// MUST mirror this sequence for index-based selection to line up.
const ME_PROFILE_LENSES: ReadonlyArray<ProfileLensItem> = [
  { key: 'PROFILE', label: 'Profile' },
  { key: 'COLLECTION', label: 'Collection' },
  { key: 'SHOWCASE', label: 'Showcase' },
  { key: 'ACTIVITY', label: 'Activity' },
  { key: 'NETWORK', label: 'Network' },
];

/**
 * Auto-pick a featured showcase when the user hasn't pinned one.
 * Must return HomeShowcaseDetail — UserShowcase uses `images`/`items`, while
 * ProfileSurface reads `previewImages`/`itemCount` (REACT-NATIVE-19).
 */
function resolveFeaturedShowcase(showcases: UserShowcase[]): HomeShowcaseDetail | null {
  if (showcases.length === 0) return null;

  const picked = [...showcases].sort((a, b) => {
    const valueDelta = b.totalValue - a.totalValue;
    if (valueDelta !== 0) return valueDelta;

    const itemDelta = b.items - a.items;
    if (itemDelta !== 0) return itemDelta;

    return a.title.localeCompare(b.title);
  })[0];

  if (!picked) return null;

  return {
    id: picked.id,
    title: picked.title,
    description: null,
    itemCount: picked.items,
    previewImages: picked.images ?? [],
    primaryCategory: null,
  };
}

// ════════════════════════════════════════════════════════════════
// ACTIVITY BANNER — "new activity" indicator on the PROFILE lens
// ════════════════════════════════════════════════════════════════
//
// Conditionally renders when unseenCount > 0 and the user hasn't
// dismissed it this session. Tapping the banner jumps to the
// ACTIVITY lens; the X button dismisses it locally (the badge dot
// on the BottomDock avatar persists until ACTIVITY is visited).

function summarizeNotifications(groups: NotificationGroup[]): string {
  if (groups.length === 0) return 'You have new activity';
  const latest = groups[0];
  if (!latest) return 'You have new activity';

  const verb = latest.verb;
  const config = getVerbConfig(verb);
  const firstActivity = latest.activities[0];
  const ctx = firstActivity
    ? {
        actorName: firstActivity.actorName,
        actorCount: latest.actor_count,
        collectibleTitle: firstActivity.collectibleTitle,
        showcaseTitle: firstActivity.showcaseTitle,
        objectType: firstActivity.objectType,
        viewMilestone: firstActivity.viewMilestone,
        viewCount: firstActivity.viewCount,
        compMatchPercent: firstActivity.compMatchPercent,
      }
    : {};

  const copy = config.copy(ctx);
  const line = [copy.lead, copy.mid, copy.tail].filter(Boolean).join('');
  return line || 'You have new activity';
}

function ActivityBanner({
  onNavigateToActivity,
}: {
  onNavigateToActivity: () => void;
}) {
  const { colors } = useTheme();
  const { unseenCount, notifications } = useFeeds();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (unseenCount > 0) setDismissed(false);
  }, [unseenCount]);

  if (unseenCount <= 0 || dismissed) return null;

  const summary = summarizeNotifications(notifications);
  const countLabel = unseenCount === 1 ? '1 new' : `${unseenCount} new`;

  return (
    <Animated.View
      entering={SlideInUp.duration(280).springify()}
      exiting={SlideOutUp.duration(200)}
      style={abS.container}
    >
      <TouchableOpacity
        style={[abS.touchable, { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill }]}
        onPress={onNavigateToActivity}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${countLabel} notifications. Tap to view activity.`}
      >
        <Animated.View entering={FadeIn.delay(100)} style={[abS.dot, { backgroundColor: colors.brandVolt }]} />
        <View style={abS.textBlock}>
          <Text style={[abS.countText, { color: colors.brandVolt }]}>{countLabel.toUpperCase()}</Text>
          <Text style={[abS.summaryText, { color: colors.textSecondary }]} numberOfLines={1}>{summary}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          style={abS.dismissBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Dismiss activity banner"
        >
          <X size={14} color={colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const abS = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  countText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  summaryText: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 17,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ════════════════════════════════════════════════════════════════
// CROWN JEWEL — isolated so SafeSection can catch render throws
// ════════════════════════════════════════════════════════════════

function CrownJewelSection({
  collectionItems,
  crownJewelCollectibleId,
  trackingIds,
  username,
  onOpenCollectible,
  onTrackToggleItem,
}: {
  collectionItems: CollectionItem[];
  crownJewelCollectibleId?: string | null;
  trackingIds: Set<string>;
  username: string;
  onOpenCollectible: (id: string) => void;
  onTrackToggleItem: (id: string) => void;
}) {
  const { colors } = useTheme();
  if (collectionItems.length === 0) return null;

  const jewel = resolveCrownJewel(collectionItems, crownJewelCollectibleId);
  if (!jewel) return null;

  const isTracked = trackingIds.has(jewel.id);
  const traits = (jewel.traits ?? [])
    .map(normalizeTraitKey)
    .filter(Boolean);

  return (
    <View style={pS.sectionWrap}>
      <View style={pS.sectionHeader}>
        <View style={pS.sectionHeaderLeft}>
          <ShieldCheck size={14} color={colors.brandVolt} />
          <Text style={[pS.sectionTitle, { color: colors.textPrimary }]}>CROWN JEWEL</Text>
        </View>
      </View>
      <HolographicFrame borderRadius={16} intensity="standard">
        <TouchableOpacity
          style={[pS.crownCard, { backgroundColor: colors.sheetBg }]}
          onPress={() => onOpenCollectible(jewel.id)}
          activeOpacity={0.86}
        >
          <View style={[pS.crownMain, { borderBottomColor: colors.frostDivider }]}>
            <View style={[pS.crownImageFrame, { borderColor: colors.frostBorderStrong, backgroundColor: colors.void }]}>
              {jewel.image ? (
                <Image
                  source={{ uri: jewel.image }}
                  style={[pS.crownImage, { backgroundColor: colors.void }]}
                  contentFit="cover"
                />
              ) : (
                <View style={[pS.crownImage, { backgroundColor: colors.sheetBg }]} />
              )}
            </View>
            <View style={pS.crownInfo}>
              <View style={pS.crownMetaTop}>
                <VaultStatusPill status={jewel.status as ListingStatus} />
                <Text style={[pS.crownUsername, { color: colors.textSecondary }]} numberOfLines={1}>@{username}</Text>
              </View>
              <Text style={[pS.crownTitle, { color: colors.textPrimary }]} numberOfLines={2}>{jewel.title}</Text>
              {traits.length > 0 ? (
                <View style={pS.crownTraitRow}>
                  {traits.map((t) => (
                    <VaultTraitPill key={t} traitKey={t} />
                  ))}
                </View>
              ) : null}
              <View style={pS.crownValueRow}>
                <Text style={[pS.crownPrice, { color: colors.textPrimary }]}>{formatPrice(jewel.value)}</Text>
              </View>
            </View>
          </View>
          <View style={[pS.crownRail, { backgroundColor: colors.pressOverlay }]}>
            <View>
              <Text style={[pS.crownRailLabel, { color: colors.textTertiary }]}>CATALOGED ON</Text>
              <Text style={[pS.crownRailValue, { color: colors.textSecondary }]}>{formatCatalogDate(jewel.createdAt)}</Text>
            </View>
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                onTrackToggleItem(jewel.id);
              }}
              style={[pS.crownTracking, { borderColor: colors.frostBorder }]}
              activeOpacity={0.75}
            >
              <Target
                size={16}
                color={isTracked ? colors.traitOlive : colors.textSecondary}
                fill={isTracked ? colors.traitOlive : 'none'}
              />
              <Text style={[pS.crownTrackingText, { color: colors.textSecondary }, isTracked && { color: colors.traitOlive }]}>
                {jewel.trackingCount.toLocaleString()} TRACKING
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </HolographicFrame>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// PROFILE SURFACE
// ════════════════════════════════════════════════════════════════

function ProfileSurface({
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  avatarUrl,
  displayName,
  username,
  followersCount,
  followingCount,
  shareUrl,
  collectionValue,
  collectionSize,
  featuredShowcase,
  assetMatrix,
  statusBreakdown,
  collectionItems,
  trackingIds,
  onTrackToggleItem,
  crownJewelCollectibleId,
  onEditProfile,
  onOpenSettings,
  onShare,
  onBlockUser,
  onOpenCollectible,
  onOpenShowcase,
  onOpenNetworkTab,
  onNavigateToActivity,
  refreshing,
  onRefresh,
}: {
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  avatarUrl: string | null;
  displayName: string;
  username: string;
  followersCount: number;
  followingCount: number;
  shareUrl: string;
  collectionValue: number;
  collectionSize: number;
  featuredShowcase: HomeShowcaseDetail | null;
  assetMatrix: { label: string; count: number; pct: number }[];
  statusBreakdown: { key: string; count: number; pct: number }[];
  collectionItems: CollectionItem[];
  trackingIds: Set<string>;
  onTrackToggleItem: (id: string) => void;
  crownJewelCollectibleId?: string | null;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
  onBlockUser?: () => void;
  onOpenCollectible: (id: string) => void;
  onOpenShowcase: (id: string) => void;
  onOpenNetworkTab: (tab: 'followers' | 'following') => void;
  onNavigateToActivity?: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { colors } = useTheme();
  const [qrVisible, setQrVisible] = useState(false);

  return (
    <>
    <ScrollView
      style={[pS.scroll, { backgroundColor: colors.void }]}
      contentContainerStyle={pS.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.textPrimary}
        />
      }
    >
      {/* ── Vault ID Card ─────────────────────────── */}
      <DossierCard watermark="GRAIL">
        <View style={pS.idCardTop}>
          <View style={[pS.avatarBorder, { borderColor: colors.frostBorder }]}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={pS.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[pS.avatar, { backgroundColor: colors.sheetBg, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontFamily: TYPE.heroDisplay, fontSize: 28, color: colors.textTertiary }}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={pS.nameBlock}>
            <Text style={[pS.name, { color: colors.textPrimary }]}>{displayName.toUpperCase()}</Text>
            <Text style={[pS.handle, { color: colors.brandVolt }]}>@{username.toUpperCase()}</Text>
          </View>
          {isOwnProfile ? (
            <TouchableOpacity style={pS.topRightBtn} onPress={onOpenSettings} activeOpacity={0.7}>
              <Settings size={24} color={colors.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          ) : (
            <View style={pS.visitorActions}>
              <TouchableOpacity style={pS.actionIconBtn} onPress={() => setQrVisible(true)} activeOpacity={0.7}>
                <QrCode size={22} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={pS.actionIconBtn}
                onPress={onBlockUser}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="More options"
              >
                <MoreHorizontal size={22} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />

        <View style={pS.followRow}>
          <TouchableOpacity
            style={pS.followBlock}
            onPress={() => onOpenNetworkTab('followers')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View ${followersCount} followers`}
          >
            <Text style={[pS.followValue, { color: colors.textPrimary }]}>{formatCount(followersCount)}</Text>
            <Text style={[pS.followLabel, { color: colors.textSecondary }]}>FOLLOWERS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={pS.followBlock}
            onPress={() => onOpenNetworkTab('following')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View ${followingCount} following`}
          >
            <Text style={[pS.followValue, { color: colors.textPrimary }]}>{formatCount(followingCount)}</Text>
            <Text style={[pS.followLabel, { color: colors.textSecondary }]}>FOLLOWING</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            pS.followBtn,
            isOwnProfile
              ? [pS.editProfileBtn, { borderColor: colors.frostBorder }]
              : isFollowing
                ? [pS.followBtnFollowing, { borderColor: colors.brandVolt }]
                : [pS.followBtnFollow, { backgroundColor: colors.brandVolt }],
          ]}
          onPress={isOwnProfile ? onEditProfile : onFollowToggle}
          activeOpacity={0.8}
        >
          {isOwnProfile ? (
            <Pencil size={14} color={colors.textSecondary} />
          ) : isFollowing ? (
            <UserCheck size={14} color={colors.brandVolt} />
          ) : (
            <UserPlus size={14} color={colors.textInverse} />
          )}
          <Text
            style={[
              pS.followBtnText,
              isOwnProfile
                ? [pS.editProfileBtnText, { color: colors.textSecondary }]
                : isFollowing
                  ? [pS.followBtnTextFollowing, { color: colors.brandVolt }]
                  : [pS.followBtnTextFollow, { color: colors.textInverse }],
            ]}
          >
            {isOwnProfile ? 'EDIT PROFILE' : isFollowing ? 'FOLLOWING' : 'FOLLOW'}
          </Text>
        </TouchableOpacity>
      </DossierCard>

      {/* ── Action Buttons ────────────────────────── */}
      <View style={pS.actionRow}>
        <TouchableOpacity
          style={[pS.actionBtn, pS.actionBtnOutline, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorderStrong }]}
          onPress={isOwnProfile ? () => setQrVisible(true) : undefined}
          activeOpacity={0.8}
        >
          {isOwnProfile ? (
            <QrCode size={14} color={colors.textPrimary} strokeWidth={1.8} />
          ) : (
            <MessageSquare size={14} color={colors.textPrimary} />
          )}
          <Text style={[pS.actionBtnText, pS.actionTextFollowing, { color: colors.textPrimary }]}>
            {isOwnProfile ? 'QR CODE' : 'MESSAGE'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[pS.actionBtn, pS.actionBtnOutline, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorderStrong }]} onPress={onShare} activeOpacity={0.8}>
          <Share2 size={14} color={colors.textPrimary} />
          <Text style={[pS.actionBtnText, pS.actionTextFollowing, { color: colors.textPrimary }]}>SHARE</Text>
        </TouchableOpacity>
      </View>

      {/* ── Activity Banner (owner-only) ────────────── */}
      {isOwnProfile && onNavigateToActivity && (
        <View style={{ marginTop: 20 }}>
          <ActivityBanner onNavigateToActivity={onNavigateToActivity} />
        </View>
      )}

      {/* ── Key Metrics ───────────────────────────── */}
      <MetricCardRow
        style={{ marginTop: 32 }}
        metrics={[
          {
            label: 'TOTAL VALUE',
            value: (
              <Text style={metricValueTextStyle}>
                <Text style={{ color: colors.textSecondary }}>$</Text>
                <Text style={{ color: colors.textPrimary }}>{formatAbbrValue(collectionValue)}</Text>
              </Text>
            ),
          },
          {
            label: 'COLLECTION SIZE',
            value: collectionSize.toLocaleString(),
          },
        ]}
      />

      {/* ── Crown Jewel ───────────────────────────── */}
      {/* Must be a real child component (not an IIFE-as-children). IIFEs throw
          during ProfileSurface render *before* SafeSection can catch them —
          that was blanking cold opens to the root ErrorBoundary (Sentry REACT-NATIVE-Z). */}
      <SafeSection name="CrownJewel" resetKey={`${crownJewelCollectibleId ?? 'none'}:${collectionItems.length}`}>
        <CrownJewelSection
          collectionItems={collectionItems}
          crownJewelCollectibleId={crownJewelCollectibleId}
          trackingIds={trackingIds}
          username={username}
          onOpenCollectible={onOpenCollectible}
          onTrackToggleItem={onTrackToggleItem}
        />
      </SafeSection>

      {/* ── Featured Showcase ─────────────────────── */}
      <SafeSection name="FeaturedShowcase" resetKey={featuredShowcase?.id ?? 'none'}>
      {featuredShowcase && (
        <View style={pS.sectionWrap}>
          <View style={pS.sectionHeader}>
            <View style={pS.sectionHeaderLeft}>
              <ScanLine size={14} color={colors.brandVolt} />
              <Text style={[pS.sectionTitle, { color: colors.textPrimary }]}>FEATURED SHOWCASE</Text>
            </View>
            <TouchableOpacity
              style={pS.sectionHeaderRight}
              onPress={() => onOpenShowcase(featuredShowcase.id)}
              activeOpacity={0.75}
            >
              <Text style={[pS.sectionLink, { color: colors.textSecondary }]}>VIEW ALL</Text>
              <ChevronRight size={10} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <HolographicFrame borderRadius={16} intensity="subtle">
            <TouchableOpacity
              style={[pS.featuredCard, { backgroundColor: colors.sheetBg }]}
              onPress={() => onOpenShowcase(featuredShowcase.id)}
              activeOpacity={0.86}
            >
              <View style={pS.featuredTileRow}>
                {[
                  (featuredShowcase.previewImages ?? [])[0] ?? null,
                  (featuredShowcase.previewImages ?? [])[1] ?? null,
                  (featuredShowcase.previewImages ?? [])[2] ?? null,
                ].map((uri, i) => (
                  <View key={i} style={[pS.featuredTile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
                    {uri ? (
                      <Image source={{ uri }} style={pS.featuredTileImage} contentFit="cover" />
                    ) : null}
                  </View>
                ))}
              </View>
              <View style={pS.featuredBottom}>
                <View>
                  <Text style={[pS.featuredTitle, { color: colors.textPrimary }]} numberOfLines={1}>{featuredShowcase.title}</Text>
                  <Text style={[pS.featuredItems, { color: colors.textSecondary }]}>{featuredShowcase.itemCount} items</Text>
                </View>
              </View>
            </TouchableOpacity>
          </HolographicFrame>
        </View>
      )}
      </SafeSection>

      {/* ── Collection DNA ────────────────────────── */}
      <View style={pS.sectionWrap}>
        <View style={pS.sectionHeader}>
          <View style={pS.sectionHeaderLeft}>
            <Activity size={14} color={colors.brandVolt} />
            <Text style={[pS.sectionTitle, { color: colors.textPrimary }]}>COLLECTION DNA</Text>
          </View>
        </View>

        {/* Asset Matrix */}
        <AssetMatrixCard segments={assetMatrix} />

        {/* Status Grid */}
        <StatusBreakdownGrid entries={statusBreakdown} />
      </View>

      {/* ── Footer Settings (owner-only) ────────────── */}
      {isOwnProfile && (
        <TouchableOpacity
          style={[pS.footerSettingsBtn, { borderColor: colors.frostDivider, backgroundColor: colors.sheetBg }]}
          onPress={onOpenSettings}
          activeOpacity={0.8}
        >
          <Settings size={14} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[pS.footerSettingsText, { color: colors.textSecondary }]}>SETTINGS</Text>
        </TouchableOpacity>
      )}

    </ScrollView>

    <QRCodeModal
      visible={qrVisible}
      onClose={() => setQrVisible(false)}
      value={shareUrl}
      title="Scan to View Profile"
      subtitle={displayName}
    />
    </>
  );
}

const pS = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: 24, paddingBottom: 100 },

  // ID Card interior (chrome lifted to <DossierCard>)
  idCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  nameBlock: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  name: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 24,
    textTransform: 'uppercase',
    letterSpacing: -0.48,
  },
  handle: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  topRightBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  visitorActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    padding: 4,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  followBlock: { gap: 4, alignItems: 'center' as const },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  followBtnFollow: {
  },
  followBtnFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  editProfileBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  followBtnText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  followBtnTextFollow: {
  },
  followBtnTextFollowing: {
  },
  editProfileBtnText: {
  },
  followValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 22,
  },
  followLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 4,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnFollow: {
  },
  actionBtnFollowing: {
  },
  actionBtnOutline: {
  },
  actionBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  actionTextFollow: { },
  actionTextFollowing: { },

  // Key Metrics chrome lifted to <MetricCardRow>; see metricValueTextStyle
  // for the composite-Text base when value is a ReactNode.

  // Section headers
  sectionWrap: { marginTop: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionLink: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
  },

  // Crown Jewel card
  crownCard: {
    borderRadius: RADII.card,
    overflow: 'hidden',
  },
  crownMain: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderBottomWidth: 1,
  },
  crownImageFrame: {
    width: 116,
    aspectRatio: 5 / 7,
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    overflow: 'hidden',
  },
  crownImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  crownInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
    paddingVertical: 2,
  },
  crownMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  crownUsername: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 12,
  },
  crownTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.2,
    marginTop: 10,
  },
  crownTraitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  crownValueRow: {
    marginTop: 12,
  },
  crownPrice: {
    fontFamily: TYPE.monoMedium,
    fontSize: 23,
    letterSpacing: -0.4,
  },
  crownRail: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  crownRailLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 8,
    letterSpacing: 1.1,
  },
  crownRailValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    marginTop: 2,
  },
  crownTracking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  crownTrackingText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // Featured Showcase card
  featuredCard: {
    borderRadius: RADII.card,
    overflow: 'hidden',
  },
  // 3-up tile row at the top of the featured-showcase card. Mirrors the
  // showcase-detail-v3 dossier collage and the ShowcaseSpatialCard tile
  // row: 4:5 tiles, each with their own border + 12pt radius, padded
  // inside the card so they don't bleed.
  featuredTileRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  featuredTile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featuredTileImage: {
    width: '100%',
    height: '100%',
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  featuredTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 15,
  },
  featuredItems: {
    fontFamily: TYPE.inter,
    fontSize: 11,
    marginTop: 2,
  },
  featuredEstLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
  },
  featuredValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 15,
    marginTop: 2,
  },

  // Live Sync pill
  liveSyncPill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveSyncText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  // Footer settings
  footerSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 48,
    paddingVertical: 14,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  footerSettingsText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 2,
  },

  // Collection DNA / Status Grid chrome lifted to
  // <AssetMatrixCard> and <StatusBreakdownGrid>.
});

// Collection lens chrome lifted to <CollectionSurface> in
// @/components/collectibles. Profile imports it directly; see usage in
// CollectorProfile below.

// ════════════════════════════════════════════════════════════════
// SHOWCASE SURFACE
// ════════════════════════════════════════════════════════════════
//
// Surface + card primitives moved to @/components/showcases. Lifted so
// the share-showcase picker (`/messages/share-showcase`) can reuse them
// with a forced grid view, mirroring the collection-lens lift pattern.

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT — production profile experience
// ════════════════════════════════════════════════════════════════

interface CollectorProfileProps {
  collectorId: string;
  /**
   * Optional lens to land on when the profile mounts (or when this prop
   * changes after mount). Used by deep-link entry points — e.g.,
   * `/(tabs)?lens=ACTIVITY`. Ignored if the requested lens isn't valid
   * for the current viewer (e.g., a private lens on someone else's profile).
   */
  initialLens?: LensKey;
  /**
   * Optional NETWORK lens chip to preselect. Threaded from the
   * `?tab=suggested|mutual|followers|following` URL param on the profile
   * route screens so tapping a FOLLOWERS / FOLLOWING count block on a
   * profile card lands directly on the right chip.
   */
  initialNetworkTab?: import('@/components/profile-lenses').NetworkTab;
  onScrollDirectionChange?: (direction: 'up' | 'down' | null) => void;
}

export function CollectorProfile({
  collectorId,
  initialLens,
  initialNetworkTab,
}: CollectorProfileProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user: viewer } = useAuth();

  const profileUserId = collectorId === 'me' ? viewer?.id ?? null : collectorId;
  const isOwnProfile = Boolean(viewer?.id && profileUserId === viewer.id);

  // ── View tracking ────────────────────────────────────────────────
  // Record an anonymous profile view on each mount. Self-views are
  // filtered inside `recordView` using the resolved profile owner id.
  useEffect(() => {
    if (!profileUserId) return;
    recordView('profile', profileUserId, profileUserId);
  }, [profileUserId]);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [activeLens, setActiveLens] = useState<LensKey>(initialLens ?? 'PROFILE');
  // Currently-selected NETWORK chip. Mirrored as an `initialTab` prop into
  // <NetworkLens>. Updated by the URL-param sync effect (deep-link from
  // route) and the tappable FOLLOWERS / FOLLOWING count blocks below.
  const [networkTab, setNetworkTab] = useState<
    import('@/components/profile-lenses').NetworkTab | undefined
  >(initialNetworkTab);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followToggling, setFollowToggling] = useState(false);
  const [collectionViewMode, setCollectionViewMode] = useState<ViewMode>('grid');
  const [showcaseViewMode, setShowcaseViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showcaseSearchQuery, setShowcaseSearchQuery] = useState('');
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilters>(EMPTY_COLLECTION_FILTERS);
  const [collectionSortKey, setCollectionSortKey] = useState<CollectionSortKey>('recent');
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 });
  const [collectionValue, setCollectionValue] = useState(0);
  const [collectionSize, setCollectionSize] = useState(0);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [trackingIds, setTrackingIds] = useState<Set<string>>(new Set());
  const [featuredShowcase, setFeaturedShowcase] = useState<HomeShowcaseDetail | null>(null);
  const [showcases, setShowcases] = useState<UserShowcase[]>([]);
  const [assetMatrix, setAssetMatrix] = useState<{ label: string; count: number; pct: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ key: string; count: number; pct: number }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Hub bundle ready — blocks lens pager until identity + catalog fetch complete. */
  const [isHubReady, setIsHubReady] = useState(false);

  const displayUser = isOwnProfile ? viewer : profileUser;

  const applyProfileCacheEntry = useCallback((entry: ProfileCacheEntry) => {
    // Restore the viewed collector's identity so the ID card mounts with real
    // name/username/avatar on the cache-hit path. Owner profiles cache null
    // here (identity comes from the auth context), so don't clobber that case.
    if (!isOwnProfile) setProfileUser(entry.identity);
    setFollowCounts(entry.followCounts);
    setCollectionValue(entry.collectionValue);
    setCollectionSize(entry.collectionSize);
    setCollectionItems(entry.collectionItems);
    setTrackingIds(entry.trackingIds);
    setFeaturedShowcase(entry.featuredShowcase);
    setShowcases(entry.showcases);
    setAssetMatrix(entry.assetMatrix);
    setStatusBreakdown(entry.statusBreakdown);
  }, [isOwnProfile]);

  const loadProfileData = useCallback(async (forceRefresh = false) => {
    if (!profileUserId) {
      setIsHubReady(false);
      return;
    }

    const cached = getProfileCacheEntry(profileUserId);
    const isFresh = isProfileCacheFresh(profileUserId);
    if (cached && !forceRefresh) {
      applyProfileCacheEntry(cached);
      setIsHubReady(true);
      if (isFresh) return;
    } else if (!forceRefresh && !cached) {
      setIsHubReady(false);
    }

    if (forceRefresh) setIsRefreshing(true);
    try {
      // Keep the freshly fetched identity in a local. `profileUser` state won't
      // reflect setProfileUser() within this same run (stale closure), so reads
      // below (featured showcase id, cache identity) must use this value.
      let fetchedProfileUser: User | null = null;
      if (!isOwnProfile) {
        fetchedProfileUser = await getUserById(profileUserId).catch(() => null);
        setProfileUser(fetchedProfileUser);
        if (!fetchedProfileUser) {
          setIsHubReady(false);
          return;
        }
      }

      const [
        nextFollowCounts,
        nextTrackingIds,
        rows,
        nextShowcases,
      ] = await Promise.all([
        getFollowCounts(profileUserId).catch(() => ({ followersCount: 0, followingCount: 0 })),
        viewer?.id ? getTrackingIds(viewer.id).catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
        getUserCollectibles(profileUserId).catch(() => []),
        getUserShowcases(profileUserId, viewer?.id).catch(() => []),
      ]);

      if (!isOwnProfile && viewer?.id) {
        checkIsFollowing(viewer.id, profileUserId)
          .then(setIsFollowing)
          .catch(() => {});
      }

      const featuredShowcaseId = isOwnProfile
        ? viewer?.featuredShowcaseId
        : fetchedProfileUser?.featuredShowcaseId;

      const nextFeaturedShowcase = featuredShowcaseId
        ? await getFeaturedShowcaseDetail(featuredShowcaseId).catch(() => null)
        : resolveFeaturedShowcase(nextShowcases);

      const nextCollectionValue = rows.reduce(
        (sum, r) => sum + (typeof r.value === 'number' ? r.value : 0),
        0,
      );
      const trackingCounts = await getTrackCounts(rows.map((r) => r.id));
      const nextCollectionItems = rows.map((row) =>
        mapToCollectionItem(row, trackingCounts.get(row.id) ?? 0),
      );

      const typeCounts = new Map<string, number>();
      rows.forEach((r) => {
        const t = r.collectibleType || 'unknown';
        typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
      });
      const total = rows.length || 1;
      const nextAssetMatrix = Array.from(typeCounts.entries())
        .map(([label, count]) => ({
          label: label.toUpperCase().replace('_', ' '),
          count,
          pct: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      const statusCounts = { NFST: 0, FOR_SALE: 0, FOR_TRADE: 0, SELL_TRADE: 0 };
      rows.forEach((r) => {
        if (r.availableForSale && r.availableForTrade) statusCounts.SELL_TRADE++;
        else if (r.availableForSale) statusCounts.FOR_SALE++;
        else if (r.availableForTrade) statusCounts.FOR_TRADE++;
        else statusCounts.NFST++;
      });
      const nextStatusBreakdown = Object.entries(statusCounts).map(([key, count]) => ({
        key,
        count,
        pct: Math.round((count / total) * 100),
      }));

      const entry: ProfileCacheEntry = {
        timestamp: Date.now(),
        identity: fetchedProfileUser,
        followCounts: nextFollowCounts,
        collectionValue: nextCollectionValue,
        collectionSize: rows.length,
        collectionItems: nextCollectionItems,
        trackingIds: nextTrackingIds,
        featuredShowcase: nextFeaturedShowcase,
        showcases: nextShowcases,
        assetMatrix: nextAssetMatrix,
        statusBreakdown: nextStatusBreakdown,
      };
      setProfileCacheEntry(profileUserId, entry);
      applyProfileCacheEntry(entry);
      setIsHubReady(true);
    } catch {
      if (!getProfileCacheEntry(profileUserId)) {
        setIsHubReady(false);
      }
    } finally {
      if (forceRefresh) setIsRefreshing(false);
    }
  }, [applyProfileCacheEntry, isOwnProfile, profileUserId, viewer?.featuredShowcaseId, viewer?.id]);

  useEffect(() => {
    loadProfileData(false);
  }, [loadProfileData]);

  useEffect(() => {
    if (!profileUserId) return;
    return subscribeProfileHub((invalidatedUserId) => {
      if (invalidatedUserId !== profileUserId) return;
      void loadProfileData(true);
    });
  }, [profileUserId, loadProfileData]);

  const handleRefresh = useCallback(() => {
    loadProfileData(true);
  }, [loadProfileData]);

  const handleFollowToggle = useCallback(async () => {
    if (!viewer?.id || !profileUserId || isOwnProfile || followToggling) return;
    setFollowToggling(true);

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowCounts((prev) => ({
      ...prev,
      followersCount: prev.followersCount + (wasFollowing ? -1 : 1),
    }));

    try {
      const ok = wasFollowing
        ? await unfollowUser(viewer.id, profileUserId)
        : await followUser(viewer.id, profileUserId);
      if (!ok) {
        setIsFollowing(wasFollowing);
        setFollowCounts((prev) => ({
          ...prev,
          followersCount: prev.followersCount + (wasFollowing ? 1 : -1),
        }));
      }
    } catch {
      setIsFollowing(wasFollowing);
      setFollowCounts((prev) => ({
        ...prev,
        followersCount: prev.followersCount + (wasFollowing ? 1 : -1),
      }));
    } finally {
      setFollowToggling(false);
    }
  }, [followToggling, isFollowing, isOwnProfile, profileUserId, viewer?.id]);

  const handleTrackFromSpatialCard = useCallback((collectibleId: string) => {
    if (!viewer?.id || trackingIds.has(collectibleId)) return;

    setTrackingIds((current) => {
      const next = new Set(current);
      next.add(collectibleId);
      return next;
    });
    setCollectionItems((current) =>
      current.map((item) =>
        item.id === collectibleId
          ? { ...item, trackingCount: item.trackingCount + 1 }
          : item
      )
    );

    trackItem(viewer.id, collectibleId).then((ok) => {
      if (ok) return;
      setTrackingIds((current) => {
        const next = new Set(current);
        next.delete(collectibleId);
        return next;
      });
      setCollectionItems((current) =>
        current.map((item) =>
          item.id === collectibleId
            ? { ...item, trackingCount: Math.max(0, item.trackingCount - 1) }
            : item
        )
      );
    });
  }, [profileUserId, trackingIds, viewer?.id]);

  const handleToggleTrackFromSpatialCard = useCallback((collectibleId: string) => {
    if (!viewer?.id) return;

    const wasTracked = trackingIds.has(collectibleId);

    setTrackingIds((current) => {
      const next = new Set(current);
      if (wasTracked) next.delete(collectibleId);
      else next.add(collectibleId);
      return next;
    });
    setCollectionItems((current) =>
      current.map((item) =>
        item.id === collectibleId
          ? {
              ...item,
              trackingCount: wasTracked
                ? Math.max(0, item.trackingCount - 1)
                : item.trackingCount + 1,
            }
          : item
      )
    );

    const request = wasTracked
      ? untrackItem(viewer.id, collectibleId)
      : trackItem(viewer.id, collectibleId);

    request.then((ok) => {
      if (ok) return;
      setTrackingIds((current) => {
        const next = new Set(current);
        if (wasTracked) next.add(collectibleId);
        else next.delete(collectibleId);
        return next;
      });
      setCollectionItems((current) =>
        current.map((item) =>
          item.id === collectibleId
            ? {
                ...item,
                trackingCount: wasTracked
                  ? item.trackingCount + 1
                  : Math.max(0, item.trackingCount - 1),
              }
            : item
        )
      );
    });
  }, [profileUserId, trackingIds, viewer?.id]);

  const crownJewelId = displayUser?.crownJewelCollectibleId ?? null;
  const profileShareUrl = SHARE_URLS.profile(profileUserId ?? '');

  const handleEditProfile = useCallback(() => {
    router.push('/settings/profile' as Href);
  }, [router]);

  const handleOpenSettings = useCallback(() => {
    router.push('/settings' as Href);
  }, [router]);

  const handleShareProfile = useCallback(async () => {
    await Share.share({
      message: `Check out ${displayUser?.displayName ?? 'this collector'} on Vitrine`,
      url: profileShareUrl,
    });
    // Notify the profile owner that a visitor shared their profile.
    // Self-shares are suppressed.
    if (!isOwnProfile && viewer?.id && profileUserId && profileUserId !== viewer.id) {
      sendNotification({
        type: 'share_initiated',
        recipientIds: [profileUserId],
        actorId: viewer.id,
        data: {
          objectId: profileUserId,
          objectType: 'profile',
        },
      }).catch(() => {});
    }
  }, [displayUser?.displayName, profileShareUrl, isOwnProfile, viewer?.id, profileUserId]);

  const handleBlockUser = useCallback(() => {
    if (!viewer?.id || !profileUserId || isOwnProfile) return;
    const displayTarget = displayUser?.username ?? 'this user';

    const doBlock = () => {
      Alert.alert(
        'Block User',
        `Are you sure you want to block @${displayTarget}? They won't be able to see your profile or message you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await blockUser(viewer.id!, profileUserId);
                router.back();
              } catch (err) {
                Alert.alert('Error', 'Failed to block user. Please try again.');
              }
            },
          },
        ],
      );
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Block User'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (idx) => { if (idx === 1) doBlock(); },
      );
    } else {
      doBlock();
    }
  }, [viewer?.id, profileUserId, isOwnProfile, displayUser?.username, router]);

  const handleOpenCollectible = useCallback((id: string) => {
    router.push(`/collectible/${id}` as Href);
  }, [router]);

  const handleOpenShowcase = useCallback((id: string) => {
    router.push(`/showcase/${id}` as Href);
  }, [router]);

  const handleCreateShowcase = useCallback(() => {
    router.push('/upload/showcase' as Href);
  }, [router]);

  // Lens list — 6 surfaces on me-profile (the full hub), 3 on other-profile
  // (public surfaces only). Rebuilt only when isOwnProfile flips.
  const profileLenses = useMemo<ReadonlyArray<ProfileLensItem>>(
    () => (isOwnProfile ? ME_PROFILE_LENSES : PUBLIC_PROFILE_LENSES),
    [isOwnProfile],
  );

  // Guard against stale `activeLens` when the lens list shrinks (e.g.,
  // navigating from me-profile to someone else's profile while a private
  // lens was active). Snap back to PROFILE if the current key isn't valid
  // for the new list.
  useEffect(() => {
    if (!profileLenses.some((lens) => lens.key === activeLens)) {
      setActiveLens('PROFILE');
    }
  }, [profileLenses, activeLens]);

  // Sync `initialLens` whenever a deep-link entry point requests a new
  // surface (e.g. `/(tabs)?lens=ACTIVITY`). The wrapper clears the URL
  // param after each tap, so this prop changing back to undefined
  // intentionally does *not* snap the user away from wherever they swiped.
  useEffect(() => {
    if (!initialLens) return;
    if (!profileLenses.some((lens) => lens.key === initialLens)) return;
    setActiveLens(initialLens);
  }, [initialLens, profileLenses]);

  // Sync `initialNetworkTab` whenever the deep-link entry point requests a
  // specific NETWORK chip (e.g., FOLLOWERS / FOLLOWING count block on a
  // profile card → ?tab=followers → wrapper passes initialNetworkTab).
  useEffect(() => {
    if (!initialNetworkTab) return;
    setNetworkTab(initialNetworkTab);
    setActiveLens('NETWORK');
  }, [initialNetworkTab]);

  const handleOpenNetworkTab = useCallback(
    (tab: import('@/components/profile-lenses').NetworkTab) => {
      setNetworkTab(tab);
      setActiveLens('NETWORK');
    },
    [],
  );

  const handleNavigateToActivity = useCallback(() => {
    setActiveLens('ACTIVITY');
  }, []);

  const activeLensIndex = useMemo(
    () => Math.max(0, profileLenses.findIndex((lens) => lens.key === activeLens)),
    [activeLens, profileLenses],
  );

  const handleLensIndexChange = useCallback(
    (index: number) => {
      if (!isHubReady) return;
      const nextLens = profileLenses[index];
      if (nextLens) setActiveLens(nextLens.key);
    },
    [isHubReady, profileLenses],
  );

  const handleLensChange = useCallback(
    (key: LensKey) => {
      if (!isHubReady) return;
      setActiveLens(key);
    },
    [isHubReady],
  );

  return (
    <SafeAreaView style={[mainS.container, { backgroundColor: colors.void }]} edges={['top']}>
      <LensSelector
        items={profileLenses}
        activeKey={isHubReady ? activeLens : 'PROFILE'}
        onChange={handleLensChange}
        variant="display"
      />

      {!isHubReady ? (
        <ProfileHubSkeleton isOwnProfile={isOwnProfile} />
      ) : (
      <LensPager
        index={activeLensIndex}
        onIndexChange={handleLensIndexChange}
        lazy={isOwnProfile}
      >
        <SafeSection
          name="ProfileLens"
          resetKey={`${profileUserId ?? 'none'}:${collectionItems.length}`}
          fallback={<ProfileHubSkeleton isOwnProfile={isOwnProfile} />}
        >
          <ProfileSurface
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollowToggle={handleFollowToggle}
            avatarUrl={displayUser?.avatarUrl ?? null}
            displayName={displayUser?.displayName ?? 'Collector'}
            username={displayUser?.username ?? 'collector'}
            followersCount={followCounts.followersCount}
            followingCount={followCounts.followingCount}
            shareUrl={profileShareUrl}
            collectionValue={collectionValue}
            collectionSize={collectionSize}
            featuredShowcase={featuredShowcase}
            assetMatrix={assetMatrix}
            statusBreakdown={statusBreakdown}
            collectionItems={collectionItems}
            trackingIds={trackingIds}
            onTrackToggleItem={handleToggleTrackFromSpatialCard}
            crownJewelCollectibleId={crownJewelId}
            onEditProfile={handleEditProfile}
            onOpenSettings={handleOpenSettings}
            onShare={handleShareProfile}
            onBlockUser={handleBlockUser}
            onOpenCollectible={handleOpenCollectible}
            onOpenShowcase={handleOpenShowcase}
            onOpenNetworkTab={handleOpenNetworkTab}
            onNavigateToActivity={handleNavigateToActivity}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </SafeSection>
        <SafeSection name="CollectionLens" resetKey={collectionItems.length}>
          <CollectionSurface
            items={collectionItems}
            viewMode={collectionViewMode}
            onViewModeChange={setCollectionViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={collectionFilters}
            onFiltersChange={setCollectionFilters}
            sortKey={collectionSortKey}
            onSortChange={setCollectionSortKey}
            crownJewelCollectibleId={crownJewelId}
            trackingIds={trackingIds}
            onTrackItem={handleTrackFromSpatialCard}
            onTrackToggleItem={handleToggleTrackFromSpatialCard}
            onOpenItem={handleOpenCollectible}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </SafeSection>
        <ShowcaseSurface
          showcases={showcases}
          viewMode={showcaseViewMode}
          onViewModeChange={setShowcaseViewMode}
          searchQuery={showcaseSearchQuery}
          onSearchChange={setShowcaseSearchQuery}
          featuredShowcaseId={featuredShowcase?.id ?? null}
          onOpenShowcase={handleOpenShowcase}
          isOwner={isOwnProfile}
          onCreateShowcase={handleCreateShowcase}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
        {/* Owner-only lenses. Order here mirrors ME_PROFILE_LENSES exactly:
            ACTIVITY before NETWORK. Returning `null` for the visitor
            branches keeps the rendered children array length in sync with
            PUBLIC_PROFILE_LENSES — React.Children.toArray filters falsy
            entries, so visitors see [Profile, Collection, Showcase,
            NetworkLens] which lines up with their 4-item lens list, while
            owners see all five in the right slots. Messages graduated to
            a dedicated tab (/(tabs)/messages). */}
        {isOwnProfile ? <ActivityLens bottomOffset={80} /> : null}
        {/* NetworkLens — public surface mounted for both owner and visitor.
            Visitor view exposes a MUTUAL chip + privacy-gated FOLLOWERS /
            FOLLOWING; owner view drops MUTUAL and bypasses the privacy
            gate. BottomDock chrome lives in the tab parent on me-profile
            so we pass an 80pt offset; visitor profiles have no dock.
            The pager children array MUST stay length-stable, so render an
            empty View placeholder when profileUserId hasn't resolved yet. */}
        {profileUserId ? (
          <NetworkLens
            viewerId={viewer?.id ?? null}
            profileId={profileUserId}
            isOwner={isOwnProfile}
            initialTab={networkTab}
            bottomOffset={isOwnProfile ? 80 : 0}
          />
        ) : (
          <View style={[mainS.container, { backgroundColor: colors.void }]} />
        )}
      </LensPager>
      )}
    </SafeAreaView>
  );
}

const mainS = StyleSheet.create({
  container: {
    flex: 1,
  },
});
