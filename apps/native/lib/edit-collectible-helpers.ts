import type { ListingStatus } from '@/lib/design';
import type { CreateCollectibleResponse } from '@/lib/api/collectibles';

export type EditPhotoAsset = { id: string; uri: string };

export function listingStatusFromRow(row: CreateCollectibleResponse): ListingStatus {
  if (row.availableForSale && row.availableForTrade) return 'SELL_TRADE';
  if (row.availableForSale) return 'FOR_SALE';
  if (row.availableForTrade) return 'FOR_TRADE';
  return 'NFST';
}

export function photosFromUrls(urls: string[]): EditPhotoAsset[] {
  return urls.map((uri, i) => ({
    id: `existing-${i}-${uri.slice(-24)}`,
    uri,
  }));
}

/** True when add/remove occurred (reorder-only returns false). */
export function photoMultisetChanged(
  initial: EditPhotoAsset[],
  current: EditPhotoAsset[],
): boolean {
  const a = new Set(initial.map((p) => p.uri));
  const b = new Set(current.map((p) => p.uri));
  if (a.size !== b.size) return true;
  for (const u of a) {
    if (!b.has(u)) return true;
  }
  return false;
}

export function isRemotePhotoUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}
