import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LensPaywallCard } from '@/components/vault';
import { PRO_FEATURE_COPY, PRO_SHIP_DARK } from '@/lib/pro-ship-dark';
import { useTheme, SPACING } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';

export interface VarLensProps {
  isPro: boolean;
  onUpgrade: () => void;
  bottomInset: number;
  dockReservedHeight: number;
}

export function VarLens({
  isPro,
  onUpgrade,
  bottomInset,
  dockReservedHeight,
}: VarLensProps) {
  const { colors } = useTheme();
  const copy = PRO_FEATURE_COPY.VAR;

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
            lensKey="VAR"
            accent={colors.traitCyan}
            kicker="VITRINE PRO"
            title={copy.title}
            blurb={copy.blurb}
            onUpgrade={onUpgrade}
          />
        ) : (
          <LensComingSoon
            lensKey="VAR"
            message="Visual pattern matching, defect detection, population data, and comparable sales context — assembled into a definitive analytical record. Reports drop in as the pipeline finishes processing each item."
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
