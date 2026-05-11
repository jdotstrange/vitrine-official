/**
 * Collectible Detail — V3 production route.
 *
 * The screen itself lives in `components/collectible-detail-v3.tsx`. This
 * route file is intentionally thin so the route system has a single
 * import surface and the actual UX evolves in the component module.
 *
 * Earlier iterations inlined a 2K-line sandbox-promoted implementation
 * here; that's been retired in favor of the lens-architected V3 surface
 * (DETAILS · SPECS · PULSE · AAR · VAR · COMPS).
 */

import React from 'react';

import { CollectibleDetailV3 } from '@/components/collectible-detail-v3';

export default function CollectibleDetailPage() {
  return <CollectibleDetailV3 />;
}
