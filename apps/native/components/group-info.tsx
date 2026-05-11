import { View, ScrollView, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import * as MessagingAPI from '@/lib/api/messaging';
import { GroupInfoHeader } from './community/group-info-header';
import { GroupMemberList } from './community/group-member-list';
import { GroupActions } from './community/group-actions';
import { logger } from '@/lib/logger';

const log = logger.create('GroupInfo');

interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
}

interface GroupInfoProps {
  groupId: string;
  groupName: string;
  groupImage: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  isPublic: boolean;
  isOfficial?: boolean;
  createdAt: string;
  type?: string;
  category?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  isMuted?: boolean;
  onBack?: () => void;
  onJoin?: () => void;
  onLeaveGroup?: () => void;
  onMuteToggle?: () => void;
}

export function GroupInfo({
  groupId,
  groupName,
  groupImage,
  description,
  memberCount,
  onlineCount,
  isPublic,
  isOfficial,
  createdAt,
  type,
  category,
  isAdmin = false,
  isOwner = false,
  isMuted: initialMuted = false,
  onBack,
  onLeaveGroup,
  onMuteToggle,
}: GroupInfoProps) {
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);

    try {
      const response = await MessagingAPI.getGroupMembers({
        group_id: groupId,
        limit: 50,
      });

      setMembers(
        response.members.map((m) => ({
          id: m.user_id,
          name: m.name,
          username: `@${m.username}`,
          avatar: m.avatar_url || '/placeholder.svg',
          role: m.role,
          isOnline: m.is_online,
        }))
      );
    } catch (err: unknown) {
      log.error('Failed to fetch members:', err);
      setMembersError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <GroupInfoHeader
          groupId={groupId}
          groupName={groupName}
          groupImage={groupImage}
          description={description}
          memberCount={memberCount}
          onlineCount={onlineCount}
          isPublic={isPublic}
          isOfficial={isOfficial}
          type={type}
          category={category}
          isAdmin={isAdmin}
          isOwner={isOwner}
          onBack={onBack}
        />

        <GroupActions
          groupId={groupId}
          groupName={groupName}
          isAdmin={isAdmin}
          isOwner={isOwner}
          initialMuted={initialMuted}
          onLeave={onLeaveGroup}
          onMuteToggle={onMuteToggle}
          paddingBottom={insets.bottom}
        />

        <View style={styles.divider} />

        <View style={styles.membersSection}>
          <GroupMemberList
            members={members}
            isLoading={isLoadingMembers}
            error={membersError}
            isAdmin={isAdmin || isOwner}
            onRetry={fetchMembers}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  divider: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    marginTop: 16,
  },
  membersSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
