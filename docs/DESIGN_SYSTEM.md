# Vitrine Design System — Token Reference

Source of truth: `lib/design/tokens.ts`

---

## Theming

The app supports Light / Dark / Auto (system-follow) themes via a `ThemeProvider` context and `useTheme()` hook.

- **Tokens file**: `lib/design/tokens.ts` exports `DARK_COLORS`, `LIGHT_COLORS`, and `COLORS` (backward-compat alias = `DARK_COLORS`).
- **Context**: `lib/design/theme-context.tsx` — `ThemeProvider` persists preference to AsyncStorage (`vitrine:theme-preference`), defaults to Dark.
- **Hook**: `useTheme()` returns `{ colors, mode, resolvedMode, setMode }`. Components use `colors.xxx` for theme-aware rendering.
- **Static imports**: TYPE, SPACING, RADII do not change between themes.
- **Theme-immune components**: `StatusPill` and `TraitPill` always render with dark-mode backing (`DARK_COLORS.sheetBg`) since their semi-transparent fills are designed to composite on dark surfaces.
- **Image overlays**: `SpatialCard` meta text, tracking badges, and burst overlays use `DARK_COLORS` directly since they sit on dark gradients regardless of theme.
- **BottomDock**: Adapts background, blur tint, and upload button styling based on resolved theme.
- **Toggle location**: 3-state segmented control (Sun/Moon/Smartphone icons) on the top-right of the Settings screen header.

---

## Colors (Dark Mode — Default)

### Canvas & Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `void` | `#000000` | App background / canvas |
| `sheetBg` | `#0a0a0a` | Bottom sheets, elevated surfaces |
| `pressOverlay` | `rgba(255,255,255,0.06)` | Pressed state overlay |
| `scrim` | `rgba(0,0,0,0.7)` | Modal backdrop |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#f0f0f0` | Headings, primary copy |
| `textSecondary` | `#a1a4a5` | Body text, descriptions |
| `textTertiary` | `#5c5c5c` | Captions, disabled, muted |
| `textInverse` | `#000000` | Text on white/light CTAs |

### Frost (Borders & Dividers)

| Token | Value | Usage |
|-------|-------|-------|
| `frostBorder` | `rgba(214,235,253,0.19)` | Default card/component borders |
| `frostDivider` | `rgba(214,235,253,0.12)` | Section dividers |
| `frostBorderStrong` | `rgba(214,235,253,0.32)` | Emphasized borders |

### Semantic Accents (Listing Status)

| Status | Solid | Fill (18-20%) | Border (35-40%) |
|--------|-------|---------------|-----------------|
| **For Sale** | `#11ff99` (Green) | `rgba(17,255,153,0.18)` | `rgba(17,255,153,0.35)` |
| **For Trade** | `#3b9eff` (Blue) | `rgba(59,158,255,0.20)` | `rgba(59,158,255,0.40)` |
| **Sell + Trade** | `#ff801f` (Orange) | `rgba(255,128,31,0.20)` | `rgba(255,128,31,0.40)` |
| **NFST** | — | `rgba(214,235,253,0.12)` (Silver) | `frostBorderStrong` |
| **Destructive** | `#ff2047` (Red) | — | — |

### Trait Accents (Collectible Traits)

| Trait | Solid | Fill (18%) | Border (40%) |
|-------|-------|------------|--------------|
| **Rookie** | `#ec4899` (Pink) | `rgba(236,72,153,0.18)` | `rgba(236,72,153,0.40)` |
| **Signed** | `#a78bfa` (Violet) | `rgba(167,139,250,0.18)` | `rgba(167,139,250,0.40)` |
| **Game Used** | `#bbca3a` (Olive) | `rgba(187,202,58,0.18)` | `rgba(187,202,58,0.40)` |
| **Graded** | `#22d3ee` (Cyan) | `rgba(34,211,238,0.18)` | `rgba(34,211,238,0.40)` |

### Match Tiers (Comps Algorithm)

| Tier | Threshold | Color |
|------|-----------|-------|
| Perfect | >= 90% | `#11ff99` (Green) |
| Strong | 70-89% | `#3b9eff` (Blue) |
| Loose | < 70% | `#f0f0f0` (Neutral) |

---

## Typography

### Font Stack

