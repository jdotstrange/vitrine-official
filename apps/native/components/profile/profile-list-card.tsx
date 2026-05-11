import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Target } from 'lucide-react-native';
import { formatCount } from '@/lib/format-count';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { colors } from '@/lib/colors';
import { OptimizedImage } from '../optimized-image';

export interface CollectibleItem {
  id: string;
  image: string;
  title: string;
  value: string;
  category: string;
  status: ListingStatus;
  tracks: number;
}

export interface ProfileListCardProps {
  item: CollectibleItem;
  isOwned?: boolean;
  isTracked?: boolean;
  onTrackToggle?: (collectibleId: string) => void;
  onPress: () => void;
}

export function ProfileListCard({
  item,
  isOwned = false,
  isTracked = false,
  onTrackToggle,
  onPress,
}: ProfileListCardProps) {
  const trackCount = item.tracks;
  const statusConfig = getStatusConfig(item.status);

  const handleTrack = () => {
    onTrackToggle?.(item.id);
  };

  return (
    <TouchableOpacity
      style={styles.listCard}
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.value}`}
    >
      <OptimizedImage
        src={item.image}
        style={styles.listCardImage}
        width={56}
        height={56}
        displaySize="thumbnail"
        accessibilityLabel={`${item.title} image`}
      />
      <View style={styles.listCardContent}>
        <Text style={styles.listCardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: statusConfig.textColor },
            ]}
          >
            {statusConfig.label}
          </Text>
        </View>
        <Text style={styles.listCardValue}>{item.value}</Text>
      </View>
      <View style={styles.listCardRight}>
        {!isOwned && (
          <>
            <Text style={styles.listCardTracks}>
              {formatCount(trackCount)} tracks
            </Text>
            <TouchableOpacity
              style={styles.listCardAction}
              onPress={handleTrack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                isTracked ? 'Untrack collectible' : 'Track collectible'
              }
            >
              <Target
                size={16}
                color={isTracked ? colors.primary : colors.foreground}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  listCardImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  listCardContent: {
    flex: 1,
    gap: 6,
  },
  listCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  listCardValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  listCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  listCardTracks: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  listCardAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
