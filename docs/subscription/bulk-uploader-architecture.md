# Bulk Uploader Architecture

> **Status**: Locked decisions captured (2026-05-14). Engineering details — Gemini Batch API integration, prompt caching wiring, schema migrations on the engine side — handled in the engine workspace separately.
> **Pillar of**: `subscription-implementation.md`
> **Related**: `cap-counter-architecture.md` (unified `scan` cap; bulk is just a path that consumes it), `pricing-model.md` (cap numbers), `paywall-ux.md` (UI surfaces)

## What this covers

The async, queued, batch-API extraction path that lives alongside the existing sync `extract-asset` path.

This document is structured in two sections:

1. **What's locked from a product/revenue standpoint** — the strategic and contractual decisions that affect both codebases. Stable.
2. **Engine-side implementation pointers** — what the engine workspace needs to build. Captured here at a contract level for cross-codebase visibility, not as engineering spec. The engine workspace owns the actual implementation.

If you're working in the Vitrine app workspace, sections 2 and 3 are what you need. If you're working in the engine workspace, section 4 is the contract surface to honor.

## 1. Locked decisions

- **Bulk is web-only.** Native app has no bulk path. Native users do single scans only.
- **Bulk is Pro+ only, with grace exception.** Free users post-grace cannot use bulk. Free users in their 30-day grace window gain bulk access via the same `effective_tier` substitution that handles caps (Free + in_grace → treated as Pro). The bulk uploader is a Pro upsell lever; grace is the 30-day Pro trial that includes bulk.
- **Single unified cap.** Bulk submissions count against the same `scan` monthly cap as live scans. There is no separate `scan.bulk` dimension. One scan is one scan from the user's perspective.
- **Bulk discount is captured as our margin, not priced through to the user.** Gemini Batch API saves ~50% on inference + prompt caching adds ~12% on cached tokens. The margin recovery is real but invisible to users — bulk and live cost the same one scan.
- **Per-batch max: 200 items.** Operational ceiling for upload payload, draft inventory, and batch-API usability. Not a cap-math knob.
- **Effective per-batch ceiling for a user:** `min(200, monthly_scan_remaining)`. Surfaced in the UI as "you can upload up to X photos in this batch."
- **Cap is charged at successful per-item completion.** Failed items in a batch produce no `extraction_events` row and are not charged. See `cap-counter-architecture.md` § 12 for the full failure refund semantics.
- **Latency expectation: ~24h SLA.** Users accept this in exchange for unlocking the path during onboarding (free) and for queueing large back-catalog imports without blocking the UI (paid).
- **No bulk in v1 of the subscription rollout.** Tier gate, cap config, and `can_use_bulk` predicate exist from day one; the actual web bulk uploader UI ships when the engine workspace ships the Gemini Batch API integration.

## 2. User-facing flow (app side)

Conceptual flow:

1. User navigates to the web app's Bulk Uploader (web-only surface)
2. **Gate check:** app calls `can_use_bulk(user_id)` predicate. If false, paywall surface (with copy that explains "available during your first 30 days, then on Pro+"). If true, proceed.
3. UI shows "You can upload up to **N** photos in this batch" where `N = min(200, monthly_scan_remaining)`
4. User drag-and-drops or selects N photos (and optionally pairs them — multiple photos per item, e.g., front+back of card)
5. UI groups photos into items (heuristic: each unique top-level "photo group" = one item)
6. User reviews item groupings, can adjust pairings, then hits Submit
7. App calls cap predicate (`check_user_cap(user_id, 'scan')`) with `items.length` as the projected batch size. If `used_this_month + items.length > monthly_cap`, the user is asked to trim the batch.
8. App POSTs to engine's `/queue-batch` endpoint with the item list
9. Engine returns `batch_id` + estimated completion time
10. App displays "Batch processing — we'll notify you when it's ready" status; user can leave
11. Engine processes via Gemini Batch API (~24h SLA)
12. As per-item callbacks arrive from the engine, app inserts `extraction_events` rows (with `is_bulk = TRUE` and `batch_id` set) and creates collectible drafts in `pending_review` state
13. When the full batch completes, app sends a push notification: "Your 47 cards are ready to review"
14. User opens the app, navigates to the Drafts surface, reviews each item, approves or discards
15. Approved items become full collectibles; discarded drafts get deleted (cap stays charged)

