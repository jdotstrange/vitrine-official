# Vitrine Subscription Architecture

> **Status**: Proposed (2026-05-11). Not yet implemented. This document captures the launch billing strategy and architecture so engineering, support, and finance decisions downstream can reference a single source of truth.
> **Owner**: John
> **Related**: `docs/pricing-model.md` (what we charge). This document covers **how** we charge.

## Decision summary

Launch Vitrine with a **web-only subscription rail powered by RevenueCat Billing on top of Stripe**. No Apple IAP. No Google Play Billing. All three platforms (iOS app, Android app, PWA) route users to the same Stripe-backed web checkout. Identity and authentication remain in Supabase Auth; subscription state lives in RevenueCat and is mirrored to Supabase via webhook.

IAP integration is **deferred, not foreclosed**. RevenueCat stays in the stack precisely so we can bolt on App Store / Play Store rails later if conversion data demonstrates a meaningful loss.

## Why this approach

### Web-only at launch

1. **PWA forces the issue anyway.** A PWA cannot use IAP; we're building a Stripe rail no matter what.
2. **Margin retention is material.** ~97% of revenue net (Stripe ~3%) vs ~70-85% net under IAP (Apple/Google 15-30% + RevenueCat 1%). At $5M ARR that delta is ~$650K/yr.
3. **Conversion profile favors web.** Vitrine's free tier is generous and engagement-driven; most upgrades will be warm (user hits a cap, wants to generate VAR/AAR, wants to sell on marketplace). Warm-conversion IAP advantage is small (~10-20%). Cold "upsell popup on launch" is not how we plan to monetize anyway.
4. **App Store review surface area is smaller.** No-IAP-at-all sidesteps the "are you steering against IAP" gray zone that mixed-rail apps navigate.
5. **Reversibility.** With RevenueCat in the stack, adding IAP later is a configuration change, not a rewrite.

### Keep RevenueCat (even without IAP)

Even in a pure-Stripe model, RevenueCat earns its 1% MTR by providing:

- Hosted Stripe checkout pages with native paywall A/B testing
- Subscription lifecycle management (billing retries, dunning, grace periods, refunds)
- Webhook normalization (Stripe events → clean entitlement updates)
- Cross-device entitlement sync across iOS / Android / PWA
- Built-in subscription analytics (MRR, churn, cohort retention, LTV)
- Family sharing, promo codes, trial logic
- Paywall A/B testing changeable without app releases

Replicating even half of this in-house is 2-3 months of focused engineering plus an ongoing maintenance tail. At our launch scale (`$0` MTR through $200K ARR), RevenueCat is effectively free; at $5M ARR the cost is ~$50K/yr — cheap relative to what they handle.

## Architecture

### High-level rails

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   iOS App    │   │ Android App  │   │     PWA      │
│   (Expo)     │   │   (Expo)     │   │  (Next.js?)  │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       │   "Upgrade to Pro" tap              │
       ▼                  ▼                  ▼
       SFSafariViewController / browser tab
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
                ┌─────────────────────┐
                │  RevenueCat Billing │
                │   (hosted Stripe    │
                │     checkout)       │
                └──────────┬──────────┘
                           │
                           ▼ Stripe processes payment
                ┌─────────────────────┐
                │      Stripe         │
                └──────────┬──────────┘
                           │
                           ▼ webhook
                ┌─────────────────────┐
                │     RevenueCat      │ ← unified subscription state
                └──────────┬──────────┘
                           │
                           ▼ webhook
                ┌─────────────────────┐
                │ Supabase            │
                │ user_tier table     │ ← single source of truth for app
                └─────────────────────┘
