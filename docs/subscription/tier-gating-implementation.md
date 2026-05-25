# Tier Gating Implementation

> **Status**: v1 gate set locked (2026-05-14). Implementation details (component placement, exact copy) deferred to build phase.
> **Pillar of**: `subscription-implementation.md`
> **Related**: `pricing-model.md` (what's gated by tier), `cap-counter-architecture.md` (how the cap predicate works), `paywall-ux.md` (UI side of gates)

## What this covers

The bridge between the **abstract** tier system (Free / Pro / Collector + unified monthly caps + grace) and the **concrete** features in the app. For each gated feature:

- Where the check fires (button handler, RLS, Edge Function)
- What the predicate evaluates
- What the user sees on block
- Telemetry hook for analytics

Does not cover: cap predicate internals (see `cap-counter-architecture.md`), paywall surfaces themselves (see `paywall-ux.md`).

## Decisions (locked)

- **Single predicate function for cap-based gates.** `check_user_cap(user_id, action)` — returns allowed/denied + usage info. Used by both Edge Functions and the client UI mirror.
- **Binary tier checks for feature gates.** Features that aren't cap-counted (managed showcases, data export, bulk access) use a simple `tier IN ('pro', 'collector')` check, with the `effective_tier` substitution for grace where specified.
- **Server is authoritative.** Client-side checks are UX hints (don't show the button if it's known-blocked). The Edge Function / RLS rejects the actual call regardless.
- **Telemetry on every cap-hit and tier-mismatch.** Every block fires an analytics event with `{ user_id, tier, action, reason, used, cap }`. Drives upgrade-intent analysis.
- **Caps are tunable without deploys.** `cap_config` table is the single source of truth for numbers. A row update changes behavior immediately.

## v1 Gate Set (launch)

### 1. Scans (live + bulk combined)

- **Type:** Cap-based (monthly)
- **Predicate:** `check_user_cap(user_id, 'scan')`
- **Where:** Edge Function fronting the extraction call (live); webhook handler processing batch callbacks (bulk)
- **Client mirror:** upload-entry component shows "X / Y this month" or "N left this month"
- **Grace behavior:** Free in grace uses Pro's cap row (500/mo) via effective_tier substitution
- **On block:** cap-hit paywall surface → "Upgrade to Pro for 500 scans/month" or "Resets on [date]"
- **Telemetry:** `cap_hit { action: 'scan', tier, used, cap, effective_tier }`

### 2. Report viewing

- **Type:** Binary tier check (RLS)
- **Predicate:** `users.tier IN ('pro', 'collector') OR (users.tier = 'free' AND users.grace_period_ends_at > NOW())`
- **Where:** RLS policy on `collectible_reports` SELECT
- **Grace behavior:** Free in grace CAN view reports. Free post-grace cannot.
- **On block:** Report-detail screen shows paywall block instead of content. CTA: "Upgrade to view AI reports"
- **Telemetry:** `feature_lock { action: 'report_view', tier }`

### 3. Report generation

- **Type:** Cap-based (monthly) + tier eligibility
- **Predicate:** `check_user_cap(user_id, 'report')` — returns `tier_not_entitled` for Free (even in grace, because no `(free, 'report')` row exists in `cap_config` and grace substitution does NOT apply to report generation)
- **Where:** Edge Function `request-report` checks before enqueuing Inngest job
- **Grace behavior:** NO exception. Free users in grace cannot generate reports. Generation is the upsell; viewing is the taste.
- **On block:** cap-hit modal with "X / 30 generated this month" OR "Upgrade to Pro to generate reports"
- **Telemetry:** `cap_hit { action: 'report', tier, used, cap }` or `feature_lock { action: 'report_gen', tier }`

### 4. Managed / auto showcases

- **Type:** Binary tier check
- **Predicate:** `users.tier IN ('pro', 'collector')`
- **Where:** Native button handler for "Auto-organize" + Edge Function for any auto-showcase generation
- **Grace behavior:** NO exception. This is a feature gate, not a cap. Grace only substitutes for caps and bulk access.
- **On block:** Feature-lock paywall surface. CTA: "Upgrade to Pro for AI-powered showcases"
- **Telemetry:** `feature_lock { action: 'auto_showcase', tier }`

### 5. Bulk uploader

- **Type:** Binary tier check with grace exception
- **Predicate:** `can_use_bulk(user_id)` — uses effective_tier substitution (Free + in_grace → 'pro' → allowed)
- **Where:** Web client UI gates the bulk uploader entry point; Edge Function `/queue-batch` validates before accepting
- **Grace behavior:** Free in grace CAN use bulk (via effective_tier). Free post-grace cannot.
- **On block:** Paywall surface with copy: "Available during your first 30 days, then on Pro+"
- **Telemetry:** `feature_lock { action: 'bulk_upload', tier, grace_active }`

### 6. Data export (full JSON with AI metadata)

- **Type:** Binary tier check
- **Predicate:** `users.tier IN ('pro', 'collector')`
- **Where:** Export button handler in native app; Edge Function that generates the export file
- **Grace behavior:** NO exception. Free users (even in grace) get CSV summary only. Full JSON export is a Pro+ feature.
- **On block:** Export options show "CSV (Free)" enabled + "Full JSON with AI metadata (Pro)" locked with upgrade CTA
- **Telemetry:** `feature_lock { action: 'full_export', tier }`

## Phase 4 gates (deferred — features don't exist yet)

| Feature | Gate type | Tier | Ships with |
|---|---|---|---|
| Marketplace fee differential | Fee-based (7% vs 10%) | Collector | Commerce flow |
| Trade listings | Binary tier check | Pro+ | Commerce flow |
| Hub priority + reduced fees | Binary tier check | Collector | Hub product |
| Cross-vertical analytics | Binary tier check | Collector | Analytics product |
| Enterprise / dealer tier | Separate SKU | New tier | Marketplace era |

## Grace exception summary

| Gate | Grace exception? | Rationale |
|---|---|---|
| Scan cap | Yes (uses Pro cap) | Back-catalog import during onboarding |
| Report viewing | Yes (RLS allows) | Let them taste report quality |
| Report generation | No | Generation is the upsell after viewing |
| Managed showcases | No | Feature gate, not volume gate |
| Bulk uploader | Yes (via effective_tier) | Natural back-catalog path |
| Data export | No | Low-urgency feature; upgrade incentive |

## Implementation notes

### Where effective_tier is used vs raw tier

| Check type | Reads | Why |
|---|---|---|
| `check_user_cap(user_id, 'scan')` | effective_tier | Grace = Pro caps |
| `can_use_bulk(user_id)` | effective_tier | Grace = bulk access |
| RLS on `collectible_reports` SELECT | raw tier + grace_period_ends_at | Special grace exception for viewing only |
| RLS on `collectible_reports` INSERT | raw tier only | No grace exception for generation |
| Feature gates (showcases, export) | raw tier only | No grace exception |

### Telemetry contract

Every gate block emits one of two event types:

```typescript
// Cap-based block (scan or report cap exceeded)
analytics.track('cap_hit', {
  user_id,
  action: 'scan' | 'report',
  tier: 'free' | 'pro' | 'collector',
  effective_tier: 'free' | 'pro' | 'collector',
  used_this_month: number,
  monthly_cap: number,
  grace_active: boolean,
});

// Feature lock (binary tier check failed)
analytics.track('feature_lock', {
  user_id,
  action: 'report_view' | 'report_gen' | 'auto_showcase' | 'bulk_upload' | 'full_export',
  tier: 'free' | 'pro' | 'collector',
  grace_active: boolean,
});
```

These events power the upgrade-intent funnel analysis — which gates are users hitting, when, and do they convert?

## Pre-launch audit checklist

Before subscription rollout, walk every feature in the app and mark its gate status:

- ✅ Available to all (no gate): live scanning, manual showcases, marketplace buy/sell, CSV export, verification deep-links, collection browsing
- 🔒 Tier-gated (v1): report viewing, report generation, managed showcases, bulk uploader, full JSON export
- 🔒 Cap-limited (v1): scans (monthly), report generation (monthly)
- ⏸ Deferred: marketplace fees, trade, hub, analytics, enterprise

## Open questions

- **Where does cap progress live in the UI?** Permanent element vs near-cap-only? Lean toward subtle (small text on upload entry) until under threshold, then prominent. Details in `paywall-ux.md`.
- **Collector-only features at launch.** If Collector ships dark, treat Collector-only gates as Pro+ during launch window, then split later. No separate handling needed.

## Decisions changelog

- **2026-05-14** — Stub created. Locked: single predicate function, server-authoritative, telemetry on all blocks.
- **2026-05-14** — **Rewritten to match unified model.** v1 gate set locked: scans (cap), report viewing (RLS + grace), report generation (cap + tier), managed showcases (tier), bulk uploader (tier + grace), data export (tier). Grace exception matrix documented. Telemetry contract specified. Phase 4 gates deferred.
