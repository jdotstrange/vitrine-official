# AAR Lens — Engineering Handoff

> **Purpose:** Wire the Autograph Assessment Report (AAR) lens to Vitrine's `quick-opinion` engine. Specifies the proxy Edge Function contract, the persisted JSONB shape, the seven AAR lens states, and per-zone UI guidance with field mappings.
>
> **Scope:** Backend (one new Edge Function on the collector Supabase) + Native (extend `aar-lens.tsx` to handle generation + report rendering states). Engine-side work is complete and deployed — this doc is the contract for hooking it in.
>
> **Design frameworks applied:** iOS HIG, Refactoring UI, Hook Model, V3 lens architecture (Philosophy B universal-visibility), the existing `enqueue-extraction` pattern.
>
> **Created:** 2026-05-21
>
> **Engine version at time of writing:** `vitrine-read-v4.0` (deployed to `quick-opinion` Edge Function, version 11). Persistence shape: `autograph_assessment.version: 4`.

---

## 1. What the AAR Is

The Autograph Assessment Report is Vitrine's signature-pattern analysis lens. The user is shown a deterministic "temperature bar" (0–100) with five colloquial buckets (`Looks off → Something feels off → Hard to tell → Looks pretty good → Looks right`), backed by an eight-checkpoint structured screen the AI ran on the signature.

It is **not** a forensic verdict. The voice is "Vitrine — a team of collectors who give honest, specific reads." The engine deliberately avoids banned vocabulary like `authentic`, `fake`, `verified`, `forgery`, etc. — the bar position and accompanying language carry the read.

The lens lives at:

```26:217:apps/native/components/detail/lenses/aar-lens.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Brackets, LensPaywallCard } from '@/components/vault';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

import { LensComingSoon } from './lens-coming-soon';
// ... existing three-state lens ...
```

Today it has three states: paywall (non-Pro), coming-soon (Pro + autographed), no-signature (Pro + not autographed). This doc adds **four more states** (empty/Generate CTA, generating, insufficient references, report rendered, error) and converts the lens from "static placeholder" into a full data-driven surface.

---

## 2. User-Facing Flow

```
User navigates to AAR lens
         │
         ▼
┌─────────────────────────┐
│ Is the viewer Pro?      │
└──────┬──────────────────┘
       │ no  → LensPaywallCard            (existing)
       │ yes
       ▼
┌─────────────────────────┐
│ Is the item autographed?│  (collectible.traits includes 'is_autographed')
└──────┬──────────────────┘
       │ no  → NoSignatureState            (existing)
       │ yes
       ▼
┌─────────────────────────┐
│ Does the collectible    │  (collectible.autographAssessment != null)
│ already have a report?  │
└──────┬──────────────────┘
       │ no  → "Generate" empty state
       │       (user taps GENERATE)
       │           │
       │           ▼
       │       Loading state (~30s)
       │           │
       │           ▼
       │       ┌─────────────────────┐
       │       │ Engine response     │
       │       └──┬─────┬─────┬──────┘
       │          │     │     │
       │          ▼     ▼     ▼
       │       success  insufficient  error
       │          │     │     │
       │          │     ▼     ▼
       │          │   Insufficient  Error/Retry
       │          │   refs state    state
       │          ▼
       │       Row gets autograph_assessment written
       │          │
       ▼          ▼
       Report rendered (Zones described in §7)
```

The user owns the item, so we don't gate generation behind the visitor branch — only the owner sees the Generate CTA. Visitors viewing someone else's collectible see the rendered report if one exists, otherwise the empty state without the CTA (the owner has to generate it first).

---

## 3. Architecture: Mirror the Extraction Pattern

The collector app already runs a production-tested proxy pattern for the extraction engine. The AAR call follows the same shape with one simplification — it's **synchronous** (single ~30 s round-trip) rather than async with webhook callbacks. That's the right fit because the user is staring at the lens waiting for the result; no value in backgrounding.

### The pattern at a glance

| | Extraction (existing) | AAR (proposed) |
|---|---|---|
| Mobile proxy call | `enqueue-extraction` | `enqueue-quick-opinion` |
| Engine endpoint | `nhshzyktaarbknzpsvtr.../queue-extraction` | `nhshzyktaarbknzpsvtr.../quick-opinion` |
| Engine auth | `Bearer ${ENGINE_SHARED_SECRET}` | same |
| Sync or async | async + HMAC webhook | **sync** (~30 s) |
| Result handoff | Engine → `looking-glass-webhook` → row | Proxy writes row inline, returns to client |
| Mobile observes via | Realtime subscription on row | Direct response from proxy |

### Why sync

- AAR generation is a single user-initiated action taken while the user is on the lens.
- Engine latency is ~25–35 s for warm isolates, ~60 s cold. Edge Function default timeout (150 s) covers the worst case.
- Eliminates the webhook + HMAC + Realtime observation surface that the extraction pipeline needs to support hand-off across screens.
- If the team later wants "regenerate in background" semantics, the proxy can be split into enqueue + webhook variants without breaking the client contract.

### Why a proxy at all (vs. direct engine call from mobile)

