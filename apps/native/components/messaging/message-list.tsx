import React, { useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { MessageBubbleSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import type { Message } from '@/lib/api/messaging';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  variant: 'group' | 'direct';
  isLoading: boolean;
  hasMore: boolean;
  typingUserNames?: string[];
  headerHeight: number;
  onLoadMore: () => void;
  onMessageLongPress: (message: Message) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

interface ListItem {
  type: 'date-divider' | 'message';
  key: string;
  date?: string;
  message?: Message;
}

function formatDateDivider(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export function MessageList({
  messages,
  currentUserId,
  variant,
  isLoading,
  hasMore,
  typingUserNames,
  headerHeight,
  onLoadMore,
  onMessageLongPress,
  onToggleReaction,
}: MessageListProps) {
  const flatListRef = useRef<FlatList>(null);

  // Build list items with date dividers, reversed for inverted FlatList
  const listItems: ListItem[] = useMemo(() => {
    if (!messages.length) return [];

    const items: ListItem[] = [];
    let lastDateStr = '';

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const dateStr = new Date(msg.created_at).toDateString();

      items.push({ type: 'message', key: msg.id, message: msg });

      if (dateStr !== lastDateStr) {
        items.push({ type: 'date-divider', key: `date-${dateStr}`, date: formatDateDivider(msg.created_at) });
        lastDateStr = dateStr;
      }
    }
    return items;
  }, [messages]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'date-divider') {
        return (
          <View style={styles.dateDivider}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{item.date}</Text>
            <View style={styles.dateLine} />
          </View>
        );
      }

      if (!item.message) return null;
      const msg = item.message;
      const isOwn = msg.sender?.id === currentUserId;

      return (
        <MessageBubble
          message={msg}
          isOwn={isOwn}
          variant={variant}
          onLongPress={() => onMessageLongPress(msg)}
          onToggleReaction={(emoji) => onToggleReaction(msg.id, emoji)}
        />
      );
    },
    [currentUserId, variant, onMessageLongPress, onToggleReaction]
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  if (isLoading && !messages.length) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: headerHeight + 20 }]}>
        <MessageBubbleSkeleton count={6} />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={listItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      inverted
      contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: headerHeight + 8 }]}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        typingUserNames && typingUserNames.length > 0 ? (
          <TypingIndicator userNames={typingUserNames} />
        ) : null
      }
      maxToRenderPerBatch={15}
      windowSize={11}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.mutedForeground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
});
