/**
 * Backwards-compat shim — `search` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  searchCollectibles,
  searchUsers,
  type SearchCollectibleResult,
  type SearchUserResult,
} from '@vitrine/api';
