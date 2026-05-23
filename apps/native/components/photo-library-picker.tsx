/**
 * PhotoLibraryPicker — custom in-app photo grid that replaces the native
 * UIImagePickerController / PHPickerViewController. Uses expo-media-library
 * to query the camera roll directly, rendering thumbnails in a performant
 * FlatList grid with multi-select support.
 *
 * This bypasses the native picker entirely, avoiding the expo-notifications
 * delegate conflict that causes the native picker Promise to hang for
 * iCloud-optimized or HEIC assets.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, X } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const PAGE_SIZE = 60;

interface PhotoLibraryPickerProps {
  visible: boolean;
  maxSelection: number;
  onSelect: (uris: string[]) => void;
  onClose: () => void;
}

interface AlbumOption {
  id: string;
  title: string;
  assetCount: number;
}

export function PhotoLibraryPicker({
  visible,
  maxSelection,
  onSelect,
  onClose,
}: PhotoLibraryPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const endCursorRef = useRef<string | undefined>(undefined);

  // Albums
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<AlbumOption | null>(null);
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false);

  // Request permission on open
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      if (status === 'granted') {
        loadAlbums();
      }
    })();
  }, [visible]);

  // Reset state when closing
  useEffect(() => {
    if (!visible) {
      setAssets([]);
      setSelectedIds(new Set());
      setHasMore(true);
      endCursorRef.current = undefined;
      setActiveAlbum(null);
      setAlbumPickerOpen(false);
    }
  }, [visible]);

  // Load initial assets when permission granted or album changes
  useEffect(() => {
    if (!visible || permissionStatus !== 'granted') return;
    setAssets([]);
    setHasMore(true);
    endCursorRef.current = undefined;
    loadAssets(true);
  }, [visible, permissionStatus, activeAlbum]);

  async function loadAlbums() {
    try {
      const smartAlbums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });
      const mapped: AlbumOption[] = smartAlbums
        .filter((a) => a.assetCount > 0)
        .sort((a, b) => b.assetCount - a.assetCount)
        .slice(0, 20)
        .map((a) => ({ id: a.id, title: a.title, assetCount: a.assetCount }));
      setAlbums(mapped);
    } catch {
      // Silently ignore — album list is optional
    }
  }

  async function loadAssets(reset = false) {
    if (loading) return;
    if (!reset && !hasMore) return;

    setLoading(true);
    try {
      const opts: MediaLibrary.AssetsOptions = {
        first: PAGE_SIZE,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
        ...(activeAlbum ? { album: activeAlbum.id } : {}),
        ...(!reset && endCursorRef.current ? { after: endCursorRef.current } : {}),
      };

      const result = await MediaLibrary.getAssetsAsync(opts);
      endCursorRef.current = result.endCursor;
      setHasMore(result.hasNextPage);

      if (reset) {
        setAssets(result.assets);
      } else {
        setAssets((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.warn('[PhotoLibraryPicker] Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleSelect = useCallback(
    (asset: MediaLibrary.Asset) => {
      Haptics.selectionAsync();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) {
          next.delete(asset.id);
        } else if (next.size < maxSelection) {
          next.add(asset.id);
        }
        return next;
      });
    },
    [maxSelection],
  );

  const handleConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Get the local URIs for selected assets
    const selected = assets.filter((a) => selectedIds.has(a.id));
    const uris: string[] = [];

    for (const asset of selected) {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(asset, { shouldDownloadFromNetwork: true });
        if (info.localUri) {
          uris.push(info.localUri);
        } else if (info.uri) {
          uris.push(info.uri);
        }
      } catch {
        // If individual asset fails, skip it rather than blocking all
        console.warn('[PhotoLibraryPicker] Failed to get URI for asset:', asset.id);
      }
    }

    if (uris.length > 0) {
      onSelect(uris);
    }
    onClose();
  }, [selectedIds, assets, onSelect, onClose]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadAssets(false);
    }
  }, [loading, hasMore]);

  const selectedArray = useMemo(
    () => Array.from(selectedIds),
    [selectedIds],
  );

  const renderItem = useCallback(
    ({ item }: { item: MediaLibrary.Asset }) => {
      const isSelected = selectedIds.has(item.id);
      const selectionIndex = isSelected ? selectedArray.indexOf(item.id) + 1 : 0;

      return (
        <Pressable
          onPress={() => handleToggleSelect(item)}
          style={styles.thumbContainer}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.thumb}
            contentFit="cover"
            recyclingKey={item.id}
            cachePolicy="memory-disk"
          />
          {isSelected && (
            <View style={[styles.selectedOverlay, { borderColor: colors.brandVolt }]}>
              <View style={[styles.selectionBadge, { backgroundColor: colors.brandVolt }]}>
                <Text style={[styles.selectionNumber, { color: colors.void }]}>
                  {selectionIndex}
                </Text>
              </View>
            </View>
          )}
          {!isSelected && selectedIds.size >= maxSelection && (
            <View style={styles.disabledOverlay} />
          )}
        </Pressable>
      );
    },
    [selectedIds, selectedArray, maxSelection, colors, handleToggleSelect],
  );

  const keyExtractor = useCallback((item: MediaLibrary.Asset) => item.id, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.void }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.frostBorder, paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 8 },
          ]}
        >
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <X size={22} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.albumSelector}
            onPress={() => albums.length > 0 && setAlbumPickerOpen(!albumPickerOpen)}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {activeAlbum?.title || 'Recents'}
            </Text>
            {albums.length > 0 && (
              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={selectedIds.size === 0}
            style={[
              styles.confirmBtn,
              { backgroundColor: selectedIds.size > 0 ? colors.brandVolt : colors.frostBorderStrong },
            ]}
            activeOpacity={0.8}
            accessibilityLabel={`Add ${selectedIds.size} photos`}
          >
            <Text
              style={[
                styles.confirmText,
                { color: selectedIds.size > 0 ? colors.void : colors.textTertiary },
              ]}
            >
              Add{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Album dropdown */}
        {albumPickerOpen && (
          <View style={[styles.albumDropdown, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
            <TouchableOpacity
              style={[styles.albumRow, !activeAlbum && { backgroundColor: colors.brandVoltFill }]}
              onPress={() => {
                setActiveAlbum(null);
                setAlbumPickerOpen(false);
              }}
            >
              <Text style={[styles.albumLabel, { color: colors.textPrimary }]}>Recents</Text>
              {!activeAlbum && <Check size={14} color={colors.brandVolt} strokeWidth={2.5} />}
            </TouchableOpacity>
            {albums.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[styles.albumRow, activeAlbum?.id === album.id && { backgroundColor: colors.brandVoltFill }]}
                onPress={() => {
                  setActiveAlbum(album);
                  setAlbumPickerOpen(false);
                }}
              >
                <Text style={[styles.albumLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                  {album.title}
                </Text>
                <Text style={[styles.albumCount, { color: colors.textTertiary }]}>
                  {album.assetCount}
                </Text>
                {activeAlbum?.id === album.id && <Check size={14} color={colors.brandVolt} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Permission denied state */}
        {permissionStatus === 'denied' && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Photo access needed
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Grant photo library access in Settings to select photos.
            </Text>
          </View>
        )}

        {/* Photo grid */}
        {permissionStatus === 'granted' && (
          <FlatList
            data={assets}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_data, index) => ({
              length: THUMB_SIZE + GRID_GAP,
              offset: (THUMB_SIZE + GRID_GAP) * Math.floor(index / NUM_COLUMNS),
              index,
            })}
            initialNumToRender={30}
            maxToRenderPerBatch={30}
            windowSize={7}
          />
        )}

        {/* Selection bar */}
        {selectedIds.size > 0 && (
          <View
            style={[
              styles.selectionBar,
              { backgroundColor: colors.sheetBg, borderTopColor: colors.frostBorder, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <Text style={[styles.selectionBarText, { color: colors.textSecondary }]}>
              {selectedIds.size} of {maxSelection} selected
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADII.small,
  },
  confirmText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 14,
  },
  albumDropdown: {
    borderBottomWidth: 1,
    maxHeight: 240,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  albumLabel: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
    flex: 1,
  },
  albumCount: {
    fontFamily: TYPE.mono,
    fontSize: 12,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  thumbContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  selectionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionNumber: {
    fontFamily: TYPE.groteskBold,
    fontSize: 12,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 18,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectionBarText: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
  },
});
