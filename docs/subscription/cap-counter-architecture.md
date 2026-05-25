# Cap Counter Architecture

> **Status**: Structural decisions locked (2026-05-14). Cap *numbers* still want empirical calibration against `extraction_costs` data before final lock for launch.
> **Pillar of**: `subscription-implementation.md`
> **Related**: `pricing-model.md` (the cap numbers), `reports-architecture.md` (where reports get counted), `bulk-uploader-architecture.md` (the async path and its tier gate)

## What this covers

How we count what users do (scans, report generations) and decide whether to allow the next action. The single source of truth for:

- Where the count lives (which table)
- When it gets charged (button press? success? on review?)
- What window it counts over
- How tier + grace compose into an effective cap
- Where the predicate is evaluated (RLS, Edge Function, client UI)

Does not cover: which features are gated (see `tier-gating-implementation.md`), the cap *numbers* themselves (see `pricing-model.md`), the report data model (see `reports-architecture.md`), or the bulk-uploader queue lifecycle (see `bulk-uploader-architecture.md`).

## Decisions (locked)

### 1. Compute-on-read, not materialized counters

When a cap check is needed, count rows in the source-of-truth tables in real time. **No** dedicated `monthly_usage` counter table.

**Why:**
- Append-only event tables make this fast (indexed scans on `(user_id, created_at)` are cheap)
- Eliminates an entire class of bugs around counter drift, transaction-isolation race conditions, idempotency
- One source of truth — no "the counter says 5 but I see 6 rows" debugging
- At our scale (10K-100K users at launch), Postgres handles `COUNT(*) WHERE user_id = $1 AND created_at > date_trunc('month', NOW())` in microseconds with the right index

We may revisit if/when a single user's monthly event count exceeds ~50K rows, but at that point we have other problems.

### 2. Monthly-only primary caps; sliding window for fair-use

| Cap type | Window | Rationale |
|---|---|---|
| Monthly scans | Calendar month (1st of month UTC) | Aligns with billing cycle; predictable; one number to display |
| Monthly report generations | Calendar month (1st of month UTC) | Same |
| Fair-use rate limit | Sliding 60-second window | Anti-burst protection, never user-facing |

**No daily caps anywhere.** Earlier proposals included daily sub-caps; dropped 2026-05-14 in favor of a single monthly number per cap dimension. UX rationale: one number is dramatically clearer than "30 today + 500 this month." Economic rationale: the sliding 60-second rate limit handles abuse; the monthly cap handles unit economics; the daily cap was always more about feel than necessity.

The fair-use rate limit is a separate predicate from the monthly cap — it never interacts with grace state and is generic across all tiers.

### 3. Unified single-cap model — one scan is one scan

**Live and bulk extractions count against the same monthly cap.** A scan is a scan from the user's perspective; the backend cost asymmetry between sync (`extract-asset`) and async (`/queue-batch` via Gemini Batch API) is not exposed to the user.

| Action | Counts toward | Notes |
|---|---|---|
| Live scan (sync) | `scan` cap | User taps Identify, sees review screen |
| Bulk scan (async) | `scan` cap | One row per successfully completed batch item |

The cost discount on bulk (~62% via Batch API + prompt cache) is captured as margin to us, not priced through to the user.

We **do** keep an `is_bulk` flag on `extraction_events` for analytics and cost attribution, but the cap predicate does not read it.

### 4. Source-of-truth tables

| Cap | Source table | Counter logic |
|---|---|---|
| Monthly scans (live + bulk combined) | `extraction_events` | `COUNT(*) WHERE user_id = $1 AND succeeded_at > date_trunc('month', NOW())` |
| Monthly report generations | `collectible_reports` | `COUNT(*) WHERE generated_by = $1 AND generated_at > date_trunc('month', NOW())` |

**Reports are a single combined cap pool.** VAR + AAR + Market Pulse all count toward one monthly number. No per-type subdivision. The `report_type` column stays on `collectible_reports` for rendering and analytics, but is not used by the cap predicate.

