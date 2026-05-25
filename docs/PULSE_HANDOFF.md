# PULSE Lens — Engineering Handoff

> **Purpose:** Wire the Market Pulse lens to Vitrine's `pulse` engine. Specifies the proxy Edge Function contract, the persisted JSONB shape, the **30-day staleness model**, the eight PULSE lens states, and per-zone UI guidance with field mappings.
>
> **Scope:** Backend (one new Edge Function on the collector Supabase) + Native (extend `pulse-lens.tsx` to handle generation + report rendering states + freshness UI). Engine-side work is complete and deployed — this doc is the contract for hooking it in.
>
> **Design frameworks applied:** iOS HIG, Refactoring UI, Hook Model, V3 lens architecture, the existing `enqueue-extraction` proxy pattern.
>
> **Created:** 2026-05-21
>
> **Engine version at time of writing:** `pulse-v2` (deployed to `pulse` Edge Function). Persistence shape: `pulse_report.version: 2`.
>
> **Companion doc:** [`AAR_HANDOFF.md`](./AAR_HANDOFF.md) — same proxy pattern, same lens scaffold, different engine. Read both together; they share architectural conventions.

---

## 1. What Pulse Is

Market Pulse is Vitrine's live secondary-market intelligence lens. The user is shown four classified signal axes (depth, absorption, price direction, seller consensus) plus pricing percentiles and a market-depth count, derived from a live eBay scan run at "Generate" time.

**Critical differences from AAR (be explicit about these in the UI):**

| Dimension | AAR | Pulse |
|---|---|---|
| AI involved? | Yes — Gemini 3.1 Pro | **No** — fully deterministic |
| Inputs | Photos + signer | Classification + filter traits |
| Latency | ~25–35 s | **~3–8 s** |
| Eligibility gate | `is_autographed` | Any collectible with classification + anchor |
| Result freshness model | Generate once, regenerate on demand | **Auto-stales after 30 days** |
| Engine ships prose? | Yes (rationales, summary, recommendation) | **No — data only; app composes all copy** |
| Persistence column | `collectibles.autograph_assessment` | `collectibles.pulse_report` |

The engine deliberately ships **structured data only**: no headline, no section narratives, no disclaimer. All copy is composed client-side from the four signal enums and the depth/pricing data. This is intentional — the design team should own voice, the engine should own classification. The test harness's `PulseDeviceCard` is a reference implementation of one valid composition; treat it as a starting point, not a spec.

The lens lives at:

```9:21:apps/native/components/detail/lenses/pulse-lens.tsx
/**
 * PULSE lens — market intelligence surface.
 *
 * V1 ships with two states:
 *   - Non-Pro:  `LensPaywallCard` selling "Market Pulse" with the
 *               semantic-green accent (live/active feel).
 *   - Pro:      `LensComingSoon` placeholder until the pulse pipeline
 *               ships its first reports.
 *
 * When the pipeline lands, the body switches from `LensComingSoon` to
 * the real report — chrome, paywall card, and lens architecture all
 * stay stable.
 */
```

Today it has two states (paywall, coming-soon). This doc adds **six more** (empty/Generate, generating, insufficient data, error, fresh report, stale report) and converts the lens into a full data-driven surface with a first-class staleness model.

---

## 2. The Eligibility Gate

Unlike AAR (which needs `is_autographed`), Pulse runs on almost any extracted collectible — but it still requires enough signal in the classification to build a meaningful query. The same gate logic the test harness uses (`derivePulseInputs` in [`test-harness/src/lib/pulse.ts`](../../vitrinedb/test-harness/src/lib/pulse.ts)) needs to be ported server-side.

**The rule:** a collectible is Pulse-eligible if it has a `classification.collectible_type` AND **either**:

- A trusted signer (`is_autographed === true` + `signer_evidence ∈ {legible_signature, printed_on_certificate, title_provided, converged_visual_signals}` + non-empty `signer_name`), **OR**
- An anchor field on `filter_traits` — at least one of `subject[]` / `franchise` / `item_type` / `maker`

If neither condition holds, the lens shows a "Not enough data to generate Pulse" state and no Generate button. This should be rare in practice — almost everything that makes it through extraction has either a signer or an anchor — but the lens needs the branch.

---

## 3. User-Facing Flow

```
User navigates to PULSE lens
         │
         ▼
┌─────────────────────────┐
│ Is the viewer Pro?      │
└──────┬──────────────────┘
       │ no  → LensPaywallCard            (existing)
       │ yes
       ▼
┌─────────────────────────┐
│ Is the collectible      │
│ Pulse-eligible?         │  (see §2)
└──────┬──────────────────┘
       │ no  → NotEligibleState            (new)
       │ yes
       ▼
┌─────────────────────────┐
│ Does the row have a     │
│ pulse_report?           │
└──────┬──────────────────┘
       │ no  → "Generate" empty state
       │       (user taps GENERATE)
       │           │
       │           ▼
       │       Loading state (~5s)
       │           │
       │           ▼
       │       ┌─────────────────────┐
       │       │ Proxy response      │
       │       └──┬─────┬─────┬──────┘
       │          │     │     │
       │          ▼     ▼     ▼
       │       success  insufficient  error
       │          │     │     │
       │          │     ▼     ▼
       │          │   Insufficient  Error/Retry
       │          │   data state    state
       │          ▼
       │       Row gets pulse_report written
       │          │
       ▼          ▼
   ┌──────────────────────────────┐
   │ Is now() - ran_at > 30 days? │  (computed every render)
   └─────┬────────────────────────┘
         │ no  → Fresh report (State 7)
         │ yes → Stale report (State 8) — same body, "Refresh" banner on top
```

