/**
 * Backwards-compat shim — `fields` lives in `@vitrine/api` after Day 2.5.
 *
 * The pre-monorepo native barrel exposed the field response/option types
 * under different names (`ResolveFieldsResponse`, `ResolvedFieldOption`).
 * Re-export the new names under both spellings to keep call sites compiling.
 */
import '@/lib/api';
export {
  resolveFields,
  type ResolvedField,
  type FieldOption as ResolvedFieldOption,
  type ResolvedFieldsResponse as ResolveFieldsResponse,
} from '@vitrine/api';