**Reports already have a source-of-truth table** (per `reports-architecture.md`). No new table needed for report cap counting.

**Scans don't.** Drafts get swept periodically, so `collectibles` is not a reliable source. We need a separate, append-only event log.

### 5. `extraction_events` log — accounting for scan caps

```sql
CREATE TABLE extraction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- when the user got the result (for live) OR
  -- when the per-item completion arrived from the engine (for bulk)
  succeeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- which collectible this extraction produced (nullable —
  -- if the user discards on review, the collectible can be deleted
  -- but the event stays for cap accounting)
  collectible_id UUID REFERENCES collectibles(id) ON DELETE SET NULL,

  -- ANALYTICS ONLY — the cap predicate does NOT read this column.
  -- Useful for cost attribution and behavioral analysis (live vs bulk mix per user).
  is_bulk BOOLEAN NOT NULL DEFAULT FALSE,

  -- For bulk: the parent batch id (links back to the user-submitted batch).
  -- For live: NULL.
  batch_id UUID,

  -- For cost reconciliation + debug
  model_version TEXT NOT NULL,
  extraction_cost_cents INT,

  CONSTRAINT chk_succeeded_at_recent
    CHECK (succeeded_at > '2026-01-01'::TIMESTAMPTZ)
);

CREATE INDEX idx_extraction_user_recent
  ON extraction_events (user_id, succeeded_at DESC);

CREATE INDEX idx_extraction_user_batch
  ON extraction_events (user_id, batch_id)
  WHERE batch_id IS NOT NULL;
```

**When a row is inserted (live):** when the user reaches the review screen (extraction returned successfully). Not on identify-button press (could fail), not on save (would let users repeatedly identify and discard for free).

**When a row is inserted (bulk):** when the per-item callback arrives from the engine for a successful extraction. Failed items in the batch produce no row (cap not charged for failures).

**When a row is NOT inserted (either path):** identify-button press, network failure, AI extraction failure, user backing out before review. **The user is never charged for failures.** This is intentional — failures are our problem, not theirs.

**`collectible_id ON DELETE SET NULL`:** if the user reaches review, gets a collectible draft, then later their drafts get swept by the cleanup job, the event row stays. The cap was already charged; we don't refund it. (This is "scan succeeded" cap, not "saved-collectible" cap.)

### 6. Grace = "treat as Pro tier for cap purposes"

**During the 30-day grace window, a Free user's caps are computed using the Pro tier row.** No multiplier, no separate config — just tier substitution at predicate evaluation time.

```sql
-- inside check_user_cap()
v_effective_tier := CASE
  WHEN v_tier = 'free' AND v_grace_active THEN 'pro'
  ELSE v_tier
END;
-- ... then look up cap_config row by (effective_tier, action)
```

**Important: this is caps-only.** A Free user in grace gets Pro's *cap numbers* but does **not** get Pro's other features (no AI report viewing, no AI report generation, no auto/managed showcases). RLS policies and feature gates always read the *raw* `users.tier` column, never the effective tier. The substitution lives only inside the cap predicate.

**One exception, locked separately:** the bulk uploader's gate (see § 11) reuses the `effective_tier` substitution, so Free users in grace gain bulk access during their grace window. This is intentional — bulk is the natural back-catalog import path during onboarding. The substitution there is still about a cap-style entitlement (can-this-user-queue-a-batch), not about feature unlocks like reports.

**Why tier substitution beats a multiplier:**
- No `grace_multiplier` column to maintain — Pro caps are the source of truth, grace just points at them
- If we change Pro caps, grace caps automatically follow (one source of truth)
- Marketing framing is great: "Pro upload limits, free for your first 30 days"

### 7. Three-layer enforcement

| Layer | Purpose | Where |
|---|---|---|
| **RLS policy** | Tier eligibility (e.g., "Free users cannot view reports") — uses raw `users.tier`, never effective | Postgres |
| **Cap predicate (Edge Function / RPC)** | Monthly count + grace tier substitution + sliding rate limit — uses effective tier | Postgres function called from Edge Function |
| **Bulk gating predicate** | Whether this user can submit a bulk batch — uses effective tier (so Free in grace can use bulk) | Postgres function |
| **Client UI** | Friendly preview ("417 / 500 this month") + paywall surfaces | Native + web app |

