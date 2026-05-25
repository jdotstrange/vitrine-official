# Vitrine Pricing Model

> **Status**: Tier structure + cap numbers locked (2026-05-14). Unit-economics section still reflects 2026-05-11 assumptions and needs a re-cost-analysis pass before launch.
> **Owner**: John
> **Supersedes**: Anthropic-era pricing assumptions previously discussed in chat (Pro $24.99 / Collector $49.99 single-anchored on Opus cost stack).
> **Related**:
> - `subscription-implementation.md` (master orchestration doc — read first)
> - `subscription-architecture.md` (how we charge — billing rails, RevenueCat, Stripe, IAP deferral)
> - `cap-counter-architecture.md` (the cap predicate, events log, grace period implementation)
> - `bulk-uploader-architecture.md` (the bulk path)

## Why this document exists

The economics of the Vitrine engine changed materially on 2026-05-11 when the default extraction provider moved to Gemini 3.x Flash with lean prompts (`models/gemini-3.ts`). Per-upload AI cost dropped ~85% vs the Anthropic baseline that was assumed when subscription pricing was originally modeled. This document is the refreshed pricing model under the new cost reality.

The strategic shift: **optimize for TAM capture and marketplace mass, not per-user ARPU**. Lower-priced Pro tier opens the funnel; Collector tier captures power users via marketplace/hub differentiation; free tier is generous enough to be a competitive weapon while protecting operational costs.

---

## Three-Tier Structure

### Free (Default)

The competitive weapon. Generous enough that a casual or curious collector can build real value before ever paying. Locks all AI report features (no view, no generate) and gives them a fully-featured Pro experience for their first 30 days as the onboarding ramp.

| Lever | Limit |
|---|---|
| Collection size | **No cap** (monitored for outliers; revisit only if storage economics break) |
| Scans (live + bulk combined) | **100/month** post-grace |
| **Onboarding grace (first 30 days)** | **Treated as Pro tier for cap purposes**: 500/month scans, bulk uploader access. *Cap and bulk-access only — no AI report entitlement.* |
| Showcases | **Unlimited (manual layout only)** — no AI auto-organization |
| VAR / AAR / Market Pulse | **No access post-grace** (cannot view, cannot generate). **During grace: view-only** — can see existing reports but cannot generate new ones. |
| Marketplace | **Buy + Sell at 10% fee** (no Trade) |
| Bulk uploader (web) | **Grace-only** — first 30 days yes, post-grace no |
| Data export | **CSV summary** of collection |
| Verification deep-links | Yes (UX courtesy, informational only) |

### Pro — $9.99/mo or $89/year (~$7.42/mo effective)

The accessible upgrade. Priced at an impulse-buy threshold (below "do I really need this?"). Lifts the scan cap, unlocks the bulk uploader permanently, opens up viewing AND generation of premium AI reports, unlocks the auto-showcase feature, and lets serious collectors transact.

| Lever | Limit |
|---|---|
| Collection size | **No cap** |
| Scans (live + bulk combined) | **500/month** |
| Showcases | **Unlimited manual + AI-powered auto/smart** |
| VAR / AAR / Market Pulse | **Unlimited views (community-shared) + 30 generations/month combined** (VAR + AAR + Pulse share one pool) |
| Marketplace | **Buy + Sell + Trade at 10% fee** |
| Extraction queue | **Standard priority** |
| Bulk uploader | **Yes** (batched uploads for migration sessions) |
| Public showcase URLs | **Yes** (shareable links) |
| Data export | **Full JSON with AI metadata** |

### Collector — $24.99/mo or $249/year (~$20.75/mo effective)

The power-user / seller tier. The economic value comes from the **marketplace fee discount** and **hub fee reduction**, both of which pay for the tier at modest GMV. Scan and report caps step up materially for serious users who actually run their collections through the platform.

| Lever | Limit |
|---|---|
| Everything in Pro, plus: | |
| Scans (live + bulk combined) | **1,000/month** |
| VAR / AAR / Market Pulse | **150 generations/month combined** (VAR + AAR + Pulse share one pool) |
| Marketplace fee | **7% (vs 10% on Free/Pro)** |
| Hub | **Priority queue + reduced hub fees** |
| Cross-vertical analytics | **AI-powered portfolio insights** (conceptual; TBD scope) |
| Support | **Priority** |

---

## Unit Economics