## 3. Draft state machine (app side)

Each bulk-extracted item exists as a draft until the user reviews it.

```
[engine completes item]
       ↓
   pending_review
       ↓
   ┌───┴───┐
   ↓       ↓
approved  discarded
   ↓       ↓
collectible  (deleted)
(saved)
```

States:
- **`pending_review`** — extraction completed by engine; app has the data; user has not yet reviewed
- **`approved`** — user reviewed and saved; promoted to a real collectible
- **`discarded`** — user reviewed and rejected; soft-deleted

Notes:
- Drafts that sit in `pending_review` for >30 days could be auto-promoted or auto-discarded. Decision deferred until we see real user behavior.
- Cap was charged when the engine completed the item, not when the user approved it. Discarding a draft does not refund the cap.

## 4. App ↔ Engine contract surface

This is the API contract the engine workspace needs to honor (or extend, if the existing endpoints don't yet support batch). It is intentionally minimal and aligns with the existing engine patterns.

### Existing single-item endpoints (already implemented in engine)

```
POST /queue-extraction          (one item, async via Inngest)
POST /extract-asset             (one item, sync — test harness primarily)
GET  /job-status/:job_id        (poll a single async job)
```

Existing async webhook payload (per `extraction_jobs` callback_url):

```json
{
  "job_id": "uuid",
  "status": "processing" | "complete" | "failed",
  "results": { ...full extract-asset response... },
  "error": "string"
}
```

### New batch endpoint (engine workspace will add)

```
POST /queue-batch
Authorization: Bearer <ENGINE_SHARED_SECRET>
Body:
{
  "client_id": "vitrine-app",
  "user_id": "<supabase user uuid>",
  "user_tier": "free" | "pro" | "collector",
  "callback_url": "<vitrine-app webhook receiver>",
  "items": [
    {
      "client_item_id": "<app-side draft id, echoed in callbacks>",
      "image_urls": ["<supabase storage url>", ...],
      "title": "string",
      "hint": "string?"
    },
    ...
  ]
}

Response 202:
{
  "batch_id": "uuid",
  "items_accepted": 47,
  "estimated_completion_at": "2026-05-15T10:30:00Z"
}
```

### Per-item completion webhook

The engine fires one webhook per completed (or failed) item. Format:

```json
{
  "batch_id": "uuid",
  "client_item_id": "<echoed from request>",
  "status": "complete" | "failed",
  "result": { ...full extract-asset response... } | null,
  "error": "string" | null
}
```

App side processes:
- `status = "complete"`: insert `extraction_events` row (`is_bulk = TRUE`, `batch_id` set), create draft collectible in `pending_review`
- `status = "failed"`: no event row inserted, log the failure for the user to see in the batch summary

Optional batch-level "all done" webhook fires once after all items have terminated (success or failure):

```json
{
  "batch_id": "uuid",
  "status": "batch_complete",
  "summary": {
    "items_accepted": 47,
    "items_succeeded": 45,
    "items_failed": 2
  }
}
```

App uses this to fire the user-facing push notification.

### Cancellation

```
POST /cancel-batch
Authorization: Bearer <ENGINE_SHARED_SECRET>
Body: { "batch_id": "uuid" }

Response:
{
  "batch_id": "uuid",
  "items_already_completed": 12,
  "items_cancelled": 35
}
```

Items already processed by Gemini before cancellation are committed (cap charged); items not yet started are cancelled (cap not charged).

## 5. Engine-side implementation pointers (handed off)

These are explicitly the engine workspace's problem. Captured here so the cross-codebase contract is visible.

- **Gemini Batch API integration.** The engine currently calls `generateContent` synchronously inside Inngest workers. Bulk needs the Batch API (file-based async submission, polling completion, result download). New code path; could live in `models/gemini-3-batch.ts` or be a flag on the existing client.
- **Prompt caching wiring.** Gemini context cache for the classifier prompt and the stable extraction template boilerplate. Image tokens are not cacheable. The classifier prompt (~5K tokens) is the highest-value cache target. Cache TTL: 1-24h depending on bulk volume cadence.
- **Schema additions.** Either extend `extraction_jobs` with `parent_batch_id` (recommended) or add a separate `extraction_batches` table. Either way, the existing job-level lifecycle continues to work; batches are just an aggregation key.
- **Cost telemetry extension.** Add `is_bulk` to `extraction_costs` so we can attribute and analyze sync vs bulk economics separately.
- **`user_tier` enum extension.** `extraction_jobs` and `extraction_costs` currently have `check (user_tier in ('free', 'pro'))`. Adding `'collector'` requires a one-line migration in each.
- **Multi-tenant batch packing (future, not v1).** Multiple users' items packed into a single Gemini batch job to maximize cache amortization. Significant complexity; revisit when bulk volume justifies it.

## 6. Open questions

- **Item pairing UX.** When a user drops 200 photos, how does the system decide which photos belong to which item? Heuristic options: (a) group by sequential filenames, (b) group by EXIF capture time proximity, (c) require user to manually group, (d) treat each photo as one item. Lean toward heuristic + user-adjustable. UX detail; deferred.
- **Auto-promote vs auto-discard for stale drafts.** If a user submits a 100-item batch and reviews 80 over a week, what happens to the remaining 20 after 30 days of inactivity? Probably auto-discard with a reminder; revisit with telemetry.
- **Batch-cancel mid-processing.** Gemini Batch API may not support fine-grained cancellation. We may need to either: (a) only support cancellation before submission, (b) accept that mid-batch cancellation is best-effort and items already processed are charged. Defer to engine workspace.
- **Empirical cap calibration.** The cap numbers in `cap-counter-architecture.md` are the locked product baseline. Pulling p50/p95 cost data from `extraction_costs` would refine them; recommended before launch but not a blocker.
- **In-flight bulk batches at grace expiry (closed 2026-05-14).** If a Free user submits a bulk batch on day 30 of grace and processing completes on day 31, do we honor it? **Answer: yes.** The gate check happens at submit time (`can_use_bulk` is evaluated then). Once accepted, the engine processes it and the app records the events as normal. The user just can't queue *new* batches after grace expires. This is the locked grace-expiry behavior: hard cliff on new submissions, grace-through for anything already in the pipeline.

## 7. Out of scope for this doc

These exist elsewhere or are explicitly deferred:

- **Cap predicate internals** — see `cap-counter-architecture.md`
- **Per-feature gating** — see `tier-gating-implementation.md`
- **Paywall surfaces** — see `paywall-ux.md`
- **Billing rails** — see `revenuecat-integration.md` and `subscription-architecture.md`
- **Engine internals** — owned by the engine workspace

## Decisions changelog

- **2026-05-14** — Doc created. Locked: web-only, universal access, two-cap model, per-batch max 200, cap charged at completion, engineering implementation deferred to engine workspace, contract surface defined for cross-codebase reference.
- **2026-05-14** — **Flipped bulk to Pro+ only with grace exception.** Universal access decision reversed. Bulk now gated by `can_use_bulk` predicate which uses the same `effective_tier` substitution as the cap predicate (Free + in_grace → treated as Pro → bulk allowed). Free users post-grace lose bulk access. Strategic: bulk is now a Pro upsell, grace is the 30-day Pro trial that includes bulk import. Two-cap model also dropped — bulk submissions consume the unified `scan` cap.
