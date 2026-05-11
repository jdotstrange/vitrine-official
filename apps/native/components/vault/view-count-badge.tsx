/**
 * ViewCountBadge — small "X views" chip used on collectible / showcase /
 * profile cards once a target has crossed the visibility floor.
 *
 * Design contract:
 *   - Suppresses itself when `count < threshold` (default 50). Below
 *     the floor the data is more noise than signal — and a small "5
 *     views" badge in a sea of cards just trains the eye to ignore it.
 *   - Mono numerics + grotesk uppercase kicker for the same machine-
 *     readable feel as the SpatialCard tracking badge.
 *   - Glass chip on a black scrim — sits cleanly over both photo wells
 *     and meta surfaces.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Eye } from 'lucide-react-native';

import { useTheme, RADII, TYPE } from '@/lib/design';

export interface ViewCountBadgeProps {
  count: number;
  /** Min count to render. Below this the badge returns null. */
  threshold?: number;
  /** Optional override style for placement (absolute, etc.). */
  style?: ViewStyle;
  /** Compact variant: smaller padding for spatial card overlay. */
  compact?: boolean;
}

const DEFAULT_THRESHOLD = 50;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export function ViewCountBadge({
  count,
  threshold = DEFAULT_THRESHOLD,
  style,
  compact = false,
}: ViewCountBadgeProps) {
  const { colors } = useTheme();

  if (!count || count < threshold) return null;

  return (
    <View
      style={[
        styles.badge,
        { borderColor: colors.frostBorder },
        compact && styles.badgeCompact,
        style,
      ]}
      accessibilityLabel={`${count.toLocaleString()} views`}
    >
      <Eye size={compact ? 10 : 11} color={colors.textSecondary} strokeWidth={2.2} />
      <Text style={[styles.count, { color: colors.textPrimary }, compact && styles.countCompact]}>
        {formatCount(count)}
      </Text>
      <Text style={[styles.kicker, { color: colors.textSecondary }, compact && styles.kickerCompact]}>
        VIEWS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  count: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.3,
  },
  countCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  kicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.0,
  },
  kickerCompact: {
    fontSize: 8,
    lineHeight: 10,
  },
});
