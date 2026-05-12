/**
 * Intelligence-page constants.
 *
 * Drives the multi-vertical extraction examples, before/after comparison,
 * and the VAR / AAR / Pulse-lens explanation cards. Photo URLs reuse the
 * existing PHOTOS module so the marketing site stays single-source-of-truth
 * for imagery.
 */

import { PHOTOS } from "./photos"

export interface ExtractionExample {
  /** Tab label shown in the vertical switcher */
  vertical: string
  /** Photo backing this example */
  photo: string
  /** Short two-line piece label */
  title: string
  /** One-line sub-label below the title */
  sub: string
  /** Extracted fields the engine derived from a single photo */
  fields: { label: string; value: string; confidence?: number }[]
  /** Detected category badge value */
  category: string
  /** Confidence percentage for the overall classification */
  classifyConfidence: number
}

export const EXTRACTION_EXAMPLES: ExtractionExample[] = [
  {
    vertical: "Card",
    photo: PHOTOS.cards,
    title: "1986 Fleer Jordan #57",
    sub: "Fleer · PSA 10",
    category: "TRADING CARD",
    classifyConfidence: 98,
    fields: [
      { label: "Set", value: "Fleer", confidence: 99 },
      { label: "Year", value: "1986\u201387", confidence: 97 },
      { label: "Card #", value: "57", confidence: 99 },
      { label: "Subject", value: "Michael Jordan", confidence: 98 },
      { label: "Variant", value: "Base · Rookie", confidence: 96 },
      { label: "Grade", value: "PSA 10 GEM MT", confidence: 99 },
      { label: "Cert #", value: "24890132", confidence: 99 },
      { label: "Population", value: "317", confidence: 91 },
    ],
  },
  {
    vertical: "Watch",
    photo: PHOTOS.watch,
    title: "Speedmaster Pro 1969",
    sub: "Omega · 145.022",
    category: "WATCH",
    classifyConfidence: 96,
    fields: [
      { label: "Brand", value: "Omega", confidence: 99 },
      { label: "Reference", value: "145.022", confidence: 95 },
      { label: "Caliber", value: "861", confidence: 92 },
      { label: "Case", value: "42mm steel", confidence: 96 },
      { label: "Dial", value: "Step \u00b7 matte black", confidence: 89 },
      { label: "Bezel", value: "Tachy \u00b7 DON", confidence: 88 },
      { label: "Bracelet", value: "1171/633", confidence: 91 },
      { label: "Year (est.)", value: "1969", confidence: 84 },
    ],
  },
  {
    vertical: "Comic",
    photo: PHOTOS.comics,
    title: "Amazing Fantasy #15",
    sub: "Marvel · CGC 7.5",
    category: "COMIC BOOK",
    classifyConfidence: 99,
    fields: [
      { label: "Title", value: "Amazing Fantasy", confidence: 99 },
      { label: "Issue", value: "#15", confidence: 99 },
      { label: "Date", value: "Aug 1962", confidence: 98 },
      { label: "Publisher", value: "Marvel", confidence: 99 },
      { label: "Grade", value: "CGC 7.5", confidence: 99 },
      { label: "Pages", value: "White", confidence: 95 },
      { label: "Key", value: "1st Spider-Man", confidence: 99 },
      { label: "Restored", value: "No", confidence: 96 },
    ],
  },
  {
    vertical: "Sneaker",
    photo: PHOTOS.sneaker,
    title: "Air Jordan 1 \u201CChicago\u201D",
    sub: "Nike 1985 \u00b7 DS",
    category: "SNEAKER",
    classifyConfidence: 95,
    fields: [
      { label: "Model", value: "Air Jordan 1", confidence: 98 },
      { label: "Colorway", value: "Chicago", confidence: 99 },
      { label: "Year", value: "1985", confidence: 87 },
      { label: "Size", value: "US 10", confidence: 92 },
      { label: "Condition", value: "DS \u00b7 Unworn", confidence: 89 },
      { label: "Box", value: "OG \u00b7 Clean", confidence: 93 },
      { label: "Origin", value: "US release", confidence: 90 },
      { label: "Authenticator", value: "StockX \u00b7 CCA", confidence: 95 },
    ],
  },
  {
    vertical: "Coin",
    photo: PHOTOS.coin,
    title: "1933 Double Eagle",
    sub: "Saint-Gaudens",
    category: "COIN",
    classifyConfidence: 97,
    fields: [
      { label: "Denomination", value: "$20", confidence: 99 },
      { label: "Year", value: "1933", confidence: 98 },
      { label: "Designer", value: "Saint-Gaudens", confidence: 95 },
      { label: "Composition", value: "90% Au", confidence: 97 },
      { label: "Mint", value: "Philadelphia", confidence: 92 },
      { label: "Grade", value: "MS-65", confidence: 99 },
      { label: "Holder", value: "NGC", confidence: 99 },
      { label: "Notes", value: "Monetized 2002", confidence: 88 },
    ],
  },
  {
    vertical: "Vinyl",
    photo: PHOTOS.vinyl,
    title: "Coltrane \u00b7 Blue Train",
    sub: "Blue Note BLP 1577",
    category: "VINYL RECORD",
    classifyConfidence: 94,
    fields: [
      { label: "Artist", value: "John Coltrane", confidence: 99 },
      { label: "Title", value: "Blue Train", confidence: 99 },
      { label: "Label", value: "Blue Note", confidence: 99 },
      { label: "Cat #", value: "BLP 1577", confidence: 96 },
      { label: "Pressing", value: "Mono \u00b7 1957 OG", confidence: 88 },
      { label: "Matrix", value: "RVG \u00b7 Ear", confidence: 89 },
      { label: "Sleeve", value: "Frame \u00b7 47 W. 63rd", confidence: 92 },
      { label: "Condition", value: "VG+ / VG+", confidence: 91 },
    ],
  },
]

