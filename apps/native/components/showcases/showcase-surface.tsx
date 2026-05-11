import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';

import { formatPrice, type CollectionViewMode } from '@/components/collectibles';
import { ViewModeSelector } from '@/components/collectibles/view-mode-selector';
import { HolographicFrame, SearchBar } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import type { UserShowcase } from '@/lib/api/showcases';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUTTER = SPACING.zoneIntra;
const GRID_GAP = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GUTTER * 2 - GRID_GAP) / 2;

// ════════════════════════════════════════════════════════════════
// SHOWCASE COLLAGE
// ════════════════════════════════════════════════════════════════

function ShowcaseCollage({
  images,
  style,
}: {
  images: string[];
  style?: object;
}) {
  const { colors } = useTheme();
  const img0 = images[0];
  const img1 = images[1];
  const img2 = images[2];
  return (
    <View style={[{ flexDirection: 'row', overflow: 'hidden' }, style]}>
      <Image source={{ uri: img0 }} style={{ flex: 2, marginRight: 2 }} contentFit="cover" />
      <View style={{ flex: 1, gap: 2 }}>
        {img1 ? (
          <Image source={{ uri: img1 }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.sheetBg }} />
        )}
        {img2 ? (
          <Image source={{ uri: img2 }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.sheetBg }} />
        )}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// SHOWCASE GRID CARD
// ════════════════════════════════════════════════════════════════

