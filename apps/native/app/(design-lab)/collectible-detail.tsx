/* eslint-disable react-native/no-inline-styles */
/**
 * Collectible Detail Sandbox — V3 DNA exploration.
 *
 * Hardcoded single-pass screen for tuning the new visual language
 * (void black + frost borders + Libre Caslon Display + Space Grotesk +
 * Inter + JetBrains Mono) against real data on real devices, in isolation
 * from production. See docs/COLLECTIBLE_DETAIL_SANDBOX_SPEC.md for intent.
 *
 * Usage: navigate to /collectible-detail?id=<collectibleId>
 *        If id is omitted, falls back to a known-good default.
 *
 * Rules while iterating:
 *   - Do NOT import from components/detail/*, lib/colors, or any shared
 *     design-system token. Everything visual lives in this file.
 *   - Annotate every magic value with its prospective token name in a
 *     trailing comment so extraction is mechanical when we lock it.
 *   - Data layer (getCollectible, formatAddedOn) is DNA-agnostic and
 *     safe to reuse.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  Share,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreHorizontal,
  QrCode,
  Share2,
  Pencil,
  Trash2,
  Flag,
  Bookmark,
  MessageCircle,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { getCollectible, type CreateCollectibleResponse } from '@/lib/api/collectibles';
import { formatAddedOn } from '@/lib/format-time';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';
import { useAuth } from '@/lib/contexts/auth-context';
import { SHARE_URLS } from '@vitrine/constants';
import { QRCodeModal } from '@/components/shared/qr-code-modal';
import { supabase } from '@/lib/supabase';

// Design tokens + shared configs — single source of truth for V3 DNA.
// See lib/design/ for the full module. Inline token blocks have been
// extracted; screen-specific constants (e.g. HERO_ASPECT) remain local.
import {
  COLORS,
  useTheme,
  TYPE,
  SPACING,
  RADII,
  STATUS_CONFIG,
  deriveStatus,
  isTraitKey,
  type ListingStatus,
} from '@/lib/design';

// V3 components — atomic pills, shells, and compositions.
// Import from the barrel; internal paths are an implementation detail.
import {
  StatusPill,
  TraitPill,
  SchemaRow,
  StatCell,
  CompCard,
  LensSelector,
} from '@/components/vault';

// ===========================================================================
// SCREEN-LOCAL CONSTANTS
// Design tokens + shared configs are imported from @/lib/design (see above).
// Only constants specific to this screen's layout live here.
// ===========================================================================

const HERO_ASPECT = 1.05; // hero height = screen width * this

// ===========================================================================
// SANDBOX-LOCAL DATA HELPERS
// ===========================================================================

type Row = {
  key: string;
  label: string;
  kind: 'text' | 'mono';
  value: string;
};

type Authentication = {
  company: string | null;
  number: string | null;
};

/**
 * Keys we never render as visible rows. Mirrors the decisions locked in
 * last week: notes/customizations live behind the curtain, item_type is
 * redundant, authentications gets custom rendering, verification_url is
 * intentionally deferred.
 */
const SKIP_KEYS_AI = new Set(['notes', 'customizations']);
const SKIP_KEYS_TRAIT = new Set(['item_type', 'authentications', 'verification_url']);

/**
 * Heuristic: should this value render in monospace?
 * Triggers on (a) key-name matches catalog/ID-like words, (b) value looks
 * like a code, year, ratio, grade, or alphanumeric identifier.
 */
const MONO_KEY_PATTERNS = /(year|serial|number|cert|id|grade|confidence|print_run|count|ratio|edition|score|code)/i;
function looksLikeCode(value: string): boolean {
  if (!value) return false;
  if (!/\d/.test(value)) return false;
  // Pure year
  if (/^\d{4}$/.test(value)) return true;
  // Ratio e.g. "10/10" or "1/100"
  if (/^\d+\s*\/\s*\d+$/.test(value)) return true;
  // Alphanumeric code with digits (e.g. "BQ15604", "PSA-10")
  if (/^[A-Z0-9][A-Z0-9\s\-\/]+$/i.test(value) && value.length <= 24) return true;
  // Percentage
  if (/^\d+(\.\d+)?%$/.test(value)) return true;
  // Decimal grade (e.g. "9.5")
  if (/^\d+\.\d+$/.test(value)) return true;
  return false;
}

function shouldMono(key: string, value: string): boolean {
  if (MONO_KEY_PATTERNS.test(key)) return true;
  return looksLikeCode(value);
}

function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  const first = str.charAt(0);
  const upper = first.toUpperCase();
  return first === upper ? str : upper + str.slice(1);
}