The **fresh vs. stale** branch is the load-bearing UX difference vs. AAR. AAR can sit for months without revisiting — a signature pattern doesn't change. Pulse is a snapshot of a live market; a 60-day-old read on a hot Pokémon card is potentially misleading. The lens shows the cached data immediately (no wait), but layers a freshness affordance on top that escalates as the data ages.

---

## 4. Architecture: Mirror the Extraction Pattern (Again)

Same pattern as AAR (and `enqueue-extraction` before it): a thin proxy Edge Function on the collector Supabase that validates the user, derives engine inputs from the row, and forwards to the engine. Synchronous. No webhook.

### The pattern at a glance

| | AAR (`enqueue-quick-opinion`) | Pulse (`enqueue-pulse`) |
|---|---|---|
| Mobile proxy call | `enqueue-quick-opinion` | `enqueue-pulse` |
| Engine endpoint | `…/quick-opinion` | `…/pulse` |
| Engine auth | `Bearer ${ENGINE_SHARED_SECRET}` | same |
| Sync or async | sync (~30 s) | **sync (~5 s)** |
| Persisted column | `collectibles.autograph_assessment` | `collectibles.pulse_report` |
| Freshness model | none | **30-day TTL** |
| Image inputs | yes | none |

### Why a separate proxy (don't reuse `enqueue-quick-opinion`)

- Different eligibility gate (`derivePulseInputs` vs. `deriveQuickOpinionInputs`).
- Different request shape (no images, different `filter_traits` fields).
- Different write target (`pulse_report` vs. `autograph_assessment`).
- Different rate-limit characteristics (Pulse is cheap and the 30-day TTL naturally caps regenerations).
- Different error semantics (Pulse can return `INSUFFICIENT_DATA` for legitimately empty markets; AAR returns `insufficient_references` for thin signer pools).

The two proxies will share helper modules (auth, ownership check, engine-call boilerplate) — just don't fork the routing.

---

## 5. The Proxy Edge Function: `enqueue-pulse`

Lives at `supabase/functions/enqueue-pulse/index.ts` on the collector Supabase.

### Endpoint

```
POST {SUPABASE_URL}/functions/v1/enqueue-pulse
```

### Request

```
Headers:
  Authorization: Bearer <user JWT>
  apikey:        <SUPABASE_ANON_KEY>
  Content-Type:  application/json

Body:
  {
    "collectibleId": "col-1747842847-abc123def",
    "forceRegenerate": false   // optional, default false
  }
```

`forceRegenerate` is the only field a client controls. When `true`, the proxy will call the engine even if a fresh (<30 day) report already exists. When `false` (default), the proxy short-circuits and returns the cached report. This means the same endpoint serves both "first generation" and "refresh stale" — the client decides which based on local state.

### Server-side processing

1. **Auth** — `verify_jwt: true` in `config.toml`. Resolve `auth.users.id → public.users.id`.
2. **Ownership** — `select id, user_id, classification, filter_traits, traits, trait_metadata, pulse_report from collectibles where id = $1`. Reject 403 if `user_id !== profile.id` AND `forceRegenerate === true` (visitors can read but cannot regenerate).
3. **Short-circuit on fresh cache** — if `forceRegenerate === false` and `pulse_report?.ran_at` is within 30 days, return `{ status: "cached", pulse_report }` immediately without calling the engine. This is the hot path — should fire on the majority of lens opens after first generation.
4. **Eligibility** — port `derivePulseInputs` server-side (§2). Reject 422 (`not_pulse_eligible`) if the gate fails.
5. **Engine call** — POST to the engine with `Bearer ${ENGINE_SHARED_SECRET}`:

```typescript
const enginePayload = {
  collectible_id: collectible.id,
  classification: derivedInputs.classification,
  filter_traits: derivedInputs.filter_traits,
  traits: derivedInputs.traits,
  signer_name: derivedInputs.signer_name,  // null when not signer-anchored
};
```

6. **Response handling** — engine returns `status: "success"` (HTTP 200) or a structured error (`INSUFFICIENT_DATA`, `EBAY_API_ERROR`, `BAD_REQUEST`, `INTERNAL_ERROR`).
7. **Persistence (success only)** — write the entire `pulse_report` to the collectibles row:

```typescript
await admin
  .from('collectibles')
  .update({
    pulse_report: engineResponse.pulse_report,
    updated_at: new Date().toISOString(),
  })
  .eq('id', collectibleId);
```

8. **Return to client** — see response shapes below.

### Response shapes (proxy → client)

```typescript
// Fresh cache hit (no engine call made)
{
  status: "cached",
  collectibleId: string,
  pulse_report: PulseReport,
  cachedAgeMs: number,           // now - ran_at, for UI freshness chip
}

// Newly generated (or force-regenerated)
{
  status: "success",
  collectibleId: string,
  pulse_report: PulseReport,
}

// Validation error
{
  status: "error",
  code: "not_owner" | "not_pulse_eligible" | "collectible_not_found",
  message: string,
}

// Engine "we can't read this market" outcome — NOT a transient failure
{
  status: "insufficient_data",
  collectibleId: string,
  message: string,
}

// Engine/upstream transient error (safe to retry)
{
  status: "error",
  code: "engine_timeout" | "engine_unavailable" | "ebay_api_error" | "internal_error",
  message: string,
}
```

### HTTP status mapping

| Proxy status | HTTP code |
|---|---|
| `cached` | 200 |
| `success` | 200 |
| `insufficient_data` | 200 (legitimate outcome, not an error) |
| `error.code = not_owner` | 403 |
| `error.code = not_pulse_eligible` / `collectible_not_found` | 422 |
| `error.code = engine_timeout` | 504 |
| `error.code = engine_unavailable` / `ebay_api_error` | 502 |
| `error.code = internal_error` | 500 |

### Note on `status: "cached"` vs. `status: "success"`

