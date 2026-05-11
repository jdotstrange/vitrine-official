# Vitrine Community & Messaging Vision

> Strategic reference document capturing the product vision for Vitrine's social layer, messaging infrastructure, and marketplace-readiness architecture.

---

## The Core Thesis

Collectors do not have a digital home built for them. They're scattered across Facebook Groups, Reddit, Discord -- platforms that have zero awareness of what they collect, can't verify authenticity, can't facilitate transactions, and bury collector content under unrelated noise.

Vitrine aims to be **the definitive home for collectors** across all surfaces: Collection Management, Social Interaction, and Transactions (marketplace coming soon). Community isn't a feature bolted onto a collection manager -- it's an **equal pillar** supporting the same roof.

---

## Two Products, One Platform

### 1. Vitrine Groups (Community Tab) — "Facebook Groups for Collectors"

**What it is:** The collector's social home. A primary destination where users spend sustained time, not just check in. Equal in importance to the collection itself.

**Why it wins vs. Facebook Groups:**
- Sharing an item isn't a photo with a caption -- it's a **live object** from your collection with verified details, current value, and status (For Sale, For Trade, NFST)
- Legit checks happen against actual collection data, not blurry screenshots
- A "For Sale" post in a Vitrine group IS a marketplace listing (when marketplace ships). No "DM me for price" nonsense
- Collector reputation (profile, trade history, verification status) travels with you into every group. In Facebook, you're just a name and a profile pic
- Group admins can organize around Vitrine's category system -- a sneaker group gets sneaker-relevant structure, not generic Facebook tabs

**Design principles:**
- Groups should feel like **rooms you furnish**, not threads you read
- The mini-Discord structural instinct (server-like identity, member lists, roles, presence) but with Facebook Group *tone* (community, knowledge, commerce -- not real-time banter)
- Category identity system extends here: sneaker groups feel different from vintage watch groups
- Built for sustained engagement, not quick visits. Some users will spend the majority of their Vitrine time here

**What "sustained engagement" means:**
- Structured post types beyond plain text (Share from Collection, Discussion, Question / Legit Check)
- Eventually: pinned showcases, group collection stats, shared want-lists, group milestones ("this group has facilitated 500 trades")
- Moderation tools that are collector-native ("flag as counterfeit," "verify listing," not just "delete post")

---

### 2. Vitrine Messages (HUD Inbox) — "Messenger for Collectors"

**What it is:** The direct line. Where deals happen, where private conversations live, where someone you met in a group becomes a trading partner. A utility layer that's always one tap away from anywhere in the app.

**Relationship to Community:**
- DMs and Community are deeply connected but architecturally separate
- A conversation that starts in a group can move to DMs (tap avatar → "Send DM")
- A person you met through DMs might invite you to their group
- You never confuse which surface you're in or why
- **DMs should feel like a utility that's always within reach. Community should feel like a place you go.**

**Design principles:**
- Clean, fast DM inbox. No group carousel. No community cross-pollination in the list
- Conversations sorted by recency, pinned at top, with unread counts
- Recent/frequent contacts for quick access (not cold-search-only like today)
- Every DM can carry context about *why* it started (from a listing, a profile, a group)

---

## Marketplace-Ready Architecture (Building for Today, Socketed for Tomorrow)

The marketplace (Buy / Sell / Trade) is confirmed on the roadmap. It's how Vitrine becomes profitable. Everything we build now needs **marketplace-shaped sockets** -- structural decisions that accommodate commerce without requiring a redesign.

### Collectible Card Component — The Universal Surface

The collectible card appears everywhere: chat, groups, profiles, detail pages, search results. Every instance must be **status-aware in its action footer.**

- **Today:** The footer area is visual-only, showing the status badge (FS, FT, FST, NFST)
- **Socket:** When marketplace ships, items marked FS/FT/FST get action CTAs in the footer area ("Buy Now," "Make Offer," "Trade"). The card shape, spacing, and component structure already accommodate this. Same pattern already used on collectible detail cards.
- **Key rule:** Build the card once, use it everywhere. The in-chat card, the group-post card, the profile card, and the detail-page card are all the same component with context-appropriate rendering.

### Conversation Context / Origin Tracking

When someone messages you, the system should know **why** -- did they tap "Message" from a listing? From a profile? From a group?

- **Today:** Useful for UX (showing the relevant item pinned at the top of the DM thread so neither party loses context)
- **Socket:** This is the foundation for transaction attribution. When marketplace ships, knowing that a trade originated from a group post or a collection browse informs analytics, recommendation engines, and potentially commission structures.
- **Note:** Message capability already exists directly on collectible detail cards for exactly this reason.

