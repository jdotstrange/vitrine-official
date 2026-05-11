/**
 * SpatialCard — immersive 1-column collectible card.
 *
 * The most expansive of the three collectible view modes ("spatial"). Hero
 * image fills a tall aspect with a gradient fade into meta overlayed at
 * the bottom — the same hero energy as the detail screen, scaled down to
 * a thumbnail. Meant for an immersive, scroll-slow read where each card
 * gets real estate and identity.
 *
 * Not a `GridCard` wrap because the meta layout is deliberately layered
 * over the image rather than stacked beneath it. That's a structural
 * difference worth owning its own shell.
 *
 * This component consumes `CollectibleCardData` — the shared shape used
 * by all three collectible view modes (spatial / grid / list) so the
 * same mapper feeds all three.
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Target } from 'lucide-react-native';

import { useTheme, DARK_COLORS, RADII, SPACING, TYPE } from '@/lib/design';
import { AdaptiveImage } from '@/components/adaptive-image';
import { StatusPill } from './status-pill';
import { TraitPill } from './trait-pill';
import { ViewCountBadge } from './view-count-badge';
import type { ListingStatus } from '@/lib/design';

export interface CollectibleCardData {
  id: string;
  photoUrl?: string | null;
  title: string;
  subtitle?: string | null;
  price?: string | null;
  status: ListingStatus;
  traits?: string[];
  trackingCount?: number;
  /**
   * Total view count from `view_counters`. The card decides whether to
   * render the badge (suppressed below the visibility floor inside the
   * `ViewCountBadge` primitive — never gate at the call site).
   */
  viewCount?: number;
  /**
   * Optional owner attribution — used by the Tracking surface so the
   * spatial card can show a small avatar overlay indicating whose item
   * this is. Grid and list cards stay clean; this only renders on Spatial.
   */
  ownerAvatar?: string | null;
  ownerName?: string | null;
}

export interface SpatialCardProps {
  item: CollectibleCardData;
  onPress?: () => void;
  onTrack?: () => void;
  onTrackToggle?: () => void;
  isTracked?: boolean;
  aspectRatio?: number;
  /**
   * Multi-select selection chrome. When true, the photo well gets a
   * brandVolt border ring. Mirrors the GridCard / ListCard pattern so
   * the same selection treatment reads consistently across view modes.
   */
  selected?: boolean;
}

const DOUBLE_TAP_DELAY_MS = 280;

export function SpatialCard({
  item,
  onPress,
  onTrack,
  onTrackToggle,
  isTracked = false,
  aspectRatio = 4 / 5,
  selected = false,
}: SpatialCardProps) {
  const { colors } = useTheme();
  const lastTapRef = React.useRef(0);
  const singleTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTrackBurst, setShowTrackBurst] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }
    };
  }, []);

  const showTrackConfirmation = () => {
    setShowTrackBurst(true);
    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }
    burstTimerRef.current = setTimeout(() => {
      setShowTrackBurst(false);
      burstTimerRef.current = null;
    }, 650);
  };

  const handlePress = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < DOUBLE_TAP_DELAY_MS;
    lastTapRef.current = now;

    if (isDoubleTap && onTrack) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (!isTracked) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showTrackConfirmation();
        onTrack();
      } else {
        Haptics.selectionAsync();
      }
      return;
    }

    if (!onPress) return;
    singleTapTimerRef.current = setTimeout(() => {
      Haptics.selectionAsync();
      onPress();
      singleTapTimerRef.current = null;
    }, DOUBLE_TAP_DELAY_MS);
  };

  const handleTrackingBadgePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (isTracked) {
      Haptics.selectionAsync();
      onTrackToggle?.();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showTrackConfirmation();
    (onTrackToggle ?? onTrack)?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress && !onTrack}
      accessibilityRole="button"
      accessibilityLabel={[item.title, item.price]
        .filter(Boolean)
        .join(', ')}
      accessibilityState={{ selected }}
      style={styles.wrap}
    >
      <View style={[styles.photo, { aspectRatio }, selected && { borderWidth: 2, borderColor: colors.brandVolt }]}>
        {item.photoUrl ? (
          <AdaptiveImage
            uri={item.photoUrl}
            targetAspectRatio={aspectRatio}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderMark, { color: colors.textTertiary }]}>—</Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.78)', 'rgba(0, 0, 0, 0.95)']}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <LinearGradient
          colors={['rgba(0, 0, 0, 0.72)', 'rgba(0, 0, 0, 0.28)', 'transparent']}
          locations={[0, 0.55, 1]}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {typeof item.trackingCount === 'number' ? (
          <Pressable
            onPress={handleTrackingBadgePress}
            disabled={!onTrack && !onTrackToggle}
            style={[
              styles.trackingBadge,
              { borderColor: DARK_COLORS.frostBorder },
              isTracked && { borderColor: DARK_COLORS.traitOliveBorder, backgroundColor: DARK_COLORS.traitOliveFill },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isTracked ? 'Untrack collectible' : 'Track collectible'}
          >
            <Target
              size={13}
              color={isTracked ? DARK_COLORS.traitOlive : DARK_COLORS.textSecondary}
              fill={isTracked ? DARK_COLORS.traitOlive : 'none'}
            />
            <Text style={[styles.trackingNumber, { color: DARK_COLORS.textPrimary }]}>{item.trackingCount.toLocaleString()}</Text>
            <Text style={[styles.trackingLabel, { color: DARK_COLORS.textSecondary }]}>TRACKING</Text>
          </Pressable>
        ) : null}

        {item.viewCount ? (
          <ViewCountBadge count={item.viewCount} style={styles.viewBadge} />
        ) : null}

        {(item.ownerAvatar || item.ownerName) ? (
          <View style={styles.ownerBadge}>
            {item.ownerAvatar ? (
              <Image
                source={{ uri: item.ownerAvatar }}
                style={[styles.ownerAvatar, { backgroundColor: colors.sheetBg }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.ownerAvatar, { backgroundColor: colors.sheetBg }, styles.ownerAvatarFallback]}>
                <Text style={[styles.ownerAvatarInitial, { color: colors.textTertiary }]}>
                  {(item.ownerName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {showTrackBurst ? (
          <View style={[styles.trackBurst, { borderColor: DARK_COLORS.traitOliveBorder }]} pointerEvents="none">
            <Target size={42} color={DARK_COLORS.traitOlive} fill={DARK_COLORS.traitOlive} />
            <Text style={[styles.trackBurstText, { color: DARK_COLORS.textPrimary }]}>TRACKING</Text>
          </View>
        ) : null}

        <View style={styles.meta}>
          <View style={styles.badgeRow}>
            <StatusPill status={item.status} />
            {item.traits?.map((trait) => (
              <TraitPill key={trait} traitKey={trait} />
            ))}
          </View>
          <View style={styles.metaTop}>
            <Text style={[styles.title, { color: DARK_COLORS.textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.price ? (
              <Text style={[styles.price, { color: DARK_COLORS.textPrimary }]} numberOfLines={1}>
                {item.price}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  photo: {
    borderRadius: RADII.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderMark: {
    fontFamily: TYPE.mono,
    fontSize: 48,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '28%',
  },
  viewBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  ownerBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  ownerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  ownerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarInitial: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
  },
  trackingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trackingNumber: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.3,
  },
  trackingLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.0,
  },
  trackBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  trackBurstText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  meta: {
    position: 'absolute',
    left: SPACING.zoneIntra,
    right: SPACING.zoneIntra,
    bottom: SPACING.zoneIntra,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  price: {
    fontFamily: TYPE.mono,
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
