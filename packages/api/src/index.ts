/**
 * @vitrine/api — public surface.
 *
 * Two consumption styles:
 *
 * 1. Factory style (preferred for web RSC, edge functions, tests):
 *      const api = createApi({ supabase, logger, env });
 *      api.collectibles.getById(id);
 *
 *    Each module exposes a `createXApi(supabase, logger, ...deps)` factory.
 *    The `createApi` mega-factory composes them and wires cross-module
 *    deps (showcases → notifications, follows → notifications, etc.)
 *    so consumers don't have to.
 *
 * 2. Singleton style (preferred for native, where flat function imports
 *    map onto the existing call sites):
 *      bindToSingleton({ supabase, logger, env });
 *      import { getCollectibleComps } from '@vitrine/api';
 *
 *    `bindToSingleton` constructs the api once and re-exports every
 *    method as a free-standing function. Mirrors the pre-monorepo
 *    native import shape.
 *
 * Modules that still depend on platform-only APIs (image upload via
 * expo-image-manipulator, AsyncStorage device id, react-native components)
 * stay in `apps/native/lib/api/` for now. The native facade
 * (`apps/native/lib/api/index.ts`) imports from BOTH `@vitrine/api`
 * (this package) AND those local modules.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { type Logger, noopLogger } from './logger';

import * as managedRules from './modules/managed-rules';
import { createBlockedApi, type BlockedApi } from './modules/blocked';
import { createCompsApi, type CompsApi } from './modules/comps';
import { createFieldsApi, type FieldsApi } from './modules/fields';
import { createSearchApi, type SearchApi } from './modules/search';
import { createActivityApi, type ActivityApi, mergeActivityStreams } from './modules/activity';
import {
  createNotificationsApi,
  type NotificationsApi,
  type NotificationsEnv,
} from './modules/notifications';
import { createFollowsApi, type FollowsApi } from './modules/follows';
import { createNetworkApi, type NetworkApi } from './modules/network';
import { createCategoriesApi, type CategoriesApi } from './modules/categories';
import {
  createExtractionApi,
  type ExtractionApi,
  type ExtractionEnv,
} from './modules/extraction';
import { createExploreApi, type ExploreApi } from './modules/explore';
import { createShowcasesApi, type ShowcasesApi, previewRuleMatches } from './modules/showcases';

// ---------------------------------------------------------------------------
// PUBLIC TYPES (composed)
// ---------------------------------------------------------------------------

export interface ApiEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface CreateApiOptions {
  supabase: SupabaseClient;
  logger?: Logger;
  env: ApiEnv;
}

export interface VitrineApi {
  blocked: BlockedApi;
  comps: CompsApi;
  fields: FieldsApi;
  search: SearchApi;
  activity: ActivityApi;
  notifications: NotificationsApi;
  follows: FollowsApi;
  network: NetworkApi;
  categories: CategoriesApi;
  extraction: ExtractionApi;
  explore: ExploreApi;
  showcases: ShowcasesApi;
}

// ---------------------------------------------------------------------------
// MEGA-FACTORY
// ---------------------------------------------------------------------------

export function createApi({ supabase, logger = noopLogger, env }: CreateApiOptions): VitrineApi {
  const notificationsEnv: NotificationsEnv = {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
  };
  const extractionEnv: ExtractionEnv = {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
  };

  const notifications = createNotificationsApi(supabase, logger, notificationsEnv);

  return {
    blocked: createBlockedApi(supabase),
    comps: createCompsApi(supabase, logger),
    fields: createFieldsApi(supabase, logger),
    search: createSearchApi(supabase, logger),
    activity: createActivityApi(supabase, logger),
    notifications,
    follows: createFollowsApi(supabase, logger, notifications),
    network: createNetworkApi(supabase, logger),
    categories: createCategoriesApi(supabase, logger),
    extraction: createExtractionApi(supabase, logger, extractionEnv),
    explore: createExploreApi(supabase, logger),
    showcases: createShowcasesApi(supabase, logger, notifications),
  };
}

// ---------------------------------------------------------------------------
// SINGLETON FACADE
// ---------------------------------------------------------------------------

let _singleton: VitrineApi | null = null;

/**
 * Initialize the package's process-wide singleton. Must be called once at
 * app boot (native: `apps/native/lib/api/index.ts`; web: `apps/web/lib/api.ts`).
 *
 * Calling twice replaces the prior binding — useful for tests but a no-op
 * during normal app lifecycle.
 */
