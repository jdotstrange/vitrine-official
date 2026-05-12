/**
 * Backwards-compat shim — `comps` lives in `@vitrine/api` after Day 2.5.
 */
import '@/lib/api';
export {
  getCollectibleComps,
  getTrackedComps,
  getCompTierLabel,
  type CompItem,
  type CompTierLabel,
  type TrackedCompItem,
} from '@vitrine/api';
