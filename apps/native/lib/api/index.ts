// API module exports
// Centralized exports for all API utilities

// Base client and configuration
export { apiClient, ApiException, API_BASE_URL, API_TIMEOUT } from './client';

// Category API
export { getCategoryTree, type CategoryTreeResponse, type CategoryTreeType, type CategoryTreeCategory, type CategoryTreeSubcategory } from './categories';

// Fields API
export { resolveFields, type ResolvedField, type ResolvedFieldOption, type ResolveFieldsResponse } from './fields';

// Collectibles API
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

// Trading Cards API
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

// Follows API
export {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getMutualFollows,
  getFollowCounts,
  getFollowingIds,
  type FollowUser,
  type FollowCounts,
} from './follows';

// Auth / User API
export {
  getUserById,
  getUserByUsername,
  getCurrentUser,
  getUserByAuthId,
  type User,
} from './auth';

// Search API
export {
  searchUsers,
  searchCollectibles,
  type SearchUserResult,
  type SearchCollectibleResult,
} from './search';

// Explore API
export {
  getHotItems,
  getExploreCategories,
  getNewListings,
  getForSaleNow,
  getCollectorsToFollow,
  browseCollectibles,
  type HotItem,
  type ExploreCategory,
  type NewListing as ExploreNewListing,
  type ListedItem,
  type FeaturedCollector as ExploreFeaturedCollector,
  type BrowseFilters,
  type BrowseResult,
} from './explore';

// Showcases API
export {
  createShowcase,
  deleteShowcase,
  updateShowcase,
  updateShowcaseRules,
  previewRuleMatches,
  getShowcaseCollectibleIds,
  getUserShowcases,
  getShowcaseById,
  type CreateShowcaseParams,
  type CreateShowcaseManualParams,
  type CreateShowcaseManagedParams,
  type UpdateShowcaseParams,
  type UpdateShowcaseRulesParams,
  type UserShowcase,
  type ShowcaseDetail,
  type ShowcaseDetailCollectible,
  type ShowcaseDetailItem,
} from './showcases';

// Tracking API
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

// Notifications API
export {
  sendNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationType,
  type NotifyPayload,
  type NotificationPreference,
  type PreferenceSection,
} from './notifications';

// Views API (anonymous view tracking)
export {
  recordView,
  getViewCounts,
  type ViewTarget,
  type ViewCounts,
} from './views';

// Activity API (JOURNAL stream + merge)
export {
  getJournalEntries,
  mergeActivityStreams,
  type JournalVerb,
  type JournalEntry,
  type GetJournalOptions,
  type MergedActivityItem,
} from './activity';

// Network API (V3 NETWORK lens)
export {
  getSuggestedCollectors,
  getMutualFollows as getMutualFollowsV2,
  getFollowersWithPrivacy,
  getFollowingWithPrivacy,
  setFollowListsVisibility,
  getFollowListsVisibility,
  type SuggestedCollector,
  type SuggestedReasonCode,
  type SuggestedReasonMeta,
  type GetSuggestedCollectorsOptions,
  type FollowListsVisibility,
  type FollowListResult,
} from './network';

// Market API (browse_market_v2 RPC + tiered search RPCs)
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

// Blocked Users API
export {
  getBlockedUsers,
  blockUser,
  unblockUser,
  isBlocked,
  type BlockedUser,
} from './blocked';

// Managed Showcase rule evaluator (shared with Edge functions)
export {
  isOpValidForField,
  defaultOpForField,
  opsForField,
  validateRules,
  itemMatchesManagedRules,
  evaluateManagedRules,
  evalRowFromDbRow,
  evalRowFromCollectionItem,
  normalizeText,
  normalizeTraitToken,
  labelForField,
  labelForOp,
  formatCondition,
  formatRulesSummary,
  type RuleField,
  type RuleOp,
  type RuleMatchMode,
  type ConditionValue,
  type Condition,
  type ManagedRules,
  type EvalCollectible,
  type DbCollectibleRow,
  type ValidationResult,
} from './managed-rules';