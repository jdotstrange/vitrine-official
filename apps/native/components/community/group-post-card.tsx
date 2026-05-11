import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, Heart, Shield, AlertTriangle } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { CollectibleChatCard } from '@/components/messaging/collectible-chat-card';
import { ReactionPills } from '@/components/messaging/reaction-pills';
import { colors } from '@/lib/colors';
import { formatMessageTime } from '@/lib/api/messaging';
import type { Message, PostVoteCounts } from '@/lib/api/messaging';
import * as MessagingAPI from '@/lib/api/messaging';
import { logger } from '@/lib/logger';

const log = logger.create('GroupPost');

interface GroupPostCardProps {
  message: Message;
  onPress: () => void;
  replyCount?: number;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

export function GroupPostCard({
  message,
  onPress,
  replyCount = 0,
  onToggleReaction,
}: GroupPostCardProps) {
  const isDiscussion = message.message_type === 'discussion';
  const isCollectionShare = message.message_type === 'collection_share';
  const isShowcaseShare = message.message_type === 'showcase_share';
  const isLegitCheck = message.message_type === 'legit_check';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Post by ${message.sender?.name}: ${message.post_title || message.content || 'shared content'}`}
    >
      {/* Author header */}
      <View style={styles.header}>
        <OptimizedImage
          src={message.sender?.avatar_url || '/placeholder.svg'}
          style={styles.avatar}
          width={36}
          height={36}
          accessibilityLabel={`${message.sender?.name}'s avatar`}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{message.sender?.name}</Text>
          <Text style={styles.timestamp}>{formatMessageTime(message.created_at)}</Text>
        </View>
      </View>

      {/* Post title */}
      {message.post_title && (
        <Text style={styles.title}>{message.post_title}</Text>
      )}

      {/* Content body — type-specific rendering */}
      {isDiscussion && message.content && (
        <Text style={styles.body} numberOfLines={6}>{message.content}</Text>
      )}

      {isCollectionShare && message.attached_collectible && (
        <View style={styles.attachmentWrap}>
          <CollectibleChatCard
            collectible={{
              ...message.attached_collectible,
              primary_photo_url: message.attached_collectible.primary_photo_url,
            }}
            isOwnMessage={false}
          />
          {message.content && <Text style={styles.body}>{message.content}</Text>}
        </View>
      )}

      {isShowcaseShare && message.content && (
        <Text style={styles.body}>{message.content}</Text>
      )}

      {isLegitCheck && (
        <LegitCheckContent message={message} />
      )}

      {/* Media grid for posts with photos */}
      {!isLegitCheck && message.attached_media_urls && message.attached_media_urls.length > 0 && (
        <View style={styles.mediaGrid}>
          {message.attached_media_urls.slice(0, 4).map((url, idx) => (
            <OptimizedImage
              key={idx}
              src={url}
              style={[
                styles.mediaImage,
                message.attached_media_urls!.length === 1 && styles.mediaImageSingle,
              ]}
              width={200}
              height={200}
              accessibilityLabel={`Post image ${idx + 1}`}
            />
          ))}
        </View>
      )}

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && onToggleReaction && (
        <View style={styles.reactionsWrap}>
          <ReactionPills
            reactions={message.reactions}
            onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
          />
        </View>
      )}

