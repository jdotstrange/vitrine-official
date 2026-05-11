import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, X } from 'lucide-react-native';
import { OptimizedImage } from '../optimized-image';
import { colors } from '@/lib/colors';

export interface CoverImageUploadProps {
  coverImage: string | null;
  onUpload: () => void;
  onRemove: () => void;
}

export function CoverImageUpload({ coverImage, onUpload, onRemove }: CoverImageUploadProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Cover Image</Text>
      <TouchableOpacity
        onPress={onUpload}
        style={styles.coverImageButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Upload cover image"
      >
        {coverImage ? (
          <>
            <OptimizedImage
              source={{ uri: coverImage || '/placeholder.svg' }}
              style={styles.coverImage}
              accessibilityLabel="Group cover image"
            />
            <View style={styles.coverImageOverlay}>
              <View style={styles.coverImageIconContainer}>
                <Camera size={24} color={colors.foreground} />
              </View>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              style={styles.coverImageRemove}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Remove cover image"
            >
              <X size={16} color={colors.foreground} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.coverImagePlaceholderIcon}>
              <Camera size={24} color={colors.primary} />
            </View>
            <Text style={styles.coverImagePlaceholderText}>Add a cover image</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  coverImageButton: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card + '4D',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImageOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.background + '99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImageRemove: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImagePlaceholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  coverImagePlaceholderText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
