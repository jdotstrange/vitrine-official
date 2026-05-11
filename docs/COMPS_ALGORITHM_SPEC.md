# Comps Algorithm — Universal Matching Spec

**Purpose:** Runbook for the universal comps algorithm. This doc captures every decision made during the 2026-04-27 design session so the actual wiring, when data is clean enough to trust, is a mechanical exercise rather than a re-derivation.

**Status:** Design locked. Wiring deferred pending completion of legacy-database migration cleanup (see `DATA_MIGRATION_CLEANUP_CHECKLIST.md`). UI already reflects these decisions — see `app/(design-lab)/collectible-detail.tsx` CompsLens block.

**Non-goals:** This is not a machine-learning spec. No training, no embeddings, no external APIs. The algorithm is deterministic and operates entirely on Vitrine's existing AI-enriched schema (`ai_metadata`, `trait_metadata`, `traits`, `classification`, `listing_title`, `listing_description`).

---

## 1. Core principle

**Trust the AI's extraction.** The AI-powered upload pipeline already encodes our product opinion about what matters per classification by choosing which fields to populate in `ai_metadata` and `trait_metadata`. A signed baseball's `ai_metadata` has `{Athlete(s), Team(s), Manufacturer, Condition, Event/Milestone, ...}` because those are the fields that matter for balls. A vinyl record has `{artist, album_title, record_label, release_year, ...}` because those are the fields that matter for vinyl.

**Implication:** We do not hand-craft per-classification weights. We count matches against the AI's populated fields, discount common values, and let the data speak.

**Anti-principle rejected:** The alternative approach — a hand-crafted tier system assigning specific weights to fields like `identity > product > era > condition` — was explored and rejected. It doesn't scale across classifications, requires maintenance as collectible types expand, and bakes in our pre-AI opinions about what matters. The universal approach below does none of those things.

---

## 2. The algorithm in one formula

```
GATE: candidate.classification matches target.classification (hierarchical fallback)

SCORE =
    Σ(ai_metadata key/value matches, TF-IDF weighted by value frequency)
  + Σ(trait_metadata key/value matches, TF-IDF weighted)
  + Σ(traits array overlap, Jaccard)
  + fuzzyMatch(listing_title)              × HIGH coefficient
  + fuzzyMatch(listing_description)        × LOW coefficient

FINAL_SCORE = SCORE × confidence_modifier
  where high=1.0, medium=0.75, low=0.5

MATCH_PCT = normalize(FINAL_SCORE to 0–100 scale per classification)
```

Output is a ranked list of candidates with a normalized match percentage. Match percentages map 1:1 to UI tiers (see §7).

---

## 3. The gate — hierarchical classification match

Classification is a 3-level dotted taxonomy (`type.sport.subcategory`, e.g., `memorabilia.baseball.ball`). The gate filters the candidate pool **before** scoring. Scoring never runs on cross-classification pairs.

### Gate logic

```
1. Try exact match on full classification.
   If pool size ≥ MIN_POOL (5), proceed to score.

2. Fall back to parent level (strip last segment).
   "memorabilia.baseball.ball" → "memorabilia.baseball.*"
   If pool size ≥ MIN_POOL, proceed to score with candidates from this broader pool.

3. Fall back to type level (strip another segment).
   "memorabilia.baseball.*" → "memorabilia.*.*"
   Proceed to score regardless of pool size.

4. If pool at type level is still empty, return empty comp set.
```

### Why a gate, not a weight

A common mistake is making classification "just a heavily-weighted signal." That's wrong: a signed Mike Trout jersey and a Mike Trout baseball can share athlete, year, and is_autographed — enough that a weighted scheme would surface cross-classification matches. They are not comps. Their prices move on different market dynamics. **Classification is a prerequisite, not a contributor.**

### Why hierarchical fallback

