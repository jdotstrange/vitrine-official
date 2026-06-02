/**
 * Backwards-compat shim — `extraction` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  enqueueExtraction,
  subscribeToCollectibleRow,
  pollJobStatus,
  pollEngineJobStatus,
  raceForCompletion,
  type EnqueueResult,
  type ExtractionStatus,
  type ExtractionStatusUpdate,
  type EngineJobStatus,
} from '@vitrine/api';
