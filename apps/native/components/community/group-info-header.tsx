import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Settings, Users, Globe, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { OptimizedImage } from '@/components/optimized-image';
import { colors } from '@/lib/colors';
import { formatCount } from '@/lib/format-count';

interface GroupInfoHeaderProps {
  groupId: string;
  groupName: string;
  groupImage: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  isPublic: boolean;
  isOfficial?: boolean;
  type?: string;
  category?: string;
  isAdmin: boolean;
  isOwner: boolean;
  onBack?: () => void;
}

export function GroupInfoHeader({
  groupName,
  groupImage,
  description,
  memberCount,
  onlineCount,
  isPublic,
  isOfficial,
  type,
  category,
  isAdmin,
  isOwner,
  onBack,
}: GroupInfoHeaderProps) {
  const router = useRouter();

  return (
    <View>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <OptimizedImage
          src={groupImage || '/placeholder.svg'}
          style={styles.coverImage}
          width={400}
          height={128}
          accessibilityLabel={`${groupName} cover image`}
        />
        <View style={styles.coverGradient} />

        <TouchableOpacity
          onPress={() => (onBack ? onBack() : router.back())}
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>

        {(isAdmin || isOwner) && (
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Group settings"
          >
            <Settings size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}

        <View style={styles.avatarContainer}>
          <View style={styles.avatarBorder}>
            <OptimizedImage
              src={groupImage || '/placeholder.svg'}
              style={styles.avatar}
              width={88}
              height={88}
              accessibilityLabel={`${groupName} avatar`}
            />
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <View style={styles.titleHeader}>
          <Text style={styles.title}>{groupName}</Text>
          {isOfficial && (
            <View style={styles.officialBadge}>
              <Text style={styles.officialBadgeText}>OFFICIAL</Text>
            </View>
          )}
          <View style={styles.visibilityBadge}>
            {isPublic ? <Globe size={12} color={colors.mutedForeground} /> : <Lock size={12} color={colors.mutedForeground} />}
            <Text style={styles.visibilityText}>{isPublic ? 'Public' : 'Private'}</Text>
          </View>
        </View>

        {(type || category) && (
          <Text style={styles.subtitle}>{type}{category && ` \u00b7 ${category}`}</Text>
        )}

        <Text style={styles.description}>{description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Users size={16} color={colors.mutedForeground} />
            <Text style={styles.statValue}>{formatCount(memberCount)}</Text>
            <Text style={styles.statLabel}>members</Text>
          </View>
          <View style={styles.stat}>
            <View style={styles.onlineDot} />
            <Text style={[styles.statValue, { color: colors.onlineDot }]}>{onlineCount}</Text>
            <Text style={styles.statLabel}>online</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coverContainer: {
    height: 128,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glass,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -48,
    left: 16,
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: colors.background,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 16,
    gap: 10,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  officialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  visibilityText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onlineDot,
  },
});
