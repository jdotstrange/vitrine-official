import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  Activity,
  FileText,
  PenTool,
  type LucideIcon,
} from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

import { Brackets } from './brackets';
import { Button } from './button';

/**
 * LensPaywallCard — V3 in-lens upsell shell.
 *
 * Used by the collectible-detail Pro lenses (PULSE / AAR / VAR) when the
 * viewer is non-Pro. Replaces the modal-popup paywall pattern with a
 * branded landing page that lives *inside* the lens body. The user has
 * already navigated into the lens; tapping a Pro lens reveals "what
 * you'd see if you upgraded" rather than a generic "you can't go here"
 * gate.
 *
 * Why an in-lens card rather than a modal:
 *   - Hooked variable-reward pattern: the user invested a tap, so the
 *     reward is a richer surface, not friction.
 *   - The card IS the lens body — same swipe to leave, same selector
 *     chrome, no z-index gymnastics, no dismiss-state.
 *
 * Design contract:
 *   - Dossier-card chrome (sheetBg + frostBorder + brackets) tinted with
 *     a per-lens accent (`semanticGreen` for PULSE, `traitViolet` for
 *     AAR, `traitCyan` for VAR).
 *   - A 2pt accent-colored top rail signals "specialized analytical
 *     surface" without overwhelming the chrome.
 *   - One CTA. The job here is conversion, not menu choice.
 *   - Active-tab underline in the lens selector stays brandVolt
 *     (deliberate — chrome is identical for Pro/non-Pro per V3 spec).
 *
 * The component renders WITHOUT a scroll wrapper; the parent lens body
 * manages scrolling so the card can stack with other empty-state
 * elements if needed (it usually doesn't — paywall stands alone).
 */

export type LensPaywallKey = 'PULSE' | 'AAR' | 'VAR';

const ICON_BY_LENS: Record<LensPaywallKey, LucideIcon> = {
  // Live/heartbeat metaphor — Pulse reads market motion.
  PULSE: Activity,
  // Signature analysis — penTool overlays nicely on the violet accent.
  AAR: PenTool,
  // Branded report document — VAR is fundamentally a structured
  // documentation artifact.
  VAR: FileText,
};

export interface LensPaywallCardProps {
  /** Which Pro lens this card is gating. Drives default glyph + a11y. */
  lensKey: LensPaywallKey;
  /**
   * Per-lens accent. Caller passes the value (rather than us reading
   * from a registry) so the lens body owns its color identity.
   */
  accent: string;
  /** Headline — e.g. "Market Pulse". */
  title: string;
  /**
   * Small uppercase rail above the title — typically "PRO MEMBERSHIP"
   * or "VITRINE PRO". Caller controls so we can A/B framings.
   */
  kicker: string;
  /** One-paragraph explanation of what the lens does. */
  blurb: string;
  /** CTA tap — usually opens the upgrade flow. */
  onUpgrade: () => void;
  /** CTA label override. Defaults to "UNLOCK PRO". */
  ctaLabel?: string;
  /** Optional icon override; falls back to the per-lens default. */
  icon?: LucideIcon;
  /** Wrapper override for layout-side composition. */
  style?: ViewStyle;
}

export function LensPaywallCard({
  lensKey,
  accent,
  title,
  kicker,
  blurb,
  onUpgrade,
  ctaLabel = 'UNLOCK PRO',
  icon,
  style,
}: LensPaywallCardProps) {
  const { colors } = useTheme();
  const Glyph = icon ?? ICON_BY_LENS[lensKey];

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, style]}>
      <View style={[styles.accentRail, { backgroundColor: accent }]} />
      <Brackets color={accent} />
      <View style={[styles.glyphWrap, { borderColor: accent }]}>
        <Glyph size={28} color={accent} strokeWidth={1.75} />
      </View>
      <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
        {title}
      </Text>
      <Text style={[styles.blurb, { color: colors.textSecondary }]}>{blurb}</Text>
      <Button
        label={ctaLabel}
        onPress={onUpgrade}
        variant="frost"
        size="md"
        fullWidth
        style={styles.cta}
      />
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
    paddingBottom: 24,
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
    width: 56,
    height: 56,
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
    fontSize: 22,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: SPACING.zoneIntra,
  },
  blurb: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.zoneCluster,
    maxWidth: 320,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
