# Vitrine — AI-First Upload Flow (V2)

**Status:** Vision / design artifact. NOT scoped for V1 build. Revisit when ready to commit to a major architectural shift.

**Context:** This document captures a multi-session theory-crafting conversation about rebuilding the memorabilia upload flow around frontier AI vision models. The existing manual-entry flow (33 fields per category, 72% zero-fill rate, heavy user abandonment) is being preserved for now. This is the roadmap for when we come back to it.

**Last captured:** Feb 2026

---

## 1. Why this exists — the core thesis

The current memorabilia upload path asks the user to manually fill up to 33 structured fields after picking a category + subcategory. Real-world fill rates across the 38 public Football Jerseys on the platform today:

| Fill tier | Fields | Coverage |
|---|---|---|
| ≥75% meaningfully filled | Overall Grade, Autographed, Athlete(s), COA Company | 4 fields |
| 11-50% meaningfully filled | COA Number, LOA Company, Team(s) | 3 fields |
| ≤3% meaningfully filled | Condition, League/Level, Notes, Team Issued | 4 fields |
| **0% meaningfully filled** | Manufacturer, Size, Style, Version, Color(s), Patches, Model/Series, Game Used, Inscribed, Limited Edition, Auto Grade, Auto Graded, Commemorative, Customization(s), #/Total, Variation, Event/Milestone, Inscription(s), Secondary/Additional COA/LOA fields | **22 fields** |

**72% of the form is dead weight.** The fields that would make comps genuinely discriminating (Manufacturer, Version, Style, Size, Patches, Inscription) sit at 0% filled. The algorithm we shipped (Algorithm v2) can't overcome missing data.

Meanwhile, frontier vision models in 2026 can read a jersey photo + COA and populate ~20-25 of those 33 fields accurately. This is the inversion opportunity: **stop asking users to do data entry that AI can do better.**

---

## 2. The target user experience (Ed Reed case)

**Input:** User uploads a "Signed Ed Reed Home Ravens Jersey" — title + 4 photos (front, back, side, side) + optional COA image.

**Output:** Listing with ~28 meaningfully-populated fields, a narrative summary, an attached authentication document, and a cert-registry dedup check — in 60-90 seconds from tap to publish.

### Flow at a glance

1. **Capture** — Photos + title + optional COA (open-from-start, not gated)
2. **Analyze** — AI pipeline runs (2-4 second spinner)
3. **Conditional COA prompt** — Only if autograph detected AND no COA provided yet
4. **Reveal** — Narrative summary of what AI found, with editable structured drawer
5. **Finalize** — User adds price + intent + optional personal story → publish

### UX decision: open-from-start, not strictly gated

Power users doing bulk uploads know the drill and should be able to pre-attach COA at the same step as primary photos. First-timers still get the conditional prompt if they didn't provide one. The conditional screen isn't removed — it just doesn't appear for users who already uploaded the doc.

---

## 3. What AI extracts (field-by-field simulation)

### Stage 1 output: 4 photos + title only

Confidence map for Ed Reed based on photos alone:

| Field | Value | Confidence | State |
|---|---|:---:|---|
| Category / Subcategory | football / jersey | 0.99 | ✅ Locked |
| Athlete(s) | ["Ed Reed"] | 0.98 | ✅ Confident |
| Team(s) | ["Baltimore Ravens"] | 0.99 | ✅ Confident |
| League/Level | nfl | 0.99 | ✅ Confident |
| Style | home | 0.99 | ✅ Confident |
| Color(s) | Purple, Black, Gold | 0.97 | ✅ Confident |
| Autographed | true | 0.98 | ✅ Confident |
| Manufacturer | Reebok | 0.80 | 🟡 Probable |
| Size | 48 | 0.85 | 🟡 Probable |
| Version | authentic | 0.78 | 🟡 Probable |
| Condition | near-mint | 0.75 | 🟡 Probable |
| Overall Grade | 9 | 0.70 | 🟡 Probable |
| Patches | [] | 0.80 | 🟡 Probable |
| Model/Series | On-Field | 0.70 | 🟡 Probable |
| Auto Graded | unknown | 0.50 | ⚠️ Uncertain |
| COA Company / Number | — | — | ❌ Empty (no sticker visible) |
| Commemorative, Game Used, Team Issued, Limited Edition, Inscribed | false | 0.80-0.90 | ✅ Default-filled |

