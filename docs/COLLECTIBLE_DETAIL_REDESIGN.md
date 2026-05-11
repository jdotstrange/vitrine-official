# Collectible Detail Screen — Redesign Brief

> **Purpose:** Replace the current card-based detail layout with an AI-data-driven, museum-grade presentation that leverages the rich structured data now available on every migrated collectible.
>
> **Design frameworks applied:** iOS HIG, Refactoring UI, Hook Model (Hooked UX), UI/UX Pro Max
>
> **Created:** 2026-04-27

---

## 1. Why Redesign

The current detail screen was built before AI enrichment existed. It shows:
- A user-typed title (often abbreviated/informal: "2012 ASG Street Banner")
- A generic value card
- A "Detail Coverage" trigger that leads to the old `collectible_field_values` system
- A comps section

With the new columns (`listing_title`, `listing_description`, `classification`, `traits`, `ai_metadata`, `field_schema`, `confidence`, `trait_metadata`, `autograph_assessment`, `verification_url`), we have **dramatically richer** and **more consistent** data. The screen should be redesigned from scratch to surface this data — not bolt it onto the old layout.

### What's wrong with the current screen (scored against frameworks)

| Framework | Current Score | Gap |
|-----------|--------------|-----|
| **iOS HIG** | 5/10 | Cards-in-cards visual noise. No clear content hierarchy — title card, value card, and coverage card all compete equally. No deference to the content (the collectible itself). |
| **Refactoring UI** | 4/10 | Everything is boxed in bordered cards with equal visual weight. Labels and values have the same emphasis. Typography hierarchy is flat (title 24px, everything else 10-13px — nothing in between). Too many borders, not enough white space. |
| **Hook Model** | 3/10 | No variable reward on the detail screen. No investment mechanism. No social proof beyond a track count badge. No "hunt" for more info — everything is visible or hidden behind a sheet. |
| **UI/UX Pro Max** | 5/10 | Dark text on white cards is correct for White Cube palette but depth is achieved only through borders, never through spacing or typography weight. No use of the warm palette. |

---

## 2. Design Philosophy

### "The Gallery Wall"

Inspired by how high-end auction houses (Christie's, Sotheby's, Heritage Auctions) and museum apps present individual pieces:

1. **The item is the hero.** The photo takes maximum real estate. Everything else defers.
2. **Provenance and authentication are first-class.** Not buried in a sheet — visible immediately for items that have them.
3. **AI-generated copy replaces user titles.** The `listing_title` becomes the canonical display name. The `listing_description` is the hero paragraph.
4. **Structured facts are scannable.** The `ai_metadata` fields render as a clean vertical list — label above value — not crammed into key:value rows.
5. **Traits are the hook.** Visual pills that immediately communicate what makes this piece special (Autographed, Game Used, Rookie, Limited Edition).

### iOS HIG alignment targets

- **Clarity:** One thing per visual level. Photo → Title → Description → Facts. No competing cards.
- **Deference:** Remove card borders from content sections. Let spacing and typography create hierarchy. The photo section should bleed edge-to-edge.
- **Depth:** Use the bottom sheet pattern (already established for Card Facts and Detail Coverage) for deeper inspection. The main scroll should be clean and linear.

### Refactoring UI alignment targets

- **Hierarchy through 3 levers:** Title = large + bold + dark. Description = medium + normal + dark. Labels = small + medium + muted. Values = medium + semibold + dark.
- **Spacing:** Remove card wrappers. Use 32px between major sections, 16px within sections, 8px between label and value.
- **Typography scale:** 24px (title) → 15px (description body) → 12px (section headers, uppercase letterspaced) → 15px (fact values) → 11px (fact labels).
- **Width:** Description should be max ~65 characters per line for readability.

### Hook Model integration

- **Trigger (internal):** Curiosity about an item → open detail. Desire to verify authenticity → scroll to provenance.
- **Action:** Scroll is the action. Make it effortless with a linear flow, no taps required to see the core story.
- **Variable Reward:** Each collectible reveals different data — some have inscriptions, some have verification URLs, some have game-use provenance. The layout adapts and the user never knows what they'll find next. Comps section provides "hunt" reward.
- **Investment:** Track the item. Share it. The "tracking" action should be more prominent than it is today — it's the primary investment mechanism.

