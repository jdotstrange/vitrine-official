import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Crown, Shield, MoreHorizontal, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { OptimizedImage } from '@/components/optimized-image';
import { MemberListSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';

interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
}

interface GroupMemberListProps {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  onRetry: () => void;
}

export function GroupMemberList({
  members,
  isLoading,
  error,
  isAdmin,
  onRetry,
}: GroupMemberListProps) {
  if (isLoading) {
    return <MemberListSkeleton count={5} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={20} color={colors.destructive} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Retry loading members"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No members yet</Text>
      </View>
    );
  }

  const owners = members.filter((m) => m.role === 'owner');
  const admins = members.filter((m) => m.role === 'admin');
  const regulars = members.filter((m) => m.role === 'member');

  return (
    <View style={styles.container}>
      {owners.length > 0 && (
        <MemberGroup title="Owner" members={owners} isAdmin={isAdmin} />
      )}
      {admins.length > 0 && (
        <MemberGroup title={`Admins \u00b7 ${admins.length}`} members={admins} isAdmin={isAdmin} />
      )}
      {regulars.length > 0 && (
        <MemberGroup title={`Members \u00b7 ${regulars.length}`} members={regulars} isAdmin={isAdmin} />
      )}
    </View>
  );
}

function MemberGroup({ title, members, isAdmin }: { title: string; members: Member[]; isAdmin: boolean }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {members.map((member) => (
        <MemberRow key={member.id} member={member} isAdmin={isAdmin} />
      ))}
    </View>
  );
}

function MemberRow({ member, isAdmin }: { member: Member; isAdmin: boolean }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${member.id}` as Href)}
      style={styles.row}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${member.name}'s profile`}
    >
      <View style={styles.avatarWrap}>
        <OptimizedImage
          src={member.avatar || '/placeholder.svg'}
          style={styles.avatar}
          width={44}
          height={44}
          accessibilityLabel={`${member.name} avatar`}
        />
        {member.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
          {member.role === 'owner' && (
            <View style={styles.roleBadge}>
              <Crown size={12} color={colors.warning} />
              <Text style={[styles.roleBadgeText, { color: colors.warning }]}>Owner</Text>
            </View>
          )}
          {member.role === 'admin' && (
            <View style={styles.roleBadge}>
              <Shield size={12} color={colors.primary} />
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{member.username}</Text>
      </View>

      {isAdmin && member.role !== 'owner' && (
        <TouchableOpacity
          style={styles.moreBtn}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${member.name}`}
        >
          <MoreHorizontal size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  group: {
    gap: 4,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.onlineDot,
    borderWidth: 2,
    borderColor: colors.background,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
  },
  username: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
