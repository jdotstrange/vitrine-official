/**
 * Backwards-compat shim — `extraction` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  enqueueExtraction,
  subscribeToCollectibleRow,
  pollJobStatus,
  raceForCompletion,
  type EnqueueResult,
  type ExtractionStatus,
  type ExtractionStatusUpdate,
} from '@vitrine/api';
