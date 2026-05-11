import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import type { Attachment } from 'stream-chat';

import { useTheme, RADII, TYPE } from '@/lib/design';
import { type ListingStatus } from '@/lib/status-utils';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';
import { AdaptiveImage } from '@/components/adaptive-image';
import { getCollectible } from '@/lib/api/collectibles';
import { getShowcaseById } from '@/lib/api/showcases';
import { StatusPill, TraitPill } from '@/components/vault';
import { formatPrice, normalizeTraitKey } from '@/components/collectibles';

/**
 * Format a Crown-Jewel-style cataloged-on date label, e.g. "MAR 28 2025".
 * Inlined here (rather than imported from collector-profile) because that
 * helper is private to the profile screen; this is the same idea but
 * scoped to message attachments.
 */
function formatCatalogDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

/**
 * In-message attachments for vitrine objects (collectibles + showcases).
 *
 * Collectible card uses the Crown Jewel layout — horizontal split with a
 * framed 5:7 portrait photo on the left and the meta stack (status, title,
 * traits, price) on the right, capped by a slim cataloged-on rail. The
 * holographic frame from the profile-screen Crown Jewel is intentionally
 * dropped: too expensive to amortize across a virtualized message list.
 *
 * Showcase card uses the 3-up tile collage standardized for showcase
 * previews (ShowcaseSpatialCard / FeaturedShowcase / ShowcaseListCard).
 *
 * Both shells share the same near-black surface + frostBorder outline so
 * they read as the same family inside the thread. Tapping either routes
 * to its detail screen.
 */

interface VitrineAttachmentProps extends Attachment {}

// 280pt fits comfortably inside the 75% bubble width on every modern
// iPhone (390pt+ screen) and gives the horizontal Crown Jewel split room
// to breathe without the title cramming.
const CARD_WIDTH = 280;

export function VitrineAttachment(props: VitrineAttachmentProps) {
  if (props.type === 'collectible' && props.collectible_id) {
    return <ChatCollectibleCard collectibleId={props.collectible_id as string} />;
  }
  if (props.type === 'showcase' && props.showcase_id) {
    return <ChatShowcaseCard showcaseId={props.showcase_id as string} />;
  }
  return null;
}

export function isVitrineAttachment(attachment: Attachment): boolean {
  return attachment.type === 'collectible' || attachment.type === 'showcase';
}

// ════════════════════════════════════════════════════════════════
// COLLECTIBLE CARD
// ════════════════════════════════════════════════════════════════

interface CollectibleData {
  title: string;
  photo: string | null;
  value: number | null;
  status: ListingStatus;
  traits: string[];
  createdAt: string;
}

// Trait pills can blow out the info column on long chips; cap to keep the
// row in a single 1–2 line band.
const MAX_TRAITS_IN_CHAT_CARD = 3;