function isPopulated(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function formatScalar(v: unknown): string | null {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const parts = v.map(formatScalar).filter((p): p is string => !!p);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

/**
 * Sandbox-local converter. Produces Row[] with explicit typography kind
 * so the renderer can route segments to the correct font family.
 */
function jsonbToRows(
  data: Record<string, unknown> | null | undefined,
  skipKeys: Set<string>,
): Row[] {
  if (!data) return [];
  const rows: Row[] = [];

  for (const [rawKey, value] of Object.entries(data)) {
    if (skipKeys.has(rawKey.toLowerCase())) continue;
    if (!isPopulated(value)) continue;

    const label = capitalizeFirst(humanizeKey(rawKey));

    const display = formatScalar(value);
    if (display === null) continue;

    const final = capitalizeFirst(display);
    rows.push({
      key: rawKey,
      label,
      kind: shouldMono(rawKey, final) ? 'mono' : 'text',
      value: final,
    });
  }

  return rows;
}

/**
 * Authentications get a custom ledger render (§Option A):
 * each entry becomes a (company, number) pair rendered as a row in a
 * two-column verification table with a semantic-green "verified" dot.
 * Returns null if there are no valid entries.
 */
function buildAuthentications(auths: unknown): Authentication[] | null {
  if (!Array.isArray(auths) || auths.length === 0) return null;

  const entries: Authentication[] = [];
  for (const entry of auths) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const company =
      typeof e.company === 'string' && e.company.trim() ? e.company.trim() : null;
    const number =
      typeof e.number === 'string' && e.number.trim() ? e.number.trim() : null;
    if (!company && !number) continue;
    entries.push({ company, number });
  }

  return entries.length ? entries : null;
}

// ===========================================================================
// LENS SYSTEM — the segmented control below the description lets users
// switch between analytical lenses on the object. Five lenses total; which
// ones appear depends on the collectible's traits; which ones are gated
// depends on the user's subscription.
//
// NOTE: gating and availability are pure functions of { traits, isSubscriber }
// so the switcher auto-recomputes on state changes. Default lens is SPECS
// (always available, always free, lowest time-to-first-paint).
// ===========================================================================

type Lens = 'SPECS' | 'PULSE' | 'AAR' | 'VAR' | 'COMPS';

type LensVisibilityContext = {
  traits: string[];                                  // trait keys (e.g. is_autographed)
};

type LensConfigEntry = {
  key: Lens;
  label: string;                                     // what the tab shows (will be uppercased at render)
  isAvailable: (ctx: LensVisibilityContext) => boolean;
  requiresPro: boolean;                              // gated behind subscription when true
  upsellTitle: string;                               // shown inside the Pro upsell template
  upsellBlurb: string;                               // placeholder — replace with user's real briefs
  accent: string;                                    // per-lens accent for the upsell glow + active tab underline
};

/**
 * Lens order is deliberate and narrative:
 *   SPECS  — what is this thing?        (free, always available)
 *   PULSE  — how's the market moving?   (Pro, always available)
 *   AAR    — is the signature real?     (Pro, if is_autographed)
 *   VAR    — full analytical report     (Pro, if autographed or graded)
 *   COMPS  — comparable recent sales    (free, always last)
 *
 * Pro reports sit between the two free bookends — SPECS grounds the user
 * in the object, COMPS closes with market context, and the premium value
 * fills the middle.
 *
 * Placeholder copy — replace VAR/AAR/PULSE blurbs with real briefs.
 */
const LENS_CONFIG: readonly LensConfigEntry[] = [
  {
    key: 'SPECS',
    label: 'Specs',
    isAvailable: () => true,
    requiresPro: false,
    upsellTitle: 'Specs',
    upsellBlurb: '',
    accent: COLORS.textPrimary,
  },
  {
    key: 'PULSE',
    label: 'Pulse',
    isAvailable: () => true,
    requiresPro: true,
    upsellTitle: 'Market Pulse',
    upsellBlurb:
      'Live market intelligence for this specific piece. Demand signals, price velocity, population scarcity, and alerts the moment something moves.',
    accent: COLORS.semanticGreen,                    // "live / active" signal
  },
  {
    key: 'AAR',
    label: 'AAR',
    isAvailable: (ctx) => ctx.traits.includes('is_autographed'),
    requiresPro: true,
    upsellTitle: 'Autograph Assessment Report',
    upsellBlurb:
      'Signature authenticity scoring for autographed pieces. Stroke-pattern analysis, pressure dynamics, and exemplar comparison to give you a confidence rating before you commit.',
    accent: COLORS.traitViolet,                      // aligned to the "signed" trait hue
  },
  {
    key: 'VAR',
    label: 'VAR',
    isAvailable: (ctx) =>
      ctx.traits.includes('is_autographed') || ctx.traits.includes('is_graded'),
    requiresPro: true,
    upsellTitle: 'Vitrine Analysis Report',
    upsellBlurb:
      'Deep-dive authentication and condition analysis powered by Vitrine AI. Visual pattern matching, defect detection, population data, and comparable sales context — built specifically for signed and graded pieces.',
    accent: COLORS.traitCyan,                        // aligned to the "graded" / analytical feel
  },
  {
    key: 'COMPS',
    label: 'Comps',
    isAvailable: () => true,
    requiresPro: false,
    upsellTitle: 'Comps',
    upsellBlurb: '',
    accent: COLORS.textPrimary,
  },
] as const;

function getVisibleLenses(ctx: LensVisibilityContext): LensConfigEntry[] {
  return LENS_CONFIG.filter((l) => l.isAvailable(ctx));
}

// ===========================================================================
// SCREEN
// ===========================================================================

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_W * HERO_ASPECT;

// Fallback id — one of the trading-card-classified items so the sandbox
// stress-tests an AI-enriched item that lacks legacy catalog data.
const DEFAULT_ID = '883136ac-9470-427f-a039-adad02599a04';

export default function CollectibleDetailSandbox() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();

  const id = params.id || DEFAULT_ID;

  const [collectible, setCollectible] = useState<CreateCollectibleResponse | null>(null);
  const [collectorName, setCollectorName] = useState<string>('Collector');
  const [collectorAvatar, setCollectorAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Lens state — default to SPECS (always available, always free).
  const [activeLens, setActiveLens] = useState<Lens>('SPECS');

  // DEV-only: fake subscription flag. In production this comes from the
  // auth context / user profile. Gated by __DEV__ so the toggle + default
  // never leak to real builds.
  const [isSubscriberDev, setIsSubscriberDev] = useState(false);
  const isSubscriber = __DEV__ ? isSubscriberDev : /* prod: */ false;

  // DEV-only: override the derived isOwner to lock in either persona's view
  // of the bottom action bar. Defaults to 'visitor' so the richer state
  // (4 icons + semantic commerce pill) is the first thing seen on load.
  const [modeDev, setModeDev] = useState<'owner' | 'visitor'>('visitor');

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const row = await getCollectible(id);
        if (!alive) return;
        setCollectible(row);
        if (row?.userId) {
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
      } catch (err) {
        console.error('[sandbox] load failed', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const realIsOwner = !!collectible && !!user && collectible.userId === user.id;
  // DEV: sandbox toggle overrides real ownership so both personas can be
  // demoed against the same live listing. Prod uses realIsOwner.
  const isOwner = __DEV__ ? modeDev === 'owner' : realIsOwner;

  const images = useMemo(
    () => (collectible?.photos || []).filter(Boolean),
    [collectible?.photos],
  );

  const status = deriveStatus(
    collectible?.availableForSale,
    collectible?.availableForTrade,
  );

  const title = collectible?.listingTitle || collectible?.title || '';
  const description = collectible?.listingDescription || collectible?.description || '';

  // Pass trait *keys* (not labels) to the strip so it can look up per-trait
  // color chrome at render time.
  const traitPills = useMemo(() => {
    if (!collectible?.traits) return [];
    return collectible.traits.filter(isTraitKey);
  }, [collectible?.traits]);

  // Which lenses apply to this collectible (trait-driven availability).
  const visibleLenses = useMemo(
    () => getVisibleLenses({ traits: traitPills }),
    [traitPills],
  );

  // Guard: if the active lens gets filtered out (e.g. trait data arrives
  // late and removes AAR availability), fall back to SPECS.
  useEffect(() => {
    if (!visibleLenses.some((l) => l.key === activeLens)) {
      setActiveLens('SPECS');
    }
  }, [visibleLenses, activeLens]);

  const collectibleDetailRows = useMemo(
    () => jsonbToRows(collectible?.aiMetadata, SKIP_KEYS_AI),
    [collectible?.aiMetadata],
  );

  const authenticityDetailRows = useMemo(
    () => jsonbToRows(collectible?.traitMetadata, SKIP_KEYS_TRAIT),
    [collectible?.traitMetadata],
  );

  const authentications = useMemo(
    () =>
      buildAuthentications(
        (collectible?.traitMetadata as Record<string, unknown> | undefined)?.authentications,
      ),
    [collectible?.traitMetadata],
  );

  const priceDisplay =
    typeof collectible?.value === 'number'
      ? {
          symbol: '$',
          amount: Math.round(collectible.value).toLocaleString(),
        }
      : null;

  // ---- handlers ----

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleMore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(true);
  }, []);

  const handleTrackToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTracking((v) => !v);
  }, []);

  const handleQR = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(false);                               // close the •••  sheet if it was open
    setShowQR(true);
  }, []);

  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // placeholder — would deep-link to the collector DM thread
  }, []);

  const handleBuyTrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // placeholder — would open the buy/trade dispatcher sheet.
    // Future: if status === SELL_TRADE, sheet shows both "Buy" + "Trade".
    // If status === FOR_SALE, jumps straight to the Buy flow. Same for trade.
  }, []);

  const handleShare = useCallback(async () => {
    setMenuOpen(false);
    try {
      await Share.share({
        message: `Check out ${title || 'this collectible'} on Vitrine`,
      });
    } catch {
      // ignore
    }
  }, [title]);

  // ---- render ----

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.void }]}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  if (!collectible) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.void }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Collectible not found.</Text>
      </View>
    );
  }

  // Resolve the active lens config so we know whether to render the real
  // surface or the Pro upsell. Fall back to SPECS if somehow mismatched.
  const activeLensConfig =
    LENS_CONFIG.find((l) => l.key === activeLens) ?? LENS_CONFIG[0];
  const activeLensIsGated = activeLensConfig.requiresPro && !isSubscriber;

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // Pin the LensSelector (child index 1) to the top on scroll so the
        // user can switch lenses without scrolling back up.
        stickyHeaderIndices={[1]}
      >
        {/*
          Child 0 — "Object identity" zone (always visible, scrolls away).
          Wrapped in a single View so stickyHeaderIndices always sees
          LensSelector at index 1 regardless of conditional StorySection.
          paddingBottom creates the breathing room before the lens rail —
          this is a major zone transition from "object" to "analysis".
        */}
        <View style={{ paddingBottom: 48 /* spacing.zone.gap */ }}>
          <Hero images={images} scrollY={scrollY} />

          <IdentityStrip
            title={title}
            collectorName={collectorName}
            collectorAvatar={collectorAvatar}
            listedAt={collectible.createdAt}
            status={status}
            traits={traitPills}
            onCollectorPress={() => {
              // no-op in sandbox
            }}
          />

          {description ? <StorySection body={description} /> : null}
        </View>

        {/* Child 1 — sticky lens selector */}
        <LensSelector
          items={visibleLenses.map((lens) => ({
            key: lens.key,
            label: lens.label,
            locked: lens.requiresPro && !isSubscriber,
          }))}
          activeKey={activeLens}
          onChange={setActiveLens}
        />

        {/* Child 2 — active lens surface */}
        <View>
          {activeLensIsGated ? (
            <ProUpsell lens={activeLensConfig} />
          ) : activeLens === 'SPECS' ? (
            <SpecsLens
              collectibleDetailRows={collectibleDetailRows}
              authenticityDetailRows={authenticityDetailRows}
              authentications={authentications}
            />
          ) : activeLens === 'COMPS' ? (
            <CompsLens />
          ) : (
            // Subscriber viewing VAR / AAR / PULSE — real report UI will
            // land here. For now the upsell template doubles as placeholder
            // so Pro users also see something useful until content ships.
            <ProUpsell lens={activeLensConfig} />
          )}
        </View>
      </Animated.ScrollView>

      <TopControls
        onBack={handleBack}
        onMore={handleMore}
        insetTop={insets.top}
        scrollY={scrollY}
      />

      <CompactHeader
        title={title}
        thumbnail={images[0]}
        scrollY={scrollY}
        insetTop={insets.top}
        onBack={handleBack}
        onMore={handleMore}
      />

      <BottomActionBar
        price={priceDisplay}
        mode={isOwner ? 'owner' : 'visitor'}
        status={status}
        isTracking={isTracking}
        onShare={handleShare}
        onQR={handleQR}
        onMessage={handleMessage}
        onTrackToggle={handleTrackToggle}
        onBuyTrade={handleBuyTrade}
        insetBottom={insets.bottom}
      />

      {/* DEV-only subscriber toggle for live testing of gating behavior */}
      <DevSubscriberToggle
        isSubscriber={isSubscriberDev}
        onToggle={() => {
          Haptics.selectionAsync();
          setIsSubscriberDev((v) => !v);
        }}
        insetBottom={insets.bottom}
      />

      {/* DEV-only mode toggle — sibling to subscriber toggle */}
      <DevModeToggle
        mode={modeDev}
        onToggle={() => {
          Haptics.selectionAsync();
          setModeDev((m) => (m === 'owner' ? 'visitor' : 'owner'));
        }}
        insetBottom={insets.bottom}
      />

      <ActionSheet
        visible={menuOpen}
        isOwner={isOwner}
        onClose={() => setMenuOpen(false)}
        onShare={handleShare}
        onQR={handleQR}                                // ••• → QR opens the same modal
        onEdit={() => setMenuOpen(false)}
        onDelete={() => setMenuOpen(false)}
        onReport={() => setMenuOpen(false)}
      />

      {/*
        QR modal — leveraged from the existing shared component so we don't
        duplicate the QR library integration + clipboard logic. This uses
        legacy visual DNA (rounded card, older color tokens); it'll get a
        re-skin pass once we port the detail screen to V3 and can evolve
        the shared modal inline.
      */}
      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        value={SHARE_URLS.collectible(collectible.id || '')}
        title="Share This Collectible"
        subtitle="Scan to view this collectible on Vitrine"
      />
    </View>
  );
}

