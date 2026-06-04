import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Brackets } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

export function NoSignatureState({
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

      <View style={[styles.glyphWrap, { borderColor: colors.traitViolet }]}>
        <Text style={[styles.glyphText, { color: colors.traitViolet }]}>—</Text>
      </View>

      <Text style={[styles.kicker, { color: colors.traitViolet }]}>AAR · NO SIGNATURE</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>NO AUTOGRAPH DETECTED</Text>
      <Text style={[styles.blurb, { color: colors.textSecondary }]}>
        This piece has been reviewed and shows no autograph. If you believe that&apos;s incorrect,
        request a manual review and we&apos;ll take another look.
      </Text>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cta,
          { borderColor: colors.frostBorderStrong },
          pressed && { backgroundColor: colors.pressOverlay },
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
  ctaLabel: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
    letterSpacing: 1.0,
  },
});
