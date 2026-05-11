import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Target } from 'lucide-react-native';
import { formatCount } from '@/lib/format-count';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { colors } from '@/lib/colors';
import { OptimizedImage } from '../optimized-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export interface CollectibleItem {
  id: string;
  image: string;
  title: string;
  value: string;
  category: string;
  status: ListingStatus;
  tracks: number;
  /** Optional: for sorting by date (e.g. Recent) */
  createdAt?: string;
  /** Optional: for sorting by value */
  estimatedValue?: number;
  /** Polymorphic discriminator: 'memorabilia' | 'trading_card' */
  collectibleType?: 'memorabilia' | 'trading_card';
}

export interface ProfileGridCardProps {
  item: CollectibleItem;
  isOwned?: boolean;
  isTracked?: boolean;
  onTrackToggle?: (collectibleId: string) => void;
  onPress: () => void;
}

export function ProfileGridCard({
  item,
  isOwned = false,
  isTracked = false,
  onTrackToggle,
  onPress,
}: ProfileGridCardProps) {
  const trackCount = item.tracks;
  const statusConfig = getStatusConfig(item.status);

  const handleTrack = () => {
    onTrackToggle?.(item.id);
  };

  return (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.value}`}
    >
      <View style={styles.gridCardImageContainer}>
        <OptimizedImage
          src={item.image}
          style={styles.gridCardImage}
          width={CARD_WIDTH}
          height={CARD_WIDTH}
          accessibilityLabel={`${item.title} image`}
        />
        <View
          style={[styles.statusDot, { backgroundColor: statusConfig.textColor }]}
        />
      </View>
      <View style={styles.gridCardContent}>
        <Text style={styles.gridCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.gridCardFooter}>
          <Text style={styles.gridCardValue}>{item.value}</Text>
          <Text style={styles.gridCardTracks}>
            {formatCount(trackCount)} tracks
          </Text>
        </View>
      </View>
      {!isOwned && (
        <TouchableOpacity
          style={styles.gridCardAction}
          onPress={handleTrack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isTracked ? 'Untrack collectible' : 'Track collectible'}
        >
          <Target
            size={16}
            color={isTracked ? colors.primary : colors.foreground}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridCardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: colors.secondary,
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  gridCardContent: {
    padding: 12,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    lineHeight: 16,
    minHeight: 32,
  },
  gridCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCardValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  gridCardTracks: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  gridCardAction: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