---

## 3. Screen Layout (top to bottom)

### Zone A — The Image (edge-to-edge)

Same as today's `ImageSlider`, but:
- **No status dot overlay on the image.** Status moves to the info area below.
- **Back button and action buttons** remain as the floating overlay (current `DetailTopControls`).
- Image bleeds fully to the screen edges (no horizontal padding).
- 4:5 aspect ratio via `AdaptiveImage` (unchanged).

### Zone B — The Identity Strip

Immediately below the image. This replaces `TitleCard` entirely.

```
┌──────────────────────────────────────────┐
│ [STATUS BADGE]  [VISIBILITY]  [CONFIDENCE] │  ← horizontal row of small pills
│                                            │
│ Shohei Ohtani Signed & Inscribed          │  ← listing_title (24px, bold, -0.5 tracking)
│ Rawlings Big Stick 141B PRO Bat (JSA)     │     wraps naturally, no truncation
│                                            │
│ memorabilia · baseball · bats              │  ← classification breadcrumb (12px, muted)
│                                            │
│ Collected by @username  ·  2h ago          │  ← collector row (13px, muted)
├──────────────────────────────────────────┤
│ ┌──────┐ ┌───────────┐ ┌──────────────┐ │
│ │ SIGNED│ │ GAME USED │ │ NEAR MINT    │ │  ← trait pills derived from traits[] + ai_metadata
│ └──────┘ └───────────┘ └──────────────┘ │
└──────────────────────────────────────────┘
```

**Trait pills** are derived from:
- `traits[]` array → map to display labels: `is_autographed` → "Signed", `is_game_used` → "Game Used"
- `ai_metadata.Condition` → condition pill with semantic color
- `ai_metadata.Limited Edition` → "Limited Edition" if true
- `ai_metadata.Inscribed` → "Inscribed" if true

Pill styling: rounded-full, subtle fill (secondary bg + border), condition pill gets warm color tinting (Mint=green, Near Mint=teal, Very Good=sand, Fair=amber, Poor=red).

**Confidence indicator:** Small dot or checkmark icon next to classification breadcrumb. `high` = green dot, `medium` = amber, `low` = gray. Tapping opens a tooltip/sheet explaining what AI confidence means.

**No card border.** This is a bare section with 20px horizontal padding and 24px vertical spacing separating it from the image above and the next section below.

### Zone C — The Story

The AI-generated description, presented as a clean paragraph — the way an auction house describes a lot.

```
┌──────────────────────────────────────────┐
│ ABOUT THIS PIECE                12px, muted, uppercase, letterspaced
│                                            │
│ An Andruw Jones autographed Louisville    │  15px, normal weight, 1.6 line-height
│ Slugger baseball bat. The bat is signed   │  color: foreground
│ on the barrel in silver ink by the former │  max-width ~65ch equivalent
│ Atlanta Braves outfielder. Jones has      │
│ added several inscriptions celebrating    │
│ his career achievements...                │
│                                            │
│ Read more                                  │  ← expandable if > 4 lines, muted link
└──────────────────────────────────────────┘
```

Falls back to `description` if `listing_description` is null.
If both are null, this section is omitted entirely.

**No card border.** Separated by whitespace only.

### Zone D — Value & Action Bar

Replaces `ValueCard`. Combines value display with the primary user actions.

```
┌──────────────────────────────────────────┐
│                                            │
│  $2,500              ┌─────────────────┐  │
│  Estimated Value     │   Track  (icon) │  │
│                      └─────────────────┘  │
│  12 collectors tracking                    │
│                                            │
└──────────────────────────────────────────┘
```

- Value: 28px JetBrainsMono bold. "Estimated Value" label 11px muted below.
- Track button: Primary filled button (dark bg, white text) for non-owners. Shows solid fill when tracked.
- Tracking count: 12px muted, below the value.
- For **owners**: Track button is replaced with an "Edit" text button, and the value section may show additional context (e.g., "Last updated 3d ago").

This IS a card (subtle border + bg) because it's an action zone — distinct from the content zones above and below. Rounded corners, the single bordered element in the main flow.

### Zone E — Item Details (the ai_metadata grid)

This is the core upgrade. Replaces `DynamicDetailsSection` and `DetailCoverageSheet` entirely.

