import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { CollectibleChatCard } from './collectible-chat-card';
import { ShowcaseChatCard } from './showcase-chat-card';
import { ReplyPreview } from './reply-preview';
import { ReactionPills } from './reaction-pills';
import { colors } from '@/lib/colors';
import type { Message } from '@/lib/api/messaging';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  variant: 'group' | 'direct';
  onLongPress?: () => void;
  onToggleReaction?: (emoji: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  variant,
  onLongPress,
  onToggleReaction,
}: MessageBubbleProps) {
  if (message.message_type === 'system') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasAttachment = message.attached_collectible || message.attached_showcase || message.attached_media_urls?.length;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}
      accessibilityRole="text"
      accessibilityLabel={`Message from ${message.sender?.name || 'you'}: ${message.content || 'attachment'}`}
    >
      {variant === 'group' && !isOwn && message.sender && (
        <View style={styles.avatarWrap}>
          <OptimizedImage
            src={message.sender.avatar_url || '/placeholder.svg'}
            style={styles.avatar}
            width={24}
            height={24}
            accessibilityLabel={`${message.sender.name}'s avatar`}
          />
        </View>
      )}

      <View style={[styles.contentWrap, isOwn && styles.contentWrapOwn]}>
        {variant === 'group' && !isOwn && message.sender && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}

        {/* Reply-to preview */}
        {message.reply_to && (
          <ReplyPreview
            senderName={message.reply_to.sender_name}
            content={message.reply_to.content}
            variant="inline"
          />
        )}

        {/* Collectible attachment */}
        {message.attached_collectible && (
          <CollectibleChatCard
            collectible={{
              ...message.attached_collectible,
              primary_photo_url: message.attached_collectible.primary_photo_url,
            }}
            isOwnMessage={isOwn}
          />
        )}

        {/* Showcase attachment */}
        {message.attached_showcase && (
          <ShowcaseChatCard
            showcase={{
              ...message.attached_showcase,
              cover_image_url: message.attached_showcase.cover_image_url,
            }}
            isOwnMessage={isOwn}
          />
        )}

        {/* Media attachments */}
        {message.attached_media_urls && message.attached_media_urls.length > 0 && (
          <View style={styles.mediaGrid}>
            {message.attached_media_urls.slice(0, 4).map((url, idx) => (
              <Image
                key={idx}
                source={{ uri: url }}
                style={[
                  styles.mediaImage,
                  message.attached_media_urls!.length === 1 && styles.mediaImageSingle,
                ]}
                accessibilityLabel={`Attached image ${idx + 1}`}
              />
            ))}
          </View>
        )}

        {/* Text content */}
        {message.content && (
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, hasAttachment && styles.bubbleAfterAttachment]}>
            <Text style={[styles.text, isOwn && styles.textOwn]}>{message.content}</Text>
            <View style={[styles.footer, isOwn && styles.footerOwn]}>
              <Text style={[styles.time, isOwn && styles.timeOwn]}>
                {formatTime(message.created_at)}
              </Text>
              {isOwn && variant === 'direct' && (
                <CheckCheck size={12} color={isOwn ? colors.background + '99' : colors.mutedForeground} />
              )}
            </View>
          </View>
        )}

        {/* Timestamp for attachment-only messages */}
        {!message.content && hasAttachment && (
          <Text style={styles.attachmentTime}>{formatTime(message.created_at)}</Text>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && onToggleReaction && (
          <ReactionPills reactions={message.reactions} onToggleReaction={onToggleReaction} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  rowOwn: {
    flexDirection: 'row-reverse',
  },
  rowOther: {},
  avatarWrap: {
    width: 24,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  contentWrap: {
    maxWidth: '75%',
  },
  contentWrapOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 4,
  },
  bubbleAfterAttachment: {
    marginTop: 4,
    borderRadius: 16,
  },
  text: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 20,
  },
  textOwn: {
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  footerOwn: {
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  timeOwn: {
    color: colors.background + '99',
  },
  attachmentTime: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemText: {
    fontSize: 12,
    color: colors.mutedForeground,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  mediaImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.muted,
  },
  mediaImageSingle: {
    width: 200,
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
});