These are distinguished on the wire so the client can differentiate "the engine just ran for you" from "we're handing you stored data." The lens behaviour is identical for both — the field exists mainly for logging/analytics. The mobile types can collapse them into a single discriminated union if it simplifies the call site.

---

## 6. The 30-Day Freshness Model — In Detail

This is the load-bearing UX concept that distinguishes Pulse from AAR.

### Why 30 days

The engine's design assumes markets evolve continuously. A pulse_report is a snapshot of asks at a single moment; after a month, the underlying inventory has likely turned over and the four signals can be materially different. The engine doc states this explicitly:

```9:11:vitrinedb/supabase/functions/pulse/index.ts
 * Pulse is a market-intelligence brief generator. It is fully deterministic
 * — no AI in v1 — and stateless. The engine returns a `pulse_report` JSONB
 * payload; the Collector App is responsible for persistence (column:
 * `collectibles.pulse_report`) and for the 30-day cache TTL.
```

The 30-day TTL is the **app's** policy, not the engine's. The proxy short-circuits at 30 days; the lens UI escalates freshness messaging at 30 days. If the team ever wants to change the TTL (e.g., 14 days for high-velocity card markets, 60 days for slow memorabilia categories), the change lives in the proxy and the lens — the engine remains stateless.

### Freshness states

Computed client-side from `pulse_report.ran_at`:

| Age | State | Lens treatment |
|---|---|---|
| `< 7 days` | **Hot** | Render report normally. Subtle "Generated 3d ago" footer. |
| `7–29 days` | **Aging** | Render report normally. Footer reads "Generated 18d ago — still current." |
| `≥ 30 days` | **Stale** | Render report with a **dismissable banner** at the top: "This Pulse is 47 days old. Markets move — refresh for a current read." with a `REFRESH` CTA. |
| Generation in progress | **Refreshing** | Show the existing report dimmed at 60% opacity, with a small overlay spinner + "Refreshing Pulse…" copy. |

The user is never blocked by staleness — the cached data renders immediately on lens open, and the user can dismiss the stale banner and continue reading the old data if they choose. The banner reappears on next lens open until they refresh.

### Cache-bypass mechanics

- Default lens-open behaviour: call `enqueue-pulse` with `forceRegenerate: false`. Proxy returns cached OR fresh (server decides). Lens renders whatever it gets.
- Refresh-tap behaviour: call with `forceRegenerate: true`. Proxy always hits the engine.
- The proxy enforces ownership for `forceRegenerate: true` calls only; cached reads are visible to visitors too.

### Snapshot diffing (future)

The engine team explicitly designed `pulse_report` for snapshot diffing — same top-level keys, same bucket geometry, stable enum vocabularies. The current schema does NOT store history (each regeneration overwrites), but if the team later wants "Pulse trend" features (e.g., "Median ask is up 18% since 30 days ago"), the persistence layer can be evolved to a `pulse_snapshots` side table without changing the engine contract.

Open question for the product team: do we want to keep the previous `pulse_report` in a sibling column (`previous_pulse_report`) on regeneration so the lens can render a quick "since last refresh" delta? Cheap to implement, useful for power users. Not blocking V1 — flagged in §10.

---

## 7. The Persisted JSONB Contract (`collectibles.pulse_report`)

Engine-side: [`vitrinedb/supabase/functions/pulse/schemas.ts`](../../vitrinedb/supabase/functions/pulse/schemas.ts).
Mirror: [`vitrinedb/test-harness/src/lib/pulse.ts`](../../vitrinedb/test-harness/src/lib/pulse.ts).
Recommend a clean type module at `apps/native/lib/api/pulse.ts` that mirrors the same shape.

### Top-level

```typescript
interface PulseReport {
  version: 2;                               // schema version; bump on breaking changes
  ran_at: string;                           // ISO 8601 — drives the freshness model
  signals: PulseSignals;                    // the four classified enum axes
  depth_state: PulseDepthState;             // "pricing_available" | "limitations_only"
  market_depth: PulseMarketDepth;           // counts + coverage (always present)
  pricing: PulsePricing | null;             // null when depth too low for percentile math
  classification_reasons: PulseClassificationReasons;
  source: PulseSource;
  window: PulseWindow;                      // bucket geometry for the time-series view
  meta: { elapsed_total_ms: number };
}
```

### `signals` — the four classified axes

These are the load-bearing fields the UI surfaces as chips. Every axis is an enum string, including a `not_applicable` slot for axes that depth makes meaningless.

```typescript
interface PulseSignals {
  depth: "unicorn" | "thin" | "sparse" | "active" | "deep";
  absorption: "healthy" | "moderate" | "stagnant" | "not_applicable";
  price_direction: "firming" | "stable" | "softening" | "not_applicable";
  seller_consensus: "tight" | "moderate" | "wide" | "not_applicable";
}
```

**Depth bands** (load-bearing — the lens needs to respect them for branch logic):

| Tier | Total reported by eBay | Pricing surface? |
|---|---|---|
| `unicorn` | ≤ 1 | No — limitations only |
| `thin` | 2–4 | No — limitations only |
| `sparse` | 5–15 | Yes |
| `active` | 16–50 | Yes |
| `deep` | > 50 | Yes |

When `depth ∈ {unicorn, thin}`, `pricing` is `null` AND `absorption`/`price_direction`/`seller_consensus` are all forced to `not_applicable`. The lens has to handle the "limitations only" body shape explicitly — see Zone D in §9.

**Absorption** = fresh-bucket count vs. oldest-bucket count (ratio). `healthy` = new listings outpacing old 2:1+; `stagnant` = old outnumbering fresh 2:1+.

**Price direction** = fresh-bucket median vs. baseline (avg of 91–180d + 181–365d). ±10% band defines `stable`.

**Seller consensus** = IQR/median of the fresh bucket. <20% = tight, 20–50% = moderate, >50% = wide.

### `depth_state` — render hint

