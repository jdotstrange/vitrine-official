/**
 * Managed Showcase rule grammar — the contract between client builder and
 * the server-side evaluator (`managed-evaluate` + `managed-sweep-worker`
 * Edge functions).
 *
 * These are the TYPES only. The evaluator implementation (which must run
 * identically client-side AND in Edge functions) lives next to the API
 * module and is moved into `@vitrine/api` in Day 2.5. The types are
 * extracted here first so web RSC + Edge function code can reason about
 * a saved showcase's rules without importing the evaluator.
 *
 * Grammar (V2):
 *   collectible_type  → is_one_of | is_none_of                  (single-value field)
 *   listing_title     → contains  | starts_with                 (case-insensitive)
 *   value             → eq | gte | lte | between                (numeric, NULL never matches)
 *   status            → is_one_of | is_none_of                  (single-value field)
 *   traits            → is_one_of | is_all_of | is_none_of      (multi-value field)
 *   tags              → is_one_of | is_all_of | is_none_of      (multi-value field, free-form)
 *   franchise         → is_one_of | is_none_of                  (from filter_traits.franchise)
 *   item_type         → is_one_of | is_none_of                  (from filter_traits.item_type)
 *   year              → eq | gte | lte | between                (from filter_traits.year)
 *   maker             → is_one_of | is_none_of                  (from filter_traits.maker)
 *
 * Match modes: 'all' (AND across conditions) | 'any' (OR across conditions).
 */

export type RuleField =
  | 'collectible_type'
  | 'listing_title'
  | 'value'
  | 'status'
  | 'traits'
  | 'tags'
  | 'franchise'
  | 'item_type'
  | 'year'
  | 'maker';

export type RuleOp =
  | 'contains'
  | 'starts_with'
  | 'eq'
  | 'gte'
  | 'lte'
  | 'between'
  | 'is_one_of'
  | 'is_all_of'
  | 'is_none_of';

export type RuleMatchMode = 'all' | 'any';

/**
 * Condition value shape varies by field/op:
 *   text ops (contains/starts_with):       string
 *   numeric ops (eq/gte/lte):              number
 *   numeric op (between):                  [number, number] (inclusive)
 *   single-valued list ops (is_one_of/is_none_of on collectible_type/status): string[]
 *   multi-valued list ops (is_*_of on traits/tags):                           string[]
 */
export type ConditionValue = string | number | string[] | [number, number];

export interface Condition {
  field: RuleField;
  op: RuleOp;
  value: ConditionValue;
}

export interface ManagedRules {
  match: RuleMatchMode;
  conditions: Condition[];
}

/**
 * Normalized row shape consumed by the evaluator. Both source surfaces
 * (the client `CollectionItem` and the raw DB row from the Edge function)
 * normalize into this shape before evaluation, so the evaluator only ever
 * needs to handle one input contract.
 */
export interface EvalCollectible {
  id: string;
  collectibleType: string | null;
  listingTitle: string | null;
  value: number | null;
  /** Derived listing status: 'NFST' | 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE'. */
  status: string;
  /** Trait tokens. Normalized into canonical keys (`is_rookie` etc.) by callers. */
  traits: string[];
  /** Free-form tag tokens (already trimmed; matching is case-insensitive). */
  tags: string[];
  /** From filter_traits.franchise (e.g. "New York Yankees"). */
  franchise: string | null;
  /** From filter_traits.item_type (e.g. "Baseball", "Jersey"). */
  itemType: string | null;
  /** From filter_traits.year (e.g. 1986). */
  year: number | null;
  /** From filter_traits.maker (e.g. "Topps", "Nike"). */
  maker: string | null;
}