> **Stale as of 2026-05-14.** The per-user cost rows below are based on rougher estimates from 2026-05-11 and reference the old daily-sub-cap structure. A re-cost-analysis using actual `extraction_costs` p50/p95 data plus the locked unified single-cap model (no daily caps; scans 100/500/1000 per tier; combined reports pool 30/150) is needed before locking pricing for launch. Directionally still useful; numerically suspect.

Per-user monthly cost under the post-2026-05-11 cost stack (Gemini 3.x Flash for extraction + AAR; Gemini 3.x Pro Preview for VAR + Market Pulse synthesis; Supabase storage + Inngest):

### Free user (typical)

| Component | Cost |
|---|---|
| Extraction (5-10 items/mo) | ~$0.05-0.10 |
| Storage (small collection) | ~$0.10 |
| **Total** | **~$0.15-0.20/mo** |

Even a heavy free user (100 items/mo) costs ~$1.20/mo — well under any reasonable customer-acquisition-cost amortization.

### Pro user ($9.99/mo) — typical engaged usage

| Component | Cost |
|---|---|
| Extraction (10-15 items/mo) | ~$0.15 |
| AAR (5 gens, Flash) | ~$0.20 |
| VAR (3 gens, Pro Preview) | ~$0.40 |
| Market Pulse (10 gens, Pro Preview) | ~$0.80 |
| Showcase auto-gen (5 runs) | ~$0.10 |
| Storage + infra | ~$0.20 |
| **Total** | **~$1.85/mo** |

Net of payment processing (~85% retained, blended Apple/Google/Stripe): ~$8.50. **Margin: ~$6.65/mo per Pro user (78% gross margin).**

### Pro user ($9.99/mo) — worst case at cap

Under the locked unified single-cap model (500 scans/mo, 30 reports/mo combined):

- Scans: 500 × ~$0.007 (live blended) = ~$3.50, OR 500 × ~$0.0027 (all bulk) = ~$1.35
- Reports: 30 × ~$0.10 blended = $3.00
- Infra: ~$0.20
- **Worst case (all live): ~$6.70/mo**, vs ~$8.50 net revenue → ~$1.80 margin
- **Best case (all bulk): ~$4.55/mo**, vs ~$8.50 net revenue → ~$3.95 margin

Both positive. The economic protection is the cap itself; daily sub-caps are no longer needed.

### Collector user ($24.99/mo) — typical engaged usage

| Component | Cost |
|---|---|
| Extraction (30-50 items/mo, blended live + bulk) | ~$0.30 |
| Reports (~30 gens, mix of VAR/AAR/Pulse) | ~$3.00 |
| Showcase auto-gen + analytics | ~$0.50 |
| Storage + infra (larger collection) | ~$0.50 |
| **Total** | **~$4.30/mo** |

Net of fees: ~$21. **Margin: ~$16.70/mo per Collector.**

### Collector user ($24.99/mo) — worst case at cap

Under the locked unified single-cap model (1000 scans/mo, 150 reports/mo combined):

- Scans: 1000 × ~$0.007 (all live) = ~$7, OR 1000 × ~$0.0027 (all bulk) = ~$2.70
- Reports: 150 × ~$0.08 blended (more AAR-heavy at scale) = ~$12
- Infra: ~$0.50
- **Worst case (all live + max reports): ~$19.50/mo**, vs ~$21 net → ~$1.50 margin
- **Best case (all bulk + max reports): ~$15.20/mo**, vs ~$21 net → ~$5.80 margin

Realistic users don't max both axes simultaneously — scan-heavy users (importers/dealers) generate few reports; report-heavy users (researchers) generate few scans. Typical engaged usage sits well under the worst-case ceiling.

---

## Strategic Rationale

### Why three tiers instead of two

Two-tier ($24.99 / $49.99) optimizes for **per-user revenue**. Three-tier with accessible Pro optimizes for **funnel velocity and marketplace mass**. Vitrine's long-term revenue lever is marketplace take rate + hub fees, both of which scale with user count and transaction volume, not with subscription ARPU. The three-tier structure feeds the marketplace engine.

### Why $9.99 (not $14.99) Pro

$9.99 is the impulse-buy threshold for hobby apps. It's below the "do I really need this?" mental ledger. Annual at $89 feels even more frictionless. Below this anchor, conversion friction drops materially.

The unit economics support it (~$1.85 cost vs $8.50 net = 78% margin). The risk is anchor-pricing-stickiness — once you launch at $9.99, raising to $12.99 later costs goodwill. Mitigation: launch with "founders pricing" locked in for first 10K Pro users; future cohorts can start at $12.99 if needed.