export function bindToSingleton(options: CreateApiOptions): VitrineApi {
  _singleton = createApi(options);
  return _singleton;
}

function s(): VitrineApi {
  if (!_singleton) {
    throw new Error(
      '@vitrine/api: bindToSingleton() must be called before using flat exports. ' +
        'Native: see apps/native/lib/api/index.ts. Web: see apps/web/lib/api.ts.',
    );
  }
  return _singleton;
}

/** Returns the bound singleton, or throws if not initialized. */
export function getApi(): VitrineApi {
  return s();
}

// ---------------------------------------------------------------------------
// FLAT RE-EXPORTS — singleton-style call sites
// ---------------------------------------------------------------------------
// Each export is a thin wrapper that defers method lookup to the bound
// singleton at call-time. This preserves binding so `getCollectibleComps`
// can be passed around as a value without losing its `this`.

// blocked
export const getBlockedUsers = (...args: Parameters<BlockedApi['getBlockedUsers']>) => s().blocked.getBlockedUsers(...args);
export const blockUser = (...args: Parameters<BlockedApi['blockUser']>) => s().blocked.blockUser(...args);
export const unblockUser = (...args: Parameters<BlockedApi['unblockUser']>) => s().blocked.unblockUser(...args);
export const isBlocked = (...args: Parameters<BlockedApi['isBlocked']>) => s().blocked.isBlocked(...args);

// comps
export const getCollectibleComps = (...args: Parameters<CompsApi['getCollectibleComps']>) => s().comps.getCollectibleComps(...args);
export const getTrackedComps = (...args: Parameters<CompsApi['getTrackedComps']>) => s().comps.getTrackedComps(...args);

// fields
export const resolveFields = (...args: Parameters<FieldsApi['resolveFields']>) => s().fields.resolveFields(...args);

// search
export const searchCollectibles = (...args: Parameters<SearchApi['searchCollectibles']>) => s().search.searchCollectibles(...args);
export const searchUsers = (...args: Parameters<SearchApi['searchUsers']>) => s().search.searchUsers(...args);

// activity
export const getJournalEntries = (...args: Parameters<ActivityApi['getJournalEntries']>) => s().activity.getJournalEntries(...args);

// notifications
export const sendNotification = (...args: Parameters<NotificationsApi['sendNotification']>) => s().notifications.sendNotification(...args);
export const getNotificationPreferences = (...args: Parameters<NotificationsApi['getNotificationPreferences']>) => s().notifications.getNotificationPreferences(...args);
export const saveNotificationPreferences = (...args: Parameters<NotificationsApi['saveNotificationPreferences']>) => s().notifications.saveNotificationPreferences(...args);

// follows (V2 — legacy basic CRUD; getMutualFollows is the V2 one to match
// the pre-monorepo native barrel)
export const followUser = (...args: Parameters<FollowsApi['followUser']>) => s().follows.followUser(...args);
export const unfollowUser = (...args: Parameters<FollowsApi['unfollowUser']>) => s().follows.unfollowUser(...args);
export const isFollowing = (...args: Parameters<FollowsApi['isFollowing']>) => s().follows.isFollowing(...args);
export const getFollowers = (...args: Parameters<FollowsApi['getFollowers']>) => s().follows.getFollowers(...args);
export const getFollowing = (...args: Parameters<FollowsApi['getFollowing']>) => s().follows.getFollowing(...args);
export const getMutualFollows = (...args: Parameters<FollowsApi['getMutualFollows']>) => s().follows.getMutualFollows(...args);
export const getFollowCounts = (...args: Parameters<FollowsApi['getFollowCounts']>) => s().follows.getFollowCounts(...args);
export const getFollowingIds = (...args: Parameters<FollowsApi['getFollowingIds']>) => s().follows.getFollowingIds(...args);

// network (V3 — Network Surface; getMutualFollowsV2 is the V3 one)
export const getSuggestedCollectors = (...args: Parameters<NetworkApi['getSuggestedCollectors']>) => s().network.getSuggestedCollectors(...args);
export const getMutualFollowsV2 = (...args: Parameters<NetworkApi['getMutualFollows']>) => s().network.getMutualFollows(...args);
export const getFollowersWithPrivacy = (...args: Parameters<NetworkApi['getFollowersWithPrivacy']>) => s().network.getFollowersWithPrivacy(...args);
export const getFollowingWithPrivacy = (...args: Parameters<NetworkApi['getFollowingWithPrivacy']>) => s().network.getFollowingWithPrivacy(...args);
export const setFollowListsVisibility = (...args: Parameters<NetworkApi['setFollowListsVisibility']>) => s().network.setFollowListsVisibility(...args);
export const getFollowListsVisibility = (...args: Parameters<NetworkApi['getFollowListsVisibility']>) => s().network.getFollowListsVisibility(...args);

