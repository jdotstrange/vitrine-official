import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { GroupListItem } from './group-list-item';
import { GroupCardSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import type { Conversation } from '@/lib/api/messaging';

interface YourGroupsListProps {
  groups: Conversation[];
  isLoading: boolean;
  onGroupPress: (groupId: string) => void;
}

export function YourGroupsList({ groups, isLoading, onGroupPress }: YourGroupsListProps) {
  if (isLoading) {
    return (
      <View style={styles.list}>
        {Array.from({ length: 3 }).map((_, i) => (
          <GroupCardSkeleton key={`skel-${i}`} variant="list" />
        ))}
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Users size={28} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No groups yet</Text>
        <Text style={styles.emptySubtitle}>
          Join a community to connect with fellow collectors
        </Text>
      </View>
    );
  }

  // Sort: pinned first, then by last_message_at descending
  const sorted = [...groups].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <View style={styles.list}>
      {sorted.map((group) => (
        <GroupListItem
          key={group.id}
          group={group}
          onPress={() => onGroupPress(group.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});