export function ChatCollectibleCard({ collectibleId }: { collectibleId: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<CollectibleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollectible(collectibleId)
      .then((c) => {
        if (c) {
          const s: ListingStatus =
            c.availableForSale && c.availableForTrade
              ? 'SELL_TRADE'
              : c.availableForSale
                ? 'FOR_SALE'
                : c.availableForTrade
                  ? 'FOR_TRADE'
                  : 'NFST';
          setData({
            title: c.title,
            photo: c.photos?.[0] || null,
            value: c.value ?? null,
            status: s,
            traits: (c.traits ?? []).slice(0, MAX_TRAITS_IN_CHAT_CARD),
            createdAt: c.createdAt,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [collectibleId]);

  if (loading) {
    return <View style={[cardS.shell, { borderColor: colors.frostBorder }, cardS.skeleton, { backgroundColor: colors.sheetBg }]} />;
  }
  if (!data) {
    return (
      <View style={[cardS.shell, { borderColor: colors.frostBorder }, cardS.unavailable]}>
        <Text style={[cardS.unavailableText, { color: colors.textSecondary }]}>ITEM UNAVAILABLE</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[cardS.shell, { borderColor: colors.frostBorder }]}
      onPress={() => router.push(`/collectible/${collectibleId}` as Href)}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={`Open collectible ${data.title}`}
    >
      <View style={[cardS.main, { borderBottomColor: colors.frostDivider }]}>
        <View style={[cardS.photoFrame, { borderColor: colors.frostBorderStrong, backgroundColor: colors.void }]}>
          {data.photo ? (
            <AdaptiveImage
              uri={getOptimizedUrl(data.photo, IMAGE_SIZES.detail)}
              targetAspectRatio={5 / 7}
              style={[cardS.photo, { backgroundColor: colors.void }]}
            />
          ) : (
            <View style={[cardS.photo, { backgroundColor: colors.void }, cardS.photoFallback, { backgroundColor: colors.sheetBg }]}>
              <Text style={[cardS.photoFallbackText, { color: colors.textTertiary }]}>NO PHOTO</Text>
            </View>
          )}
        </View>

        <View style={cardS.info}>
          <View style={cardS.metaTop}>
            <StatusPill status={data.status} />
          </View>

          <Text style={[cardS.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {data.title}
          </Text>

          {data.traits.length > 0 ? (
            <View style={cardS.traitRow}>
              {data.traits.map((t) => (
                <TraitPill key={t} traitKey={normalizeTraitKey(t)} />
              ))}
            </View>
          ) : null}

          <Text style={[cardS.price, { color: colors.textPrimary }]} numberOfLines={1}>
            {formatPrice(data.value)}
          </Text>
        </View>
      </View>

      <View style={cardS.rail}>
        <Text style={[cardS.railLabel, { color: colors.textTertiary }]}>CATALOGED ON</Text>
        <Text style={[cardS.railDot, { color: colors.textTertiary }]}>·</Text>
        <Text style={[cardS.railValue, { color: colors.textSecondary }]}>{formatCatalogDate(data.createdAt)}</Text>
        <View style={cardS.railSpacer} />
        <ChevronRight size={12} color={colors.textTertiary} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const cardS = StyleSheet.create({
  shell: {
    width: CARD_WIDTH,
    borderRadius: RADII.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(3, 8, 12, 0.96)',
    borderWidth: 1,
    marginVertical: 4,
  },
  skeleton: {
    height: 200,
  },
  unavailable: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.35,
  },

  main: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  photoFrame: {
    width: 100,
    aspectRatio: 5 / 7,
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },

  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    paddingVertical: 1,
    gap: 8,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  title: {
    fontFamily: TYPE.groteskBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    fontFamily: TYPE.monoMedium,
    fontSize: 18,
    letterSpacing: -0.2,
  },

  rail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  railLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  railDot: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
  },
  railValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  railSpacer: {
    flex: 1,
  },
});

// ════════════════════════════════════════════════════════════════
// SHOWCASE CARD
// ════════════════════════════════════════════════════════════════
//
// Uses the 3-up tile collage DNA we standardized for showcase previews
// (ShowcaseSpatialCard, FeaturedShowcase, ShowcaseListCard, dossier).
// Three 4:5 framed tiles stacked horizontally, then a tight info plate.

interface ShowcaseData {
  title: string;
  images: string[];
  itemCount: number;
  totalValue: string;
}

export function ChatShowcaseCard({ showcaseId }: { showcaseId: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShowcaseById(showcaseId)
      .then((s) => {
        if (s) {
          setData({
            title: s.title,
            images: s.images || [],
            itemCount: s.stats.totalItems,
            totalValue: s.stats.totalValue,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [showcaseId]);

  if (loading) {
    return <View style={[showS.shell, { borderColor: colors.frostBorder }, showS.skeleton, { backgroundColor: colors.sheetBg }]} />;
  }
  if (!data) {
    return (
      <View style={[showS.shell, { borderColor: colors.frostBorder }, showS.unavailable]}>
        <Text style={[showS.unavailableText, { color: colors.textSecondary }]}>SHOWCASE UNAVAILABLE</Text>
      </View>
    );
  }

  const slots = [data.images[0] ?? null, data.images[1] ?? null, data.images[2] ?? null];

  return (
    <TouchableOpacity
      style={[showS.shell, { borderColor: colors.frostBorder }]}
      activeOpacity={0.86}
      onPress={() => router.push(`/showcase/${showcaseId}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`Open showcase ${data.title}`}
    >
      <View style={showS.tileRow}>
        {slots.map((uri, i) => (
          <View key={i} style={[showS.tile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
            {uri ? (
              <Image
                source={{ uri: getOptimizedUrl(uri, IMAGE_SIZES.thumbnail) }}
                style={showS.tileImage}
                contentFit="cover"
              />
            ) : null}
          </View>
        ))}
      </View>

      <View style={showS.infoPlate}>
        <Text style={[showS.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {data.title}
        </Text>
        <View style={showS.metaRow}>
          <Text style={[showS.metaCount, { color: colors.textSecondary }]}>
            {data.itemCount} {data.itemCount === 1 ? 'ITEM' : 'ITEMS'}
          </Text>
          <View style={[showS.metaDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[showS.metaValue, { color: colors.textPrimary }]}>{data.totalValue}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const showS = StyleSheet.create({
  shell: {
    width: CARD_WIDTH,
    borderRadius: RADII.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(3, 8, 12, 0.96)',
    borderWidth: 1,
    marginVertical: 4,
  },
  skeleton: {
    height: 180,
  },
  unavailable: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.35,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  infoPlate: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 6,
  },
  title: {
    fontFamily: TYPE.groteskBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 1.0,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  metaValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
