import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  Activity,
  FileText,
  PenTool,
  type LucideIcon,
} from 'lucide-react-native';

import { Brackets } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

/**
 * LensComingSoon — Pro-eligible placeholder for analytical lenses
 * (PULSE / AAR / VAR) before the upstream pipeline ships.
 *
 * Distinct from `LensEmpty` because the absence here is *temporary*,
 * not affirmative — the user IS subscribed; the data simply isn't
 * generated yet. The card frames the absence as scheduled progress so
 * the surface still rewards the navigation.
 *
 * Visual language matches the lens-paywall card (slim accent rail +
 * tinted glyph + kicker + title) so the Pro-side empty state previews
 * the eventual document aesthetic. The subscriber gets the *shape* of
 * the report ahead of the data — anchored expectation, not blank space.
 */

export type LensComingSoonKey = 'PULSE' | 'AAR' | 'VAR';

const ICON_BY_LENS: Record<LensComingSoonKey, LucideIcon> = {
  PULSE: Activity,
  AAR: PenTool,
  VAR: FileText,
};

const TITLE_BY_LENS: Record<LensComingSoonKey, string> = {
  PULSE: 'Market Pulse',
  AAR: 'Autograph Assessment Report',
  VAR: 'Vitrine Analysis Report',
};

export interface LensComingSoonProps {
  lensKey: LensComingSoonKey;
  /** Override copy if the default per-lens title doesn't fit context. */
  title?: string;
  /** Subline beneath the title — defaults to a generic "in progress" line. */
  message?: string;
  style?: ViewStyle;
}

export function LensComingSoon({
  lensKey,
  title,
  message,
  style,
}: LensComingSoonProps) {
  const { colors } = useTheme();

  const accentByLens: Record<LensComingSoonKey, string> = {
    PULSE: colors.semanticGreen,
    AAR: colors.traitViolet,
    VAR: colors.traitCyan,
  };

  const accent = accentByLens[lensKey];
  const Glyph = ICON_BY_LENS[lensKey];
  const resolvedTitle = title ?? TITLE_BY_LENS[lensKey];
  const resolvedMessage =
    message ??
    'Pipeline in progress. Reports for this lens roll out as they finish processing — no action needed on your end.';

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, style]}>
      <View style={[styles.accentRail, { backgroundColor: accent }]} />
      <Brackets color={accent} />
      <View style={[styles.glyphWrap, { borderColor: accent }]}>
        <Glyph size={26} color={accent} strokeWidth={1.75} />
      </View>
      <Text style={[styles.kicker, { color: accent }]}>PIPELINE IN PROGRESS</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{resolvedTitle}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{resolvedMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: RADII.card,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  accentRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  glyphWrap: {
    width: 52,
    height: 52,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.zoneIntra,
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 20,
    letterSpacing: 1.3,
    textAlign: 'center',
    marginBottom: SPACING.zoneIntra,
  },
  message: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
  },
});
