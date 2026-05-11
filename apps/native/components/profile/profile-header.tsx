import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  BadgeCheck,
  Send,
  UserPlus,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { type CategoryAccentColors } from '@/lib/category-identity';
import { OptimizedImage } from '../optimized-image';
import { UserAvatar } from '../ui/user-avatar';

interface CollectionRatio {
  memorabilia: number;
  tradingCards: number;
}

interface CollectorData {
  name: string;
  username: string;
  avatar: string | null | undefined;
  bio?: string | null;
  verified: boolean;
  stats: {
    collection: number;
    showcases: number;
    tracks: string;
    value: string;
    followers?: string;
    following?: string;
  };
  rank: number;
  reputation: number;
  collectionRatio?: CollectionRatio;
  categoryBreakdown?: { id: string; label: string; pct: number; color: string }[];
  featuredShowcase?: { id: string; title: string; images: string[]; items: number; totalValue: number } | null;
}

export interface ProfileHeaderProps {
  collector: CollectorData;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onEditProfile: () => void;
  onFeaturedShowcasePress?: (showcaseId: string) => void;
  onConnectionsPress?: (tab: 'followers' | 'following') => void;
  affinityAccent?: CategoryAccentColors;
}

export function ProfileHeader({
  collector,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onEditProfile,
  onFeaturedShowcasePress,
  onConnectionsPress,
  affinityAccent,
}: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const tint = affinityAccent?.accent ?? colors.primary;

  const breakdown = collector.categoryBreakdown;
  const hasDna = breakdown && breakdown.length > 0;
  const ratio = collector.collectionRatio ?? { memorabilia: 50, tradingCards: 50 };
  const total = ratio.memorabilia + ratio.tradingCards;
  const memPct = total > 0 ? Math.round((ratio.memorabilia / total) * 100) : 50;
  const tcPct = total > 0 ? 100 - memPct : 50;

  let dnaLegendItems: { id: string; label: string; pct: number; color: string }[] = [];
  if (hasDna) {
    const topN = breakdown.slice(0, 5);
    const other = breakdown.slice(5);
    const otherPct = other.reduce((s, x) => s + x.pct, 0);
    dnaLegendItems = otherPct > 0
      ? [...topN, { id: 'other', label: 'Other', pct: otherPct, color: colors.mutedForeground }]
      : topN;
  }

  return (
    <View style={[styles.profileHeader, { paddingTop: insets.top + 72 }]}>
      {/* ── Identity Row: avatar left, info right ── */}
      <View style={styles.identityRow}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { borderColor: tint + '60' }]}>
            {collector.avatar ? (
              <OptimizedImage
                src={collector.avatar}
                style={styles.avatar}
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
                accessibilityLabel={`${collector.name}'s avatar`}
              />
            ) : (
              <UserAvatar uri={null} name={collector.name} size={AVATAR_SIZE} />
            )}
          </View>
        </View>

        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{collector.name}</Text>
            {collector.verified && <BadgeCheck size={14} color={tint} fill={tint} />}
            {isOwnProfile && (
              <TouchableOpacity
                onPress={onEditProfile}
                style={styles.editButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Text style={[styles.editButtonText, { color: tint }]}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.username}>@{collector.username}</Text>
          {collector.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{collector.bio}</Text>
          ) : null}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={onFollowToggle}
                style={[
                  styles.followButton,
                  { backgroundColor: tint },
                  isFollowing && styles.followButtonActive,
                ]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isFollowing ? 'Unfollow' : 'Follow'}
              >
                <UserPlus size={12} color={isFollowing ? colors.foreground : colors.background} />
                <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Send size={12} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── Followers / Following Row ── */}
      {onConnectionsPress && (
        <View style={styles.connectionsRow}>
          <TouchableOpacity
            style={styles.connectionsTap}
            onPress={() => onConnectionsPress('followers')}
            activeOpacity={0.7}
          >
            <Text style={styles.connectionsValue}>{collector.stats.followers ?? '0'}</Text>
            <Text style={styles.connectionsLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.connectionsDot} />
          <TouchableOpacity
            style={styles.connectionsTap}
            onPress={() => onConnectionsPress('following')}
            activeOpacity={0.7}
          >
            <Text style={styles.connectionsValue}>{collector.stats.following ?? '0'}</Text>
            <Text style={styles.connectionsLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Full-width Stats Bar ── */}
      <View style={styles.statsBar}>
        {[
          { value: collector.stats.collection, label: 'Items' },
          { value: collector.stats.showcases, label: 'Showcases' },
          { value: collector.stats.tracks, label: 'Tracks' },
          { value: collector.stats.value, label: 'Value', accent: true },
        ].map((stat, i, arr) => (
          <View key={i} style={styles.statCell}>
            <Text style={[styles.statValue, stat.accent && { color: colors.primary }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            {i < arr.length - 1 && <View style={styles.statDivider} />}
          </View>
        ))}
      </View>

      {/* ── Collector DNA ── */}
      <View style={styles.dnaContainer}>
        <Text style={styles.dnaTitle}>Collector DNA</Text>
        {hasDna ? (
          <>
            <View style={styles.dnaBar}>
              {breakdown.map((seg, i) => (
                <View
                  key={seg.id}
                  style={[
                    styles.dnaSegment,
                    { width: `${seg.pct}%`, backgroundColor: seg.color },
                    i === 0 && styles.dnaSegmentFirst,
                    i === breakdown.length - 1 && styles.dnaSegmentLast,
                  ]}
                />
              ))}
            </View>
            <View style={styles.dnaLegend}>
              {dnaLegendItems.map((seg, i) => (
                <View key={`${seg.id}-${i}`} style={styles.dnaLegendItem}>
                  <View style={[styles.dnaLegendDot, { backgroundColor: seg.color }]} />
                  <Text style={styles.dnaLegendText} numberOfLines={1}>
                    {seg.label} {seg.pct}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.dnaBar}>
              <View style={[styles.dnaSegment, styles.dnaSegmentFirst, { width: `${memPct}%`, backgroundColor: colors.primary }]} />
              <View style={[styles.dnaSegment, styles.dnaSegmentLast, { width: `${tcPct}%`, backgroundColor: colors.accent }]} />
            </View>
            <View style={styles.dnaLegend}>
              <View style={styles.dnaLegendItem}>
                <View style={[styles.dnaLegendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.dnaLegendText}>Memorabilia {memPct}%</Text>
              </View>
              <View style={styles.dnaLegendItem}>
                <View style={[styles.dnaLegendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.dnaLegendText}>Cards {tcPct}%</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* ── Featured Showcase ── */}
      {collector.featuredShowcase && onFeaturedShowcasePress && (() => {
        const fs = collector.featuredShowcase!;
        const heroImg = fs.images[0];
        const thumbs = fs.images.slice(1, 4);
        const valStr = fs.totalValue >= 1000
          ? `$${(fs.totalValue / 1000).toFixed(1)}K`
          : `$${fs.totalValue.toLocaleString()}`;
        return (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => onFeaturedShowcasePress(fs.id)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`View featured showcase: ${fs.title}`}
          >
            {heroImg && (
              <OptimizedImage
                src={heroImg}
                style={styles.featuredHeroImg}
                width={400}
                height={160}
                accessibilityLabel=""
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(12,12,16,0.85)', 'rgba(12,12,16,0.98)']}
              locations={[0, 0.45, 1]}
              style={styles.featuredGradient}
            />
            <View style={styles.featuredContent}>
              <Text style={styles.featuredLabel}>FEATURED SHOWCASE</Text>
              <Text style={styles.featuredTitle} numberOfLines={1}>{fs.title}</Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredStat}>{fs.items} items</Text>
                <View style={styles.featuredMetaDot} />
                <Text style={[styles.featuredStat, { color: colors.primary }]}>{valStr}</Text>
                <View style={{ flex: 1 }} />
                <ChevronRight size={14} color={colors.mutedForeground} />
              </View>
              {thumbs.length > 0 && (
                <View style={styles.featuredThumbs}>
                  {thumbs.map((uri, i) => (
                    <OptimizedImage
                      key={i}
                      src={uri}
                      style={[styles.featuredThumb, i > 0 && { marginLeft: -8 }]}
                      width={40}
                      height={40}
                      accessibilityLabel=""
                    />
                  ))}
                  {fs.images.length > 4 && (
                    <View style={[styles.featuredThumb, styles.featuredThumbMore, { marginLeft: -8 }]}>
                      <Text style={styles.featuredThumbMoreText}>+{fs.images.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })()}
    </View>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  profileHeader: {
    paddingBottom: 12,
  },

  /* ── Identity Row ── */
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 14,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: colors.secondary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  identityInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  username: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  bio: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 6,
    lineHeight: 16,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    height: 32,
  },
  followButtonActive: {
    backgroundColor: colors.secondary,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  followButtonTextActive: {
    color: colors.foreground,
  },
  messageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 45, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* ── Connections Row ── */
  connectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  connectionsTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  connectionsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  connectionsLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  connectionsDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.mutedForeground,
    opacity: 0.4,
  },

  /* ── Stats Bar ── */
  statsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: colors.border,
  },

  /* ── Featured Showcase ── */
  featuredCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    height: 180,
    position: 'relative',
  },
  featuredHeroImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  featuredLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 6,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  featuredStat: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  featuredMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.mutedForeground,
    opacity: 0.5,
  },
  featuredThumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.secondary,
  },
  featuredThumbMore: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  featuredThumbMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.mutedForeground,
  },

  /* ── Collection DNA ── */
  dnaContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dnaTitle: {
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dnaBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  dnaSegment: {
    height: '100%',
  },
  dnaSegmentFirst: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  dnaSegmentLast: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  dnaLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
    columnGap: 12,
  },
  dnaLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dnaLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dnaLegendText: {
    fontSize: 11,
    color: colors.mutedForeground,
    letterSpacing: 0.2,
  },
});
