# Paywall UX

> **Status**: Stub (2026-05-14). UX patterns to be designed when paywall implementation phase begins.
> **Pillar of**: `subscription-implementation.md`
> **Related**: `pricing-model.md` (what's gated), `tier-gating-implementation.md` (where the gates fire)

## What this covers

The user-facing surfaces of the subscription system:

- Cap-hit modals ("you've used your daily scans")
- Feature locks (Free user tapping a Pro-only button)
- Upgrade flows (paywall sheet → web checkout handoff)
- Tier badges (settings, profile)
- Cap progress indicators ("8 / 10 today")
- Stale-report refresh CTAs
- Successful upgrade celebration / confirmation

Does not cover: which features get gated (see `tier-gating-implementation.md`), the actual checkout flow (see `revenuecat-integration.md`).

## Decisions (locked)

- **No interstitial paywalls inside the upload flow.** The user finishes what they started. Cap is enforced server-side; paywall surface appears when the *next* attempt is blocked, not in the middle of the current one.
- **Paywall surfaces are contextual, not generic.** "You've reached your scan limit today" beats "Upgrade to unlock all features." Each paywall surface knows the specific cap or feature that triggered it and CTAs accordingly.
- **Web checkout, native handoff.** Tapping "Upgrade" in native opens a web-view to the RC hosted customer portal (or our hosted checkout page). No native sheet asking for credit card.
- **Cap progress is shown proactively, not just at the wall.** "8 / 10 scans today" appears in upload entry well before the 10th scan. No surprise blocks.

## To be filled in

### Surfaces to design

- **Settings → Subscription** — current tier badge, "manage" link, billing portal embed
- **Cap-hit modal** — single component reused across scan-cap, report-cap surfaces; shows used/limit, time-to-reset, upgrade CTA
- **Feature lock** — Free user tapping a Pro-only feature (e.g., "View Report"); inline lock with paywall CTA
- **Cap progress indicator** — small UI element showing "X / Y today"; placement on upload entry, report screen
- **Paywall sheet** — full-screen / large-sheet upgrade pitch; tier comparison table, upgrade CTA
- **Stale Pulse refresh** — "Refresh available" badge on report; tap → confirm regen → returns to report screen
- **Grace-period awareness** — should the UI tell the user "you're in your first 30 days, with 50 scans/day"? Decision deferred. Lean toward subtle indication, not splash.
- **Tier-changed confirmation** — after successful upgrade, native picks up the new tier (refetch user) and shows a celebration sheet.

### Copy guidelines (TBD)

- Tone of cap messages: helpful, not punitive
- Upgrade CTAs: emphasize value, not features
- Feature lock copy: focus on what they get, not what they're missing

### Edge cases to handle

- User upgrades on web while native is open — how does native learn? Pull-to-refresh? Polling? Webhook → push notification?
- User cancels but is still in paid period — UI should show "Pro until Jan 15" not "Pro" + "Free"
- User has billing issue (failed payment) — RC fires event; we still treat them as Pro? Down-tier? Grace?
- User in grace period AND on Free tier — UI shows "X / Y" where Y reflects the grace bump

## Open questions

- **Tier comparison table — minimal or detailed?** Marketing site has the detailed one. In-app paywall: probably condensed.
- **Annual upsell.** Show monthly first or annual first? Lean toward annual highlighted ("save 2 months") with monthly secondary.
- **Collector tier visibility at launch.** If we ship with Collector dark, do we show it in the paywall sheet ("Collector tier coming soon") or hide it entirely? Probably hide.
- **Where does cap progress live?** Permanent UI element vs. only-when-near-cap? Lean toward subtle (small text on upload entry) until last 20% of cap, then prominent.

## Decisions changelog

- **2026-05-14** — Stub created. Locked: no interstitial paywalls mid-flow, contextual paywalls, web checkout via webview, proactive cap progress display.
