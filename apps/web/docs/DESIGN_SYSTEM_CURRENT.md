# Vitrine Design System

**"Contemporary Gallery"** — Trawelt-inspired, dark-only, mint accent, warm neutrals, muted jewel status system.

All tokens live in `lib/colors.ts`. All fonts are loaded in `app/_layout.tsx`. Category identity logic lives in `lib/category-identity.ts`.

---

## Typography

Vitrine uses three typefaces. Each has a strict role.

### Space Grotesk — UI Font

The primary typeface for all interface text: titles, labels, buttons, descriptions, navigation, and body copy.

| Weight | Token | Usage |
|--------|-------|-------|
| 400 Regular | `SpaceGrotesk` | Body text, descriptions, labels |
| 700 Bold | `SpaceGrotesk-Bold` | Titles, headings, emphasis |

Space Grotesk is loaded as the default. Components that don't specify a `fontFamily` inherit it.

### JetBrains Mono — Numeric Data Only

A monospaced typeface reserved exclusively for numeric data: prices, values, counts, percentages, member counts, online counts, monetary figures.

| Weight | Token | Usage |
|--------|-------|-------|
| 400 Regular | `JetBrainsMono` | Numeric data |

**Rule:** Never use JetBrainsMono for labels, titles, status text, or any UI copy. Numbers only.

### Instrument Serif — Decorative / Editorial

A serif typeface for rare decorative or editorial moments.

| Weight | Token | Usage |
|--------|-------|-------|
| 400 Regular | `InstrumentSerif` | Editorial headlines, feature callouts |

Used sparingly. Not for general UI.

---

## Color Token System

### Foundation

The warm dark base layer that everything sits on.

| Token | Value | Role |
|-------|-------|------|
| `background` | `#0C0C10` | App background |
| `foreground` | `#EFEFE7` | Primary text color |

### Surfaces

Layered elevation system for cards, modals, and inputs.

| Token | Value | Role |
|-------|-------|------|
| `card` | `#161618` | Card background |
| `cardForeground` | `#EFEFE7` | Text on cards |
| `surface` | `#161618` | Generic surface |
| `surfaceElevated` | `#1E1E22` | Higher elevation (inputs, dropdowns, modals) |

### Brand Accent — Mint

The primary brand color. Mint green. Used for CTAs, active states, highlights, and the memorabilia category identity.

| Token | Value | Role |
|-------|-------|------|
| `primary` | `#D3FFC3` | Brand mint — CTAs, links, active states |
| `primaryForeground` | `#0C0C10` | Text on primary |
| `primaryMuted` | `rgba(211, 255, 195, 0.40)` | Muted mint — badges, tinted backgrounds |
| `primaryGlow` | `rgba(211, 255, 195, 0.18)` | Subtle glow — hover effects, halos |

### Secondary

Neutral dark surfaces for secondary UI elements.

| Token | Value | Role |
|-------|-------|------|
| `secondary` | `#1E1E22` | Secondary backgrounds |
| `secondaryForeground` | `#E4E9DC` | Text on secondary |

### Muted

For de-emphasized text and backgrounds.

| Token | Value | Role |
|-------|-------|------|
| `muted` | `#1E1E22` | Muted backgrounds |
| `mutedForeground` | `#C1C1C1` | Secondary text, placeholders, captions |

### Accent — Warm Sand

The secondary accent color. Used for the trading card category identity and warm decorative tints.

| Token | Value | Role |
|-------|-------|------|
| `accent` | `#E7D5BA` | Sand accent — trading cards category |
| `accentForeground` | `#0C0C10` | Text on accent |
| `accentMuted` | `rgba(231, 213, 186, 0.40)` | Muted sand — badges, tinted backgrounds |
| `accentGlow` | `rgba(231, 213, 186, 0.18)` | Subtle glow |

### Warm UI Palette

Trawelt-derived warm tones for cards, labels, and tints.

| Token | Value | Role |
|-------|-------|------|
| `warmSand` | `#E7D5BA` | Warm decorative tint |
| `warmSage` | `#EAEFDE` | Warm decorative tint |
| `warmIvory` | `#EFEFE7` | Warm decorative tint |

### Borders

| Token | Value | Role |
|-------|-------|------|
| `border` | `rgba(255, 255, 255, 0.08)` | All borders, dividers, separators |

### Status Quartet — Muted Jewels

Scannable by hue. Each listing status has a unique muted jewel tone.

| Token | Value | Status |
|-------|-------|--------|
| `statusSale` | `#C47878` | For Sale |
| `statusTrade` | `#6B9EB5` | For Trade |
| `statusSellTrade` | `#C49B5A` | Sell or Trade |
| `statusNfst` | `#7A7A80` | Not For Sale/Trade |

### Glass Effects

For frosted glass overlays and gradient scrims.

