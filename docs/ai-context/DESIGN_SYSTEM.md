# Design System Context

Last updated: 2026-05-05 (PM)

## Direction
Vitrine V3 is a dark-first, monochrome collector interface with precise typography, frosted borders, restrained chrome, and subtle AI cues. The brand accent is tokenized as `COLORS.brandVolt` — warm ivory (`#E8E0D4`), deliberately understated so collectibles own the color system. The system emphasizes lens-based navigation, glass-material semantic chips, and information-dense but scannable surfaces.

### Monochrome Design Philosophy
The monochrome palette is a deliberate brand decision, not a limitation:
- **Collectibles are the color system.** The UI stays neutral so the Freddie Mercury piece, Brady jersey, and Jordan cards provide the visual excitement.
- **Permanence over energy.** Collectors care about preservation, provenance, value, ownership, presentation. A monochrome system supports that better than a loud signature color.
- **Light/Dark as a brand feature.** Dark mode = premium archive / command center. Light mode = clean catalog / gallery. Both are valid collector contexts, neither a compromise.
- Token names (`brandVolt`, `brandVoltFill`, `brandVoltBorder`) are kept for hot-swap capability even though the underlying color is warm ivory.

## Single Source Of Truth
- Tokens/config: `lib/design/*` (`tokens.ts`, `status-config.ts`, `trait-config.ts`, `match-tiers.ts`)
- Vault components: `components/vault/*` (barrel-exported via `index.ts`)
- Design-system gallery: `app/(design-lab)/design-system.tsx`
- Cursor rule: `.cursor/rules/design-system-playbook.mdc`

## Typography
- Hero display: `Electrolize` — display headings, lens selectors, hero text.
- Geometric/UI: `Space Grotesk` (Regular / Medium / SemiBold / Bold) — kickers, section labels, chrome.
- Body/UI: `Inter` (Regular / Medium / SemiBold) — body text, UI labels, input fields.
- Machine-readable: `JetBrains Mono` (Regular / Medium) — IDs, numbers, codes, counts.
- Serif: `LibreCaslonText` / `LibreCaslonText-Italic` — reserved for editorial accents. Current V3 direction favors modern sans/tech type; serif use is minimal.

## Color
- Use `COLORS` from `@/lib/design`.
- Do not introduce raw hex/rgba in new V3 components without token discussion.
- Status and trait colors live in shared configs (`status-config.ts`, `trait-config.ts`).
- `COLORS.brandVolt` (`#E8E0D4`, warm ivory) is app identity chrome for active lens states, profile identity accents, brand moments, activity badge dot, managed showcase badges, and selection states (multi-select border, rule builder active chips). Formerly neon volt `#CCFF00`.
- `COLORS.brandVoltFill` (`rgba(232, 224, 212, 0.10)`) and `COLORS.brandVoltBorder` (`rgba(232, 224, 212, 0.28)`) are the fill/border variants.
- `COLORS.semanticBlue` is used for the MANAGED badge on showcase detail (distinct from brandVolt to differentiate showcase type from brand accent).
- Keep `COLORS.brandVolt` separate from `COLORS.traitOlive` (Game Used trait hue).

## Spacing
Use the V3 rhythm from `SPACING`:
- `zoneIntra`: 16 — inside a cluster (kicker to title)
- `sectionGap`: 24 — between sections
- `zoneCluster`: 32 — between related clusters
- `zoneTransition`: 48 — between major zones

## Components

### Vault Barrel (`@/components/vault`)
Current important exports include:
- **Cards**: `GridCard`, `CompCard`, `CollectibleGridCard`, `SpatialCard`, `CollectibleListCard`, `DossierCard`, `MetricCardRow` (+ `metricValueTextStyle`), `AssetMatrixCard`, `StatusBreakdownGrid`, `TraitMixCard`
- **Status/Traits**: `StatusPill`, `StatusDot`, `TraitPill`
- **Navigation**: `LensSelector`, `LensPager` (+ `LensPagerHandle`)
- **Chrome**: `Brackets`, `HolographicFrame`, `ActionSheet`, `Button`, `IconButton`
- **Input/Edit**: `FilterSheet`, `SearchBar`, `InputDialog`, `FieldEditor`, `RapidFireEdit`, `SchemaRow`
- **Layout**: `ActionDock`, `EmptyState`, `ShowcaseSelectorSheet`
- **Misc**: `ListCard`, `MatchPercent`

### Collection Surface (`@/components/collectibles`)
Shared FlatList with toolbar, type pills, filter/sort sheets, virtualized grid/spatial/list rendering, refresh control, crown-jewel holo framing, and multi-select mode. Consumed by profile, showcase detail, create showcase, and share picker.

### Custom Branded Icons (`@/components/ui/custom-icons.tsx`)
Three custom SVG icons: `CollectibleIcon`, `ShowcaseIcon`, `UploadCollectibleIcon` (legacy). All use `BRAND_STROKE_SCALE` (0.45) for consistent weight. Lucide-safe patterns (explicit `<G>` wrapper, no `currentColor`, stroke-density compensation).

