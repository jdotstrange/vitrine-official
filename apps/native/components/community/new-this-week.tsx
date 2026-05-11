import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { JoinButton } from './join-button';
import { NewThisWeekSkeleton } from '@/components/skeleton-community';
import { colors } from '@/lib/colors';
import { getCategoryAccent } from '@/lib/category-identity';
import type { Group } from '@/lib/api/messaging';

interface NewThisWeekProps {
  groups: Group[];
  isLoading: boolean;
  onGroupPress: (groupId: string) => void;
  onJoinSuccess: (groupId: string) => void;
}

interface CompactCardProps {
  group: Group;
  cardWidth: number;
  onPress: () => void;
  onJoinSuccess: (groupId: string) => void;
}

function CompactCard({ group, cardWidth, onPress, onJoinSuccess }: CompactCardProps) {
  const { accentMuted, accent } = getCategoryAccent(group.category_type);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${group.member_count} members`}
    >
      <View style={styles.coverWrap}>
        <OptimizedImage
          src={group.cover_image_url || '/placeholder.svg'}
          style={styles.cover}
          width={cardWidth}
          height={80}
          accessibilityLabel={`${group.name} cover`}
        />
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
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statNum}>{group.member_count.toLocaleString()}</Text>
          {group.category_type && (
            <View style={[styles.categoryPill, { backgroundColor: accentMuted }]}>
              <Text style={[styles.categoryLabel, { color: accent }]}>
                {group.category_type === 'trading_card' || group.category_type === 'trading_cards' || group.category_type === 'trading-cards'
                  ? 'CARDS'
                  : 'MEMO'}
              </Text>
            </View>
          )}
        </View>
        {!group.is_joined && (
          <View style={styles.joinRow}>
            <JoinButton
              groupId={group.id}
              groupName={group.name}
              isJoined={group.is_joined}
              onJoinSuccess={onJoinSuccess}
              size="sm"
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function NewThisWeek({ groups, isLoading, onGroupPress, onJoinSuccess }: NewThisWeekProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 16 * 2 - 12) / 2;

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>New This Week</Text>
        <NewThisWeekSkeleton />
      </View>
    );
  }

  if (groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>New This Week</Text>
      <View style={styles.grid}>
        {groups.slice(0, 6).map((group) => (
          <CompactCard
            key={group.id}
            group={group}
            cardWidth={cardWidth}
            onPress={() => onGroupPress(group.id)}
            onJoinSuccess={onJoinSuccess}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverWrap: {
    position: 'relative',
    height: 80,
    backgroundColor: colors.muted,
  },
  cover: {
    width: '100%',
    height: 80,
  },
  joinedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  joinedText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.attention,
  },
  newText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: 0.5,
  },
  info: {
    padding: 8,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statNum: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  categoryPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  categoryLabel: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  joinRow: {
    marginTop: 4,
  },
});
