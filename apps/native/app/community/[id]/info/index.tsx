import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { GroupInfo } from '@/components/group-info';
import * as MessagingAPI from '@/lib/api/messaging';
import { ConversationListSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';

const log = logger.create('GroupInfoPage');

export default function GroupInfoPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<MessagingAPI.Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      try {
        const { conversation } = await MessagingAPI.getConversation(id);
        setGroup(conversation);
      } catch (err: unknown) {
        log.error('Failed to fetch group info:', err);
        setGroup(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ConversationListSkeleton count={6} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GroupInfo
        groupId={group.id}
        groupName={group.name || 'Unnamed Group'}
        groupImage={group.cover_image_url || ''}
        description={group.description || ''}
        memberCount={group.member_count || 0}
        onlineCount={group.online_count || 0}
        isPublic={group.visibility === 'public'}
        isOfficial={group.is_official}
        createdAt={group.created_at}
        type={group.category_type}
        category={group.category_code}
        isAdmin={group.your_role === 'admin'}
        isOwner={group.your_role === 'owner'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    color: colors.destructive,
    textAlign: 'center',
  },
});
