# Upload Lane Unification Plan

**Status:** Design complete 2026-05-19. Not implemented. To be carried into a future implementation mode.

**Conversation source:** Live planning session, 2026-05-19. See `agent-transcripts/08dc647f-4724-48dc-bf5f-99069d0053e9` for the full thread that produced this plan.

---

## 1. Why this exists

Three distinct upload surfaces have evolved independently:

- **Single-item upload (web + native):** Photos → Theater → Review → Preferences → Done. Client must remain open through the entire flow because auto-commit runs client-side after extraction completes.
- **Bulk uploader (web only):** Card-based, multiple items in flight. Each card auto-commits when its extraction completes — but the client still has to be open for that auto-commit to fire.
- **Bulk uploader (native, future):** Doesn't exist yet. The user wants this to be a Pro+ feature, but mobile users will background or close the app while a batch of 20 is processing. The current architecture cannot survive that.

The shared root cause: **auto-commit is client-bound today**, even though everything upstream of it (Looking Glass, the webhook, the DB writes) is already fire-and-forget.

This plan captures the architectural change that fixes that, the UX rearrangement it enables, and the full failure-handling and workflow-queue design.

---

## 2. The current pipeline (verified by code reading)

```
┌─────────┐  1) upload photos      ┌──────────────────┐
│ Client  │ ──────────────────────►│ Supabase Storage │
│ (RN/Web)│                        └──────────────────┘
│         │
│         │  2) insert draft row   ┌──────────────────┐
│         │ ──────────────────────►│ public.collectib │
│         │   (status='queued')    │      les          │
│         │                        └──────────────────┘
│         │
│         │  3) enqueue-extraction ┌──────────────────┐    ┌─────────────────┐
│         │ ──────────────────────►│ Edge Function    │───►│  Looking Glass  │
│         │   (returns 202+jobId)  │ enqueue-extraction│   │  (server-side)  │
│         │                        └──────────────────┘    │  AI inference   │
└─────────┘                                                │  ~10-30s/job    │
    ▲                                                      └─────────────────┘
    │                                                              │
    │ 7) Realtime/poll wakes client to auto-commit                │ 4) HTTP POST
    │    (sets status='complete' + value + showcases)             │    callback
    │                                                              ▼
    │                              ┌──────────────────┐    ┌─────────────────┐
    └──────────────────────────────│ collectibles row │◄───│ looking-glass-  │
                                   │   AI fields filled│    │     webhook     │
                                   │ status='extracted'│    │  (Edge Function)│
                                   └──────────────────┘    └─────────────────┘
                                          5) writes results            6) HMAC-verified
```

### Where the app currently must be alive

| Phase | App open required? | Why |
|---|---|---|
| 1. Photo upload | YES | Bytes live on the device |
| 2. Draft row insert | YES (~50ms) | Trivial HTTP |
| 3. enqueue-extraction call | YES (~200-500ms) | Trivial HTTP |
| 4. Looking Glass extracts | NO | Server-side service |
| 5. Webhook fires back | NO | Server-to-server |
| 6. Webhook writes AI fields | NO | Server-to-server |
| 7. Auto-commit | YES | **THIS IS THE PROBLEM** |

