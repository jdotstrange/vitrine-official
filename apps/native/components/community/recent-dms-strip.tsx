import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { RecentDMsSkeleton } from '@/components/skeleton-community';
import { colors } from '@/lib/colors';
import type { Conversation } from '@/lib/api/messaging';

interface RecentDMsStripProps {
  conversations: Conversation[];
  isLoading: boolean;
}

interface DMContactProps {
  conversation: Conversation;
  onPress: () => void;
}

function DMContact({ conversation, onPress }: DMContactProps) {
  const user = conversation.other_user;
  const hasUnread = conversation.unread_count > 0 && !conversation.is_muted;

  return (
    <TouchableOpacity
      style={styles.avatarWrap}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Message ${user?.name || 'Unknown'}${hasUnread ? `, ${conversation.unread_count} unread` : ''}`}
    >
      <View style={styles.imageContainer}>
        {user?.is_online && <View style={styles.gradientRing} />}
        <View style={[styles.avatarBorder, user?.is_online && styles.avatarBorderActive]}>
          <OptimizedImage
            src={user?.avatar_url || '/placeholder.svg'}
            style={styles.avatar}
            width={48}
            height={48}
            accessibilityLabel={`${user?.name || 'User'} avatar`}
          />
        </View>
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </Text>
          </View>
        )}
        {user?.is_online && (
          <View style={styles.onlineDot} />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {user?.name?.split(' ')[0] || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );
}

export function RecentDMsStrip({ conversations, isLoading }: RecentDMsStripProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Messages</Text>
        </View>
        <RecentDMsSkeleton />
      </View>
    );
  }

  if (conversations.length === 0) return null;

  const handleSeeAll = () => router.push('/messages' as Href);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <TouchableOpacity
          onPress={handleSeeAll}
          style={styles.seeAllBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="See all messages"
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={conversations}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <DMContact
            conversation={item}
            onPress={() => router.push(`/messages/${item.id}` as Href)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: 0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  avatarWrap: {
    alignItems: 'center',
    width: 64,
  },
  imageContainer: {
    position: 'relative',
  },
  gradientRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.primary,
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    opacity: 0.7,
  },
  avatarBorder: {
    borderRadius: 26,
    padding: 2,
    backgroundColor: colors.background,
  },
  avatarBorderActive: {
    padding: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.muted,
  },
  unreadBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.attention,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.background,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.foreground,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.onlineDot,
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 6,
    textAlign: 'center',
  },
});
