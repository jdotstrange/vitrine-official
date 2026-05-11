import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LensPaywallCard } from '@/components/vault';
import { useTheme, SPACING } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';

/**
 * PULSE lens — market intelligence surface.
 *
 * V1 ships with two states:
 *   - Non-Pro:  `LensPaywallCard` selling "Market Pulse" with the
 *               semantic-green accent (live/active feel).
 *   - Pro:      `LensComingSoon` placeholder until the pulse pipeline
 *               ships its first reports.
 *
 * When the pipeline lands, the body switches from `LensComingSoon` to
 * the real report — chrome, paywall card, and lens architecture all
 * stay stable.
 */

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
            lensKey="PULSE"
            message="Live demand signals, price velocity, and population scarcity for this exact piece — rolling out as the analytics pipeline finishes processing."
          />
        ) : (
          <LensPaywallCard
            lensKey="PULSE"
            accent={colors.semanticGreen}
            kicker="VITRINE PRO"
            title="Market Pulse"
            blurb="Live market intelligence for this specific piece — demand signals, price velocity, population scarcity, and alerts the moment something moves."
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
