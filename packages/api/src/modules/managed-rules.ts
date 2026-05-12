/**
 * Managed Showcase rule evaluator — V1.
 *
 * Single source of truth for managed-showcase rule semantics. This module is
 * intentionally pure: no React, no Supabase, no platform aliases. That shape
 * lets it be imported by:
 *   - The client rule builder (live preview).
 *   - The `managed-evaluate` Edge function for immediate evaluation.
 *   - The `managed-sweep-worker` Edge function for cron-driven sweeps.
 *
 * All three paths run the same TypeScript code, against the same normalized
 * row shape, so a unit test against `itemMatchesManagedRules` covers every
 * surface that touches a rule.
 *
 * The TYPES (RuleField, RuleOp, ManagedRules, EvalCollectible, etc.) live
 * in `@vitrine/types`. This module owns the EVALUATOR + helpers only.
 */

import type {
  RuleField,
  RuleOp,
  Condition,
  ManagedRules,
  EvalCollectible,
} from '@vitrine/types';

// Re-export types so consumers can do `import { type ManagedRules } from '@vitrine/api'`
// without reaching into @vitrine/types directly. Mirrors the native barrel
// behavior pre-Day 2.
export type {
  RuleField,
  RuleOp,
  RuleMatchMode,
  ConditionValue,
  Condition,
  ManagedRules,
  EvalCollectible,
} from '@vitrine/types';

// ---------------------------------------------------------------------------
// FIELD/OP COMPATIBILITY
// ---------------------------------------------------------------------------

const FIELD_OPS: Record<RuleField, readonly RuleOp[]> = {
  collectible_type: ['is_one_of', 'is_none_of'],
  listing_title: ['contains', 'starts_with'],
  value: ['eq', 'gte', 'lte', 'between'],
  status: ['is_one_of', 'is_none_of'],
  traits: ['is_one_of', 'is_all_of', 'is_none_of'],
  tags: ['is_one_of', 'is_all_of', 'is_none_of'],
  franchise: ['is_one_of', 'is_none_of'],
  item_type: ['is_one_of', 'is_none_of'],
  year: ['eq', 'gte', 'lte', 'between'],
  maker: ['is_one_of', 'is_none_of'],
};

/** True if the given operator is valid for the given field. */
export function isOpValidForField(field: RuleField, op: RuleOp): boolean {
  return FIELD_OPS[field]?.includes(op) ?? false;
}

/** Default operator picked when the user adds or switches a field. */
export function defaultOpForField(field: RuleField): RuleOp {
  return FIELD_OPS[field][0];
}