Rare classifications (basketball jersey, signed vinyl, sneaker) shouldn't return empty comp sets in a thin platform inventory. Graceful degradation to broader pools is better UX than "no comps found." The fallback is encoded in the `MATCH_PCT` normalization — items matched at a broader gate level score lower than same-level matches.

---

## 4. Signal extraction & scoring

### 4.1 Scalar fields (strings, numbers, booleans)

For each key in `ai_metadata ∪ trait_metadata`:

```
if target[key] == candidate[key]:
  score += log(N / freq(value, classification, key))
  where:
    N = count of candidates in classification pool
    freq = count of rows in pool where this key == this value
```

**Effect:** Rare values score high, common values score low. Auto-calibrating — no hand-tuned weights.

**Example for `memorabilia.baseball.ball` pool of 271 rows:**
- `Athlete(s)/Person: ["Mike Trout"]` → appears in ~5 rows → `log(271/5) ≈ 4.0` ← strong signal
- `Manufacturer: "Rawlings"` → appears in ~250 rows → `log(271/250) ≈ 0.08` ← near-zero signal
- `League/Level: "MLB"` → appears in ~265 rows → `log(271/265) ≈ 0.02` ← near-zero signal

The "junk field" problem solves itself.

### 4.2 Array fields

For array-valued keys (`Team(s)`, `Athlete(s)/Person`, `Patches`, `authentications`, `additional_signers`, etc.):

```
jaccard = |target[key] ∩ candidate[key]| / |target[key] ∪ candidate[key]|
score += jaccard × log(N / avg_freq(values, classification, key))
```

**Effect:** Partial overlap scores proportionally (dual-signed ball vs. single-signed ball of one of the same signers = partial credit). Full overlap of rare values scores highest.

### 4.3 Fuzzy text — `listing_title`

Normalize both titles (lowercase, strip punctuation, tokenize), then compute token-Jaccard or trigram similarity. Coefficient: `HIGH` (tuned empirically post-wiring, starting value `3.0`).

**Why high weight:** `listing_title` is the owner's distilled description of the object. It compensates for AI extraction gaps and surfaces colloquial set names, nicknames, and shorthand grading lingo.

### 4.4 Fuzzy text — `listing_description`

Same approach as title, with token-level IDF to filter common filler words ("great", "mint", "DM me"). Coefficient: `LOW` (starting value `0.3`).

**Why low weight:** Descriptions are noisy. Reserve them as tiebreakers between otherwise-equal candidates, not primary signals.

### 4.5 Confidence modifier

Multiply the raw score by the row's `confidence` column:

| Confidence | Multiplier |
| --- | --- |
| `high` | 1.0 |
| `medium` | 0.75 |
| `low` | 0.5 |

**Why row-level, not field-level:** The schema stores `confidence` as a single text column per row, not per-field. If a future migration adds per-field confidence to `field_schema` jsonb, this multiplier can be refined to weight each match individually.

---

## 5. Key aliasing map

Discovery-mode classifications (vinyl, sneaker) and legacy cached-mode rows sometimes use different key names for the same semantic concept. Match-time alias normalization collapses these before comparison.

### Known aliases (seeded from 2026-04-27 sampling)

| Canonical key | Aliases seen |
| --- | --- |
| `Team(s)` | `teams` |
| `Athlete(s)/Person` | `players` |
| `album_title` | `title` (vinyl) |
| `artist` | `artist_name` |
| `record_speed` | `speed` |
| `record_format` | `format` |
| `release_year` | `year` |

**Long-term preference:** Normalize at extraction time (migration cleanup) rather than match time. Alias map is a runtime safety net while legacy data still flows.

See `DATA_MIGRATION_CLEANUP_CHECKLIST.md` for upstream cleanup work.

---

## 6. Normalization to match percentage

Raw scores are unbounded and classification-dependent (a baseball ball pool of 271 yields very different score magnitudes than a sneaker pool of 1). Normalize each candidate's score to a 0–100 percentage **within its classification**:

