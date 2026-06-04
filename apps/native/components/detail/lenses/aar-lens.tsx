import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LensPaywallCard } from '@/components/vault';
import { PRO_FEATURE_COPY, PRO_SHIP_DARK } from '@/lib/pro-ship-dark';
import { useTheme, SPACING } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';
import { NoSignatureState } from './aar-lens-no-signature';

export interface AarLensProps {
  isPro: boolean;
  isAutographed: boolean;
  onUpgrade: () => void;
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
  const copy = PRO_FEATURE_COPY.AAR;

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
        {PRO_SHIP_DARK || !isPro ? (
          <LensPaywallCard
            lensKey="AAR"
            accent={colors.traitViolet}
            kicker="VITRINE PRO"
            title={copy.title}
            blurb={copy.blurb}
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

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
  },
  body: {
    paddingHorizontal: SPACING.gutter,
    marginTop: SPACING.zoneCluster,
  },
});
