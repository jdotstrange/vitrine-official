/**
 * Backwards-compat shim — `categories` lives in `@vitrine/api` after Day 2.5.
 *
 * The pre-monorepo native barrel exposed nested category-tree types under
 * `CategoryTreeType`, `CategoryTreeCategory`, `CategoryTreeSubcategory`.
 * The package consolidates those into the inline shape on
 * `CategoryTreeResponse`. Provide thin aliases here so existing imports
 * keep compiling — though most callers only ever used `CategoryTreeResponse`.
 */
import '@/lib/api';
import type { CategoryTreeResponse } from '@vitrine/api';

export {
  getCategoryTree,
  getCategoryTypes,
  getCategories,
  getCategoriesByType,
  getSubcategories,
  getSubcategoriesByCategory,
  getCategoryTypeByCode,
  getCategoryByCode,
  getSubcategoryByCode,
  type CategoryType,
  type Category,
  type Subcategory,
  type CategoryTreeNode,
  type CategoryTreeResponse,
} from '@vitrine/api';

export type CategoryTreeType = CategoryTreeResponse['types'][number];
export type CategoryTreeCategory = CategoryTreeType['categories'][number];
export type CategoryTreeSubcategory = CategoryTreeCategory['subcategories'][number];