| Token | Value | Role |
|-------|-------|------|
| `glass` | `rgba(22, 22, 24, 0.8)` | Frosted glass background |
| `glassBorder` | `rgba(255, 255, 255, 0.06)` | Glass border |
| `gradientOverlay` | `rgba(12, 12, 16, 0.85)` | Image gradient scrim (cards, heroes) |

### Glow

| Token | Value | Role |
|-------|-------|------|
| `glowGold` | `rgba(211, 255, 195, 0.18)` | Mint glow, hero surfaces only |

### Attention

| Token | Value | Role |
|-------|-------|------|
| `attention` | `#2D9B4C` | Deep green — the only saturated color, used sparingly |

### Semantic / Functional

| Token | Value | Role |
|-------|-------|------|
| `destructive` | `#C4655A` | Destructive actions (delete, leave) |
| `destructiveForeground` | `#EFEFE7` | Text on destructive |
| `success` | `#2D9B4C` | Success states |
| `successForeground` | `#EFEFE7` | Text on success |
| `warning` | `#C49B5A` | Warnings |

### Detail Coverage Density

Progress indicators for collectible detail completeness.

| Token | Value | Level |
|-------|-------|-------|
| `densityLow` | `#C1C1C1` | Low coverage |
| `densityMedium` | `#E4E9DC` | Medium coverage |
| `densityHigh` | `#D3FFC3` | High coverage (mint) |

### QR Code

| Token | Value | Role |
|-------|-------|------|
| `qrBackground` | `#ffffff` | QR code background |
| `qrForeground` | `#000000` | QR code dots |

### Upload Flow Gradients

| Token | Value | Role |
|-------|-------|------|
| `gradientCyan` | `#D3FFC3` | Gradient start (mint) |
| `gradientTeal` | `#EAEFDE` | Gradient mid |
| `gradientPink` | `#C4655A` | Gradient end |
| `gradientRose` | `#B55A50` | Gradient deep end |

### Value Change Indicators

| Token | Value | Direction |
|-------|-------|-----------|
| `positive` | `#2D9B4C` | Value up |
| `negative` | `#C4655A` | Value down |
| `neutral` | `#C1C1C1` | No change |

### Misc UI

| Token | Value | Role |
|-------|-------|------|
| `onlineDot` | `#2D9B4C` | Online presence indicator |
| `offlineText` | `#C1C1C1` | Offline text |

---

## Category Identity System

Vitrine has two collectible categories, each with a dedicated color family. This creates an instant visual shorthand — users learn to associate a color temperature with a content type at a glance.

### Memorabilia — Mint (Cool)

Physical collectibles: sneakers, watches, figures, jerseys, race-used gear, vinyl, etc. Manual-entry items.

| Role | Token | Value |
|------|-------|-------|
| Accent | `primary` | `#D3FFC3` |
| Text on accent | `primaryForeground` | `#0C0C10` |
| Muted background | `primaryMuted` | `rgba(211, 255, 195, 0.40)` |
| Glow | `primaryGlow` | `rgba(211, 255, 195, 0.18)` |

Mint is the app's brand color, so memorabilia — the core physical collectible — gets the brand identity. Borders, badges, accent strips, pill labels, and glow effects on memorabilia surfaces all draw from the mint family.

### Trading Cards — Warm Sand (Warm)

API-driven catalog items: sports cards, TCG (Pokemon, One Piece, Yu-Gi-Oh), etc.

| Role | Token | Value |
|------|-------|-------|
| Accent | `accent` | `#E7D5BA` |
| Text on accent | `accentForeground` | `#0C0C10` |
| Muted background | `accentMuted` | `rgba(231, 213, 186, 0.40)` |
| Glow | `accentGlow` | `rgba(231, 213, 186, 0.18)` |

Sand provides warmth and earthiness — a deliberate contrast to the cool mint. It signals "this is a different kind of collectible" without clashing. The warm tone evokes the physicality of paper and cardboard.

### Mixed Context — Neutral Palette

When a surface displays both categories (e.g., the home feed, search results, profile showcases), it uses the neutral palette (`foreground`, `mutedForeground`, `surfaceElevated`). No category tinting is applied. Individual items within a mixed surface may show their own category pill badge, but the surface itself stays neutral.

### Implementation

Category accent resolution is handled by `getCategoryAccent()` from `lib/category-identity.ts`:

```typescript
import { getCategoryAccent } from '@/lib/category-identity';

const { accent, accentMuted, accentGlow } = getCategoryAccent(group.category_type);
// Returns mint family for memorabilia, sand family for trading cards
```

Category accents are applied to: border tints, accent strips (2px top edge on cards), pill badges, glow halos, and active filter chip backgrounds.

---

## Light Theme

A light theme stub exists as a commented block at the bottom of `lib/colors.ts`. It is not yet wired into a `ThemeProvider`. The dark theme is the only active theme (`userInterfaceStyle: "dark"` in `app.json`).
