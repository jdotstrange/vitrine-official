"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { MagneticButton } from "@/components/magnetic-button"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { Download, Check, X } from "lucide-react"

/* ============================================================================
   DATA
   ============================================================================ */

type BgRule = "approved" | "prohibited"

interface AssetVariant {
  file: string
  label: string
  usage: { light: BgRule; dark: BgRule }
}

interface LogoGroup {
  name: string
  description: string
  assets: AssetVariant[]
}

const logoGroups: LogoGroup[] = [
  {
    name: "Wordmark",
    description: "Horizontal lockup — primary brand identifier",
    assets: [
      { file: "/brand-assets/wordmark_dark.png", label: "Dark", usage: { light: "approved", dark: "prohibited" } },
      { file: "/brand-assets/wordmark_accent.png", label: "Accent", usage: { light: "prohibited", dark: "approved" } },
      { file: "/brand-assets/wordmark_light.png", label: "Light", usage: { light: "prohibited", dark: "approved" } },
    ],
  },
  {
    name: "App Icon",
    description: "Strictly for favicon, app touch icon, and app store listings. Not for collateral, social, or presentations.",
    assets: [
      { file: "/brand-assets/app_icon_accent.png", label: "Accent", usage: { light: "approved", dark: "prohibited" } },
      { file: "/brand-assets/app_icon_dark.png", label: "Dark (Official)", usage: { light: "approved", dark: "prohibited" } },
    ],
  },
  {
    name: "Icon Mark",
    description: "Symbol only — compact contexts, watermarks",
    assets: [
      { file: "/brand-assets/icon_mark_light.png", label: "Light", usage: { light: "prohibited", dark: "approved" } },
      { file: "/brand-assets/icon_mark_dark.png", label: "Dark", usage: { light: "approved", dark: "prohibited" } },
      { file: "/brand-assets/icon_mark_accent.png", label: "Accent", usage: { light: "prohibited", dark: "approved" } },
    ],
  },
]


const foundationColors = [
  { token: "--background", hex: "#EFEFE7", label: "Background", note: "Page background — warm ivory" },
  { token: "--foreground", hex: "#0C0C10", label: "Foreground", note: "Primary text — near-black" },
  { token: "--card", hex: "#FFFFFF", label: "Card", note: "Card surfaces — pure white" },
  { token: "--surface-elevated", hex: "#F5F5F0", label: "Surface Elevated", note: "Elevated surfaces — slightly warm" },
  { token: "--secondary", hex: "#EAEFDE", label: "Secondary", note: "Section backgrounds — warm sage" },
  { token: "--muted", hex: "#F5F5F0", label: "Muted", note: "Muted backgrounds — subtle warm" },
]

const brandColors = [
  {
    group: "Mint — Primary Brand",
    colors: [
      { token: "--primary", hex: "#D3FFC3", note: "CTAs, active states, highlights" },
      { token: "--primary-foreground", hex: "#0C0C10", note: "Text on primary" },
      { token: "--primary-muted", hex: "rgba(211,255,195,0.40)", note: "Muted mint tint" },
      { token: "--primary-glow", hex: "rgba(234,239,222,0.18)", note: "Subtle mint glow" },
    ],
  },
  {
    group: "Deep Green — Attention",
    colors: [
      { token: "--attention", hex: "#2D9B4C", note: "Text accent, section labels, success" },
    ],
  },
  {
    group: "Warm Sand — Accent",
    colors: [
      { token: "--accent", hex: "#E7D5BA", note: "Trading card category, decorative" },
      { token: "--accent-foreground", hex: "#0C0C10", note: "Text on accent" },
      { token: "--accent-muted", hex: "rgba(231,213,186,0.40)", note: "Muted sand tint" },
      { token: "--accent-glow", hex: "rgba(231,213,186,0.18)", note: "Sand glow" },
    ],
  },
]

const warmPalette = [
  { token: "--warm-sand", hex: "#E7D5BA", label: "Warm Sand" },
  { token: "--warm-sage", hex: "#EAEFDE", label: "Warm Sage" },
  { token: "--warm-ivory", hex: "#EFEFE7", label: "Warm Ivory" },
]

