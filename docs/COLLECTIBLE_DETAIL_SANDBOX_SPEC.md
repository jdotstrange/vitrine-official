# Collectible Detail — Sandbox Composition Spec

**Purpose:** Target composition for the first hardcoded sandbox screen in the new visual DNA. This is the proving ground for the "void + frost + serif" system inspired by the Resend DNA, translated for Vitrine's Gen X memorabilia collector audience and its AI-enriched data layer.

**Status:** Ready to build. All macro decisions (dark-only, no visible AI cue, font stack, sandbox-first approach) are locked. Numbers in this spec are starting points — the sandbox is where they get tuned against real content on real devices.

**Non-goals:** This spec is not the design system. It's not a token registry. It's a single-screen composition brief that'll *produce* the tokens once it's locked.

---

## 1. The canvas

- **Background:** Pure black (`#000000`). Full bleed, edge to edge, including under the status bar. No gradients, no tints, no surface elevation. The void is the canvas.
- **Primary text:** Near-white (`#f0f0f0`). Not pure white — pure white against pure black is too harsh and clinical.
- **Secondary text:** Silver (`#a1a4a5`). For captions, collector names, dates, metadata labels.
- **Tertiary text:** Dark gray (`#5c5c5c`) reserved for de-emphasized content (dividers, placeholders, disabled states).
- **Frost border (the signature):** `rgba(214, 235, 253, 0.19)` — the icy-blue-tinted 1px line that replaces every shadow, elevation, and neutral gray divider we currently use. If you're tempted to reach for `border: 1px solid #333`, reach for frost instead.
- **Frost divider (softer variant):** `rgba(214, 235, 253, 0.12)` — for row dividers inside cards, where the signature border would be too loud.

### Semantic accent palette

Used sparingly. One accent per component, never mixed. Low-opacity for backgrounds (12–22%), full opacity for dots/text:

| Token | Base | Semantic use |
| --- | --- | --- |
| Green | `#11ff99` | Verified / authenticated / FOR_SALE |
| Blue | `#3b9eff` | Catalog / reference / FOR_TRADE |
| Orange | `#ff801f` | Hot / active / SELL_TRADE |
| Yellow | `#ffc53d` | Caution / condition concern / estimate |
| Red | `#ff2047` | Flagged / destructive / private |

For v1, status indicators use: green (FOR_SALE), blue (FOR_TRADE), orange (SELL_TRADE), silver (NFST).

---

## 2. The type system

Four fonts, four roles, they never cross lanes.

| Font | Role | Google Fonts package |
| --- | --- | --- |
| **Libre Caslon Display** | Hero titles only | `@expo-google-fonts/libre-caslon-display` |
| **Libre Caslon Text** | Smaller serif use (pull quotes, emphasis — sparing) | `@expo-google-fonts/libre-caslon-text` |
| **Space Grotesk** | Section headers, kickers, nav chrome | `@expo-google-fonts/space-grotesk` |
| **Inter** | Body, UI, buttons, everything default | `@expo-google-fonts/inter` |
| **JetBrains Mono** | Cert numbers, serials, years, confidence scores, IDs, any machine-readable data | `@expo-google-fonts/jetbrains-mono` |

### Starting scale (mobile, to be tuned in sandbox)

| Role | Font | Size | Weight | Line height | Letter spacing | Case |
| --- | --- | --- | --- | --- | --- | --- |
| Hero title | Libre Caslon Display | 34px | 400 | 1.08 | -0.3px | Sentence |
| Section header (kicker) | Space Grotesk | 11px | 600 | 1.30 | +1.2px | UPPERCASE |
| Subsection label | Space Grotesk | 12px | 500 | 1.30 | +0.8px | UPPERCASE |
| Body large | Inter | 16px | 400 | 1.55 | normal | Sentence |
| Body | Inter | 14px | 400 | 1.50 | normal | Sentence |
| Caption | Inter | 13px | 400 | 1.45 | normal | Sentence |
| Metadata label | Inter | 13px | 500 | 1.40 | normal | Sentence |
| Metadata value (text) | Inter | 15px | 400 | 1.40 | normal | Sentence |
| Metadata value (data) | JetBrains Mono | 14px | 400 | 1.40 | normal | As-is |
| Date stamp | JetBrains Mono | 11px | 400 | 1.30 | normal | Sentence |
| Pill / badge | Inter | 12px | 500 | 1.30 | normal | Sentence |
| Price (action bar) | Inter + JetBrains Mono split | 22px + 20px | 500 / 400 | 1.0 | normal | — |

### Typography principles

