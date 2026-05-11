import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';
import * as MessagingAPI from '@/lib/api/messaging';
import type { Message } from '@/lib/api/messaging';
import { useConversationMessages } from '@/hooks/use-messaging-realtime';
import { ChatHeader } from './messaging/chat-header';
import { MessageList } from './messaging/message-list';
import { ChatInput } from './messaging/chat-input';
import { MessageActionMenu } from './messaging/message-action-menu';
import { AttachmentPicker, type AttachmentResult } from './messaging/attachment-picker';
import { GroupFeed } from './community/group-feed';
import { useEffect } from 'react';

const log = logger.create('Chat');

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ConversationThreadProps {
  conversationId: string;
  variant?: 'group' | 'direct';
  groupName?: string;
  groupImage?: string;
  memberCount?: number;
  onlineCount?: number;
  isOfficial?: boolean;
  otherUser?: ChatUser;
  groupId?: string;
  currentUserId?: string;
  originCollectible?: { id: string; title: string; primary_photo_url: string | null } | null;
  onBack?: () => void;
}

export function ConversationThread({
  conversationId,
  variant = 'direct',
  groupName,
  groupImage,
  memberCount,
  onlineCount,
  isOfficial,
  otherUser,
  groupId,
  currentUserId = 'current',
  originCollectible,
  onBack,
}: ConversationThreadProps) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);

  const typingUserNames = useMemo(() => Array.from(typingUsers.values()), [typingUsers]);

  const fetchMessages = useCallback(async (before?: string) => {
    if (!before) setIsLoading(true);
    setError(null);
    try {
      const response = await MessagingAPI.getMessages({
        conversation_id: conversationId,
        limit: 50,
        before,
      });
      if (before) {
        setMessages((prev) => [...response.messages, ...prev]);
      } else {
        setMessages(response.messages);
      }
      setHasMore(response.has_more);
      if (!before) MessagingAPI.markAsRead(conversationId).catch(() => {});
    } catch (err: unknown) {
      log.error('Failed to fetch messages:', err);
      if (!before) {
        setMessages([]);
        setError('Failed to load messages. Pull to refresh.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleLoadMore = useCallback(() => {
    if (messages.length > 0) fetchMessages(messages[0].id);
  }, [messages, fetchMessages]);

  // Realtime handlers
  const handleNewMessage = useCallback((newMsg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  }, []);

  const handleMessageEdited = useCallback((edited: { id: string; content: string; edited_at: string }) => {
    setMessages((prev) =>
      prev.map((m) => m.id === edited.id ? { ...m, content: edited.content, edited_at: edited.edited_at } : m)
    );
  }, []);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleTypingStart = useCallback((userId: string) => {
    setTypingUsers((prev) => new Map(prev).set(userId, userId));
  }, []);

  const handleTypingStop = useCallback((userId: string) => {
    setTypingUsers((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const { sendTyping } = useConversationMessages({
    conversationId,
    onNewMessage: handleNewMessage,
    onMessageEdited: handleMessageEdited,
    onMessageDeleted: handleMessageDeleted,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
  });

  useEffect(() => {
    if (inputText) sendTyping(true, currentUserId);
  }, [inputText, sendTyping, currentUserId]);

  // Send message (DM mode)
  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    const optimisticId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender: { id: currentUserId, name: 'You', username: '', avatar_url: null, is_online: true },
      content: text,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyToMessage(null);
    setIsSending(true);

    try {
      const response = await MessagingAPI.sendMessage({
        conversation_id: conversationId,
        content: text,
        reply_to_message_id: replyToMessage?.id,
      });
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? response.message : m));
      sendTyping(false, currentUserId);
    } catch (err: unknown) {
      log.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  }, [inputText, conversationId, currentUserId, replyToMessage, sendTyping]);

  const handleReply = useCallback(() => {
    if (actionMessage) setReplyToMessage(actionMessage);
  }, [actionMessage]);

  const handleReact = useCallback(async (emoji: string) => {
    if (!actionMessage) return;
    try { await MessagingAPI.addReaction(actionMessage.id, emoji); }
    catch (err: unknown) { log.error('Failed to add reaction:', err); }
  }, [actionMessage]);

  const handleDelete = useCallback(async () => {
    if (!actionMessage) return;
    try {
      await MessagingAPI.deleteMessage(actionMessage.id, true);
      setMessages((prev) => prev.filter((m) => m.id !== actionMessage.id));
    } catch (err: unknown) { log.error('Failed to delete message:', err); }
  }, [actionMessage]);

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    const existing = msg?.reactions?.find((r) => r.emoji === emoji);
    try {
      if (existing?.you_reacted) await MessagingAPI.removeReaction(messageId, emoji);
      else await MessagingAPI.addReaction(messageId, emoji);
    } catch (err: unknown) { log.error('Failed to toggle reaction:', err); }
  }, [messages]);

  const handleAttachment = useCallback(async (result: AttachmentResult) => {
    try {
      if (result.type === 'photo' || result.type === 'camera') {
        await MessagingAPI.sendMessage({ conversation_id: conversationId, media_urls: result.data.uris });
      }
    } catch (err: unknown) { log.error('Failed to send attachment:', err); }
  }, [conversationId]);

  const headerHeight = insets.top + 72;

  // Error state
  if (error && !isLoading && messages.length === 0) {
    return (
      <View style={styles.container}>
        <ChatHeader
          variant={variant} groupName={groupName} groupImage={groupImage}
          memberCount={memberCount} onlineCount={onlineCount} isOfficial={isOfficial}
          otherUser={otherUser} groupId={groupId} paddingTop={insets.top} onBack={onBack}
        />
        <View style={[styles.errorContainer, { paddingTop: headerHeight + 40 }]}>
          <AlertCircle size={24} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchMessages()} style={styles.retryButton} accessibilityRole="button" accessibilityLabel="Retry">
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Group feed mode
  if (variant === 'group') {
    return (
      <View style={styles.container}>
        <ChatHeader
          variant={variant} groupName={groupName} groupImage={groupImage}
          memberCount={memberCount} onlineCount={onlineCount} isOfficial={isOfficial}
          otherUser={otherUser} groupId={groupId} paddingTop={insets.top} onBack={onBack}
        />
        <GroupFeed
          messages={messages}
          isLoading={isLoading}
          conversationId={conversationId}
          currentUserId={currentUserId}
          headerHeight={headerHeight}
          onRefresh={() => fetchMessages()}
          onToggleReaction={handleToggleReaction}
        />
      </View>
    );
  }

  // DM mode
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MessageList
        messages={messages} currentUserId={currentUserId} variant={variant}
        isLoading={isLoading} hasMore={hasMore} typingUserNames={typingUserNames}
        headerHeight={headerHeight} onLoadMore={handleLoadMore}
        onMessageLongPress={setActionMessage} onToggleReaction={handleToggleReaction}
      />
      <ChatHeader
        variant={variant} groupName={groupName} groupImage={groupImage}
        memberCount={memberCount} onlineCount={onlineCount} isOfficial={isOfficial}
        otherUser={otherUser} groupId={groupId} paddingTop={insets.top} onBack={onBack}
      />
      <ChatInput
        value={inputText} onChangeText={setInputText} onSend={handleSend}
        onAttachmentPress={() => setShowAttachmentPicker(true)}
        replyToMessage={replyToMessage} onCancelReply={() => setReplyToMessage(null)}
        isSending={isSending} paddingBottom={insets.bottom}
      />
      <MessageActionMenu
        visible={!!actionMessage} onClose={() => setActionMessage(null)}
        messageContent={actionMessage?.content} isOwnMessage={actionMessage?.sender?.id === currentUserId}
        onReply={handleReply} onReact={handleReact} onDelete={handleDelete}
      />
      <AttachmentPicker
        visible={showAttachmentPicker} onClose={() => setShowAttachmentPicker(false)}
        onSelect={handleAttachment} onSelectCollectible={() => {}} onSelectShowcase={() => {}}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
});
