/**
 * SocialRow — INBOX-stream row primitive.
 *
 * Layout: avatar · body · optional right thumb. The avatar carries a
 * small badge in the bottom-right with the verb glyph + tint so the
 * row reads as "WHO did WHAT to WHICH thing" at a glance:
 *
 *   ┌──────┐  Mariah followed you                    ·
 *   │  M   │ ̶t̶r̶a̶c̶k̶ed̶  ̶1̶9̶6̶2̶ ̶T̶o̶p̶p̶s̶ ̶M̶a̶n̶t̶l̶e̶                  [thumb]
 *   └──────┘  4m ago
 *
 * Read state: a 3pt brandVolt rail on the left edge marks unread rows.
 * Tap surface is the entire card.
 *
 * Status / value verbs render an inline `StatusPill` after the body when
 * `newStatus` is supplied — keeps the type density without a second row.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import { Avatar } from '@/components/vault/avatar';
import { StatusPill } from '@/components/vault/status-pill';
import { useTheme, RADII, SPACING, TYPE, deriveStatus } from '@/lib/design';
import { formatTimeAgo } from '@/lib/format-time';
import type { ActivityVerb, VerbContext } from '@/lib/design/activity-verbs';
import { getVerbConfig } from '@/lib/design/activity-verbs';

export interface SocialRowProps {
  verb: ActivityVerb | string;
  ctx: VerbContext;
  /** ISO timestamp for the relative-time stamp. */
  time: string;
  isUnread: boolean;
  onPress: () => void;
}

export function SocialRow({ verb, ctx, time, isUnread, onPress }: SocialRowProps) {
  const { colors } = useTheme();
  const config = getVerbConfig(verb);
  const Glyph = config.glyph;
  const copy = useMemo(() => config.copy(ctx), [config, ctx]);
  const a11y = useMemo(() => config.accessibilityLabel(ctx), [config, ctx]);

  // Status / value verbs may carry a derivable listing-status payload.
  // Render an inline StatusPill when `newStatus` is supplied. We only
  // attempt the derivation for the boolean-pair encoding the rest of
  // the app uses; raw strings are passed through untouched.
  const inlineStatus = useMemo(() => {
    if (verb !== 'status_change' || !ctx.newStatus) return null;
    const v = String(ctx.newStatus).toLowerCase();
    if (v === 'sell' || v === 'for_sale') return deriveStatus(true, false);
    if (v === 'trade' || v === 'for_trade') return deriveStatus(false, true);
    if (v === 'sell_trade' || v === 'sell+trade') return deriveStatus(true, true);
    return deriveStatus(false, false);
  }, [verb, ctx.newStatus]);

  const rightThumbUri =
    config.hasRightThumb &&
    (ctx.collectibleImage || ctx.showcaseImage || ctx.compImage || null);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${a11y}${isUnread ? ', unread' : ''}`}
    >
      {isUnread ? <View style={[styles.unreadRail, { backgroundColor: colors.brandVolt }]} /> : null}

      <View style={styles.avatarWrap}>
        <Avatar uri={ctx.actorAvatar || null} name={ctx.actorName || null} size="sm" ringed />
        <View style={[styles.glyphBadge, { backgroundColor: config.tint, borderColor: colors.void }]}>
          <Glyph size={10} color={colors.void} strokeWidth={2.4} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.copyRow}>
          <Text style={[styles.copy, { color: colors.textPrimary }]} numberOfLines={2}>
            {copy.lead ? <Text style={[styles.bold, { color: colors.textPrimary }]}>{copy.lead}</Text> : null}
            {copy.mid ? <Text style={[styles.muted, { color: colors.textSecondary }]}>{copy.mid}</Text> : null}
            {copy.tail ? <Text style={[styles.bold, { color: colors.textPrimary }]}>{copy.tail}</Text> : null}
          </Text>
        </View>
        <View style={styles.metaRow}>
          {inlineStatus ? <StatusPill status={inlineStatus} /> : null}
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatTimeAgo(time)}</Text>
        </View>
      </View>

      {rightThumbUri ? (
        <View style={[styles.thumbWrap, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
          <Image source={{ uri: rightThumbUri }} style={styles.thumb} contentFit="cover" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.zoneIntra,
    paddingVertical: 14,
    position: 'relative',
  },
  unreadRail: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,
    width: 3,
    borderRadius: 1.5,
  },
  avatarWrap: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 13.5,
    lineHeight: 18,
  },
  bold: {
    fontFamily: TYPE.interSemiBold,
  },
  muted: {
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.small,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
