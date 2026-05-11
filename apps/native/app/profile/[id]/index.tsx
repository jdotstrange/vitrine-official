import { View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CollectorProfile } from '@/components/collector-profile';
import type { NetworkTab } from '@/components/profile-lenses';

/**
 * Public profile page (other-collector view).
 *
 * URL params:
 *   - `id`           — required, the collector being viewed.
 *   - `lens`         — optional, top-level lens to land on.
 *   - `tab`          — optional, NETWORK chip to preselect when
 *                      lens=NETWORK. Threaded so a tap on a profile
 *                      card's FOLLOWERS / FOLLOWING count routes
 *                      directly to the right chip.
 */

const VALID_LENSES = new Set([
  'PROFILE',
  'COLLECTION',
  'SHOWCASE',
  'NETWORK',
]);

const VALID_NETWORK_TABS = new Set<NetworkTab>([
  'suggested',
  'mutual',
  'followers',
  'following',
]);

type LensKey = 'PROFILE' | 'COLLECTION' | 'SHOWCASE' | 'NETWORK';

export default function ProfilePage() {
  const router = useRouter();
  const { id, lens, tab } = useLocalSearchParams<{
    id: string;
    lens?: string;
    tab?: string;
  }>();
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  const initialLens = useMemo<LensKey | undefined>(() => {
    if (!lens) return undefined;
    const candidate = String(lens).toUpperCase();
    return VALID_LENSES.has(candidate) ? (candidate as LensKey) : undefined;
  }, [lens]);

  const initialNetworkTab = useMemo<NetworkTab | undefined>(() => {
    if (!tab) return undefined;
    const candidate = String(tab).toLowerCase() as NetworkTab;
    return VALID_NETWORK_TABS.has(candidate) ? candidate : undefined;
  }, [tab]);

  useEffect(() => {
    if (!initialLens && !initialNetworkTab) return;
    router.setParams({ lens: undefined, tab: undefined });
  }, [initialLens, initialNetworkTab, router]);

  return (
    <View style={{ flex: 1 }}>
      <CollectorProfile
        collectorId={id || 'me'}
        initialLens={initialLens}
        initialNetworkTab={initialNetworkTab}
        onScrollDirectionChange={setScrollDirection}
      />
    </View>
  );
}
