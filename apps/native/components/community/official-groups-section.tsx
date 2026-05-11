import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { JoinButton } from './join-button';
import { Skeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import type { Group } from '@/lib/api/messaging';

interface OfficialGroupsSectionProps {
  groups: Group[];
  isLoading: boolean;
  onGroupPress: (groupId: string) => void;
  onJoinSuccess: (groupId: string) => void;
}

interface OfficialRowProps {
  group: Group;
  onPress: () => void;
  onJoinSuccess: (groupId: string) => void;
}

function OfficialRow({ group, onPress, onJoinSuccess }: OfficialRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Official group: ${group.name}, ${group.member_count} members`}
    >
      <OptimizedImage
        src={group.cover_image_url || '/placeholder.svg'}
        style={styles.avatar}
        width={40}
        height={40}
        accessibilityLabel={`${group.name} avatar`}
      />
      <View style={styles.rowBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          <View style={styles.officialBadge}>
            <Text style={styles.officialText}>OFFICIAL</Text>
          </View>
        </View>
        {group.description && (
          <Text style={styles.description} numberOfLines={1}>{group.description}</Text>
        )}
        <Text style={styles.memberCount}>{group.member_count.toLocaleString()} members</Text>
      </View>
      <JoinButton
        groupId={group.id}
        groupName={group.name}
        isJoined={group.is_joined}
        onJoinSuccess={onJoinSuccess}
        size="sm"
      />
    </TouchableOpacity>
  );
}

function OfficialRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.rowBody}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="80%" height={11} style={styles.skelGap} />
      </View>
      <Skeleton width={52} height={24} borderRadius={12} />
    </View>
  );
}

export function OfficialGroupsSection({
  groups,
  isLoading,
  onGroupPress,
  onJoinSuccess,
}: OfficialGroupsSectionProps) {
  if (!isLoading && groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <ShieldCheck size={16} color={colors.primary} />
        <Text style={styles.title}>Official</Text>
      </View>
      {isLoading ? (
        <>
          <OfficialRowSkeleton />
          <OfficialRowSkeleton />
        </>
      ) : (
        groups.map((group) => (
          <OfficialRow
            key={group.id}
            group={group}
            onPress={() => onGroupPress(group.id)}
            onJoinSuccess={onJoinSuccess}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
  },
  rowBody: {
    flex: 1,
    gap: 2,
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
  },
  memberCount: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  skelGap: {
    marginTop: 4,
  },
});
