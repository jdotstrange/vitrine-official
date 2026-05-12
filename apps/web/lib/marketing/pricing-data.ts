/**
 * Pricing-page constants — three-tier model from
 * `vitrinedb/docs/pricing-model.md`.
 *
 * The cards, comparison table, fee math, and FAQ on /pricing all read
 * from this file so a future pricing change happens in exactly one place.
 *
 * Status (per source doc): Proposed 2026-05-11. Founders pricing locked
 * for life for the first 10K Pro users. Tier infrastructure is not yet
 * wired into the Collector App.
 */

export type TierId = "free" | "pro" | "collector"

export interface PricingTier {
  id: TierId
  name: string
  /** Short pitch — the audience descriptor, one line */
  audience: string
  /** Slightly longer card tagline — the "what this tier is" sentence */
  tagline: string
  /** Monthly price in USD. null = free */
  monthlyPrice: number | null
  /** Annual price in USD per year. null = free */
  annualPrice: number | null
  /** Effective per-month price when paying annually */
  annualMonthlyEffective: number | null
  /** Card highlights — 5-6 bullets, the "what you get at a glance" */
  highlights: { icon: string; label: string }[]
  /** CTA label rendered on the card button */
  ctaLabel: string
  /** CTA destination */
  ctaHref: string
  /** Marks the tier as the recommended/featured choice on the card grid */
  highlighted?: boolean
  /** Token key for tier accent color */
  toneKey: "fg2" | "volt" | "blue"
}

export const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    audience: "The default. The competitive weapon.",
    tagline:
      "Generous enough that a casual collector can build real value before ever paying.",
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyEffective: 0,
    highlights: [
      { icon: "package", label: "Up to 1,000 items" },
      { icon: "scan-line", label: "10 AI scans / day" },
      { icon: "rocket", label: "100-item migration burst on signup" },
      { icon: "layout-template", label: "Unlimited manual showcases" },
      { icon: "eye", label: "View any AI report (VAR / AAR / Pulse)" },
      { icon: "shopping-bag", label: "Buy + Sell at 10% fee" },
    ],
    ctaLabel: "Start free",
    ctaHref: "/#download",
    toneKey: "fg2",
  },
  {
    id: "pro",
    name: "Pro",
    audience: "The accessible upgrade. The serious collector tier.",
    tagline:
      "Removes the painful caps, opens AI generation, unlocks auto-showcases, lets serious collectors transact.",
    monthlyPrice: 9.99,
    annualPrice: 89,
    annualMonthlyEffective: 7.42,
    highlights: [
      { icon: "infinity", label: "Unlimited collection size" },
      { icon: "scan-line", label: "50 AI scans / day" },
      { icon: "sparkles", label: "30 AI report generations / month" },
      { icon: "wand", label: "AI-powered Smart Showcases" },
      { icon: "repeat", label: "Buy + Sell + Trade at 10% fee" },
      { icon: "upload-cloud", label: "Bulk uploader + public showcase URLs" },
    ],
    ctaLabel: "Go Pro",
    ctaHref: "/#download",
    highlighted: true,
    toneKey: "volt",
  },
  {
    id: "collector",
    name: "Collector",
    audience: "The power user. Sellers, dealers, deep collectors.",
    tagline:
      "The marketplace fee discount alone covers it for any seller doing $1,000+/month GMV. Hub fees stack.",
    monthlyPrice: 24.99,
    annualPrice: 249,
    annualMonthlyEffective: 20.75,
    highlights: [
      { icon: "infinity", label: "Unlimited AI generations (fair use)" },
      { icon: "percent", label: "7% marketplace fee (vs 10%)" },
      { icon: "fast-forward", label: "Hub priority queue + reduced fees" },
      { icon: "palette", label: "Custom showcase themes & branding" },
      { icon: "bar-chart-3", label: "Cross-vertical AI portfolio analytics" },
      { icon: "code", label: "API access + priority support" },
    ],
    ctaLabel: "Go Collector",
    ctaHref: "/#download",
    toneKey: "blue",
  },
]

// ───────── Founders pricing ─────────

