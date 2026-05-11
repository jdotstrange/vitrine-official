import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/colors';
import { Image } from 'expo-image';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';

export interface Showcase {
  id: string;
  title: string;
  items: number;
  totalValue: number;
  showcaseType: 'manual' | 'auto';
  images: string[];
}

export interface ShowcaseListCardProps {
  showcase: Showcase;
  username: string;
  onPress: () => void;
}

export function ShowcaseListCard({
  showcase,
  username,
  onPress,
}: ShowcaseListCardProps) {
  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${showcase.title} showcase, ${showcase.items} pieces`}
    >
      {/* Overlapping thumbnail stack */}
      <View style={styles.listThumbStack}>
        {showcase.images.slice(0, 2).map((img, i) => (
          <Image
            key={i}
            source={{ uri: getOptimizedUrl(img, IMAGE_SIZES.thumbnail) }}
            style={[
              styles.listThumb,
              { marginLeft: i > 0 ? -14 : 0, zIndex: 3 - i },
            ]}
            contentFit="cover"
            recyclingKey={img}
            accessibilityLabel={`Preview ${i + 1}`}
          />
        ))}
        {showcase.images.length === 0 && (
          <View style={[styles.listThumb, styles.listThumbEmpty]} />
        )}
      </View>

      {/* Info */}
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={1}>{showcase.title}</Text>
        <View style={styles.listMeta}>
          <Text style={styles.listMetaText}>{showcase.items} pieces</Text>
          <View style={styles.listMetaDot} />
          <Text style={styles.listMetaValue}>${showcase.totalValue.toLocaleString()}</Text>
        </View>
      </View>

      <ChevronRight size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export interface ShowcaseSpatialCardProps {
  showcase: Showcase;
  username: string;
  onPress: () => void;
}

export function ShowcaseSpatialCard({
  showcase,
  username,
  onPress,
}: ShowcaseSpatialCardProps) {
  const heroImg = showcase.images[0];
  const thumbs = showcase.images.slice(1, 4);
  const valStr = showcase.totalValue >= 1000
    ? `$${(showcase.totalValue / 1000).toFixed(1)}K`
    : `$${showcase.totalValue.toLocaleString()}`;

  return (
    <TouchableOpacity
      style={styles.spatialCard}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${showcase.title} showcase, ${showcase.items} pieces`}
    >
      {heroImg ? (
        <Image
          source={{ uri: getOptimizedUrl(heroImg, IMAGE_SIZES.detail) }}
          style={styles.spatialHero}
          contentFit="cover"
          recyclingKey={heroImg}
          accessibilityLabel=""
        />
      ) : (
        <View style={[styles.spatialHero, { backgroundColor: colors.surfaceElevated }]} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(12,12,16,0.8)', 'rgba(12,12,16,0.97)']}
        locations={[0, 0.4, 1]}
        style={styles.spatialGradient}
      />
      <View style={styles.spatialContent}>
        <Text style={styles.spatialTitle} numberOfLines={2}>{showcase.title}</Text>
        <View style={styles.spatialMeta}>
          <Text style={styles.spatialMetaText}>{showcase.items} items</Text>
          <View style={styles.spatialMetaDot} />
          <Text style={[styles.spatialMetaText, { color: colors.primary }]}>{valStr}</Text>
          <View style={{ flex: 1 }} />
          <ChevronRight size={14} color={colors.mutedForeground} />
        </View>
        {thumbs.length > 0 && (
          <View style={styles.spatialThumbs}>
            {thumbs.map((img, i) => (
              <Image
                key={i}
                source={{ uri: getOptimizedUrl(img, IMAGE_SIZES.thumbnail) }}
                style={[styles.spatialThumb, i > 0 && { marginLeft: -8 }]}
                contentFit="cover"
                recyclingKey={img}
                accessibilityLabel=""
              />
            ))}
            {showcase.images.length > 4 && (
              <View style={[styles.spatialThumb, styles.spatialThumbMore, { marginLeft: -8 }]}>
                <Text style={styles.spatialThumbMoreText}>+{showcase.images.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  listThumbStack: {
    flexDirection: 'row',
    width: 58,
    height: 48,
    alignItems: 'center',
  },
  listThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.card,
    backgroundColor: colors.muted,
  },
  listThumbEmpty: {
    backgroundColor: colors.secondary,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listMetaText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  listMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  listMetaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  spatialCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    height: 200,
    backgroundColor: colors.card,
  },
  spatialHero: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  spatialGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  spatialContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  spatialTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 6,
  },
  spatialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  spatialMetaText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  spatialMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.mutedForeground,
    opacity: 0.5,
  },
  spatialThumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spatialThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.secondary,
  },
  spatialThumbMore: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  spatialThumbMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
});
