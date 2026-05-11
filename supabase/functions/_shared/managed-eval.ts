/**
 * Shared managed-showcase rule evaluator for Supabase Edge Functions.
 *
 * Mirrors the canonical evaluator in `lib/api/managed-rules.ts` — same
 * types, same semantics, zero drift. Inlined here because Edge Functions
 * run in Deno and cannot import from `@/lib/...` aliases.
 *
 * If the canonical module's operator semantics change, update this file
 * in lockstep.
 */

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type RuleField =
  | "collectible_type"
  | "listing_title"
  | "value"
  | "status"
  | "traits"
  | "tags"
  | "franchise"
  | "item_type"
  | "year"
  | "maker";

export type RuleOp =
  | "contains"
  | "starts_with"
  | "eq"
  | "gte"
  | "lte"
  | "between"
  | "is_one_of"
  | "is_all_of"
  | "is_none_of";

export type ConditionValue = string | number | string[] | [number, number];

export interface Condition {
  field: RuleField;
  op: RuleOp;
  value: ConditionValue;
}

export interface ManagedRules {
  match: "all" | "any";
  conditions: Condition[];
}

export interface EvalCollectible {
  id: string;
  collectibleType: string | null;
  listingTitle: string | null;
  value: number | null;
  status: string;
  traits: string[];
  tags: string[];
  franchise: string | null;
  itemType: string | null;
  year: number | null;
  maker: string | null;
}

// ---------------------------------------------------------------------------
// NORMALIZATION
// ---------------------------------------------------------------------------

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeTraitToken(token: string): string {
  const t = token.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (t) {
    case "rookie":
    case "is_rookie":
      return "is_rookie";
    case "signed":
    case "autographed":
    case "is_autographed":
      return "is_autographed";
    case "game_used":
    case "gameused":
    case "is_game_used":
      return "is_game_used";
    case "graded":
    case "is_graded":
      return "is_graded";
    default:
      return token.trim();
  }
}

function deriveStatusFromFlags(
  sale: boolean | null,
  trade: boolean | null,
): string {
  if (sale && trade) return "SELL_TRADE";
  if (sale) return "FOR_SALE";
  if (trade) return "FOR_TRADE";
  return "NFST";
}

// ---------------------------------------------------------------------------
// ROW HYDRATOR
// ---------------------------------------------------------------------------

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

export function evalRowFromDbRow(row: DbCollectibleRow): EvalCollectible {
  const ft = row.filter_traits;
  return {
    id: row.id,
    collectibleType: row.collectible_type,
    listingTitle: row.listing_title || row.title || null,
    value: typeof row.value === "number" ? row.value : null,
    status: deriveStatusFromFlags(
      row.available_for_sale,
      row.available_for_trade,
    ),
    traits: (row.traits ?? []).map(normalizeTraitToken),
    tags: (row.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    franchise: ft?.franchise || null,
    itemType: ft?.item_type || null,
    year: typeof ft?.year === "number" ? ft.year : null,
    maker: ft?.maker || null,
  };
}

// ---------------------------------------------------------------------------
// CONDITION MATCHERS
// ---------------------------------------------------------------------------

function matchSingleValueOp(
  itemValue: string | null,
  c: Condition,
): boolean {
  if (!Array.isArray(c.value)) return false;
  const ruleValues = (c.value as string[]).map(normalizeText);
  const candidate = itemValue == null ? null : normalizeText(itemValue);

  switch (c.op) {
    case "is_one_of":
      return candidate != null && ruleValues.includes(candidate);
    case "is_none_of":
      return candidate == null || !ruleValues.includes(candidate);
    default:
      return false;
  }
}

function matchTextOp(itemText: string | null, c: Condition): boolean {
  if (typeof c.value !== "string") return false;
  if (itemText == null || itemText.length === 0) return false;
  const haystack = normalizeText(itemText);
  const needle = normalizeText(c.value);
  if (needle.length === 0) return false;

  switch (c.op) {
    case "contains":
      return haystack.includes(needle);
    case "starts_with":
      return haystack.startsWith(needle);
    default:
      return false;
  }
}

function matchNumericOp(
  itemValue: number | null,
  c: Condition,
): boolean {
  if (itemValue == null || !Number.isFinite(itemValue)) return false;

  switch (c.op) {
    case "eq":
      return typeof c.value === "number" && itemValue === c.value;
    case "gte":
      return typeof c.value === "number" && itemValue >= c.value;
    case "lte":
      return typeof c.value === "number" && itemValue <= c.value;
    case "between": {
      if (!Array.isArray(c.value) || c.value.length !== 2) return false;
      const [min, max] = c.value as [number, number];
      return itemValue >= min && itemValue <= max;
    }
    default:
      return false;
  }
}

function matchMultiValueOp(
  itemValues: string[],
  c: Condition,
): boolean {
  if (!Array.isArray(c.value)) return false;
  const haystack = new Set(
    itemValues.map(normalizeText).filter((s) => s.length > 0),
  );
  const needles = (c.value as string[])
    .map(normalizeText)
    .filter((s) => s.length > 0);

  switch (c.op) {
    case "is_one_of":
      return needles.some((v) => haystack.has(v));
    case "is_all_of":
      return needles.every((v) => haystack.has(v));
    case "is_none_of":
      return !needles.some((v) => haystack.has(v));
    default:
      return false;
  }
}

function conditionMatches(item: EvalCollectible, c: Condition): boolean {
  switch (c.field) {
    case "collectible_type":
      return matchSingleValueOp(item.collectibleType, c);
    case "status":
      return matchSingleValueOp(item.status, c);
    case "listing_title":
      return matchTextOp(item.listingTitle, c);
    case "value":
      return matchNumericOp(item.value, c);
    case "traits":
      return matchMultiValueOp(item.traits, c);
    case "tags":
      return matchMultiValueOp(item.tags, c);
    case "franchise":
      return matchSingleValueOp(item.franchise, c);
    case "item_type":
      return matchSingleValueOp(item.itemType, c);
    case "year":
      return matchNumericOp(item.year, c);
    case "maker":
      return matchSingleValueOp(item.maker, c);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// PUBLIC EVALUATOR
// ---------------------------------------------------------------------------

export function itemMatchesManagedRules(
  item: EvalCollectible,
  rules: ManagedRules,
): boolean {
  if (
    !rules ||
    !Array.isArray(rules.conditions) ||
    rules.conditions.length === 0
  ) {
    return false;
  }

  if (rules.match === "any") {
    return rules.conditions.some((c) => conditionMatches(item, c));
  }
  return rules.conditions.every((c) => conditionMatches(item, c));
}

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