### Why $24.99 (not $19.99 or $29.99) Collector

$24.99 keeps the Pro-to-Collector multiple at ~2.5x — large enough that Collector feels like a real step up, small enough that engaged Pro users will upgrade when they hit the gen caps or start transacting. At higher multiples (3x+), the gap discourages upgrades. At lower multiples (<2x), the tiers blur.

The marketplace fee discount alone (3% gap) covers Collector for any seller doing $1,000+/mo GMV. Hub fee reduction stacks. Once a Pro user is transacting seriously, Collector pays for itself.

### Why "view vs generate" split on AI features

Letting Free and Pro users **view** unlimited reports (on marketplace listings, on items they bought, on other users' content) but locking **generation** behind tier caps does three things:
1. Drives upgrade desire through visibility (FOMO at scale)
2. Maximizes marketplace value (every buyer sees the reports the seller paid to generate)
3. Protects unit economics (viewing is essentially free Postgres reads; generating is the expensive AI call)

This is the keystone of the pricing model. It's the reason caps can be tight on Pro without feeling restrictive.

### Why monthly-only caps (no daily sub-caps)

Earlier proposals had monthly + daily compound caps. Dropped 2026-05-14 in favor of a single monthly number per cap dimension.

Reasons:
- **UX clarity.** "417 / 500 this month" is dramatically clearer than "21 today + 417 this month." One progress bar, one mental model.
- **Daily caps were always more about feel than economics.** A user who consumes their entire monthly cap on day 1 has the same total AI cost impact on us as one who paces it. The daily cap prevented spreading, not the cost.
- **Abuse protection still exists.** A sliding 60-second rate limit kills scripted bursts. That's the real defense; the daily cap was redundant.
- **Tighter unit economics anyway.** With caps sized at 500/Pro and 1000/Collector monthly, the worst-case AI cost is small enough that pacing isn't necessary to protect margin.

The result: cleaner UI, simpler predicate, same economic protection.

### Why everyone gets marketplace access

Gating free users out of selling kills network effects (less inventory, less buyer reason to show up). Free seller revenue at 10% is real money. The platform value compounds with user count, not just with paid-user count.

---

## Risks And Watchouts

### Anchor pricing stickiness
Once launched at $9.99, raising Pro is painful. Mitigation: founders-pricing-locked-for-life for early cohorts, future cohorts pay $12.99.

### Quality signaling at $9.99
$9.99 *could* signal "casual app." Mitigation: lean hard on "Pro" branding, premium UX, messaging that frames Pro as "smart value" (less than any single-vertical competitor for a multi-vertical bundle) not as "budget option."

### Self-cannibalization (Pro stealing from Collector)
If Pro is too good, why upgrade? Mitigation: the marketplace fee gap and hub fee reduction do the heavy lifting on differentiation. AI generation caps on Pro create real friction for power users who'll naturally upgrade.

### Capacity at scale
If the funnel works, user growth could outrun infrastructure. Mitigation: Inngest plan upgrade ($-$$/mo), hub buildout planning, support staffing — but these are operational, not strategic problems.

### Free-tier abuse (bots, scrapers, spam)
Collection cap is removed at v1; primary protections are the scan cap (100/month post-grace, 500/month during grace), the bulk gate (Pro+ post-grace), email/phone verification at signup, and the sliding 60-second rate limit. Database monitoring catches outliers. Marketplace selling at 10% creates a small but real cost-of-spam.

### Worst-case AI usage breaking unit economics
Pro at full max-out (500 scans + 30 reports) costs ~$6.50/mo vs ~$8.50 net revenue → ~$2 margin. Collector at full max-out (1000 scans + 150 reports) costs ~$19/mo vs ~$21 net revenue → ~$2 margin. Both positive but tight at full max. Realistic users don't max both axes simultaneously — scan-heavy users (importers/dealers) generate few reports; report-heavy users (researchers) generate few scans. A sliding 60-second rate limit kills scripted abuse. Document fair-use explicitly in TOS.

### Dealer cohort overflow
A small population of professional dealers will consume past the 1000/mo Collector scan cap. Out of scope for v1 — track in roadmap. Options when we get there: Enterprise SKU, per-user cap overrides table, or accept that dealers run multiple Collector accounts.

---

## What's Not In This Document Yet

These are open questions that need their own conversations before launch:

- **Hub fee structure** — what does Collector's "reduced hub fees" actually mean numerically? 
- **Cross-vertical AI Analytics scope** — Collector's analytics feature is conceptual; needs product definition
- **Trade fee structure** — Pro/Collector can Trade, but does Trade carry a fee? Probably $0 or low flat fee to encourage liquidity
- **Annual vs monthly pricing optimization** — annual discounts modeled at standard SaaS rates (~25% off); could tune
- **Family / shared collection pricing** — multiple users on one Collector account?
- **Vertical-specific feature gating** — should some verticals (e.g., wine, watches) get vertical-specific features that justify their own SKU?

---

## Implementation Order (When We Get There)

Tier infrastructure is not yet wired into the Collector App. For the full billing-architecture sequencing, see `docs/subscription-architecture.md`. The high-level tier-side order:

1. **RevenueCat + Stripe integration** (web-only at launch, no IAP) — see subscription architecture doc for full plan
2. **Backend entitlement enforcement** — DB column for `user_tier`, RLS policies for tier-gated content
3. **Cap enforcement** — see `cap-counter-architecture.md`
4. **Tier UI** — pricing page, upgrade flows, in-app entitlement gates
5. **Analytics** — track conversion rates Free → Pro → Collector, cap-hit frequency, gen-usage distribution

---

## Decisions changelog

- **2026-05-11** — Initial three-tier model under the post-Gemini cost stack. Pro $9.99 / Collector $24.99 / Free generous. Founders pricing reserved for first 10K Pro users.
- **2026-05-14** — Free tier locked to **no AI report access** (cannot view, cannot generate). View access is Pro+ only.
- **2026-05-14** — Collection size cap removed across all tiers. Database monitoring handles outliers; cap may be reintroduced later if telemetry shows storage abuse.
- **2026-05-14** — Founders pricing killed (no longer offering rate-locked-for-life cohort).
- **2026-05-14** — Collector tier slimmed: custom themes/branding/advanced layouts and API access both removed from v1 (revisit post-launch if there's user demand). Cross-vertical analytics remains as a roadmap item.
- **2026-05-14** — Two-cap model locked. Scans split into `live` (sync) and `bulk` (async via Gemini Batch API) as independent dimensions. Bulk uploader confirmed universally accessible across Free, Pro, Collector. Per-batch max 200 items. *(Both decisions superseded later same day — see below.)*
- **2026-05-14** — 30-day grace period mechanism: Free users in their first 30 days are treated as Pro tier *for cap evaluation only*. Marketing framing: "Pro upload limits, free for your first 30 days." Existing users at launch backfilled with launch_date + 30d.
- **2026-05-14** — **Unified single-cap model locked.** Reverted live-vs-bulk split. One scan is one scan. Action namespace: `scan` and `report`, each a single combined cap pool. Daily caps removed entirely on both. Reports collapsed to single combined pool (VAR + AAR + Pulse share one monthly cap per tier). Bulk discount captured as our margin, not priced through.
- **2026-05-14** — **Bulk uploader flipped to Pro+ only with grace exception.** Free users in grace gain bulk access via the same `effective_tier` substitution that governs caps. Free users post-grace lose bulk and revert to live-only scanning. Bulk becomes a Pro upsell lever; grace becomes a 30-day Pro trial that includes bulk import.
- **2026-05-14** — **Final cap numbers locked:** Free 100/mo scans (no reports). Pro 500/mo scans + 30/mo reports combined. Collector 1000/mo scans + 150/mo reports combined. Free in grace = Pro caps (500/mo scans + bulk access enabled, no report entitlement). Subject to empirical calibration before launch but considered the product baseline.
- **2026-05-14** — **Report viewing during grace locked.** Free users in grace can VIEW existing reports (RLS exception). Cannot generate. Marketing: taste the quality before paying for generation.
- **2026-05-14** — **Data export confirmed as Pro+ gate.** Full JSON with AI metadata is Pro+ only; Free gets CSV summary only.
- **2026-05-14** — **v1 gate set finalized:** scans (cap), report viewing (tier + grace), report generation (tier + cap), managed showcases (tier), bulk uploader (tier + grace), data export (tier). See `tier-gating-implementation.md`.
- **2026-05-14** — **Grace expiry: hard cliff + in-flight grace-through.** Caps and bulk gate drop immediately on day 31. In-flight batches already accepted by the engine are honored. Rate limit details deferred to post-launch telemetry.
