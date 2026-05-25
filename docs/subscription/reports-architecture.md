# Reports Architecture (VAR / AAR / Market Pulse)

> **Status**: Decisions locked (2026-05-14). Schema not yet implemented.
> **Pillar of**: `subscription-implementation.md`
> **Related**: `pricing-model.md` (caps + access), `cap-counter-architecture.md` (generation cap predicate)

## What this covers

Data model + access patterns for the three AI-generated reports:

- **VAR** — Visual Authenticity Report (one-time per collectible, doesn't expire)
- **AAR** — Asset Authenticity Report (one-time per collectible, doesn't expire)
- **Market Pulse** — pricing snapshot + trend narrative (expires; regenerable)

Does not cover: cap counting (see `cap-counter-architecture.md`), report content generation pipeline (Inngest / Edge Function), prompt engineering.

## Decisions (locked)

### 1. Single table, not three

One `collectible_reports` table with a `report_type` enum.

**Why:** all three share 90% of their fields (collectible_id, generated_by, generated_at, content). Adding a new report type later (e.g., GradedSlabReport) becomes a one-line enum addition + RLS clause, not a schema migration. Cross-cutting queries ("what's the latest activity for this collectible?") are one query.

**Why not three tables:** the only meaningful divergence is `expires_at` semantics — Pulse expires, VAR/AAR don't — which is trivially handled by a nullable column. Three tables would multiply the query surface for no payoff.

### 2. Append-only, latest wins

Reports are **never updated in place**. Regenerating a Pulse report inserts a new row; the old row stays.

**Why:** preserves history (price-trend-over-time graphs come for free), avoids race conditions on regenerate, makes cache invalidation deterministic, audit trail comes for free.

**Querying "the current report":**

```sql
SELECT DISTINCT ON (collectible_id, report_type) *
FROM collectible_reports
WHERE collectible_id = $1 AND report_type = $2
ORDER BY collectible_id, report_type, generated_at DESC;
```

Index on `(collectible_id, report_type, generated_at DESC)` makes this O(1).

### 3. Staleness handling — Option B (time-based + user-triggered refresh)

Pulse reports expire 14 days after generation. Stale reports are **still visible** with a "Refresh available" badge in the UI; users initiate regeneration explicitly. No automatic background regeneration.

**Why:**
- Predictable user-facing UX (no surprise "your data just changed")
- No wasted compute regenerating reports nobody's looking at
- Falls under the user's own monthly Pulse cap (intentional — refresh = generate)
- Works for both VAR/AAR (`expires_at IS NULL`, never stale) and Pulse (`expires_at = generated_at + 14 days`)

### 4. Pulse regeneration — Option C (cold AI + deterministic deltas)

When a user refreshes a Pulse report, we make a **fresh AI call from current market data** (no priming with prior report). Deltas (e.g., "+$23 in 14 days", "+12% this month") are computed in app code from the new vs. old `content` JSONB, not asked for from the AI.

**Why:**
- No hallucinated deltas — math comes from real previous data
- AI focuses on what it's good at (narrative, context, comp interpretation)
- App code has full control of delta visualization (sparklines, percent badges, color logic)
- Deterministic = testable; AI-generated deltas are not

**Implementation note:** the regeneration Edge Function reads the previous report's `content.market_value` (or equivalent), generates the new report with no priming, then computes the delta object on the way out and attaches it to the new row's `content.delta` field. The delta references the previous `report.id` so the chain is reconstructable.

## Schema sketch

```sql
CREATE TYPE report_type AS ENUM ('var', 'aar', 'market_pulse');

CREATE TABLE collectible_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collectible_id UUID NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,

  -- generation metadata
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- NULL for VAR/AAR; populated for Market Pulse

  -- payload
  content JSONB NOT NULL,
  -- e.g., for market_pulse:
  -- {
  --   "market_value": { "low": 45, "median": 62, "high": 78, "currency": "USD" },
  --   "narrative": "...",
  --   "comps": [...],
  --   "delta": {
  --     "from_report_id": "uuid",
  --     "absolute": 23,
  --     "percent": 0.12,
  --     "window_days": 14
  --   }
  -- }

  -- model attribution (for cost reconciliation + debug)
  model_version TEXT NOT NULL,  -- e.g. "gemini-2.5-flash-2026-04"
  prompt_version TEXT NOT NULL,  -- e.g. "pulse-v3"
  generation_ms INT,
  generation_cost_cents INT,

  CONSTRAINT chk_expires_only_pulse CHECK (
    (report_type = 'market_pulse') OR (expires_at IS NULL)
  )
);

CREATE INDEX idx_reports_lookup
  ON collectible_reports (collectible_id, report_type, generated_at DESC);

CREATE INDEX idx_reports_user_history
  ON collectible_reports (generated_by, generated_at DESC);

CREATE INDEX idx_reports_pulse_expiry
  ON collectible_reports (expires_at)
  WHERE expires_at IS NOT NULL;
```

## Access rules (RLS sketch)

Three layers of policy:

```sql
-- 1. Free users: zero access. Period.
CREATE POLICY "free_users_no_access"
  ON collectible_reports FOR SELECT
  USING (
    (SELECT tier FROM users WHERE id = auth.uid()) IN ('pro', 'collector')
  );

-- 2. Pro+ users: can view all reports (community-shared).
-- Same SELECT policy as above covers this — no additional clause.

-- 3. Pro+ users: can insert reports they generate.
CREATE POLICY "pro_users_can_generate"
  ON collectible_reports FOR INSERT
  WITH CHECK (
    generated_by = auth.uid()
    AND (SELECT tier FROM users WHERE id = auth.uid()) IN ('pro', 'collector')
    -- cap predicate is enforced by check_user_cap() in the Edge Function,
    -- not RLS; RLS only enforces tier eligibility
  );

-- 4. Reports are never UPDATEd or DELETEd by users.
-- (No update/delete policy = denied by default.)
```

**Note:** the cap predicate (monthly + daily generation limits) does NOT live in RLS. It lives in the Edge Function that fronts the generation request. RLS is for tier eligibility only; caps are for rate limiting. Mixing them creates ugly RLS clauses that break under grace-period / bulk-mode multipliers.

## Visibility rules (app layer)

| User tier | View existing report | Generate new report |
|---|---|---|
| Free | ❌ Locked (paywall surface) | ❌ Locked |
| Pro | ✅ All reports, all collectibles | ✅ Cap-limited |
| Collector | ✅ All reports, all collectibles | ✅ Higher cap |

UI implications:
- Report-detail screens show a paywall block for Free users instead of the report content
- The "View Report" CTA on collectible detail surfaces differently per tier (Free → "Upgrade to view"; Pro+ → "View Report" or "Generate Report" depending on whether one exists)
- Reports table is queried with the user's tier in mind — no Free-tier client ever fetches a row from this table; it just renders the paywall

## Generation pipeline (handoff to Inngest)

Out of scope for this doc, but documented here for completeness:

1. User taps "Generate Report" → Edge Function `request-report` validates tier + cap
2. Edge Function enqueues an Inngest event with `{ collectible_id, user_id, report_type }`
3. Inngest function pulls comps, builds prompt, calls Gemini, validates schema
4. On success, inserts into `collectible_reports` with `content`, `generation_cost_cents`, etc.
5. Inngest sends a push notification to the user when the report is ready
6. Native client polls / receives push → opens the report

The cap predicate is checked in step 1 (before enqueuing). If a generation fails partway through Inngest, no row is inserted and **no scan-cap was charged**. This is symmetric with the scan-cap design in `cap-counter-architecture.md`.

## Open questions

- **Should we expose `model_version` / `prompt_version` to the user?** Decision: not at v1. Internal-only for cost reconciliation.
- **Should we let the user delete reports they generated?** Decision: no at v1. Append-only is a feature; if a user wants the "old report" gone they can regenerate (Pulse) or live with it (VAR/AAR). Soft-delete column reserved for future moderation.
- **What happens when a collectible is deleted?** Decision: cascade delete reports (`ON DELETE CASCADE` in schema sketch). Reports without a parent collectible are orphans; we never preserve them.
- **Pulse expiry window — 14 days the right number?** Tentatively yes. Long enough that casual users don't see "stale" badges immediately; short enough that prices stay roughly current. Re-evaluate post-launch with telemetry.
- **AAR vs VAR — are they actually two different report types or should they be one with a sub-type?** Pricing model treats them as distinct caps. Schema enum currently treats them as distinct. Revisit if/when the actual report content overlaps significantly.

## Decisions changelog

- **2026-05-14** — Initial design locked: single table, append-only, time-based staleness with user-triggered refresh, cold AI + deterministic deltas for Pulse regen.