The cap predicate is **not** in RLS. RLS handles "are you allowed to see this row" (binary, simple). Cap predicate handles "should we let this action through right now" (multi-input, contextual). Mixing them produces RLS policies that no one can read.

The client UI is **not authoritative**. It's a hint. The user can spoof a request and the Edge Function still rejects it. Client-side enforcement is only for "don't show the button if it's going to fail" UX courtesy.

### 8. The Postgres predicate function

```sql
CREATE OR REPLACE FUNCTION check_user_cap(
  p_user_id UUID,
  p_action TEXT  -- 'scan' | 'report'
) RETURNS TABLE (
  allowed BOOLEAN,
  used_this_month INT,
  monthly_cap INT,           -- NULL if action has no cap for this tier (Free has no 'report' row)
  effective_tier TEXT,       -- the tier used for cap lookup (pro for free-in-grace)
  reason TEXT
) AS $$
DECLARE
  v_tier TEXT;
  v_grace_active BOOLEAN;
  v_effective_tier TEXT;
  v_used_month INT;
BEGIN
  -- 1. Load user state
  SELECT tier, (grace_period_ends_at > NOW())
    INTO v_tier, v_grace_active
    FROM users WHERE id = p_user_id;

  -- 2. Determine effective tier for cap purposes (grace = treat as pro)
  v_effective_tier := CASE
    WHEN v_tier = 'free' AND v_grace_active THEN 'pro'
    ELSE v_tier
  END;

  -- 3. Look up cap for (effective_tier, action). NULL means not entitled.
  SELECT cc.monthly_cap
    INTO monthly_cap
    FROM cap_config cc
    WHERE cc.tier = v_effective_tier AND cc.action = p_action;

  effective_tier := v_effective_tier;

  -- If no row, this tier has no entitlement to this action (e.g., free + report)
  IF monthly_cap IS NULL THEN
    allowed := FALSE;
    used_this_month := 0;
    reason := 'tier_not_entitled';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 4. Count current usage from source-of-truth tables
  IF p_action = 'scan' THEN
    SELECT COUNT(*) INTO v_used_month
      FROM extraction_events
      WHERE user_id = p_user_id
        AND succeeded_at > date_trunc('month', NOW());
  ELSIF p_action = 'report' THEN
    SELECT COUNT(*) INTO v_used_month
      FROM collectible_reports
      WHERE generated_by = p_user_id
        AND generated_at > date_trunc('month', NOW());
  END IF;

  used_this_month := v_used_month;

  -- 5. Decide
  IF v_used_month >= monthly_cap THEN
    allowed := FALSE;
    reason  := 'monthly_cap_exceeded';
  ELSE
    allowed := TRUE;
    reason  := NULL;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;
```

The function is `STABLE` (no writes), uses Postgres' standard `date_trunc` for the calendar window, and returns enough information for the client UI to show "X / Y this month" without a separate query.

### 9. `cap_config` table — caps live in DB, not code

```sql
CREATE TABLE cap_config (
  tier TEXT NOT NULL,           -- 'free' | 'pro' | 'collector'
  action TEXT NOT NULL,         -- 'scan' | 'report'
  monthly_cap INT NOT NULL,
  PRIMARY KEY (tier, action)
);
```

**Note on what's NOT in this schema:** no `daily_cap`, no `grace_multiplier`, no `bulk_multiplier`. Daily caps are dropped entirely. Grace works via tier substitution. Bulk is unified into the single `scan` cap.

**Note on absent rows = not entitled:** the absence of a `(free, 'report')` row is how we encode "Free users cannot generate reports." The predicate returns `tier_not_entitled` when no row exists. This is cleaner than a `monthly_cap = 0` row.

Initial seed (subject to empirical calibration; `pricing-model.md` is the authoritative source for these numbers):