- **Serif is sacred.** Libre Caslon Display only appears at the title. It never shows up in buttons, rows, captions, or nav. Its rarity is what makes it land.
- **Monospace carries provenance.** Anything that is a code, number, identifier, year, serial, grade, ratio (10/10), or confidence score renders in JetBrains Mono. Company names, descriptions, prose — Inter. "Fanatics Authentic - BQ15604" should render with "Fanatics Authentic" in Inter and "BQ15604" in JetBrains Mono. That split is doing real semantic work; don't collapse it for convenience.
- **Kickers are Space Grotesk only.** Uppercase, positive tracking, section-header-like. Never Inter.
- **Caslon italic is available if we need it.** For attributions, quotations, AI-derived prose where we want to signal voice. Use sparingly, never banned.

---

## 3. Material & shape

- **Radii:**
  - 4px — inputs, small interactive elements (sparingly)
  - 12px — medium containers, compact pills
  - 16px — cards, inset grouped list sections, images
  - 24px — hero image corners if we choose to round them (leaning no — full bleed is better)
  - 9999px — pill CTAs, status badges, trait chips

- **Borders are the depth system.** We do not use shadow for elevation. A card on black is defined by its frost border, not by a drop shadow (which wouldn't read anyway). One exception: the sticky compact header gets a very subtle shadow below it on scroll to telegraph "this is floating above the content" — kept understated.

- **Surfaces:** Transparent by default. Cards and groups use `transparent` background + 1px frost border. The black shows through. This is what makes the whole screen feel like "content floating in space" rather than "cards stacked on a gray page."

- **Divider rule:** Inside a frost-bordered card, rows are separated by the softer frost divider (`rgba(214, 235, 253, 0.12)`), full-width, 1px. No left/right inset on dividers unless specifically aligning with text.

---

## 4. The screen, top to bottom

### 4.1 Hero

- **Full-bleed image area**, edge-to-edge horizontally, starting behind the safe-area top.
- **Two-layer composition** (already built in `CollapsingHero`):
  - Background layer: `expo-image` with `contentFit="cover"` and `blurRadius: 40+`, opacity ~0.6, sitting on the black. This creates an ambient, gallery-lit halo that never clips.
  - Foreground layer: `expo-image` with `contentFit="contain"`, full opacity. The subject is never cropped.
- **Height:** ~55% of screen height at rest. Compresses on scroll (collapsing behavior stays). Stretches on overscroll (pull-down), as it does today.
- **Pagination dots** at bottom for multi-image items — small (4px diameter), spaced 6px apart, frost-bordered unfilled for inactive, near-white filled for active. Lives over the image with enough padding from the image bottom to not compete with the subject.
- **No vignette** for v1. If the composition feels too flat without one, we add a very subtle radial darken at ~10% max in iteration.
- **Top-right controls** (back, more, ownership CTAs) float over the hero. They'll need a subtle scrim or the frost border alone to stay legible — see §4.2.

### 4.2 Top controls (floating over hero)

- **Back button:** circular, 36px, transparent fill, 1px frost border. Icon: `lucide-react-native` ChevronLeft, silver (`#a1a4a5`), 18px. Positioned 16px from leading edge, at top safe-area inset + 8px.
- **More button (…):** same treatment, trailing edge. Icon: MoreHorizontal. Available to owner and non-owner alike — opens the action sheet described in §4.9.
- **No backdrop blur on the buttons themselves.** The frost border carries enough definition. If they disappear against bright imagery, we add a subtle scrim behind each button as an iteration (not upfront).

### 4.3 Compact header (sticky, appears on scroll)

- Slides down + fades in once the hero has compressed past ~60% scroll.
- **Background:** `expo-blur` with `intensity={60}`, `tint="dark"`. Nearly opaque but with the faintest motion through it.
- **Bottom border:** 1px frost.
- **Content (left → right):** 28×28 thumbnail (6px radius), title truncated (Inter 15px weight 500 near-white), more button on trailing edge.
- **Back button replaces the floating one** once compact header is shown.
- **No subtitle** in the compact header — title only, in Inter not Caslon (the Caslon moment has already happened; reintroducing it here would cheapen it).

### 4.4 Identity strip (directly below hero, above fold)

Vertical composition with generous spacing:

1. **Kicker** (collectible type)
   - Space Grotesk 11px 600 UPPERCASE tracked +1.2px, silver color.
   - Examples: `TRADING CARD`, `MEMORABILIA`, `SNEAKER`, `VINYL RECORD`.
   - `paddingHorizontal: 20px` (aligned with every other text element).
   - `marginBottom: 6px`.

2. **Title**
   - Libre Caslon Display 34px 400, line-height 1.08, letter-spacing -0.3px.
   - Near-white.
   - No truncation — wraps as needed. Use the AI `listing_title` if present, else fallback to `title`.
   - `marginBottom: 10px`.

3. **Collector + date row**
   - Collector: Inter 13px 400 silver. Tappable (calls `onCollectorClick`).
   - Separator: `·` (middle dot), silver, Inter.
   - Date: JetBrains Mono 11px 400 silver. Uses existing `formatAddedOn` helper ("Added just now", "Added today", "Added on Apr 20").
   - Entire row one line; truncates collector name with ellipsis if needed.
   - `marginBottom: 14px`.

4. **Badge / trait row**
   - Horizontally scrolling (no visible scroll indicator).
   - **Status badge first** — pill 9999px radius, transparent bg, 1px frost border, 6px vertical × 10px horizontal padding.
     - Contents: 6px colored dot + Inter 12px 500 label ("FOR SALE", "FOR TRADE", "SELL + TRADE", "NFST").
     - Colored dot uses the semantic palette (§1) at full opacity. NFST dot is silver.
   - **Trait pills follow** (Signed, Game Used, Rookie — the filtered set we locked in last week). Same pill treatment, no colored dot. Inter 12px 500 near-white.
   - Gap between pills: 8px.
   - `paddingHorizontal: 20px` on the scroll content (so the first pill aligns with text above).

### 4.5 Story section

- No heading ("About This Piece" was retired last week — that decision stays).
- Inter 16px 400 near-white, line-height 1.55.
- Uses AI `listing_description` if present, else fallback to `description`.
- No truncation, no "read more" — full text, reader can trust themselves.
- `paddingHorizontal: 20px`, `marginTop: 24px`, `marginBottom: 32px`.

### 4.6 Metadata section — Collectible Details

Data source: `ai_metadata`, filtered to drop `Notes` and `Customizations` (keys already skipped). Uses the `jsonbToRows` helper already in place.

- **Section header (kicker)**
  - Space Grotesk 11px 600 UPPERCASE tracked +1.2px, silver color.
  - Text: "COLLECTIBLE DETAILS".
  - `paddingHorizontal: 20px`, `marginBottom: 10px`.

- **Card**
  - `marginHorizontal: 4px` (so that with the 16px inner padding, text aligns at 20px from screen edge).
  - Transparent background.
  - 1px frost border (`rgba(214, 235, 253, 0.19)`).
  - Border radius 16px.
  - No shadow.

- **Rows**
  - Horizontal layout: label left (flex-start), value right (flex-end, `textAlign: right`).
  - Label: Inter 13px 500 silver.
  - Value: Inter 15px 400 near-white.
  - **Values that look like data → JetBrains Mono 14px.** Heuristic in `jsonbToRows`: numbers, years, ratios (n/m), alphanumeric codes without spaces longer than 4 chars, ISO-like dates.
  - Divider between rows: full-width 1px frost-divider (`rgba(214, 235, 253, 0.12)`). Last row has no divider below.
  - Row padding: 14px vertical, 16px horizontal.
  - `false` booleans render as "No". `null` rows are hidden. Sentence-case applied to string values. (All of this exists in `jsonbToRows`.)

### 4.7 Metadata section — Authentications + Authenticity Details

Data source: `trait_metadata`, with `item_type` and `authentications` explicitly excluded from the generic render (already skipped). `authentications` is rendered separately.

Structure:

- **Single shared kicker header** above both cards: "AUTHENTICITY DETAILS".
- **Authentications card** (first, only if `authentications` is non-empty):
  - No inner section header; it just sits under the shared kicker.
  - One row per authentication entry, stacked vertically.
  - Each row renders as: `<Inter>{company}</Inter> <MutedSeparator> <JetBrainsMono>{number}</JetBrainsMono>`.
    - Separator is an em dash `—` or middle dot `·` in silver.
  - `type` field is dropped (last week's decision).
  - Single line per entry, `numberOfLines={1}`, `ellipsizeMode="tail"`.
  - Tight vertical padding (10–12px per line) since these are short.
- **Authenticity Details card** (second, if `trait_metadata` has any non-excluded fields):
  - Renders the remaining trait_metadata via `jsonbToRows` with the same row treatment as Collectible Details.
  - Tight top margin (10px) so it visually groups with the Authentications card under the shared kicker.

### 4.8 Floating track bar (bottom action)

- Bottom-docked, stretched edge-to-edge, safe-area-inset respected.
- **Background:** `expo-blur` intensity ~50, dark tint. Allows content to glide under it.
- **Top border:** 1px frost.
- **Content (left → right):**
  - Price block (leading edge):
    - Currency symbol: Inter 16px 400 silver.
    - Amount: JetBrains Mono 22px 500 near-white. (Monospace digits carry "spec sheet" weight.)
    - If no price: "Not for sale" in Inter 13px silver, no amount.
  - **CTA pill** (trailing edge):
    - **Owner:** transparent fill, 1px frost border, Inter 14px 500 near-white, label "Edit". Pill 9999px radius, 10×18 padding.
    - **Non-owner, track available:** white solid fill (`#ffffff`), black text (`#000000`), Inter 14px 600, label "Track".
    - **Non-owner, already tracking:** transparent fill, 1px frost border, Inter 14px 500 near-white, label "Tracking ✓".

### 4.9 Top-right action sheet

Opens when the "…" button is tapped, regardless of ownership (already true in current implementation).

- Sheet material: transparent black overlay (rgba(0, 0, 0, 0.7)) + a bottom-docked sheet with:
  - Background: near-black (`#0a0a0a`) with 1px frost border top.
  - Corner radius: 16px top-left + top-right only.
- Rows, full-width tap targets, 56px height each, frost-divider between rows.
- Row content: icon left (20px, silver), Inter 15px 400 near-white label, chevron or nothing on right.
- **Owner options:** Edit collectible / QR code / Share / Delete (Delete is red `#ff2047`).
- **Non-owner options:** QR code / Share / Report a problem (Report is red).
- Cancel button: separate pill-shaped card below the options, `marginTop: 8px`, 1px frost border, Inter 15px 500 near-white, label "Cancel".

---

## 5. Motion

- Hero collapse + parallax: existing curve, no changes.
- Compact header reveal: fade + translateY, 180ms, `Easing.out(Easing.cubic)`.
- Button press: scale 0.98, 90ms in / 120ms out, no opacity change.
- All transitions: ease-out, never bouncy. No overshoot, no springs with visible oscillation.
- **Haptics:** existing light tap on more-button and primary CTA; don't proliferate.

---

## 6. States and edge cases the sandbox must prove

The sandbox should be tested against, at minimum:

1. **A fully-enriched memorabilia item** (long title, full ai_metadata + trait_metadata, authentications, many photos).
2. **A trading-card-classified item** (one of the 3 unlocked last week — proves the system doesn't choke on items without catalog data).
3. **An item with no ai_metadata or trait_metadata** (pre-migration shape).
4. **An item with no description.**
5. **An item with only one photo.**
6. **An item with a very short title** (does the Caslon hold up at this scale?).
7. **An item with a very long title** (3+ lines — does the composition still sing?).
8. **Owner viewing their own item** (edit + delete in menu).
9. **Non-owner viewing** (track button, report option).

---

## 7. Explicitly out of scope for the sandbox

- Any other screen (profile, feed, upload, messaging, onboarding).
- The tab bar and global nav chrome.
- Light mode. We're dark-only; don't design for a mode that doesn't exist.
- Accessibility audit beyond basic contrast. (We'll handle this properly at Layer 0.)
- App icon, splash screen, store screenshots.
- Font licensing costs — we're using Google Fonts for v1.
- Settings-level theme toggles.
- Photo upload / capture flow.
- The edit-collectible screen.
- The delete confirmation flow (assume existing confirmation modal, restyled in Layer 0).

---

## 8. Implementation constraints for the sandbox file

- **Location:** a new route isolated from app navigation. Proposed: `app/(design-lab)/collectible-detail.tsx`. Not wired into the tab bar, not linked from any production screen. Accessible by typing the path directly or via a dev-only menu entry.
- **Self-contained:** no imports from `components/detail/*`, no imports from `lib/colors.ts`. Only:
  - React Native primitives
  - `expo-image`, `expo-blur`, `expo-haptics`
  - `lucide-react-native` for icons
  - `@expo-google-fonts/*` for fonts
  - The existing data layer (`getCollectible`, `jsonbToRows`, `formatAddedOn`) — data is DNA-agnostic, reusing is fine.
- **Every inline value annotated** with a prospective token name in a comment (e.g., `// → color.border.frost`). Token extraction becomes a mechanical pass when we're done.
- **Takes a real collectible ID via URL param.** Reuses real data for honesty.
- **Do not share styles with production.** Inline StyleSheets only. When the sandbox is locked, extraction generates the real tokens and shared primitives.

---

## 9. What "done" looks like

The sandbox is considered locked when:

- The screen renders against all 9 test cases in §6 without visual regressions
- Typographic rhythm feels right across all of them (Caslon holds, mono values read as catalog-grade, kickers anchor without shouting)
- No reach-for-more-gray moments — every border, every divider, every edge is either frost or intentional semantic color
- The composition still feels *calm* — this is the single strongest test of the DNA. If any part feels busy or shouty, it's wrong.
- We've iterated for at least 3 days on actual device before calling it

Once locked:

1. Token extraction pass (colors, type, spacing, radii) → Layer 0 of the real rollout.
2. Component rebuild pass (Text, Button, Card, InsetGroupedList, CollapsingHero, etc.) against the new tokens → completes Layer 0.
3. Production `CollectibleDetail` rebuilds against the new primitives → Layer 1 ships.
4. Sandbox file either stays as a reference implementation or is deleted. Either is fine.
