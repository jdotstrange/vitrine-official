import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Bookmark,
  MessageCircle,
  Pencil,
  QrCode,
  Share2,
} from 'lucide-react-native';

import { useAuth } from '@/lib/contexts/auth-context';
import {
  deleteCollectible,
  getCollectible,
  type CreateCollectibleResponse,
} from '@/lib/api/collectibles';
import {
  getTrackCount,
  isTracking as checkIsTracking,
  trackItem,
  untrackItem,
} from '@/lib/api/tracking';
import { sendNotification } from '@/lib/api/notifications';
import { recordView } from '@/lib/api/views';
import { SHARE_URLS } from '@vitrine/constants';
import { shareContent } from '@/lib/share-content';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import {
  useTheme,
  TYPE,
  deriveStatus,
  isTraitKey,
} from '@/lib/design';
import { CollectibleDetailSkeleton } from '@/components/skeleton';
import {
  ActionSheet,
  DetailActionDock,
  LensPager,
  LensSelector,
  VitrineProComingSoonSheet,
  type DetailActionDockAction,
  type LensPagerHandle,
} from '@/components/vault';
import { QRCodeModal } from '@/components/shared/qr-code-modal';

import {
  AarLens,
  CompsLens,
  DetailsLens,
  PulseLens,
  SpecsLens,
  VarLens,
} from './detail/lenses';

const log = logger.create('CollectibleDetailV3');

/**
 * CollectibleDetailV3 — six-lens analytical surface for a collectible.
 *
 * Architecture (Philosophy B — universal lens visibility):
 *
 *   ┌──────────────────────────── chrome ─────────────────────────┐
 *   │ LensSelector (display)   ← oversized peek, IS the top bar.  │
 *   ├─────────────────────────── pager (lazy) ────────────────────┤
 *   │ DETAILS · SPECS · PULSE · AAR · VAR · COMPS                 │
 *   └──────────────────────────── dock ───────────────────────────┘
 *     [⋯ overflow]   [VALUE / kicker]   [TRACK / EDIT VALUE]
 *
 * Selector chrome is identical for free and Pro viewers — gating
 * happens *inside* the lens body via `LensPaywallCard`. Same labels,
 * same underline, same 5-tab peek; the experience differentiates by
 * what the panel reveals after the user navigates into the lens.
 *
 * The dock persists across all six lenses by design — value + commit
 * are always within thumb reach, regardless of which surface is active.
 *
 * Back navigation: stock edge-swipe-back on the DETAILS lens (page 0).
 * `LensPager` uses asymmetric activation on page 0 — only leftward swipes
 * claim the pager; rightward drags are left for the stack pop gesture, so
 * we keep the selector as the top bar without a back chevron. Other lenses
 * use bidirectional pager swipes as usual.
 */

// ════════════════════════════════════════════════════════════════════
// LENS CONFIG
// ════════════════════════════════════════════════════════════════════

type LensKey = 'DETAILS' | 'SPECS' | 'PULSE' | 'AAR' | 'VAR' | 'COMPS';

