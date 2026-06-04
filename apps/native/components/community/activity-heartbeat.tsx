import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { OptimizedImage } from '@/components/optimized-image';
import { ActivityHeartbeatSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import type { ActivityItem } from '@/lib/mock-messaging';

interface ActivityHeartbeatProps {
  items: ActivityItem[];
  isLoading: boolean;
}

interface ActivityPillProps {
  item: ActivityItem;
  onPress: () => void;
}

function ActivityPill({ item, onPress }: ActivityPillProps) {
  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.userName} ${item.action} ${item.groupName}, ${item.timeAgo} ago`}
    >
      <OptimizedImage
        src={item.groupAvatar}
        style={styles.pillAvatar}
        width={20}
        height={20}
        accessibilityLabel={`${item.groupName} avatar`}
      />
      <Text style={styles.pillText} numberOfLines={1}>
        <Text style={styles.pillBold}>{item.userName}</Text>
        {' '}{item.action}{' '}
        <Text style={styles.pillBold}>{item.groupName}</Text>
      </Text>
      <Text style={styles.pillTime}>{item.timeAgo}</Text>
    </TouchableOpacity>
  );
}

export function ActivityHeartbeat({ items, isLoading }: ActivityHeartbeatProps) {
  if (isLoading) return <ActivityHeartbeatSkeleton />;
  if (items.length === 0) return null;

  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <ActivityPill
            item={item}
            onPress={() => router.push(`/community/${item.groupId}` as Href)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    maxWidth: 280,
  },
  pillAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.muted,
  },
  pillText: {
    fontSize: 12,
    color: colors.mutedForeground,
    flexShrink: 1,
  },
  pillBold: {
    fontWeight: '600',
    color: colors.foreground,
  },
  pillTime: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginLeft: 2,
  },
});