// categories
export const getCategoryTree = (...args: Parameters<CategoriesApi['getCategoryTree']>) => s().categories.getCategoryTree(...args);
export const getCategoryTypes = (...args: Parameters<CategoriesApi['getCategoryTypes']>) => s().categories.getCategoryTypes(...args);
export const getCategories = (...args: Parameters<CategoriesApi['getCategories']>) => s().categories.getCategories(...args);
export const getCategoriesByType = (...args: Parameters<CategoriesApi['getCategoriesByType']>) => s().categories.getCategoriesByType(...args);
export const getSubcategories = (...args: Parameters<CategoriesApi['getSubcategories']>) => s().categories.getSubcategories(...args);
export const getSubcategoriesByCategory = (...args: Parameters<CategoriesApi['getSubcategoriesByCategory']>) => s().categories.getSubcategoriesByCategory(...args);
export const getCategoryTypeByCode = (...args: Parameters<CategoriesApi['getCategoryTypeByCode']>) => s().categories.getCategoryTypeByCode(...args);
export const getCategoryByCode = (...args: Parameters<CategoriesApi['getCategoryByCode']>) => s().categories.getCategoryByCode(...args);
export const getSubcategoryByCode = (...args: Parameters<CategoriesApi['getSubcategoryByCode']>) => s().categories.getSubcategoryByCode(...args);

// extraction
export const enqueueExtraction = (...args: Parameters<ExtractionApi['enqueueExtraction']>) => s().extraction.enqueueExtraction(...args);
export const subscribeToCollectibleRow = (...args: Parameters<ExtractionApi['subscribeToCollectibleRow']>) => s().extraction.subscribeToCollectibleRow(...args);
export const pollJobStatus = (...args: Parameters<ExtractionApi['pollJobStatus']>) => s().extraction.pollJobStatus(...args);
export const pollEngineJobStatus = (...args: Parameters<ExtractionApi['pollEngineJobStatus']>) => s().extraction.pollEngineJobStatus(...args);
export const raceForCompletion = (...args: Parameters<ExtractionApi['raceForCompletion']>) => s().extraction.raceForCompletion(...args);

// explore
export const getHotItems = (...args: Parameters<ExploreApi['getHotItems']>) => s().explore.getHotItems(...args);
export const getExploreCategories = (...args: Parameters<ExploreApi['getExploreCategories']>) => s().explore.getExploreCategories(...args);
export const getNewListings = (...args: Parameters<ExploreApi['getNewListings']>) => s().explore.getNewListings(...args);
export const getForSaleNow = (...args: Parameters<ExploreApi['getForSaleNow']>) => s().explore.getForSaleNow(...args);
export const getCollectorsToFollow = (...args: Parameters<ExploreApi['getCollectorsToFollow']>) => s().explore.getCollectorsToFollow(...args);
export const browseCollectibles = (...args: Parameters<ExploreApi['browseCollectibles']>) => s().explore.browseCollectibles(...args);

// showcases
export const createShowcase = (...args: Parameters<ShowcasesApi['createShowcase']>) => s().showcases.createShowcase(...args);
export const updateShowcaseRules = (...args: Parameters<ShowcasesApi['updateShowcaseRules']>) => s().showcases.updateShowcaseRules(...args);
export const deleteShowcase = (...args: Parameters<ShowcasesApi['deleteShowcase']>) => s().showcases.deleteShowcase(...args);
export const updateShowcase = (...args: Parameters<ShowcasesApi['updateShowcase']>) => s().showcases.updateShowcase(...args);
export const getShowcaseCollectibleIds = (...args: Parameters<ShowcasesApi['getShowcaseCollectibleIds']>) => s().showcases.getShowcaseCollectibleIds(...args);
export const getUserShowcases = (...args: Parameters<ShowcasesApi['getUserShowcases']>) => s().showcases.getUserShowcases(...args);
export const getShowcaseById = (...args: Parameters<ShowcasesApi['getShowcaseById']>) => s().showcases.getShowcaseById(...args);
export const getFeaturedShowcaseDetail = (...args: Parameters<ShowcasesApi['getFeaturedShowcaseDetail']>) => s().showcases.getFeaturedShowcaseDetail(...args);
export const getUserShowcaseCount = (...args: Parameters<ShowcasesApi['getUserShowcaseCount']>) => s().showcases.getUserShowcaseCount(...args);
export const getUserShowcasePreviews = (...args: Parameters<ShowcasesApi['getUserShowcasePreviews']>) => s().showcases.getUserShowcasePreviews(...args);

