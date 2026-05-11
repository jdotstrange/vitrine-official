import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Layers } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { OptimizedImage } from '../optimized-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export interface Showcase {
  id: string;
  title: string;
  items: number;
  totalValue: number;
  showcaseType: 'manual' | 'auto';
  images: string[];
}

export interface ShowcaseGridCardProps {
  showcase: Showcase;
  username: string;
  onPress: () => void;
}

export function ShowcaseGridCard({
  showcase,
  username,
  onPress,
}: ShowcaseGridCardProps) {
  const showcaseColors =
    showcase.showcaseType === 'auto'
      ? { dot: colors.warning, label: colors.warning }
      : { dot: colors.primary, label: colors.primary };

  return (
    <TouchableOpacity
      style={[styles.showcaseGridCard, { borderColor: showcaseColors.label + '4D' }]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${showcase.title} showcase, ${showcase.items} pieces`}
    >
      {/* Image Section */}
      <View style={styles.showcaseGridImageContainer}>
        {showcase.images.slice(0, 3).map((img, i) => (
          <OptimizedImage
            key={i}
            src={img}
            style={[
              styles.showcaseGridImage,
              i > 0 && styles.showcaseGridImageOverlap,
            ]}
            width={56}
            height={56}
          />
        ))}
        {showcase.items > 3 && (
          <View style={[styles.showcaseGridPlus, styles.showcaseGridImageOverlap]}>
            <Text style={styles.showcaseGridPlusText}>
              +{showcase.items - 3}
            </Text>
          </View>
        )}
      </View>

      {/* Showcase Info */}
      <View style={styles.showcaseGridContent}>
        <View style={styles.showcaseGridHeader}>
          <View
            style={[styles.showcaseDot, { backgroundColor: showcaseColors.dot }]}
          />
        </View>

        <Text style={styles.showcaseGridTitle} numberOfLines={2}>
          {showcase.title}
        </Text>

        <View style={styles.showcaseGridStats}>
          <View style={styles.showcaseStatRow}>
            <Layers size={10} color={colors.mutedForeground} />
            <Text style={styles.showcaseGridStatText}>{showcase.items}</Text>
          </View>
          <Text style={styles.showcaseGridValue}>
            ${showcase.totalValue.toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  showcaseGridCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  showcaseGridImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 20,
  },
  showcaseGridImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.background,
  },
  showcaseGridImageOverlap: {
    marginLeft: -12,
  },
  showcaseGridPlus: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  showcaseGridPlusText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  showcaseGridContent: {
    padding: 12,
  },
  showcaseGridHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  showcaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  showcaseGridTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  showcaseGridStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showcaseStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showcaseGridStatText: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  showcaseGridValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});
