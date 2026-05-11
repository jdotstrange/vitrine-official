import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { MatchPercent, StatusDot } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { STATUS_CONFIG, deriveStatus, type ListingStatus } from '@/lib/design/status-config';
import { useComps } from '@/hooks/use-comps';
import {
  getCompTierLabel,
  type CompItem,
  type CompTierLabel,
} from '@/lib/api/comps';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';

import { LensEmpty } from './lens-empty';

/**
 * COMPS lens — comparable sales for the active collectible.
 *
 * Two render states beyond loading / error / empty:
 *
 *   STRONG MATCHES — items with scoreFraction >= STRONG_COMP_THRESHOLD.
 *     Rendered uncapped. Header reads "{n} strong match(es)".
 *
 *   FALLBACK ONLY — when no strong matches exist but the RPC backstopped
 *     with valueFallback items. Rendered capped at FALLBACK_RENDER_CAP
 *     so the "best we could do" message stays short and not buried in
 *     adjacent noise. Header explains the fallback explicitly (Realtor-
 *     style: "no direct matches — showing similar value range").
 *
 * Empty / loading / error all use the shared `LensEmpty` shell.
 *
 * Tuning knobs:
 *   - STRONG_COMP_THRESHOLD — quality floor for "real" comps. 0.75 lines
 *     up with `getCompTierLabel`'s "Strong match" tier, so the lens and
 *     the per-item label tell the same story.
 *   - FETCH_LIMIT — upper bound on what the RPC returns; threshold
 *     filtering happens client-side after the fetch.
 *   - FALLBACK_RENDER_CAP — how many fallback items we surface in the
 *     no-strong-matches state.
 */

const STRONG_COMP_THRESHOLD = 0.75;
const FETCH_LIMIT = 50;
const FALLBACK_RENDER_CAP = 6;

const ROW_THUMB_SIZE = 72;

export interface CompsLensProps {
  collectibleId: string | undefined;
  collectibleTitle: string;
  bottomInset: number;
  dockReservedHeight: number;
}

type StatusFilter = 'ALL' | ListingStatus;

const STATUS_FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'FOR_SALE', label: STATUS_CONFIG.FOR_SALE.label },
  { key: 'FOR_TRADE', label: STATUS_CONFIG.FOR_TRADE.label },
  { key: 'SELL_TRADE', label: STATUS_CONFIG.SELL_TRADE.label },
  { key: 'NFST', label: STATUS_CONFIG.NFST.label },
];

