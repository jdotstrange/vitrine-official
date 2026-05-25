import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Plus, X } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { Button } from './button';
import { SearchBar } from './search-bar';
import { InputDialog } from './input-dialog';

/**
 * ShowcaseSelectorSheet — multi-select showcase picker with inline create.
 *
 * A near-full-height V3 sheet used when a collectible needs to be assigned
 * to one or many showcases. Designed for the upload flow's Finalize step
 * but generic enough for any "assign to showcase(s)" affordance.
 *
 * Structure (top → bottom):
 *   - Scrim (tap-to-dismiss via Close, 70% black)
 *   - Drag-dismiss handle
 *   - Header: title (left) · close (right)
 *   - SearchBar
 *   - List:
 *       - Sticky "Create new showcase" row (opens InputDialog)
 *       - Filterable rows: title + "N items" · check when selected
 *   - Sticky footer: "Done" button (solid, full width)
 *
 * State model:
 *   - Controlled: consumer owns `selectedIds` and receives changes via
 *     `onSelectionChange` (toggled as the user taps rows) rather than a
 *     commit-on-done model. This keeps the sheet's internal state small
 *     and lets the consumer drive optimistic UI elsewhere.
 *   - Creates bubble up via `onCreate(title)`. The consumer decides whether
 *     to persist remotely, add to a local list, or both; this sheet doesn't
 *     write to Supabase itself.
 *
 * Deselection: consumers can either reopen the sheet and tap the row
 * again, or remove a single showcase directly from the chip the consumer
 * renders in their summary surface (see upload-entry's Finalize step).
 * Both paths drive the same `onSelectionChange` callback so the picker
 * row state and the consumer's chip row stay in sync.
 */

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface ShowcaseSelectorOption {
  id: string;
  title: string;
  items: number;
}

export interface ShowcaseSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  showcases: ShowcaseSelectorOption[];
  selectedIds: string[];
  onSelectionChange: (nextIds: string[]) => void;
  onCreate: (title: string) => void;
  loading?: boolean;
}

export function ShowcaseSelectorSheet({
  visible,
  onClose,
  showcases,
  selectedIds,
  onSelectionChange,
  onCreate,
  loading = false,
}: ShowcaseSelectorSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        mass: 0.9,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      setQuery('');
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.8) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return showcases;
    return showcases.filter((s) => s.title.toLowerCase().includes(q));
  }, [showcases, query]);

  const toggleSelection = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onSelectionChange(next);
  };

  const handleCreateSubmit = (title: string) => {
    setCreateOpen(false);
    onCreate(title);
  };

  const renderItem: ListRenderItem<ShowcaseSelectorOption> = ({ item }) => {
    const selected = selectedIds.includes(item.id);
    return (
      <Pressable
        onPress={() => toggleSelection(item.id)}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: colors.frostDivider },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${item.title}, ${item.items} items`}
      >
        <View style={styles.rowMain}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
            {item.items === 1 ? '1 item' : `${item.items} items`}
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.frostBorderStrong },
            selected && [
              styles.checkboxSelected,
              { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
            ],
          ]}
        >
          {selected ? <Check size={14} color={colors.void} strokeWidth={3} /> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.scrim, { backgroundColor: colors.scrim }]}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + SPACING.zoneIntra,
              transform: [{ translateY }],
              backgroundColor: colors.void,
              borderColor: colors.frostBorder,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleZone}>
            <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
          </View>

          <View
            style={[
              styles.header,
              { borderBottomColor: colors.frostDivider },
            ]}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Add to Showcases
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <SearchBar
              value={query}
              onChange={setQuery}
              onClear={() => setQuery('')}
              placeholder="Search showcases"
            />
          </View>

          <Pressable
            onPress={() => setCreateOpen(true)}
            style={({ pressed }) => [
              styles.createRow,
              { borderBottomColor: colors.frostDivider },
              pressed && { backgroundColor: colors.frostDivider },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create new showcase"
          >
            <View
              style={[
                styles.createIcon,
                { borderColor: colors.frostBorderStrong },
              ]}
            >
              <Plus size={16} color={colors.brandVolt} strokeWidth={2.5} />
            </View>
            <Text style={[styles.createLabel, { color: colors.brandVolt }]}>
              Create new showcase
            </Text>
          </Pressable>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: colors.frostDivider }]}
              />
            )}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {loading
                    ? 'Loading showcases…'
                    : query
                    ? 'No matches'
                    : 'No showcases yet'}
                </Text>
                {!loading && !query ? (
                  <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                    Create your first showcase to group this piece with others.
                  </Text>
                ) : null}
              </View>
            }
          />

          <View
            style={[styles.footer, { borderTopColor: colors.frostDivider }]}
          >
            <Button label="Done" onPress={handleClose} variant="solid" fullWidth />
          </View>
        </Animated.View>

        <InputDialog
          visible={createOpen}
          title="New Showcase"
          subtitle="Give it a short, recognizable name."
          placeholder="e.g. Rookie Cards"
          submitLabel="Create"
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateOpen(false)}
          autoCapitalize="words"
          maxLength={80}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: RADII.card + 4,
    borderTopRightRadius: RADII.card + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    height: SCREEN_HEIGHT * 0.88,
  },
  handleZone: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: SPACING.zoneIntra,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  searchRow: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneIntra,
    paddingBottom: 12,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  createIcon: {
    width: 32,
    height: 32,
    borderRadius: RADII.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  listContent: {
    paddingVertical: 4,
    paddingBottom: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.gutter,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 14,
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  rowMeta: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {},
  empty: {
    paddingHorizontal: SPACING.gutter,
    paddingVertical: SPACING.zoneCluster,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
  },
  emptyBody: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneIntra,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