### Item Sharing in Chat

When you share a collectible in a DM or group, it renders as a rich card (photo, title, value, status).

- **Today:** Useful for "check this out," "is this legit?," and casual sharing
- **Socket:** The shared card is the exact surface that later carries "Buy Now / Make Offer / Trade" CTAs. Status-aware: an item marked "For Sale" renders differently from "NFST."

### Message Type Extensibility

The API currently supports `message_type: 'text' | 'system'`. This enum needs room to grow.

- **Socket:** Future types include `collectible_share`, `showcase_share`, `trade_status`, `transaction_confirmation`, `offer_notification`. We don't build these now, but the data model shouldn't paint us into a corner.

---

## Trade — The Big Differentiator

**Trade is not a messaging feature. Trade is its own game.**

No one has cracked digital trading for physical collectibles. Vitrine's Trade UI will be a dedicated, first-class product surface -- not negotiation buried in a chat thread.

### The Fantasy Football Analogy

- Open the Trade UI: **your assets on one side, their assets on the other**
- Drag, stack, build your offer, eyeball the value balance
- **Strategy and psychology** -- "if I throw in this card, the deal tips"
- Propose → anticipation → accept / counter / decline
- Counter-offers create a **negotiation loop** with its own momentum and UI
- Users feel like big-time sharps, wheeling and dealing

### How Trade Connects to Everything Else

**Entry points are everywhere because the item carries its own intent:**

The status system (FS, FT, FST) already declares trade availability. No conversation needed to establish intent. A user sees an item marked FT, taps "Trade," and they're in the Trade UI with that item pre-loaded on one side.

