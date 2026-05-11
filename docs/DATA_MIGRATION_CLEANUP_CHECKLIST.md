# Data Migration — Post-Cleanup Checklist

**Purpose:** Work items that must complete before the `collectibles` table's AI-enriched columns (`ai_metadata`, `trait_metadata`, `classification`, `confidence`, `traits`) can be implicitly trusted for downstream features — specifically the universal comps algorithm (see `COMPS_ALGORITHM_SPEC.md`).

**Status:** Open. Identified during the 2026-04-27 comps design session by sampling `john@myvitrine.app`'s already-migrated collection. Estimated 1–2 overnight sessions to complete.

**Context:** The new upload pipeline emits clean, canonical keys — future uploads are not an issue. This checklist addresses legacy-database migration artifacts surfaced by comp-algorithm design work.

---

## 1. What sampling revealed

Pulled representative rows from `john@myvitrine.app`'s collection (the only user whose full collection has been migrated to the new architecture). Across baseball balls, jerseys, trading cards, and vinyl records, four data-quality issues consistently appeared.

### Issue 1 — Duplicate keys in `ai_metadata`

Legacy cached-schema keys are coexisting with the new curated-schema keys in the same row.

**Examples observed:**

| Canonical key | Legacy duplicate | Where seen |
| --- | --- | --- |
| `Team(s)` | `teams` | `memorabilia.baseball.ball`, `memorabilia.baseball.jersey` |
| `Athlete(s)/Person` | `players` | `trading_card.single_card.sports` |

Both keys contain the same data (often identical values). Result: comp scoring sees the match twice, inflating the score artificially. Also muddies any downstream analytics.

**Sample row (baseball ball):**
```json
{
  "teams": ["Los Angeles Angels"],
  "Team(s)": ["Los Angeles Angels"],
  ...
}
```

### Issue 2 — Discovery-mode key inconsistency

For classifications using `schema_mode = 'discovery'` (vinyl, sneakers), the AI extracts whatever seems relevant per row rather than hitting a fixed schema. Three vinyl records sampled had three different key vocabularies for the same concepts.

**Observed across three Craig David vinyl records:**

| Concept | Row 1 key | Row 2 key | Row 3 key |
| --- | --- | --- | --- |
| Artist | `artist` | `artist` | `artist_name` |
| Album/Title | `album_title` | `title` | `album_title` |
| Speed | `record_speed` | `speed` | (missing) |
| Format | `record_format` | `format` | `record_format` |

Any structured-match algorithm sees these as unrelated. Must be normalized upstream OR handled via runtime alias map (see comps spec §5).

### Issue 3 — NULL classification rows

13 rows in `john@myvitrine.app`'s collection have `classification = NULL`. These are effectively dark inventory — unusable by the comps algorithm (no gate match possible) and likely broken for filtering / search / detail-screen lens gating as well.

Root cause unknown — migration failure, extraction timeout, or unsupported image input. Needs investigation per row before blanket re-extraction.

### Issue 4 — Upload pipeline verification

User reports new-upload pipeline emits clean canonical keys. Worth a one-time verification diff against a recent upload vs. a legacy row of the same classification to confirm no leakage.

---

## 2. Cleanup tasks

### Task 1 — Dedupe legacy keys in `ai_metadata`

**Approach:** One-time migration. For each known legacy-duplicate pair (see table in Issue 1), merge values into the canonical key and drop the legacy key.

**Migration logic (pseudocode):**
```sql
-- For each row where both keys exist:
UPDATE collectibles
SET ai_metadata = (ai_metadata - 'teams')  -- drop legacy key
WHERE ai_metadata ? 'teams' AND ai_metadata ? 'Team(s)';

-- Edge case: legacy key exists but canonical doesn't (rare). Promote.
UPDATE collectibles
SET ai_metadata = ai_metadata - 'teams' || jsonb_build_object('Team(s)', ai_metadata->'teams')
WHERE ai_metadata ? 'teams' AND NOT (ai_metadata ? 'Team(s)');
```

Apply same pattern for each known legacy/canonical pair. Full list in comps spec §5.

**Completion check:**
```sql
SELECT COUNT(*) FROM collectibles
WHERE ai_metadata ? 'teams' OR ai_metadata ? 'players';
-- should return 0
```

---

### Task 2 — Normalize discovery-mode keys

**Approach:** Two options; pick one.

**Option A — One-time normalization migration.** Build a canonical-key map per `schema_mode = 'discovery'` classification. Walk all discovery rows, rename aliased keys to their canonical form.

Pros: Clean data at rest. No runtime overhead. Simpler downstream code.
Cons: Requires thoughtful canonical-key selection per classification. Irreversible.

**Option B — Runtime alias map.** Don't modify data. Apply aliasing only at match time inside the comps algorithm (and anywhere else that depends on key consistency).

Pros: Reversible. Cheap to implement.
Cons: Every downstream consumer of discovery-mode data must apply the map. Forever.

**Recommendation:** Option A. One-time cost, permanent win.

**Canonical key map (vinyl, seeded from sampling — expand as more discovery classifications appear):**

```
vinyl_record:
  artist       ← [artist, artist_name]
  album_title  ← [album_title, title]
  release_year ← [release_year, year]
  record_speed ← [record_speed, speed]
  record_format ← [record_format, format]
  record_label (canonical)
  catalog_number (canonical)
  country_of_release ← [country_of_release, country]
```

