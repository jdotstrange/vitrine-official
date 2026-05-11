import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface PickerItem {
  id: string;
  title: string;
  imageUrl: string | null;
  subtitle?: string;
}

interface VitrineItemPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: PickerItem) => void;
  title: string;
  fetchItems: () => Promise<PickerItem[]>;
  emptyMessage?: string;
}

export function VitrineItemPicker({
  visible,
  onClose,
  onSelect,
  title,
  fetchItems,
  emptyMessage = 'Nothing to share yet.',
}: VitrineItemPickerProps) {
  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [visible, fetchItems]);

  const renderItem = ({ item }: { item: PickerItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onSelect(item)}
      activeOpacity={0.6}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbText}>{item.title.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: -1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    color: colors.mutedForeground,
    fontSize: 18,
    fontWeight: '600',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 15,
  },
});
