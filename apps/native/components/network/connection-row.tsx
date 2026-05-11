/**
 * ConnectionRow — V3 NETWORK lens row primitive used by FOLLOWERS,
 * FOLLOWING, and (with a one-line meta swap) MUTUAL.
 *
 * Layout:
 *   ┌──────┐  Display Name           [Follow]
 *   │  M   │  @username
 *   └──────┘  one-line bio · clamped
 *
 * The follow CTA renders three states:
 *   - viewer hasn't followed: solid white "Follow"
 *   - viewer has followed:    frost outline "Following"
 *   - own row (viewer === user): no CTA (the row is just navigation)
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/vault/avatar';
import { Button } from '@/components/vault/button';
import { useTheme, SPACING, TYPE } from '@/lib/design';

export interface ConnectionRowUser {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
}

export interface ConnectionRowProps {
  user: ConnectionRowUser;
  /** Whether the viewer is currently following this user. */
  isFollowing: boolean;
  /** Hide the CTA when viewer === user. */
  isSelf?: boolean;
  /**
   * Optional override for the secondary line (defaults to bio). MUTUAL
   * passes "Followed by you" or similar to communicate context.
   */
  metaLine?: string | null;
  followBusy?: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function ConnectionRow({
  user,
  isFollowing,
  isSelf = false,
  metaLine,
  followBusy = false,
  onPress,
  onToggleFollow,
}: ConnectionRowProps) {
  const { colors } = useTheme();
  const handle = user.username ? `@${user.username}` : '';
  const secondary = metaLine ?? user.bio ?? '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${user.displayName ?? 'Collector'} — open profile`}
    >
      <Avatar uri={user.avatar} name={user.displayName} size="md" ringed />

      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {user.displayName ?? 'Collector'}
        </Text>
        {handle ? (
          <Text style={[styles.handle, { color: colors.brandVolt }]} numberOfLines={1}>
            {handle}
          </Text>
        ) : null}
        {secondary ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>

      {isSelf ? null : (
        <View style={styles.ctaWrap}>
          <Button
            label={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'frost' : 'solid'}
            size="sm"
            loading={followBusy}
            onPress={onToggleFollow}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.zoneIntra,
    paddingVertical: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14.5,
  },
  handle: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  meta: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    marginTop: 2,
  },
  ctaWrap: {
    marginLeft: 4,
  },
});
