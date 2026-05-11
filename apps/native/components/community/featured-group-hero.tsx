import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { Skeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { getCategoryAccent } from '@/lib/category-identity';
import type { Group } from '@/lib/api/messaging';

interface FeaturedGroupHeroProps {
  group: Group | null;
  isLoading: boolean;
  onPress: (groupId: string) => void;
  onJoin?: (groupId: string) => void;
}

export function FeaturedGroupHero({ group, isLoading, onPress, onJoin }: FeaturedGroupHeroProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Skeleton width="100%" height={200} borderRadius={0} />
        </View>
      </View>
    );
  }

  if (!group) return null;

  const { accent } = getCategoryAccent(group.category_type);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => onPress(group.id)}
        accessibilityRole="button"
        accessibilityLabel={`Featured group: ${group.name}, ${group.member_count} members`}
      >
        {/* Category accent strip */}
        {group.category_type && (
          <View style={[styles.accentStrip, { backgroundColor: accent }]} />
        )}

        {/* Cover image */}
        <OptimizedImage
          src={group.cover_image_url || '/placeholder.svg'}
          style={styles.cover}
          width={400}
          height={200}
          accessibilityLabel={`${group.name} cover`}
        />

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', colors.gradientOverlay]}
          style={styles.gradient}
        />

        {/* Content over gradient */}
        <View style={styles.content}>
          <View style={styles.textSection}>
            {group.is_official && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>OFFICIAL</Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
            {group.description && (
              <Text style={styles.description} numberOfLines={1}>{group.description}</Text>
            )}
            <View style={styles.stats}>
              <Users size={12} color={colors.mutedForeground} />
              <Text style={styles.statCount}>{group.member_count.toLocaleString()}</Text>
              <Text style={styles.statLabel}>members</Text>
              {group.online_count > 0 && (
                <>
                  <View style={styles.onlineDot} />
                  <Text style={styles.statCount}>{group.online_count}</Text>
                  <Text style={styles.statLabel}>online</Text>
                </>
              )}
            </View>
          </View>
          {!group.is_joined && (
            <TouchableOpacity
              style={styles.joinBtn}
              activeOpacity={0.7}
              onPress={() => onJoin?.(group.id)}
              accessibilityRole="button"
              accessibilityLabel={`Join ${group.name}`}
            >
              <Text style={styles.joinText}>Join</Text>
            </TouchableOpacity>
          )}
          {group.is_joined && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2,
  },
  cover: {
    width: '100%',
    height: 200,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 16,
  },
  textSection: {
    flex: 1,
    marginRight: 12,
  },
  officialBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primaryMuted,
    marginBottom: 6,
  },
  officialText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  description: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onlineDot,
    marginLeft: 4,
  },
  joinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  joinText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  joinedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
});
