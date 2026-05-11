import React, { useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Send, Plus } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { ReplyPreview } from './reply-preview';
import type { Message } from '@/lib/api/messaging';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachmentPress: () => void;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  isSending?: boolean;
  paddingBottom: number;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onAttachmentPress,
  replyToMessage,
  onCancelReply,
  isSending,
  paddingBottom,
  placeholder = 'Message...',
}: ChatInputProps) {
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isSending;

  useEffect(() => {
    if (replyToMessage) {
      inputRef.current?.focus();
    }
  }, [replyToMessage]);

  return (
    <View style={[styles.container, { paddingBottom: paddingBottom + 8 }]}>
      {replyToMessage && (
        <ReplyPreview
          senderName={replyToMessage.sender?.name || 'Unknown'}
          content={replyToMessage.content || 'Attachment'}
          onDismiss={onCancelReply}
          variant="input"
        />
      )}
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onAttachmentPress}
          style={styles.attachButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
        >
          <Plus size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground + '99'}
          style={styles.input}
          multiline
          maxLength={2000}
          blurOnSubmit={false}
          accessibilityLabel="Type a message"
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Send size={20} color={canSend ? colors.background : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.card,
  },
});
