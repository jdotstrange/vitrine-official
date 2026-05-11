import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ConversationThread } from '@/components/conversation-thread';
import { useAuth } from '@/lib/contexts/auth-context';
import * as MessagingAPI from '@/lib/api/messaging';
import { SkeletonProvider } from '@/components/skeleton';
import { GroupPageSkeleton } from '@/components/skeletons/group-page';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';

const log = logger.create('CommunityDetail');

export default function CommunityDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<MessagingAPI.Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      try {
        const { conversation } = await MessagingAPI.getConversation(id);
        setGroup(conversation);
      } catch (err: unknown) {
        log.error('Failed to fetch group:', err);
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
        <SkeletonProvider>
          <GroupPageSkeleton />
        </SkeletonProvider>
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
      <ConversationThread
        variant="group"
        conversationId={group.id}
        groupId={group.id}
        groupName={group.name}
        groupImage={group.cover_image_url || undefined}
        memberCount={group.member_count}
        onlineCount={group.online_count}
        isOfficial={group.is_official}
        currentUserId={user?.id || ''}
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