const statusColors = [
  { token: "--status-sale", hex: "#C47878", label: "FOR SALE", badgeClass: "bg-[var(--status-sale)]" },
  { token: "--status-trade", hex: "#6B9EB5", label: "FOR TRADE", badgeClass: "bg-[var(--status-trade)]" },
  { token: "--status-sell-trade", hex: "#C49B5A", label: "SELL + TRADE", badgeClass: "bg-[var(--status-sell-trade)]" },
  { token: "--status-nfst", hex: "#7A7A80", label: "NFST", badgeClass: "bg-[var(--status-nfst)]" },
]

const semanticColors = [
  { token: "--destructive", hex: "#C4655A", label: "Destructive" },
  { token: "--success", hex: "#2D9B4C", label: "Success" },
  { token: "--warning", hex: "#C49B5A", label: "Warning" },
  { token: "--positive", hex: "#2D9B4C", label: "Positive (value up)" },
  { token: "--negative", hex: "#C4655A", label: "Negative (value down)" },
  { token: "--neutral", hex: "#7A7A80", label: "Neutral" },
]

const densityColors = [
  { token: "--density-low", hex: "#C1C1C1", label: "Low" },
  { token: "--density-medium", hex: "#E4E9DC", label: "Medium" },
  { token: "--density-high", hex: "#D3FFC3", label: "High" },
]


/* ============================================================================
   HELPER COMPONENTS
   ============================================================================ */

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="pt-24 pb-8 border-b border-border">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
    </div>
  )
}

function ColorSwatch({ color, hex, label, note, size = "md" }: {
  color: string
  hex: string
  label: string
  note?: string
  size?: "sm" | "md"
}) {
  const [copied, setCopied] = useState(false)
  const dim = size === "sm" ? "h-16 w-full" : "h-24 w-full"

  function copy() {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button onClick={copy} className="text-left group w-full">
      <div
        className={`${dim} rounded-xl border border-border transition-shadow group-hover:shadow-md`}
        style={{ backgroundColor: color.startsWith("rgba") || color.startsWith("#") ? color : `var(${color})` }}
      />
      <div className="mt-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          {label}
          {copied && <span className="text-xs text-attention">Copied</span>}
        </p>
        <p className="text-xs text-muted-foreground font-mono">{hex}</p>
        <p className="text-xs text-muted-foreground font-mono">{color.startsWith("--") ? `var(${color})` : color}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
    </button>
  )
}

function UsageBadge({ rule }: { rule: BgRule }) {
  if (rule === "approved") {
    return (
      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-success flex items-center justify-center">
        <Check className="w-3 h-3 text-white" />
      </div>
    )
  }
  return (
    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
      <X className="w-3 h-3 text-white" />
    </div>
  )
}

function AssetCard({ file, label, usage }: { file: string; label: string; usage: { light: BgRule; dark: BgRule } }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-2">
        <div className="relative flex items-center justify-center p-6" style={{ backgroundColor: "var(--background)" }}>
          <img src={file} alt={`${label} on light`} className="max-h-14 max-w-full object-contain" />
          <UsageBadge rule={usage.light} />
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">Light</span>
        </div>
        <div className="relative flex items-center justify-center p-6" style={{ backgroundColor: "var(--foreground)" }}>
          <img src={file} alt={`${label} on dark`} className="max-h-14 max-w-full object-contain" />
          <UsageBadge rule={usage.dark} />
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-[rgba(255,255,255,0.4)]">Dark</span>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 border-t border-border">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <a
          href={file}
          download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary-hover transition-colors"
        >
          <Download className="w-3 h-3" />
          {label}
        </a>
      </div>
    </div>
  )
}


