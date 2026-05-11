import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Brackets, LensPaywallCard } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';

/**
 * AAR lens — Autograph Assessment Report.
 *
 * Universal-visibility (Philosophy B) means the lens always renders;
 * the body switches by viewer state and trait state:
 *
 *   1. Non-Pro                       → `LensPaywallCard` (violet accent)
 *   2. Pro + `is_autographed = true` → `LensComingSoon` placeholder
 *   3. Pro + `is_autographed = false`→ Affirmative empty state — the
 *      pipeline already analyzed and found no signature. Includes a
 *      `[REQUEST REVIEW]` stub for the V1.5 data-correction loop.
 *
 * The third state is the philosophical anchor for the whole lens
 * architecture: "no signature detected" is a positive answer, not a
 * dead end. We lean on this surface to teach users that lenses always
 * have something to say.
 */

export interface AarLensProps {
  isPro: boolean;
  isAutographed: boolean;
  onUpgrade: () => void;
  /** Stub for V1.5 data-correction loop — fires a toast for now. */
  onRequestReview?: () => void;
  bottomInset: number;
  dockReservedHeight: number;
}

export function AarLens({
  isPro,
  isAutographed,
  onUpgrade,
  onRequestReview,
  bottomInset,
  dockReservedHeight,
}: AarLensProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + dockReservedHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.body}>
        {!isPro ? (
          <LensPaywallCard
            lensKey="AAR"
            accent={colors.traitViolet}
            kicker="VITRINE PRO"
            title="Autograph Assessment Report"
            blurb="Signature authenticity scoring for autographed pieces — stroke-pattern analysis, pressure dynamics, and exemplar comparison so you have a confidence rating before you commit."
            onUpgrade={onUpgrade}
          />
        ) : isAutographed ? (
          <LensComingSoon
            lensKey="AAR"
            message="Stroke-pattern, pressure-dynamic, and exemplar analysis for this signature is being processed. The completed report will land here automatically."
          />
        ) : (
          <NoSignatureState onRequestReview={onRequestReview} />
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// AFFIRMATIVE EMPTY STATE — "this item was analyzed, no autograph found".
// Aesthetic mirrors the LensPaywallCard / LensComingSoon shell so the
// surface still reads as a deliberate analytical product, not a bug.
// ---------------------------------------------------------------------------

function NoSignatureState({
  onRequestReview,
}: {
  onRequestReview?: () => void;
}) {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    onRequestReview?.();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <View style={[styles.accentRail, { backgroundColor: colors.traitViolet }]} />
      <Brackets color={colors.traitViolet} />

      <View
        style={[styles.glyphWrap, { borderColor: colors.traitViolet }]}
      >
        <Text style={[styles.glyphText, { color: colors.traitViolet }]}>
          —
        </Text>
      </View>

      <Text style={[styles.kicker, { color: colors.traitViolet }]}>
        AAR · NO SIGNATURE
      </Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>NO AUTOGRAPH DETECTED</Text>
      <Text style={[styles.blurb, { color: colors.textSecondary }]}>
        This piece has been reviewed and shows no autograph. If you believe
        that&apos;s incorrect, request a manual review and we&apos;ll take
        another look.
      </Text>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cta,
          { borderColor: colors.frostBorderStrong },
          pressed && [styles.ctaPressed, { backgroundColor: colors.pressOverlay }],
        ]}
        accessibilityRole="button"
        accessibilityLabel="Request manual review"
      >
        <Text style={[styles.ctaLabel, { color: colors.textPrimary }]}>REQUEST REVIEW</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
  },
  body: {
    paddingHorizontal: SPACING.gutter,
    marginTop: SPACING.zoneCluster,
  },

  // No-signature card --------------------------------------------------
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
  glyphText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 32,
    lineHeight: 32,
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
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: SPACING.zoneIntra,
  },
  blurb: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.zoneCluster - 8,
    maxWidth: 320,
  },
  cta: {
    height: 40,
    borderRadius: RADII.pill,
    paddingHorizontal: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
  },
  ctaLabel: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
    letterSpacing: 1.0,
  },
});
