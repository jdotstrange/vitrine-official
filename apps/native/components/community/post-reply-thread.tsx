import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageBubble } from '@/components/messaging/message-bubble';
import { ChatInput } from '@/components/messaging/chat-input';
import { GroupPostCard } from './group-post-card';
import { MessageBubbleSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';
import * as MessagingAPI from '@/lib/api/messaging';
import type { Message } from '@/lib/api/messaging';

const log = logger.create('PostReplyThread');

interface PostReplyThreadProps {
  post: Message;
  conversationId: string;
  currentUserId: string;
  onBack: () => void;
}

export function PostReplyThread({
  post,
  conversationId,
  currentUserId,
  onBack,
}: PostReplyThreadProps) {
  const insets = useSafeAreaInsets();
  const [replies, setReplies] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchReplies = useCallback(async () => {
    try {
      const response = await MessagingAPI.getMessages({
        conversation_id: conversationId,
        limit: 50,
      });
      const threadReplies = response.messages.filter(
        (m) => m.reply_to?.id === post.id
      );
      setReplies(threadReplies);
      setHasMore(response.has_more);
    } catch (err: unknown) {
      log.error('Failed to fetch replies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, post.id]);

  useEffect(() => { fetchReplies(); }, [fetchReplies]);

  const handleSendReply = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const response = await MessagingAPI.sendMessage({
        conversation_id: conversationId,
        content: text,
        reply_to_message_id: post.id,
      });
      setReplies((prev) => [...prev, response.message]);
    } catch (err: unknown) {
      log.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  }, [inputText, conversationId, post.id]);

  const renderReply = useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwn={item.sender?.id === currentUserId}
      variant="group"
    />
  ), [currentUserId]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior="padding"
      automaticOffset
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to group feed"
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={replies}
        renderItem={renderReply}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.postContainer}>
            <GroupPostCard
              message={post}
              onPress={() => {}}
              replyCount={replies.length}
            />
            <View style={styles.repliesDivider}>
              <Text style={styles.repliesLabel}>
                {replies.length > 0 ? `${replies.length} Replies` : 'No replies yet'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <MessageBubbleSkeleton count={3} />
          ) : (
            <View style={styles.emptyReplies}>
              <Text style={styles.emptyText}>Be the first to reply</Text>
            </View>
          )
        }
      />

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSendReply}
        onAttachmentPress={() => {}}
        isSending={isSending}
        paddingBottom={insets.bottom}
        placeholder="Write a reply..."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerSpacer: {
    width: 24,
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  postContainer: {
    marginBottom: 8,
  },
  repliesDivider: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  repliesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyReplies: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
