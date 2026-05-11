/**
 * TrackingCompsLens — blended comparable-sales across the tracked portfolio.
 *
 * Adapted from detail/lenses/comps-lens.tsx but sourced from the
 * get_tracked_comps RPC instead of a single-collectible query. Each result
 * carries a source attribution ("comp for [tracked item title]") so the user
 * understands which tracked item triggered the match.
 *
 * The CompRow component is replicated here (same visual contract as the
 * single-item CompsLens) with a source attribution line added below the title.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { MatchPercent, StatusDot } from '@/components/vault';
import { useTheme, COLORS, RADII, SPACING, TYPE } from '@/lib/design';
import { LensEmpty } from '@/components/detail/lenses/lens-empty';
import { getCompTierLabel, type CompTierLabel, type TrackedCompItem } from '@/lib/api/comps';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';
import { useTrackedComps } from '@/hooks/use-tracked-comps';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const ROW_THUMB_SIZE = 72;

const TIER_COLOR: Record<CompTierLabel, string> = {
  'Strong match': COLORS.textPrimary,
  'Close match': COLORS.textSecondary,
  Similar: COLORS.textTertiary,
  'Similar range': COLORS.textTertiary,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrackingCompsLensProps {
  userId: string | undefined;
  bottomPadding: number;
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function TrackedCompRow({ item, isLast }: { item: TrackedCompItem; isLast: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const tier = getCompTierLabel(item);
  const matchPct = Math.round(item.scoreFraction * 100);
  const subtitle = formatRowSubtitle(item);
  const photoUri = item.image ? getOptimizedUrl(item.image, IMAGE_SIZES.thumbnail) : null;

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
        <Text style={[styles.sourceAttribution, { color: colors.textTertiary }]} numberOfLines={1}>
          comp for {item.sourceTitle}
        </Text>
        <Text style={[styles.tier, { color: TIER_COLOR[tier] }]}>
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

function formatRowSubtitle(item: TrackedCompItem): string {
  const parts = [item.subcategory, item.category]
    .filter((s): s is string => !!s && s.trim() !== '')
    .map((s) => s.replace(/_/g, ' '));
  return parts.length ? parts.join(' · ') : '';
}

// ---------------------------------------------------------------------------
// Main lens
// ---------------------------------------------------------------------------

export function TrackingCompsLens({ userId, bottomPadding }: TrackingCompsLensProps) {
  const { colors } = useTheme();
  const { items, loading, error, refetch } = useTrackedComps(userId, 30);
  const hasFallback = items.some((i) => i.valueFallback);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.textSecondary}
        />
      }
    >
      <View style={styles.kickerWrap}>
        <Text style={[styles.kicker, { color: colors.textSecondary }]}>MARKET COMPS</Text>
        <Text style={[styles.subKicker, { color: colors.textTertiary }]}>
          {loading
            ? 'Scanning the market…'
            : items.length > 0
              ? `${items.length} match${items.length === 1 ? '' : 'es'} across your tracked portfolio`
              : 'No matches found'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      ) : error ? (
        <View style={styles.bodyWrap}>
          <LensEmpty
            kicker="COMPS"
            title="COULD NOT LOAD COMPS"
            message="Something went wrong fetching comparable sales. Pull down to retry."
          />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.bodyWrap}>
          <LensEmpty
            kicker="COMPS"
            title="NO COMPS YET"
            message="No comparable sales found across your tracked portfolio. Check back as the network grows."
          />
        </View>
      ) : (
        <>
          {hasFallback ? (
            <Text style={[styles.fallbackNote, { color: colors.textTertiary }]}>
              Some results show similar value range — no exact trait matches found.
            </Text>
          ) : null}

          <View style={styles.list}>
            {items.map((item, i) => (
              <TrackedCompRow key={item.id} item={item} isLast={i === items.length - 1} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
  },

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
  fallbackNote: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    paddingHorizontal: SPACING.gutter,
    marginBottom: 12,
    lineHeight: 16,
  },

  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  bodyWrap: {
    marginTop: 16,
    paddingHorizontal: SPACING.gutter,
  },

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

  metaCol: {
    flex: 1,
    gap: 3,
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
  sourceAttribution: {
    fontFamily: TYPE.inter,
    fontSize: 11,
    fontStyle: 'italic',
  },
  tier: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.0,
    marginTop: 1,
  },

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
});
