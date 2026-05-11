import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Target,
  Eye,
  ChevronRight,
  Clock,
  Globe,
  Lock,
} from 'lucide-react-native';
import { type StatusConfig } from '@/lib/status-utils';
import { formatTimeAgo } from '@/lib/format-time';
import { formatCount } from '@/lib/format-count';
import { colors } from '@/lib/colors';

export interface TitleCardProps {
  title: string;
  statusConfig: StatusConfig;
  visibility?: 'public' | 'private';
  collector: string;
  isOwner: boolean;
  listedAt: Date | string | number;
  views?: number;
  tracks?: number;
  onCollectorClick?: () => void;
}

export function TitleCard({
  title,
  statusConfig,
  visibility,
  collector,
  isOwner,
  listedAt,
  views,
  tracks,
  onCollectorClick,
}: TitleCardProps) {
  return (
    <View style={styles.titleCard}>
      <View style={styles.titleHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
        {isOwner && (
          <View style={styles.visibilityBadge}>
            {visibility === 'private' ? (
              <>
                <Lock size={14} color={colors.mutedForeground} />
                <Text style={styles.visibilityText}>Private</Text>
              </>
            ) : (
              <>
                <Globe size={14} color={colors.mutedForeground} />
                <Text style={styles.visibilityText}>Public</Text>
              </>
            )}
          </View>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {isOwner ? (
        <View style={styles.ownerRow}>
          <Text style={styles.ownerLabel}>In your collection</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={onCollectorClick} style={styles.ownerRow} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`View ${collector}'s profile`}>
          <View style={styles.ownerAvatarSmall}>
            <Text style={styles.ownerAvatarSmallText}>
              {collector
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.ownerName}>Collected by {collector}</Text>
          <ChevronRight size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {typeof tracks === 'number' && tracks > 0 && (
        <View style={styles.watchedByBadge}>
          <Target size={13} color={colors.primary} />
          <Text style={styles.watchedByText}>
            {formatCount(tracks)} {tracks === 1 ? 'collector is' : 'collectors are'} tracking this
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Clock size={14} color={colors.mutedForeground} />
          <Text style={styles.statText}>{formatTimeAgo(listedAt)}</Text>
        </View>
        <Text style={styles.statDivider}>•</Text>
        <View style={styles.statItem}>
          <Eye size={14} color={colors.mutedForeground} />
          <Text style={styles.statText}>
            {typeof views === 'number' ? formatCount(views) : '--'} views
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleCard: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visibilityText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  ownerAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarSmallText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  ownerName: {
    fontSize: 13,
    color: colors.mutedForeground,
    flex: 1,
  },
  ownerLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  watchedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '25',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  watchedByText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  statDivider: {
    fontSize: 12,
    color: 'rgba(153, 153, 170, 0.4)',
  },
});
