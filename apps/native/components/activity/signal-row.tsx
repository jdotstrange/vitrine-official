/**
 * SignalRow — SIGNALS-stream row primitive.
 *
 * SIGNALS verbs are system-generated (no human actor). The avatar slot
 * is replaced by a square glyph tile in the verb's tint, and the body
 * is built around a kicker line that names the signal type
 * ("STRONG MATCH" / "MILESTONE" / "WEEKLY DIGEST") above the body copy.
 *
 *   ┌────┐  STRONG MATCH                              ·
 *   │ ⊕  │  Strong match for 1962 Topps Mantle    [thumb]
 *   └────┘  4m ago
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { formatTimeAgo } from '@/lib/format-time';
import type { ActivityVerb, VerbContext } from '@/lib/design/activity-verbs';
import { getVerbConfig } from '@/lib/design/activity-verbs';

const KICKER_BY_VERB: Record<string, string> = {
  comp_alert: 'STRONG MATCH',
  view_milestone: 'MILESTONE',
  weekly_view_digest: 'WEEKLY DIGEST',
};

export interface SignalRowProps {
  verb: ActivityVerb | string;
  ctx: VerbContext;
  time: string;
  isUnread: boolean;
  onPress: () => void;
}

export function SignalRow({ verb, ctx, time, isUnread, onPress }: SignalRowProps) {
  const { colors } = useTheme();
  const config = getVerbConfig(verb);
  const Glyph = config.glyph;
  const copy = useMemo(() => config.copy(ctx), [config, ctx]);
  const a11y = useMemo(() => config.accessibilityLabel(ctx), [config, ctx]);
  const kicker = KICKER_BY_VERB[verb] || 'SIGNAL';

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

      <View
        style={[
          styles.glyphTile,
          { backgroundColor: `${config.tint}22`, borderColor: `${config.tint}55` },
        ]}
      >
        <Glyph size={18} color={config.tint} strokeWidth={2.2} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.kicker, { color: config.tint }]} numberOfLines={1}>
          {kicker}
        </Text>
        <Text style={[styles.copy, { color: colors.textPrimary }]} numberOfLines={2}>
          {copy.lead ? <Text style={[styles.bold, { color: colors.textPrimary }]}>{copy.lead}</Text> : null}
          {copy.mid ? <Text style={[styles.muted, { color: colors.textSecondary }]}>{copy.mid}</Text> : null}
          {copy.tail ? <Text style={[styles.bold, { color: colors.textPrimary }]}>{copy.tail}</Text> : null}
        </Text>
        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatTimeAgo(time)}</Text>
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
  glyphTile: {
    width: 36,
    height: 36,
    borderRadius: RADII.small,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  copy: {
    fontFamily: TYPE.inter,
    fontSize: 13.5,
    lineHeight: 18,
  },
  bold: {
    fontFamily: TYPE.interSemiBold,
  },
  muted: {
  },
  timestamp: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginTop: 2,
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
