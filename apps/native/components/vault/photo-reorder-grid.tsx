/**
 * PhotoReorderGrid — canonical multi-photo reorder primitive (V3 DNA).
 *
 * The single source of truth for every "user can drag photos into the
 * order they want" surface in the app. Built on
 * `react-native-reanimated-dnd@^2.0.0` (SortableGrid). Future consumers
 * (Upload Lane batch surface, multi-image bug reports, etc.) should
 * consume this primitive rather than reach for the underlying library
 * directly — keeps the lift/shuffle/cover/haptic behavior in lockstep
 * across surfaces and avoids the drift class that produced the DFL
 * crash chain in May 2026.
 *
 * Cross-platform discipline:
 *   - No `shadowColor` / `elevation` anywhere. The lift visual is an
 *     inner glow + brandVolt-tinted border, which renders identically
 *     on iOS dark/light AND Android dark/light. Drop shadows are
 *     unreliable across themes (invisible on dark backgrounds, require
 *     platform branching). The "no shadows" rule is intentional.
 *   - Spring physics live on the UI thread via Reanimated worklets.
 *     Identical timing on both platforms.
 *
 * Visual contract (V3 default config):
 *   - 3-column vertical grid with 10px gaps
 *   - Tile aspect ratio 4:5 (slightly taller than wide; matches the
 *     V3 upload surface). Consumers can override via `aspectRatio` prop.
 *   - Long-press 220ms lifts a single tile to scale 1.12 with a 6%
 *     white inner glow and a brandVolt border (1px -> 2px). Other
 *     tiles shuffle aside via the library's Insert strategy.
 *   - COVER badge re-anchors to whichever photo is currently at live
 *     grid index 0 during a drag (preview-the-decision affordance).
 *   - Remove-X is disabled (opacity 0.4, untappable) while any tile is
 *     in drag state.
 *   - "+" add-photo sentinel renders OUTSIDE the SortableGrid as an
 *     absolutely-positioned sibling; not draggable, not a drop target.
 *
 * Haptics:
 *   - Drag start: selectionAsync (subtle)
 *   - Each placeholder reshuffle: impactAsync(Light)
 *   - Drop: impactAsync(Medium)
 *
 * If you're updating this file, also update the consumers list in
 * [docs/ai-context/DO_NOT_BREAK.md] — breaking the prop interface
 * cascades to every multi-photo reorder surface.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ImagePlus, X } from 'lucide-react-native';
import {
  GridOrientation,
  GridStrategy,
  SortableGrid,
  SortableGridItem,
  type GridPositions,
  type SortableGridRenderItemProps,
} from 'react-native-reanimated-dnd';

import { useTheme, RADII, TYPE } from '@/lib/design';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PhotoAsset = { id: string; uri: string };

export interface PhotoReorderGridProps {
  /** Photo data to render, in current display order. */
  photos: PhotoAsset[];
  /** Fired with the new ordering after a successful drop. */
  onReorder: (next: PhotoAsset[]) => void;
  /** Fired when the user taps the X on a photo tile. */
  onRemove: (id: string) => void;
  /**
   * Fired when the user taps the "+" sentinel. Omit to hide the
   * sentinel entirely (read-only or full-capacity surfaces).
   */
  onAddMore?: () => void;
  /** Max photo slots. Sentinel hides at this count. Default: 6. */
  maxPhotos?: number;
  /** Column count. Default: 3. */
  columns?: number;
  /**
   * Tile width-to-height ratio. Default: 4/5 (slightly taller than
   * wide, matches V3 upload aesthetic). Pass 1 for square.
   */
  aspectRatio?: number;
  /** Horizontal/vertical gap between tiles in px. Default: 10. */
  gap?: number;
  /** Whether to render the COVER badge on the live-position-0 tile. Default: true. */
  showCoverBadge?: boolean;
  /** Freeze all interactions (drag, remove, add). Default: false. */
  disabled?: boolean;
  /** Optional wrapper style (margin, padding, etc.). */
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoReorderGrid({
  photos,
  onReorder,
  onRemove,
  onAddMore,
  maxPhotos = 6,
  columns = 3,
  aspectRatio = 4 / 5,
  gap = 10,
  showCoverBadge = true,
  disabled = false,
  style,
}: PhotoReorderGridProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  // Drag-state coordination across tiles. liftedItemId drives the lift
  // visual (scale, glow, border) on the active tile, and gates the
  // remove-X disabled state on every tile.
  const liftedItemId = useSharedValue<string | null>(null);
  const isAnyDragActive = useDerivedValue(() => liftedItemId.value !== null);

  // Compute per-tile dimensions from measured container width. Falls
  // back to a sane default (100px square-ish) before onLayout fires.
  const tileWidth = containerWidth > 0
    ? (containerWidth - gap * (columns - 1)) / columns
    : 100;
  const tileHeight = tileWidth / aspectRatio;

  const canAddMore = onAddMore !== undefined && photos.length < maxPhotos;

  // SortableGridItem snapshots its slot position on first render, and the
  // reaction that would correct it bails on the undefined -> value transition.
  // So a photo appended to an already-mounted grid initializes at {x:0, y:0}
  // and stays stacked on the cover tile — the photo is in state but invisible.
  // Remounting the grid whenever the photo SET changes gives every item a
  // populated position map to read from. Sorted ids keep a reorder (same set,
  // new order) from remounting mid-spring, which the library handles itself.
  const gridKey = useMemo(
    () => photos.map((p) => p.id).sort().join('|'),
    [photos],
  );

  // Compute total content height so the outer wrapper sizes itself
  // correctly, leaving room for the sentinel "+" in the next slot.
  const totalSlots = photos.length + (canAddMore ? 1 : 0);
  const rowCount = Math.max(1, Math.ceil(totalSlots / columns));
  const contentHeight = rowCount * tileHeight + (rowCount - 1) * gap;

  // Sentinel position math: the "+" goes in the slot immediately after
  // the last photo. (photos.length % columns) gives column index;
  // floor(photos.length / columns) gives row index.
  const sentinelRow = Math.floor(photos.length / columns);
  const sentinelCol = photos.length % columns;
  const sentinelTop = sentinelRow * (tileHeight + gap);
  const sentinelLeft = sentinelCol * (tileWidth + gap);

  // Commit handler — derives the new photo order from the library's
  // positions map and fires the parent's onReorder if order actually
  // changed. The library calls onDrop with the FINAL positions object.
  const handleDrop = useCallback(
    (_id: string, _index: number, allPositions?: GridPositions) => {
      // Reset the lift state and fire the medium drop haptic.
      liftedItemId.value = null;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      if (!allPositions) return;
      // Sort photos by their new position index, mapping back to the
      // original photo objects.
      const reordered: PhotoAsset[] = [];
      const photosById = new Map(photos.map((p) => [p.id, p]));
      const entries = Object.entries(allPositions).sort(
        ([, a], [, b]) => a.index - b.index,
      );
      for (const [id] of entries) {
        const photo = photosById.get(id);
        if (photo) reordered.push(photo);
      }
      const unchanged =
        reordered.length === photos.length &&
        reordered.every((p, i) => p.id === photos[i]?.id);
      if (!unchanged) onReorder(reordered);
    },
    [liftedItemId, photos, onReorder],
  );

  const handleDragStart = useCallback(
    (id: string) => {
      liftedItemId.value = id;
      Haptics.selectionAsync().catch(() => {});
    },
    [liftedItemId],
  );

  const handleMove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // -------------------------------------------------------------------------
  // Per-tile renderer
  // -------------------------------------------------------------------------

  const renderItem = useCallback(
    (itemProps: SortableGridRenderItemProps<PhotoAsset>) => (
      <PhotoTile
        key={itemProps.id}
        itemProps={itemProps}
        liftedItemId={liftedItemId}
        isAnyDragActive={isAnyDragActive}
        colors={colors}
        showCoverBadge={showCoverBadge}
        disabled={disabled}
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        onRemove={onRemove}
        onDragStart={handleDragStart}
        onMove={handleMove}
        onDrop={handleDrop}
      />
    ),
    [
      liftedItemId,
      isAnyDragActive,
      colors,
      showCoverBadge,
      disabled,
      tileWidth,
      tileHeight,
      onRemove,
      handleDragStart,
      handleMove,
      handleDrop,
    ],
  );

  // Stable item key so the library doesn't churn shared values when
  // photos arrive/leave by other ids.
  const keyExtractor = useCallback((item: PhotoAsset) => item.id, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Capture the available width once so the SortableGrid can be sized
  // explicitly. Re-render after onLayout to mount the grid with real
  // dimensions.
  const onContainerLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      const width = event.nativeEvent.layout.width;
      if (width > 0 && width !== containerWidth) {
        setContainerWidth(width);
      }
    },
    [containerWidth],
  );

  return (
    <View
      onLayout={onContainerLayout}
      style={[
        { height: contentHeight, position: 'relative' },
        disabled && { opacity: 0.5 },
        style,
      ]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      {containerWidth > 0 && photos.length > 0 ? (
        <SortableGrid
          key={gridKey}
          data={photos}
          renderItem={renderItem}
          itemKeyExtractor={keyExtractor}
          orientation={GridOrientation.Vertical}
          strategy={GridStrategy.Insert}
          scrollEnabled={false}
          dimensions={{
            columns,
            itemWidth: tileWidth,
            itemHeight: tileHeight,
            columnGap: gap,
            rowGap: gap,
          }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}

      {canAddMore && containerWidth > 0 ? (
        <Pressable
          onPress={onAddMore}
          style={[
            styles.addTile,
            {
              top: sentinelTop,
              left: sentinelLeft,
              width: tileWidth,
              height: tileHeight,
              borderColor: colors.frostBorderStrong,
              backgroundColor: colors.sheetBg,
              borderRadius: RADII.medium,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Add photo. ${maxPhotos - photos.length} of ${maxPhotos} slots remaining.`}
        >
          <ImagePlus size={20} color={colors.textTertiary} strokeWidth={1.6} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PhotoTile — internal renderer for each draggable tile.
// ---------------------------------------------------------------------------

interface PhotoTileProps {
  itemProps: SortableGridRenderItemProps<PhotoAsset>;
  liftedItemId: SharedValue<string | null>;
  isAnyDragActive: SharedValue<boolean>;
  colors: ReturnType<typeof useTheme>['colors'];
  showCoverBadge: boolean;
  disabled: boolean;
  tileWidth: number;
  tileHeight: number;
  onRemove: (id: string) => void;
  onDragStart: (id: string) => void;
  onMove: () => void;
  onDrop: (id: string, index: number, allPositions?: GridPositions) => void;
}

function PhotoTile({
  itemProps,
  liftedItemId,
  isAnyDragActive,
  colors,
  showCoverBadge,
  disabled,
  tileWidth,
  tileHeight,
  onRemove,
  onDragStart,
  onMove,
  onDrop,
}: PhotoTileProps) {
  const { item, id, positions } = itemProps;

  // Lift visual. Reads liftedItemId on the UI thread; when this tile
  // is the lifted one, scale springs to 1.12, glow opacity fades in,
  // and the border thickens to a brandVolt-tinted 2px. When unlifted,
  // everything returns to rest. The library's default 1.05 scale +
  // black shadow are OVERRIDDEN here — see header comment for why.
  const liftScaleStyle = useAnimatedStyle(() => {
    const lifted = liftedItemId.value === id;
    return {
      transform: [
        {
          scale: withSpring(lifted ? 1.12 : 1, {
            damping: 18,
            stiffness: 220,
          }),
        },
      ],
      // Kill the library's default drop shadow on iOS so it can't
      // contradict the cross-platform "no shadow" rule.
      shadowOpacity: 0,
    };
  }, [id]);

  const glowStyle = useAnimatedStyle(() => {
    const lifted = liftedItemId.value === id;
    return {
      opacity: withTiming(lifted ? 1 : 0, { duration: 120 }),
    };
  }, [id]);

  const borderStyle = useAnimatedStyle(() => {
    const lifted = liftedItemId.value === id;
    return {
      borderColor: lifted ? colors.brandVolt : colors.frostBorder,
      borderWidth: withTiming(lifted ? 2 : 1, { duration: 120 }),
    };
  }, [id, colors.brandVolt, colors.frostBorder]);

  // COVER badge re-anchors to the live position-0 tile. When the user
  // drags a tile across the grid, items shuffle and `positions[id].index`
  // changes. Read directly off the shared value; useAnimatedStyle
  // tracks the dependency and re-runs on the UI thread.
  const coverBadgeStyle = useAnimatedStyle(() => {
    const myIndex = positions.value[id]?.index ?? -1;
    return {
      opacity: withTiming(myIndex === 0 ? 1 : 0, { duration: 150 }),
    };
  }, [id]);

  // Remove-X opacity + tappability gated on any drag being active.
  const removeXStyle = useAnimatedStyle(() => {
    const dragActive = isAnyDragActive.value;
    return {
      opacity: withTiming(dragActive ? 0.4 : 1, { duration: 120 }),
    };
  });

  // Because pointerEvents isn't animatable through useAnimatedStyle,
  // we drive it via the lifted state with a JS-thread mirror. This
  // is fine — the prop only matters when a drag actually fires.
  const [removeXDisabled, setRemoveXDisabled] = useState(false);

  const handleDragStartInternal = useCallback(
    (itemId: string) => {
      onDragStart(itemId);
      setRemoveXDisabled(true);
    },
    [onDragStart],
  );

  const handleDropInternal = useCallback(
    (itemId: string, index: number, allPositions?: GridPositions) => {
      onDrop(itemId, index, allPositions);
      setRemoveXDisabled(false);
    },
    [onDrop],
  );

  return (
    <SortableGridItem<PhotoAsset>
      {...itemProps}
      data={item}
      // useAnimatedStyle in Reanimated 4 returns an opaque
      // AnimatedStyleHandle, but the library's prop typing predates
      // that change and still expects StyleProp<ViewStyle>. Runtime
      // accepts both forms cleanly on Animated.View; the cast is
      // purely to satisfy the static type. Remove once the library
      // upstreams Reanimated 4 type support.
      animatedStyle={liftScaleStyle as StyleProp<ViewStyle>}
      activationDelay={220}
      onDragStart={handleDragStartInternal}
      onMove={onMove}
      onDrop={handleDropInternal}
    >
      <Animated.View
        style={[
          styles.tile,
          {
            width: tileWidth,
            height: tileHeight,
            backgroundColor: colors.sheetBg,
            borderRadius: RADII.medium,
          },
          borderStyle,
        ]}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.tileImage}
          contentFit="cover"
        />

        {/* Bottom gradient — preserves the V3 photo-tile darkening at
            the bottom-left where the COVER badge sits. */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.58)']}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Inner glow overlay — the cross-platform "lift" affordance.
            Subtle white-tint brightening that reads as elevation
            without depending on platform-specific shadows. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowOverlay,
            { borderRadius: RADII.medium },
            glowStyle,
          ]}
        />

        {/* Remove (X) button. Disabled while any tile is in drag state
            to prevent misfires. */}
        <Animated.View style={[styles.removeBadgeWrap, removeXStyle]}>
          <Pressable
            onPress={() => onRemove(id)}
            hitSlop={8}
            disabled={disabled || removeXDisabled}
            style={[styles.removeBadge, { borderColor: colors.frostBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <X size={12} color={colors.textPrimary} strokeWidth={2.5} />
          </Pressable>
        </Animated.View>

        {/* COVER badge — re-anchors live to whichever tile is at
            grid index 0. */}
        {showCoverBadge ? (
          <Animated.View
            style={[
              styles.coverBadge,
              {
                backgroundColor: colors.brandVoltFill,
                borderColor: colors.brandVoltBorder,
                borderRadius: RADII.pill,
              },
              coverBadgeStyle,
            ]}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.coverBadgeText,
                { color: colors.brandVolt },
              ]}
            >
              COVER
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </SortableGridItem>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    position: 'relative',
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  removeBadgeWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  removeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  coverBadgeText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  addTile: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