```

### Identity vs subscription state

Two separate concerns, two separate systems, one shared identifier:

| Concern | System | Identifier |
|---|---|---|
| Authentication (login, sessions, OAuth) | **Supabase Auth** | `auth.users.id` (UUID) |
| Subscription state (Pro? Collector? trial?) | **RevenueCat** | RevenueCat App User ID = Supabase `auth.users.id` |

This means RevenueCat **never owns user identity**. It only owns the answer to "what entitlements does user X have." When a user signs in on any device, we pass their Supabase user ID to `Purchases.logIn(userId)` in the RevenueCat SDK, and their subscription state follows them automatically.

Concrete benefit: if we ever migrate off RevenueCat, we don't need to migrate user accounts — only subscription state.

### Entitlement state mirroring

`user_tier` lives in Supabase as the single source of truth for the app's authorization decisions. RLS policies, cap counters, and feature gates all read from Supabase, never from RevenueCat directly. Reason: latency, reliability, and the ability to use entitlement state in row-level security policies.

```
RevenueCat webhook  →  Edge Function (subscription-webhook)
                          ↓
                       Updates public.users SET tier='pro', tier_expires_at=... WHERE id=...
                          ↓
                       App reads user_tier on session refresh and on per-action checks
```

This mirrors the same "external source of truth + local mirror" pattern used elsewhere in Vitrine (e.g., Inngest jobs mirrored to `extraction_jobs` table).

## Implementation order (when wiring begins)

Pre-launch — not all of these are required to ship, but they're the natural order:

1. **Supabase schema additions** — `users.tier`, `users.tier_expires_at`, `users.revenuecat_subscriber_id`, `subscription_events` audit table
2. **RevenueCat account + products** — define Free, Pro, Collector entitlements; create Stripe-backed offerings (monthly and annual SKUs for Pro and Collector)
3. **Stripe Tax / VAT setup** — enable Stripe Tax, configure thresholds for relevant jurisdictions
4. **RevenueCat SDK integration in Expo** — install, configure, wire to Supabase Auth user ID via `Purchases.logIn`
5. **Paywall UI** — build with RevenueCat's Paywall Builder OR custom React Native components calling `Purchases.getOfferings`
6. **Subscription webhook handler** — Edge Function that receives RC webhooks and updates `users.tier`
7. **Entitlement-gated features** — RLS policies, cap counters per feature per period, paywall trigger points
8. **Founder pricing flag** — `users.founder_pricing_locked` boolean that overrides standard SKU pricing for early cohorts
9. **Subscription management UI** — link out to RC's hosted customer portal for plan changes, payment method updates, cancellations
10. **Analytics wiring** — RC's dashboard for revenue; PostHog/Mixpanel events for funnel and cap-hit tracking

## App Store review considerations

We are explicitly *not* using IAP. The risk is that Apple flags the app as "circumventing IAP for digital subscriptions." Mitigation:

- **Be transparent.** The "Upgrade to Pro" button should clearly open a browser/SFSafariViewController experience. No fake-IAP styling.
- **Don't hide pricing.** Display prices in-app even though purchase happens on web. Apple's anti-steering rules are gone (in the US, post-2025 contempt ruling); we can show prices openly.
- **No deceptive flow.** The user should understand they're being taken to a web page to complete purchase. Smooth and branded, yes; hidden, no.
- **Consider App Store category framing.** Vitrine is reasonably positioned in categories Apple historically allows web subscription for (utility, lifestyle, productivity). "Reader" category was the canonical safe harbor; we don't need it now but the framing helps.

If a reviewer asks, the answer is: "Subscriptions are processed via our website. The app uses external payment per Apple's current external-link entitlement guidelines."

## Refunds, chargebacks, support

With Stripe as the payment processor, these become Vitrine's operational responsibility (vs Apple/Google handling them under IAP):

- **Refunds:** Issued via Stripe dashboard or programmatically. Policy: full refund if requested within 7 days of charge, no questions; prorated refund for downgrades; case-by-case otherwise.
- **Chargebacks:** Stripe handles dispute submission; we provide evidence (subscription terms, usage logs, communication history). Expected rate: <0.5% of transactions for a subscription app.
- **Support flow:** "Cancel my subscription" → user is sent to RevenueCat's hosted customer portal (or we build a thin in-app shim). RC handles the actual cancellation against Stripe.

This is real operational work but it's tractable. RC's portal does the heavy lifting for self-service cases.

## Tax / VAT

Stripe Tax (enabled at RevenueCat's instruction) handles automatic tax calculation across jurisdictions. Required setup:

- Register for tax collection in relevant US states (Stripe Tax surfaces threshold alerts)
- Register for VAT/GST in major international markets if/when we cross thresholds (typically EU, UK, Canada, Australia first)
- Stripe Tax fee: ~0.5% on top of standard Stripe fees; baked into the ~3% all-in estimate

Cross-reference for finance: tax registration is a *legal* obligation, not just a billing nicety. Skipping it once we hit thresholds in major markets becomes a serious risk.

## When (if ever) to add IAP

Trigger conditions that would justify adding IAP:

- **Mobile conversion is meaningfully below the SaaS-app benchmark** (rough heuristic: <40% of free-to-paid intent users complete checkout on mobile)
- **A specific high-value cohort consistently bounces at web checkout** (visible in funnel analytics)
- **Apple's anti-steering rulings are reversed on appeal** and the external-link approach becomes legally fraught (unlikely but watchable)
- **Competitor analysis shows IAP-only competitors winning iOS share** despite lower margins

If we hit any of those, the bolt-on plan is:

1. Define IAP-priced SKUs in App Store Connect (likely $11.99 / $29.99 — the web price plus the platform fee recoupment)
2. Configure these SKUs in RevenueCat alongside the existing Stripe offerings
3. Update the paywall to offer both options ("Subscribe on web for $9.99/mo OR via App Store for $11.99/mo")
4. Test, ship, monitor conversion impact

Estimated effort: 2-4 weeks of engineering, mostly QA across review cycles. RevenueCat's existing integration means most of the plumbing is already there.

## Risks and watchouts

| Risk | Severity | Mitigation |
|---|---|---|
| Apple reverses 2025 anti-steering ruling on appeal | Medium / Low likelihood | Keep RevenueCat in stack; IAP can be added quickly |
| iOS users distrust web checkout, conversion suffers | Medium | Monitor closely post-launch; bolt on IAP as fallback if needed |
| App Store review rejects external-only subscription flow | Low (well-trodden path post-2025) | Be transparent in review notes; cite external link entitlement |
| Stripe outage during peak conversion window | Low | RC's webhook retries handle transient failures; users see clear error UI |
| Chargeback rates exceed Stripe thresholds (1% triggers review, 2% triggers penalties) | Low | Standard fraud prevention; subscription products rarely hit this |
| RevenueCat outage breaks entitlement reads | Low | Mirror state to Supabase, read from there; app degrades gracefully if RC is unreachable |
| Tax registration neglected, liability accrues silently | Medium | Stripe Tax alerts on threshold crossings; finance review quarterly |
| Refund/cancellation operations consume disproportionate support time | Medium | RC hosted portal handles 80%+ of cases self-service |

## What's not yet decided

These are open questions that don't block launch but should be resolved before scaling:

- **Trial period strategy** — free trial vs no trial vs money-back guarantee? RC supports all three; current lean is "no trial, 7-day money-back guarantee" to reduce trial-abuse complexity.
- **Annual discount size** — currently modeling 25% off (Pro $89/yr, Collector $249/yr). Could tighten or loosen based on launch data.
- **Founder pricing duration** — is the "locked for life" promise honored across major version bumps? Probably yes, with clearly-defined "major version" criteria.
- **Family / shared plan tier** — RC supports family sharing; do we offer a Vitrine Family plan or stick with single-user accounts at launch?
- **Marketplace seller payouts** — Stripe Connect for paying out marketplace sellers is a separate integration (not part of subscription billing). Out of scope for this doc; tracked separately in marketplace planning.

## Open dependencies before implementation

- Apple Developer account in good standing (for app distribution, even without IAP — required for App Store presence)
- Google Play Developer account similarly required
- Stripe account approved for subscription billing (standard process)
- RevenueCat account created, project linked to Stripe
- Decision on payment methods to enable (cards default; Apple Pay / Google Pay / Link recommended; ACH via Plaid optional for annual plans)
- Legal review of subscription terms, refund policy, and TOS language
