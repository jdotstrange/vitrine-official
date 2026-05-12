/**
 * Backwards-compat shim — `explore` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  getHotItems,
  getExploreCategories,
  getNewListings,
  getForSaleNow,
  getCollectorsToFollow,
  browseCollectibles,
  type HotItem,
  type ExploreCategory,
  type NewListing,
  type ListedItem,
  type FeaturedCollector,
  type BrowseFilters,
  type BrowseResult,
} from '@vitrine/api';
