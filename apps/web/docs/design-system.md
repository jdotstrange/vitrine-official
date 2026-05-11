# Vitrine Design System

Reference documentation for the Vitrine design token system.

## Color Palette

### Void Scale (Backgrounds)
| Token | Hex | Usage |
|-------|-----|-------|
| `void-deep` | `#05050d` | Primary background, body |
| `void-base` | `#0a0a14` | Elevated backgrounds |
| `void-elevated` | `#12121f` | Cards, surfaces |
| `void-surface` | `#1a1a2e` | Modals, overlays |

### Cyber Cyan (Primary)
| Token | Hex | Usage |
|-------|-----|-------|
| `cyan-glow` | `#00d4ff` | Primary CTAs, links, highlights |
| `cyan-bright` | `#00b8e6` | Hover states |
| `cyan-muted` | `#0099cc` | Secondary elements |
| `cyan-dim` | `#007399` | Borders, subtle accents |

### Neon Magenta (Secondary)
| Token | Hex | Usage |
|-------|-----|-------|
| `magenta-glow` | `#ff00aa` | Secondary CTAs, highlights |
| `magenta-bright` | `#e6009a` | Hover states |
| `magenta-muted` | `#cc0088` | Secondary elements |
| `magenta-dim` | `#990066` | Borders, subtle accents |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-100` | `#ffffff` | Primary text |
| `neutral-90` | `#e6e6f0` | Secondary text |
| `neutral-70` | `#9999aa` | Muted text |
| `neutral-60` | `#666680` | Subtle text |
| `neutral-40` | `#33334d` | Borders |
| `neutral-30` | `#262640` | Subtle borders |

## Typography

### Font Families
- **Headings**: `font-serif` (Instrument Serif)
- **Body**: `font-sans` (Space Grotesk)  
- **Data/Stats**: `font-mono` (JetBrains Mono)

### Usage
```jsx
<h1 className="font-serif">Heading</h1>
<p className="font-sans">Body text</p>
<span className="font-mono">$1,234.56</span>
```

## Glass Effects

```jsx
// Standard glass
<div className="glass">Content</div>

// Light glass
<div className="glass-light">Content</div>

// Glass with cyan border glow
<div className="glass-glow">Content</div>
```

## Glow Effects

```jsx
// Box shadows
<div className="glow-cyan">Cyan glow</div>
<div className="glow-cyan-intense">Intense cyan glow</div>
<div className="glow-magenta">Magenta glow</div>
<div className="glow-magenta-intense">Intense magenta glow</div>

// Text shadows
<span className="text-glow-cyan">Glowing text</span>
<span className="text-glow-magenta">Glowing text</span>
```

## Gradient Text

```jsx
<h1 className="text-gradient">Gradient heading</h1>
```

## Gradient Border

```jsx
<div className="border-gradient rounded-lg p-4">
  Content with gradient border
</div>
```

## Ambient Backgrounds

```jsx
<section className="ambient-cyan">
  Content with radial cyan glow behind
</section>

<section className="ambient-magenta">
  Content with radial magenta glow behind
</section>
```

## Semantic Color Classes

### Tailwind Classes
- `bg-background` / `bg-void-deep` — Primary background
- `bg-card` / `bg-void-elevated` — Card background
- `text-foreground` — Primary text (white)
- `text-muted-foreground` — Muted text
- `text-primary` / `text-cyan-glow` — Primary accent
- `text-secondary` / `text-magenta-glow` — Secondary accent
- `border-border` — Standard border
- `ring-ring` — Focus ring (cyan)

## Spacing

Use Tailwind's spacing scale. Key values:
- `space-4` (1rem/16px) — Base unit
- `space-6` (1.5rem/24px) — Component padding
- `space-8` (2rem/32px) — Section gaps
- `space-16` (4rem/64px) — Section padding mobile
- `space-24` (6rem/96px) — Section padding desktop

## Transitions

CSS custom properties available:
- `--transition-fast`: 150ms
- `--transition-base`: 250ms
- `--transition-slow`: 400ms
- `--transition-slower`: 600ms

## Z-Index Scale

- `--z-base`: 0
- `--z-elevated`: 10
- `--z-dropdown`: 100
- `--z-sticky`: 200
- `--z-modal`: 300
- `--z-popover`: 400
- `--z-toast`: 500
- `--z-tooltip`: 600
