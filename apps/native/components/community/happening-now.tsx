import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { JoinButton } from './join-button';
import { HappeningNowSkeleton } from '@/components/skeleton-community';
import { colors } from '@/lib/colors';
import type { Group } from '@/lib/api/messaging';

interface HappeningNowProps {
  groups: Group[];
  isLoading: boolean;
  onGroupPress: (groupId: string) => void;
  onJoinSuccess: (groupId: string) => void;
}

interface LiveCardProps {
  group: Group;
  onPress: () => void;
  onJoinSuccess: (groupId: string) => void;
}

function LiveCard({ group, onPress, onJoinSuccess }: LiveCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${group.online_count} online, ${group.member_count} members`}
    >
      <OptimizedImage
        src={group.cover_image_url || '/placeholder.svg'}
        style={styles.cardCover}
        width={280}
        height={100}
        accessibilityLabel={`${group.name} cover`}
      />
      <LinearGradient
        colors={['transparent', colors.gradientOverlay]}
        style={styles.gradient}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={1}>{group.name}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveCount}>{group.online_count}</Text>
            <Text style={styles.liveLabel}>online</Text>
            <Text style={styles.memberSep}>·</Text>
            <Users size={10} color={colors.mutedForeground} />
            <Text style={styles.memberCount}>{group.member_count.toLocaleString()}</Text>
          </View>
        </View>
        {!group.is_joined && (
          <JoinButton
            groupId={group.id}
            groupName={group.name}
            isJoined={group.is_joined}
            onJoinSuccess={onJoinSuccess}
            size="sm"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export function HappeningNow({ groups, isLoading, onGroupPress, onJoinSuccess }: HappeningNowProps) {
  const liveGroups = useMemo(
    () => [...groups].sort((a, b) => b.online_count - a.online_count).slice(0, 3),
    [groups]
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Happening Now</Text>
        <HappeningNowSkeleton />
      </View>
    );
  }

  if (liveGroups.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Happening Now</Text>
      <FlatList
        horizontal
        data={liveGroups}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <LiveCard
            group={item}
            onPress={() => onGroupPress(item.id)}
            onJoinSuccess={onJoinSuccess}
          />
        )}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
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
  scrollContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
  card: {
    width: 280,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    position: 'relative',
  },
  cardCover: {
    width: 280,
    height: 100,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  cardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 10,
  },
  cardText: {
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onlineDot,
  },
  liveCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onlineDot,
    fontFamily: 'JetBrainsMono',
  },
  liveLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  memberSep: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginHorizontal: 2,
  },
  memberCount: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
    marginLeft: 2,
  },
});
