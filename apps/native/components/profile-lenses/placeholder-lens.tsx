import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

import { Brackets } from '@/components/vault';
import { useTheme, SPACING, TYPE } from '@/lib/design';

/**
 * PlaceholderLens — bracketed "V3 in flight" card used by hub lenses whose
 * full V3 redesign hasn't shipped yet (currently NOTIFICATIONS, NETWORK).
 *
 * Why a placeholder instead of the existing legacy UI:
 *   The hub's signature value is rhythm — six surfaces, all V3, all
 *   tonally aligned. Dropping legacy chrome (default light bg, mismatched
 *   typography) into the pager would shatter that rhythm and read worse
 *   than an honest "this surface is being upgraded" card. The placeholder
 *   ships the hub on time without dragging legacy debt into the v3 layer.
 *
 * Shape:
 *   - Centered bracketed card on COLORS.void
 *   - Mono kicker: e.g. "NOTIFICATIONS / V3 IN FLIGHT"
 *   - Hero display label: e.g. "ACTIVITY FEED"
 *   - Optional supporting blurb in inter body type
 *   - Optional icon above the kicker for visual anchoring
 */

const GUTTER = SPACING.zoneIntra;

export interface PlaceholderLensProps {
  kicker: string;
  title: string;
  blurb?: string;
  icon?: LucideIcon;
}

export function PlaceholderLens({ kicker, title, blurb, icon: Icon }: PlaceholderLensProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.void }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets size={10} />
        {Icon ? (
          <View style={[styles.iconWrap, { backgroundColor: colors.void, borderColor: colors.frostBorderStrong }]}>
            <Icon size={28} color={colors.textTertiary} strokeWidth={1.5} />
          </View>
        ) : null}
        <Text style={[styles.kicker, { color: colors.textTertiary }]}>{kicker}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {blurb ? <Text style={[styles.blurb, { color: colors.textSecondary }]}>{blurb}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: GUTTER,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  card: {
    width: '100%',
    minHeight: 280,
    paddingVertical: 48,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  blurb: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
  },
});