// ===========================================================================
// HERO — full-bleed collapsing two-layer image
// ===========================================================================

function Hero({
  images,
  scrollY,
}: {
  images: string[];
  scrollY: Animated.Value;
}) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const translateY = scrollY.interpolate({
    inputRange: [-200, 0, HERO_HEIGHT],
    outputRange: [0, 0, -HERO_HEIGHT * 0.45],
    extrapolate: 'clamp',
  });

  const scale = scrollY.interpolate({
    inputRange: [-200, 0, HERO_HEIGHT],
    outputRange: [1.3, 1, 1],
    extrapolate: 'clamp',
  });

  const overlayOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.5, HERO_HEIGHT],
    outputRange: [0, 0.3, 0.95],
    extrapolate: 'clamp',
  });

  const onHorizontalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== activeIndex) setActiveIndex(i);
  };

  const imgList = images.length > 0 ? images : [null]; // render black slab if no images

  return (
    <View style={[heroStyles.wrap, { backgroundColor: colors.void }]}>
      <Animated.View
        style={[
          heroStyles.inner,
          { transform: [{ translateY }, { scale }] },
        ]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onHorizontalScroll}
          scrollEventThrottle={16}
          scrollEnabled={imgList.length > 1}
          decelerationRate="fast"
          snapToInterval={SCREEN_W}
        >
          {imgList.map((img, i) => {
            if (!img) {
              return <View key={i} style={heroStyles.slide} />;
            }
            const optimized = getOptimizedUrl(img, IMAGE_SIZES.detail);
            return (
              <View key={i} style={heroStyles.slide}>
                {/* Ambient blur-fill bg */}
                <Image
                  source={{ uri: optimized }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  blurRadius={50}
                  recyclingKey={`${img}-bg`}
                />
                {/* Subtle darkening overlay so subject pops out of void */}
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: 'rgba(0, 0, 0, 0.35)' },
                  ]}
                />
                <Image
                  source={{ uri: optimized }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  transition={200}
                  recyclingKey={img}
                />
              </View>
            );
          })}
        </ScrollView>

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.void, opacity: overlayOpacity },
          ]}
        />
      </Animated.View>

      {imgList.length > 1 && (
        <View style={heroStyles.dots} pointerEvents="none">
          {imgList.map((_, i) => (
            <View
              key={i}
              style={[
                heroStyles.dot,
                { borderColor: colors.frostBorder },
                i === activeIndex && [heroStyles.dotActive, { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }],
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const heroStyles = StyleSheet.create({
  wrap: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  inner: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
  },
  slide: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
  },
  dots: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  dotActive: {
    width: 16,
  },
});

// ===========================================================================
// TOP CONTROLS — floating back + more, hide when compact header takes over
// ===========================================================================

function TopControls({
  onBack,
  onMore,
  insetTop,
  scrollY,
}: {
  onBack: () => void;
  onMore: () => void;
  insetTop: number;
  scrollY: Animated.Value;
}) {
  const { colors } = useTheme();
  const opacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.55, HERO_HEIGHT * 0.8],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        topControlsStyles.wrap,
        { paddingTop: insetTop + 8, opacity },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        style={[topControlsStyles.btn, { borderColor: colors.frostBorder }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={18} color={colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onMore}
        activeOpacity={0.7}
        style={[topControlsStyles.btn, { borderColor: colors.frostBorder }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MoreHorizontal size={18} color={colors.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const topControlsStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ===========================================================================
// COMPACT HEADER — sticky, appears on scroll
// ===========================================================================

function CompactHeader({
  title,
  thumbnail,
  scrollY,
  insetTop,
  onBack,
  onMore,
}: {
  title: string;
  thumbnail?: string;
  scrollY: Animated.Value;
  insetTop: number;
  onBack: () => void;
  onMore: () => void;
}) {
  const { colors } = useTheme();
  const opacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.6, HERO_HEIGHT * 0.9],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const translateY = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.6, HERO_HEIGHT * 0.9],
    outputRange: [-8, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        compactStyles.wrap,
        { paddingTop: insetTop, opacity, transform: [{ translateY }] },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          tint="dark"
          intensity={60}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.scrim },
          ]}
        />
      )}

      <View style={[compactStyles.border, { backgroundColor: colors.frostBorder }]} pointerEvents="none" />

      <View style={compactStyles.row}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={compactStyles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={compactStyles.center}>
          {thumbnail ? (
            <View style={[compactStyles.thumb, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
              <Image
                source={{ uri: getOptimizedUrl(thumbnail, IMAGE_SIZES.thumbnail) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
          ) : null}
          <Text style={[compactStyles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onMore}
          activeOpacity={0.7}
          style={compactStyles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const compactStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 45,
    overflow: 'hidden',
  },
  border: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
    flexShrink: 1,
  },
});

// ===========================================================================
// IDENTITY STRIP — state rail, title, collector+date
// ===========================================================================

function IdentityStrip({
  title,
  collectorName,
  collectorAvatar,
  listedAt,
  status,
  traits,
  onCollectorPress,
}: {
  title: string;
  collectorName: string;
  collectorAvatar: string | null;
  listedAt: string;
  status: ListingStatus;
  traits: string[];
  onCollectorPress?: () => void;
}) {
  const { colors } = useTheme();
  const initial = (collectorName || 'C').charAt(0).toUpperCase();

  return (
    <View style={identityStyles.wrap}>
      {/*
        State rail — status leads, traits follow. One unified "pills =
        current state of this object" row. Status always renders first so
        the eye catches transactional state (For Sale / NFST / etc.)
        before object qualities (Rookie / Autographed / Graded).
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={identityStyles.pillsRow}
      >
        <StatusPill status={status} inverted />
        {traits.map((key) => (
          <TraitPill key={key} traitKey={key} />
        ))}
      </ScrollView>

      <Text style={[identityStyles.title, { color: colors.textPrimary }]}>{title}</Text>

      <TouchableOpacity
        onPress={onCollectorPress}
        activeOpacity={0.6}
        style={identityStyles.collectorRow}
      >
        <View style={[identityStyles.avatar, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          {collectorAvatar ? (
            <Image
              source={{ uri: getOptimizedUrl(collectorAvatar, IMAGE_SIZES.thumbnail) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <Text style={[identityStyles.avatarInitial, { color: colors.textSecondary }]}>{initial}</Text>
          )}
        </View>
        <Text style={[identityStyles.collector, { color: colors.textSecondary }]} numberOfLines={1}>
          {collectorName}
        </Text>
        <Text style={[identityStyles.sep, { color: colors.textTertiary }]}>  ·  </Text>
        <Text style={[identityStyles.date, { color: colors.textSecondary }]}>{formatAddedOn(listedAt)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const identityStyles = StyleSheet.create({
  wrap: {
    paddingTop: 32,
    paddingBottom: 0,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.2,
    paddingHorizontal: SPACING.gutter,
  },
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.gutter,
    marginTop: 16,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarInitial: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  collector: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  sep: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  date: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  pillsRow: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: 0,
    paddingBottom: 16,
    gap: 8,
  },
});

// ===========================================================================
// STORY SECTION — description, no heading, no truncation
// ===========================================================================

function StorySection({ body }: { body: string }) {
  const { colors } = useTheme();
  return (
    <View style={storyStyles.wrap}>
      <Text style={[storyStyles.body, { color: colors.textPrimary }]}>{body}</Text>
    </View>
  );
}

const storyStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.gutter,
    marginTop: 32,
    marginBottom: 0,
  },
  body: {
    fontFamily: TYPE.inter,
    fontSize: 16,
    lineHeight: 25,
  },
});

// ===========================================================================
// SECTION + CARD + METADATA ROW
// ===========================================================================

function Section({
  kicker,
  children,
}: {
  kicker: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={sectionStyles.wrap}>
      <Text style={[sectionStyles.kicker, { color: colors.textSecondary }]}>{kicker}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    marginTop: 28,
  },
  kicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.gutter,
    marginBottom: SPACING.kickerGap,
  },
});

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  // Frame-less group: rows sit on the canvas, internal hairlines do the
  // structural work. Gives the schema + ledger lists an editorial, "data
  // forward" feel vs. the old boxed-card treatment.
  card: {
    marginHorizontal: SPACING.cardEdge,
    backgroundColor: 'transparent',
  },
});

/**
 * Verification ledger (Option A).
 * Frost-bordered card with a two-column header row (VERIFIED BY / CERT #)
 * and one row per authentication: semantic-green verified dot + company in
 * Inter-medium left, cert number in JetBrains Mono right. Hairline frost
 * dividers separate rows so it reads as a real data table, not a list.
 */
function AuthenticationsLedger({
  entries,
  style,
}: {
  entries: Authentication[];
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View style={[cardStyles.card, style]}>
      <View style={ledgerStyles.headerRow}>
        <Text style={[ledgerStyles.headerLabel, { color: colors.textTertiary }]}>VERIFIED BY</Text>
        <Text style={[ledgerStyles.headerLabel, { color: colors.textTertiary }]}>CERT #</Text>
      </View>
      <View style={[ledgerStyles.headerDivider, { backgroundColor: colors.frostBorder }]} />
      {entries.map((entry, i) => (
        <View
          key={i}
          style={[
            ledgerStyles.row,
            i < entries.length - 1 && [ledgerStyles.rowDivider, { borderBottomColor: colors.frostDivider }],
          ]}
        >
          <View style={ledgerStyles.leftCol}>
            <View style={[ledgerStyles.verifiedDot, { backgroundColor: colors.semanticGreen }]} />
            <Text style={[ledgerStyles.company, { color: colors.textPrimary }]} numberOfLines={1}>
              {entry.company || '—'}
            </Text>
          </View>
          <Text
            style={[ledgerStyles.certNumber, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {entry.number || '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const ledgerStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.rowPadX,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.rowPadX,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  company: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  certNumber: {
    fontFamily: TYPE.monoMedium,
    fontSize: 13,
    letterSpacing: 0.4,
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },
});

// ===========================================================================
// SPECS LENS — the existing Collectible Details / Authenticity Details
// / Verification Ledger cards, wrapped for the lens panel.
// ===========================================================================

function SpecsLens({
  collectibleDetailRows,
  authenticityDetailRows,
  authentications,
}: {
  collectibleDetailRows: Row[];
  authenticityDetailRows: Row[];
  authentications: Authentication[] | null;
}) {
  const hasAuthenticitySection =
    (authentications && authentications.length > 0) || authenticityDetailRows.length > 0;
  const hasAnything = collectibleDetailRows.length > 0 || hasAuthenticitySection;

  if (!hasAnything) {
    return <LensEmpty message="No specs available for this collectible." />;
  }

  return (
    <View>
      {collectibleDetailRows.length > 0 && (
        <Section kicker="COLLECTIBLE DETAILS">
          <Card>
            {collectibleDetailRows.map((row, i) => (
              <SchemaRow
                key={row.key}
                label={row.label}
                value={row.value}
                mono={row.kind === 'mono'}
                isLast={i === collectibleDetailRows.length - 1}
              />
            ))}
          </Card>
        </Section>
      )}

      {hasAuthenticitySection && (
        <Section kicker="AUTHENTICITY DETAILS">
          {authentications && authentications.length > 0 && (
            <AuthenticationsLedger
              entries={authentications}
              style={authenticityDetailRows.length > 0 ? { marginBottom: 10 } : undefined}
            />
          )}
          {authenticityDetailRows.length > 0 && (
            <Card>
              {authenticityDetailRows.map((row, i) => (
                <SchemaRow
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  mono={row.kind === 'mono'}
                  isLast={i === authenticityDetailRows.length - 1}
                />
              ))}
            </Card>
          )}
        </Section>
      )}
    </View>
  );
}

// ===========================================================================
// COMPS LENS — Option-B layout (designed against the eventual universal
// comp algorithm, data still stubbed pending migration cleanup).
//
// Three zones, top → bottom:
//   1. SUMMARY BAR      — diagnostic readout: COMPS · AVG MATCH · MEDIAN
//                         Same data-forward aesthetic as the Verification
//                         Ledger (no outer box, hairlines top/bottom,
//                         vertical dividers between cells).
//   2. GRID             — 2-col × 6-row = 12 comp cards. Each card:
//                         photo w/ listing-status dot overlay, match %
//                         (color-tiered to algorithm output tiers), price,
//                         2-line title. Cards are pure data — no chrome.
//   3. VIEW ALL FOOTER  — outlined pill w/ dynamic count, future route
//                         to dedicated comps screen (deferred).
//
// When the algorithm wires in (post-migration cleanup), MOCK_COMPS is
// replaced by a Supabase RPC call returning rows in this exact shape:
//   { id, photoUrl, title, subtitle, price, matchPct, status }.
// Nothing about the UI should need to change.
// ===========================================================================

type MockComp = {
  id: string;
  title: string;                                     // primary identity line
  subtitle: string;                                  // variant / year / set line
  price: number;                                     // USD
  matchPct: number;                                  // 0–100 match score
  status: ListingStatus;                             // listing status for dot
};

// Twelve Mike-Trout-adjacent placeholders spanning all three match tiers
// and all four listing statuses, with a median price engineered to land
// at $2,400 (see SUMMARY_STATS below).
const MOCK_COMPS: MockComp[] = [
  { id: '1',  title: 'Mike Trout',        subtitle: '2020 TTT Ruby /10',          price: 3200, matchPct: 98, status: 'FOR_SALE' },
  { id: '2',  title: 'Mike Trout',        subtitle: '2020 TTT Sapphire /25',      price: 2900, matchPct: 95, status: 'NFST'     },
  { id: '3',  title: 'Mike Trout',        subtitle: '2020 TTT Emerald /10',       price: 2750, matchPct: 93, status: 'FOR_TRADE'},
  { id: '4',  title: 'Mike Trout',        subtitle: '2019 TTT Ruby /10',          price: 2600, matchPct: 91, status: 'SELL_TRADE'},
  { id: '5',  title: 'Mike Trout',        subtitle: '2020 TTT Amethyst /50',      price: 2500, matchPct: 90, status: 'FOR_SALE' },
  { id: '6',  title: 'Mike Trout',        subtitle: '2020 TTT Onyx /25',          price: 2400, matchPct: 88, status: 'NFST'     },
  { id: '7',  title: 'Mike Trout',        subtitle: '2021 TTT Ruby /10',          price: 2400, matchPct: 87, status: 'FOR_SALE' },
  { id: '8',  title: 'Mike Trout',        subtitle: '2019 Bowman Chrome Gold /50',price: 2300, matchPct: 85, status: 'FOR_SALE' },
  { id: '9',  title: 'Mike Trout',        subtitle: '2020 Topps Gold Label /25',  price: 2200, matchPct: 83, status: 'FOR_TRADE'},
  { id: '10', title: 'Mike Trout',        subtitle: '2020 Chronicles Auto /99',   price: 2100, matchPct: 81, status: 'FOR_SALE' },
  { id: '11', title: 'Mike Trout',        subtitle: '2018 Immaculate Patch /25',  price: 1950, matchPct: 79, status: 'NFST'     },
  { id: '12', title: 'Mike Trout',        subtitle: '2022 Topps Chrome Red /5',   price: 1800, matchPct: 74, status: 'FOR_SALE' },
];

// Pre-computed stats shown in the SUMMARY BAR. In the live wiring these
// become server-computed fields on the RPC response (cheap to compute, no
// reason to recompute client-side on every render).
const SUMMARY_STATS = {
  totalCount: 24,                                    // full result-set size (grid shows top 12)
  avgMatch: 87,                                      // percentage integer
  medianPrice: 2400,                                 // USD integer
} as const;

// Grid geometry — static calc keeps card width predictable at screen width.
const { width: COMPS_SCREEN_W } = Dimensions.get('window');
const COMP_GRID_GAP = 10;                            // spacing.comp.grid.gap (x+y)
const COMP_CARD_WIDTH =
  (COMPS_SCREEN_W - SPACING.gutter * 2 - COMP_GRID_GAP) / 2;

function CompsLens() {
  const displayedCount = MOCK_COMPS.length;
  const totalCount = SUMMARY_STATS.totalCount;

  return (
    <View style={compsStyles.wrap}>
      <CompsSummaryBar
        totalCount={totalCount}
        avgMatch={SUMMARY_STATS.avgMatch}
        medianPrice={SUMMARY_STATS.medianPrice}
      />

      <View style={compsStyles.grid}>
        {MOCK_COMPS.map((comp) => (
          <CompCard key={comp.id} comp={comp} width={COMP_CARD_WIDTH} />
        ))}
      </View>

      {totalCount > displayedCount ? (
        <ViewAllFooter totalCount={totalCount} />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SUMMARY BAR — diagnostic readout, three cells separated by vertical
// hairlines. Top + bottom hairlines anchor it to the canvas without a box.
// ---------------------------------------------------------------------------

function CompsSummaryBar({
  totalCount,
  avgMatch,
  medianPrice,
}: {
  totalCount: number;
  avgMatch: number;
  medianPrice: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={[compsStyles.summaryWrap, { borderColor: colors.frostBorder }]}>
      <View style={compsStyles.summaryRow}>
        <StatCell label="COMPS" value={String(totalCount)} />
        <View style={[compsStyles.summaryDivider, { backgroundColor: colors.frostDivider }]} />
        <StatCell label="AVG MATCH" value={`${avgMatch}%`} />
        <View style={[compsStyles.summaryDivider, { backgroundColor: colors.frostDivider }]} />
        <StatCell label="MEDIAN" value={`$${medianPrice.toLocaleString()}`} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// VIEW ALL FOOTER — outlined pill, full width of the grid gutter. Dynamic
// label so the count always reflects the real total. Route wiring deferred.
// ---------------------------------------------------------------------------

function ViewAllFooter({ totalCount }: { totalCount: number }) {
  const { colors } = useTheme();
  return (
    <View style={compsStyles.footerWrap}>
      <Pressable
        onPress={() => Haptics.selectionAsync()}
        style={({ pressed }) => [
          compsStyles.footerBtn,
          { borderColor: colors.frostBorder },
          pressed && { backgroundColor: colors.pressOverlay },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View all ${totalCount} comps`}
      >
        <Text style={[compsStyles.footerBtnText, { color: colors.textSecondary }]}>
          VIEW ALL {totalCount} COMPS →
        </Text>
      </Pressable>
    </View>
  );
}

const compsStyles = StyleSheet.create({
  wrap: {
    paddingTop: 20,
    paddingBottom: 24,
  },

  summaryWrap: {
    marginHorizontal: SPACING.gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 18,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },

  grid: {
    paddingHorizontal: SPACING.gutter,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COMP_GRID_GAP,
    rowGap: 18,
  },

  footerWrap: {
    marginTop: 24,
    paddingHorizontal: SPACING.gutter,
  },
  footerBtn: {
    height: 48,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
  },
});

// ===========================================================================
// PRO UPSELL TEMPLATE — shared "Coming soon with Vitrine Pro" surface used
// by VAR / AAR / PULSE lenses while those reports are in development.
// When the reports ship and user is a subscriber, each lens will render
// its actual content instead. Per-lens accent color and blurb come from
// LENS_CONFIG.
// ===========================================================================

function ProUpsell({ lens }: { lens: LensConfigEntry }) {
  const { colors } = useTheme();
  const accent = lens.accent;
  return (
    <View style={upsellStyles.wrap}>
      <View style={upsellStyles.halo}>
        <View
          style={[upsellStyles.haloOuter, { backgroundColor: accent + '12' }]}
        />
        <View
          style={[upsellStyles.haloInner, { backgroundColor: accent + '1f' }]}
        />
        <View
          style={[
            upsellStyles.iconCircle,
            { backgroundColor: colors.sheetBg, borderColor: accent + '66' },
          ]}
        >
          <Lock size={22} color={accent} strokeWidth={2} />
        </View>
      </View>

      <Text style={[upsellStyles.kicker, { color: colors.textSecondary }]}>VITRINE PRO</Text>
      <Text style={[upsellStyles.title, { color: colors.textPrimary }]}>{lens.upsellTitle}</Text>
      {lens.upsellBlurb ? (
        <Text style={[upsellStyles.blurb, { color: colors.textSecondary }]}>{lens.upsellBlurb}</Text>
      ) : null}

      <View style={[upsellStyles.statusRow, { borderColor: colors.frostBorder, backgroundColor: colors.pressOverlay }]}>
        <View style={[upsellStyles.pulseDot, { backgroundColor: accent }]} />
        <Text style={[upsellStyles.statusText, { color: colors.textSecondary }]}>COMING SOON</Text>
      </View>
    </View>
  );
}

const upsellStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: SPACING.gutter + 12,
    paddingTop: 48,
    paddingBottom: 48,
  },
  halo: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  haloOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  haloInner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 2.0,
    marginBottom: 12,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 320,
  },
  blurb: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 340,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
});

// ===========================================================================
// LENS EMPTY STATE — used when a non-gated lens genuinely has nothing to
// show (e.g. SPECS for a collectible without ai_metadata or trait_metadata).
// Intentionally quiet — no upsell treatment.
// ===========================================================================

function LensEmpty({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={lensEmptyStyles.wrap}>
      <Text style={[lensEmptyStyles.text, { color: colors.textTertiary }]}>{message}</Text>
    </View>
  );
}

const lensEmptyStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 64,
    alignItems: 'center',
  },
  text: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    textAlign: 'center',
  },
});

// ===========================================================================
// DEV SUBSCRIBER TOGGLE — floating pill, __DEV__ only. Lets us flip between
// FREE / PRO states at runtime to sanity-check lens gating without wiring
// a real subscription context. Tucked bottom-left so it doesn't collide
// with the FloatingTrackBar or TopControls.
// ===========================================================================

function DevSubscriberToggle({
  isSubscriber,
  onToggle,
  insetBottom,
}: {
  isSubscriber: boolean;
  onToggle: () => void;
  insetBottom: number;
}) {
  const { colors } = useTheme();
  if (!__DEV__) return null;
  return (
    <Pressable
      onPress={onToggle}
      style={[
        devToggleStyles.pill,
        { bottom: insetBottom + 100, borderColor: colors.frostBorder, backgroundColor: colors.scrim },
        isSubscriber && [devToggleStyles.pillActive, { borderColor: colors.semanticGreenBorder }],
      ]}
      hitSlop={8}
      accessibilityLabel={
        isSubscriber ? 'Dev: currently Pro, tap to go Free' : 'Dev: currently Free, tap to go Pro'
      }
    >
      <View
        style={[
          devToggleStyles.dot,
          { backgroundColor: isSubscriber ? colors.semanticGreen : colors.textTertiary },
        ]}
      />
      <Text style={[devToggleStyles.label, { color: colors.textSecondary }]}>
        {isSubscriber ? 'PRO' : 'FREE'}
      </Text>
    </Pressable>
  );
}

const devToggleStyles = StyleSheet.create({
  pill: {
    position: 'absolute',
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
  },
  pillActive: {
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

// ===========================================================================
// DEV MODE TOGGLE — sandbox persona switcher
// ===========================================================================

function DevModeToggle({
  mode,
  onToggle,
  insetBottom,
}: {
  mode: 'owner' | 'visitor';
  onToggle: () => void;
  insetBottom: number;
}) {
  const { colors } = useTheme();
  if (!__DEV__) return null;
  const isOwner = mode === 'owner';
  return (
    <Pressable
      onPress={onToggle}
      style={[
        devToggleStyles.pill,
        { bottom: insetBottom + 140, borderColor: colors.frostBorder, backgroundColor: colors.scrim },
        isOwner && { borderColor: colors.semanticBlueBorder },
      ]}
      hitSlop={8}
      accessibilityLabel={
        isOwner
          ? 'Dev: currently viewing as owner, tap to switch to visitor'
          : 'Dev: currently viewing as visitor, tap to switch to owner'
      }
    >
      <View
        style={[
          devToggleStyles.dot,
          { backgroundColor: isOwner ? colors.semanticBlue : colors.semanticGreen },
        ]}
      />
      <Text style={[devToggleStyles.label, { color: colors.textSecondary }]}>
        {isOwner ? 'OWNER' : 'VISITOR'}
      </Text>
    </Pressable>
  );
}

// ===========================================================================
// BOTTOM ACTION BAR
//
// Replaces the single-CTA FloatingTrackBar with a persona-aware action rail.
// Icon-only on the right (per visual DNA: no labeled button chrome), price
// anchors the left. The primary commerce pill (visitor only) inherits its
// fill/border/icon from STATUS_CONFIG[status].action — color AND icon swap
// with listing intent (green $ for FOR_SALE, blue ⇄ for FOR_TRADE,
// orange 🤝 for SELL_TRADE, hidden for NFST).
// ===========================================================================

function BottomActionBar({
  price,
  mode,
  status,
  isTracking,
  onShare,
  onQR,
  onMessage,
  onTrackToggle,
  onBuyTrade,
  insetBottom,
}: {
  price: { symbol: string; amount: string } | null;
  mode: 'owner' | 'visitor';
  status: ListingStatus;
  isTracking: boolean;
  onShare: () => void;
  onQR: () => void;
  onMessage: () => void;
  onTrackToggle: () => void;
  onBuyTrade: () => void;
  insetBottom: number;
}) {
  const { colors } = useTheme();
  const statusConfig = STATUS_CONFIG[status];
  const commerceAction = statusConfig.action;                 // null = NFST → hide pill

  return (
    <View
      pointerEvents="box-none"
      style={[barStyles.wrap, { paddingBottom: Math.max(insetBottom, 12) }]}
    >
      {/*
        Solid black backdrop + hairline top border — matches the lens rail
        treatment, not the blur vocabulary. Sharper, more "instrument panel"
        than "soft glass," which is where the new DNA lives.
      */}
      <View style={[barStyles.backdrop, { backgroundColor: colors.void }]} pointerEvents="none" />
      <View style={[barStyles.topBorder, { backgroundColor: colors.frostBorder }]} pointerEvents="none" />

      <View style={barStyles.row}>
        {/* ─── Price (left anchor) ─── */}
        <View style={barStyles.priceBlock}>
          {price ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[barStyles.priceSym, { color: colors.textSecondary }]}>{price.symbol}</Text>
              <Text style={[barStyles.priceAmt, { color: colors.textPrimary }]}>{price.amount}</Text>
            </View>
          ) : (
            <Text style={[barStyles.priceMuted, { color: colors.textSecondary }]}>Not for sale</Text>
          )}
        </View>

        {/* ─── Action icons (right rail) ─── */}
        <View style={barStyles.actions}>
          {mode === 'owner' ? (
            <>
              <IconTap icon={Share2} onPress={onShare} label="Share" />
              <IconTap icon={QrCode} onPress={onQR} label="QR code" />
            </>
          ) : (
            <>
              <IconTap icon={Share2} onPress={onShare} label="Share" />
              <IconTap
                icon={MessageCircle}
                onPress={onMessage}
                label="Message collector"
              />
              <IconTap
                icon={Bookmark}
                onPress={onTrackToggle}
                label={isTracking ? 'Tracking — tap to untrack' : 'Track this collectible'}
                filled={isTracking}                             // IG-style toggle
              />
              {commerceAction && (
                <CommercePill
                  Icon={commerceAction.Icon}
                  label={commerceAction.label}
                  fill={statusConfig.fill}
                  border={statusConfig.border}
                  text={statusConfig.text}
                  onPress={onBuyTrade}
                />
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Plain icon button — ghost style, 44x44 tap target.
 * `filled` toggles the bookmark-style fill-in for Track.
 */
function IconTap({
  icon: Icon,
  onPress,
  label,
  filled = false,
}: {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  filled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        barStyles.iconBtn,
        pressed && { opacity: 0.55 },
      ]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon
        size={22}
        color={filled ? colors.textPrimary : colors.textSecondary}
        strokeWidth={1.75}
        fill={filled ? colors.textPrimary : 'transparent'}
      />
    </Pressable>
  );
}

/**
 * Commerce gateway pill — visitor-only, status-driven chrome.
 * Icon + fill + border + text color ALL inherit from STATUS_CONFIG[status].action.
 * Geometry matches statusPill exactly (same token family).
 */
function CommercePill({
  Icon,
  label,
  fill,
  border,
  text,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  fill: string;
  border: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        barStyles.commercePill,
        { backgroundColor: fill, borderColor: border },
        pressed && { opacity: 0.7 },
      ]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={20} color={text} strokeWidth={2} />
    </Pressable>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingTop: 12,
    minHeight: 56,
  },
  priceBlock: {
    flexShrink: 1,
  },
  priceSym: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    marginRight: 2,
  },
  priceAmt: {
    fontFamily: TYPE.monoMedium,
    fontSize: 22,
    letterSpacing: 0.2,
  },
  priceMuted: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commercePill: {
    minWidth: 56,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

// ===========================================================================
// ACTION SHEET — modal menu for owner + non-owner options
// ===========================================================================

function ActionSheet({
  visible,
  isOwner,
  onClose,
  onShare,
  onQR,
  onEdit,
  onDelete,
  onReport,
}: {
  visible: boolean;
  isOwner: boolean;
  onClose: () => void;
  onShare: () => void;
  onQR: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={[sheetStyles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose}>
        <Pressable
          style={[
            sheetStyles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[sheetStyles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
            <SheetRow
              icon={<QrCode size={20} color={colors.textPrimary} />}
              label="QR code"
              onPress={onQR}
              showDivider
            />
            <SheetRow
              icon={<Share2 size={20} color={colors.textPrimary} />}
              label="Share"
              onPress={onShare}
              showDivider={isOwner}
            />
            {isOwner && (
              <>
                <SheetRow
                  icon={<Pencil size={20} color={colors.textPrimary} />}
                  label="Edit collectible"
                  onPress={onEdit}
                  showDivider
                />
                <SheetRow
                  icon={<Trash2 size={20} color={colors.semanticRed} />}
                  label="Delete"
                  tone="danger"
                  onPress={onDelete}
                />
              </>
            )}
            {!isOwner && (
              <SheetRow
                icon={<Flag size={20} color={colors.semanticRed} />}
                label="Report a problem"
                tone="danger"
                onPress={onReport}
              />
            )}
          </View>

          <TouchableOpacity
            style={[sheetStyles.cancel, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[sheetStyles.cancelText, { color: colors.textPrimary }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetRow({
  icon,
  label,
  onPress,
  showDivider,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
  tone?: 'danger';
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[sheetStyles.row, showDivider && [sheetStyles.rowDivider, { borderBottomColor: colors.frostDivider }]]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={sheetStyles.rowIcon}>{icon}</View>
      <Text
        style={[
          sheetStyles.rowLabel,
          { color: colors.textPrimary },
          tone === 'danger' && { color: colors.semanticRed },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: TYPE.inter,
    fontSize: 15,
  },
  cancel: {
    marginTop: 8,
    height: 56,
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
});

// ===========================================================================
// ROOT STYLES
// ===========================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  notFound: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
});
