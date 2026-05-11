import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Info, MoreHorizontal } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { ActionIcon } from '@/components/ui/action-icon';
import { colors } from '@/lib/colors';

interface ChatHeaderUser {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatHeaderProps {
  variant: 'group' | 'direct';
  groupName?: string;
  groupImage?: string;
  memberCount?: number;
  onlineCount?: number;
  isOfficial?: boolean;
  otherUser?: ChatHeaderUser;
  groupId?: string;
  paddingTop: number;
  onBack?: () => void;
}

export function ChatHeader({
  variant,
  groupName,
  groupImage,
  memberCount,
  onlineCount,
  isOfficial,
  otherUser,
  groupId,
  paddingTop,
  onBack,
}: ChatHeaderProps) {
  const router = useRouter();
  const isGroup = variant === 'group';

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const handleInfoPress = () => {
    if (isGroup && groupId) {
      router.push(`/community/${groupId}/info` as never);
    }
  };

  const subtitle = isGroup
    ? `${memberCount?.toLocaleString() || 0} members${onlineCount && onlineCount > 0 ? ` · ${onlineCount} online` : ''}`
    : otherUser?.isOnline
      ? 'Online'
      : `Last seen ${otherUser?.lastSeen || 'recently'}`;

  return (
    <View style={[styles.header, { paddingTop: paddingTop + 8 }]}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <ActionIcon icon={ArrowLeft} onPress={handleBack} label="Go back" size={20} />

        <TouchableOpacity
          onPress={handleInfoPress}
          style={styles.avatarContainer}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isGroup ? `View ${groupName} info` : `View ${otherUser?.name || 'user'} profile`}
        >
          <OptimizedImage
            src={isGroup ? (groupImage || '/placeholder.svg') : (otherUser?.avatar || '/placeholder.svg')}
            style={styles.avatar}
            width={40}
            height={40}
            accessibilityLabel={isGroup ? `${groupName} avatar` : `${otherUser?.name || 'User'} avatar`}
          />
          {!isGroup && otherUser?.isOnline && <View style={styles.onlineDot} />}
        </TouchableOpacity>

        <View style={styles.info}>
          <View style={styles.infoTop}>
            <Text style={styles.title} numberOfLines={1}>
              {isGroup ? groupName : (otherUser?.name || 'Unknown')}
            </Text>
            {isGroup && isOfficial && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>OFFICIAL</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>

        {isGroup ? (
          <ActionIcon icon={Users} onPress={handleInfoPress} label="View group members" size={20} />
        ) : (
          <ActionIcon icon={Info} label="View conversation info" size={20} />
        )}
        <ActionIcon icon={MoreHorizontal} label="More options" size={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glass,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.onlineDot,
    borderWidth: 2,
    borderColor: colors.background,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  officialBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primaryMuted,
  },
  officialText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
