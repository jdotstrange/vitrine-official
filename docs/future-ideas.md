# Vitrine — Future Ideas

A living document for product vision, feature ideas, and design concepts worth exploring down the road.

---

## DNA System Expansion

The "Collector DNA" / "Showcase DNA" pattern is a signature Vitrine concept — a visual fingerprint of a collection's composition. Currently lives on the user profile (L1 categories) and showcase detail (L1 + L2 drill-down). Here's where it could go next:

### 1. Similar DNA Discovery
Match collectors whose profile DNA overlaps significantly. Surface as a discovery feed or recommendations section.
- "Collectors with similar DNA" on profile screens
- Weighted similarity score based on proportional category overlap (not just shared categories)
- Could power a "You might like" collector recommendation engine
- Potential UI: side-by-side DNA bars showing overlap highlighted

### 2. DNA Comparison View
Two DNA bars stacked vertically — your profile vs. another collector's. Instantly see overlap and divergence.
- Could surface as a subtle indicator on other users' profiles: "You share 73% DNA"
- Tappable to expand into a full comparison modal
- Useful for social features: "find collectors like me" or "discover what I'm missing"

### 3. Showcase Card Mini-Bar
A thin 3-4px DNA bar at the bottom of each showcase card in grid views. Even at thumbnail size, the color segments give a visual fingerprint.
- Lets users visually scan and group showcases by composition without reading titles
- Low implementation cost, high visual differentiation

### 4. DNA Evolution / Year in Review
Track how a collector's DNA shifts over time. Show change deltas as a timeline or animation.
- "In 2025 you were 80% Baseball / 20% Soccer. In 2026 you shifted to 60/25/15."
- Shareable "Year in Review" card — the kind of content collectors screenshot and post
- Requires historical snapshots (periodic or event-driven)

### 5. Community / Group DNA
Aggregate DNA of all members' collections within a group or community.
- Shows the collective personality of a group: "The Vintage Sports Group: 45% Baseball, 30% Football, 25% Basketball"
- Could highlight how an individual's DNA compares to the group average
- Useful for group discovery: "Find groups that match your DNA"

---

## Rankings System
- Collector rankings based on engagement metrics (tracks, showcases, community participation)
- Tiered system (Bronze/Silver/Gold/Platinum or themed tiers)
- Leaderboards per category (top Baseball collectors, top Card collectors, etc.)
- Removed from current UI but worth revisiting once engagement metrics mature

---

## Social Features
- Direct messaging between collectors
- Trade proposals with in-app negotiation flow
- Collection collaboration — shared showcases between multiple collectors
- Activity feed showing follows, new items, showcase updates from people you follow

---

## Marketplace
- In-app buying/selling with escrow
- Price history charts per item (like StockX)
- "Make an offer" flow
- Authentication/verification badges for high-value items

---

## Advanced Collection Tools
- Bulk import from CSV / spreadsheet
- Barcode / QR scanning for quick item lookup
- Insurance valuation reports (exportable PDF)
- Condition grading with photo documentation
- Duplicate detection across a user's collection

---

## Collection Analytics & Insights

Leverage `filter_traits` structured data to surface meaningful stats and trends about a collector's holdings.

- **Composition breakdown** — "Your collection spans 12 franchises, 8 item types, 47 unique subjects"
- **Top dimensions** — Top makers (Topps, Panini, Nike), top franchises, top subjects by count or value
- **Year distribution** — Histogram or timeline showing item concentration by year; highlight gaps ("No items from 1992–1995")
- **Value concentration** — Which franchise/maker/subject holds the most total value; diversification score
- **Trait insights** — % of collection that's autographed, graded, game-used; how that compares to market averages
- **Shareable cards** — "My Collection in Numbers" visual card for social sharing (similar to Spotify Wrapped energy)
- **Periodic digests** — Weekly/monthly email or push: "This week you added 3 items, portfolio value changed +$X"

Depends on broad `filter_traits` coverage across accounts to be meaningful at scale.

---

## Forms & Keyboard Polish — Migrate to `react-native-keyboard-controller`

Replace the hand-rolled `KeyboardAvoidingView` + `ScrollView` pattern (currently repeated across ~20 components) with [`react-native-keyboard-controller`](https://kirillzyusko.github.io/react-native-keyboard-controller/), the modern community standard for keyboard handling in React Native.

**Why it's the right move long-term:**
- RN core's `KeyboardAvoidingView` is well-known to be flaky — it can't track the keyboard's animation curve, can't follow interactive swipe-down dismissal, and behaves inconsistently between iOS and Android.
- The library wraps the same APIs but is backed by a native module that exposes the keyboard frame in real time, so animations are smooth, focused inputs auto-scroll into view, and gestures feel native.
- Used by Discord, Shopify Mobile, and recommended in the Expo docs.

**What we'd unlock:**
- **`KeyboardAwareScrollView`** — auto-scrolls the focused input into view with no manual offset math.
- **`KeyboardToolbar`** — the iOS-native sticky toolbar above the keyboard with prev/next field navigation and a "Done" button. Big polish win for any multi-field form (signup, complete-profile, key-details, pricing, etc.).
- **Gesture-driven dismissal** — swipe-down to dismiss the keyboard mirroring iMessage / Instagram DMs; especially valuable in messaging and post-composer surfaces.
- **Smoother transitions** — keyboard animations interpolate frame-by-frame instead of snap-in / snap-out.
- **One consistent solution app-wide** — kills the inconsistency drift across 20+ components manually wrangling KAV today.

**Why we're deferring:**
- Native module → not Expo Go-compatible. Requires moving to an Expo dev client build first (which we'll do anyway when we adopt other native modules).
- Not urgent — current `rapid-fire-edit.tsx` pattern (KAV `offset={0}` + `ScrollView` + docked footer) works well enough for now. Use that pattern as the holding solution everywhere keyboard handling matters.

**Migration plan when we're ready:**
1. Install `react-native-keyboard-controller` + add the Expo config plugin to `app.json`; rebuild dev client.
2. Wrap root in `<KeyboardProvider>` in `app/_layout.tsx` — single global wrapper enables everything.
3. Swap RN's `KeyboardAvoidingView` for the lib's version surface-by-surface (incremental, not big-bang).
4. Adopt `KeyboardAwareScrollView` for forms with many fields (complete-profile, signup, key-details, edit-info, pricing, post-composer).
5. Add `KeyboardToolbar` to multi-field forms for the prev/next/Done iOS-native polish pass.

---

*Last updated: May 2026*
