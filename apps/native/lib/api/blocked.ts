/**
 * Backwards-compat shim — `blocked` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  getBlockedUsers,
  blockUser,
  unblockUser,
  isBlocked,
  type BlockedUser,
} from '@vitrine/api';
