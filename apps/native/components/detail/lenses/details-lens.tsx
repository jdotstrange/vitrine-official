import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { StatusPill, TraitPill } from '@/components/vault';
import { FramedHero } from '@/components/detail/framed-hero';
import { useTheme, SPACING, TYPE, type ListingStatus } from '@/lib/design';
import { formatAddedOn } from '@/lib/format-time';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';

/**
 * DETAILS lens — the "experience this object" surface.
 *
 * Replaces the legacy full-bleed `CollapsingHero` model with a *framed*
 * hero that lives **inside** this lens. The selector is the top chrome
 * (above), so the hero no longer competes with the analytical surfaces;
 * it's now the visual anchor of DETAILS specifically — and absent from
 * SPECS / PULSE / AAR / VAR / COMPS.
 *
 * Content order (top → bottom):
 *   1. Hero frame  — 4:5 photo well sitting in a 16pt gutter so void
 *                    black wraps the imagery. Pagination dots beneath
 *                    when there are multiple photos.
 *   2. Identity    — title (heroDisplay), status + trait pill row,
 *                    collector handle (tappable on visitor view), LISTED
 *                    kicker + date.
 *   3. Story       — listing description / collector's brief.
 *   4. AI metas    — explicit empty zone reserved for future AI surfaces
 *                    (rarity, story intelligence, collection-context
 *                    blurb). DETAILS is the home for AI-generated meta
 *                    content; locking that placement now keeps future
 *                    work additive instead of architectural.
 *
 * Owns its own ScrollView so the parent pager just hands us a panel.
 * Bottom inset accounts for the universal `DetailActionDock`.
 */

export interface DetailsLensProps {
  images: string[];
  title: string;
  status: ListingStatus;
  /** Trait *keys* (e.g. 'is_autographed') — TraitPill resolves chrome. */
  traitKeys: string[];
  /**
   * Display name for the collector. Visible in both visitor and owner
   * states; visitor view makes it tappable.
   */
  collectorName: string;
  /** Optional avatar URL for the collector. */
  collectorAvatar?: string | null;
  /** Owner viewing their own item — disables the collector tap. */
  isOwner: boolean;
  /** Listing/added-at timestamp. ISO string or epoch ms. */
  listedAt: Date | string | number;
  /** Collector listing description / story. */
  description?: string | null;
  /** Tap on the collector handle (visitor view only). */
  onCollectorPress?: () => void;
  /** Bottom safe-area inset; reserves dock clearance. */
  bottomInset: number;
  /** Reserved height of the floating dock — added to scroll padding. */
  dockReservedHeight: number;
}

export function DetailsLens({
  images,
  title,
  status,
  traitKeys,
  collectorName,
  collectorAvatar,
  isOwner,
  listedAt,
  description,
  onCollectorPress,
  bottomInset,
  dockReservedHeight,
}: DetailsLensProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + dockReservedHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <FramedHero images={images} />

      <View style={styles.identityWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          <StatusPill status={status} inverted />
          {traitKeys.map((key) => (
            <TraitPill key={key} traitKey={key} />
          ))}
        </ScrollView>

        <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
          {title}
        </Text>

        <CollectorRow
          name={collectorName}
          avatar={collectorAvatar ?? null}
          isOwner={isOwner}
          listedAt={listedAt}
          onPress={onCollectorPress}
        />
      </View>

      {description ? (
        <View style={styles.storyWrap}>
          <Text style={[styles.story, { color: colors.textPrimary }]}>{description}</Text>
        </View>
      ) : null}

      {/* AI metas room — DETAILS is the canonical home for AI-generated
          meta content (rarity score, story intelligence, contextual
          blurbs). Future surfaces append into this section without
          rewriting the lens. Intentionally empty in V1. */}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// COLLECTOR ROW — owner shows muted "in your collection" line; visitor
// shows tappable handle + chevron pattern.
// ---------------------------------------------------------------------------

function CollectorRow({
  name,
  avatar,
  isOwner,
  listedAt,
  onPress,
}: {
  name: string;
  avatar: string | null;
  isOwner: boolean;
  listedAt: Date | string | number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const initial = (name || 'C').charAt(0).toUpperCase();
  const date = formatAddedOn(listedAt);

  const inner = (
    <>
      <View style={[styles.avatar, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        {avatar ? (
          <Image
            source={{ uri: getOptimizedUrl(avatar, IMAGE_SIZES.thumbnail) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>{initial}</Text>
        )}
      </View>
      <Text style={[styles.collectorMuted, { color: colors.textSecondary }]} numberOfLines={1}>
        {isOwner ? 'In your collection' : `Collected by ${name}`}
      </Text>
      <Text style={[styles.collectorSep, { color: colors.textTertiary }]}>·</Text>
      <Text style={[styles.collectorDate, { color: colors.textSecondary }]}>{date}</Text>
    </>
  );

  if (isOwner) {
    return <View style={styles.collectorRow}>{inner}</View>;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={styles.collectorRow}
      accessibilityRole="button"
      accessibilityLabel={`View ${name}'s profile`}
    >
      {inner}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },

  // Identity ------------------------------------------------------------
  identityWrap: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneCluster,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0.4,
    marginTop: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.zoneIntra,
    gap: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  collectorMuted: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    flexShrink: 1,
  },
  collectorSep: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  collectorDate: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // Story ---------------------------------------------------------------
  storyWrap: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneCluster,
  },
  story: {
    fontFamily: TYPE.inter,
    fontSize: 16,
    lineHeight: 25,
  },
});
