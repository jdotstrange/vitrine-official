# Vitrine Subscription Implementation

> **Status**: In design (2026-05-14). This is the master orchestration document for implementing subscription tiers in Vitrine. Captures the build phases, sequencing, cross-cutting decisions, and links to the per-pillar architecture documents.
> **Owner**: John
> **Related**:
> - `pricing-model.md` (what we charge — tier limits, fee structure, strategic rationale)
> - `subscription-architecture.md` (how we charge — RevenueCat, Stripe, IAP deferral)
> - `reports-architecture.md` (data model for VAR/AAR/Pulse reports)
> - `cap-counter-architecture.md` (cap predicate, events log, grace period, unified scan cap)
> - `bulk-uploader-architecture.md` (queue lifecycle, draft state, app/engine contract)
> - `revenuecat-integration.md` (RC + Stripe wiring) — *to be written*
> - `paywall-ux.md` (UI patterns for upgrade flows) — *to be written*
> - `tier-gating-implementation.md` (per-feature gates) — *to be written*

## Why this document exists

The subscription work touches every layer of the stack — schema, edge functions, cap enforcement, native UX, payment rails. This document is the **single source of truth for sequencing and cross-cutting decisions** that don't live cleanly inside any one pillar doc.

If a question is "what do we do?" → check the relevant pillar doc.
If the question is "what do we do *first*?" → check this doc.

## Cross-cutting decisions (locked)

These apply across every pillar:

- **Free has zero access to AI reports post-grace** (view OR generate). Pro and Collector have full access. **Exception: Free users in grace can VIEW reports (but not generate).** This is an RLS rule, not a cap-predicate rule. Marketing angle: "See what Pro-quality AI reports look like on your own collection."
- **Reports are community-shared.** Any Pro+ user can generate a report on any collectible (their own or another user's). Once generated, all Pro+ users can view it.
- **Cap structure is good-faith rate limiting**, not strict gatekeeping. The intent is to protect unit economics, not to wall users off.
- **Unified single-cap model.** One scan is one scan, regardless of whether it came through the live (sync) or bulk (async via Gemini Batch API) path. Bulk's ~62% cost discount is captured as our margin, not priced through to the user. Action namespace: `scan` and `report`. No live-vs-bulk subdivision in the cap predicate.
- **Monthly-only caps.** No daily sub-caps for scans or reports. One number per cap dimension. Abuse protection is the sliding 60-second rate limit, not a daily ceiling.
- **Reports collapsed to a single combined cap.** VAR + AAR + Market Pulse share one monthly pool per tier. No per-type subdivision.
- **30-day grace window via tier substitution.** During grace, Free users are treated as Pro tier *for cap evaluation only* — they get Pro caps but not Pro features. Marketing framing: "Pro upload limits, free for your first 30 days." Backfilled to launch_date + 30d for existing users at launch.
- **Bulk uploader is web-only and Pro+ only, with grace exception.** Free users in grace gain bulk access through the same `effective_tier` substitution that handles caps. Free users post-grace lose bulk and revert to live-only scanning. Bulk-as-Pro-feature is the conversion lever; grace is the 30-day Pro trial.
- **Per-batch max: 200 items.** Operational ceiling (upload payload, draft inventory, batch-API limits). Not a cap-math knob.
- **No collection size cap, no fraud-detection ceiling, no schema mechanism for it.** Storage math at sensible scales doesn't justify it. The DB will be monitored anyway; if a single user shows up with 100K+ items we'll notice in the admin dashboard and respond manually. We can always add a cap later as an additive migration if storage costs ever shift.
- **Founders pricing is killed.** Not building. (Marketing site cleanup is a separate task.)
- **Custom showcase themes / API access removed** from the Collector tier definition. Not building.
- **Collector tier may ship dark at launch.** Free + Pro only on initial release; Collector entitlement defined in DB but no offering exposed in UI. Decision deferred until launch readiness.

### Locked cap numbers

| Tier | Scans / month | Reports / month | Bulk uploader |
|---|---|---|---|
| Free (post-grace) | 100 | not entitled | no |
| Free (in grace) | 500 (= Pro) | view only (no generation) | yes (via effective_tier) |
| Pro | 500 | 30 | yes |
| Collector | 1,000 | 150 | yes |

Subject to empirical calibration against engine `extraction_costs` data before launch. Not blockers.

## Phased build order

Each phase has a corresponding pillar doc with detailed implementation specs. The order below is the recommended sequencing — phases may run in parallel where dependencies allow.

### Phase 1 — Foundation (no UX impact)

Backend groundwork. Can be built with zero impact on the live app.

1. **Schema additions** (`users.tier`, `tier_expires_at`, `revenuecat_subscriber_id`, `grace_period_ends_at`, `subscription_events` audit table)
2. **Reports table + RLS** (`collectible_reports` per `reports-architecture.md`)
3. **Extraction events log + scan source-of-truth** (`extraction_events` per `cap-counter-architecture.md`)
4. **Cap predicate function** (`check_user_cap` Postgres function per `cap-counter-architecture.md`)
5. **RevenueCat + Stripe accounts created**, products defined, Stripe Tax enabled, RC project linked to Stripe (per `revenuecat-integration.md` — to be written)

### Phase 2 — Native module integration (one EAS rebuild)

Adds the RC SDK to the native app. Doesn't gate anything yet — just makes the SDK available.

6. **RevenueCat SDK installed in Expo**, `Purchases.logIn(supabase_user_id)` wired into `auth-context.tsx`
7. **Subscription webhook handler** (Edge Function `subscription-webhook` that receives RC webhooks and updates `users.tier`)

### Phase 3 — Visible work

Customer-facing changes. Where the gates start firing.

8. **Paywall UI + upgrade flows** (per `paywall-ux.md` — to be written)
9. **Apply gates to v1 feature set** (per `tier-gating-implementation.md`):
    - Scans (monthly cap + grace tier substitution)
    - Report generation (monthly cap, Pro+ only, no grace exception)
    - Report viewing (Free post-grace locked; Free in grace can view; Pro+ full access)
    - Managed/auto showcases (Pro+ only, binary tier check)
    - Bulk uploader (Pro+ gate via `can_use_bulk` predicate, Free in grace via effective_tier)
    - Data export — full JSON with AI metadata (Pro+ only; Free gets CSV summary)
10. **Settings screen — current tier badge** + link to RC hosted customer portal
11. **Analytics wiring** (RC dashboard + cap-hit events to PostHog/Mixpanel)

### Phase 4 — Punted, gated on dependent features

These gates apply to features that don't exist yet. Build the gate when the feature ships, not before.

- Marketplace fee differential (10% Free/Pro vs 7% Collector) — waits on commerce flow
- Hub priority/fees — waits on hub product
- Trade vs Buy/Sell access (Pro+ can Trade) — waits on commerce flow
- Cross-vertical analytics (Collector-only, conceptual) — waits on product definition
- Enterprise / dealer tier — deferred until marketplace era

## Open cross-cutting questions

Things that touch multiple pillars and don't have a single owner:

- **Launch timing.** Does subscription ship in v3.0.0 (App Store launch) or v3.1.0 (post-launch)? Phase 1+2 build regardless. Phase 3 is what's at stake.
- **Beta/dogfood window.** Pre-launch, do we override `users.tier` to `'collector'` for the founding team and beta cohort? Probably yes, via admin-flag override.
- **Cross-platform identity sync.** When a user signs in on web AND native with the same Supabase account, do they see the same entitlements automatically? RC's `Purchases.logIn(supabase_user_id)` solves this in theory — needs validation on first integration.

## Decisions changelog

- **2026-05-14** — Initial structure. Locked: free zero-access to reports; community-shared reports; 30-day grace; bulk-uploader free + web-only; collection cap removed at v1; founders pricing killed; custom themes + API access removed from Collector.
- **2026-05-14** — Bulk uploader confirmed universally accessible (no tier gate). Storage cap fully omitted: no schema mechanism, no fraud ceiling, no toggle. Database monitoring handles outlier detection.
- **2026-05-14** — Locked two-cap model (live + bulk independent), grace via tier substitution (no multiplier), per-batch max 200 items. Bulk uses Gemini Batch API + prompt caching for ~62% cost savings vs sync; engineering details deferred to engine workspace and captured at the contract level in `bulk-uploader-architecture.md`. *(Two-cap structure superseded later same day — see next entry.)*
- **2026-05-14** — **Unified single-cap model locked.** Reverted live-vs-bulk split. Action namespace: `scan` (one combined dimension) and `report` (one combined dimension). Daily caps removed entirely on both. Reports collapsed to single combined cap (VAR/AAR/Pulse share one monthly pool per tier). Bulk uploader flipped to Pro+ only with grace exception via `effective_tier` substitution.
- **2026-05-14** — **Cap numbers locked:** Free 100/mo scans (no reports). Pro 500/mo scans + 30/mo reports. Collector 1000/mo scans + 150/mo reports. Free in grace = Pro caps (500/mo scans, bulk access enabled, no report entitlement). Bulk discount captured as margin, not priced through.
- **2026-05-14** — **Report viewing during grace locked.** Free users in their 30-day grace window can VIEW existing reports (RLS exception) but cannot generate. Marketing: let them see the quality before asking them to pay for generation.
- **2026-05-14** — **Data export gated.** Full JSON with AI metadata is Pro+ only. Free tier gets CSV summary. Added to v1 gate set.
- **2026-05-14** — **Grace expiry behavior locked.** Hard cliff on caps and bulk gate. Exception: in-flight bulk batches already accepted by the engine before grace expired are honored (gate checked at submit time, not completion time).
- **2026-05-14** — **Rate limit specifics deferred.** Sliding 60s anti-abuse rate limit concept is locked architecturally; actual threshold and implementation deferred until post-launch telemetry shows where trouble appears.
- **2026-05-14** — **Cap UI display: contextual switching.** 100+ remaining → "X / Y this month" (progress). Under 100 remaining → "N left this month" (countdown). Threshold scales with cap size (reports switch at under 10 remaining).
