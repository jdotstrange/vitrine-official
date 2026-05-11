import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Layers, ArrowRight } from 'lucide-react-native';
import { OptimizedImage } from './optimized-image';
import { colors } from '@/lib/colors';
import { useRouter, type Href } from 'expo-router';

interface ShowcaseOrbProps {
  title: string;
  curator: string;
  items: number;
  followers: string;
  preview: string[];
  id?: string | number;
}

export function ShowcaseOrb({
  title,
  curator,
  items,
  followers,
  preview,
  id,
}: ShowcaseOrbProps) {
  const router = useRouter();

  const handlePress = () => {
    if (id) {
      router.push(`/showcase/${id}` as Href);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.overlay} />
      <View style={styles.border} />
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dot} />
          <Text style={styles.label}>SHOWCASE</Text>
        </View>
        <Text style={styles.curator}>{curator}</Text>
      </View>

      {/* Preview images - stacked orbs */}
      <View style={styles.previewContainer}>
        {preview.slice(0, 3).map((img, i) => (
          <View
            key={i}
            style={[
              styles.previewImage,
              i === 0 && styles.previewImageFirst,
              i === 1 && styles.previewImageSecond,
              i === 2 && styles.previewImageThird,
              {
                transform: [{ rotate: `${(i - 1) * 8}deg` }],
              },
            ]}
          >
            <OptimizedImage
              source={{ uri: img || '/placeholder.svg' }}
              style={styles.image}
              contentFit="cover"
            />
          </View>
        ))}

        {/* Plus indicator */}
        <View style={styles.plusIndicator}>
          <Text style={styles.plusText}>+{items - preview.length}</Text>
        </View>
      </View>

      {/* Title and stats */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Layers size={14} color={colors.mutedForeground} />
              <Text style={styles.statText}>{items} pieces</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={14} color={colors.mutedForeground} />
              <Text style={styles.statText}>{followers}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <ArrowRight size={20} color={colors.accentForeground} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.6)',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.accent}4D`, // 30% opacity
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.glowGold,
    opacity: 0.12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 2,
  },
  curator: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.background,
  },
  previewImageFirst: {
    zIndex: 30,
  },
  previewImageSecond: {
    marginLeft: -24,
    zIndex: 20,
  },
  previewImageThird: {
    marginLeft: -24,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  plusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: -16,
    zIndex: 0,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  plusText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