**~20 fields at ≥0.7 confidence. Autograph detected → triggers COA conditional.**

### Stage 3 output: after COA merge

Attaching the PSA/DNA COA causes:

- **5 fields jump empty → perfect** (COA Company, COA Number, Auto Graded, Auto Grade, Event/Milestone)
- **3-4 fields boost from probable → certain** (Manufacturer, Size, Version)
- **4-5 net-new fields** unlocked that no photo could produce: **Signing Date, Signing Event, Signing Location, Witness, Hologram ID** (schema gaps — see Section 7)
- **1 trust artifact** captured: the COA image itself becomes part of the listing
- **1 dedup check** runs silently: cert registry verifies cert number is unique on Vitrine

**Final state: ~28 meaningfully-filled fields + COA doc + uniqueness badge.**

### Stage 4: the reveal screen

**Recommendation: narrative-first, not form-first.**

Instead of a scrolling list of pre-filled form fields, show a written summary:

> *"A signed Ed Reed #20 Baltimore Ravens home jersey, Reebok authentic, size 48, signed at the Ravens Ring of Honor ceremony on March 14, 2019, authenticated by PSA/DNA (cert AC12345, witnessed by Steve Grad). Condition: near-mint."*

Below: `Looks good → publish` / `Edit details →` (expands to structured fields with source badges).

This is what a buyer will see, and it tells the user the AI *understands* the piece — not just that it ticked boxes.

**Micro-patterns:**
- Each field in edit mode shows a subtle `from photo` / `from COA` / `from title` badge
- High-confidence fields look locked but tappable; low-confidence fields get a "Confirm?" hint
- Price, Listing intent, Personal story stay user-owned always

---

## 4. COA / LOA extraction as a first-class capability

Authentication documents are near-perfect OCR targets (high contrast, standardized layouts, structured data by design). A clear COA photo should hit 95%+ extraction accuracy on key fields.

### What's extractable from a typical PSA/DNA or JSA COA

| Extracted field | Example | Current schema | New? |
|---|---|---|:---:|
| Issuer | `"PSA/DNA"` | ✅ COA Company | |
| Cert / Auth number | `"AC12345"` | ✅ COA Number | |
| Item described | `"Baltimore Ravens Home Jersey, size 48"` | ⚠️ Scattered | |
| Signer full name | `"Edward Earl Reed"` | ✅ Athlete(s) | |
| **Signing date** | `"March 14, 2019"` | ❌ No field | **New** |
| **Signing event** | `"Ravens Ring of Honor ceremony"` | Event/Milestone (0% filled) | Revives |
| **Signing location** | `"M&T Bank Stadium"` | ❌ No field | **New** |
| **Witness / authenticator** | `"Steve Grad"` | ❌ No field | **New** |
| **Hologram / tamper ID** | `"BR7438291"` | ❌ No field | **New** |
| **Multi-item bundle** | `"Jersey + signed 8x10 photo"` | ❌ No field | **New** |
| Issuer grade | `"Grade: 10 Auto"` | ✅ Auto Grade (0% filled) | Revives |
| Date of authentication | `"March 14, 2019"` | ❌ No field | **New** |
| COA image itself | Attached file | ❌ No storage pattern | **New** |

**Five brand-new fields** plus two revived dead fields unlock every time a COA is attached.

### Conditional flow (three paths)