```sql
INSERT INTO cap_config (tier, action, monthly_cap) VALUES
  -- Scans (live + bulk combined)
  ('free',      'scan',    100),
  ('pro',       'scan',    500),
  ('collector', 'scan',   1000),

  -- Reports (Pro+ only; no Free row by design = not entitled)
  ('pro',       'report',   30),
  ('collector', 'report',  150);
```

Realized numbers for a Free user under the grace tier-substitution model:

| State | Monthly scans | Monthly reports | Bulk uploader |
|---|---|---|---|
| Free, in grace | **500 (Pro)** | not entitled (caps-only substitution) | **yes** (bulk gate uses effective_tier) |
| Free, post-grace | 100 | not entitled | no |

Marketing message: *"Pro upload limits, free for your first 30 days."*

**Why a config table:**
- Caps can be tuned without a deploy
- A/B tests on cap numbers become a row update
- An admin page can surface and edit them
- Migration to per-user overrides (`cap_overrides` table) becomes additive

### 10. 30-day grace period

A `grace_period_ends_at TIMESTAMPTZ` column on `users`.

**For new signups:** set on insert in the auth-trigger:

```sql
NEW.grace_period_ends_at := NOW() + INTERVAL '30 days';
```

**For existing users at launch:** one-time migration:

```sql
UPDATE users SET grace_period_ends_at = NOW() + INTERVAL '30 days'
WHERE grace_period_ends_at IS NULL;
```

This intentionally gives every existing user a 30-day "fresh start" window — fair, since they didn't have caps before launch.

`grace_active = (grace_period_ends_at > NOW())`. Once expired, `grace_period_ends_at` stays in the past forever (no clearing) and the predicate stops applying the substitution.

Grace applies **only to Free users**. Pro and Collector users have headroom built into their base caps and don't need it. The substitution rule (`free + in_grace → pro`) doesn't apply to non-free tiers because there's no higher tier to substitute to.

### 11. Bulk uploader — Pro+ only with grace exception

The full bulk-uploader architecture lives in `bulk-uploader-architecture.md`. The cap-side touchpoints:

- **Web-only feature.** Native app does not have a bulk path.
- **Pro+ tier gate, with grace exception.** The gate uses the same `effective_tier` substitution as the cap predicate, so Free users in grace gain bulk access during their 30-day window.
- **Single cap, no special bulk dimension.** Bulk submissions count against the same `scan` cap as live scans.
- **Per-batch ceiling: 200 items.** Operational max (upload payload, draft inventory, batch-API limits). Not a cap-math knob.
- **Effective batch ceiling for the user:** `min(200, monthly_scan_remaining)`. If a user has 50 scans remaining this month, they can upload at most 50 items in this batch.
- **Cap charged at successful per-item completion.** `extraction_events` row inserted per successful item; failed items in the batch produce no row.
- **Cancelled-before-processing batches:** any items not yet started are not charged. Items already processed by Gemini are charged regardless.

Bulk gate predicate:

```sql
CREATE OR REPLACE FUNCTION can_use_bulk(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_grace_active BOOLEAN;
  v_effective_tier TEXT;
BEGIN
  SELECT tier, (grace_period_ends_at > NOW())
    INTO v_tier, v_grace_active
    FROM users WHERE id = p_user_id;

  v_effective_tier := CASE
    WHEN v_tier = 'free' AND v_grace_active THEN 'pro'
    ELSE v_tier
  END;

  RETURN v_effective_tier IN ('pro', 'collector');
END;
$$ LANGUAGE plpgsql STABLE;
```

### 12. Failure refund semantics (live + bulk)

Cap is only charged when extraction succeeds. Concretely:

- **Live scan extracted, user discards on review:** event row exists, cap charged. (User saw the work; we paid for it.)
- **Live scan API failure:** no event row, cap not charged.
- **Bulk batch with 200 items, 195 succeed, 5 Gemini errors:** 195 event rows inserted, 5 not. Cap charged for 195.
- **Bulk batch cancelled before Gemini starts:** no event rows, cap not charged.
- **Bulk batch cancelled mid-processing (where Gemini supports it):** event rows for already-completed items, no rows for items not yet processed.

