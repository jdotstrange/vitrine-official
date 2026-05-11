import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pin, BellOff } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { colors } from '@/lib/colors';
import { getCategoryAccent } from '@/lib/category-identity';
import type { Conversation } from '@/lib/api/messaging';
import { formatMessageTime } from '@/lib/api/messaging';

interface GroupListItemProps {
  group: Conversation;
  onPress: () => void;
}

function CategoryBadge({ categoryType }: { categoryType?: string }) {
  if (!categoryType) return null;
  const { accent, accentMuted } = getCategoryAccent(categoryType);
  const label = categoryType === 'trading_card' || categoryType === 'trading_cards' || categoryType === 'trading-cards'
    ? 'TRADING CARDS'
    : 'MEMORABILIA';

  return (
    <View style={[styles.categoryBadge, { backgroundColor: accentMuted }]}>
      <Text style={[styles.categoryText, { color: accent }]}>{label}</Text>
    </View>
  );
}

export function GroupListItem({ group, onPress }: GroupListItemProps) {
  const hasUnread = group.unread_count > 0 && !group.is_muted;
  const { accent } = getCategoryAccent(group.category_type);
  const preview = group.last_message?.content || 'No messages yet';
  const timeStr = group.last_message?.created_at
    ? formatMessageTime(group.last_message.created_at)
    : '';

  return (
    <TouchableOpacity
      style={[styles.card, group.is_pinned && styles.cardPinned]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}${hasUnread ? `, ${group.unread_count} unread` : ''}`}
    >
      {/* Cover banner */}
      <View style={styles.coverContainer}>
        {group.category_type && (
          <View style={[styles.accentStrip, { backgroundColor: accent }]} />
        )}
        <OptimizedImage
          src={group.cover_image_url || '/placeholder.svg'}
          style={styles.cover}
          width={400}
          height={80}
          accessibilityLabel={`${group.name} cover`}
        />
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{group.unread_count}</Text>
          </View>
        )}
      </View>

      {/* Info below cover */}
      <View style={styles.info}>
        {/* Row 1: Name + badges + time */}
        <View style={styles.nameRow}>
          <View style={styles.nameIcons}>
            <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
              {group.name}
            </Text>
            {group.is_pinned && <Pin size={12} color={colors.mutedForeground} />}
            {group.is_muted && <BellOff size={12} color={colors.mutedForeground} />}
            {group.is_official && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>OFFICIAL</Text>
              </View>
            )}
          </View>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>{timeStr}</Text>
        </View>

        {/* Row 2: Category badge + member count + online */}
        <View style={styles.metaRow}>
          <CategoryBadge categoryType={group.category_type} />
          <Text style={styles.metaText}>
            {group.member_count?.toLocaleString() || 0} members
            {group.online_count ? ` · ${group.online_count} online` : ''}
          </Text>
        </View>

        {/* Row 3: Last message preview */}
        <Text style={[styles.preview, hasUnread && styles.previewBold]} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPinned: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryGlow,
  },
  coverContainer: {
    position: 'relative',
    height: 80,
    backgroundColor: colors.muted,
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  cover: {
    width: '100%',
    height: 80,
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.attention,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.foreground,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono',
  },
  info: {
    padding: 12,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    color: colors.foreground,
    flexShrink: 1,
  },
  nameBold: {
    fontWeight: '700',
  },
  officialBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
  },
  officialText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  timeUnread: {
    color: colors.attention,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  preview: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  previewBold: {
    color: colors.foreground,
    fontWeight: '500',
  },
});