| Token | Font Family | Role |
|-------|-------------|------|
| `heroDisplay` | **Electrolize** | Display headings, hero text |
| `caslonText` | LibreCaslonText | Serif accent (editorial, optional) |
| `caslonItalic` | LibreCaslonText-Italic | Italic serif accent |
| `grotesk` | SpaceGrotesk | Kickers, section labels |
| `groteskMedium` | SpaceGrotesk-Medium | Medium weight geometric |
| `groteskSemiBold` | SpaceGrotesk-SemiBold | Semi-bold geometric |
| `groteskBold` | SpaceGrotesk-Bold | Bold geometric |
| `inter` | Inter | Body text, UI labels |
| `interMedium` | Inter-Medium | Medium body |
| `interSemiBold` | Inter-SemiBold | Button labels, emphasis |
| `mono` | JetBrainsMono | Machine data (IDs, numbers, codes) |
| `monoMedium` | JetBrainsMono-Medium | Emphasized machine data |

### Usage Patterns

- **Hero/Display**: `heroDisplay` (Electrolize) at 24-32px, tight tracking (-0.5 to 0)
- **Kickers/Labels**: `groteskBold` at 9-10px, wide tracking (1.2-3.0), uppercase
- **Body**: `inter` at 12-14px, line-height 1.4-1.6x
- **Data/Counts**: `monoMedium` at 9-12px, tracking 0.5-1.5
- **Handles/Codes**: `monoMedium` in `traitCyan`

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `gutter` | `20px` | Page-level horizontal padding |
| `cardEdge` | `4px` | Card inner padding (so text lands at 20) |
| `rowPadX` | `16px` | Horizontal padding inside rows |
| `rowPadY` | `14px` | Vertical padding inside rows |
| `sectionGap` | `24px` | Gap between sections |
| `kickerGap` | `10px` | Gap between kicker label and content |
| `zoneIntra` | `16px` | Inside a cluster (kicker to title) |
| `zoneCluster` | `32px` | Between related clusters |
| `zoneTransition` | `48px` | Between major zones |

### Zone Rhythm: 16 / 32 / 48

```
[  16px  ] — zoneIntra     (within a group)
[  32px  ] — zoneCluster   (between groups)
[  48px  ] — zoneTransition (between zones)
```

---

## Radii

| Token | Value | Usage |
|-------|-------|-------|
| `sharp` | `4px` | Small chips, tight elements |
| `small` | `8px` | List items, compact cards |
| `medium` | `12px` | Standard components |
| `card` | `16px` | Main cards, elevated surfaces |
| `pill` | `9999px` | Fully rounded (buttons, badges) |

---

## Glass Material Pattern

All status and trait pills use the same material language:

```
backgroundColor: [hue]Fill     (18-20% alpha)
borderColor:     [hue]Border   (35-40% alpha)
borderWidth:     1px
color:           [hue] solid   (full saturation)
```

This creates a "colored glass on void" effect. Status and traits are visually the same material but semantically distinct.

---

## Colors (Light Mode)

### Canvas & Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `void` | `#FFFFFF` | App background / canvas |
| `sheetBg` | `#F5F5F5` | Bottom sheets, elevated surfaces |
| `pressOverlay` | `rgba(0,0,0,0.04)` | Pressed state overlay |
| `scrim` | `rgba(0,0,0,0.5)` | Modal backdrop |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#1A1A1A` | Headings, primary copy |
| `textSecondary` | `#5C5C5C` | Body text, descriptions |
| `textTertiary` | `#9E9E9E` | Captions, disabled, muted |
| `textInverse` | `#FFFFFF` | Text on dark CTAs |

### Frost (Borders & Dividers)

| Token | Value | Usage |
|-------|-------|-------|
| `frostBorder` | `rgba(0,0,0,0.12)` | Default card/component borders |
| `frostDivider` | `rgba(0,0,0,0.08)` | Section dividers |
| `frostBorderStrong` | `rgba(0,0,0,0.22)` | Emphasized borders |

### Brand

| Token | Hex | Notes |
|-------|-----|-------|
| `brandVolt` | `#6B5B3E` | Darkened ivory for contrast against white |
| `brandVoltFill` | `rgba(107,91,62,0.08)` | Subtle background fill |
| `brandVoltBorder` | `rgba(107,91,62,0.22)` | Border accent |

Notes: Semantic status/trait accent colors remain the same in both themes. The glass material formula is unchanged — transparent fills composite correctly on both `void` values.

---

## Status Pill Config

| Status | Label | Dot Color | Commerce Action |
|--------|-------|-----------|-----------------|
| `FOR_SALE` | For Sale | Green | Buy (DollarSign icon) |
| `FOR_TRADE` | For Trade | Blue | Trade (ArrowLeftRight icon) |
| `SELL_TRADE` | Sell + Trade | Orange | Deal (Handshake icon) |
| `NFST` | NFST | Tertiary | None (hidden) |