```typescript
type PulseDepthState = "pricing_available" | "limitations_only";
```

Deterministic from `signals.depth`. The lens uses this to decide which body cards to render. Exposed as its own field so the UI never has to re-implement the depth → renderability rule.

### `market_depth` — always present

```typescript
interface PulseMarketDepth {
  total_reported_by_marketplace: number;    // eBay's reported total
  sample_in_window: number;                 // listings actually pulled & bucketed
  coverage: "complete" | "capped";          // "capped" = we hit the 600-listing pagination ceiling
  fresh_count: number;                      // count in the 0-30d bucket
  baseline_count: number;                   // 91-180d + 181-365d combined
}
```

`coverage: "capped"` is a UI hint that the displayed sample is incomplete — useful for very deep markets (e.g., 5000+ listings for a Topps Chrome card). Worth surfacing as a small "sample capped" chip when present.

### `pricing` — nullable

```typescript
interface PulsePricing {
  currency: "USD";
  overall: PulsePricePercentiles;           // all priced listings in 365d window
  fresh: PulseFreshWindow;                  // 0-30d bucket
  baseline: PulseBaselineWindow;            // 91-365d combined
  fresh_vs_baseline: { median_delta_pct: number | null };
}

interface PulsePricePercentiles {
  median: number | null;
  p25: number | null;
  p75: number | null;
  iqr_pct: number | null;                   // (p75 - p25) / median * 100
}

interface PulseFreshWindow extends PulsePricePercentiles {
  range: "0-30d";
  count: number;
}

interface PulseBaselineWindow extends PulsePricePercentiles {
  range: "91-365d";
  count: number;
}
```

**Currency is USD-only in v2**, period. The pipeline drops non-USD listings before bucketing because mixing currencies would distort percentile math. When the team adds non-US marketplaces, this becomes a per-marketplace currency expectation. For now: render everything as `$X,XXX`.

### `classification_reasons` — transparency

```typescript
interface PulseClassificationReason {
  input: string;                            // e.g., "fresh_median / older_baseline_median - 1"
  value: number | null;                     // computed value, rounded
  band: string;                             // e.g., ">= +10%" or "not_applicable_low_depth"
  tier: string;                             // matches signals[axis]
}

interface PulseClassificationReasons {
  depth: PulseClassificationReason;
  absorption: PulseClassificationReason;
  price_direction: PulseClassificationReason;
  seller_consensus: PulseClassificationReason;
}
```

Per-axis "why we said this." Surface in an expandable "How we got here" section (Zone G) for users who want the math.

### `source` — provenance

```typescript
interface PulseSource {
  marketplace: "ebay";
  query: string;                            // the actual search string used
  ladder_tier: "surgical" | "broader";      // surgical = narrowest query that returned hits
  pages_fetched: number;
}
```

- `query` is useful to show in a small footer — gives the user confidence the search is comparable.
- `ladder_tier: "broader"` means the surgical query came back empty and we fell back. This is a useful caveat to surface as a chip ("Broadened search").

### `window` — bucket geometry

```typescript
interface PulseWindow {
  bucketed_at: string;
  window_days: 365;                         // fixed
  buckets: PulseBucket[];                   // exactly 5 entries
}

interface PulseBucket {
  range: "0-30d" | "31-60d" | "61-90d" | "91-180d" | "181-365d";
  max_days: number;
  count: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
}
```

This is what drives the optional time-series chart. The buckets are always in this order; never reorder. The five bucket boundaries are intentionally non-uniform (tighter near "fresh", wider in "baseline") because trader interest in pricing concentrates around recent listings.

### `meta`

```typescript
interface PulseMeta {
  elapsed_total_ms: number;                 // engine-side duration
}
```

Engineering observability. Surface in the Zone H footer if you want a "ran in 4.2s" microcopy.

### Real-world example (active market — Pokémon Charizard 2021)

```json
{
  "version": 2,
  "ran_at": "2026-05-21T15:18:22.901Z",
  "signals": {
    "depth": "deep",
    "absorption": "moderate",
    "price_direction": "softening",
    "seller_consensus": "moderate"
  },
  "depth_state": "pricing_available",
  "market_depth": {
    "total_reported_by_marketplace": 287,
    "sample_in_window": 248,
    "coverage": "complete",
    "fresh_count": 41,
    "baseline_count": 132
  },
  "pricing": {
    "currency": "USD",
    "overall": { "median": 84, "p25": 52, "p75": 138, "iqr_pct": 102.4 },
    "fresh":   { "range": "0-30d",   "count": 41,  "median": 72,  "p25": 45, "p75": 119, "iqr_pct": 102.8 },
    "baseline":{ "range": "91-365d", "count": 132, "median": 91, "p25": 58, "p75": 142, "iqr_pct": 92.3 },
    "fresh_vs_baseline": { "median_delta_pct": -20.88 }
  },
  "classification_reasons": {
    "depth":            { "input": "total_reported_by_marketplace",            "value": 287,     "band": "> 50",        "tier": "deep" },
    "absorption":       { "input": "fresh_count / oldest_count",               "value": 0.683,   "band": "0.5 - 2.0",   "tier": "moderate" },
    "price_direction":  { "input": "fresh_median / older_baseline_median - 1", "value": -0.209,  "band": "<= -10%",     "tier": "softening" },
    "seller_consensus": { "input": "fresh_iqr / fresh_median",                 "value": 1.028,   "band": ">= 50%",      "tier": "wide" }
  },
  "source": {
    "marketplace": "ebay",
    "query": "2021 Pokemon Evolving Skies Rayquaza VMAX Alt Art 218/203",
    "ladder_tier": "surgical",
    "pages_fetched": 3
  },
  "window": {
    "bucketed_at": "2026-05-21T15:18:21.000Z",
    "window_days": 365,
    "buckets": [
      { "range": "0-30d",   "max_days": 30,  "count": 41,  "median": 72,  "p25": 45, "p75": 119 },
      { "range": "31-60d",  "max_days": 60,  "count": 38,  "median": 78,  "p25": 49, "p75": 126 },
      { "range": "61-90d",  "max_days": 90,  "count": 37,  "median": 86,  "p25": 54, "p75": 134 },
      { "range": "91-180d", "max_days": 180, "count": 71,  "median": 89,  "p25": 56, "p75": 138 },
      { "range": "181-365d","max_days": 365, "count": 61,  "median": 93,  "p25": 60, "p75": 146 }
    ]
  },
  "meta": { "elapsed_total_ms": 4283 }
}
```