export const FOUNDERS_PRICING = {
  /** Total seats locked at the founders rate, for life */
  cohortSize: 10000,
  /** Locked monthly price for founders */
  lockedMonthlyPrice: 9.99,
  /** Future cohort monthly price */
  futureMonthlyPrice: 12.99,
  headline: "Founders pricing — locked for life.",
  body: "The first 10,000 Pro subscribers pay $9.99/mo forever, even after we raise the price for future cohorts. We will, eventually.",
} as const

// ───────── View vs Generate keystone ─────────

export interface ViewVsGenerateRow {
  label: string
  /** What every user sees / can do */
  view: string
  /** What's gated behind a paid generation */
  generate: string
}

export const VIEW_VS_GENERATE: ViewVsGenerateRow[] = [
  {
    label: "VAR · Variable Authentication Report",
    view: "View any VAR on a marketplace listing or piece you bought",
    generate: "Generate VAR on your own pieces",
  },
  {
    label: "AAR · Authoritative Appraisal Report",
    view: "View any AAR shared with you or attached to a listing",
    generate: "Generate AAR on your own pieces",
  },
  {
    label: "Pulse · per-item market intel",
    view: "View Pulse on any piece in the network",
    generate: "Subscribe Pulse to your own pieces",
  },
  {
    label: "Smart Showcases · AI-curated layouts",
    view: "View any public Smart Showcase",
    generate: "Auto-organize your own showcases",
  },
]

// ───────── Marketplace fee math ─────────

export interface FeeRow {
  tier: TierId
  /** Marketplace fee as a fraction (0.10 = 10%) */
  fee: number
  /** Whether Trade is available on this tier */
  trade: boolean
}

export const FEE_TABLE: FeeRow[] = [
  { tier: "free", fee: 0.1, trade: false },
  { tier: "pro", fee: 0.1, trade: true },
  { tier: "collector", fee: 0.07, trade: true },
]

// ───────── Comparison matrix (full feature table) ─────────

export interface ComparisonRow {
  /** The capability label */
  label: string
  /** Optional grouping / section heading. If set, this row is a header. */
  group?: string
  /** Per-tier value: short string ("Unlimited", "10/day", "Yes", "—") */
  values: { free: string; pro: string; collector: string }
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Catalog & extraction", group: "Catalog", values: { free: "", pro: "", collector: "" } },
  {
    label: "Collection size",
    values: { free: "1,000 items", pro: "Unlimited", collector: "Unlimited" },
  },
  {
    label: "AI extractions / scans",
    values: { free: "10 / day", pro: "50 / day", collector: "Unlimited (fair use)" },
  },
  {
    label: "Migration burst at signup",
    values: { free: "100 items", pro: "Unlimited", collector: "Unlimited" },
  },
  {
    label: "Per-category schemas (38 categories)",
    values: { free: "Yes", pro: "Yes", collector: "Yes" },
  },
  {
    label: "Bulk uploader",
    values: { free: "—", pro: "Yes", collector: "Yes" },
  },

  { label: "Showcases", group: "Showcase", values: { free: "", pro: "", collector: "" } },
  {
    label: "Manual showcases",
    values: { free: "Unlimited", pro: "Unlimited", collector: "Unlimited" },
  },
  {
    label: "Crown Jewel anchor",
    values: { free: "Yes", pro: "Yes", collector: "Yes" },
  },
  {
    label: "AI Smart Showcases",
    values: { free: "—", pro: "Yes", collector: "Yes" },
  },
  {
    label: "Public showcase URLs",
    values: { free: "View only", pro: "Yes", collector: "Yes" },
  },
  {
    label: "Custom themes & branding",
    values: { free: "—", pro: "—", collector: "Yes" },
  },

  { label: "AI reports", group: "Intelligence", values: { free: "", pro: "", collector: "" } },
  {
    label: "View VAR / AAR / Pulse on others",
    values: { free: "Unlimited", pro: "Unlimited", collector: "Unlimited" },
  },
  {
    label: "Generate VAR / AAR / Pulse",
    values: {
      free: "—",
      pro: "30 / month (max 5/day)",
      collector: "Unlimited (fair use)",
    },
  },
  {
    label: "Cross-vertical AI portfolio analytics",
    values: { free: "—", pro: "—", collector: "Yes" },
  },