      {/* Action footer */}
      <View style={styles.footer}>
        <View style={styles.footerAction}>
          <MessageCircle size={16} color={colors.mutedForeground} />
          <Text style={styles.footerCount}>
            {replyCount > 0 ? replyCount : 'Reply'}
          </Text>
        </View>
        <View style={styles.footerAction}>
          <Heart size={16} color={colors.mutedForeground} />
          <Text style={styles.footerCount}>
            {message.reactions?.reduce((sum, r) => sum + r.count, 0) || 'React'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Legit check sub-component with voting
function LegitCheckContent({ message }: { message: Message }) {
  const [votes, setVotes] = useState<PostVoteCounts | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const fetchVotes = useCallback(async () => {
    try {
      const data = await MessagingAPI.getPostVotes(message.id);
      setVotes(data);
    } catch (err: unknown) {
      log.error('Failed to fetch votes:', err);
    }
  }, [message.id]);

  React.useEffect(() => { fetchVotes(); }, [fetchVotes]);

  const handleVote = async (vote: 'legit' | 'suspect') => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      if (votes?.your_vote === vote) {
        await MessagingAPI.removePostVote(message.id);
      } else {
        await MessagingAPI.castPostVote(message.id, vote);
      }
      await fetchVotes();
    } catch (err: unknown) {
      log.error('Failed to vote:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = (votes?.legit_count || 0) + (votes?.suspect_count || 0);

  return (
    <View>
      {message.content && (
        <Text style={styles.body}>{message.content}</Text>
      )}

      {/* Legit check photos */}
      {message.attached_media_urls && message.attached_media_urls.length > 0 && (
        <View style={styles.mediaGrid}>
          {message.attached_media_urls.slice(0, 4).map((url, idx) => (
            <OptimizedImage
              key={idx}
              src={url}
              style={[
                styles.mediaImage,
                message.attached_media_urls!.length === 1 && styles.mediaImageSingle,
              ]}
              width={200}
              height={200}
              accessibilityLabel={`Legit check photo ${idx + 1}`}
            />
          ))}
        </View>
      )}

      {/* Voting buttons */}
      <View style={styles.voteRow}>
        <TouchableOpacity
          style={[styles.voteBtn, styles.voteLegit, votes?.your_vote === 'legit' && styles.voteActive]}
          onPress={() => handleVote('legit')}
          accessibilityRole="button"
          accessibilityLabel={`Vote legit, ${votes?.legit_count || 0} votes`}
        >
          <Shield size={16} color={votes?.your_vote === 'legit' ? colors.background : colors.attention} />
          <Text style={[styles.voteText, styles.voteLegitText, votes?.your_vote === 'legit' && styles.voteTextActive]}>
            Legit
          </Text>
          {totalVotes > 0 && (
            <Text style={[styles.voteCount, votes?.your_vote === 'legit' && styles.voteCountActive]}>
              {votes?.legit_count || 0}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteBtn, styles.voteSuspect, votes?.your_vote === 'suspect' && styles.voteSuspectActive]}
          onPress={() => handleVote('suspect')}
          accessibilityRole="button"
          accessibilityLabel={`Vote suspect, ${votes?.suspect_count || 0} votes`}
        >
          <AlertTriangle size={16} color={votes?.your_vote === 'suspect' ? colors.foreground : colors.destructive} />
          <Text style={[styles.voteText, styles.voteSuspectText, votes?.your_vote === 'suspect' && styles.voteTextSuspectActive]}>
            Suspect
          </Text>
          {totalVotes > 0 && (
            <Text style={[styles.voteCount, votes?.your_vote === 'suspect' && styles.voteCountSuspectActive]}>
              {votes?.suspect_count || 0}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  timestamp: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: colors.cardForeground,
    lineHeight: 20,
  },
  attachmentWrap: {
    gap: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.muted,
  },
  mediaImageSingle: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  reactionsWrap: {
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerCount: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  voteRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  voteLegit: {
    backgroundColor: colors.attention + '18',
    borderWidth: 1,
    borderColor: colors.attention + '40',
  },
  voteActive: {
    backgroundColor: colors.attention,
    borderColor: colors.attention,
  },
  voteSuspect: {
    backgroundColor: colors.destructive + '18',
    borderWidth: 1,
    borderColor: colors.destructive + '40',
  },
  voteSuspectActive: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  voteLegitText: {
    color: colors.attention,
  },
  voteSuspectText: {
    color: colors.destructive,
  },
  voteTextActive: {
    color: colors.background,
  },
  voteTextSuspectActive: {
    color: colors.foreground,
  },
  voteCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  voteCountActive: {
    color: colors.background,
  },
  voteCountSuspectActive: {
    color: colors.foreground,
  },
});
