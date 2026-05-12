/**
 * Backwards-compat shim — `activity` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  getJournalEntries,
  mergeActivityStreams,
  type JournalVerb,
  type JournalEntry,
  type GetJournalOptions,
  type MergedActivityItem,
} from '@vitrine/api';