/** Operators a UI builder should expose for a given field. */
export function opsForField(field: RuleField): readonly RuleOp[] {
  return FIELD_OPS[field];
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validate a `ManagedRules` payload. Returns the full set of errors so the UI
 * can surface every issue at once. Empty conditions array is treated as
 * invalid (the plan locks "≥1 condition before save"); the caller can choose
 * to ignore that for live-preview shapes.
 */
export function validateRules(rules: ManagedRules): ValidationResult {
  const errors: string[] = [];

  if (!rules || typeof rules !== 'object') {
    return { ok: false, errors: ['Invalid rules object'] };
  }

  if (rules.match !== 'all' && rules.match !== 'any') {
    errors.push(`Invalid match mode: ${String(rules.match)}`);
  }

  if (!Array.isArray(rules.conditions) || rules.conditions.length === 0) {
    errors.push('At least one condition is required');
    return { ok: errors.length === 0, errors };
  }

  rules.conditions.forEach((c, i) => {
    const prefix = `Condition ${i + 1}: `;
    if (!c || typeof c !== 'object') {
      errors.push(prefix + 'must be an object');
      return;
    }
    if (!FIELD_OPS[c.field]) {
      errors.push(prefix + `unknown field "${String(c.field)}"`);
      return;
    }
    if (!isOpValidForField(c.field, c.op)) {
      errors.push(prefix + `operator "${c.op}" is not valid for field "${c.field}"`);
      return;
    }

    const valueErr = validateConditionValue(c);
    if (valueErr) errors.push(prefix + valueErr);
  });

  return { ok: errors.length === 0, errors };
}

function validateConditionValue(c: Condition): string | null {
  switch (c.op) {
    case 'contains':
    case 'starts_with':
      if (typeof c.value !== 'string' || c.value.trim().length === 0) {
        return 'expected a non-empty text value';
      }
      return null;

    case 'eq':
    case 'gte':
    case 'lte':
      if (typeof c.value !== 'number' || !Number.isFinite(c.value)) {
        return 'expected a finite numeric value';
      }
      return null;

    case 'between': {
      if (
        !Array.isArray(c.value) ||
        c.value.length !== 2 ||
        typeof c.value[0] !== 'number' ||
        typeof c.value[1] !== 'number' ||
        !Number.isFinite(c.value[0]) ||
        !Number.isFinite(c.value[1])
      ) {
        return 'expected [min, max] numeric tuple';
      }
      if (c.value[0] > c.value[1]) {
        return 'min must be ≤ max';
      }
      return null;
    }

    case 'is_one_of':
    case 'is_all_of':
    case 'is_none_of':
      if (!Array.isArray(c.value) || c.value.length === 0) {
        return 'expected at least one value';
      }
      if (!c.value.every((v) => typeof v === 'string' && v.trim().length > 0)) {
        return 'expected an array of non-empty strings';
      }
      return null;

    default:
      return `unknown operator "${String((c as Condition).op)}"`;
  }
}

// ---------------------------------------------------------------------------
// EVALUATION
// ---------------------------------------------------------------------------

function conditionMatches(item: EvalCollectible, c: Condition): boolean {
  switch (c.field) {
    case 'collectible_type':
      return matchSingleValueOp(item.collectibleType, c);

    case 'status':
      return matchSingleValueOp(item.status, c);

    case 'listing_title':
      return matchTextOp(item.listingTitle, c);

    case 'value':
      return matchNumericOp(item.value, c);

    case 'traits':
      return matchMultiValueOp(item.traits, c);

    case 'tags':
      return matchMultiValueOp(item.tags, c);

    case 'franchise':
      return matchSingleValueOp(item.franchise, c);

    case 'item_type':
      return matchSingleValueOp(item.itemType, c);

    case 'year':
      return matchNumericOp(item.year, c);

    case 'maker':
      return matchSingleValueOp(item.maker, c);

    default:
      return false;
  }
}

function matchSingleValueOp(itemValue: string | null, c: Condition): boolean {
  if (!Array.isArray(c.value)) return false;
  const ruleValues = (c.value as string[]).map(normalizeText);
  const candidate = itemValue == null ? null : normalizeText(itemValue);

  switch (c.op) {
    case 'is_one_of':
      return candidate != null && ruleValues.includes(candidate);
    case 'is_none_of':
      return candidate == null || !ruleValues.includes(candidate);
    default:
      return false;
  }
}

function matchTextOp(itemText: string | null, c: Condition): boolean {
  if (typeof c.value !== 'string') return false;
  if (itemText == null || itemText.length === 0) return false;
  const haystack = normalizeText(itemText);
  const needle = normalizeText(c.value);
  if (needle.length === 0) return false;

  switch (c.op) {
    case 'contains':
      return haystack.includes(needle);
    case 'starts_with':
      return haystack.startsWith(needle);
    default:
      return false;
  }
}

function matchNumericOp(itemValue: number | null, c: Condition): boolean {
  if (itemValue == null || !Number.isFinite(itemValue)) return false;

  switch (c.op) {
    case 'eq':
      return typeof c.value === 'number' && itemValue === c.value;
    case 'gte':
      return typeof c.value === 'number' && itemValue >= c.value;
    case 'lte':
      return typeof c.value === 'number' && itemValue <= c.value;
    case 'between': {
      if (!Array.isArray(c.value) || c.value.length !== 2) return false;
      const [min, max] = c.value as [number, number];
      return itemValue >= min && itemValue <= max;
    }
    default:
      return false;
  }
}

function matchMultiValueOp(itemValues: string[], c: Condition): boolean {
  if (!Array.isArray(c.value)) return false;
  const haystack = new Set(itemValues.map(normalizeText).filter((s) => s.length > 0));
  const needles = (c.value as string[]).map(normalizeText).filter((s) => s.length > 0);

  switch (c.op) {
    case 'is_one_of':
      return needles.some((v) => haystack.has(v));
    case 'is_all_of':
      return needles.every((v) => haystack.has(v));
    case 'is_none_of':
      return !needles.some((v) => haystack.has(v));
    default:
      return false;
  }
}

/**
 * True if the item satisfies the rule set under the chosen match mode.
 * Empty `conditions` is treated as "matches nothing" — calling code that
 * wants the preview-friendly "match everything" shape should branch on
 * `conditions.length === 0` itself.
 */
export function itemMatchesManagedRules(item: EvalCollectible, rules: ManagedRules): boolean {
  if (!rules || !Array.isArray(rules.conditions) || rules.conditions.length === 0) {
    return false;
  }

  if (rules.match === 'any') {
    return rules.conditions.some((c) => conditionMatches(item, c));
  }
  return rules.conditions.every((c) => conditionMatches(item, c));
}

/**
 * Compute the matching subset for a list of normalized collectibles. Order
 * is preserved (the input order — typically `created_at desc` from the API).
 */
export function evaluateManagedRules(
  items: EvalCollectible[],
  rules: ManagedRules,
): { matchingIds: string[] } {
  const matchingIds: string[] = [];
  for (const item of items) {
    if (itemMatchesManagedRules(item, rules)) {
      matchingIds.push(item.id);
    }
  }
  return { matchingIds };
}

// ---------------------------------------------------------------------------
// NORMALIZATION HELPERS
// ---------------------------------------------------------------------------

/** Lowercase + collapsed-whitespace canonical form used by every text/tag op. */
export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normalize a free-form trait string to the canonical `TRAIT_CONFIG` key.
 * Mirrors the helper in `components/collectibles/collection.ts`. Inlined here
 * so this module stays import-free and Deno-safe.
 */
export function normalizeTraitToken(token: string): string {
  const t = token.trim().toLowerCase().replace(/[\s-]+/g, '_');
  switch (t) {
    case 'rookie':
    case 'is_rookie':
      return 'is_rookie';
    case 'signed':
    case 'autographed':
    case 'is_autographed':
      return 'is_autographed';
    case 'game_used':
    case 'gameused':
    case 'is_game_used':
      return 'is_game_used';
    case 'graded':
    case 'is_graded':
      return 'is_graded';
    default:
      return token.trim();
  }
}

// ---------------------------------------------------------------------------
// ROW HYDRATORS
// ---------------------------------------------------------------------------

/** Subset of the snake_case `collectibles` row needed by the evaluator. */
export interface DbCollectibleRow {
  id: string;
  collectible_type: string | null;
  listing_title: string | null;
  title: string | null;
  value: number | null;
  available_for_sale: boolean | null;
  available_for_trade: boolean | null;
  traits: string[] | null;
  tags: string[] | null;
  filter_traits: {
    franchise?: string | null;
    item_type?: string | null;
    year?: number | null;
    maker?: string | null;
  } | null;
}

/**
 * Derive the listing status from the two boolean availability flags. Mirrors
 * `lib/design/status-config.ts#deriveStatus` so the Edge function and the
 * client agree on the canonical status values.
 *
 * Truth table:
 *   sale=true,  trade=true   → SELL_TRADE
 *   sale=true,  trade=false  → FOR_SALE
 *   sale=false, trade=true   → FOR_TRADE
 *   sale=false, trade=false  → NFST
 */
function deriveStatusFromFlags(sale: boolean | null, trade: boolean | null): string {
  if (sale && trade) return 'SELL_TRADE';
  if (sale) return 'FOR_SALE';
  if (trade) return 'FOR_TRADE';
  return 'NFST';
}

/** Hydrate a normalized eval row from the snake_case DB shape. */
export function evalRowFromDbRow(row: DbCollectibleRow): EvalCollectible {
  const ft = row.filter_traits;
  return {
    id: row.id,
    collectibleType: row.collectible_type,
    listingTitle: row.listing_title || row.title || null,
    value: typeof row.value === 'number' ? row.value : null,
    status: deriveStatusFromFlags(row.available_for_sale, row.available_for_trade),
    traits: (row.traits ?? []).map(normalizeTraitToken),
    tags: (row.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0),
    franchise: ft?.franchise || null,
    itemType: ft?.item_type || null,
    year: typeof ft?.year === 'number' ? ft.year : null,
    maker: ft?.maker || null,
  };
}

/**
 * Hydrate a normalized eval row from the camelCase `CollectionItem` shape.
 * Keeps the rule-builder live preview round-trip free — no extra fetch.
 */
export function evalRowFromCollectionItem(item: {
  id: string;
  title: string;
  collectibleType: string;
  value: number | null;
  status: string;
  traits: string[];
  tags?: string[];
  filterTraits?: { franchise?: string | null; item_type?: string | null; year?: number | null; maker?: string | null } | null;
}): EvalCollectible {
  const ft = item.filterTraits;
  return {
    id: item.id,
    collectibleType: item.collectibleType === 'unknown' ? null : item.collectibleType,
    listingTitle: item.title || null,
    value: item.value,
    status: item.status,
    traits: item.traits.map(normalizeTraitToken),
    tags: (item.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0),
    franchise: ft?.franchise || null,
    itemType: ft?.item_type || null,
    year: typeof ft?.year === 'number' ? ft.year : null,
    maker: ft?.maker || null,
  };
}

// ---------------------------------------------------------------------------
// PRETTY-PRINT (rules summary line on showcase detail + review screen)
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<RuleField, string> = {
  collectible_type: 'Type',
  listing_title: 'Title',
  value: 'Value',
  status: 'Status',
  traits: 'Traits',
  tags: 'Tags',
  franchise: 'Franchise',
  item_type: 'Item Type',
  year: 'Year',
  maker: 'Maker',
};

const OP_LABELS: Record<RuleOp, string> = {
  contains: 'contains',
  starts_with: 'starts with',
  eq: 'is',
  gte: 'is at least',
  lte: 'is at most',
  between: 'is between',
  is_one_of: 'is one of',
  is_all_of: 'is all of',
  is_none_of: 'is none of',
};

/** Human-readable label for a field, suitable for chip / summary copy. */
export function labelForField(field: RuleField): string {
  return FIELD_LABELS[field];
}

/** Human-readable label for an operator, suitable for chip / summary copy. */
export function labelForOp(op: RuleOp): string {
  return OP_LABELS[op];
}

function formatConditionValue(c: Condition): string {
  if (c.op === 'between' && Array.isArray(c.value) && c.value.length === 2) {
    return `${c.value[0]} – ${c.value[1]}`;
  }
  if (Array.isArray(c.value)) {
    return c.value.join(', ');
  }
  return String(c.value);
}

/**
 * Compact one-line rendering of a single condition. Suitable for the rules-
 * summary line on the showcase detail and the review-card chip stack.
 */
export function formatCondition(c: Condition): string {
  return `${labelForField(c.field)} ${labelForOp(c.op)} ${formatConditionValue(c)}`;
}

/** Human-readable rendering of an entire rule set. */
export function formatRulesSummary(rules: ManagedRules): string {
  if (!rules || rules.conditions.length === 0) return '';
  const lead = rules.match === 'any' ? 'Match any of' : 'Match all of';
  return `${lead}: ${rules.conditions.map(formatCondition).join(' · ')}`;
}