### Real-world example (thin market — niche signed item)

```json
{
  "version": 2,
  "ran_at": "2026-05-21T15:22:08.114Z",
  "signals": {
    "depth": "thin",
    "absorption": "not_applicable",
    "price_direction": "not_applicable",
    "seller_consensus": "not_applicable"
  },
  "depth_state": "limitations_only",
  "market_depth": {
    "total_reported_by_marketplace": 3,
    "sample_in_window": 3,
    "coverage": "complete",
    "fresh_count": 1,
    "baseline_count": 1
  },
  "pricing": null,
  "classification_reasons": { /* depth: thin band "2 - 4"; others: not_applicable_low_depth */ },
  "source": {
    "marketplace": "ebay",
    "query": "Mick Foley signed Cactus Jack ECW promo photo",
    "ladder_tier": "broader",
    "pages_fetched": 1
  },
  "window": { /* 5 buckets, sparse counts */ },
  "meta": { "elapsed_total_ms": 2891 }
}
```

The `pricing: null` + `depth_state: "limitations_only"` shape is the lens's signal to render the LimitationsCard path (Zone D) instead of the PricingCard path (Zone E).

---

## 8. PULSE Lens — All Eight States

### State 1 — Paywall (non-Pro)

**Trigger:** `isPro === false`
**Existing:** `<LensPaywallCard lensKey="PULSE" accent={colors.semanticGreen} ... />`
**No change.**

### State 2 — Not Eligible

**Trigger:** `isPro && !isPulseEligible(collectible)` (see §2 gate)

Same card chrome as `LensComingSoon` but with neutral messaging — the issue isn't that the feature isn't ready, it's that this particular collectible doesn't have enough classification data to query the market.

```
   PULSE · NOT ENOUGH SIGNAL
   CAN'T BUILD A MARKET QUERY

   We need a signer name or a subject/franchise to scan
   the market for comparable listings. This piece is
   missing both. Re-extracting with better photos may
   help.

         ╔═══════════════════════════╗
         ║   RE-RUN EXTRACTION       ║
         ╚═══════════════════════════╝
```

Optional CTA fires the existing `enqueue-extraction` flow. The two pipelines are independent; better extraction may unblock Pulse.

### State 3 — Empty / Generate (Pro + eligible + no report)

**Trigger:** `isPro && isPulseEligible && !collectible.pulseReport`

Mirror the AAR `Generate` card chrome, but use `semanticGreen` accent (the existing PULSE colour). Body copy emphasizes speed:

```
   PULSE · READY TO GENERATE
   LIVE MARKET BRIEF

   We'll scan the marketplace for comparable
   listings and surface market depth, pricing,
   and the four key signals. Takes about 5 seconds.

         ╔═══════════════════════════╗
         ║   GENERATE BRIEF          ║
         ╚═══════════════════════════╝
```

**Visitor branch:** "The collector hasn't run a Pulse on this piece yet."

### State 4 — Generating (in-flight)

**Trigger:** local component state from the moment the CTA is tapped.

Same chrome as State 3, but:
- Replace the glyph with a centered `<ActivityIndicator />` in `semanticGreen`
- Kicker: `PULSE · SCANNING`
- Title: `READING THE MARKET`
- Body: a single short message — `Pulling comparable listings and computing signals…`
- No step-cycling needed (the engine is fast enough that ~5s feels like one beat, not a sequence)
- Disable the CTA

### State 5 — Insufficient Data

**Trigger:** proxy returns `status === "insufficient_data"`

Distinct from "thin market" (`depth: thin` with `pricing: null` — still a successful report). This is the rarer case where the engine couldn't construct even a degenerate report — typically eBay returned zero candidates AND the depth classifier failed.

```
   PULSE · NO MARKET DATA
   COULDN'T COMPLETE THE READ

   The marketplace returned no comparable listings
   for this query. Try again in a few days as new
   inventory enters the market.

   ╔════════════╗  ╔═══════════════════╗
   ║  TRY AGAIN ║  ║  VIEW QUERY USED  ║
   ╚════════════╝  ╚═══════════════════╝
```

"View query used" expands a small disclosure showing the query string from the engine error (if surfaced) — helpful for QA but optional.

### State 6 — Error / Retry

**Trigger:** proxy returns `status === "error"` with a transient code (`engine_timeout`, `engine_unavailable`, `ebay_api_error`, `internal_error`)

Standard error card in `semanticRed`:

```
   PULSE · COULDN'T COMPLETE
   GENERATION INTERRUPTED

   {message — the proxy's error.message}

   ╔════════════════════════╗
   ║      TRY AGAIN         ║
   ╚════════════════════════╝
```

`ebay_api_error` is the most common transient — eBay's API has weekly micro-outages. Retry usually works within a minute.

### State 7 — Fresh Report (< 30 days old)

**Trigger:** `pulseReport != null && ageInDays(pulseReport.ran_at) < 30`

The full report renders — Zones A through H per §9. No banner, no friction. Footer shows "Generated {Nd} ago" in `textTertiary`.

### State 8 — Stale Report (≥ 30 days old)