// ───────── Before / After comparison ─────────

export interface BeforeAfterCopy {
  /** Field other apps make you fill in by hand */
  field: string
  /** What Vitrine extracts automatically */
  extracted: string
}

export const BEFORE_AFTER_FIELDS: BeforeAfterCopy[] = [
  { field: "Set", extracted: "Fleer" },
  { field: "Year", extracted: "1986\u201387" },
  { field: "Card number", extracted: "57" },
  { field: "Player / subject", extracted: "Michael Jordan" },
  { field: "Variant", extracted: "Base \u00b7 Rookie" },
  { field: "Grade", extracted: "PSA 10 GEM MT" },
  { field: "Certification number", extracted: "24890132" },
  { field: "Population", extracted: "317" },
  { field: "Provenance", extracted: "Goldin \u00b7 2023" },
]

// ───────── VAR / AAR / Pulse explanations ─────────

export interface ReportExplanation {
  /** Short product name */
  name: string
  /** Long-form acronym expansion */
  longName: string
  /** Tagline rendered as sub-headline */
  tagline: string
  /** What the report does, paragraph form */
  body: string
  /** Three short bullets describing the report */
  bullets: { icon: string; label: string; sub: string }[]
  /** Tone token key (volt for AI, blue for AAR, fg2 for Pulse) */
  toneKey: "volt" | "blue" | "cyan"
  /** Right-rail sample output rows */
  sampleRows: { label: string; value: string }[]
  /** Sample output title */
  sampleTitle: string
}

export const VAR_EXPLANATION: ReportExplanation = {
  name: "VAR",
  longName: "Variable Authentication Report",
  tagline: "Authentication you can argue with.",
  body: "Most authentication is opaque \u2014 a checkmark, a logo, a scan you have to trust. VAR is an attribute-by-attribute breakdown: print color, registration, font weight, holder profile, certification cross-check. Each signal is rendered with its own confidence and the underlying observation. You see the math.",
  toneKey: "volt",
  bullets: [
    {
      icon: "scan-text",
      label: "Per-attribute breakdown",
      sub: "Every signal scored individually, not bucketed",
    },
    {
      icon: "shield-check",
      label: "Cross-source validation",
      sub: "PSA / CGC / SGC databases reconciled in-line",
    },
    {
      icon: "share-2",
      label: "Shareable on the listing",
      sub: "Buyers see the same VAR on a marketplace listing",
    },
  ],
  sampleTitle: "VAR \u00b7 1986 Fleer Jordan #57",
  sampleRows: [
    { label: "Print registration", value: "98% \u00b7 within tolerance" },
    { label: "Color cast", value: "97% \u00b7 OG print run" },
    { label: "Holder profile", value: "99% \u00b7 PSA bracket consistent" },
    { label: "Cert verification", value: "Match \u00b7 PSA \u00b7 24890132" },
    { label: "Population delta", value: "+2 in last 90 days" },
  ],
}

