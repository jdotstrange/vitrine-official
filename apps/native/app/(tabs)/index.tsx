import { View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CollectorProfile } from '@/components/collector-profile';
import { BottomDock } from '@/components/bottom-dock';
import type { NetworkTab } from '@/components/profile-lenses';

/**
 * Profile tab — the app's landing surface and the user's own profile hub.
 *
 * Two URL params drive deep-link entry into the hub:
 *   ?lens=PROFILE|COLLECTION|SHOWCASE|ACTIVITY|NETWORK
 *     — selects which top-level lens the pager lands on.
 *   ?tab=suggested|mutual|followers|following
 *     — when `lens=NETWORK`, also preselects which chip is active.
 *
 * Both params are consumed on mount and immediately cleared so a
 * subsequent push with the same key still re-fires the child effects.
 */

const VALID_LENSES = new Set([
  'PROFILE',
  'COLLECTION',
  'SHOWCASE',
  'ACTIVITY',
  'NETWORK',
]);

const VALID_NETWORK_TABS = new Set<NetworkTab>([
  'suggested',
  'mutual',
  'followers',
  'following',
]);

type LensKey =
  | 'PROFILE'
  | 'COLLECTION'
  | 'SHOWCASE'
  | 'ACTIVITY'
  | 'NETWORK';

export default function ProfileTab() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lens?: string; tab?: string }>();
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  const initialLens = useMemo<LensKey | undefined>(() => {
    if (!params.lens) return undefined;
    const candidate = String(params.lens).toUpperCase();
    return VALID_LENSES.has(candidate) ? (candidate as LensKey) : undefined;
  }, [params.lens]);

  const initialNetworkTab = useMemo<NetworkTab | undefined>(() => {
    if (!params.tab) return undefined;
    const candidate = String(params.tab).toLowerCase() as NetworkTab;
    return VALID_NETWORK_TABS.has(candidate) ? candidate : undefined;
  }, [params.tab]);

  useEffect(() => {
    if (!initialLens && !initialNetworkTab) return;
    router.setParams({ lens: undefined, tab: undefined });
  }, [initialLens, initialNetworkTab, router]);

  return (
    <View style={{ flex: 1 }}>
      <CollectorProfile
        collectorId="me"
        initialLens={initialLens}
        initialNetworkTab={initialNetworkTab}
        onScrollDirectionChange={setScrollDirection}
      />
      <BottomDock activeTab="profile" scrollDirection={scrollDirection} />
    </View>
  );
}