```
match_pct = clamp(
  (candidate_score - min_score_in_pool) / (max_score_in_pool - min_score_in_pool)
  × 100,
  0, 100
)
```

This produces consistent visual tiers across all classifications — a "perfect match" baseball ball and a "perfect match" sneaker both read as 95%+ to the user, even though their raw scores differ by orders of magnitude.

---

## 7. Tier output — UI contract

The normalized match percentage maps 1:1 to three UI tiers. **These thresholds are the contract between this algorithm and the CompsLens UI.** Editing them requires updating both.

| Tier | Threshold | UI treatment |
| --- | --- | --- |
| Perfect | `≥ 90%` | Green match % text (`COLORS.semanticGreen`) |
| Strong | `70–89%` | Blue match % text (`COLORS.semanticBlue`) |
| Loose | `< 70%` | Neutral white match % text (`COLORS.textPrimary`) |

Referenced in code: `getMatchTier(pct)` in `app/(design-lab)/collectible-detail.tsx`.

---

## 8. RPC signature

### Input

```typescript
{
  collectibleId: string;
  limit?: number;        // default 24, max 100
  excludeOwnerId?: string; // optional — hide items from same owner
}
```

### Output

```typescript
{
  targetId: string;
  classification: string;
  gateLevel: 'exact' | 'parent' | 'type';  // tells UI what level of match we achieved
  summary: {
    totalCount: number;
    avgMatch: number;        // 0–100 integer
    medianPrice: number;     // USD cents or dollars (TBD)
  };
  comps: Array<{
    id: string;
    photoUrl: string;
    title: string;            // owner's listing_title, truncated
    subtitle: string;          // derived identity + variant line (AI-composed)
    price: number;
    matchPct: number;         // 0–100 integer (post-normalization)
    status: 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE' | 'NFST';
  }>;
}
```

Nothing in the UI needs to change when this RPC replaces `MOCK_COMPS`. The mock data shape was designed to match this response exactly.

---

## 9. Wiring checklist

In order, once migration cleanup completes:

- [ ] Audit `ai_metadata` for remaining duplicate keys (see cleanup doc)
- [ ] Build per-classification value-frequency table (cache in Supabase or compute at query time via CTE)
- [ ] Implement `extractSignals(row)` and `computeSimilarity(target, candidate)` as pure TypeScript, test against in-memory rows pulled from live DB
- [ ] Dogfood scoring against john@myvitrine.app collection — eyeball top-3 comps for known targets (Mike Trout 2020 TTT Ruby `/10`, Tom Brady Expos jersey, etc.)
- [ ] Wire as Supabase RPC (`get_comps_for_collectible(collectible_id text, ...)`)
- [ ] Replace `MOCK_COMPS` + `SUMMARY_STATS` in CompsLens with RPC call + loading/error states
- [ ] Design & implement 0-comps and sparse empty states
- [ ] Performance test — ensure gate pre-filtering keeps query under 500ms for typical pools

---

## 10. Known caveats

- **Data is not yet trustworthy for wiring.** Migration cleanup (per companion doc) must complete first. Building against dirty data bakes algorithm bugs and data bugs into the same debugging surface.
- **Jaccard for arrays is naive.** Doesn't account for cardinality asymmetry (a 2-signer ball sharing 1 signer with a 10-signer ball scores lower than intuition expects). Revisit post-v1 if empirical results feel wrong.
- **TF-IDF requires a value-frequency table.** Either pre-compute nightly (cached) or compute via subquery at match time (slower but always fresh). Decision deferred to wiring time based on performance measurement.
- **Normalization within classification means scores aren't globally comparable.** A "90% match" on a sneaker is not the same raw quality as a "90% match" on a baseball ball — but from a user-experience standpoint that's a feature, not a bug.
- **Platform inventory sparsity** affects fallback behavior. When the full legacy DB is migrated, pool sizes grow and fallback fires less often. Monitor the distribution of `gateLevel` in RPC responses post-launch.