**Completion check:** Sample 10 vinyl rows and verify all use the canonical key set.

---

### Task 3 — Re-extract NULL-classification rows

**Approach:** Investigate before re-running.

**Step 1 — Audit.** List the 13 NULL-classification rows and inspect each:

```sql
SELECT id, title, collectible_type, schema_mode, confidence, created_at,
       jsonb_object_keys(ai_metadata) AS keys
FROM collectibles
WHERE user_id = 'd039f1eb-d0b2-4091-a5fb-702b908e9558'
  AND classification IS NULL;
```

For each row, check:
- Does the row have photos? (no photos → re-extraction impossible without asset recovery)
- Does it have any `ai_metadata` at all? (empty → never extracted)
- Is `collectible_type` set? (if yes, at least the upload succeeded partway)

**Step 2 — Triage.** Bucket the 13 rows:
- **Re-extractable** (has photos, type set, metadata missing) → re-run extraction pipeline
- **Partial** (has some metadata, classification missing) → manual classification or targeted re-run
- **Dead** (no photos, nothing recoverable) → flag for user action (delete or re-upload)

**Step 3 — Execute.** Re-extract the re-extractable bucket. Hand-classify the partial bucket. Surface the dead bucket to the user.

**Completion check:**
```sql
SELECT COUNT(*) FROM collectibles
WHERE user_id = 'd039f1eb-d0b2-4091-a5fb-702b908e9558'
  AND classification IS NULL;
-- should approach 0 (acceptable non-zero if some rows are genuinely dead)
```

---

### Task 4 — Verify new upload pipeline emits canonical keys

**Approach:** One-shot diagnostic, not a migration.

Pick a recent upload (past 7 days) and a legacy row of the same classification. Diff the key sets in `ai_metadata` and `trait_metadata`. Confirm:

- [ ] New upload contains only canonical keys (no legacy duplicates)
- [ ] New upload's key vocabulary matches the canonical set from Task 2 for that classification
- [ ] `confidence` is populated (not null)
- [ ] `traits` array is populated where applicable

If the diagnostic passes, future uploads will not reintroduce the issues above. If it fails, cleanup is Sisyphean until the pipeline is fixed.

---

## 3. SQL diagnostic library

Useful queries during cleanup. Run against the live DB.

### Coverage — how much of the table is on the new architecture?

```sql
SELECT
  schema_mode,
  COUNT(*) AS n,
  SUM(CASE WHEN classification IS NULL THEN 1 ELSE 0 END) AS null_classification,
  SUM(CASE WHEN confidence IS NULL THEN 1 ELSE 0 END) AS null_confidence
FROM collectibles
GROUP BY schema_mode
ORDER BY n DESC;
```

### Legacy-key residue audit

```sql
SELECT
  classification,
  COUNT(*) FILTER (WHERE ai_metadata ? 'teams') AS has_legacy_teams,
  COUNT(*) FILTER (WHERE ai_metadata ? 'players') AS has_legacy_players,
  COUNT(*) AS total
FROM collectibles
WHERE classification IS NOT NULL
GROUP BY classification
HAVING COUNT(*) FILTER (WHERE ai_metadata ? 'teams') > 0
    OR COUNT(*) FILTER (WHERE ai_metadata ? 'players') > 0
ORDER BY total DESC;
```

### Discovery-mode key drift

```sql
-- How many distinct key sets exist per discovery classification?
SELECT
  classification,
  (SELECT jsonb_agg(DISTINCT k ORDER BY k)
   FROM jsonb_object_keys(ai_metadata) AS k) AS keyset_hash,
  COUNT(*) AS rows_with_this_keyset
FROM collectibles
WHERE schema_mode = 'discovery'
GROUP BY classification, ai_metadata
ORDER BY classification, rows_with_this_keyset DESC;
```

### Classification distribution

```sql
SELECT classification, COUNT(*) AS n
FROM collectibles
WHERE classification IS NOT NULL
GROUP BY classification
ORDER BY n DESC;
```

---

## 4. Completion criteria

Migration cleanup is "done" when all four hold:

1. Zero duplicate legacy keys remain in `ai_metadata` across the full table (Task 1 completion query returns 0)
2. All discovery-mode classifications have a single canonical key vocabulary applied (Task 2 spot checks pass)
3. NULL-classification row count is ≤ the genuine-dead bucket identified in Task 3
4. Task 4 diagnostic confirms new uploads are clean

Once those four are green, the comps algorithm (and any other downstream feature depending on clean AI-enriched data) can be implicitly trusted to wire against live data.

---

## 5. Opportunistic improvements (not blocking)

Things worth considering during the cleanup sessions but not required for comps wiring:

- **Add per-field confidence to `field_schema` jsonb** — would enable finer-grained score weighting in the comps algorithm (match on a high-confidence extraction scores higher than match on a low-confidence extraction). Currently `confidence` is row-level only.
- **Index `classification`** — if not already indexed, the comps RPC's gate pre-filter will be slow at scale.
- **Materialized view of per-classification value frequencies** — pre-compute the TF-IDF denominator. Cheap nightly job, material speedup at query time.
- **Canonical trait vocabulary audit** — `traits` array values (`is_autographed`, `is_graded`, etc.) should be verified as a closed enum with no casing/spacing drift.
