/**
 * CollectorResultRow — search result row for a collector.
 *
 * Layout:
 *   [avatar 48] Display Name              [Follow]
 *               @username   N items match
 *               [thumb 32] [thumb 32] [thumb 32]   (tier-2 only)
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar } from '@/components/vault';
import { followUser, unfollowUser } from '@/lib/api/follows';
import type { CollectorSearchResult } from '@/lib/api/market';
import { useTheme, RADII, TYPE } from '@/lib/design';

interface CollectorResultRowProps {
  result: CollectorSearchResult;
  currentUserId?: string;
  isFollowing?: boolean;
  onFollowChange?: (userId: string, following: boolean) => void;
}

export function CollectorResultRow({
  result,
  currentUserId,
  isFollowing = false,
  onFollowChange,
}: CollectorResultRowProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [followState, setFollowState] = useState(isFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = currentUserId === result.userId;

  const handleFollowPress = async () => {
    if (isSelf || followLoading) return;
    setFollowLoading(true);
    try {
      if (followState) {
        await unfollowUser(result.userId);
        setFollowState(false);
        onFollowChange?.(result.userId, false);
      } else {
        await followUser(result.userId);
        setFollowState(true);
        onFollowChange?.(result.userId, true);
      }
    } catch (err) {
      console.warn('[CollectorResultRow] follow error', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRowPress = () => {
    router.push(`/profile/${result.username}` as never);
  };

  const showThumbs = result.matchTier === 2 && result.previewThumbs.length > 0;
  const showMatchCount = result.matchCount > 0;

  return (
    <Pressable
      onPress={handleRowPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.frostDivider }, pressed && styles.rowPressed]}
    >
      <Avatar uri={result.avatar} name={result.displayName} size="md" />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.displayName, { color: colors.textPrimary }]} numberOfLines={1}>{result.displayName}</Text>
          {!isSelf ? (
            <Pressable
              onPress={handleFollowPress}
              disabled={followLoading}
              hitSlop={8}
              style={[
                styles.followBtn,
                { borderColor: colors.frostBorder },
                followState && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
              ]}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={colors.brandVolt} />
              ) : (
                <Text style={[styles.followText, { color: colors.textSecondary }, followState && { color: colors.brandVolt }]}>
                  {followState ? 'Following' : 'Follow'}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.username, { color: colors.textTertiary }]}>@{result.username}</Text>
          {showMatchCount ? (
            <Text style={[styles.matchCount, { color: colors.brandVolt }]}>{result.matchCount} items match</Text>
          ) : null}
        </View>

        {showThumbs ? (
          <View style={styles.thumbRow}>
            {result.previewThumbs.slice(0, 3).map((url, idx) => (
              <Image
                key={`${url}-${idx}`}
                source={{ uri: url }}
                style={[styles.thumb, { backgroundColor: colors.sheetBg }]}
                resizeMode="cover"
              />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.75,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
  },
  followBtn: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 76,
    alignItems: 'center',
  },
  followText: {
    fontFamily: TYPE.interMedium,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  username: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
  matchCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: RADII.small,
  },
});
