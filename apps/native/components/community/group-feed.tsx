import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { PenSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageBubble } from '@/components/messaging/message-bubble';
import { MessageActionMenu } from '@/components/messaging/message-action-menu';
import { GroupPostCard } from './group-post-card';
import { PostComposer } from './post-composer';
import { PostReplyThread } from './post-reply-thread';
import { MessageBubbleSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';
import type { Message } from '@/lib/api/messaging';
import * as MessagingAPI from '@/lib/api/messaging';

const log = logger.create('GroupFeed');

const POST_TYPES: Message['message_type'][] = ['discussion', 'collection_share', 'showcase_share', 'legit_check'];

interface GroupFeedProps {
  messages: Message[];
  isLoading: boolean;
  conversationId: string;
  currentUserId: string;
  headerHeight: number;
  onRefresh: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

export function GroupFeed({
  messages,
  isLoading,
  conversationId,
  currentUserId,
  headerHeight,
  onRefresh,
  onToggleReaction,
}: GroupFeedProps) {
  const insets = useSafeAreaInsets();
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [activePost, setActivePost] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);

  const isPostType = (m: Message) => POST_TYPES.includes(m.message_type);

  const handleReply = useCallback(() => {
    if (actionMessage) setActivePost(actionMessage);
    setActionMessage(null);
  }, [actionMessage]);

  const handleReact = useCallback(async (emoji: string) => {
    if (!actionMessage) return;
    try {
      await MessagingAPI.addReaction(actionMessage.id, emoji);
    } catch (err: unknown) {
      log.error('Failed to add reaction:', err);
    }
    setActionMessage(null);
  }, [actionMessage]);

  const handleDelete = useCallback(async () => {
    if (!actionMessage) return;
    try {
      await MessagingAPI.deleteMessage(actionMessage.id, true);
      onRefresh();
    } catch (err: unknown) {
      log.error('Failed to delete message:', err);
    }
    setActionMessage(null);
  }, [actionMessage, onRefresh]);

  if (activePost) {
    return (
      <PostReplyThread
        post={activePost}
        conversationId={conversationId}
        currentUserId={currentUserId}
        onBack={() => setActivePost(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={{ paddingTop: headerHeight + 16, paddingHorizontal: 12 }}>
          <MessageBubbleSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: headerHeight + 8, paddingBottom: insets.bottom + 80 }}
          renderItem={({ item }) => {
            if (isPostType(item)) {
              return (
                <GroupPostCard
                  message={item}
                  onPress={() => setActivePost(item)}
                  onToggleReaction={onToggleReaction}
                />
              );
            }
            return (
              <View style={styles.chatBubbleWrap}>
                <MessageBubble
                  message={item}
                  isOwn={item.sender?.id === currentUserId}
                  variant="group"
                  onLongPress={() => setActionMessage(item)}
                  onToggleReaction={(emoji) => onToggleReaction(item.id, emoji)}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedTitle}>No posts yet</Text>
              <Text style={styles.emptyFeedSub}>Start the conversation with a post</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.newPostFab, { bottom: insets.bottom + 16 }]}
        onPress={() => setShowPostComposer(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create new post"
      >
        <PenSquare size={20} color={colors.primaryForeground} />
        <Text style={styles.newPostFabText}>New Post</Text>
      </TouchableOpacity>

      <PostComposer
        visible={showPostComposer}
        onClose={() => setShowPostComposer(false)}
        conversationId={conversationId}
        onPostCreated={onRefresh}
      />

      <MessageActionMenu
        visible={!!actionMessage}
        onClose={() => setActionMessage(null)}
        messageContent={actionMessage?.content}
        isOwnMessage={actionMessage?.sender?.id === currentUserId}
        onReply={handleReply}
        onReact={handleReact}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatBubbleWrap: {
    paddingHorizontal: 12,
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyFeedTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyFeedSub: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  newPostFab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  newPostFabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
});