const LENS_ITEMS: readonly { key: LensKey; label: string }[] = [
  { key: 'DETAILS', label: 'Details' },
  { key: 'SPECS', label: 'Specs' },
  { key: 'PULSE', label: 'Pulse' },
  { key: 'AAR', label: 'AAR' },
  { key: 'VAR', label: 'VAR' },
  { key: 'COMPS', label: 'Comps' },
] as const;

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function formatPriceDisplay(value: number | undefined | null): string {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return '—';
  return `$${Math.round(value).toLocaleString()}`;
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ════════════════════════════════════════════════════════════════════

export interface CollectibleDetailV3Props {
  /**
   * Optional fallback id used when no `id` is in the route params.
   * Lets the design-lab sandbox host the same component with a
   * known-good default.
   */
  fallbackId?: string;
}

export function CollectibleDetailV3({ fallbackId }: CollectibleDetailV3Props = {}) {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();

  const id = params.id ?? fallbackId;

  // ── Data ──────────────────────────────────────────────────────────
  const [collectible, setCollectible] = useState<CreateCollectibleResponse | null>(null);
  const [collectorName, setCollectorName] = useState<string>('Collector');
  const [collectorAvatar, setCollectorAvatar] = useState<string | null>(null);
  const [collectorId, setCollectorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Tracking state ────────────────────────────────────────────────
  const [isTrackingItem, setIsTrackingItem] = useState(false);
  const [trackCount, setTrackCount] = useState<number>(0);

  // ── Lens state ────────────────────────────────────────────────────
  const [lensIndex, setLensIndex] = useState(0);
  const pagerRef = useRef<LensPagerHandle>(null);

  // ── Modals / sheets ───────────────────────────────────────────────
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [proSheetOpen, setProSheetOpen] = useState(false);

  // ── Pro state ─────────────────────────────────────────────────────
  // V1: production users are non-Pro. When subscription wiring lands
  // (`auth-context` → `user.isPro`), we read it from there instead.
  // The lens chrome is identical regardless — only lens *bodies* react.
  const isPro = false;

  // ── Data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    if (!id) {
      setCollectible(null);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      setLoading(true);
      try {
        const row = await getCollectible(id);
        if (!alive) return;
        setCollectible(row);

        if (row?.userId) {
          setCollectorId(row.userId);
          const { data: owner } = await supabase
            .from('users')
            .select('display_name, username, avatar')
            .eq('id', row.userId)
            .maybeSingle();
          if (alive && owner) {
            setCollectorName(owner.display_name || owner.username || 'Collector');
            setCollectorAvatar(owner.avatar ?? null);
          }
        }

        if (row?.id) {
          const [tracked, count] = await Promise.all([
            user?.id ? checkIsTracking(user.id, row.id) : Promise.resolve(false),
            getTrackCount(row.id),
          ]);
          if (alive) {
            setIsTrackingItem(tracked);
            setTrackCount(count);
          }
        }
      } catch (err) {
        log.error('load failed:', (err as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, user?.id]);

  // ── View tracking ────────────────────────────────────────────────
  // Fire once per mount, after the owner is known so we can short-
  // circuit self-views client-side. The RPC is best-effort and never
  // blocks the UI; failures are swallowed inside `recordView`.
  useEffect(() => {
    if (!id || !collectorId) return;
    recordView('collectible', id, collectorId);
  }, [id, collectorId]);

  // ── Derived values ────────────────────────────────────────────────
  const images = useMemo(
    () => (collectible?.photos || []).filter((p): p is string => !!p),
    [collectible?.photos],
  );

  const status = deriveStatus(
    collectible?.availableForSale,
    collectible?.availableForTrade,
  );

  const title = collectible?.listingTitle || collectible?.title || '';
  const description =
    collectible?.listingDescription || collectible?.description || '';

  const traitKeys = useMemo(() => {
    if (!collectible?.traits) return [];
    return collectible.traits.filter(isTraitKey);
  }, [collectible?.traits]);

  const isAutographed = useMemo(
    () => Array.isArray(collectible?.traits) && collectible!.traits!.includes('is_autographed'),
    [collectible?.traits],
  );

  const isOwner =
    !!collectible && !!user && collectible.userId === user.id;

  // ── Lens index ↔ key bridge ──────────────────────────────────────
  const activeLensKey = LENS_ITEMS[lensIndex]?.key ?? 'DETAILS';

  const handleLensChange = useCallback((key: LensKey) => {
    const idx = LENS_ITEMS.findIndex((lens) => lens.key === key);
    if (idx >= 0) {
      setLensIndex(idx);
      pagerRef.current?.setPage(idx);
    }
  }, []);

  // ── Lens items for the selector — chrome identical for free/Pro ──
  const lensSelectorItems = useMemo(
    () => LENS_ITEMS.map((lens) => ({ key: lens.key, label: lens.label })),
    [],
  );

  // ── Handlers ──────────────────────────────────────────────────────

  const handleTrackToggle = useCallback(async () => {
    if (!user?.id || !collectible?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const wasTracking = isTrackingItem;
    setIsTrackingItem(!wasTracking);
    setTrackCount((prev) => Math.max(0, prev + (wasTracking ? -1 : 1)));

    const ok = wasTracking
      ? await untrackItem(user.id, collectible.id)
      : await trackItem(user.id, collectible.id);

    if (!ok) {
      // Roll back optimistic update on failure.
      setIsTrackingItem(wasTracking);
      setTrackCount((prev) => Math.max(0, prev + (wasTracking ? 1 : -1)));
    }
  }, [collectible?.id, isTrackingItem, user?.id]);

  const handleOpenMore = useCallback(() => {
    Haptics.selectionAsync();
    setMoreSheetOpen(true);
  }, []);

  const handleShare = useCallback(async () => {
    if (!collectible?.id) return;
    const shareUrl = SHARE_URLS.collectible(collectible.id);
    const ownerPrefix = isOwner ? 'Check out my' : 'Check out this';
    try {
      await Share.share(
        shareContent(`${ownerPrefix} "${title || 'collectible'}" on Vitrine`, shareUrl),
      );
      // Fire share_initiated only when a non-owner shares — the owner
      // doesn't need an inbox row about their own share. This is V1's
      // proxy for "someone shared your X" since the platform share
      // sheet doesn't return success/failure metadata reliably.
      if (!isOwner && collectible.userId && user?.id && collectible.userId !== user.id) {
        sendNotification({
          type: 'share_initiated',
          recipientIds: [collectible.userId],
          actorId: user.id,
          data: {
            objectId: collectible.id,
            objectType: 'collectible',
            collectibleId: collectible.id,
            collectibleTitle: title,
            collectibleImage: collectible.photos?.[0] ?? '',
          },
        }).catch(() => {});
      }
    } catch (err) {
      log.error('Share failed:', (err as Error).message);
    }
  }, [collectible?.id, collectible?.userId, collectible?.photos, isOwner, title, user?.id]);

  const handleShowQR = useCallback(() => {
    Haptics.selectionAsync();
    setShowQR(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!collectible?.id || !collectible.userId) return;
    Alert.alert(
      'Delete collectible?',
      'This permanently removes the collectible from your collection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteCollectible(collectible.id, collectible.userId);
              router.back();
            } catch (err) {
              log.error('Delete failed:', (err as Error).message);
              Alert.alert(
                'Could not delete collectible',
                'Please try again.',
              );
            }
          },
        },
      ],
    );
  }, [collectible, router]);

  const handleEdit = useCallback(() => {
    if (!collectible?.id) return;
    Haptics.selectionAsync();
    router.push(`/collectible/${collectible.id}/edit` as never);
  }, [collectible?.id, router]);

  const handleReport = useCallback(() => {
    Haptics.selectionAsync();
    Alert.alert(
      'Report submitted',
      'Thanks — a reviewer will take a look.',
    );
  }, []);

  const handleUpgrade = useCallback(() => {
    Haptics.selectionAsync();
    setProSheetOpen(true);
  }, []);

  const handleCollectorPress = useCallback(() => {
    if (!collectorId) return;
    Haptics.selectionAsync();
    router.push(`/profile/${collectorId}` as never);
  }, [collectorId, router]);

  const handleMessageCollector = useCallback(() => {
    if (!collectorId) return;
    Haptics.selectionAsync();
    // V1: route to the search-driven new-message screen with the
    // recipient pre-resolved as a query param. The new-message screen
    // doesn't consume `recipientId` yet — that's a follow-up. Until
    // then this lands on a search box the user has to fill out, which
    // is a degraded but functional path. Thread dedup (find-or-create)
    // is also a later concern.
    router.push(`/messages/new?recipientId=${collectorId}` as never);
  }, [collectorId, router]);

  const handleRequestAarReview = useCallback(() => {
    Haptics.selectionAsync();
    Alert.alert(
      'Review requested',
      'Thanks — we\'ll take another look at this item and update the assessment if needed.',
    );
  }, []);

  // ── Loading / not-found ──────────────────────────────────────────
  if (loading) {
    return <CollectibleDetailSkeleton bottomInset={insets.bottom} />;
  }

  if (!collectible) {
    return (
      <SafeAreaView style={[styles.fullPageState, { backgroundColor: colors.void }]} edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.errorBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={[styles.errorBackText, { color: colors.textSecondary }]}>← BACK</Text>
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Collectible unavailable</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          This piece may have been removed or made private.
        </Text>
      </SafeAreaView>
    );
  }

  // ── Dock copy ─────────────────────────────────────────────────────
  const dockValue = formatPriceDisplay(collectible.value);
  const dockKicker = (() => {
    if (typeof collectible.value !== 'number' || collectible.value <= 0) {
      return 'NOT FOR SALE';
    }
    if (trackCount > 0) {
      return `TRACKED BY ${trackCount}`;
    }
    return 'VALUE';
  })();

  const dockReservedHeight = DetailActionDock.reservedHeight(insets.bottom);

  // ── Dock rail actions ────────────────────────────────────────────
  // Visitor: engagement → propagation → overflow.
  //   Track | Message | Share | ⋯
  // Owner: consume/show-off → propagation → manage → overflow.
  //   QR    | Share   | Edit  | ⋯
  //
  // The `⋯` button is rendered by the dock itself (always rightmost),
  // so the actions array is just the three inline glyphs in order.
  // When marketplace lights up, visitor inserts a Transact slot before
  // Track — the dock accepts any reasonable count, no API change.
  const dockActions: ReadonlyArray<DetailActionDockAction> = isOwner
    ? [
        {
          key: 'qr',
          icon: QrCode,
          label: 'Show QR code',
          onPress: handleShowQR,
        },
        {
          key: 'share',
          icon: Share2,
          label: 'Share collectible',
          onPress: handleShare,
        },
        {
          key: 'edit',
          icon: Pencil,
          label: 'Edit collectible',
          onPress: handleEdit,
        },
      ]
    : [
        {
          key: 'track',
          icon: Bookmark,
          label: isTrackingItem
            ? 'Tracking — tap to untrack'
            : 'Track this collectible',
          active: isTrackingItem,
          onPress: handleTrackToggle,
        },
        {
          key: 'message',
          icon: MessageCircle,
          label: 'Message collector',
          onPress: handleMessageCollector,
        },
        {
          key: 'share',
          icon: Share2,
          label: 'Share collectible',
          onPress: handleShare,
        },
      ];

  // ── Overflow sheet options ───────────────────────────────────────
  // Trimmed: items that graduated to the inline rail no longer appear
  // here. The sheet is reserved for low-frequency / management actions.
  const sheetOptions = isOwner
    ? [
        {
          label: 'Delete',
          destructive: true as const,
          onPress: handleDelete,
        },
      ]
    : [
        {
          label: 'Report a problem',
          destructive: true as const,
          onPress: handleReport,
        },
      ];

  // ── Render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      {/* Top chrome — selector IS the top bar. No back arrow / no ⋯. */}
      <View style={topBarS.wrap}>
        <LensSelector
          items={lensSelectorItems}
          activeKey={activeLensKey}
          onChange={handleLensChange}
          variant="display"
        />
      </View>

      {/* Pager — six lenses, lazy mount with sticky visited window. */}
      <LensPager
        ref={pagerRef}
        index={lensIndex}
        onIndexChange={setLensIndex}
        lazy
      >
        <DetailsLens
          images={images}
          title={title}
          status={status}
          traitKeys={traitKeys}
          collectorName={collectorName}
          collectorAvatar={collectorAvatar}
          isOwner={isOwner}
          listedAt={collectible.createdAt}
          description={description}
          onCollectorPress={handleCollectorPress}
          bottomInset={insets.bottom}
          dockReservedHeight={dockReservedHeight}
        />
        <SpecsLens
          title={title}
          status={status}
          traitKeys={traitKeys}
          aiMetadata={collectible.aiMetadata ?? undefined}
          traitMetadata={collectible.traitMetadata ?? undefined}
          metadataProvenance={collectible.metadataProvenance ?? undefined}
          customFields={collectible.customFields ?? undefined}
          bottomInset={insets.bottom}
          dockReservedHeight={dockReservedHeight}
        />
        <PulseLens
          isPro={isPro}
          onUpgrade={handleUpgrade}
          bottomInset={insets.bottom}
          dockReservedHeight={dockReservedHeight}
        />
        <AarLens
          isPro={isPro}
          isAutographed={isAutographed}
          onUpgrade={handleUpgrade}
          onRequestReview={handleRequestAarReview}
          bottomInset={insets.bottom}
          dockReservedHeight={dockReservedHeight}
        />
        <VarLens
          isPro={isPro}
          onUpgrade={handleUpgrade}
          bottomInset={insets.bottom}
          dockReservedHeight={dockReservedHeight}
        />
        <CompsLens
          collectibleId={collectible.id}
          collectibleTitle={title}
          bottomInset={insets.bottom}
          dockReservedHeight={dockReservedHeight}
        />
      </LensPager>

      {/* Persistent action dock — present across every lens. */}
      <DetailActionDock
        bottomInset={insets.bottom}
        onMore={handleOpenMore}
        value={dockValue}
        valueKicker={dockKicker}
        status={status}
        actions={dockActions}
      />

      {/* Overflow sheet (owner / visitor branches by `isOwner`). */}
      <ActionSheet
        visible={moreSheetOpen}
        title={isOwner ? 'Manage collectible' : 'Collectible options'}
        options={sheetOptions}
        onClose={() => setMoreSheetOpen(false)}
      />

      {/* QR — leveraged from the existing shared modal. */}
      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        value={SHARE_URLS.collectible(collectible.id || '')}
        title="Share This Collectible"
        subtitle="Scan to view this collectible on Vitrine"
      />

      <VitrineProComingSoonSheet
        visible={proSheetOpen}
        onClose={() => setProSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

export default CollectibleDetailV3;

// ════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fullPageState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorBack: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 12,
  },
  errorBackText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  errorTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 20,
    letterSpacing: 1.2,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
});

const topBarS = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
});