**Trigger:** `pulseReport != null && ageInDays(pulseReport.ran_at) >= 30`

Same body as State 7, but a `StalenessBanner` lays on top:

```
┌──────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← amber accent rail
│  ⚠  This Pulse is 47 days old. Markets move —   │
│     refresh for a current read.                  │
│                                                  │
│     ╔══════════════════════╗                    │
│     ║   REFRESH PULSE      ║                    │
│     ╚══════════════════════╝                    │
└──────────────────────────────────────────────────┘
```

The banner is owner-only (visitors see the stale report without the Refresh CTA — they can't trigger regenerations on a collectible they don't own). The banner is **persistent across renders** until refreshed; dismissing it only suppresses it for the current scroll session.

Refresh tap → calls `enqueue-pulse` with `forceRegenerate: true` → enters State 4 (Refreshing variant: existing report at 60% opacity instead of empty card).

---

## 9. Report Layout — Zone-by-Zone Field Mapping

Same scroll envelope as AAR. Zones below are the body shape for States 7 and 8.

### Zone A — Composed Headline

The hero text. The engine ships **no headline string** — the lens composes one client-side from `signals` + `market_depth`. The test harness's `composeHeadline` is a reference implementation; the design team is free to rewrite the composition rules entirely.

**Field map:**
| Field | Source |
|---|---|
| Headline text | composed client-side from `signals` + `market_depth` |

**Suggested composition logic** (from [`PulseDeviceCard.tsx`](../../vitrinedb/test-harness/src/components/device/PulseDeviceCard.tsx)):

```typescript
function composeHeadline(signals, market_depth) {
  if (signals.depth === "unicorn") {
    return market_depth.total_reported_by_marketplace === 0
      ? "No active comparables found."
      : "Unicorn market — only one comparable.";
  }
  if (signals.depth === "thin") {
    return `Thin market — ${market_depth.total_reported_by_marketplace} comparables, signals unreliable.`;
  }
  // For sparse/active/deep:
  // "{Depth} market. {Consensus} consensus. {Direction} prices. {Absorption} absorption."
}
```

**Layout sketch:**

```
   PULSE                                              ← kicker, groteskBold 11px
   Deep market. Moderate consensus.                   ← composed headline, heroDisplay 18-22px
   Softening prices. Moderate absorption.
```

### Zone B — Signal Chips

The four classified axes, rendered as horizontal pills. This is the most "scannable" surface and should feel like the heart of the lens.

**Field map:**
| Chip | Source | Label suggestion |
|---|---|---|
| Depth | `signals.depth` | "Deep" / "Active" / "Sparse" / "Thin" / "Unicorn" |
| Absorption | `signals.absorption` | "Healthy absorption" / "Moderate" / "Stagnant" / "Absorption: n/a" |
| Price direction | `signals.price_direction` | "Firming prices" / "Stable" / "Softening" / "Direction: n/a" |
| Seller consensus | `signals.seller_consensus` | "Tight consensus" / "Moderate" / "Wide" / "Consensus: n/a" |

**Suggested colour map** (using existing tokens — feel free to retune):

| Tier value | Colour |
|---|---|
| `unicorn` | `traitViolet` (rare/special) |
| `thin` | `semanticOrange` (caution) |
| `sparse` | `traitOlive` (acceptable) |
| `active` | `semanticGreen` (healthy) |
| `deep` | `traitCyan` (robust) |
| `healthy` / `tight` / `firming` | `semanticGreen` |
| `moderate` / `stable` | `traitOlive` |
| `stagnant` / `wide` / `softening` | `semanticRed` |
| `not_applicable` (any axis) | `textTertiary` (muted) |

**Layout sketch:**

```
   ┌─DEEP─┐  ┌─MODERATE ABSORPTION─┐
   ┌─SOFTENING PRICES─┐  ┌─MODERATE CONSENSUS─┐
```

Wrap to multiple lines as needed. Tap on any chip → expand the corresponding `classification_reasons` entry inline (see Zone G).

### Zone C — Market Depth (always present)

Compact info card showing the breadth of the comparable set.

**Field map:**
| Field | Source |
|---|---|
| Headline number | `market_depth.total_reported_by_marketplace` |
| Sample-in-window | `market_depth.sample_in_window` |
| Fresh count | `market_depth.fresh_count` |
| Coverage chip | `market_depth.coverage === "capped"` → show "CAPPED" chip |

**Layout sketch:**

```
   MARKET DEPTH
   287 active comparables
   ┌────────┐ ┌────────┐ ┌────────┐
   │ ACTIVE │ │IN WINDW│ │FRESH 30│
   │  287   │ │  248   │ │   41   │
   └────────┘ └────────┘ └────────┘
   {composed depth narrative — see harness composer for reference}
```

When `coverage === "capped"`, append a small amber chip "Sample capped at 600" next to the headline.

### Zone D — Limitations (when `depth_state === "limitations_only"`)

**Trigger:** `depth_state === "limitations_only"` (i.e., `depth ∈ {unicorn, thin}`)

