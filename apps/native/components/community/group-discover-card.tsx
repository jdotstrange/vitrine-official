import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { colors } from '@/lib/colors';
import { getCategoryAccent } from '@/lib/category-identity';
import type { Group } from '@/lib/api/messaging';

type CardVariant = 'default' | 'compact';

interface GroupDiscoverCardProps {
  group: Group;
  onPress: () => void;
  variant?: CardVariant;
}

const CARD_SIZES = {
  default: { width: 240, coverHeight: 120 },
  compact: { width: 180, coverHeight: 80 },
} as const;

export function GroupDiscoverCard({ group, onPress, variant = 'default' }: GroupDiscoverCardProps) {
  const { accent, accentMuted } = getCategoryAccent(group.category_type);
  const { width, coverHeight } = CARD_SIZES[variant];

  return (
    <TouchableOpacity
      style={[styles.container, { width }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${group.member_count} members`}
    >
      <View style={[styles.coverContainer, { height: coverHeight }]}>
        <OptimizedImage
          src={group.cover_image_url || '/placeholder.svg'}
          style={[styles.cover, { height: coverHeight }]}
          width={width}
          height={coverHeight}
          accessibilityLabel={`${group.name} cover`}
        />
        {/* Overlay badge */}
        {group.is_joined ? (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        ) : (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          {group.is_official && (
            <View style={styles.officialBadge}>
              <Text style={styles.officialText}>OFFICIAL</Text>
            </View>
          )}
        </View>
        {variant === 'default' && group.description && (
          <Text style={styles.description} numberOfLines={1}>{group.description}</Text>
        )}
        <View style={styles.stats}>
          <Users size={12} color={colors.mutedForeground} />
          <Text style={styles.statText}>{group.member_count.toLocaleString()}</Text>
          {group.online_count > 0 && (
            <View style={styles.liveIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{group.online_count}</Text>
            </View>
          )}
          {group.category_type && (
            <View style={[styles.categoryBadge, { backgroundColor: accentMuted }]}>
              <Text style={[styles.categoryText, { color: accent }]}>
                {group.category_type === 'trading_card' || group.category_type === 'trading_cards' || group.category_type === 'trading-cards'
                  ? 'CARDS'
                  : 'MEMO'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverContainer: {
    position: 'relative',
    backgroundColor: colors.muted,
  },
  cover: {
    width: '100%',
  },
  joinedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  joinedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.attention,
  },
  newText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: 0.5,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  officialBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
  },
  officialText: {
    fontSize: 7,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statText: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onlineDot,
  },
  onlineText: {
    fontSize: 10,
    color: colors.onlineDot,
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