Trade can originate from:
- Collectible detail card (Trade button visible when status is FT or FST)
- Group post with a shared item (Trade CTA on the card)
- Item shared in a DM (Trade CTA on the in-chat card)
- Profile browsing (tap someone's FT item → Trade UI)
- Explore/search results (eventually)

**DMs are optional, not required.** Some people will chat first, some will go straight to trade. The flow doesn't depend on conversation.

### Trade → Transaction

When both sides accept a trade proposal, it becomes a **transactable two-sided order.** This is where Vitrine takes a transaction fee and revenue is generated. The trade experience flows into the payment/fulfillment infrastructure (to be designed later).

A summary card drops into the DM thread (if one exists between the parties) as a passive record: "Trade completed" with details.

---

## Current State: What Exists Today

### File Inventory

| File | Lines | Role |
|---|---|---|
| `components/community-hub.tsx` | 959 | Community tab: discover + your groups |
| `components/messages-hub.tsx` | 929 | DM inbox + group carousel |
| `components/conversation-thread.tsx` | 807 | Chat thread (DM + group shared) |
| `components/new-message.tsx` | 590 | New DM composer (user search) |
| `components/group-info.tsx` | 972 | Group detail/member screen |
| `components/create-group.tsx` | 341 | Group creation orchestrator |
| `components/groups/*` | 7 files | Group creation sub-components |
| `lib/api/messaging.ts` | ~740 | Messaging API client (Edge Functions) |
| `hooks/use-messaging-realtime.ts` | — | Realtime subscription hook |
| `lib/mock-communities.ts` | ~190 | Mock data (still used in some routes) |

### Known BEST_PRACTICES Violations

| Violation | Files |
|---|---|
| Component over ~400 lines | `community-hub.tsx`, `messages-hub.tsx`, `conversation-thread.tsx`, `group-info.tsx` |
| `ActivityIndicator` instead of skeleton | All 5 major components |
| Hardcoded colors (`rgba(...)`, `#161618`) | All 5 major components |
| Mock data in production routes | `app/community/[id]/index.tsx`, `app/community/[id]/info/index.tsx`, `invite-members-section.tsx` |
| Inconsistent notification badge colors | `messages-hub.tsx` group badges use `colors.primary` instead of `colors.attention` |

### Key Gaps

| Gap | Impact |
|---|---|
| No collectible/showcase sharing in chat | Collectors can't share items — the core interaction pattern |
| No media/attachment sending in chat | Text-only messaging |
| No message actions (reply, react, copy, delete) | API supports these, UI doesn't |
| No message pagination | Fixed 50-message fetch, no "load more" |
| No message requests / filtered inbox | API supports `is_accepted`, UI ignores it |
| Group carousel duplicated in Messages | Confusing IA, inconsistent rendering |
| No recent contacts in New Message | Cold search only |
| No structured post types in groups | All content is chat messages, no rich posts |
| Plain ScrollView for messages | Should be inverted FlatList for performance |
| Typing indicator dots don't animate | Static opacity dots |

---

## Vitrine Pro — The Amplifier, Not the Paywall

### Philosophy

Vitrine Pro is a micro-subscription designed as a **value amplifier**, never a gate. The free tier includes everything that drives network effects -- collection management, social, buying, selling, trading. Pro offers enhanced capabilities for power users. The goal: 3 years from now, it would feel weird for a semi-regular Vitrine user to NOT have Pro, the same way it feels weird to use Amazon without Prime.

**Core principle:** Never degrade the free experience to push Pro. Let the free tier be genuinely great (it's the growth engine). Pro converts through accumulated value, not artificial friction.

### V1 Launch — No Pro Tier

V1 ships with **no Pro subscription, no payment flow, no entitlement gating.** All features are free. This maximizes early adoption and lets users fall in love with the platform before being asked to pay for anything.

**However:** Two features that will eventually become Pro-gated are being **built in this pass but shipped dark (turned off):**

1. **Smart Showcasing** — fully functional, hidden from V1 UI. Ready to gate when Pro launches.
2. **Private group creation** — fully functional, hidden from V1 UI. Ready to gate when Pro launches.

This eliminates scope debt for V2. When Pro launches, these features are flipped on behind the paywall — no additional development needed.

### V2 Launch — Pro Ships with Marketplace

Pro launches alongside the marketplace in V2, when the value stack is deep enough to justify a subscription on day one.

**Confirmed Pro features (V2):**

| Feature | Detail |
|---|---|
| Smart Showcasing | Rule-based auto-updating showcases. Free users get manual only. |
| Private group creation | Creating private groups requires Pro. Joining them stays free. |
| Collection export | CSV/JSON export with full metadata, values, tags, categories. |
| Discounted marketplace fees | Pro members pay reduced transaction fees. Specifics TBD. |
| AI-powered tools | Specifics TBD. Workshopped closer to V2. |
| Advanced tracking/alert customization | Granular thresholds, frequency controls, similarity tuning. Likely ties into AI tooling. |

**Confirmed NOT Pro-gated (always free):**

| Feature | Reasoning |
|---|---|
| Trading | Open to all — network effects require maximum participation |
| Bulk upload | Standalone PWA for desktop CSV import — onboarding tool, not a premium feature |
| Dynamic pricing modes | Marketplace enabler — sophisticated listings make the marketplace better for everyone |
| Collection management | Unlimited items, unlimited showcases (manual) |
| All social features | Groups, DMs, community — the growth engine |
| Buying and selling | Core marketplace participation must be frictionless |
| Basic tracking and alerts | Core utility |
| QR sharing, profile stats | Virality and identity should never be gated |

### Revenue Model Summary

| Revenue Stream | Timing | Detail |
|---|---|---|
| Vitrine Pro subscriptions | V2 launch | Micro-subscription, additive value. Price point TBD (should feel trivial relative to collectible values). |
| Marketplace transaction fees | V2 launch | Fee on buy/sell transactions. Pro members get discounted rate. |
| Trade execution fee | V2 launch | Fixed fee on completed trades. Specifics TBD. |
| Vitrine Hub (Verification Network) | TBD | Brick-and-mortar verification service. App-side implications for order tracking and dynamic fee generation. Detail to be documented separately. |

### Technical Implementation: RevenueCat

Subscription tier management will use **RevenueCat** for entitlement control. This provides:
- Apple/Google subscription receipt validation
- Cross-platform entitlement sync (native app + PWA share the same Pro status)
- API-based entitlement checks (a `useEntitlements()` hook on the app side queries RevenueCat to determine what a user can access)
- Analytics on conversion, churn, and trial performance

This is **not built for V1** but is the confirmed infrastructure choice for V2 Pro launch.

### Early Adopter Grandfathering

Users who used Smart Showcasing, private group creation, and export for free during V1 will receive a grandfathering offer (discounted rate, extended trial, or loyalty perk) when these features move behind the Pro gate in V2. Early adopters should feel rewarded, not punished.

---

## What's NOT In Scope for This Build

These are intentionally deferred and should not be designed or built now:

- Trade UI (dedicated product surface — future build)
- Buy/Sell transaction flow
- Payment infrastructure
- Marketplace listing creation from groups
- Advanced moderation tools (flag as counterfeit, etc.)
- Group channels (sub-threads within a group — V2+ if needed)
- Pro subscription infrastructure (payment, entitlements, gating UI)
- Vitrine Hub integration (verification flow, order tracking)

---

*Last updated: Feb 20, 2026*
