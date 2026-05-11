/**
 * SuggestedRow — the V3 NETWORK lens hero primitive (Suggested chip).
 *
 * Anatomy:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  [Avatar]  Display Name                       [Follow]    │
 *   │            @username · NN COLL                            │
 *   │  ─────────────────────────────────────────                │
 *   │  ▣ comp glyph   "5 strong matches"                       │
 *   │  ┌──────┐ ┌──────┐ ┌──────┐                              │
 *   │  │ img1 │ │ img2 │ │ img3 │                              │
 *   │  └──────┘ └──────┘ └──────┘                              │
 *   └──────────────────────────────────────────────────────────┘
 *
 * The reason chip is the editorial moment of the row: it tells the viewer
 * *why* this collector showed up. The visual chrome (glyph + tint) is
 * picked from `REASON_CONFIG` so adding a new signal in the SQL scorer
 * is a one-stop change here on the client side.
 *
 * Followed rows stay visible after the follow CTA flips — the row updates
 * to "Following" and stays in the list. The list only re-shuffles on
 * pull-to-refresh (consistent with the design decision in the plan).
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import {
  Activity,
  Layers,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { Avatar } from '@/components/vault/avatar';
import { Button } from '@/components/vault/button';
import { useTheme, COLORS, RADII, SPACING, TYPE } from '@/lib/design';
import type {
  SuggestedReasonCode,
  SuggestedReasonMeta,
} from '@/lib/api/network';

interface ReasonChrome {
  glyph: LucideIcon;
  tint: string;
  fill: string;
  border: string;
  copy: (meta: SuggestedReasonMeta) => string;
}

const REASON_CONFIG: Record<SuggestedReasonCode, ReasonChrome> = {
  comp: {
    glyph: Layers,
    tint: COLORS.brandVolt,
    fill: COLORS.brandVoltFill,
    border: COLORS.brandVoltBorder,
    copy: (m) =>
      m.compCount && m.compCount > 1
        ? `${m.compCount} strong matches`
        : 'Strong match',
  },
  inventory: {
    glyph: Tag,
    tint: COLORS.traitCyan,
    fill: COLORS.traitCyanFill,
    border: COLORS.traitCyanBorder,
    copy: (m) =>
      m.sharedCategories && m.sharedCategories.length > 0
        ? `Shared interests · ${m.sharedCategories
            .map((c) => c.toUpperCase())
            .join(' · ')}`
        : 'Shared interests',
  },
  tracking: {
    glyph: Target,
    tint: COLORS.traitOlive,
    fill: COLORS.traitOliveFill,
    border: COLORS.traitOliveBorder,
    copy: (m) =>
      m.trackedCount && m.trackedCount > 1
        ? `${m.trackedCount} items you track`
        : 'You track an item',
  },
  network: {
    glyph: Users,
    tint: COLORS.traitViolet,
    fill: COLORS.traitVioletFill,
    border: COLORS.traitVioletBorder,
    copy: (m) =>
      m.viaCount && m.viaCount > 1
        ? `Followed by ${m.viaCount} you follow`
        : 'Followed by someone you follow',
  },
  authority: {
    glyph: ShieldCheck,
    tint: COLORS.textSecondary,
    fill: COLORS.semanticSilverFill,
    border: COLORS.frostBorderStrong,
    copy: () => 'Top collector',
  },
  serendipity: {
    glyph: Sparkles,
    tint: COLORS.traitPink,
    fill: COLORS.traitPinkFill,
    border: COLORS.traitPinkBorder,
    copy: () => 'Worth a look',
  },
};

export interface SuggestedRowProps {
  id: string;
  displayName: string | null;
  username: string | null;
  avatar: string | null;
  collectiblesCount: number;
  reasonCode: SuggestedReasonCode;
  reasonMeta: SuggestedReasonMeta;
  previewItems: string[];
  isFollowing: boolean;
  followBusy?: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}

export function SuggestedRow({
  displayName,
  username,
  avatar,
  collectiblesCount,
  reasonCode,
  reasonMeta,
  previewItems,
  isFollowing,
  followBusy = false,
  onPress,
  onToggleFollow,
}: SuggestedRowProps) {
  const { colors } = useTheme();
  const chrome = REASON_CONFIG[reasonCode] ?? REASON_CONFIG.authority;
  const Glyph = chrome.glyph;
  const reasonCopy = useMemo(() => chrome.copy(reasonMeta), [chrome, reasonMeta]);

  const handle = username ? `@${username}` : '';
  const collMeta =
    collectiblesCount > 0
      ? `${collectiblesCount.toLocaleString()} ${collectiblesCount === 1 ? 'item' : 'items'}`
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.86}
      style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}
      accessibilityRole="button"
      accessibilityLabel={`${displayName ?? 'Collector'} — suggested. ${reasonCopy}.`}
    >
      <View style={styles.headerRow}>
        <Avatar uri={avatar} name={displayName} size="md" ringed />
        <View style={styles.headerBody}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName ?? 'Collector'}
          </Text>
          <View style={styles.handleRow}>
            {handle ? (
              <Text style={[styles.handle, { color: colors.brandVolt }]} numberOfLines={1}>
                {handle}
              </Text>
            ) : null}
            {handle && collMeta ? <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text> : null}
            {collMeta ? (
              <Text style={[styles.collMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {collMeta}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.ctaWrap}>
          <Button
            label={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'frost' : 'solid'}
            size="sm"
            loading={followBusy}
            onPress={onToggleFollow}
          />
        </View>
      </View>

      <View
        style={[
          styles.reasonChip,
          { backgroundColor: chrome.fill, borderColor: chrome.border },
        ]}
      >
        <Glyph size={11} color={chrome.tint} strokeWidth={2.2} />
        <Text style={[styles.reasonText, { color: chrome.tint }]} numberOfLines={1}>
          {reasonCopy}
        </Text>
      </View>

      {previewItems.length > 0 ? (
        <View style={styles.previewRow}>
          {previewItems.slice(0, 3).map((uri, i) => (
            <View key={`${uri}-${i}`} style={[styles.previewTile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
              <Image
                source={{ uri }}
                style={styles.previewImage}
                contentFit="cover"
                transition={120}
              />
            </View>
          ))}
          {previewItems.length < 3
            ? Array.from({ length: 3 - previewItems.length }).map((_, i) => (
                <View
                  key={`placeholder-${i}`}
                  style={[styles.previewTile, styles.previewPlaceholder, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}
                />
              ))
            : null}
        </View>
      ) : (
        <View style={styles.previewRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={`placeholder-empty-${i}`}
              style={[styles.previewTile, styles.previewPlaceholder, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}
            />
          ))}
        </View>
      )}

      <View style={styles.signalIndicator}>
        <Activity size={9} color={colors.textTertiary} strokeWidth={2} />
        <Text style={[styles.signalText, { color: colors.textTertiary }]}>SIGNAL · SUGGESTED</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.zoneIntra,
    marginVertical: 8,
    padding: 14,
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14.5,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  handle: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  dot: {
    fontSize: 11,
  },
  collMeta: {
    fontFamily: TYPE.inter,
    fontSize: 11,
    flexShrink: 1,
  },
  ctaWrap: {
    marginLeft: 4,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  reasonText: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {},
  signalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  signalText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
