/**
 * Native API barrel.
 *
 * Day 2.5 monorepo migration: most modules now live in `@vitrine/api` and
 * are bound to a process-wide singleton at boot via `bindToSingleton(...)`.
 * The flat re-exports below preserve the pre-Day-2 import shape so existing
 * call sites (`import { getCollectibleComps } from '@/lib/api'`) keep working.
 *
 * A handful of modules still live locally because they depend on platform-only
 * APIs that have no web equivalent yet:
 *   - auth, collectibles → uploadWithVariants (expo-image-manipulator)
 *   - tracking            → CollectionItem from @/components
 *   - market              → CollectionItem from @/components
 *   - views               → expo-crypto, AsyncStorage device id
 *   - trading-cards       → still on the legacy Railway client
 *   - client              → ApiException helper, Railway-era only
 *
 * Those are re-exported below from their existing native paths.
 */

import { bindToSingleton } from '@vitrine/api';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Bind the singleton at module load (idempotent if re-imported).
bindToSingleton({
  supabase,
  logger,
  env: { supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY },
});

// ───────────────────────────────────────────────────────────────────────────
// Re-exports from @vitrine/api (the shared package)
// ───────────────────────────────────────────────────────────────────────────

export * from '@vitrine/api';

// ───────────────────────────────────────────────────────────────────────────
// Native-only modules (still in apps/native/lib/api/)
// ───────────────────────────────────────────────────────────────────────────

// Base client and configuration (Railway-era helper, used by trading-cards)
export { ApiException } from './client';

// Collectibles API (depends on uploadWithVariants → expo-image-manipulator)
export {
  createCollectible,
  updateCollectible,
  updateCollectibleKeyDetails,
  getCollectible,
  getUserCollectibles,
  getCollectibleFieldValues,
  getFeedCollectibles,
  type FeedCollectible,
  type CreateCollectibleRequest,
  type CreateCollectibleResponse,
  type KeyDetailsRequest,
} from './collectibles';

// Trading Cards API (legacy Railway client)
export {
  searchCards,
  getCardDetails,
  getGradePrice,
  getCardCategories,
  createTradingCard,
  getTradingCard,
  updateTradingCardPricing,
  listTradingCards,
  deleteTradingCard,
  calculateEffectivePrice,
  formatPrice,
  getPricingModeLabel,
  type CardSearchResult,
  type GradeInfo,
  type CardDetails,
  type PricingMode,
  type CreateTradingCardRequest,
  type TradingCard,
} from './trading-cards';

// Auth / User API (depends on uploadWithVariants for avatar uploads)
export {
  getUserById,
  getUserByUsername,
  getCurrentUser,
  getUserByAuthId,
  type User,
} from './auth';

// Tracking API (depends on @/components/collectibles/collection)
export {
  trackItem,
  untrackItem,
  isTracking,
  getTrackingIds,
  getTrackCount,
  getTrackedItems,
  getTrackedItemCount,
  getTrackedCategoryCounts,
  type TrackedCollectible,
  type CategoryCount,
} from './tracking';

// Views API (depends on expo-crypto + AsyncStorage device id)
export {
  recordView,
  getViewCounts,
  type ViewTarget,
  type ViewCounts,
} from './views';

// Market API (depends on @/components/collectibles/collection)
export {
  browseMarket,
  getMarketOverviewStats,
  searchCollectorsTiered,
  searchShowcasesTiered,
  type MarketItem,
  type MarketOwner,
  type MarketFilters,
  type MarketSortKey,
  type MarketOverviewStats,
  type CollectorSearchResult,
  type ShowcaseSearchResult,
  type MarketSearchChipFilters,
} from './market';