Phase 7 is the only structurally-fixable client dependency. Phase 1 is genuinely client-bound (no server can read photos that haven't left the device); we'll just minimize and communicate it.

### Files involved (reference)

- `supabase/functions/enqueue-extraction/index.ts` — proxies client → Looking Glass
- `supabase/functions/looking-glass-webhook/index.ts` — receives callbacks, writes AI fields, sets `extraction_status='extracted'`
- `packages/api/src/modules/extraction.ts` — `enqueueExtraction`, `pollJobStatus`, `subscribeToCollectibleRow`, `raceForCompletion`
- `apps/web/app/v/upload/batch-processor.ts` — orchestrates the web batch flow
- `apps/native/components/upload-entry.tsx` — single-item native flow
- `apps/web/app/v/catalog/single/page.tsx` — single-item web flow
- `apps/native/lib/api/collectibles.ts` — `deleteDraftCollectible`, `sweepStaleStagingRows` (to be removed)
- `apps/native/app/_layout.tsx` — calls `sweepStaleStagingRows` on app start (to be removed)

---

## 3. Target architecture: server-side completion + publish gate

### Core concept

In the new architecture, **there are no drafts in the old sense**. The moment a user taps "Catalog Item" or "Process Batch," the row is theirs — fully committed with all user-provided metadata (photos, status, value, privacy, tags, showcases). The only question is whether the AI succeeds in extracting details, and whether the user wants items published immediately or held for review.

Three columns control the lifecycle:

| Column | Question it answers |
|---|---|
| `extraction_status` | Did the AI finish its job? (`queued` / `processing` / `complete` / `failed`) |
| `privacy` | Who can see this once published? (`public` / `followers` / `private`) |
| `published_at` | Is this item visible in the collection yet? (`NULL` = in My Queue, timestamp = published) |

### The state machine

```
[User taps "Catalog Item" or "Process Batch"]
        │
        ▼
[Row inserted with all metadata]
[extraction_status = 'queued']
[published_at = NULL]
        │
        ▼
[Photos upload, enqueue-extraction fires]
        │
        ▼
   ┌────────────────────────────────┐
   │   Looking Glass (server-side)  │
   └────────────┬───────────────────┘
                │
        ┌───────┴───────┐
        │               │
    success          failure
        │               │
        ▼               ▼
  extraction_status   extraction_status
    = 'complete'        = 'failed'
        │               │
        │               └──► MY QUEUE → ERRORS
        │                    (retry or remove)
        │
        ├── auto_publish = true ──► published_at = now()
        │                           → appears in Collection
        │                           → amber dot (needs acknowledgment)
        │
        └── auto_publish = false ─► published_at stays NULL
                                    → appears in MY QUEUE → REVIEW
                                    → user publishes manually later
```

### What "published" means for visibility

Every public-facing surface filters on TWO conditions:

```
WHERE extraction_status = 'complete'
  AND published_at IS NOT NULL
```

- Owner's collection grid: `published_at IS NOT NULL` (shows all privacy levels to owner)
- Public profile: `published_at IS NOT NULL AND privacy = 'public'`
- Browse / Explore / Search: `published_at IS NOT NULL AND privacy = 'public'`
- Showcases: junction rows exist, but items filtered at render (`published_at IS NOT NULL`)
- Activity feed "X added an item": fires on publish (when `published_at` transitions from NULL to a value)

---

## 4. Schema changes (consolidated)

```sql
-- New columns on collectibles
ALTER TABLE public.collectibles
  ADD COLUMN published_at TIMESTAMPTZ NULL,
  ADD COLUMN extraction_acknowledged_at TIMESTAMPTZ NULL,
  ADD COLUMN extraction_retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN extraction_failure_reason TEXT NULL,
  ADD COLUMN extraction_failed_at TIMESTAMPTZ NULL;

-- New column on batch_uploads
ALTER TABLE public.batch_uploads
  ADD COLUMN auto_publish BOOLEAN NOT NULL DEFAULT true;

-- Backfill: all existing 'complete' rows are already published
UPDATE public.collectibles
   SET published_at = updated_at
 WHERE extraction_status = 'complete';

-- Backfill: all existing NULL extraction_status rows (legacy manual-entry)
-- are already published (they predate the extraction system)
UPDATE public.collectibles
   SET published_at = COALESCE(updated_at, created_at),
       extraction_status = 'complete'
 WHERE extraction_status IS NULL;

-- The server-side completion trigger
CREATE OR REPLACE FUNCTION public.complete_and_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- When webhook flips status to 'extracted', promote to 'complete'
  IF NEW.extraction_status = 'extracted' THEN
    NEW.extraction_status := 'complete';

    -- Auto-publish logic: check if this item's batch has auto_publish,
    -- or if it's a single-lane upload (no batch_id → always auto-publish)
    IF NEW.batch_id IS NULL THEN
      -- Single-lane: always auto-publish
      NEW.published_at := now();
    ELSE
      -- Batch: check the batch's auto_publish setting
      IF (SELECT auto_publish FROM public.batch_uploads WHERE id = NEW.batch_id) THEN
        NEW.published_at := now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complete_and_publish
BEFORE UPDATE OF extraction_status ON public.collectibles
FOR EACH ROW
EXECUTE FUNCTION public.complete_and_publish();

-- Partial indexes for common queries
CREATE INDEX idx_collectibles_published
  ON collectibles (user_id, created_at DESC)
  WHERE published_at IS NOT NULL AND extraction_status = 'complete';

CREATE INDEX idx_collectibles_queue_review
  ON collectibles (user_id, created_at DESC)
  WHERE extraction_status = 'complete' AND published_at IS NULL;

CREATE INDEX idx_collectibles_queue_errors
  ON collectibles (user_id, extraction_failed_at DESC)
  WHERE extraction_status = 'failed';
```

---

## 5. Sweep removal

### What exists today

Two mechanisms clean up "abandoned" rows:

1. **`deleteDraftCollectible(id)`** — explicit deletion when user taps "Start Over" or discards (only deletes non-`complete` rows)
2. **`sweepStaleStagingRows(userId)`** — runs on app startup, deletes any non-`complete` row older than 1 hour

### Why they're now dangerous

In the new architecture there are no uncommitted drafts. Every non-`complete` row is either:
- Actively processing (transient — seconds to minutes)
- Failed (needs user action — retry or remove)

The 1-hour sweep would silently destroy failed items the user owns.

### What we do

**Delete both functions entirely.** The startup sweep call in `_layout.tsx` is removed.

- `apps/native/lib/api/collectibles.ts`: remove `deleteDraftCollectible` and `sweepStaleStagingRows`
- `apps/native/app/_layout.tsx`: remove the `sweepStaleStagingRows` call
- `apps/native/components/upload-entry.tsx`: remove calls to `deleteDraftCollectible`

Confirmed via database query (2026-05-19): zero rows exist in `queued`, `processing`, `extracted`, or `failed` states. Only `NULL` (10,570 legacy rows) and `complete` (5 rows). Migration is safe to run without a transitional "filter on auto_commit" phase.

---

## 6. Unified lane mental model

```
                   SINGLE                              BATCH
                   ──────                              ─────

Lane select       ✓ "Single"                          ✓ "Batch" (Pro+ gated;
                                                        visible/disabled w/
                                                        upgrade modal on tap)

Capture            Photos + preferences,              Cards (each w/ photos
                   one merged screen                  + preferences); global
                                                       defaults drawer;
                                                       auto-publish toggle

Submit             "Catalog Item"                     "Process Batch"

Server pipeline    ─── Identical for both lanes ───
                   Insert row w/ all metadata
                   → Upload photos
                   → Call enqueue-extraction
                   → Looking Glass extracts (server-side)
                   → Webhook writes AI fields (server-side)
                   → Trigger flips to 'complete' (server-side)
                   → If auto-publish: set published_at (server-side)
                   → Push notification fires (server-side)

Publish behavior   Always auto-publish                User-configurable:
                   (single-lane has in-flow           • Auto-publish (default)
                   review screen instead)             • Hold for review

Theater            Optional, non-blocking,            Singular "batch submitted"
                   shows progress; user free          screen; user free to
                   to leave after photo               leave after photo
                   uploads finish                     uploads finish

Review             In-flow: optional editor           Via My Queue → Review tab
                   screen if user stays               (when auto-publish is off)
                   in the app

Failure            → My Queue → Errors tab            → My Queue → Errors tab
                   (same UX for both lanes)           (same UX for both lanes)
```

---

## 7. Single-lane Option A: merged capture screen

### Flow

```
1. Lane Select          [Single | Batch (Pro+ gated)]
2. Photos + Preferences  ← merged into one card-like screen
3. Theater               ← non-blocking; item publishes server-side
4. Review (optional)     ← fast-path edit if user is still in the app
                            otherwise: amber dot on the collection card
```

### The merged screen

```
┌─────────────────────────────────────────┐
│  [< Back]                       Catalog │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐   │
│   │      [+ Add photos]             │   │  ← photo strip
│   │   (camera | library | recent)   │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Title hint  (optional)                │
│   ┌─────────────────────────────────┐   │
│   │ "1986 Topps Jose Canseco RC"    │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Status     [Not for sale ▾]           │
│   Value      —                          │  ← shown only if FOR_SALE
│                                              or SELL_TRADE
│   Visibility [Public ▾]                 │
│   Tags       [+ add]                    │
│   Showcases  [+ add]                    │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │       Catalog Item              │   │  ← primary CTA
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Smart defaults

- **Status:** NOT_FOR_SALE
- **Visibility:** PUBLIC
- **Value:** empty (only required if status implies sale price)
- **Tags:** empty (AI fills these later)
- **Showcases:** empty
- **Title hint:** kept as a real input (improves rare-item recognition)

Casual users can hit "Catalog Item" the second they've added photos.

### Review screen reframing

The review screen no longer gates entry to the collection. Copy shifts:

- **Today:** "Review extraction — Confirm details before adding to your collection"
- **New:** "Looks good? This item is in your collection. Tweak the AI's read if anything's off, or skip."

Tapping "Done" → sets `extraction_acknowledged_at = now()`.
Tapping back / closing the app → amber dot stays on the card until specs are viewed.

---

## 8. Batch lane

### Web (existing, modified)

The existing web batch uploader (`/batch`) keeps its card-based UI. Changes:

- All metadata moves into the initial INSERT (most already is; add `value`)
- `showcase_collectibles` rows inserted at enqueue time
- Client-side auto-commit removed (trigger handles it)
- New toggle added near "Process Batch": **"Hold for review before publishing"**
  - Default: OFF (auto-publish, same as today)
  - When ON: sets `batch_uploads.auto_publish = false` → items land in My Queue → Review

### Native (future, Pro+ only)

Not yet designed in detail. Confirmed properties:

- **Pro+ gated:** Lane selector shows batch to all users; disabled for free/basic with upgrade badge. Tap → upgrade modal.
- **Theater UX:** Singular "batch is processing" screen (per-card visualization doesn't scale on mobile). User can dismiss freely.
- **Concurrency:** Items can run sequentially; doesn't matter since user isn't watching.
- **Photo source:** Open question. Camera rapid-fire vs. library picker.
- **Auto-publish toggle:** Same as web — prominent near "Process Batch."
- **Cap:** 20 items per batch.

---

## 9. My Queue (native) + Web History extensions

### Philosophy

My Queue is a **native app concept** that lives on the collection surface. The web standalone `/batch` experience is a companion upload tool — it does NOT get its own My Queue. Instead, the existing web History view gains inline actions for unresolved items.

Both surfaces query the same underlying data. The native My Queue is the canonical home for all workflow items regardless of where the upload originated (web or native).

---

### 9a. My Queue (native — collection surface)

#### Entry point

A persistent button on the native collection screen: **"My Queue"** — always visible, greyed out when empty, filled with color + numeric badge when non-empty.

```
┌────────────────────────────────────────────────────┐
│  My Catalog                                         │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  Collection      │  │  My Queue  (3)       │   │
│  │  137 items       │  │                      │   │
│  └──────────────────┘  └──────────────────────┘   │
└────────────────────────────────────────────────────┘
```

#### Internal structure

Two tabs: **Review** and **Errors**. Both always visible (with empty states when there's nothing in them). Default landing: **Review tab**.

#### Review tab

Items the user intentionally held for review before publishing. These have `extraction_status = 'complete'` and `published_at IS NULL`.

```
┌────────────────────────────────────────────────────────┐
│  ←  My Queue                                            │
├────────────────────────────────────────────────────────┤
│   ┌─ Review (2) ───────┐ ┌─ Errors (1) ───────┐       │
│                                                         │
│  Items you're holding before publishing                 │
│  ┌───────────────────────────────────────────────┐     │
│  │ [photo]  1986 Topps Jose Canseco RC            │     │
│  │          Sports Card · 1986 · Topps            │     │
│  │          $250 · Public                         │     │
│  │          [Publish]  [Edit]  [Discard]          │     │
│  └───────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────┐     │
│  │ [photo]  1989 Upper Deck Ken Griffey Jr RC     │     │
│  │          Sports Card · 1989 · Upper Deck       │     │
│  │          $400 · Public                         │     │
│  │          [Publish]  [Edit]  [Discard]          │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  [ Publish all (2) ]                                    │
├────────────────────────────────────────────────────────┤
│  Empty state: "Nothing to review right now."            │
└────────────────────────────────────────────────────────┘
```

Actions:
- **Publish:** Sets `published_at = now()`. Item moves to Collection at its configured privacy.
- **Edit:** Opens standard detail edit flow. On save, auto-publishes (sets `published_at`).
- **Discard:** Confirmation → standard `deleteCollectible`. Row and photos permanently gone.
- **Publish all:** Bulk action, sets `published_at = now()` on all Review items.

#### Errors tab

Items where extraction failed. These have `extraction_status = 'failed'`.

```
┌────────────────────────────────────────────────────────┐
│  ←  My Queue                                            │
├────────────────────────────────────────────────────────┤
│   ┌─ Review (2) ───────┐ ┌─ Errors (1) ───────┐       │
│                                                         │
│  AI couldn't read these — needs your attention          │
│  ┌───────────────────────────────────────────────┐     │
│  │ [photo]  (no title available)                  │     │
│  │          We couldn't read this.                │     │
│  │          Image was too blurry to identify.     │     │
│  │                                                │     │
│  │          [Try again (2 left)]  [Remove]        │     │
│  │                                                │     │
│  │          Will be removed in 38 days            │     │  ← visible only
│  └───────────────────────────────────────────────┘     │     last 7 days
│                                                         │
├────────────────────────────────────────────────────────┤
│  Empty state: "No issues right now. Looking good!"      │
└────────────────────────────────────────────────────────┘
```

Actions:
- **Try again:** Fires a new extraction with the same images. Increments `extraction_retry_count`. Resets `extraction_status` to `'queued'`. Disabled when count reaches cap (button shows "No retries left").
- **Remove:** Confirmation → standard `deleteCollectible`. Row and photos permanently gone.

---

### 9b. Web History extensions (standalone `/batch` surface)

The existing web batch History view (`/batch/history` and `/batch/history/[id]`) already shows batch status per-item. It gains inline actions for unresolved items so the user doesn't need to switch to the native app to handle failures or publish held items.

#### What changes in the History detail view (`/batch/history/[id]`)

Each item in a batch history already renders with its extraction status. The extension adds action buttons contextually:

**For failed items (`extraction_status = 'failed'`):**
```
┌───────────────────────────────────────────────────┐
│ [photo]  (no title)                                │
│          ✕ Failed — Image was too blurry           │
│          [Try again (2 left)]  [Remove]            │
└───────────────────────────────────────────────────┘
```

**For held-for-review items (`extraction_status = 'complete'`, `published_at IS NULL`):**
```
┌───────────────────────────────────────────────────┐
│ [photo]  1986 Topps Jose Canseco RC               │
│          Sports Card · 1986 · Topps · $250        │
│          [Publish]  [Discard]                      │
└───────────────────────────────────────────────────┘
```

**For published items (normal, no actions needed):**
```
┌───────────────────────────────────────────────────┐
│ [photo]  1986 Topps Jose Canseco RC               │
│          Sports Card · 1986 · Topps · $250        │
│          ✓ Published                               │
└───────────────────────────────────────────────────┘
```

#### Batch-level actions in the History detail header

When a batch has held-for-review items: **[ Publish all (N) ]** button at the top.

#### No new routes

All of this lives within the existing History routes. No `/batch/queue` or similar. The web batch surface stays minimal: Upload | History — that's it.

---

### Auto-purge rules (applies to both surfaces)

| Section | Auto-purge? | Timeout | Warning |
|---|---|---|---|
| Review | **No** — items stay indefinitely | — | — |
| Errors | **Yes** | 45 days after `extraction_failed_at` | Push notification 24h before; visible countdown in last 7 days |

---

## 10. Failure handling

### Philosophy

A failed extraction means the AI couldn't determine what the item is. Without a `collectible_type` or `category_code`, there is no schema to present for manual entry. Therefore:

- **No manual entry path exists for failed items.** The type-driven detail UI requires type information that only the AI produces.
- **The only user options are: retry or remove.**
- **Re-uploading from scratch (with better photos) is the implicit third path:** Remove → go back to the upload flow → take new photos.

### Retry budget

- **3 total attempts:** initial extraction + 2 retries
- Tracked via `extraction_retry_count` (starts at 0, increments on each retry)
- When count reaches 2, "Try again" button is disabled with copy: "No retries left"
- Each retry resets `extraction_status` to `'queued'` and fires a new `enqueue-extraction` call

### Failure reasons

Set by the webhook or watchdog. Drives user-facing copy:

| `extraction_failure_reason` | User-facing copy |
|---|---|
| `'unreadable_image'` | "Image was too blurry or unclear to identify" |
| `'engine_error'` | "Our AI service encountered an error" |
| `'timeout'` | "Processing took too long — please try again" |
| `'enqueue_failed'` | "Couldn't start processing — please try again" |

### What failed items preserve

Even in a failed state, the row retains:
- All uploaded photos (in Supabase Storage)
- All user-provided metadata (status, value, privacy, tags, showcases)
- The title hint they typed

Nothing is lost except the AI's contribution (which never existed).

---

## 11. Watchdog (server-side stuck-job recovery)

A `pg_cron` job runs every minute. Flips stuck rows to `'failed'` so the user gets actionable UI instead of infinite spinners:

```sql
SELECT cron.schedule(
  'extraction-stuck-watchdog',
  '* * * * *',
  $$
    -- Stuck in 'queued' for >2 minutes (enqueue likely half-failed)
    UPDATE public.collectibles
       SET extraction_status = 'failed',
           extraction_failure_reason = 'enqueue_failed',
           extraction_failed_at = now()
     WHERE extraction_status = 'queued'
       AND updated_at < now() - interval '2 minutes';

    -- Stuck in 'processing' for >10 minutes (webhook never delivered)
    UPDATE public.collectibles
       SET extraction_status = 'failed',
           extraction_failure_reason = 'timeout',
           extraction_failed_at = now()
     WHERE extraction_status = 'processing'
       AND updated_at < now() - interval '10 minutes';
  $$
);
```

Looking Glass typical extraction: 10-30 seconds. A 10-minute threshold for `processing` is generous — anything beyond that is definitively stuck.

---

## 12. Auto-purge (narrow, safe)

A daily `pg_cron` job removes failed items the user hasn't acted on within the grace period:

```sql
SELECT cron.schedule(
  'failed-extraction-purge',
  '0 4 * * *',  -- 04:00 UTC daily
  $$
    DELETE FROM public.collectibles
     WHERE extraction_status = 'failed'
       AND extraction_failed_at < now() - interval '45 days';
  $$
);
```

### Safety properties

- Only deletes `'failed'` rows (no AI metadata to lose — it never existed)
- 45-day grace period (generous)
- User received failure notification at day 0
- Push reminder notification at day 44 (24h before purge)
- Visible countdown in Errors panel during last 7 days ("Will be removed in X days")
- Never touches Review items, never touches published items

### Why this is different from the old sweep

| Old sweep | New auto-purge |
|---|---|
| Ran on app startup | Runs server-side on cron |
| Deleted after 1 hour | Deletes after 45 days |
| Targeted ALL non-complete rows | Targets ONLY failed rows |
| Silent — user never knew | Warned via notification + countdown |
| Could delete rows with real user data | Only deletes rows where AI never contributed |

---

## 13. Acknowledgment indicator system

### Purpose

A small amber dot on published collection cards that signals "AI extracted this; you haven't reviewed it yet." Only visible to the item's owner.

### When it appears

Only on items in the Collection (published) that haven't been acknowledged:

```
showIndicator = isOwner
              && extraction_status === 'complete'
              && published_at IS NOT NULL
              && extraction_acknowledged_at == null
```

### Triggers that clear it

`extraction_acknowledged_at` gets set the first time ANY of these happen:

1. User taps "Done" on the single-lane in-flow review screen
2. User reaches the specs surface on the collectible detail screen
3. User edits any AI-extracted field (title, year, type, classification)

### Guards

```
Only set acknowledged_at if:
  ✓ extraction_status = 'complete'
  ✓ published_at IS NOT NULL
  ✓ owner_id = current_user
  ✓ acknowledged_at IS NULL
```

### Visual

```
┌──────────────────┐
│ ●  ┌──────────┐  │   ← amber dot, top-left, owner-only
│    │  photo   │  │
│    └──────────┘  │
│   Title          │
│   $ — value      │
└──────────────────┘
```

---

## 14. Push notifications

### On successful extraction + auto-publish

- **Single-lane:** *"Your '1986 Topps Canseco RC' is ready"*
- **Batch (auto-publish ON):** Debounced per `batch_uploads.id` — *"Your batch of 12 items is ready"*

Deep-link: Collection → item detail

### On successful extraction + hold-for-review

- **Batch (auto-publish OFF):** *"Your batch of 12 items is ready for review"*

Deep-link: My Queue → Review tab

### On failure

- **Single or batch:** *"We couldn't read your upload — tap to resolve"*

Deep-link: My Queue → Errors tab → focused item

### Pre-purge reminder (24h before auto-purge)

- *"A failed upload from [date] will be removed tomorrow. Tap to retry or remove."*

Deep-link: My Queue → Errors tab → focused item

### Debouncing logic

Single-lane has no `batch_id`; batch items do. For batch notifications:
- Success: send one notification when the last item in the batch flips to `'complete'`
- Failure: send immediately per-item (failures are time-sensitive)

---

## 15. Visibility query helpers

Centralized in `@vitrine/api` so every surface uses the same rules:

```typescript
export function publishedCollectibles(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('collectibles')
    .select('*')
    .eq('user_id', userId)
    .eq('extraction_status', 'complete')
    .not('published_at', 'is', null);
}

export function publicCollectibles(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('collectibles')
    .select('*')
    .eq('user_id', userId)
    .eq('extraction_status', 'complete')
    .not('published_at', 'is', null)
    .eq('privacy', 'public');
}

export function queueReviewItems(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('collectibles')
    .select('*')
    .eq('user_id', userId)
    .eq('extraction_status', 'complete')
    .is('published_at', null);
}

export function queueErrorItems(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('collectibles')
    .select('*')
    .eq('user_id', userId)
    .eq('extraction_status', 'failed');
}
```

---

## 16. Implementation footprint estimate

| Component | LOC | Risk | Notes |
|---|---|---|---|
| Schema migration (all new columns + trigger + indexes + backfill) | ~70 SQL | Low | One migration file |
| Watchdog + auto-purge cron jobs | ~25 SQL | Low | Separate migration |
| Delete sweep code (native) | -50 TS | Low | Pure removal |
| Web batch processor: pre-populate all metadata, remove client auto-commit | ~40 TS | Low | Existing file |
| Web batch processor: add auto-publish toggle | ~30 TS | Low | UI + state |
| Web History: inline actions for failed/held items | ~80 TS | Low | Extend existing pages |
| API query helpers (publishedCollectibles, etc.) | ~40 TS | Low | New file in @vitrine/api |
| Update all existing collection queries to filter on published_at | ~100 TS | Medium | Many call sites (both platforms) |
| My Queue surface (native only) | ~250 TS | Medium | New route + two tabs |
| Acknowledgment indicator on collection card | ~20 TS / platform | Low | Visual only |
| Acknowledgment clear triggers (3 call sites) | ~30 TS / platform | Low | Small |
| Single-lane: merge photos+prefs into one screen | ~200 TS / platform | Medium | New screen layout |
| Single-lane: convert review to optional editor | ~50 TS / platform | Low | Copy changes + remove gate |
| Lane selector | ~80 TS / platform | Low | Plus upgrade modal |
| Push notification wiring (completion + failure + reminder) | ~80 TS | Medium | Edge function or trigger |
| Native batch lane (full feature) | TBD | High | Separate effort, separate design |

---

## 17. Implementation plan: two chunks

Since the web batch uploader is in development only (no public users), we can be aggressive. No staged rollout needed. Two deployable chunks, each leaving the system fully functional.

---

### Chunk A: "Full Web Foundation"

Everything the web batch experience needs to work on the new architecture. Ship and verify together.

1. Schema migration (all columns, trigger, indexes, backfill, crons)
2. Delete sweep code (both functions + startup call in native `_layout.tsx`)
3. Update ALL collection/public queries on both platforms to filter on `published_at IS NOT NULL`
4. Add API query helpers to `@vitrine/api`
5. Rewrite web batch processor (pre-populate all metadata at INSERT, showcase rows at insert, remove client-side auto-commit)
6. Add auto-publish toggle on the batch screen (near "Process Batch")
7. Extend web History pages with inline actions (Retry/Remove for failed, Publish/Discard for held, Publish All for batch)

**End state:** The `/batch` experience is fully operational on the new architecture. Server-side completion works. Toggle works. Failures surface in History with actionable UI. You can test the entire flow end-to-end.

**Estimated effort:** 3-4 sessions.

**Verification:**
- Existing native collection renders identically (backfill ensures all rows have `published_at`)
- Web batch upload with toggle OFF → items auto-publish via trigger → appear in native collection
- Web batch upload with toggle ON → items land with `published_at = NULL` → appear in History as "awaiting review" with Publish button
- Simulate failure (let watchdog timeout) → item shows in History with Try Again / Remove
- Try Again → re-queues extraction → if succeeds, auto-publishes
- Remove → item deleted

---

### Chunk B: "Native Rewrite"

Everything the native app needs for the new upload flow + My Queue.

1. My Queue surface on native (Review + Errors tabs, badge on collection screen)
2. Lane selector screen
3. Merged photos+preferences capture screen (Option A)
4. Non-blocking theater (dismiss-friendly)
5. Optional in-flow review reframed as editor (sets `acknowledged_at`)
6. Amber dot acknowledgment indicator + clear triggers (both platforms)
7. Push notifications (completion, failure, pre-purge reminder)
8. Delete old upload flow code

**End state:** Native upload is the new merged-capture flow. My Queue shows all unresolved items (from web uploads AND native uploads). Notifications work. Amber dot works.

**Estimated effort:** 3-5 sessions.

**Verification:**
- Single-lane: photos + preferences → "Catalog Item" → server-side publish → appears in Collection with amber dot
- Single-lane: close app after upload → item still publishes → notification arrives
- Single-lane: stay in app → optional review → Done → amber dot clears
- My Queue shows held-for-review items from web batch (uploaded in Chunk A with toggle ON)
- My Queue shows failed items from either platform
- Lane selector shows Batch disabled with Pro badge for free users
- Amber dot clears when viewing specs tab or editing AI fields
- Push notifications fire correctly for all scenarios

---

### Future: Native batch lane (separate effort)

Requires its own UX design pass (theater visualization, photo-source, rapid-fire camera). Architectural backbone is Chunk A. Becomes trivially additive once Chunks A + B are done.

---

## 18. Open questions / deferred decisions

### Native batch photo source

Camera rapid-fire vs. library picker vs. both. Audience hypothesis worth exploring but not blocking.

### Background photo uploads (long-term stretch)

iOS `NSURLSession` background uploads via `expo-task-manager` would let users close the app during photo upload itself. Not in scope for first pass. UX for now: "keep the app open while photos upload" (5-15s single, 30-90s batch).

### Server-side tier enforcement

`enqueue-extraction` currently hardcodes `user_tier: "free"`. When RevenueCat is wired, enforce per-tier batch quotas server-side (reject if free user enqueues a batch). Client-side gating alone is bypassable.

### Auto-purge timeout tuning

Starting at 45 days. May adjust based on real user behavior data post-launch.

### Activity feed timing

"X added an item" notification to followers should fire when `published_at` transitions from NULL to a value, not at row insert. Verify this fires correctly for both auto-publish and manual-publish paths.

---

## 19. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-19 | Server-side completion via DB trigger (replaces client auto-commit) | Only way to support "close the app and walk away" for mobile batch |
| 2026-05-19 | Single-lane uses Option A (merge photos+prefs into one screen) | Fewer screens, preserved review moment, unification with batch's card pattern |
| 2026-05-19 | `published_at` column as publish gate (not a draft privacy state) | Privacy and workflow state are orthogonal; conflating them loses the ability to express "complete + private" |
| 2026-05-19 | Three-value privacy stays (public/followers/private) — no "draft" state added | `published_at = NULL` covers the draft concept without overloading `privacy` |
| 2026-05-19 | Failed items: retry (x2) or remove ONLY — no manual entry | Without extraction, there's no type schema to present for manual input |
| 2026-05-19 | "My Queue" with Review + Errors tabs (native only) | Review = user-intentional hold; Errors = AI failure. Different causes, different remedies, one surface |
| 2026-05-19 | Web batch surface: no My Queue route — History gains inline actions instead | Web is a companion upload tool, not a full app; History already shows batch items |
| 2026-05-19 | My Queue always visible (greyed out when empty, colored+badge when non-empty) | Discoverability for Pro features; doesn't clutter when empty |
| 2026-05-19 | Review tab lands first by default | User's intentional action takes priority; Errors always accessible one tap away |
| 2026-05-19 | Both tabs show empty states (never hidden) | Consistent UI; user always knows both surfaces exist |
| 2026-05-19 | Native My Queue shows ALL unresolved items regardless of upload origin (web or native) | Native app is the core experience layer; web is a companion |
| 2026-05-19 | Batch auto-publish toggle near "Process Batch" button | Session-shaping decision, not a per-card default; needs prominent placement |
| 2026-05-19 | Single-lane has no auto-publish toggle (always auto-publishes) | Single-lane has in-flow review screen; adding toggle would create two redundant review paths |
| 2026-05-19 | Old sweep deleted entirely (no transitional phase needed) | DB confirmed zero in-flight rows in sweepable states; development environment only |
| 2026-05-19 | Auto-purge: 45 days, Errors only, 24h push reminder, 7-day visible countdown | Long enough to be patient; short enough to not rot; warned honestly |
| 2026-05-19 | Review items never auto-purge | User chose to hold them; they're complete with full metadata |
| 2026-05-19 | Retry budget: 2 retries (3 total attempts) | Generous enough for transient failures; bounded enough to not waste AI resources |
| 2026-05-19 | `extraction_acknowledged_at` as timestamp (not boolean) | Future-proofs for "when did they acknowledge" queries and aging-out |
| 2026-05-19 | Specs-surface view + AI field edit as acknowledgment triggers | Specs is where AI output lives; editing is the strongest signal |
| 2026-05-19 | Notifications deep-link to My Queue tabs (Review or Errors) based on context | Reduces navigation friction from notification to resolution |
| 2026-05-19 | No visible collectibles without metadata allowed in public surfaces | Core product philosophy: Collection is always pristine |

---

## 20. Out of scope for this document

- The web standalone `/batch` surface chrome (top bar, routing) is already built and unaffected.
- Marketing landing page, sign-in, complete-profile, and the `WEB_FULL_EXPERIENCE` flag work are unrelated.
- RevenueCat subscription integration is a separate effort.
- The native batch lane's full UX design is deferred to its own session.
- Comps algorithm, trading cards deprecation, and other unrelated features continue independently.

---

## 21. How to use this document

When implementation mode opens for this work:

1. Re-read sections 3-4 (architecture + schema) for the full picture.
2. Follow the phased plan in section 17 sequentially.
3. Use sections 9-12 (My Queue, failure handling, watchdog, auto-purge) as the spec for Phase 3.
4. Use section 7 (single-lane Option A) as the spec for Phase 4.
5. Reference section 15 (query helpers) when updating collection queries in Phase 1.
6. Each phase should be verifiable independently before moving to the next.
