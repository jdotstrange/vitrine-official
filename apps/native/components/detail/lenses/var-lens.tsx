import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LensPaywallCard } from '@/components/vault';
import { useTheme, SPACING } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';

/**
 * VAR lens — Vitrine Analysis Report.
 *
 * Read-only by design — VAR is a definitive cataloging artifact, so
 * there are no inline CTAs or actions inside the lens body.
 * Regeneration / reissue lives in the bottom action dock's overflow
 * sheet, not on this surface.
 *
 * V1 ships:
 *   - Non-Pro: `LensPaywallCard` selling VAR (cyan accent — analytical
 *              / graded vibe).
 *   - Pro:     `LensComingSoon` placeholder until the analysis pipeline
 *              ships its first generated reports.
 *
 * The VAR universal-vs-conditional question is deferred — for V1 we
 * always render this lens regardless of trait state, and revisit
 * conditionality when the AI report runs against test fixtures.
 */

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
        {isPro ? (
          <LensComingSoon
            lensKey="VAR"
            message="Visual pattern matching, defect detection, population data, and comparable sales context — assembled into a definitive analytical record. Reports drop in as the pipeline finishes processing each item."
          />
        ) : (
          <LensPaywallCard
            lensKey="VAR"
            accent={colors.traitCyan}
            kicker="VITRINE PRO"
            title="Vitrine Analysis Report"
            blurb="Deep-dive authentication and condition analysis powered by Vitrine AI — visual pattern matching, defect detection, population data, and comparable-sales context, packaged as a definitive cataloging record."
            onUpgrade={onUpgrade}
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