  { label: "Marketplace", group: "Trade", values: { free: "", pro: "", collector: "" } },
  {
    label: "Buy & Sell",
    values: { free: "Yes", pro: "Yes", collector: "Yes" },
  },
  {
    label: "Trade",
    values: { free: "—", pro: "Yes", collector: "Yes" },
  },
  {
    label: "Marketplace fee",
    values: { free: "10%", pro: "10%", collector: "7%" },
  },
  {
    label: "Hub priority + reduced fees",
    values: { free: "—", pro: "—", collector: "Yes" },
  },

  { label: "Data & access", group: "Data", values: { free: "", pro: "", collector: "" } },
  {
    label: "Data export",
    values: { free: "CSV summary", pro: "Full JSON", collector: "Full JSON" },
  },
  {
    label: "Verification deep-links",
    values: { free: "Yes", pro: "Yes", collector: "Yes" },
  },
  {
    label: "API access",
    values: { free: "—", pro: "—", collector: "Yes" },
  },
  {
    label: "Support",
    values: { free: "Standard", pro: "Standard", collector: "Priority" },
  },
]

// ───────── Pricing-page FAQ (split from the original FAQS for product/pricing) ─────────

export interface PricingFAQItem {
  q: string
  a: string
}

export const PRICING_FAQS: PricingFAQItem[] = [
  {
    q: "What's founders pricing and how do I get it?",
    a: "The first 10,000 Pro subscribers pay $9.99/mo (or $89/year) forever. The rate is locked to your account for life — even after we raise prices for new cohorts. The only way to get it is to upgrade to Pro before the cohort fills.",
  },
  {
    q: "Can I switch tiers anytime?",
    a: "Yes. Upgrade or downgrade at any time. Annual subscribers can switch tiers with prorated credit. There are no contracts and no cancellation fees.",
  },
  {
    q: "Is there an annual discount?",
    a: "Yes. Pro is $89/year (a $30 discount vs paying monthly). Collector is $249/year (a $51 discount). Effective monthly rates are $7.42 for Pro and $20.75 for Collector.",
  },
  {
    q: "What does \u201Cunlimited within fair use\u201D mean for Collector?",
    a: "AI extractions and report generation on Collector are capped at 5/minute and 200/day to prevent scripted abuse. In practice no real human approaches these limits. Documented in the TOS so there are no surprises.",
  },
  {
    q: "Why does Pro cap AI generations at 30/month?",
    a: "AI report generation is the expensive operation in our cost stack. The 30/month cap with a 5/day sub-cap protects unit economics against worst-case usage. The cap is generous for normal collectors and creates a natural reason for power users to upgrade to Collector.",
  },
  {
    q: "Why is everyone allowed to view AI reports?",
    a: "View is free; generate is paid. This is the keystone of the model. Letting every user see VAR, AAR, and Pulse on marketplace listings and other users' content drives upgrade desire (FOMO at scale), maximizes marketplace value (every buyer sees the seller's reports), and protects unit economics (viewing is essentially free Postgres reads).",
  },
  {
    q: "What's the marketplace fee structure?",
    a: "Free and Pro pay 10% on Buy/Sell. Collector pays 7%. The 3% gap means Collector pays for itself for any seller doing roughly $1,000/month or more in GMV. Trade carries no fee on Pro and Collector (Free can't Trade).",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Free is genuinely free. No card, no trial that auto-converts, no signup wall. Catalog one piece and decide later whether you want Pro.",
  },
  {
    q: "Why is the free tier so generous?",
    a: "Vitrine's long-term revenue comes from marketplace take rate and hub fees, both of which scale with user count and transaction volume. A generous free tier feeds the marketplace engine. Even heavy free users cost us less than $1.50/month in infrastructure.",
  },
  {
    q: "When does this pricing go live?",
    a: "Pricing infrastructure (RevenueCat + Stripe + entitlement enforcement) is being wired now. The current app is fully usable at the Free tier feature set. Founders pricing for Pro begins on launch.",
  },
]
