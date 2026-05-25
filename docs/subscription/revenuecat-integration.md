# RevenueCat + Stripe Integration

> **Status**: Stub (2026-05-14). Decisions deferred until cap and reports architecture is locked.
> **Pillar of**: `subscription-implementation.md`
> **Related**: `subscription-architecture.md` (high-level rationale for RC + Stripe), `pricing-model.md` (what we charge)

## What this covers

The plumbing that connects:

- **RevenueCat** — subscription orchestration, hosted checkout, entitlement state, webhooks
- **Stripe** — payment processor, tax compliance (Stripe Tax), invoicing
- **Supabase Auth** — identity (`auth.users.id`)
- **Supabase `users.tier`** — entitlement mirror for fast cap-predicate reads
- **Edge Function** — webhook receiver that translates RC events → `users.tier` updates

Does not cover: paywall UI (see `paywall-ux.md`), per-feature gating logic (see `tier-gating-implementation.md`).

## Decisions (locked)

- **Both RevenueCat AND Stripe required.** RC is the orchestrator + entitlement engine; Stripe is the actual money rails. RC abstracts over Stripe such that we can add IAP later (Phase 4) without re-architecting.
- **Web-only billing at launch.** No iOS / Android IAP. Reduces complexity, dodges Apple's 30% cut, lets Stripe Tax handle multi-jurisdiction VAT/sales tax.
- **`auth.users.id` is the RevenueCat App User ID.** One-to-one. Sign-in calls `Purchases.logIn(supabase_user_id)`.
- **`users.tier` is a mirror, not a source of truth.** RC is the source of truth. Mirror exists for fast cap-predicate reads (don't want to hit RC API on every scan).

## To be filled in (sections to populate when this work starts)

- Account setup steps (RC project, Stripe account, link the two)
- Product / entitlement / offering structure in RevenueCat
- Stripe product configuration (recurring price IDs, tax settings)
- Webhook handler implementation (Edge Function `subscription-webhook`)
- Webhook event mapping (RC event → `users.tier` value):
  - `INITIAL_PURCHASE` / `RENEWAL` → set tier
  - `CANCELLATION` → schedule downgrade at period end
  - `EXPIRATION` → downgrade tier
  - `PRODUCT_CHANGE` → switch tier
  - `BILLING_ISSUE` → grace handling
- Native SDK integration steps (`react-native-purchases` install, init, login)
- Customer portal embed (RC hosted)
- Reconciliation strategy (periodic job that checks RC entitlements vs. `users.tier` for drift)
- Test scenarios (sandbox subscriptions, cancellation, renewal, payment failure)

## Open questions

- **Annual vs monthly product structure in Stripe.** Two separate prices on one product, or two products? RC handles either. Lean toward two prices on one product.
- **Trial periods.** Are we offering trials? Decision deferred to launch readiness conversation.
- **Promo codes / discounts.** Stripe coupons + RC promo code support — defer to launch readiness.
- **Refund handling.** Stripe handles the money; RC fires `CANCELLATION` event; we downgrade tier. Need to verify the timing of the events.

## Decisions changelog

- **2026-05-14** — Stub created. Locked: RC + Stripe both required; web-only at launch; `auth.users.id` = RC App User ID; `users.tier` is a mirror.