Replaces Zone E. Lays out a soft "not enough data" message in `semanticOrange`. The user still gets value (they see the depth count and know why pricing isn't being shown) without being misled by unreliable percentiles.

**Field map:**
| Field | Source |
|---|---|
| Limitations narrative | composed client-side from `signals.depth` + `market_depth.total_reported_by_marketplace` |

**Layout sketch:**

```
   ┌──────────────────────────────────────────────┐
   │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  ← amber accent rail
   │  LIMITED DATA                                │
   │  With only 3 active listings, Pulse cannot   │
   │  reliably assess absorption, price direction,│
   │  or seller consensus. Statistical signals    │
   │  require a more populated market.            │
   └──────────────────────────────────────────────┘
```

Reference composer: `composeLimitationsNarrative` in [`PulseDeviceCard.tsx`](../../vitrinedb/test-harness/src/components/device/PulseDeviceCard.tsx) lines 541–552.

### Zone E — Pricing (when `depth_state === "pricing_available"`)

**Trigger:** `depth_state === "pricing_available"` (i.e., `depth ∈ {sparse, active, deep}`)

The price percentile surface. Three stat tiles + a delta bar.

**Field map:**
| Tile | Median source | Range source |
|---|---|---|
| Overall median | `pricing.overall.median` | `pricing.overall.p25` / `pricing.overall.p75` |
| Fresh (30d) | `pricing.fresh.median` | `pricing.fresh.p25` / `pricing.fresh.p75` |
| Baseline (91–365d) | `pricing.baseline.median` | `pricing.baseline.p25` / `pricing.baseline.p75` |
| Delta indicator | `pricing.fresh_vs_baseline.median_delta_pct` | — |

**Layout sketch:**

```
   PRICING DYNAMICS
   {composed pricing narrative}
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ OVERALL      │ │ FRESH (41)   │ │ BASELINE(132)│
   │ $84          │ │ $72          │ │ $91          │
   │ $52–$138     │ │ $45–$119     │ │ $58–$142     │
   └──────────────┘ └──────────────┘ └──────────────┘

   Fresh vs. baseline median                  -20.9%
   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
                                   ░░░░░░░░░░  (red, leftward for softening)
```

Reference composer: `composePricingNarrative` in `PulseDeviceCard.tsx` lines 502–539. Reference delta bar: `DeltaBar` in `PulseDeviceCard.tsx` lines 403–435.

**Currency formatting:** always USD, always rounded to whole dollars in stat tiles, comma-separated. `formatPrice()` in the harness is `$${Math.round(n).toLocaleString("en-US")}`.

### Zone F — Time Series (optional, recommended)

The five bucket counts and medians, rendered as a sparkline or small bar chart. This is the zone that most justifies the engine shipping `window.buckets[]` — without it the buckets are decorative.

**Field map:**
| Series | Source |
|---|---|
| Bucket labels | `window.buckets[i].range` |
| Bucket counts | `window.buckets[i].count` |
| Bucket medians | `window.buckets[i].median` |

**Layout sketch (one possibility — dual-axis sparkline):**

```
   12-MONTH WINDOW
        $93   $89   $86   $78   $72        ← bucket medians
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓▓ ▓▓▓▓▓     ← bucket counts (height)
        61    71    37    38    41
       181d  91d  61d   31d  30d ago
```

Or simply five labelled rows in a tight grid. The design team owns this; the data is there to support any rendering they prefer.

### Zone G — How We Got Here (collapsible)

Expandable disclosure section that exposes `classification_reasons`. Off by default; toggled by a small `↓ See methodology` link.

**Field map:**
| Row | Source |
|---|---|
| Axis name | hard-coded ("Depth", "Absorption", "Price Direction", "Seller Consensus") |
| Input formula | `classification_reasons[axis].input` |
| Computed value | `classification_reasons[axis].value` |
| Band hit | `classification_reasons[axis].band` |
| Resulting tier | `classification_reasons[axis].tier` |

**Layout sketch:**

```
   HOW WE GOT HERE                                 ↑
   ┌──────────────────────────────────────────────┐
   │ Depth                                        │
   │   total_reported_by_marketplace = 287        │
   │   band: > 50  →  deep                        │
   │                                              │
   │ Absorption                                   │
   │   fresh_count / oldest_count = 0.683         │
   │   band: 0.5 – 2.0  →  moderate               │
   │                                              │
   │ Price Direction                              │
   │   fresh_median / older_baseline_median - 1   │
   │     = -0.209                                 │
   │   band: <= -10%  →  softening                │
   │                                              │
   │ Seller Consensus                             │
   │   fresh_iqr / fresh_median = 1.028           │
   │   band: >= 50%  →  wide                      │
   └──────────────────────────────────────────────┘
```

Monospaced numerics. `textSecondary` color. This is the "trust me, here's the math" surface — keep it dense and honest.

### Zone H — Source & Disclaimer Footer

A bottom-of-lens band with provenance + the app-owned disclaimer string. The engine no longer ships a disclaimer text (it's a legal/locale/marketing concern owned by the app).

**Field map:**
| Field | Source |
|---|---|
| Query string | `source.query` |
| Ladder tier chip | `source.ladder_tier === "broader"` → show "BROADENED" chip |
| Pages fetched | `source.pages_fetched` |
| Marketplace | `source.marketplace` (currently always "ebay") |
| Generation time | `meta.elapsed_total_ms` |
| Generated when | `ran_at` (formatted as relative time) |
| Disclaimer | hardcoded app string |

**Layout sketch:**

```
   SOURCE
   "2021 Pokemon Evolving Skies Rayquaza VMAX Alt Art 218/203"
   eBay · 3 pages · ran in 4.2s · Generated 18d ago

   ─────────────────────────────────────────────

   Pulse reflects active marketplace listings observed at the
   time of this snapshot. It is not a price guide, an appraisal,
   or Vitrine's opinion of value. Asking prices are not sold prices.
```

The disclaimer copy is a placeholder pulled from the harness — replace, A/B test, translate, or remove freely.

### Zone I — Refresh (owner only, always rendered)

Bottom-of-lens regenerate affordance. Different from the State 8 stale banner — this is always available, even when the report is fresh, for users who want a manual refresh.

```
                  ┌─────────────────────────┐
                  │   REFRESH PULSE         │   ← outline button
                  └─────────────────────────┘
```

Fires `enqueue-pulse` with `forceRegenerate: true`. While in flight, the entire lens transitions to State 4 (Refreshing variant — existing report dimmed at 60% with overlay spinner).

---

## 10. Implementation Checklist

### Backend (one new Edge Function)

- [ ] Add `pulse_report JSONB` column to `collectibles` table if not already present (`alter table collectibles add column if not exists pulse_report jsonb`)
- [ ] Create `supabase/functions/enqueue-pulse/index.ts` modelled on `enqueue-extraction`
- [ ] Wire `verify_jwt: true` in `supabase/config.toml`
- [ ] Port `derivePulseInputs` from `vitrinedb/test-harness/src/lib/pulse.ts` server-side
- [ ] Implement the 30-day cache short-circuit (`forceRegenerate === false && ran_at within 30d`)
- [ ] Add the engine call with a 30 s `AbortController` (Pulse is much faster than AAR; 30s is a generous buffer)
- [ ] On success, write `pulse_report` to the row via service role
- [ ] Return the proxy response shapes from §5 (distinguish `cached` / `success` / `insufficient_data` / `error`)
- [ ] Enforce ownership only on `forceRegenerate: true` paths (visitors can read cached reports)
- [ ] Deploy + smoke test with a known-eligible collectible

### Frontend (extend `pulse-lens.tsx`)

- [ ] Create `apps/native/lib/api/pulse.ts` with the V2 types from §7
- [ ] Create `apps/native/hooks/use-pulse.ts` — auto-fetches cached report on lens open with `forceRegenerate: false`; exposes `{ report, ageInDays, isStale, isLoading, error, refresh, generate }`
- [ ] Add `isPulseEligible(collectible)` helper that mirrors the server-side gate
- [ ] In the lens, branch on the eight states (§8)
- [ ] Implement the staleness UI: compute `ageInDays` from `report.ran_at`, render the `StalenessBanner` when ≥ 30, surface relative-time microcopy in Zone H
- [ ] Implement the Refreshing variant of State 4 (existing report dimmed at 60% opacity with overlay spinner) — fires on both Refresh tap and Stale banner tap
- [ ] After regeneration, update local state with the new `pulse_report` so the UI re-renders without a screen reload
- [ ] Test all eight branches via a debug toggle that synthesizes each state

### Composers (the design team's playground)

- [ ] Decide the production headline composition rule (the harness's is a starting point, not a spec)
- [ ] Decide the production limitations narrative (same)
- [ ] Decide the production pricing narrative (same)
- [ ] Decide the production disclaimer copy (engine no longer ships one)
- [ ] Decide whether Zone F (time series) ships in V1 or behind a "Show chart" toggle

---

## 11. Open Questions

1. **TTL tuning by collectible type.** 30 days is reasonable for memorabilia but possibly long for hot trading-card markets. Worth exploring per-`collectible_type` TTLs once we have analytics on regen rates. V1: hold at 30 days globally.
2. **Snapshot history.** Do we want to keep the previous `pulse_report` in a sibling column (`previous_pulse_report`) on regeneration so the lens can render a "since last refresh" delta on each signal axis? Cheap to add, valuable for power users tracking individual pieces. Flagged for the next iteration.
3. **Auto-regenerate on stale.** Should the lens silently kick off a background refresh when it detects stale data, and then animate the new data in when ready? Better UX, but adds a hidden cost (every owner viewing an old report triggers a fresh engine call). Conservative default: require manual refresh. Open to revisiting if engine costs stay low.
4. **Visitor staleness UI.** Visitors see stale reports without the refresh CTA. Do we show them the staleness banner at all (read-only, just the warning) or hide it entirely so they don't think the collector "neglected" the piece? Recommend: read-only banner with rephrased copy ("This Pulse is 47 days old — only the collector can refresh it").
5. **Insufficient-data alerting.** If a collectible repeatedly returns `insufficient_data`, the user has no actionable recourse. Worth capturing these in a server log so we can audit query quality and tune the surgical → broader ladder over time.
6. **Pricing currency expansion.** Once we support non-US marketplaces, the `pricing.currency` field becomes load-bearing for the UI. Today it's always "USD". The mobile types should already accept it as a string union for future-proofing.
7. **Sample-capped messaging.** When `coverage === "capped"`, the underlying market is probably much larger than the report reflects. Worth thinking about whether this affects how confident we present the signals — currently the lens just shows a "CAPPED" chip.

---

## 12. Reference: Engine Files

For deeper engine-side context:

| File | Purpose |
|---|---|
| `vitrinedb/supabase/functions/pulse/index.ts` | HTTP entrypoint, auth, request validation |
| `vitrinedb/supabase/functions/pulse/pipeline.ts` | Full pipeline: eBay search → bucket → classify → shape |
| `vitrinedb/supabase/functions/pulse/schemas.ts` | Wire types and persistence shape (`PulseReport`) |
| `vitrinedb/supabase/functions/_shared/pulse-query.ts` | eBay surgical-then-broader query ladder |
| `vitrinedb/supabase/functions/_shared/pulse-bucketer.ts` | 5-bucket geometry + percentile aggregation |
| `vitrinedb/supabase/functions/_shared/pulse-classifier.ts` | The four signal axes — depth/absorption/direction/consensus |
| `vitrinedb/test-harness/src/lib/pulse.ts` | Reference TypeScript types + `derivePulseInputs` gate |

For UI reference, the test harness components show one possible composition:

| File | Purpose |
|---|---|
| `vitrinedb/test-harness/src/components/device/PulseDeviceCard.tsx` | User-facing rendering — headline composer, signal chips, depth/pricing/limitations cards |
| `vitrinedb/test-harness/src/components/dev/PulseDevPanel.tsx` | Developer-facing diagnostics view — raw classification_reasons, full buckets, source provenance |

The `PulseDeviceCard.tsx` is **explicitly authored as a reference implementation** the production team is free to replace wholesale. Quote from its header: "Everything below the `// composers` section is local presentation code that the design team is free to replace wholesale. The shape of the underlying `PulseReport` is the only contract the engine guarantees."