Renders `ai_metadata` fields using `field_schema` as the type guide. Only fields with non-null, non-empty, non-false values are shown. Organized into logical groups:

**Group 1 — Key Facts** (always shown inline)
Fields: `Athlete(s)/Person`, `Team(s)`, `League/Level`, `Event/Milestone`, `Material`, `Condition`

**Group 2 — Authentication** (shown if any auth field is non-null)
Fields: `Autographed`, `COA Company`, `COA Number`, `Secondary COA Company`, `Secondary COA Number`, `LOA Company`, `LOA Number`, `Auto Grade`, `Auto Graded`

**Group 3 — Inscriptions & Details** (shown if present)
Fields: `Inscription(s)`, `Customization(s)`, `Notes`

**Group 4 — Physical Attributes** (shown if present, item-type-specific)
Fields: All remaining fields from `field_schema` not covered above (e.g., `Grip Tape`, `Grip Style`, `Knob Type`, `Barrel Type`, `Model/Series`, `Player Model`, `Length`, `Weight`, `Dimensions`, `Mounting Hardware`)

**Group 5 — Provenance** (shown if present)
Fields: `Limited Edition`, `#/Total (i.e. 1 of 5)`, `verification_url`

Layout per group:

```
┌──────────────────────────────────────────┐
│ AUTHENTICATION              section header (12px, uppercase, letterspaced, muted)
│                                            │
│ COA COMPANY                                │  label: 11px, uppercase, letterspaced, muted
│ JSA                                        │  value: 15px, semibold, foreground
│                                            │  16px gap to next field
│ CERTIFICATE NUMBER                         │
│ U94615                                     │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ 🔗 Verify on spenceloa.com    →       │ │  verification_url rendered as a tappable row
│ └────────────────────────────────────────┘ │
│                                            │
└──────────────────────────────────────────┘
```

- Section headers have a thin hairline divider above them (not a full card border).
- Boolean fields render as small check/x indicators: `Autographed: ✓` not `Autographed: true`.
- Array fields (`Athlete(s)/Person`, `Team(s)`, `Inscription(s)`) render as comma-separated or as individual pills if <=3 items.
- `verification_url` renders as a special tappable row with external-link icon.
- Empty groups are omitted entirely.

**Expandable behavior:** If total fields > 8, show the first 8 with a "Show all X details" link that expands inline (no sheet). Matches the progressive disclosure pattern.

**No card borders on individual groups.** Groups are separated by 32px spacing and a subtle hairline. The entire Zone E lives in the same scroll — no nested scrolling.

### Zone F — Comps

Unchanged from current `CompsSection`. Horizontal scroll strip with "See All" header. This provides the **Hunt** variable reward — "what else is like this?"

### Zone G — Share & Metadata Footer

A quiet footer area at the bottom of the scroll:

```
│ Share this collectible                     │  tappable row → native share sheet
│ Report a problem                           │  tappable row → support flow (future)
│                                            │
│ Listed 3 months ago · 42 views             │  12px muted
│ AI classification confidence: High         │  12px muted
│ Item ID: d596b083...                       │  10px muted, tappable to copy
```

---

## 4. Data Flow Changes

### What the detail screen needs from the API

The current `getCollectible()` in `lib/api/collectibles.ts` returns a `CreateCollectibleResponse` that does NOT include the new AI columns. The route page (`app/collectible/[id]/index.tsx`) maps this into a `MemorabiliaDetailState`.

**Required changes:**

1. **`getCollectible()`** must also select and return: `listing_title`, `listing_description`, `classification`, `traits`, `confidence`, `ai_metadata`, `field_schema`, `trait_metadata`, `autograph_assessment`, `verification_url`, `schema_mode`.

2. **`CollectibleItem` interface** in `collectible-detail.tsx` must be extended with these fields.

3. **`MemorabiliaDetailState`** in the route page must pass them through.

