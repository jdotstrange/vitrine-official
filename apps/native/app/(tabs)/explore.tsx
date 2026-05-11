/**
 * Market tab route — thin mount for MarketSurface.
 *
 * Deep-link params (all optional):
 *   ?type=<collectible_type>   — pre-select a type chip
 *   ?trait=<trait_key>         — pre-select a trait chip
 *   ?search=<query>            — pre-populate the search bar (jumps to State 3)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { BottomDock } from '@/components/bottom-dock';
import { MarketSurface } from '@/components/market';

export default function ExploreTab() {
  const params = useLocalSearchParams<{
    type?: string;
    trait?: string;
    search?: string;
  }>();

  return (
    <View style={styles.container}>
      <MarketSurface
        initialChipType={params.type ?? null}
        initialChipTrait={params.trait ?? null}
        initialSearch={params.search ?? ''}
      />
      <BottomDock activeTab="explore" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