The "cap reflects work the engine actually did" rule keeps the math honest and matches user expectations.

## Closed questions

- **Grace expiry behavior (locked 2026-05-14).** Hard cliff on caps and bulk gate at day 31. No taper. Exception: in-flight bulk batches already accepted by the engine before grace expired are honored — the gate check happens at submit time, not completion time. Once accepted, the engine processes normally and the app records events.
- **Cap "used" UI display (locked 2026-05-14).** Contextual switching: 100+ remaining → "X / Y this month" (progress-bar framing); under 100 remaining → "N left this month" (countdown framing). For reports (cap 30 or 150), threshold switches at under 10 remaining. Details in `paywall-ux.md`.
- **Rate-limit specifics (deferred 2026-05-14).** Concept is locked (sliding 60s window, anti-abuse, invisible to normal users). Actual threshold, per-action vs global, and implementation deferred until post-launch telemetry shows where real abuse appears. Not a launch blocker.

## Open questions

- **Final cap numbers.** The seed values above are the locked product proposal but not yet validated against engine telemetry. Empirical calibration against `extraction_costs` table (median + p95 cost per stage) before launch is recommended; not a blocker.
- **Per-user overrides.** Power users / partners may need bumped caps. Reserve a `cap_overrides (user_id, action, monthly_cap)` table; build when first use case appears, not before.
- **Enterprise / dealer tier.** A small cohort of professional dealers will exceed Collector's 1000/mo cap. Out of scope for v1; deferred to marketplace era.

## Decisions changelog

- **2026-05-14** — Initial design locked: compute-on-read, calendar windows, three-layer enforcement, separate `extraction_events` log, orthogonal grace × bulk multipliers, caps in DB config table.
- **2026-05-14** — Bulk uploader confirmed universally accessible (Free + Pro + Collector). No tier gate. *(superseded by 2026-05-14 unification — see below.)*
- **2026-05-14** — Refactored to two-cap model. Bulk and live independent dimensions in `cap_config` (action namespace `scan.live` / `scan.bulk`). Per-batch max 200 items. *(superseded by 2026-05-14 unification — see below.)*
- **2026-05-14** — Refactored grace to tier-substitution. `grace_multiplier` column dropped from schema. Free users in grace get the Pro `cap_config` row at predicate evaluation time. Substitution is caps-only. Marketing framing: "Pro upload limits, free for your first 30 days."
- **2026-05-14** — **Unified single-cap model locked.** Reverted the live-vs-bulk split. One scan is one scan, regardless of path. Bulk discount captured as margin, not priced through. Action namespace simplified to `scan` and `report`. `is_bulk` column kept on `extraction_events` for analytics only — cap predicate does not read it.
- **2026-05-14** — **Daily caps removed across the board.** Scans and reports both monthly-only. UX rationale: one number per cap dimension is dramatically clearer. Abuse protection moves entirely to the sliding 60-second rate limit. `daily_cap` column dropped from `cap_config` schema.
- **2026-05-14** — **Reports collapsed to single combined cap.** VAR/AAR/Market Pulse share one monthly pool per tier. `report_type` column on `collectible_reports` retained for rendering and analytics, not for cap accounting. Action namespace shrinks from `report.var` / `report.aar` / `report.pulse` to just `report`.
- **2026-05-14** — **Bulk uploader flipped to Pro+ only with grace exception.** Free users in grace gain bulk access via `effective_tier` substitution; Free users post-grace lose bulk access. Bulk becomes a Pro upsell lever; grace becomes a 30-day Pro-caps trial including bulk import.
- **2026-05-14** — **Cap numbers locked at:** Free 100/mo scans (no reports). Pro 500/mo scans + 30/mo reports. Collector 1000/mo scans + 150/mo reports. Free in grace = Pro caps (500/mo scans, bulk access, no report entitlement). Subject to empirical calibration before launch but considered the product baseline.