### Vitrine Mark Icon (`@/components/vault/icons/vitrine-mark-icon.tsx`)
Brand mark SVG — filled paths (not stroked), used in BottomDock center upload button at size=36. Barrel-exported via `components/vault/index.ts`. Accepts `size` and `color` props.

### QR Code Modal (`@/components/shared/qr-code-modal.tsx`)
Unified V3 QR modal used across all surfaces (profile, showcase detail, collectible detail, trading card detail). Wrapped in `HolographicFrame` for premium holographic border. Dark glass card (`sheetBg`), frost-bordered code frame, `TYPE.groteskBold` labels, "COPY LINK" action with green confirmed state, full-width "DONE" close button. Props: `visible`, `onClose`, `value`, `title`, `subtitle`.

## Current Card Rules
- **Spatial cards**: immersive/detail-forward — adaptive image, two-line title, status/trait badge row, top tracking count badge, double-tap to track.
- **Grid cards**: scan-first — adaptive 4/5 image, two-line title with compact `StatusDot`, no classification, no traits, no price.
- **List cards**: compact info rows — status dot and trait dots above title, price visible.
- **Crown Jewel card**: horizontal hero — image left, status/username/title/traits/value right, bottom rail for catalog date and tracking toggle.
- **Multi-select cards**: brandVolt border chrome overlay on grid cards when `selectedIds` is provided.
- **Holographic treatment**: understated semantic marker for Crown Jewel, Featured Showcase, and QR Code Modal.

## Lens Architecture
- `LensSelector` + `LensPager` is the canonical pattern for multi-surface screens.
- Profile hub: 5 lenses (PROFILE | COLLECTION | SHOWCASE | ACTIVITY | NETWORK). Messages graduated to dedicated tab.
- Tracking hub: 4 lenses (OVERVIEW | TRACKED | ACTIVITY | COMPS). Uses `display` variant LensSelector.
- Showcase detail: 2 lenses (INFO | COLLECTION).
- Create showcase: 2 lenses (CURATED | MANAGED) with mutual exclusion.
- `display` variant for full-screen lens selectors; standard variant for inline/sub-sections.

## BottomDock
Custom bottom navigation bar (Expo Router's native tab bar is hidden):
- **Tab order**: Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages.
- **Profile avatar**: Shows `BadgeDot` (brandVolt) when `useFeeds().unseenCount > 0`.
- **Upload FAB**: Center position, `VitrineMarkIcon` (brand mark) at size=36 against circular background.
- **Messages icon**: Shows `CountBadge` (semanticBlue) with Stream Chat unread count.
- Glass-material blur backdrop with frost border top edge.

## Activity Banner
Owner-only component on the PROFILE lens surface, appearing between action buttons and key metrics:
- Slides in (`SlideInUp`) when `unseenCount > 0`, slides out on dismiss.
- Shows count label ("2 NEW") + smart summary of recent notifications via `getVerbConfig`.
- Tap navigates to ACTIVITY lens. X button dismisses. Reappears on new activity.
- Dark glass card with brandVolt accent dot.

## Rule Builder Pattern
`ManagedRuleBuilder` introduces a new V3 pattern for condition-based configuration:
- Match mode toggle (ALL/ANY) as full-width radio chips.
- Condition stack: numbered cards with field chips → operator chips → value controls.
- Value controls are field-discriminated: multi-select chips for enums, text input for strings, numeric input for values, tag input for free-form arrays.
- Live preview card with accent rail, count, value, and 3-up thumbnails.
- Dashed-border "Add condition" CTA.

## Profile Surface Button Layout (Owner vs. Visitor)
- **DossierCard top-right**: Owner sees Settings (gear). Visitor sees QR Code.
- **Action row**: Owner sees QR CODE + SHARE. Visitor sees MESSAGE + SHARE.
- **Footer**: Owner sees a redundant "SETTINGS" button at bottom of scroll. Visitor does not.
- Settings gear and Edit Profile pencil are identity management actions (top zone). QR Code and Share are distribution actions (middle zone).

## Interaction Rules
- Prefer native mobile-friendly controls.
- Preserve safe areas, loading/empty/error states, and haptics where already established.
- Profile/collection/showcase surfaces use lens-like navigation patterns.
- Multi-select uses brandVolt border on cards (not checkboxes, not overlay badges).
- Mutual exclusion in lens-based surfaces: visual lock icon + tap/swipe refusal.

## Responsive Rules
Unknown beyond current React Native portrait/mobile focus.

## Accessibility Requirements
- Use accessible pressable labels where components support them.
- Avoid unbounded text overflow.
- Maintain contrast on dark surfaces.
- Custom icons include `accessibilityRole` and `accessibilityLabel` props.

## Visual Anti-Patterns
- Forking vault components.
- One-off raw token usage in new V3 components.
- Overly experimental chrome that distracts from collectible content.
- Dense cards with too many pills/labels at grid density.
- Using `currentColor` in React Native SVG (not supported — use explicit color props).
- Mixing serif fonts where the V3 direction uses sans/tech type (serif is editorial reserve only).