| Path | UX | Data yield |
|---|---|---|
| **Photograph COA** (primary CTA) | Camera with framing overlay | 100% — full extraction |
| **Enter cert details** (secondary) | Issuer dropdown + cert number + optional notes | ~30% — structured but unverified |
| **Skip for now** (tertiary, guilt-free) | Continue to reveal | 0% — graceful degradation |

Key UX requirements:
- Skip path must be guilt-free ("No COA? That's fine — you can add one later")
- "Add COA later" must be a real post-publish capability
- If primary photos already contain a clear COA sticker (e.g., PSA/DNA sticker on jersey), skip the conditional entirely and use what we have

### Edge cases to handle

1. **Discrepancy between photo and COA** (e.g., COA says Ray Lewis but photo shows #20 Ed Reed) → surface to user, don't silently resolve
2. **Blurry / partial COA** → retry prompt with coaching ("Move closer to signature block")
3. **Multi-page LOA** → multi-photo capture or PDF upload
4. **Unknown authenticator** → graceful handling, store as free-text
5. **AI disagrees with user on autograph presence** → bias toward trusting user, ask them to help ("Point camera at signature area")
6. **Cert collision in registry** → don't auto-reject. Flag for manual review. Innocent cases dominate (resale chain, typos).
7. **User skips COA entirely** → listing is valid with neutral "Unauthenticated" label. No stigma.

---

## 5. Slab extraction (trading cards — different path)

Slabbed items (PSA / BGS / SGC / JSA-slabbed cut signatures) collapse the upload flow into essentially "photograph the slab." The slab label IS the COA.

Extractable from a slab photo alone:
- Player, Year, Brand/Set, Card number, Variation
- Overall grade + subgrades (BGS has centering/corners/edges/surface)
- Cert number → API lookup enables population data ("1 of 3 at this grade")
- Encapsulation date

**~90% of a card listing auto-populates from one slab photo.**

**Strategic note:** the slab-first flow might be worth building FIRST, before memorabilia. It's a cleaner proof-of-concept for the AI-first thesis, higher-volume (trading cards dominate collectibles), and easier to get right. Memorabilia has more ambiguity; slabs have printed structured data.

---

## 6. Cert registry — the trust layer unlock

Every major authenticator's cert numbers are globally unique within their issuer. Indexing every cert we've ever seen unlocks compounding benefits:

1. **Duplicate-cert detection** — Two listings claiming the same PSA/DNA cert = fraud or stolen photo. V1: flag internally. V2: soft-block + manual review. V3: public "Verified unique on Vitrine" badge.

2. **Cross-listing provenance / ownership chain** — When a collectible sells, the new owner's listing references the same cert. Now we have a ledger: "Previously listed by @Jim in 2025, now owned by @Sarah." This is a marketplace-ledger feature that makes Vitrine understand the collectible economy in a way eBay/Mercari cannot.

3. **Buyer-facing structured search** — "Show me all PSA/DNA Ed Reed autographs on Vitrine" becomes a first-class filter.

4. **Fraud pattern detection** — Users whose certs appear on other platforms' listings get flagged.

**This capability is only possible with the structured extraction the AI flow provides. It's the differentiator that flowers out of going AI-first.**

---

## 7. Schema changes required

### New tables

```sql
-- The actual COA/LOA image or PDF per collectible
authentication_documents (
  id, collectible_id, doc_type, doc_url,
  extracted_json, captured_at, verified_at
)

-- Global cert index for dedup and provenance
cert_registry (
  issuer, cert_number, collectible_id,
  first_seen_at, last_verified_at,
  UNIQUE(issuer, cert_number)
)

-- Cached issuer API responses (PSA etc.)
cert_lookup_cache (
  issuer, cert_number, response_json,
  fetched_at, expires_at
)

-- Raw AI predictions for audit + reprocessing
raw_ai_predictions (
  id, collectible_id, model, prompt_version,
  stage, raw_response_json, confidence_scores,
  created_at
)
```

### New fields to add to `fields` table (AI-extractable)

- **Signing Date** (text) — extractable from COA
- **Signing Event / Location** (text) — extractable from COA, also replaces current Event/Milestone (0% filled) with something AI can actually fill
- **Year / Era** (text) — extractable from manufacturer tag + COA context
- **Witness** (text) — COA secondary signer
- **Hologram ID** (text) — secondary identifier

### Existing field changes

- **COA Company** → convert from free-text to managed enum (current 76% fill has variants: "PSA/DNA", "PSA DNA", "Psa-dna", "psa dna" — need canonicalization)
- **Consider collapsing** Secondary + Additional COA/LOA fields behind a "More authenticators" expander. Current 0% fill + AI flow makes them even less necessary.
- Consider **`category_field_option_visibility`** usage — currently the Size radio renders all 60 options (football sizes + cap sizes + hockey sticks + ticket stubs + speech formats), which likely contributes to the 0% Size fill rate.

### New field-level metadata (on `fields` table)

- `ai_extractable` (boolean) — can AI fill this, or is it user-only (like price, personal story)?
- `extraction_hint` (text) — prompt snippet that tells the AI how to extract this field ("Look at the tag on the inside collar or bottom hem")
- `confidence_threshold` (numeric) — below this, re-extract with premium model OR escalate to user-confirm
- `user_required` (boolean) — always needs user touch regardless of AI confidence (price, listing intent)
- `default_user_editable` (boolean) — is the final value overridable by the user?

### New field-value metadata (on `collectible_field_values`)

- `source` (enum: `ai_photo`, `ai_coa`, `ai_title`, `user_manual`, `user_correction`, `default`)
- `confidence` (numeric 0-1)
- `evidence` (text, short snippet of what AI saw)
- `prediction_id` (fk to `raw_ai_predictions`)

---

## 8. Architecture — the bulletproof multi-pass pipeline

### Stage-by-stage (target latency budget ~3-6s total)

| Stage | Responsibility | Model | Parallelizable? |
|---|---|---|:---:|
| **Preprocess** | Resize photos to 1024×1024, strip EXIF | Edge function (no AI) | Yes |
| **A: Classify** | Determine category + subcategory | Gemini 2.5 Pro (fast, cheap) | No (gates everything) |
| **B: Entity detect** | Detect signature, COA sticker, tags, patches | GPT-5 vision | Yes, with C |
| **C: Field extract** | Populate 33 fields in parallel batches | GPT-5 | Yes, with B |
| **D: COA OCR** | Structured extraction from COA doc | Claude Sonnet 4.6 (strongest at docs) | Yes |
| **E: Cross-validate + merge** | Reconcile sources, flag discrepancies | No AI — business logic | Serial after B/C/D |
| **F: Escalate low-conf** | Re-extract ambiguous fields only | Claude Opus 4.7 (~10-15% of uploads) | Surgical, optional |
| **G: Cert registry check** | Dedup lookup on extracted cert number | No AI — DB query | Parallel |
| **H: Narrative generate** | Produce the reveal summary | GPT-5 (reuses prior context) | Serial, last |

### Commitments the "bulletproof" bar implies

1. **Multi-pass, not single-shot** — debuggable stages, surgical escalation
2. **Confidence-tiered escalation** — fields <0.85 get premium re-extraction
3. **Raw prediction storage** — every AI output logged before merging; enables audit, reprocessing with newer models, future fine-tuning
4. **Source-of-truth taxonomy per field** — some fields always-user (price, intent, story), most AI-primary user-correctable
5. **Cross-validation, never silent resolve** — photo vs. COA discrepancies always surfaced
6. **Fallbacks at every stage** — classification fails → manual picker; COA OCR fails → keyed entry; nothing provided → graceful "Unauthenticated"
7. **Evals before any prompt change ships** — 50-200 golden-set examples, auto-score, fail deploy if accuracy drops >2% on any field
8. **Parallelization for latency** — Stage A gates, then B+C+D parallel, F only if needed, H async if possible

---

## 9. Cost analysis (frontier models, Feb 2026 pricing)

### Per-run token math for Ed Reed case

**Inputs:** 5 images @ 1024×1024, prompt overhead ~2-3K tokens, title ~20 tokens.
**Total input:** ~6,000-13,000 tokens depending on provider (Gemini cheapest per image by 5-10x).
**Output:** ~1,500-2,500 tokens (structured JSON + confidence + evidence).

### Per-run cost by model (single-shot)

| Model | Approx. pricing | Per-upload | Notes |
|---|---|---:|---|
| Gemini 2.5 Pro | ~$1.25 / $10 per M | **~$0.02-0.03** | Cheapest on images |
| GPT-5 | ~$1.25 / $10 per M | **~$0.03-0.04** | Best general reasoning |
| Claude Sonnet 4.6 | ~$3 / $15 per M | **~$0.06-0.08** | Best document OCR |
| Claude Opus 4.7 | ~$15 / $75 per M | **~$0.25-0.35** | Premium, escalation only |

**Multi-pass pipeline is 2-3x the single-shot cost** but far more controllable. For bulletproof quality, multi-pass is the right choice.

### Recommended V2 blended cost

| Stage | Model | Cost per run |
|---|---|---:|
| Preprocess | Edge function | ~$0.0001 |
| Classify + entity detect | Gemini 2.5 Pro | ~$0.01 |
| Field extract | GPT-5 | ~$0.03 |
| COA OCR | Claude Sonnet 4.6 | ~$0.02 |
| Narrative | GPT-5 (cached context) | ~$0.005 |
| Low-conf escalation (~10-15% of uploads) | Claude Opus 4.7 | ~$0.03 blended |
| **Blended average** | | **~$0.07-0.10** |
| Worst case | | ~$0.20 |

### Scaling math

| Monthly uploads | At $0.08 avg | At $0.20 worst case |
|---|---:|---:|
| 1,000 | $80 | $200 |
| 10,000 | $800 | $2,000 |
| 100,000 | $8,000 | $20,000 |
| 1,000,000 | $80,000 | $200,000 |

Context: a $100 average sale at 5% take rate = $5 gross. AI upload cost of $0.08 is **1.6% of one sale**. Listings generate value over many interactions, not one. Unit economics work even if only 30-40% of uploads sell.

### Cost levers (biggest impact first)

1. **Image preprocessing** — resize to 1024×1024 at ingest = **60-70% cost cut** vs. raw phone photos
2. **Tiered model routing** — cheap models handle 80-90%, frontier only on hard cases
3. **Batch API usage** — 50% discount on non-realtime paths (backfill, nightly re-enrichment)
4. **Prompt caching** — Anthropic + OpenAI support it; ~$0.01-0.02 savings per run on our schema prompt
5. **Template-aware COA OCR** — after N examples of PSA/DNA layout, lightweight OCR handles 90% of known templates (V3 optimization)
6. **Fine-tuning** — V3: self-hosted fine-tuned open model (Qwen-VL, Llama 4 Vision) on Vitrine's domain data drops costs 5-10x

### Hidden costs to budget

- Prompt iteration during build: ~$500-2,000
- Regression testing (50-200 golden set runs): ~$20-50 per pass
- Dev/staging parallel spend: ~10-20% of production
- Abuse prevention (rate limiting mandatory from Day 1)
- PSA / third-party API fees if integrated

### Bottom line

**V1 at likely scale: <$1,500/month in AI spend for transformative UX.**
**At 100K uploads/month: $8-15K/month — reasonable infra spend.**

---

## 10. Infrastructure stack — build vs buy

### What we always build (our IP)

- Prompts themselves (how to extract Football→Jersey fields)
- Field schema / taxonomy / middleware
- Merge & cross-validation logic
- Cert registry / fraud detection
- UX / upload flow / reveal screen
- Supabase integration + `raw_ai_predictions` table

### What we outsource (non-differentiating plumbing)

| Layer | What it does | Recommended vendor | V2 cost |
|---|---|---|---:|
| Client SDK | Provider-agnostic model calls, streaming, structured output | **Vercel AI SDK** (free, open-source) | $0 |
| AI gateway | Retries, failover, rate limiting, caching | **Skip initially** — add Portkey if outages bite | $0 |
| Observability | Log every call, costs, latency, debugging UI | **Langfuse (self-hosted)** or **LangSmith (managed)** | $0-99/mo |
| Prompt management | Version prompts, A/B test, rollback | **Git repo** until 20+ prompts; then Braintrust | $0 |
| Evals / testing | Golden datasets, regression detection | **Homegrown script** at V1; Braintrust later | $0 |
| Prediction storage | Audit trail, reprocessing | **Supabase** `raw_ai_predictions` table | ~$0 (already paid) |

**Total non-model vendor spend at V2 launch: $0-99/month.**

### When to add each layer

- **AI gateway (Portkey)** — when we regularly hit rate limits or experience provider outages affecting users
- **Managed observability (LangSmith)** — when Langfuse self-hosting eats eng time or SOC2 compliance is needed for enterprise
- **Prompt management (Braintrust)** — when we have 10+ prompts and non-engineers need to tune them without deploys
- **Full eval platform (Humanloop/Braintrust)** — when shipping prompt changes weekly and manual regression slows us down

---

## 11. Open questions for when we come back

These need decisions before implementation begins:

1. **Slab-first or memorabilia-first?** Slab-first is the cleaner proof-of-concept (printed structured data, higher volume). Memorabilia is messier but our current focus. Recommendation: build slab flow first to validate pattern.

2. **Trust-marketplace positioning vs. quiet magic?** Two strategic flavors:
   - **Trust-first:** surface cert uniqueness, authentication transparency, provenance chains prominently. Become known as "the marketplace where fakes die."
   - **Magic-first:** AI does the work silently, trust is a happy byproduct. UX feels seamless but doesn't lean on trust theater.
   - These aren't mutually exclusive but emphasis matters early.

3. **Prompt curation ownership.** Who maintains the AI extraction prompts at scale? Current middleware team owns the taxonomy. Do they also own prompt tuning? This is a role expansion that needs org alignment.

4. **Confidence thresholds for auto-fill.**
   - ≥0.85: silent fill
   - 0.6-0.85: fill with "verify" badge
   - <0.6: suggest as chip, don't commit
   - These boundaries need A/B testing with real users.

5. **How does the flow degrade when AI is down?** Full fallback to manual entry? Offline queuing? Retry loops?

6. **Legacy item backfill — is it a feature?** We have 1,300+ items with `subcategory='other'` and minimal fields. AI + retroactive COA re-extraction could enrich them. "We re-analyzed your 2023 listings and filled 47 new details — review?" Turns every existing user into an engagement moment.

7. **Schema audit — which other subcategories are as sparse as football/jersey?** Worth doing the same fill-rate analysis on ball, helmet, and other major subcategories to scope the AI-fill effort accurately and prove the thesis generalizes.

8. **Merge path with existing manual flow — cutover or parallel?** Do we ship AI-first as a new flow alongside the old one (opt-in), or replace the old one wholesale? Parallel is safer, wholesale is cleaner.

---

## 12. Suggested sequencing (when we come back)

**Phase 0 — Validation (2-3 weeks, no code)**
1. Audit fill rates across ball, helmet, card, ticket subcategories (expand beyond jersey)
2. Hand-label a golden dataset of 100 items (AI output → human correction) across top 3 subcategories
3. Prototype classification + field extraction on the golden set with Gemini 2.5 Pro + GPT-5, measure accuracy per field
4. Cost-sanity-check: actual API spend on 100 test uploads vs. estimate

**Phase 1 — Schema + plumbing (3-4 weeks)**
1. Add new fields to `fields` table (Signing Date/Event/Location/Witness/Hologram ID + `ai_extractable` metadata)
2. Create `authentication_documents`, `cert_registry`, `raw_ai_predictions` tables
3. Add field-value source/confidence/evidence columns
4. Wire up image preprocessing (1024×1024 resize at upload)
5. Stand up Langfuse for observability

**Phase 2 — Slab-first flow (4-6 weeks)**
1. Build slab-only upload path (1 photo → ~90% fields filled)
2. Integrate PSA Public API for cert lookups
3. Cert registry dedup + soft-flag for collisions
4. Narrative reveal screen
5. Run with internal users + small beta cohort

**Phase 3 — Memorabilia flow (6-8 weeks)**
1. Extend to multi-photo memorabilia upload
2. COA conditional + OCR pipeline (Sonnet 4.6)
3. Cross-validation logic, discrepancy flagging
4. Low-confidence escalation to Opus 4.7
5. Open-from-start UX (power-user bulk path)

**Phase 4 — Trust & polish (3-4 weeks)**
1. "Verified unique" badge surfacing
2. Provenance chain (owner-to-owner cert linkage)
3. Legacy backfill ("we re-analyzed your old listings")
4. Comp algorithm v3 leveraging the richer field data (same RPC, dramatically better results)

**Total estimated V2 timeline: 4-5 months of focused effort.**

---

## 13. What we're NOT changing

Worth being explicit about:

- The current manual upload flow stays live during V2 development. No user disruption.
- The taxonomy (categories, subcategories, middleware-managed M2M mapping) stays. AI populates within it, doesn't replace it.
- The dynamic fields system stays. AI fills the fields; schema remains the structured backbone.
- The existing 33-field Football Jersey schema stays (with additions). Users *could* still expand and manually edit every field.
- Algorithm v2 for comps stays as-is. It becomes dramatically more effective once AI starts populating the 0%-filled fields, but the algorithm itself doesn't need to change.

The AI flow is **additive intelligence on the existing architecture**, not a replacement of it. This is part of why it's a V2 conversation — the existing bones are good, they just need more data flowing through them.

---

## 14. Key data snapshots (for future reference)

### Football Jersey form structure (33 fields across 4 sections)

- **General Details:** Manufacturer, League/Level, Style, Athlete(s), Size, Version, Color(s), Variation
- **Autograph/Grading Details:** Autographed, Commemorative, Auto Graded, Patches, Auto Grade (0-10), Customization(s), Condition, Overall Grade (0-10), #/Total, Model/Series
- **Unique Attributes:** Inscribed, Inscription(s), Limited Edition, Game Used, Team Issued
- **Authenticity Details:** COA Company + Number (+ Secondary + Additional), LOA Company + Number (+ Secondary + Additional), Notes, Event/Milestone, Team(s)

### Current fill rates snapshot (38 public Football Jerseys, Feb 2026)

- 97% — Overall Grade
- 95% — Autographed
- 87% — Athlete(s)
- 76% — COA Company
- 50% — COA Number
- 11% — LOA Company, Team(s)
- 3% — Condition, League/Level, Notes, Team Issued, Secondary COA
- 0% — **22 other fields** (Size, Style, Version, Manufacturer, Color, Patches, Model, etc.)

### Projected AI fill rates for Ed Reed case

- Photos only: ~20 fields at ≥0.7 confidence
- Photos + COA: ~28 fields, with 15+ at ≥0.9 confidence
- Plus COA image stored as permanent trust artifact

### Cost ballpark

- V1 pre-launch: <$100/month
- Launch growth (10K uploads/month): ~$800/month
- Scale (100K uploads/month): ~$8-15K/month

---

*Document owner: John. Last updated Feb 2026. This is a point-in-time snapshot of a V2 vision conversation — frontier model pricing and capabilities evolve quarterly. Refresh key numbers before committing to budget.*
