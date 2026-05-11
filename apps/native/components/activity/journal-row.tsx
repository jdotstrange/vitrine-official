/**
 * JournalRow — JOURNAL-stream row primitive.
 *
 * JOURNAL rows record the user's own actions ("you added X", "you
 * created Y"). They never carry a read/unread state and live at lower
 * visual volume than INBOX/SIGNALS rows so they don't compete for
 * attention.
 *
 * Visual cues that mark journal rows as "you, not someone":
 *   - YOU mono kicker in textTertiary
 *   - Glyph tile sits at 60% alpha vs SignalRow's full tint
 *   - Body copy uses the same Inter face as social/signal rows but at
 *     textSecondary weight for a quieter read (no italic editorial voice)
 *   - No avatar, no unread rail
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { formatTimeAgo } from '@/lib/format-time';
import type { ActivityVerb, VerbContext } from '@/lib/design/activity-verbs';
import { getVerbConfig } from '@/lib/design/activity-verbs';

export interface JournalRowProps {
  verb: ActivityVerb | string;
  ctx: VerbContext;
  time: string;
  onPress: () => void;
}

export function JournalRow({ verb, ctx, time, onPress }: JournalRowProps) {
  const { colors } = useTheme();
  const config = getVerbConfig(verb);
  const Glyph = config.glyph;
  const copy = useMemo(() => config.copy(ctx), [config, ctx]);
  const a11y = useMemo(() => config.accessibilityLabel(ctx), [config, ctx]);

  const rightThumbUri =
    config.hasRightThumb && (ctx.collectibleImage || ctx.showcaseImage || null);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <View style={[styles.glyphTile, { borderColor: colors.frostDivider, backgroundColor: colors.sheetBg }]}>
        <Glyph size={16} color={colors.textTertiary} strokeWidth={2} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.kicker, { color: colors.textTertiary }]}>YOU</Text>
        <Text style={[styles.copy, { color: colors.textSecondary }]} numberOfLines={2}>
          {copy.lead}
          {copy.mid}
          {copy.tail}
        </Text>
        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatTimeAgo(time)}</Text>
      </View>

      {rightThumbUri ? (
        <View style={[styles.thumbWrap, { borderColor: colors.frostDivider, backgroundColor: colors.sheetBg }]}>
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
    paddingVertical: 12,
    opacity: 0.92,
  },
  glyphTile: {
    width: 32,
    height: 32,
    borderRadius: RADII.small,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kicker: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  copy: {
    fontFamily: TYPE.inter,
    fontSize: 13.5,
    lineHeight: 18,
  },
  timestamp: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  thumbWrap: {
    width: 38,
    height: 38,
    borderRadius: RADII.small,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    opacity: 0.85,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
