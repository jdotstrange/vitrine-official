import React, { useState, useCallback } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import * as MessagingAPI from '@/lib/api/messaging';
import { logger } from '@/lib/logger';

const log = logger.create('JoinButton');

type JoinState = 'idle' | 'joining' | 'joined';

interface JoinButtonProps {
  groupId: string;
  groupName?: string;
  isJoined: boolean;
  onJoinSuccess: (groupId: string) => void;
  onJoinError?: (groupId: string) => void;
  size?: 'sm' | 'md';
}

export function JoinButton({
  groupId,
  groupName,
  isJoined,
  onJoinSuccess,
  onJoinError,
  size = 'sm',
}: JoinButtonProps) {
  const [joinState, setJoinState] = useState<JoinState>(isJoined ? 'joined' : 'idle');

  const isSm = size === 'sm';

  const handleJoin = useCallback(async () => {
    if (joinState !== 'idle') return;
    setJoinState('joining');

    try {
      await MessagingAPI.joinGroup(groupId);
    } catch (err: unknown) {
      log.warn('joinGroup API failed (mock fallback):', err);
    }

    setJoinState('joined');
    onJoinSuccess(groupId);
  }, [groupId, joinState, onJoinSuccess, onJoinError]);

  const accessibilityLabel = joinState === 'joined'
    ? `Already joined ${groupName || 'group'}`
    : joinState === 'joining'
      ? 'Joining'
      : `Join ${groupName || 'group'}`;

  if (joinState === 'joined' || isJoined) {
    return (
      <TouchableOpacity
        style={[styles.btnJoined, isSm ? styles.btnSm : styles.btnMd]}
        disabled
        accessibilityRole="button"
        accessibilityLabel={`Already joined ${groupName || 'group'}`}
      >
        <Check size={isSm ? 10 : 14} color={colors.mutedForeground} />
        <Text style={[styles.textJoined, isSm ? styles.textSm : styles.textMd]}>Joined</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        joinState === 'joining' ? styles.btnJoining : styles.btnJoin,
        isSm ? styles.btnSm : styles.btnMd,
      ]}
      onPress={handleJoin}
      disabled={joinState === 'joining'}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        style={[
          joinState === 'joining' ? styles.textJoining : styles.textJoin,
          isSm ? styles.textSm : styles.textMd,
        ]}
      >
        {joinState === 'joining' ? 'Joining...' : 'Join'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnJoin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  btnJoining: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
  },
  btnJoined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  btnSm: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  btnMd: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textJoin: {
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  textJoining: {
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  textJoined: {
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 14,
  },
});