- Shared secret stays out of the mobile binary. The engine has no per-user auth; if the secret leaks, anyone can hammer the engine.
- Server-side ownership check: the proxy can refuse to generate for a collectible the caller doesn't own.
- Server-side input derivation: the proxy reads `signer_name`, `item_type`, `franchise`, `year`, `inscription_present` from the row itself rather than trusting client-supplied values. No risk of a tampered client requesting a McFarlane report on a Bryce Harper card.
- Server-side write: the proxy writes `autograph_assessment` with the service role. No RLS gymnastics on the client.

---

## 4. The Proxy Edge Function: `enqueue-quick-opinion`

Lives at `supabase/functions/enqueue-quick-opinion/index.ts` on the collector Supabase (same project as `enqueue-extraction`).

### Endpoint

```
POST {SUPABASE_URL}/functions/v1/enqueue-quick-opinion
```

### Request

```
Headers:
  Authorization: Bearer <user JWT>
  apikey:        <SUPABASE_ANON_KEY>
  Content-Type:  application/json

Body:
  {
    "collectibleId": "col-1747842847-abc123def"
  }
```

That's the entire payload. Everything else is derived server-side from the collectible row.

### Server-side processing

1. **Auth** — `verify_jwt: true` in `config.toml` does the JWT check; reject non-200 if absent. Then resolve `auth.users.id → public.users.id` the same way `enqueue-extraction` does.
2. **Ownership** — `select id, user_id from collectibles where id = $1`. Reject 403 if `user_id !== profile.id`.
3. **Eligibility** — confirm the row has `traits` containing `is_autographed`, and `trait_metadata.signer_name` is a non-empty string belonging to a trusted evidence class. The native test harness already encapsulates this gate as `deriveQuickOpinionInputs`; port that logic server-side. Reject 422 (`signer_not_extractable`) if the gate fails.
4. **Image URLs** — pull `photos[0..3]` (cap at 4, the engine's `MAX_INPUT_IMAGES`). Reject 422 (`no_images`) if empty.
5. **Engine call** — POST to the engine with `Bearer ${ENGINE_SHARED_SECRET}`:

```typescript
const enginePayload = {
  collectible_id: collectible.id,
  image_urls: collectible.photos.slice(0, 4),
  signer_name: traitMetadata.signer_name,
  item_type: filterTraits.item_type ?? traitMetadata.item_type,
  filter_traits: {
    franchise: filterTraits.franchise ?? null,
    year: filterTraits.year ?? null,
    maker: filterTraits.maker ?? null,
  },
  inscription_present: !!traitMetadata.inscription,
  existing_auth: null, // future: pass first authentications[] entry
};
```

6. **Response handling** — engine returns either `status: "success"` or `status: "insufficient_references"` (both HTTP 200), or an error (4xx/5xx).
7. **Persistence (success only)** — write the entire `autograph_assessment` blob to the collectibles row using the service-role client:

```typescript
await admin
  .from('collectibles')
  .update({
    autograph_assessment: engineResponse.autograph_assessment,
    updated_at: new Date().toISOString(),
  })
  .eq('id', collectibleId);
```

8. **Return to client** — pass through the engine response largely as-is (see §5).

### Response shape (proxy → client)

```typescript
// Success
{
  status: "success",
  collectibleId: string,
  autograph_assessment: AutographAssessmentPersist,  // the V4 blob (see §6)
}

// Insufficient references (engine ran, but couldn't find enough comps)
{
  status: "insufficient_references",
  collectibleId: string,
  message: string,           // "Only N authenticated reference listings were available..."
  gatePassCount: number,
  minimumRequired: number,   // engine: 3
}

// Validation error (caller's fault)
{
  status: "error",
  code: "no_images" | "signer_not_extractable" | "not_owner" | "not_autographed",
  message: string,
}

// Engine/upstream error (transient, safe to retry)
{
  status: "error",
  code: "engine_timeout" | "engine_unavailable" | "internal_error",
  message: string,
}
```

The proxy does NOT pass through the engine's full `diagnostics` block — those stay on the engine side for our own debugging. Everything the mobile app or product UI ever needs is in `autograph_assessment.meta` (see §6).

### HTTP status mapping

| Proxy status | HTTP code |
|---|---|
| `success` | 200 |
| `insufficient_references` | 200 (it's a normal outcome, not an error) |
| `error.code = not_owner` | 403 |
| `error.code = not_autographed` / `signer_not_extractable` / `no_images` | 422 |
| `error.code = engine_timeout` | 504 |
| `error.code = engine_unavailable` | 502 |
| `error.code = internal_error` | 500 |

---

## 5. Idempotency & Regeneration

- A successful run **overwrites** `autograph_assessment` on the row. Re-running is the regeneration story.
- The proxy does NOT currently guard against concurrent calls for the same collectible. V1 is fine without a lock — the UI disables the Generate button while in-flight. If parallel regenerations become a problem, add an `aar_lock_until` timestamp column and a 60 s lease.
- Cost: each generation is one Gemini call (~$0.01). The team may want to add a soft per-user rate limit (e.g., 20 generations/day for free tier) later. Not in scope for V1.
- The persisted JSONB has `ran_at` (ISO timestamp) and `meta.prompt_version`. The UI can surface "Generated 3 days ago" and show a "Regenerate" affordance if the bar's been there a while.

---

## 6. The Persisted JSONB Contract (`collectibles.autograph_assessment`)

The full V4 shape lives in [`supabase/functions/quick-opinion/schemas.ts`](../../vitrinedb/supabase/functions/quick-opinion/schemas.ts) (engine side) and mirrors to [`test-harness/src/lib/quickOpinion.ts`](../../vitrinedb/test-harness/src/lib/quickOpinion.ts). For the mobile app you'll want to author a clean type module — recommend `apps/native/lib/api/aar.ts` — that mirrors the same shape.

### Top-level

```typescript
interface AutographAssessmentPersist {
  version: 4;                                    // schema version, bump if shape changes
  ran_at: string;                                // ISO 8601 timestamp
  summary: string;                               // 1-3 sentence hero blurb in Vitrine voice
  screen: ScreenCheckpoint[];                    // exactly 8 entries
  caveats: string[];                             // 0-N caveat strings
  method: MethodObservation;                     // signature application method
  next_action: NextAction;                       // structured recommendation
  bar_position: number;                          // 0-100
  bar_bucket: BarBucket;                         // five-state colloquial label
  assessment_classification:
    | "consistent" | "inconclusive" | "inconsistent";  // analytics-only label
  meta: VitrineReadMeta;                         // diagnostics + provenance
}
```

### `screen` — the 8-Point Signature Screen

Exactly 8 checkpoints, one per ID, always in this order:

```typescript
type CheckpointId =
  | "signature_architecture"    // macro layout, name structure
  | "key_letter_construction"   // diagnostic letterforms
  | "stroke_sequence"           // pen path, lifts, connectors
  | "speed_rhythm_fluency"      // velocity, hesitation
  | "pressure_ink_behavior"     // ink dynamics on surface
  | "proportion_spacing_slant"  // size relationships, baseline
  | "starts_stops_flourishes"   // attack/release strokes
  | "context_era_fit";          // era-appropriate execution

interface ScreenCheckpoint {
  checkpoint: CheckpointId;
  result: "pass" | "fail" | "idk_image" | "idk_exemplar";
  basis:
    | "trained_prior"           // model's own signer-style knowledge
    | "visible_image"           // what's plainly observable in the photo
    | "reference_supported"     // supported by eBay comparable images
    | "image_blocked";          // image quality prevented evaluation
  specificity: "high" | "medium" | "low";
  rationale: string;            // 1-3 sentence Vitrine-voice explanation
}
```

**Result semantics:**

| Result | Meaning | UI treatment |
|---|---|---|
| `pass` | Checkpoint aligns with signer's known habits | Green check / accent glyph |
| `fail` | Checkpoint diverges from known habits | Red X / negative glyph |
| `idk_image` | Image quality prevented evaluation — actionable | Amber "—" + "better photos help" |
| `idk_exemplar` | Reference pool too thin to be confident — not the user's fault | Neutral "—" + "limited comparables" |

### `method` — signature application

```typescript
interface MethodObservation {
  observed:
    | "hand_signed"             // confident hand application
    | "likely_hand_signed"      // probably hand, some ambiguity
    | "possible_secretarial"    // could be ghost-signed
    | "possible_auto_pen"       // could be auto-pen
    | "possible_facsimile"      // could be printed reproduction
    | "indeterminate";          // can't tell from image
  reasoning: string;            // 1-3 sentence explanation
}
```

The method is **independent** of pass/fail. A facsimile autograph fails most checkpoints AND gets a `possible_facsimile` method read. A handsigned forgery can read as `hand_signed` while failing every checkpoint.

### `next_action` — structured recommendation

```typescript
interface NextAction {
  kind:
    | "proceed"                 // bar is high; buy/keep with confidence
    | "verify_cert"             // bar mid-high; cross-check the auth cert
    | "request_better_photos"   // bar mid; image quality blocking a read
    | "submit_for_review"       // bar mid-low; needs human eyes
    | "walk_away";              // bar low; don't transact
  text: string;                 // 1-2 sentence Vitrine-voice CTA
}
```

The `kind` is deterministic from `bar_position`; the `text` is the engine's prose. UI maps `kind` to a CTA glyph + colour.

### `bar_bucket` — five colloquial labels

```typescript
type BarBucket =
  | "looks_off"              // ≤ 25
  | "something_feels_off"    // 26-44
  | "hard_to_tell"           // 45-59
  | "looks_pretty_good"      // 60-79
  | "looks_right";           // ≥ 80
```

`bar_position` (the 0–100 score) is the source of truth; `bar_bucket` is the named bucket the position fell into. Both ship in the JSONB so the UI doesn't have to recompute.

### `meta` — provenance, references, adjudication

This is where the product team's chip/card data lives.

```typescript
interface VitrineReadMeta {
  references_used: number;                      // headline count for the chip
  reference_quality: "weak" | "acceptable" | "strong";
  surface_match_quality: "exact" | "close" | "cross-surface";
  surface_context: SurfaceContext;              // see below
  reference_summary: PersistedReferenceSummary; // see below
  references: PersistedReference[];             // see below
  elapsed_total_ms: number;                     // engine-side duration
  prompt_version: string;                       // e.g., "vitrine-read-v4.0"
  model: string;                                // e.g., "gemini-3.1-pro-preview"
  adjudication: AdjudicatorBreakdown;           // per-checkpoint scoring detail
}

interface SurfaceContext {
  item_type: string;
  signing_area:
    | "fabric" | "stitched_applique" | "paper" | "glossy_photo"
    | "card_stock" | "leather" | "plastic" | "painted_surface"
    | "wood" | "baseball_panel" | "unknown";
  ink_medium_likely:
    | "silver_marker" | "black_marker" | "blue_marker"
    | "paint_pen" | "ballpoint" | "mixed_or_unknown";
  distortion_risk: "low" | "medium" | "high";
  expected_distortions: string[];               // e.g., ["surface glare from glossy paper"]
}

interface PersistedReferenceSummary {
  total_reported_by_ebay: number;               // raw count from search
  gate_pass_count: number;                      // passed authenticity gate
  selected_count: number;                       // top-N selected for ranking
  used_count: number;                           // actually used (fetched successfully)
  same_surface_count: number;                   // matched item_type
  same_franchise_count: number;
  avg_score: number;                            // average ranker score
  tier_1_count: number;                         // PSA / JSA / BAS / Fanatics / etc.
  tier_2_count: number;                         // witnessed / UDA
  tier_3_count: number;                         // COA / LOA / generic
}

interface PersistedReference {
  title: string;                                // eBay listing title
  auth_tier: "tier_1" | "tier_2" | "tier_3";
  auth_keyword: string;                         // e.g., "JSA"
  same_surface: boolean;
  same_franchise: boolean;
  score: number;                                // ranker score
  url: string | null;                           // eBay listing URL
  price: { value: string; currency: string } | null;
  image_url: string | null;                     // primary reference image
}

interface AdjudicatorBreakdown {
  checkpoint_contributions: CheckpointContribution[];  // per-checkpoint scoring trace
  pass_count: number;
  fail_count: number;
  idk_image_count: number;
  idk_exemplar_count: number;
  net_checkpoint_score: number;
  exemplar_dampen: number;
  caveat_pull: number;
  method_modifier: number;
  pre_snap_score: number;
}

interface CheckpointContribution {
  checkpoint: CheckpointId;
  result: CheckpointResult;
  basis: CheckpointBasis;
  specificity: CheckpointSpecificity;
  raw_weight: number;
  basis_multiplier: number;
  specificity_multiplier: number;
  effective_contribution: number;
}
```

### Real-world example (Mick Foley signed 8x10, just generated)

```json
{
  "version": 4,
  "ran_at": "2026-05-21T03:21:18.274Z",
  "summary": "We observe a highly fluid, confident signature and inscription that strongly aligns with Mick Foley's known handwriting and autograph habits. The structural layout, letter construction, and visible ink dynamics are consistently aligned with his established signing pattern.",
  "bar_position": 82,
  "bar_bucket": "looks_right",
  "assessment_classification": "consistent",
  "screen": [
    {
      "checkpoint": "signature_architecture",
      "result": "pass",
      "basis": "reference_supported",
      "specificity": "high",
      "rationale": "We observe the expected macro layout, featuring the signature placed directly below a characteristic 'Have a Nice Day' inscription..."
    },
    { /* ... 7 more checkpoints ... */ }
  ],
  "caveats": [
    "Our assessment relies on visual evidence; we cannot evaluate physical ink adhesion or surface texture directly from a photograph."
  ],
  "method": {
    "observed": "hand_signed",
    "reasoning": "Visible evidence of natural ink pooling at stroke transitions..."
  },
  "next_action": {
    "kind": "proceed",
    "text": "The signature and inscription strongly align with the signer's known habits. We recommend proceeding with confidence."
  },
  "meta": {
    "references_used": 8,
    "reference_quality": "strong",
    "surface_match_quality": "exact",
    "surface_context": {
      "item_type": "photo",
      "signing_area": "glossy_photo",
      "ink_medium_likely": "silver_marker",
      "distortion_risk": "low",
      "expected_distortions": ["surface glare from glossy paper", "minor ink pooling typical of marker on photo paper"]
    },
    "reference_summary": {
      "total_reported_by_ebay": 133,
      "gate_pass_count": 30,
      "selected_count": 8,
      "used_count": 8,
      "same_surface_count": 7,
      "same_franchise_count": 8,
      "avg_score": 11.4,
      "tier_1_count": 8,
      "tier_2_count": 0,
      "tier_3_count": 0
    },
    "references": [
      {
        "title": "WWE MICK FOLEY P-640 SIGNED 8X10 ORIGINAL PROMO PHOTO WITH PSA COA FROM 2000",
        "auth_tier": "tier_1",
        "auth_keyword": "PSA",
        "same_surface": true,
        "same_franchise": true,
        "score": 12,
        "url": "https://www.ebay.com/itm/376085370359",
        "price": null,
        "image_url": "https://i.ebayimg.com/.../vhUAAeSwK6Rn3FUb"
      }
      // ... 7 more
    ],
    "elapsed_total_ms": 34500,
    "prompt_version": "vitrine-read-v4.0",
    "model": "gemini-3.1-pro-preview",
    "adjudication": {
      "checkpoint_contributions": [ /* 8 entries */ ],
      "pass_count": 8,
      "fail_count": 0,
      "idk_image_count": 0,
      "idk_exemplar_count": 0,
      "net_checkpoint_score": 63.28,
      "exemplar_dampen": 0,
      "caveat_pull": 3,
      "method_modifier": 0,
      "pre_snap_score": 81.73
    }
  }
}
```

### What's NOT in the JSONB (intentional)

- The raw engine `diagnostics` block (tokens, elapsed breakdowns, failed-fetch URLs). Lives engine-side only.
- The `existing_auth` field from the request (cert lookup is provenance metadata, not signature evidence — engine treats it as a hint).
- Raw ranker breakdowns. Only the digested `auth_tier`, `score`, and flags ship.

---

## 7. AAR Lens — All Seven States

Below: what the AAR lens needs to render. The existing `aar-lens.tsx` already wraps everything in a `ScrollView` with the standard `bottomInset + dockReservedHeight + 24` padding. Keep that envelope; only the body changes.

### State 1 — Paywall (non-Pro)

**Trigger:** `isPro === false`
**Existing:** `<LensPaywallCard lensKey="AAR" accent={colors.traitViolet} ... />`
**No change.**

### State 2 — No Signature (Pro + not autographed)

**Trigger:** `isPro && !isAutographed`
**Existing:** The local `<NoSignatureState />` component.
**No change.**

### State 3 — Empty / Generate (Pro + autographed + no report yet)

**Trigger:** `isPro && isAutographed && !collectible.autographAssessment`

Visual treatment should mirror the existing `LensComingSoon` card chrome (sheetBg + frostBorder + brackets + violet accent rail) but the body messages the action, not progress.

```
┌──────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← 2pt traitViolet accent rail
│ ⌐                                            ¬   │
│         ┌──────────┐                             │
│         │  PEN     │   ← traitViolet glyph
│         └──────────┘                             │
│                                                  │
│   AAR · READY TO GENERATE                        │
│   AUTOGRAPH ASSESSMENT REPORT                    │
│                                                  │
│   We'll analyze the signature against            │
│   Mick Foley's known habits and a curated        │
│   set of comparable signed pieces. Takes         │
│   about 30 seconds.                              │
│                                                  │
│         ╔════════════════════════╗               │
│         ║   GENERATE REPORT      ║               │
│         ╚════════════════════════╝               │
│ ⌐                                            ¬   │
└──────────────────────────────────────────────────┘
```

Copy should reference the actual `signer_name` from `traitMetadata.signer_name`. CTA fires `enqueue-quick-opinion` (see §4).

**Visitor branch (non-owner viewing this state):** same card chrome, but the CTA is replaced with muted copy like "The collector hasn't run a report on this piece yet." No action available.

### State 4 — Generating (in-flight)

**Trigger:** local component state, the moment the CTA is tapped.

Same card chrome as State 3 (so the surface doesn't flash/reflow), but:
- Replace the glyph with a centred `<ActivityIndicator />` in `traitViolet`
- Kicker becomes `AAR · GENERATING`
- Title becomes `RUNNING THE SCREEN`
- Body cycles through "step" messages every ~5 s so the wait reads as motion, not stall. Pure cosmetic — the engine doesn't expose progress events. Suggested sequence:
  1. "Pulling comparable signed pieces from the market…"
  2. "Running the 8-point signature screen…"
  3. "Adjudicating checkpoint results…"
  4. "Finalizing the report…"
- Disable the CTA. Show no Cancel — the request is already in flight and there's no engine-side cancellation.

### State 5 — Insufficient References

**Trigger:** proxy returns `status === "insufficient_references"`

This is **not** an error — it's a legitimate engine outcome that means "the market doesn't have enough authenticated comparables for this signer to do a meaningful screen." Common for niche signers (regional wrestlers, voice actors, journeyman athletes).

```
┌──────────────────────────────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  ← amber/orange accent rail
│ ⌐                                            ¬   │
│         ┌──────────┐                             │
│         │    !     │   ← warning glyph in orange
│         └──────────┘                             │
│                                                  │
│   AAR · LIMITED COMPARABLES                      │
│   NOT ENOUGH REFERENCE PIECES                    │
│                                                  │
│   We only found {gatePassCount} authenticated    │
│   {signer_name} pieces in the market — at        │
│   least {minimumRequired} are needed for a       │
│   meaningful read. Try again in a few weeks      │
│   as the market grows, or submit for manual      │
│   review.                                        │
│                                                  │
│   ╔════════════╗  ╔══════════════════════╗      │
│   ║  TRY AGAIN ║  ║  REQUEST REVIEW      ║      │
│   ╚════════════╝  ╚══════════════════════╝      │
│ ⌐                                            ¬   │
└──────────────────────────────────────────────────┘
```

Action: "Try again" → re-runs the proxy (idempotent — engine may have new comps now). "Request review" stubs the manual-review loop (same handler as the existing `NoSignatureState`).

The proxy response includes `gatePassCount` and `minimumRequired` — pass them straight into the copy.

### State 6 — Error / Retry

**Trigger:** proxy returns `status === "error"` with a transient code (`engine_timeout`, `engine_unavailable`, `internal_error`)

Same chrome treatment but in `semanticRed` accent:

```
   AAR · COULDN'T COMPLETE
   GENERATION INTERRUPTED

   {message — the proxy's error.message}

   ╔════════════════════════╗
   ║      TRY AGAIN         ║
   ╚════════════════════════╝
```

For permanent-feeling errors (`signer_not_extractable`, `not_autographed`), this state shouldn't really fire — the lens should have already short-circuited via the `is_autographed` trait check. If it does fire, surface the message and skip the retry button.

### State 7 — Report Rendered

**Trigger:** `isPro && isAutographed && collectible.autographAssessment != null`

This is the big one. The full report is a vertical stack of zones — see §8.

---

## 8. Report Layout — Zone-by-Zone Field Mapping

Use the V3 lens scroll envelope (`ScrollView` with `paddingBottom: bottomInset + dockReservedHeight + 24`). Zone padding follows the existing `SPACING.gutter` (20) horizontal pattern and `SPACING.zoneCluster` (32) between major zones.

### Zone A — The Bar (hero)

The visual centrepiece. Bar position drives a horizontal meter, colour-graded by bucket.

**Field map:**
| Field | Source | Notes |
|---|---|---|
| Bar position (0–100) | `autograph_assessment.bar_position` | Drives meter fill width |
| Bucket label | `autograph_assessment.bar_bucket` | Title-cased: `looks_right` → "Looks right" |
| Bucket colour | derived from bucket | See colour map below |
| Hero summary | `autograph_assessment.summary` | 1–3 sentences |

**Suggested bucket → colour map** (using existing tokens — feel free to retune):

| Bucket | Colour token |
|---|---|
| `looks_off` | `semanticRed` |
| `something_feels_off` | `semanticOrange` |
| `hard_to_tell` | `textTertiary` (neutral grey) |
| `looks_pretty_good` | `traitOlive` |
| `looks_right` | `semanticGreen` |

**Layout sketch:**

```
┌──────────────────────────────────────────────────┐
│   VITRINE READ                                   │  ← kicker, groteskBold 11px, textSecondary
│                                                  │
│   Looks right                                    │  ← bucket label, heroDisplay 22-28px, bucket colour
│   ████████████████████████████░░░░░░░░  82       │  ← horizontal meter, value on right (monoMedium)
│                                                  │
│   We observe a highly fluid, confident           │  ← summary, inter 14-15px, textPrimary
│   signature and inscription that strongly        │     line-height 1.4, max width ~65ch
│   aligns with Mick Foley's known habits…         │
└──────────────────────────────────────────────────┘
```

### Zone B — The Read (8-Point Screen)

The eight checkpoints, rendered as a scannable list. Each row is collapsed by default showing the result glyph + checkpoint label. Tap to expand → reveals rationale + basis/specificity badge.

**Field map:**
| Field | Source | Notes |
|---|---|---|
| Per-row result | `screen[i].result` | Glyph + colour |
| Per-row label | derived from `screen[i].checkpoint` | Title-cased: `signature_architecture` → "Signature Architecture" |
| Per-row rationale | `screen[i].rationale` | Hidden until expanded |
| Per-row basis | `screen[i].basis` | Chip in expanded view |
| Per-row specificity | `screen[i].specificity` | Chip in expanded view |

**Result glyph map:**
| Result | Glyph | Colour |
|---|---|---|
| `pass` | `Check` (lucide) | `semanticGreen` |
| `fail` | `X` (lucide) | `semanticRed` |
| `idk_image` | `Minus` + `Camera` | `semanticOrange` (actionable) |
| `idk_exemplar` | `Minus` | `textTertiary` (not user-actionable) |

**Suggested label map:**
```typescript
const CHECKPOINT_LABELS: Record<CheckpointId, string> = {
  signature_architecture: "Signature Architecture",
  key_letter_construction: "Key Letter Construction",
  stroke_sequence: "Stroke Sequence",
  speed_rhythm_fluency: "Speed, Rhythm, Fluency",
  pressure_ink_behavior: "Pressure & Ink",
  proportion_spacing_slant: "Proportion & Slant",
  starts_stops_flourishes: "Starts, Stops, Flourishes",
  context_era_fit: "Context & Era Fit",
};
```

**Header summary above the list:** "{pass_count} pass · {fail_count} fail · {idk_image_count + idk_exemplar_count} undetermined"

**Layout sketch (collapsed):**

```
┌──────────────────────────────────────────────────┐
│   THE READ                                       │  ← kicker
│   8 pass · 0 fail · 0 undetermined               │  ← summary
│                                                  │
│   ✓  Signature Architecture                  ⌄  │  ← row, tap to expand
│   ✓  Key Letter Construction                 ⌄  │
│   ✓  Stroke Sequence                         ⌄  │
│   ✓  Speed, Rhythm, Fluency                  ⌄  │
│   ✓  Pressure & Ink                          ⌄  │
│   ✓  Proportion & Slant                      ⌄  │
│   ✓  Starts, Stops, Flourishes               ⌄  │
│   ✓  Context & Era Fit                       ⌄  │
└──────────────────────────────────────────────────┘
```

**Expanded row treatment:**

```
   ✓  Signature Architecture                  ⌃
      ┌─────────────────────────────────────────┐
      │ We observe the expected macro layout,   │
      │ featuring the signature placed directly │
      │ below a characteristic 'Have a Nice Day'│
      │ inscription. The spatial relationship,  │
      │ line breaks, and overall blocking…      │
      │                                         │
      │  [REFERENCE-SUPPORTED]  [HIGH SPECIFIC] │
      └─────────────────────────────────────────┘
```

The two pills at the bottom of the expansion give the trust grounding: where the read came from (`basis`) and how confident the model was (`specificity`).

### Zone C — Method

A compact ID card for "how was the signature applied."

**Field map:**
| Field | Source |
|---|---|
| Method label | `method.observed` (title-cased: `hand_signed` → "Hand Signed") |
| Method colour | green for `hand_signed`/`likely_hand_signed`, orange for `possible_*`, grey for `indeterminate` |
| Reasoning | `method.reasoning` |

**Layout sketch:**

```
┌──────────────────────────────────────────────────┐
│   METHOD                                         │
│   ┌────────────────────────────────────────────┐ │
│   │ ● Hand Signed                              │ │  ← coloured dot + label
│   │   Visible evidence of natural ink pooling  │ │
│   │   at stroke transitions, distinct…         │ │
│   └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Zone D — Caveats (conditional — only if `caveats.length > 0`)

```
┌──────────────────────────────────────────────────┐
│   CAVEATS                                        │
│   • Our assessment relies on visual evidence;    │
│     we cannot evaluate physical ink adhesion…    │
└──────────────────────────────────────────────────┘
```

Plain bulleted list. No card chrome. `textSecondary` colour.

### Zone E — What We'd Do (the recommendation)

The bottom-of-funnel action card. Inherits accent colour from `next_action.kind`.

**Field map:**
| Field | Source |
|---|---|
| Action label | derived from `next_action.kind` |
| Action colour | colour map below |
| Action text | `next_action.text` |

**Action label + colour map:**

| Kind | Label | Colour |
|---|---|---|
| `proceed` | "Proceed" | `semanticGreen` |
| `verify_cert` | "Verify the Cert" | `traitCyan` |
| `request_better_photos` | "Better Photos Help" | `semanticOrange` |
| `submit_for_review` | "Submit for Review" | `traitViolet` |
| `walk_away` | "Walk Away" | `semanticRed` |

**Layout sketch:**

```
┌──────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← 2pt action-colour accent rail
│                                                  │
│   WHAT WE'D DO                                   │
│   Proceed                                        │  ← large heroDisplay, action colour
│                                                  │
│   The signature and inscription strongly align   │
│   with the signer's known habits. We recommend   │
│   proceeding with confidence.                    │
└──────────────────────────────────────────────────┘
```

### Zone F — Compared Against (references)

The provenance grid — shows the user we did real comparative work.

**Field map:**
| Field | Source |
|---|---|
| Headline count | `meta.reference_summary.used_count` |
| Reference quality chip | `meta.reference_quality` (`weak`/`acceptable`/`strong`) |
| Surface match chip | `meta.surface_match_quality` (`exact`/`close`/`cross-surface`) |
| Tier counts | `meta.reference_summary.tier_1_count` etc. |
| Same-surface count | `meta.reference_summary.same_surface_count` |
| Same-franchise count | `meta.reference_summary.same_franchise_count` |
| Per-ref tile | iterate `meta.references[]` |

**Suggested headline chips:**

| Chip | Display | When |
|---|---|---|
| Reference quality | `STRONG REFERENCES` | always |
| Surface match | `7 SAME-SURFACE` | when `same_surface_count > 0` |
| Auth tier breakdown | `8 PSA/JSA` (tier_1), `2 WITNESSED` (tier_2), `1 COA` (tier_3) | per non-zero tier |

**Layout sketch:**

```
┌──────────────────────────────────────────────────┐
│   COMPARED AGAINST                               │
│   8 reference pieces                             │
│                                                  │
│   ┌─STRONG─┐ ┌─7 SAME-SURFACE─┐ ┌─8 PSA/JSA─┐ │  ← horizontal chip rail
│                                                  │
│   ┌─────────┐                                    │
│   │ [photo] │ WWE MICK FOLEY P-640 SIGNED…       │  ← per-ref tile, tap → eBay URL
│   │         │ ● PSA  · same-surface · franchise  │
│   └─────────┘                                    │
│   ┌─────────┐                                    │
│   │ [photo] │ Mick Foley WWE Wrestling 8x10…     │
│   │         │ ● JSA  · same-surface · franchise  │
│   └─────────┘                                    │
│   …                                              │
└──────────────────────────────────────────────────┘
```

Each per-ref tile is a compact horizontal row (~64 px tall) with image, title (truncated to 2 lines), and a chip row showing tier + surface/franchise flags. Tapping opens the `url` in the system browser (eBay listing).

### Zone G — Surface Context (compact footer)

Small, dense, footer-style. Surfaces the engine's environmental assumptions so technical users understand what context the read was made under.

**Field map:**
| Field | Source |
|---|---|
| Signing area | `meta.surface_context.signing_area` |
| Ink medium | `meta.surface_context.ink_medium_likely` |
| Distortion risk | `meta.surface_context.distortion_risk` |

**Layout sketch:**

```
   SURFACE   glossy photo · silver marker · low distortion
```

Single line, `textTertiary`, mono-spaced. No card. Below it, on a separate line in muted text: "Generated {timeAgo(ran_at)} · {model} · v{prompt_version}".

### Zone H — Regenerate (owner only)

Bottom of the lens, owner-only affordance to re-run the assessment. Useful when the user adds better photos, or when months have passed and the market has more comps.

```
                  ┌─────────────────────────┐
                  │   REGENERATE REPORT     │   ← outline button, textSecondary
                  └─────────────────────────┘
```

Fires the same proxy call. While in flight, the entire lens body transitions to State 4 (Generating) and back.

---

## 9. Implementation Checklist

### Backend (one new Edge Function)

- [ ] Create `supabase/functions/enqueue-quick-opinion/index.ts` modelled on `enqueue-extraction`
- [ ] Wire `verify_jwt: true` in `supabase/config.toml`
- [ ] Port the test-harness's `deriveQuickOpinionInputs` gate logic server-side (lives in `test-harness/src/lib/quickOpinion.ts`)
- [ ] Add the engine call with sync timeout buffer (use a 90 s `AbortController` on the upstream fetch)
- [ ] On success, write `autograph_assessment` to the row via service role
- [ ] Return the proxy response shape from §4
- [ ] Deploy + smoke test using a known-good autographed collectible from your QA pool

### Frontend (extend `aar-lens.tsx`)

- [ ] Create `apps/native/lib/api/aar.ts` with the V4 types from §6
- [ ] Create `apps/native/hooks/use-quick-opinion.ts` exposing `{ assessment, loading, error, generate }` — mirrors the `useComps` pattern but with a triggered (not auto) fetch
- [ ] In the AAR lens, branch on `autographAssessment !== null`:
  - null → empty Generate card (State 3)
  - present → render the report (Zones A–H, State 7)
- [ ] Add loading / insufficient / error states (4, 5, 6)
- [ ] After successful generation, update local state with the returned `autograph_assessment` (and/or refetch the collectible) so the UI re-renders without a full screen reload
- [ ] Test with a Pro toggle flag to validate all branches (paywall still works, no-signature still works)

### Owner vs. visitor branches

- [ ] State 3 (Empty / Generate): hide the CTA for visitors; show explanatory copy instead
- [ ] State 7 Zone H (Regenerate): owner only

---

## 10. Open Questions

These are not blockers — they're decisions the product team owns. The doc above documents what works without them; the answers refine the experience.

1. **Rate limiting.** What's the per-user / per-day generation cap? Engine cost is ~$0.01/run; ungated this becomes an abuse vector. Recommend free tier = 5/day, Pro = unlimited, with a soft UI message at the cap.
2. **Regeneration freshness affordance.** Should we surface "this report is 30 days old" prompts to encourage refresh as the market grows? Or only on owner action?
3. **Mid-tier signers.** When the engine returns `insufficient_references`, do we offer a "Notify me when the market has enough" capture? Could feed into the eventual manual review queue.
4. **Bar bucket colour for `something_feels_off`.** The current colour map uses `semanticOrange` here and `textTertiary` for `hard_to_tell`. Some users may read "hard to tell" as worse than "something feels off." Open to swapping or shading both differently.
5. **Surface context exposure.** Zone G is fairly dense/technical. Worth keeping for power users, or hide behind a "show details" toggle?
6. **Caveat de-duplication.** The engine occasionally produces caveats that effectively repeat the surface context ("photographed through plastic"). May want a client-side filter, or just accept the redundancy as honesty.
7. **Cross-pollination with VAR.** The Vitrine Analysis Report (VAR lens) will eventually surface a synthesis of all lens outputs including AAR. The persisted `bar_position` + `bar_bucket` + `next_action.kind` are the obvious feeder fields. Worth flagging in the VAR brief when that ships.

---

## 11. Reference: Engine Files (for context)

For deeper engine-side context if questions come up:

| File | Purpose |
|---|---|
| `vitrinedb/supabase/functions/quick-opinion/index.ts` | HTTP entrypoint, request validation, response shaping |
| `vitrinedb/supabase/functions/quick-opinion/pipeline.ts` | Full pipeline: eBay search → rank → fetch → AI → adjudicate |
| `vitrinedb/supabase/functions/quick-opinion/prompts/gemini-3/quick-opinion.ts` | The signer-specialist prompt |
| `vitrinedb/supabase/functions/quick-opinion/prompts/gemini-3/output-schema.ts` | AI output schema (Zod + JSON Schema) |
| `vitrinedb/supabase/functions/quick-opinion/adjudicator.ts` | Deterministic 0-100 scoring from checkpoint results |
| `vitrinedb/supabase/functions/quick-opinion/schemas.ts` | Wire types and persistence shape (`AutographAssessmentPersist`) |
| `vitrinedb/supabase/functions/_shared/ebay-ranker.ts` | Auth-tier + era-aware reference ranking |
| `vitrinedb/test-harness/src/lib/quickOpinion.ts` | Reference TypeScript types + `deriveQuickOpinionInputs` |

For UI reference, the test harness components show one possible rendering of the same data:

| File | Purpose |
|---|---|
| `vitrinedb/test-harness/src/components/device/QuickOpinionDeviceCard.tsx` | User-facing rendering (bar, screen, caveats, next-action, references) |
| `vitrinedb/test-harness/src/components/dev/QuickOpinionDevPanel.tsx` | Developer-facing diagnostics view (adjudicator trace, reference summary) |

The dev panel in particular shows how to surface every meta field — useful if the product team wants to ship a "Developer details" toggle inside the AAR lens for early QA cycles.
