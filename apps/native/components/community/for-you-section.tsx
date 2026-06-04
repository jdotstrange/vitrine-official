import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { JoinButton } from './join-button';
import { ForYouSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { getCategoryAccent } from '@/lib/category-identity';
import type { Group } from '@/lib/api/messaging';

export interface RecommendedGroup extends Group {
  recommendation_reason: string;
}

interface ForYouSectionProps {
  groups: RecommendedGroup[];
  isLoading: boolean;
  onGroupPress: (groupId: string) => void;
  onJoinSuccess: (groupId: string) => void;
}

interface ForYouCardProps {
  group: RecommendedGroup;
  onPress: () => void;
  onJoinSuccess: (groupId: string) => void;
}

function ForYouCard({ group, onPress, onJoinSuccess }: ForYouCardProps) {
  const { accent, accentMuted } = getCategoryAccent(group.category_type);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${group.recommendation_reason}`}
    >
      <OptimizedImage
        src={group.cover_image_url || '/placeholder.svg'}
        style={styles.thumb}
        width={60}
        height={60}
        accessibilityLabel={`${group.name} cover`}
      />
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          {group.is_official && (
            <View style={styles.officialBadge}>
              <Text style={styles.officialText}>OFFICIAL</Text>
            </View>
          )}
        </View>
        {group.description && (
          <Text style={styles.description} numberOfLines={1}>{group.description}</Text>
        )}
        <Text style={styles.reason} numberOfLines={1}>{group.recommendation_reason}</Text>
        <View style={styles.statsRow}>
          <Users size={10} color={colors.mutedForeground} />
          <Text style={styles.statNum}>{group.member_count.toLocaleString()}</Text>
          {group.online_count > 0 && (
            <>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineNum}>{group.online_count}</Text>
            </>
          )}
          {group.category_type && (
            <View style={[styles.categoryPill, { backgroundColor: accentMuted }]}>
              <Text style={[styles.categoryText, { color: accent }]}>
                {group.category_type === 'trading_card' || group.category_type === 'trading_cards' || group.category_type === 'trading-cards'
                  ? 'CARDS'
                  : 'MEMO'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.joinWrap}>
        <JoinButton
          groupId={group.id}
          groupName={group.name}
          isJoined={group.is_joined}
          onJoinSuccess={onJoinSuccess}
          size="sm"
        />
      </View>
    </TouchableOpacity>
  );
}

export function ForYouSection({ groups, isLoading, onGroupPress, onJoinSuccess }: ForYouSectionProps) {
  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>For You</Text>
        <ForYouSkeleton />
      </View>
    );
  }

  if (groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>For You</Text>
      {groups.slice(0, 4).map((group) => (
        <ForYouCard
          key={group.id}
          group={group}
          onPress={() => onGroupPress(group.id)}
          onJoinSuccess={onJoinSuccess}
        />
      ))}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    flexShrink: 1,
  },
  officialBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
  },
  officialText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  reason: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statNum: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.onlineDot,
    marginLeft: 4,
  },
  onlineNum: {
    fontSize: 10,
    color: colors.onlineDot,
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  },
  categoryPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginLeft: 4,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  joinWrap: {
    marginLeft: 8,
  },
});
