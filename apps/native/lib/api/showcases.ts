/**
 * Backwards-compat shim — `showcases` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  createShowcase,
  updateShowcaseRules,
  previewRuleMatches,
  deleteShowcase,
  updateShowcase,
  getShowcaseCollectibleIds,
  getUserShowcases,
  getShowcaseById,
  getFeaturedShowcaseDetail,
  getUserShowcaseCount,
  getUserShowcasePreviews,
  type CreateShowcaseParams,
  type CreateShowcaseManualParams,
  type CreateShowcaseManagedParams,
  type UpdateShowcaseRulesParams,
  type UpdateShowcaseParams,
  type UserShowcase,
  type ShowcaseDetailCollectible,
  type ShowcaseDetailItem,
  type ShowcaseDetail,
  type HomeShowcaseDetail,
  type ShowcasePreview,
} from '@vitrine/api';
