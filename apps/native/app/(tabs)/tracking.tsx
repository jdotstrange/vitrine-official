import { View, StyleSheet } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TrackingHub, type TrackingLensKey } from '@/components/tracking-hub';
import { BottomDock } from '@/components/bottom-dock';

const VALID_TRACKING_LENSES = new Set<TrackingLensKey>([
  'OVERVIEW',
  'TRACKED',
  'ACTIVITY',
  'COMPS',
]);

/**
 * Tracking tab — V3 four-lens hub.
 *
 * Supports ?lens= deep linking (same pattern as the profile tab):
 *   /(tabs)/tracking?lens=ACTIVITY  → opens directly on the ACTIVITY lens
 */
export default function TrackingTabPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lens?: string }>();
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  const initialLens = useMemo<TrackingLensKey | undefined>(() => {
    if (!params.lens) return undefined;
    const candidate = String(params.lens).toUpperCase() as TrackingLensKey;
    return VALID_TRACKING_LENSES.has(candidate) ? candidate : undefined;
  }, [params.lens]);

  // Clear ?lens= after consumption so back-nav doesn't re-apply it
  useEffect(() => {
    if (!initialLens) return;
    router.setParams({ lens: undefined });
  }, [initialLens, router]);

  return (
    <View style={styles.container}>
      <TrackingHub
        initialLens={initialLens}
        onScrollDirectionChange={setScrollDirection}
      />
      <BottomDock activeTab="tracking" scrollDirection={scrollDirection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
