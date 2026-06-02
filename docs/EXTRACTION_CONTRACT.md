# Extraction Contract: Looking Glass Engine to Collector App

Authoritative contract for the async extraction pipeline between the Looking Glass
engine (`vitrinedb`, Supabase project `nhshzyktaarbknzpsvtr`) and the Collector App
(`MyVitrine`, Supabase project `fxmiongkckkrllgyfwyw`).

This document is the source of truth for the cross-system payloads. Both the engine
webhook/`job-status` and the app receiver/proxy MUST conform to it. All fields added
by this contract are additive and optional so that in-flight jobs and partial
rollouts degrade gracefully to the legacy 4-state behavior.

## Job lifecycle

Engine `extraction_jobs.status` (unchanged): `queued | processing | complete | failed`.

`complete` is split by `outcome`:
- `outcome = "extracted"` — a real collectible was extracted; results populated.
- `outcome = "rejected"` — the engine recognized the input but rejected it (e.g. not a
  collectible). `result` still carries the rejection classification; no usable fields.

`failed` carries a `failure_code` (engine retries already exhausted).

## Stage vocabulary

Written by the pipeline to `extraction_jobs.stage` as it progresses. Surfaced to the
app via `job-status`. Each value maps to a real pipeline milestone:

- `queued` — in Inngest queue (pre-worker).
- `preparing` — image prep + taxonomy/sub-type/domain fetch.
- `classifying` — Pass 1 classifier call.
- `routing` — escalation decision + path selection (memorabilia / self-learning / discovery).
- `designing_schema` — cold-start or discovery schema design (cache-miss only; the slow path).
- `extracting` — Pass 2 extraction call (dominant latency).
- `verifying` — signer-evidence enforcement + verification deep-link detection.

Consumers MUST treat stages as non-linear: stages can be skipped (e.g. cached path
skips `designing_schema`) or jump straight to terminal (rejection exits after
`classifying`). Never assume a fixed sequence.

`stage_history` (engine-only JSONB): array of `{ stage, at }` for timing/trace.

## Terminal payload (webhook + job-status)

```jsonc
{
  "job_id": "uuid",
  "status": "complete" | "failed",
  // when status = complete:
  "outcome": "extracted" | "rejected",
  "results": { /* full ExtractResponse, present when outcome = extracted */ },
  "rejection_reason": "not_a_collectible" | "multiple_distinct_items"
                    | "image_quality_too_low" | "content_unclear",  // when rejected
  // when status = failed:
  "failure_code": "AI_SERVICE_ERROR" | "AI_TIMEOUT" | "AI_FORMAT_ERROR"
                | "COST_CAP_EXCEEDED" | "URL_NOT_ALLOWED" | "INTERNAL_ERROR" | "UNKNOWN",
  "error": "human-readable string"  // when failed (legacy field, retained)
}
```

`rejection_reason` values are the engine `REJECTION_CODES`
(`extract-asset/schemas.ts`). `failure_code` values are the engine `EngineErrorCode`
taxonomy (`extract-asset/errors.ts`); `UNKNOWN` is the fallback when no code can be
parsed.

## job-status response (engine GET /job-status/:id)

Existing fields (`status`, `position`, `eta_seconds`, `results`, `error`,
timestamps) plus:
- `stage` — current stage (see vocabulary).
- `outcome` — present once `complete`.
- `rejection_reason` — present when rejected.
- `failure_code` — present when failed.

`trace` is NOT exposed to the app; it stays in the engine DB for debugging.

## Engine-side trace (internal only)

`extraction_jobs.trace` JSONB, assembled from the existing `CostAccumulator`:
```jsonc
{
  "mode": "curated" | "cached" | "cold_start" | "discovery" | "rejected",
  "escalated": false,
  "provider": "gemini-2",
  "stages": [{ "stage": "classifying", "ms": 3120 }, ...],
  "cost_usd": 0.0123,
  "calls": [{ "stage": "classifier", "model": "...", "input_tokens": 0, "output_tokens": 0 }]
}
```

## App-side mapping (collectibles.extraction_status)

The app stores its own lifecycle on `public.collectibles`:
- engine `processing` -> `extraction_status = 'processing'`.
- engine `complete` + `outcome = extracted` -> `extraction_status = 'extracted'`,
  columns mapped from `results`. The `complete_and_publish` trigger promotes
  single-lane rows to `'complete'` but does NOT set `published_at` (client-owned
  publish). Batch rows respect `batch_uploads.auto_publish`.
- engine `complete` + `outcome = rejected` -> `extraction_status = 'rejected'`,
  `extraction_failure_reason = rejection_reason`. NOT published, NOT mapped as a real item.
- engine `failed` -> `extraction_status = 'failed'`,
  `extraction_failure_reason` = mapped `failure_code` (see mapping below),
  `extraction_failed_at = now()`.

### failure_code -> extraction_failure_reason mapping

Existing app reason codes: `unreadable_image | engine_error | timeout | enqueue_failed`.
- `AI_TIMEOUT` -> `timeout`
- `URL_NOT_ALLOWED` / `AI_FORMAT_ERROR` -> `unreadable_image`
- `AI_SERVICE_ERROR` / `COST_CAP_EXCEEDED` / `INTERNAL_ERROR` / `UNKNOWN` -> `engine_error`

## Completion detection (app)

The app treats the engine `job-status` (via the app-side `job-status` proxy) as the
source of truth for both `stage` and completion. The proxy doubles as a reconciler:
if the engine reports `complete` but the app `collectibles` row is non-terminal (a
dropped webhook), the proxy maps `results` into the row via the shared mapper. The
`collectibles` Realtime subscription continues to deliver the mapped extraction data
for the review screen.

## Rollout / compatibility

- Deploy order: engine (migration + functions) -> app DB migrations -> app Edge
  Functions -> app client (OTA).
- All new fields are optional; absence => legacy behavior.
- Idempotency: terminal `extraction_status` (`complete | failed | extracted |
  rejected`) is never overwritten by a later webhook or reconcile.
