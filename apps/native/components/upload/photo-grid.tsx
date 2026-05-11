import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Camera, GripVertical } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { OptimizedImage } from '../optimized-image';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { type ImageItem } from './memorabilia-core-form';

interface PhotoGridProps {
  images: ImageItem[];
  onReorder: (data: ImageItem[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function PhotoGrid({ images, onReorder, onAdd, onRemove }: PhotoGridProps) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.count}>{images.length}/7</Text>
      </View>
      <DraggableFlatList
        data={images}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        onDragEnd={({ data }) => onReorder(data)}
        style={styles.container}
        renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<ImageItem>) => (
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            activeOpacity={0.9}
            style={[styles.wrapper, isActive && styles.wrapperActive]}
            accessibilityRole="button"
            accessibilityLabel={`Photo ${(getIndex() ?? 0) + 1}${getIndex() === 0 ? ', cover photo' : ''}. Long press to reorder`}
          >
            <OptimizedImage source={{ uri: item.uri }} style={styles.image} contentFit="cover" accessibilityLabel="Collectible photo" />
            {getIndex() === 0 && (
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>Cover</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <X size={16} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.dragHandle}>
              <GripVertical size={14} color={colors.foreground + '80'} />
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={images.length < 7 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAdd}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <View style={styles.addButtonOverlay} />
            <Camera size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Photo</Text>
          </TouchableOpacity>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  count: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  container: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  wrapper: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  wrapperActive: {
    opacity: 0.85,
    transform: [{ scale: 1.05 }],
    borderColor: colors.primary,
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dragHandle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.background + 'AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  addButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  addButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
