import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LensPaywallCard } from '@/components/vault';
import { PRO_FEATURE_COPY, PRO_SHIP_DARK } from '@/lib/pro-ship-dark';
import { useTheme, SPACING } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';

export interface PulseLensProps {
  isPro: boolean;
  onUpgrade: () => void;
  bottomInset: number;
  dockReservedHeight: number;
}

export function PulseLens({
  isPro,
  onUpgrade,
  bottomInset,
  dockReservedHeight,
}: PulseLensProps) {
  const { colors } = useTheme();
  const copy = PRO_FEATURE_COPY.PULSE;

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
            lensKey="PULSE"
            accent={colors.semanticGreen}
            kicker="VITRINE PRO"
            title={copy.title}
            blurb={copy.blurb}
            onUpgrade={onUpgrade}
          />
        ) : (
          <LensComingSoon
            lensKey="PULSE"
            message="Live demand signals, price velocity, and population scarcity for this exact piece — rolling out as the analytics pipeline finishes processing."
          />
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