// ---------------------------------------------------------------------------
// PURE / TYPE EXPORTS (no singleton needed)
// ---------------------------------------------------------------------------

// managed-rules — pure module (no factory needed)
export {
  isOpValidForField,
  defaultOpForField,
  opsForField,
  validateRules,
  itemMatchesManagedRules,
  evaluateManagedRules,
  normalizeText,
  normalizeTraitToken,
  evalRowFromDbRow,
  evalRowFromCollectionItem,
  labelForField,
  labelForOp,
  formatCondition,
  formatRulesSummary,
  type ValidationResult,
  type DbCollectibleRow,
} from './modules/managed-rules';

// activity — pure helper export
export { mergeActivityStreams };
export type { MergedActivityItem } from './modules/activity';

// showcases — pure helper export
export { previewRuleMatches };
export type { PreviewableItem, PreviewResult } from './modules/showcases';

// comps — pure helper export
export { getCompTierLabel } from './modules/comps';

// re-export domain types so consumers can do `import { type ManagedRules } from '@vitrine/api'`
export type {
  RuleField,
  RuleOp,
  RuleMatchMode,
  ConditionValue,
  Condition,
  ManagedRules,
  EvalCollectible,
  ListingStatus,
  CollectibleType,
  User,
  ProfileStatus,
  JournalVerb,
  JournalEntry,
  GetJournalOptions,
} from '@vitrine/types';

// re-export module types
export type { BlockedUser } from './modules/blocked';
export type { CompItem, CompTierLabel, TrackedCompItem } from './modules/comps';
export type { FieldOption, ResolvedField, ResolvedFieldsResponse } from './modules/fields';
export type { SearchCollectibleResult, SearchUserResult } from './modules/search';
export type {
  NotificationType,
  PreferenceSection,
  NotifyPayload,
  NotificationPreference,
  NotificationsEnv,
} from './modules/notifications';
export type { FollowUser, FollowCounts } from './modules/follows';
export type {
  SuggestedReasonCode,
  SuggestedReasonMeta,
  SuggestedCollector,
  GetSuggestedCollectorsOptions,
  FollowListsVisibility,
  FollowListResult,
} from './modules/network';
export type {
  CategoryType,
  Category,
  Subcategory,
  CategoryTreeNode,
  CategoryTreeResponse,
} from './modules/categories';
export type {
  EnqueueResult,
  ExtractionStatus,
  ExtractionStatusUpdate,
  ExtractionEnv,
  EngineJobStatus,
} from './modules/extraction';
export type {
  HotItem,
  ExploreCategory,
  NewListing,
  ListedItem,
  FeaturedCollector,
  BrowseFilters,
  BrowseResult,
} from './modules/explore';
export type {
  CreateShowcaseParams,
  CreateShowcaseManualParams,
  CreateShowcaseManagedParams,
  UpdateShowcaseRulesParams,
  UpdateShowcaseParams,
  UserShowcase,
  ShowcaseDetailCollectible,
  ShowcaseDetailItem,
  ShowcaseDetail,
  HomeShowcaseDetail,
  ShowcasePreview,
} from './modules/showcases';

// re-export Api factory types
export type {
  BlockedApi,
  CompsApi,
  FieldsApi,
  SearchApi,
  ActivityApi,
  NotificationsApi,
  FollowsApi,
  NetworkApi,
  CategoriesApi,
  ExtractionApi,
  ExploreApi,
  ShowcasesApi,
};

// re-export logger contract
export { type Logger, noopLogger, createConsoleLogger } from './logger';

// re-export common util helpers
export { requireUserId, maybeUserId } from './utils';

// also expose pure module namespace
export { managedRules };

// collection-queries — pure visibility helpers (no factory needed)
export {
  publishedCollectibles,
  publicCollectibles,
  queueReviewItems,
  queueErrorItems,
  applyPublishedFilter,
} from './modules/collection-queries';