export const AAR_EXPLANATION: ReportExplanation = {
  name: "AAR",
  longName: "Authoritative Appraisal Report",
  tagline: "Appraisal-grade, on demand.",
  body: "An AAR is what a serious estate would commission \u2014 a written, weighted, dated valuation built from comparable sales, condition, and market context. Vitrine generates one in seconds, with the underlying comps cited, the volatility shown, and the assumptions called out. Defensible enough for insurance; transparent enough for trade.",
  toneKey: "blue",
  bullets: [
    {
      icon: "file-check",
      label: "Defensible valuation",
      sub: "Comps cited, weights shown, assumptions documented",
    },
    {
      icon: "calendar-clock",
      label: "Date-stamped",
      sub: "Re-issue on demand for insurance, estate, settlement",
    },
    {
      icon: "trending-up",
      label: "Volatility-aware",
      sub: "Confidence band reflects the comp dispersion",
    },
  ],
  sampleTitle: "AAR \u00b7 Speedmaster Pro 1969",
  sampleRows: [
    { label: "Mid valuation", value: "$42,400" },
    { label: "Range", value: "$38,800 \u2013 $46,000" },
    { label: "Comps weighted", value: "23 sales \u00b7 18 mo lookback" },
    { label: "Volatility", value: "Low \u00b7 \u00b15.2%" },
    { label: "Issued", value: "Today \u00b7 valid 90 days" },
  ],
}

export const PULSE_EXPLANATION: ReportExplanation = {
  name: "Pulse",
  longName: "Per-piece market intel",
  tagline: "What the market is doing to your piece.",
  body: "Pulse is the per-item sensor strip. Subscribe a piece and Pulse watches the relevant attribute lanes \u2014 grade-specific volume, parallel-specific price moves, auction spikes, comp drift. Quiet by default. Loud when the signal earns it.",
  toneKey: "cyan",
  bullets: [
    {
      icon: "radio-tower",
      label: "Per-attribute sensors",
      sub: "Grade, parallel, region \u2014 not whole-set noise",
    },
    {
      icon: "bell",
      label: "Quiet by default",
      sub: "Only the signals you opted into reach you",
    },
    {
      icon: "activity",
      label: "Movement-aware",
      sub: "Spikes flagged with cause where we can identify it",
    },
  ],
  sampleTitle: "PULSE \u00b7 PSA 10 Jordan #57 \u00b7 last 30 days",
  sampleRows: [
    { label: "Volume", value: "12 sales \u00b7 +33% vs trailing 90d" },
    { label: "Price drift", value: "+$4,800 mid \u00b7 +6.0%" },
    { label: "Spread tightening", value: "Ask\u2013bid \u2212$1,200" },
    { label: "Comparable high", value: "$96,000 \u00b7 Goldin \u00b7 11d ago" },
    { label: "Trigger", value: "Cause: parallel relisting cluster" },
  ],
}

// ───────── Technical credibility cards ─────────

export interface TechCard {
  icon: string
  title: string
  body: string
}

export const TECH_CREDIBILITY: TechCard[] = [
  {
    icon: "cpu",
    title: "Multi-pass extraction",
    body: "Three passes per photo: classify, detect overlays, extract fields. Each pass is independently scored and reconciled before the result lands.",
  },
  {
    icon: "scan-text",
    title: "OCR on the slab",
    body: "PSA, CGC, SGC, BGS, JSA labels parsed directly off the holder. Cert numbers cross-checked against grader databases in-line.",
  },
  {
    icon: "shield-check",
    title: "Confidence everywhere",
    body: "Every extracted field carries its own confidence score. Below threshold, we ask. Above threshold, we commit and show the work.",
  },
  {
    icon: "git-merge",
    title: "Schema reconciliation",
    body: "38 per-category schemas with attribute-level type checks. The engine fits the photo to the schema, not the other way around.",
  },
]