4. **The `dynamicDetails` / `DynamicDetailsSection` / `DetailCoverageSheet` / `DetailCoverageCard` system is retired** for items that have `ai_metadata`. Fallback to the old system for items where `ai_metadata` is null (un-migrated items behind the `listing_title IS NOT NULL` filter won't hit this, but safety net).

### New component tree

```
<CollectibleDetail>
  <DetailTopControls />              — unchanged
  <ScrollView>
    <ImageSlider />                  — unchanged
    <IdentityStrip />                — NEW: replaces TitleCard
    <StorySection />                 — NEW: listing_description paragraph
    <ValueActionBar />               — NEW: replaces ValueCard, adds Track CTA
    <ItemDetailsGrid />              — NEW: replaces DynamicDetailsSection + DetailCoverageSheet
    <CompsSection />                 — unchanged
    <DetailFooter />                 — NEW: share, report, metadata
  </ScrollView>
  <DeleteConfirmModal />             — unchanged
  <EditActionSheet />                — simplified (future: adapt for AI-enriched editing)
  <EditInfoModal />                  — unchanged
  <QRCodeModal />                    — unchanged
  <Toast />                          — unchanged
</CollectibleDetail>
```

---

## 5. Trait Pill System

Traits are the most visually impactful new element. They communicate at a glance what makes an item special.

### Derivation logic

```typescript
interface TraitPill {
  label: string;
  variant: 'default' | 'condition' | 'highlight';
  icon?: string;  // lucide icon name
}

function deriveTraits(row): TraitPill[] {
  const pills: TraitPill[] = [];

  // From traits[] array
  if (traits.includes('is_autographed'))  pills.push({ label: 'Signed', variant: 'highlight', icon: 'pen-tool' });
  if (traits.includes('is_game_used'))    pills.push({ label: 'Game Used', variant: 'highlight', icon: 'trophy' });
  if (traits.includes('is_rookie'))       pills.push({ label: 'Rookie', variant: 'highlight', icon: 'star' });

  // From ai_metadata booleans
  if (ai_metadata?.Inscribed)        pills.push({ label: 'Inscribed', variant: 'default' });
  if (ai_metadata?.['Limited Edition']) pills.push({ label: 'Limited Edition', variant: 'default' });
  if (ai_metadata?.['Player Model'])    pills.push({ label: 'Player Model', variant: 'default' });

  // Condition (always last, different color)
  if (ai_metadata?.Condition) {
    pills.push({ label: ai_metadata.Condition, variant: 'condition' });
  }

  return pills;
}
```

### Visual variants

| Variant | Background | Border | Text |
|---------|-----------|--------|------|
| `default` | `secondary` (#F5F5F0) | `border` (rgba 0,0,0,0.08) | `foreground` (#111) |
| `highlight` | `accent` + 10% opacity | `accent` + 25% opacity | `accent` (#2D9B4C) |
| `condition` | Warm tint based on level | Warm border | Dark text |

Condition color mapping:
- Mint → `warmSage` bg, `accent` border
- Near Mint → `#E8F4EC` bg, `accent` text
- Very Good → `warmSand` bg + 30%, `warning` border
- Fair → `warmSand` bg, `warning` text
- Poor → `gradientPink` bg, `destructive` text

---

## 6. Responsive Sections — What Shows When

Not every item has every field. The screen must gracefully adapt:

| Data present | Section behavior |
|-------------|-----------------|
| `listing_title` is null | Fall back to `title` |
| `listing_description` is null | Fall back to `description`. If both null, omit Story section. |
| `traits[]` is empty AND no boolean traits | Omit trait pills row entirely |
| `ai_metadata` is null | Fall back to old `DynamicDetailsSection` (legacy path) |
| `verification_url` is null | Omit the verification row |
| `autograph_assessment` is non-null | Render a dedicated "Autograph Analysis" subsection within Authentication group |
| No Comps found | Omit Comps section (already handled) |
| `confidence` is null | Omit confidence indicator |

---

## 7. Interaction Patterns

| Element | Tap behavior |
|---------|-------------|
| Trait pills | No action (informational). Future: filter by trait in explore. |
| Classification breadcrumb | No action. Future: navigate to category browse. |
| Track button | Haptic (medium impact) + optimistic toggle + fire notification |
| Value amount | Owner: opens Edit Pricing. Non-owner: no action. |
| "Read more" on description | Expand to full text inline with 200ms ease-out animation |
| Verification URL row | Open in-app browser (WebView or `Linking.openURL`) |
| Collector name | Navigate to collector's profile |
| Share row (footer) | Native share sheet |
| Item ID (footer) | Copy to clipboard + toast "Copied" |
| "Show all X details" | Expand remaining fields inline with staggered 150ms reveal |
| Image | Existing full-screen gallery viewer |

---

## 8. Implementation Plan

### Phase 1 — Data plumbing
1. Extend `getCollectible()` to return new AI columns
2. Extend `CreateCollectibleResponse` type
3. Update `MemorabiliaDetailState` in the route page
4. Pass new fields through to `CollectibleDetail`

### Phase 2 — New components
1. `IdentityStrip` — title, classification, collector, trait pills
2. `StorySection` — expandable description paragraph
3. `ValueActionBar` — value display + track/edit CTA
4. `ItemDetailsGrid` — ai_metadata renderer with field_schema types
5. `DetailFooter` — share, report, metadata

### Phase 3 — Integration
1. Replace component tree in `collectible-detail.tsx`
2. Remove old `TitleCard`, `ValueCard`, `DynamicDetailsSection`, `DetailCoverageSheet`, `DetailCoverageCard` imports
3. Keep legacy fallback path for items where `ai_metadata` is null
4. Wire trait derivation logic
5. Wire field grouping logic

### Phase 4 — Polish
1. Animation: staggered section entrance on load (100ms delay per section, opacity + translateY, 200ms duration, ease-out)
2. Haptics on track toggle
3. Skeleton loading state for new layout
4. Test across real data (all 8 migrated items)

---

## 9. Components to Retire

| Component | Replacement |
|-----------|------------|
| `detail/title-card.tsx` | `IdentityStrip` |
| `detail/value-card.tsx` | `ValueActionBar` |
| `detail/detail-coverage-card.tsx` | Retired (no inline card needed) |
| `detail/detail-coverage-sheet.tsx` | Retired (details shown inline in `ItemDetailsGrid`) |
| `detail/dynamic-details-section.tsx` | Retired (replaced by `ItemDetailsGrid`) |

**Keep but unchanged:** `ImageSlider`, `DetailTopControls`, `CompsSection`, `QRCodeModal`, `EditInfoModal`, `EditPricingModal`

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| **iOS HIG score** | 8+/10 — Clean hierarchy, proper deference to content, standard iOS patterns |
| **Refactoring UI score** | 8+/10 — Clear 3-level hierarchy, generous spacing, no competing card borders |
| **Hook Model score** | 6+/10 — Variable reward via adaptive sections, Track as investment, social proof visible |
| **UI/UX Pro Max score** | 8+/10 — White Cube palette leveraged properly, warm accents for condition, monospace for values |
| **User test** | A user can identify what the item is, who signed it, and whether it's authenticated within 3 seconds of the screen loading |

---

## Appendix A — Real Data Samples

### Sample 1: Shohei Ohtani Bat (rich)
- **listing_title:** "Shohei Ohtani Signed & Inscribed Rawlings Big Stick 141B PRO Bat (JSA)"
- **classification:** memorabilia.baseball.bats
- **traits:** `[is_autographed]`
- **condition:** Near Mint
- **COA:** JSA U94615
- **verification_url:** `https://www.spenceloa.com/cert-verification?cert=U94615`
- **inscriptions:** ["17"]
- **Visible pills:** `Signed` · `Inscribed` · `Near Mint`
- **Sections visible:** Identity, Story, Value, Key Facts, Authentication (with verify link), Inscriptions, Comps

### Sample 2: Balotelli Bobblehead (minimal)
- **listing_title:** "Mario Balotelli Italy National Team Euro 2012 Celebration Bobblehead"
- **classification:** memorabilia.soccer.bobblehead
- **traits:** `[]`
- **condition:** null
- **No COA, no inscriptions, no verification
- **Visible pills:** (none)
- **Sections visible:** Identity, Story, Value, Key Facts (Athletes, Team, League, Event), Comps

### Sample 3: Bulls Floor Section (game used, no autograph)
- **listing_title:** "Chicago Bulls 1995-98 United Center Game-Used Floor Section (62/120)"
- **classification:** memorabilia.basketball.floorboard
- **traits:** `[is_game_used]`
- **condition:** Very Good
- **Limited Edition:** true, #62/120
- **Visible pills:** `Game Used` · `Limited Edition` · `Very Good`
- **Sections visible:** Identity, Story, Value, Key Facts, Physical Attributes (Material: Hardwood Maple), Provenance (#/Total), Comps