export function CompsLens({
  collectibleId,
  bottomInset,
  dockReservedHeight,
}: CompsLensProps) {
  const { colors } = useTheme();
  const { items, loading, error } = useComps(collectibleId, FETCH_LIMIT);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { strongItems, fallbackItems } = useMemo(() => {
    const strong = items.filter(
      (i) => !i.valueFallback && i.scoreFraction >= STRONG_COMP_THRESHOLD,
    );
    const fallback = items.filter((i) => i.valueFallback);
    return { strongItems: strong, fallbackItems: fallback };
  }, [items]);

  const baseItems = strongItems.length > 0
    ? strongItems
    : fallbackItems.slice(0, FALLBACK_RENDER_CAP);

  const renderItems = useMemo(() => {
    if (statusFilter === 'ALL') return baseItems;
    return baseItems.filter((item) => {
      const itemStatus = deriveStatus(item.availableForSale, item.availableForTrade);
      return itemStatus === statusFilter;
    });
  }, [baseItems, statusFilter]);

  const showFallbackHeader = strongItems.length === 0 && fallbackItems.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + dockReservedHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.kickerWrap}>
        <Text style={[styles.kicker, { color: colors.textSecondary }]}>COMPARABLE SALES</Text>
        <Text style={[styles.subKicker, { color: colors.textTertiary }]}>
          {loading
            ? 'Searching the market…'
            : showFallbackHeader
              ? 'No direct matches — showing similar value range'
              : strongItems.length > 0
                ? `${strongItems.length} strong match${strongItems.length === 1 ? '' : 'es'}`
                : 'No matches yet'}
        </Text>
      </View>

      {!loading && !error && baseItems.length > 0 && (
        <StatusFilterRail
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      ) : error ? (
        <View style={styles.bodyWrap}>
          <LensEmpty
            kicker="COMPS"
            title="COULD NOT LOAD COMPS"
            message="Something went wrong fetching comparable sales. Pull to retry from the screen above."
          />
        </View>
      ) : renderItems.length === 0 ? (
        <View style={styles.bodyWrap}>
          <LensEmpty
            kicker="COMPS"
            title="NO COMPS YET"
            message="No comparable sales found in the network. Check back as the collection grows."
          />
        </View>
      ) : (
        <View style={styles.list}>
          {renderItems.map((item, i) => (
            <CompRow key={item.id} item={item} isLast={i === renderItems.length - 1} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// COMPACT LIST ROW — image · meta · price + match%
// ---------------------------------------------------------------------------

function CompRow({ item, isLast }: { item: CompItem; isLast: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const tier = getCompTierLabel(item);
  const matchPct = Math.round(item.scoreFraction * 100);
  const subtitle = formatRowSubtitle(item);
  const photoUri = item.image
    ? getOptimizedUrl(item.image, IMAGE_SIZES.thumbnail)
    : null;

  const tierColor: Record<CompTierLabel, string> = {
    'Strong match': colors.textPrimary,
    'Close match': colors.textSecondary,
    Similar: colors.textTertiary,
    'Similar range': colors.textTertiary,
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(`/collectible/${item.id}` as Href);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        !isLast && [styles.rowDivider, { borderBottomColor: colors.frostDivider }],
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${tier}, $${item.value}`}
    >
      <View style={[styles.thumbWrap, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            recyclingKey={item.image}
          />
        ) : (
          <Text style={[styles.thumbPlaceholder, { color: colors.textTertiary }]}>—</Text>
        )}
        <View style={styles.thumbStatus}>
          <StatusDot status={item.status} variant="overlay" />
        </View>
      </View>

      <View style={styles.metaCol}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textTertiary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={[styles.tier, { color: tierColor[tier] }]}>
          {tier.toUpperCase()}
        </Text>
      </View>

      <View style={styles.priceCol}>
        {item.value > 0 ? (
          <Text style={[styles.price, { color: colors.textPrimary }]}>${Math.round(item.value).toLocaleString()}</Text>
        ) : (
          <Text style={[styles.priceMuted, { color: colors.textTertiary }]}>—</Text>
        )}
        {matchPct > 0 && !item.valueFallback ? (
          <View style={styles.matchWrap}>
            <MatchPercent pct={matchPct} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatRowSubtitle(item: CompItem): string {
  const parts = [item.subcategory, item.category]
    .filter((s): s is string => !!s && s.trim() !== '')
    .map((s) => s.replace(/_/g, ' '));
  return parts.length ? parts.join(' · ') : '';
}

// ---------------------------------------------------------------------------
// STATUS FILTER RAIL — single-select chip row colored by STATUS_CONFIG
// ---------------------------------------------------------------------------

function StatusFilterRail({
  selected,
  onSelect,
}: {
  selected: StatusFilter;
  onSelect: (s: StatusFilter) => void;
}) {
  const { colors } = useTheme();

  const handlePress = (key: StatusFilter) => {
    Haptics.selectionAsync();
    onSelect(key === selected ? 'ALL' : key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRailContent}
      style={styles.filterRailScroll}
    >
      {STATUS_FILTER_OPTIONS.map(({ key, label }) => {
        const active = selected === key;
        const isStatusKey = key !== 'ALL';
        const cfg = isStatusKey ? STATUS_CONFIG[key as ListingStatus] : null;

        return (
          <Pressable
            key={key}
            onPress={() => handlePress(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            hitSlop={4}
            style={[
              styles.filterChip,
              active && isStatusKey && cfg
                ? { backgroundColor: cfg.fill, borderColor: cfg.border }
                : active && !isStatusKey
                  ? { backgroundColor: colors.brandVoltFill, borderColor: colors.brandVoltBorder }
                  : { borderColor: colors.frostBorder },
            ]}
          >
            {isStatusKey && cfg && (
              <View style={[styles.filterDot, { backgroundColor: cfg.dot }]} />
            )}
            <Text
              style={[
                styles.filterLabel,
                active && isStatusKey && cfg
                  ? { color: cfg.text }
                  : active
                    ? { color: colors.textPrimary }
                    : { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
  },

  // Header --------------------------------------------------------------
  kickerWrap: {
    paddingHorizontal: SPACING.gutter,
    marginBottom: SPACING.zoneCluster - 8,
    gap: 4,
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  subKicker: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },

  // Empty / loading -----------------------------------------------------
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  bodyWrap: {
    marginTop: 16,
    paddingHorizontal: SPACING.gutter,
  },

  // List ----------------------------------------------------------------
  list: {
    paddingHorizontal: SPACING.gutter,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.7,
  },

  // Thumbnail -----------------------------------------------------------
  thumbWrap: {
    width: ROW_THUMB_SIZE,
    height: ROW_THUMB_SIZE,
    borderRadius: RADII.small,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbStatus: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  thumbPlaceholder: {
    fontFamily: TYPE.mono,
    fontSize: 22,
  },

  // Meta col ------------------------------------------------------------
  metaCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  tier: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.0,
    marginTop: 2,
  },

  // Price col -----------------------------------------------------------
  priceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontFamily: TYPE.monoMedium,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  priceMuted: {
    fontFamily: TYPE.mono,
    fontSize: 14,
  },
  matchWrap: {
    alignItems: 'flex-end',
  },

  // Status filter rail ---------------------------------------------------
  filterRailScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterRailContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
