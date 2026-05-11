/**
 * MutualRow — visitor-only row primitive for the MUTUAL chip on the V3
 * NETWORK lens. Functionally identical to ConnectionRow, but threads
 * "Followed by you" into the meta line so the row reads with context
 * the way IG / Twitter "Followed by" lists do.
 */

import React from 'react';

import { ConnectionRow, type ConnectionRowUser } from './connection-row';

export interface MutualRowProps {
  user: ConnectionRowUser;
  /** Always true for MUTUAL rows by definition (viewer follows them). */
  isFollowing: boolean;
  followBusy?: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function MutualRow({
  user,
  isFollowing,
  followBusy,
  onPress,
  onToggleFollow,
}: MutualRowProps) {
  return (
    <ConnectionRow
      user={user}
      isFollowing={isFollowing}
      followBusy={followBusy}
      metaLine="Followed by you"
      onPress={onPress}
      onToggleFollow={onToggleFollow}
    />
  );
}