/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export function IdentityPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6">

        {/* ================================================================
           SECTION 1 — HEADER
           ================================================================ */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <SectionLabel>Visual Identity</SectionLabel>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Vitrine Design System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Internal reference. Colors, type, logos, components&nbsp;&mdash; all from the live token system. Every swatch and specimen on this page is rendered from CSS variables. If tokens change, this page updates automatically.
          </p>
        </motion.div>

        {/* ================================================================
           SECTION 2 — LOGO & BRAND ASSETS
           ================================================================ */}
        <div className="pt-24 pb-8 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Logo &amp; Brand Assets</h2>
          <a
            href="/logo.svg"
            download
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-secondary text-foreground hover:bg-secondary-hover transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download SVG
          </a>
        </div>

        <div className="mt-10 space-y-16">
          {logoGroups.map((group) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-bold text-foreground mb-1">{group.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">{group.description}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.assets.map((asset) => (
                  <AssetCard key={asset.file} file={asset.file} label={asset.label} usage={asset.usage} />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Legend */}
          <motion.div
            className="flex items-center gap-6 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center"><X className="w-2.5 h-2.5 text-white" /></div>
              <span>Prohibited</span>
            </div>
            <span className="text-muted-foreground/60">|</span>
            <span>Never recolor, stretch, rotate, or apply effects to any variant.</span>
          </motion.div>

        </div>

        {/* ================================================================
           SECTION 3 — COLOR PALETTE — FOUNDATION
           ================================================================ */}
        <SectionDivider title="Color Palette &mdash; Foundation" />

        <motion.div
          className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {foundationColors.map((c) => (
            <ColorSwatch
              key={c.token}
              color={c.token}
              hex={c.hex}
              label={c.label}
              note={c.note}
            />
          ))}
        </motion.div>

        {/* ================================================================
           SECTION 4 — COLOR PALETTE — BRAND & ACCENT
           ================================================================ */}
        <SectionDivider title="Color Palette &mdash; Brand & Accent" />

        <div className="mt-10 space-y-10">
          {brandColors.map((group) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-base font-bold text-foreground mb-4">{group.group}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {group.colors.map((c) => (
                  <ColorSwatch
                    key={c.token}
                    color={c.token}
                    hex={c.hex}
                    label={c.token.replace("--", "")}
                    note={c.note}
                    size="sm"
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Warm UI palette */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Warm UI Palette</h3>
            <div className="grid grid-cols-3 gap-4">
              {warmPalette.map((c) => (
                <ColorSwatch
                  key={c.token}
                  color={c.token}
                  hex={c.hex}
                  label={c.label}
                  size="sm"
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ================================================================
           SECTION 5 — COLOR PALETTE — STATUS & SEMANTIC
           ================================================================ */}
        <SectionDivider title="Color Palette &mdash; Status & Semantic" />

        <div className="mt-10 space-y-10">
          {/* Status Quartet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Status Quartet</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statusColors.map((s) => (
                <div key={s.token} className="rounded-2xl border border-border bg-card p-5 text-center">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
                    style={{ backgroundColor: `var(${s.token})` }}
                  >
                    {s.label}
                  </span>
                  <p className="text-xs text-muted-foreground font-mono">{s.hex}</p>
                  <p className="text-xs text-muted-foreground font-mono">var({s.token})</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Semantic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Semantic</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {semanticColors.map((c) => (
                <ColorSwatch
                  key={c.token}
                  color={c.token}
                  hex={c.hex}
                  label={c.label}
                  size="sm"
                />
              ))}
            </div>
          </motion.div>

          {/* Density */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Detail Coverage Density</h3>
            <div className="grid grid-cols-3 gap-4">
              {densityColors.map((c) => (
                <ColorSwatch
                  key={c.token}
                  color={c.token}
                  hex={c.hex}
                  label={c.label}
                  size="sm"
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ================================================================
           SECTION 6 — TYPOGRAPHY
           ================================================================ */}
        <SectionDivider title="Typography" />

        <div className="mt-10 space-y-12">
          {/* Manrope — Headings */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">Manrope</h3>
              <span className="text-xs text-muted-foreground font-mono">font-heading / var(--font-heading)</span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-7xl (72px)</span>
                <p className="text-7xl font-bold leading-tight">Vitrine</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-5xl (48px)</span>
                <p className="text-5xl font-bold leading-tight">Heading Level 2</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-3xl (30px)</span>
                <p className="text-3xl font-bold leading-tight">Heading Level 3</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-xl (20px)</span>
                <p className="text-xl font-bold leading-tight">Heading Level 4</p>
              </div>
            </div>
          </motion.div>

          {/* Inter — Body */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">Inter</h3>
              <span className="text-xs text-muted-foreground font-mono">font-sans / var(--font-sans)</span>
            </div>
            <div className="space-y-4 font-sans">
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-xl (20px)</span>
                <p className="text-xl text-muted-foreground leading-relaxed">A game-worn jersey and a factory-sealed box share a category label on every other platform.</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-lg (18px)</span>
                <p className="text-lg text-muted-foreground leading-relaxed">A game-worn jersey and a factory-sealed box share a category label on every other platform. In Vitrine, they surface completely different documentation.</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-1 block">text-base (16px)</span>
                <p className="text-base text-muted-foreground leading-relaxed">A game-worn jersey and a factory-sealed box share a category label on every other platform. In Vitrine, they surface completely different documentation — because they require completely different documentation.</p>
              </div>
            </div>
          </motion.div>

          {/* Instrument Serif — Editorial */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">Instrument Serif</h3>
              <span className="text-xs text-muted-foreground font-mono">font-serif / var(--font-serif)</span>
            </div>
            <p className="font-serif text-4xl md:text-5xl text-foreground leading-tight">
              The way a collector&rsquo;s pieces are shown is the utility.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Use for editorial emphasis and pull quotes. Sparingly.</p>
          </motion.div>

          {/* JetBrains Mono — Prices */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">JetBrains Mono</h3>
              <span className="text-xs text-muted-foreground font-mono">font-price / var(--font-mono)</span>
            </div>
            <div className="flex flex-wrap gap-6 font-price">
              <span className="text-3xl font-bold text-foreground">$12,450</span>
              <span className="text-3xl font-bold text-foreground">$875</span>
              <span className="text-3xl font-bold text-foreground">$3,200</span>
              <span className="text-lg text-muted-foreground">$0.00</span>
            </div>
            <div className="mt-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-foreground font-medium">Dollar amounts and prices ONLY. Never use JetBrains Mono for code, labels, or general text on the marketing site.</p>
            </div>
          </motion.div>

          {/* Utility classes */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-6">Utility Classes</h3>
            <div className="space-y-6">
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">.label-caps</span>
                <span className="label-caps text-foreground text-xs">Category Label Example</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">.section-label</span>
                <span className="section-label">Section Label Example</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">.wordmark</span>
                <span className="wordmark text-2xl text-foreground">vitrine</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================================================================
           SECTION 7 — GRADIENTS & EFFECTS
           ================================================================ */}
        <SectionDivider title="Gradients & Effects" />

        <div className="mt-10 space-y-10">
          {/* Gradients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Gradients</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">--gradient-primary (mint → sage)</span>
                <div className="h-16 rounded-xl" style={{ background: "var(--gradient-primary)" }} />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">--gradient-surface (background → elevated)</span>
                <div className="h-16 rounded-xl border border-border" style={{ background: "var(--gradient-surface)" }} />
              </div>
            </div>
          </motion.div>

          {/* Grid texture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Grid Texture</h3>
            <div className="h-40 rounded-xl border border-border bg-grid relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-mono px-3 py-1.5 rounded-full bg-card border border-border">.bg-grid</span>
              </div>
            </div>
          </motion.div>

          {/* Glows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Ambient Glows</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-32 rounded-xl border border-border bg-card relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(ellipse at center, var(--glow-mint) 0%, transparent 70%)" }} />
                <span className="relative text-xs text-muted-foreground font-mono">--glow-mint</span>
              </div>
              <div className="h-32 rounded-xl border border-border bg-card relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(ellipse at center, var(--glow-sand) 0%, transparent 70%)" }} />
                <span className="relative text-xs text-muted-foreground font-mono">--glow-sand</span>
              </div>
            </div>
          </motion.div>

          {/* Category Identity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-4">Category Identity</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="h-24" style={{ backgroundColor: "var(--category-memorabilia)" }} />
                <div className="p-4">
                  <p className="text-sm font-bold text-foreground">Memorabilia</p>
                  <p className="text-xs text-muted-foreground">Cool / sage — physical collectibles</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">--category-memorabilia #EAEFDE</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="h-24" style={{ backgroundColor: "var(--category-cards)" }} />
                <div className="p-4">
                  <p className="text-sm font-bold text-foreground">Trading Cards</p>
                  <p className="text-xs text-muted-foreground">Warm / sand — API-driven catalog</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">--category-cards #E7D5BA</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================================================================
           SECTION 10 — LIVE COMPONENT DEMOS
           ================================================================ */}
        <SectionDivider title="Live Component Demos" />

        <div className="mt-10 space-y-12">
          {/* SectionLabel */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-6">SectionLabel</h3>
            <div className="flex flex-wrap gap-8">
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">color=&quot;cyan&quot; (default)</span>
                <SectionLabel animate={false}>Example Label</SectionLabel>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">color=&quot;magenta&quot;</span>
                <SectionLabel color="magenta" animate={false}>Example Label</SectionLabel>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">color=&quot;amber&quot;</span>
                <SectionLabel color="amber" animate={false}>Example Label</SectionLabel>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-2 block">color=&quot;green&quot;</span>
                <SectionLabel color="green" animate={false}>Example Label</SectionLabel>
              </div>
            </div>
          </motion.div>

          {/* MagneticButton */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-6">MagneticButton</h3>
            <div className="space-y-8">
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-3 block">variant=&quot;primary&quot;</span>
                <div className="flex flex-wrap items-center gap-4">
                  <MagneticButton variant="primary" size="sm">Small</MagneticButton>
                  <MagneticButton variant="primary" size="md">Medium</MagneticButton>
                  <MagneticButton variant="primary" size="lg">Large</MagneticButton>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-3 block">variant=&quot;secondary&quot;</span>
                <div className="flex flex-wrap items-center gap-4">
                  <MagneticButton variant="secondary" size="sm">Small</MagneticButton>
                  <MagneticButton variant="secondary" size="md">Medium</MagneticButton>
                  <MagneticButton variant="secondary" size="lg">Large</MagneticButton>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono mb-3 block">variant=&quot;ghost&quot;</span>
                <div className="flex flex-wrap items-center gap-4">
                  <MagneticButton variant="ghost" size="sm">Small</MagneticButton>
                  <MagneticButton variant="ghost" size="md">Medium</MagneticButton>
                  <MagneticButton variant="ghost" size="lg">Large</MagneticButton>
                </div>
              </div>
            </div>
          </motion.div>

          {/* PhoneFrame */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-6">PhoneFrame</h3>
            <div className="flex flex-wrap items-end gap-8 justify-center">
              <div className="flex flex-col items-center gap-2">
                <PhoneFrame size="sm" label="Small (220×440)" />
                <span className="text-xs text-muted-foreground font-mono">size=&quot;sm&quot;</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PhoneFrame size="md" label="Medium (280×560)" />
                <span className="text-xs text-muted-foreground font-mono">size=&quot;md&quot;</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PhoneFrame size="lg" label="Large (320×640)" />
                <span className="text-xs text-muted-foreground font-mono">size=&quot;lg&quot;</span>
              </div>
            </div>
          </motion.div>

          {/* Status Badges */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-6">Status Badges (as rendered on cards)</h3>
            <div className="flex flex-wrap gap-3">
              {statusColors.map((s) => (
                <span
                  key={s.token}
                  className="text-[10px] tracking-wider font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `var(${s.token})` + "20",
                    color: `var(${s.token})`,
                    border: `1px solid var(${s.token})30`,
                  }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card Patterns */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-base font-bold text-foreground mb-6">Card Patterns</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card">
                <span className="text-xs text-muted-foreground font-mono mb-2 block">Standard card</span>
                <p className="text-sm text-foreground">border-border bg-card</p>
              </div>
              <div className="p-5 rounded-2xl border border-primary/20 bg-primary/[0.03]">
                <span className="text-xs text-muted-foreground font-mono mb-2 block">Highlighted card</span>
                <p className="text-sm text-foreground">border-primary/20</p>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/20 transition-colors">
                <span className="text-xs text-muted-foreground font-mono mb-2 block">Interactive card</span>
                <p className="text-sm text-foreground">hover:border-muted-foreground/20</p>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-xs text-muted-foreground font-mono mb-2 block">Closing line highlight</span>
              <p className="text-lg text-foreground font-medium leading-relaxed">
                <span className="bg-primary/20 decoration-clone box-decoration-clone px-1 py-0.5">This is the highlight treatment used for key closing statements across feature sections.</span>
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