export function ShowcaseGridCard({
  showcase,
  compact = false,
  onPress,
}: {
  showcase: UserShowcase;
  compact?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[scS.gridCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, compact && scS.gridCardCompact]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <ShowcaseCollage
        images={showcase.images}
        style={{ aspectRatio: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      />
      <View style={scS.gridCardBottom}>
        <Text style={[scS.gridCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{showcase.title}</Text>
        <View style={scS.gridCardMeta}>
          <Text style={[scS.gridCardSub, { color: colors.textSecondary }]}>{showcase.items} items</Text>
          <Text style={[scS.gridCardValue, { color: colors.textPrimary }]}>{formatPrice(showcase.totalValue)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════
// SHOWCASE SPATIAL CARD
// ════════════════════════════════════════════════════════════════

export function ShowcaseSpatialCard({
  showcase,
  onPress,
}: {
  showcase: UserShowcase;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const slots = [showcase.images[0] ?? null, showcase.images[1] ?? null, showcase.images[2] ?? null];
  return (
    <TouchableOpacity style={[scS.spatialCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]} onPress={onPress} activeOpacity={0.86}>
      <View style={scS.spatialTileRow}>
        {slots.map((uri, i) => (
          <View key={i} style={[scS.spatialTile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
            {uri ? (
              <Image source={{ uri }} style={scS.spatialTileImage} contentFit="cover" />
            ) : null}
          </View>
        ))}
      </View>
      <View style={scS.spatialBottom}>
        <View>
          <Text style={[scS.spatialTitle, { color: colors.textPrimary }]} numberOfLines={1}>{showcase.title}</Text>
          <Text style={[scS.spatialItems, { color: colors.textSecondary }]}>{showcase.items} items</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[scS.spatialEstLabel, { color: colors.textSecondary }]}>EST. VALUE</Text>
          <Text style={[scS.spatialValue, { color: colors.textPrimary }]}>{formatPrice(showcase.totalValue)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════
// SHOWCASE LIST CARD
// ════════════════════════════════════════════════════════════════

export function ShowcaseListCard({
  showcase,
  onPress,
}: {
  showcase: UserShowcase;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const slots = [showcase.images[0] ?? null, showcase.images[1] ?? null, showcase.images[2] ?? null];
  return (
    <TouchableOpacity style={[scS.listCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]} onPress={onPress} activeOpacity={0.86}>
      <View style={scS.listTileRow}>
        {slots.map((uri, i) => (
          <View key={i} style={[scS.listTile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
            {uri ? (
              <Image source={{ uri }} style={scS.listTileImage} contentFit="cover" />
            ) : null}
          </View>
        ))}
      </View>
      <View style={scS.listMeta}>
        <View style={scS.listTopRow}>
          <Text style={[scS.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>{showcase.title}</Text>
          <Text style={[scS.listValue, { color: colors.textPrimary }]}>{formatPrice(showcase.totalValue)}</Text>
        </View>
        <Text style={[scS.listSub, { color: colors.textSecondary }]}>{showcase.items} items</Text>
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════
// SHOWCASE SURFACE
// ════════════════════════════════════════════════════════════════

export interface ShowcaseSurfaceProps {
  showcases: UserShowcase[];
  viewMode: CollectionViewMode;
  onViewModeChange: (mode: CollectionViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  featuredShowcaseId?: string | null;
  onOpenShowcase: (id: string) => void;
  isOwner?: boolean;
  onCreateShowcase?: () => void;
  hideViewModeSelector?: boolean;
  searchPlaceholder?: string;
  contentPaddingBottom?: number;
  contentPaddingTop?: number;
}

export function ShowcaseSurface({
  showcases,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  featuredShowcaseId,
  onOpenShowcase,
  isOwner = false,
  onCreateShowcase,
  hideViewModeSelector = false,
  searchPlaceholder = 'Search showcases…',
  contentPaddingBottom = 100,
  contentPaddingTop = 24,
}: ShowcaseSurfaceProps) {
  const { colors } = useTheme();
  const searched = searchQuery
    ? showcases.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : showcases;

  const showCreateCta = isOwner && Boolean(onCreateShowcase);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.void }}
      contentContainerStyle={{ paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={toolbarStyles.outer}>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <View style={toolbarStyles.controlsRow}>
          {showCreateCta ? (
            <Pressable
              onPress={onCreateShowcase}
              accessibilityRole="button"
              accessibilityLabel="Create showcase"
              style={({ pressed }) => [
                toolbarStyles.createBtn,
                { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                pressed && { backgroundColor: colors.pressOverlay },
              ]}
            >
              <Plus size={14} color={colors.textPrimary} />
              <Text style={[toolbarStyles.createBtnText, { color: colors.textPrimary }]}>CREATE SHOWCASE</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {hideViewModeSelector ? null : (
            <ViewModeSelector value={viewMode} onChange={onViewModeChange} />
          )}
        </View>
      </View>

      {viewMode === 'grid' && (
        <View style={scS.grid}>
          {searched.map((sc) => {
            const isFeatured = sc.id === featuredShowcaseId;
            const card = (
              <ShowcaseGridCard
                showcase={sc}
                compact={isFeatured}
                onPress={() => onOpenShowcase(sc.id)}
              />
            );
            return isFeatured ? (
              <HolographicFrame key={sc.id} borderRadius={12} intensity="subtle" style={{ width: GRID_ITEM_WIDTH }}>
                {card}
              </HolographicFrame>
            ) : (
              <React.Fragment key={sc.id}>{card}</React.Fragment>
            );
          })}
        </View>
      )}

      {viewMode === 'spatial' && (
        <View style={scS.spatialList}>
          {searched.map((sc) => {
            const isFeatured = sc.id === featuredShowcaseId;
            const card = <ShowcaseSpatialCard showcase={sc} onPress={() => onOpenShowcase(sc.id)} />;
            return isFeatured ? (
              <HolographicFrame key={sc.id} borderRadius={16} intensity="subtle">
                {card}
              </HolographicFrame>
            ) : (
              <React.Fragment key={sc.id}>{card}</React.Fragment>
            );
          })}
        </View>
      )}

      {viewMode === 'list' && (
        <View style={scS.listWrap}>
          {searched.map((sc) => {
            const isFeatured = sc.id === featuredShowcaseId;
            const card = <ShowcaseListCard showcase={sc} onPress={() => onOpenShowcase(sc.id)} />;
            return isFeatured ? (
              <HolographicFrame key={sc.id} borderRadius={12} intensity="subtle">
                {card}
              </HolographicFrame>
            ) : (
              <React.Fragment key={sc.id}>{card}</React.Fragment>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const toolbarStyles = StyleSheet.create({
  outer: {
    paddingHorizontal: GUTTER,
    marginBottom: 14,
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginRight: 10,
    paddingVertical: 10,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  createBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
});

const scS = StyleSheet.create({
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: GUTTER,
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridCardCompact: {
    width: GRID_ITEM_WIDTH - 2,
    borderWidth: 0,
  },
  gridCardBottom: {
    padding: 10,
    gap: 4,
  },
  gridCardTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 13,
  },
  gridCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridCardSub: {
    fontFamily: TYPE.inter,
    fontSize: 10,
  },
  gridCardValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
  },

  // Spatial
  spatialList: {
    paddingHorizontal: GUTTER,
    gap: 32,
  },
  spatialCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  spatialTileRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  spatialTile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  spatialTileImage: {
    width: '100%',
    height: '100%',
  },
  spatialBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  spatialTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 15,
  },
  spatialItems: {
    fontFamily: TYPE.inter,
    fontSize: 11,
    marginTop: 2,
  },
  spatialEstLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
  },
  spatialValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 15,
    marginTop: 2,
  },

  // List
  listWrap: {
    paddingHorizontal: GUTTER,
    gap: 8,
  },
  listCard: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  listTileRow: {
    flexDirection: 'row',
    gap: 4,
    height: 48,
  },
  listTile: {
    height: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listTileImage: {
    width: '100%',
    height: '100%',
  },
  listMeta: {
    flex: 1,
    gap: 4,
  },
  listTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 13,
    flex: 1,
  },
  listValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 12,
    marginLeft: 8,
  },
  listSub: {
    fontFamily: TYPE.inter,
    fontSize: 10,
  },
});