---

## Trait Pill Config

Display order (left to right): Rookie, Signed, Game Used, Graded

Each pill renders only when its corresponding `is_*` flag is truthy on the collectible row.

---

## Vault Component Inventory

Source: `components/vault/index.ts`

### Cards & Data Display
| Component | Purpose |
|-----------|---------|
| `GridCard` | Base card shell for grid layouts |
| `CollectibleGridCard` | Scan-first collectible in grid (4/5 image, title, StatusDot) |
| `SpatialCard` | Immersive detail-forward collectible card |
| `CollectibleListCard` | Compact info row with status/trait dots and price |
| `ListCard` | Generic list row |
| `CompCard` | Comparable collectible card |
| `DossierCard` | Bracketed identity-zone shell with watermark glyph |
| `MetricCardRow` | N-up bracketed metric tiles |
| `AssetMatrixCard` | Barcode-spectrum type distribution bar |
| `StatusBreakdownGrid` | 2-up status summary grid with progress bars |
| `TraitMixCard` | Per-trait horizontal bars (top-N + counter) |
| `MatchPercent` | Match percentage display |

### Navigation & Chrome
| Component | Purpose |
|-----------|---------|
| `LensSelector` | Tap-based lens navigation (standard + display variants) |
| `LensPager` | Swipeable horizontal pager for lens bodies |
| `Brackets` | Decorative bracket primitive |
| `HolographicFrame` | Semantic featured chrome wrapper (standard/subtle intensity) |
| `ActionSheet` | Cross-platform action sheet (native iOS / V3 modal Android) |
| `Button` | Multi-variant button (solid / frost / ghost) |
| `IconButton` | Icon-only pressable with consistent hit area |
| `Sparkline` | Compact inline sparkline chart for value history |
| `TelemetryCard` | Value/delta metric card with sparkline |

### Status & Traits
| Component | Purpose |
|-----------|---------|
| `StatusPill` | Inline listing-status chip |
| `StatusDot` | Compact status indicator |
| `TraitPill` | Collectible trait badge |

### Input & Edit
| Component | Purpose |
|-----------|---------|
| `FilterSheet` | Bottom sheet for collection filters |
| `SearchBar` | Search input with clear affordance |
| `InputDialog` | Cross-platform single-input modal (replaces Alert.prompt) |
| `FieldEditor` | Type-aware input for rapid-fire edits |
| `RapidFireEdit` | Slide-up batched field edit modal |
| `SchemaRow` | Metadata row with optional tap-to-flag interactive chrome |
| `ShowcaseSelectorSheet` | Bottom sheet multi-select for showcases |

### Layout
| Component | Purpose |
|-----------|---------|
| `ActionDock` | Sticky CTA primitive (sheetBg + blur + volt label) |
| `EmptyState` | Empty-state placeholder with icon + message |

---

## Collection Surface

Source: `components/collectibles/collection-surface.tsx`

Shared virtualized FlatList with:
- Toolbar (search + filter + sort + view mode selector)
- Type pills for quick filtering
- Filter/sort bottom sheets
- Grid / Spatial / List rendering modes
- Pull-to-refresh
- Crown Jewel holographic framing
- Multi-select mode (brandVolt border chrome)

Used by: Profile Collection lens, Showcase Detail Contents lens, Create Showcase Curated picker, Share Collectible picker.

---

## Custom Branded Icons

Source: `components/ui/custom-icons.tsx`

| Icon | Usage |
|------|-------|
| `CollectibleIcon` | Activity surface, conversations quick action bar |
| `ShowcaseIcon` | Activity surface, conversations quick action bar |
| `UploadCollectibleIcon` | Bottom dock (replaces ScanText), sized at 40px |

All use `BRAND_STROKE_SCALE = 0.45` for consistent weight. Lucide-safe patterns: explicit `<G>` wrapper, no `currentColor`, stroke-density compensation.

---

## Lens Architecture Pattern

`LensSelector` + `LensPager` is the canonical multi-surface navigation pattern:

| Screen | Lenses |
|--------|--------|
| Profile Hub | PROFILE · COLLECTION · SHOWCASE · ACTIVITY · NETWORK |
| Showcase Detail | INFO · COLLECTION |
| Create Showcase | CURATED · MANAGED |
| Tracking Hub | OVERVIEW · TRACKED · ACTIVITY · COMPS |

`LensSelector` provides tap navigation; `LensPager` provides swipe gestures. `display` variant for full-screen selectors; standard variant for inline sections.
