/**
 * Shared mapping between the Looking Glass engine response and the app's
 * `collectibles` columns. Used by both the looking-glass-webhook receiver and
 * the job-status proxy/reconciler so the two paths can never drift.
 *
 * See docs/EXTRACTION_CONTRACT.md for the authoritative contract.
 */

/** Terminal app-side extraction states that must never be overwritten. */
export const TERMINAL_STATES = [
  "complete",
  "failed",
  "extracted",
  "rejected",
] as const;

/**
 * Map an engine `results` payload (full ExtractResponse) into the subset of
 * `collectibles` columns the app persists.
 */
export function mapEngineResponseToColumns(
  results: Record<string, unknown>,
): Record<string, unknown> {
  const cls = results.classification as {
    rejected?: string | null;
    collectible_type?: string | null;
    type_code?: string | null;
    category_code?: string | null;
    sub_type?: string | null;
    domain?: string | null;
  } | null;

  const isRejected = cls?.rejected != null;

  let classification: string;
  if (!cls) {
    classification = "unknown";
  } else if (isRejected) {
    classification = cls.collectible_type ?? "unknown";
  } else if (cls.collectible_type === "memorabilia") {
    classification = [cls.collectible_type, cls.type_code, cls.category_code]
      .filter(Boolean)
      .join(".");
  } else {
    classification = [cls.collectible_type, cls.sub_type, cls.domain]
      .filter(Boolean)
      .join(".");
  }

  const rawTraits = results.traits as Record<string, boolean> | null;
  const traits = rawTraits
    ? Object.entries(rawTraits)
        .filter(([_, v]) => v === true)
        .map(([k]) => k)
    : [];

  const schemaMeta = results.schema_meta as {
    field_schema?: unknown;
    mode?: string;
  } | null;

  const verification = results.verification as {
    available?: boolean;
    url?: string;
  } | null;

  const classificationParts = classification.split(".");
  const category = classificationParts[1] ?? null;
  const subcategory = classificationParts[2] ?? null;

  return {
    collectible_type: cls?.collectible_type ?? null,
    classification,
    category,
    subcategory,
    confidence: (results.confidence as string) ?? null,
    traits,
    ai_metadata: results.ai_metadata ?? null,
    trait_metadata: results.trait_metadata ?? null,
    filter_traits: results.filter_traits ?? null,
    listing_title: (results.listing_title as string) ?? null,
    listing_description: (results.listing_description as string) ?? null,
    field_schema: schemaMeta?.field_schema ?? null,
    schema_mode: schemaMeta?.mode ?? null,
    verification_url:
      verification?.available === true ? verification.url ?? null : null,
  };
}

/**
 * Map an engine failure_code (EngineErrorCode) to the app's existing
 * `extraction_failure_reason` taxonomy
 * (unreadable_image | engine_error | timeout | enqueue_failed).
 */
export function mapFailureCodeToReason(code?: string | null): string {
  switch (code) {
    case "AI_TIMEOUT":
      return "timeout";
    case "URL_NOT_ALLOWED":
    case "AI_FORMAT_ERROR":
      return "unreadable_image";
    // AI_SERVICE_ERROR | COST_CAP_EXCEEDED | INTERNAL_ERROR | UNKNOWN | other
    default:
      return "engine_error";
  }
}
