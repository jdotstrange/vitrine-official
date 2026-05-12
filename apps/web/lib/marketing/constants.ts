/**
 * Marketing-site static constants. Schemas, category list, intelligence
 * theater stage timings, hero kicker carousel labels — pulled out of the
 * source mockup so section files can import them by name without
 * duplicating literal data.
 */

import { PHOTOS, type PhotoKey } from "./photos"

// ───────── Hero kicker carousel ─────────

export const KICKER_CYCLE = [
  "CARDS",
  "COINS",
  "WATCHES",
  "COMICS",
  "SNEAKERS",
  "VINYL",
  "TCG",
  "FUNKO",
  "AUTOGRAPHS",
] as const

// ───────── Hero categories marquee ─────────

export const HERO_CATEGORIES = [
  "CARDS",
  "COMICS",
  "COINS",
  "WATCHES",
  "SNEAKERS",
  "VINYL",
  "FUNKO",
  "AUTOGRAPHS",
  "TCG",
  "MEMORABILIA",
  "CAMERAS",
  "POSTERS",
  "JEWELRY",
  "TOYS",
  "STAMPS",
] as const

// ───────── Cataloging section schemas ─────────

export type SchemaKey = "CARD" | "WATCH" | "COMIC" | "SNEAKER" | "COIN"

export interface SchemaEntry {
  photo: string
  name: string
  sub: string
  fields: [string, string][]
}

export const SCHEMAS: Record<SchemaKey, SchemaEntry> = {
  CARD: {
    photo: PHOTOS.cards,
    name: "1986 Fleer Jordan #57",
    sub: "Fleer · PSA 10",
    fields: [
      ["Set", "Fleer"],
      ["Year", "1986\u201387"],
      ["Card #", "57"],
      ["Parallel", "Base"],
      ["Grade", "PSA 10 GEM MT"],
      ["Cert #", "24890132"],
      ["Population", "317"],
      ["Subject", "Michael Jordan · RC"],
      ["Provenance", "Goldin · 2023"],
    ],
  },
  WATCH: {
    photo: PHOTOS.watch,
    name: "Speedmaster Pro 1969",
    sub: "Omega · 145.022",
    fields: [
      ["Reference", "145.022"],
      ["Year", "1969"],
      ["Caliber", "861"],
      ["Case", "42mm steel"],
      ["Dial", "Step · matte black"],
      ["Bezel", "Tachy · DON"],
      ["Bracelet", "1171/633"],
      ["Service", "Omega · 2022"],
      ["Box & Papers", "Yes"],
    ],
  },
  COMIC: {
    photo: PHOTOS.comics,
    name: "Amazing Fantasy #15",
    sub: "Marvel · CGC 7.5",
    fields: [
      ["Title", "Amazing Fantasy"],
      ["Issue", "#15"],
      ["Date", "Aug 1962"],
      ["Publisher", "Marvel"],
      ["Grade", "CGC 7.5"],
      ["Pages", "White"],
      ["Key", "1st Spider-Man"],
      ["Signed", "\u2014"],
      ["Restored", "No"],
    ],
  },
  SNEAKER: {
    photo: PHOTOS.sneaker,
    name: "Air Jordan 1 \u201CChicago\u201D",
    sub: "Nike 1985 · DS",
    fields: [
      ["Model", "Air Jordan 1"],
      ["Colorway", "Chicago"],
      ["Year", "1985"],
      ["Size", "US 10"],
      ["Condition", "DS · Unworn"],
      ["Box", "OG · clean"],
      ["Origin", "US release"],
      ["Authenticator", "StockX · CCA"],
      ["Storage", "Climate · UV-shield"],
    ],
  },
  COIN: {
    photo: PHOTOS.coin,
    name: "1933 Double Eagle",
    sub: "Saint-Gaudens",
    fields: [
      ["Denomination", "$20"],
      ["Year", "1933"],
      ["Designer", "Saint-Gaudens"],
      ["Composition", "90% Au"],
      ["Mint", "Philadelphia"],
      ["Grade", "MS-65"],
      ["Holder", "NGC"],
      ["Provenance", "Stack\u2019s · 2021"],
      ["Notes", "Monetized · 2002"],
    ],
  },
}

// ───────── Categories grid ─────────

export interface Category {
  name: string
  count: string
  hot?: boolean
}

export const CATS: Category[] = [
  { name: "Cards", count: "4,218", hot: true },
  { name: "TCG", count: "1,840", hot: true },
  { name: "Watches", count: "982", hot: true },
  { name: "Comics", count: "724" },
  { name: "Coins", count: "612" },
  { name: "Sneakers", count: "588", hot: true },
  { name: "Vinyl", count: "491" },
  { name: "Memorabilia", count: "402" },
  { name: "Autographs", count: "380" },
  { name: "Cameras", count: "214" },
  { name: "Funko", count: "198" },
  { name: "Toys", count: "172" },
  { name: "Jewelry", count: "148" },
  { name: "Posters", count: "132" },
  { name: "Stamps", count: "108" },
  { name: "Movies", count: "92" },
  { name: "Music", count: "88" },
  { name: "Bobbleheads", count: "64" },
  { name: "Tickets", count: "52" },
  { name: "Knives", count: "48" },
  { name: "Pens", count: "44" },
  { name: "Lighters", count: "38" },
  { name: "Currency", count: "36" },
  { name: "Magazines", count: "32" },
  { name: "Bottles", count: "28" },
  { name: "Pinbacks", count: "24" },
  { name: "Programs", count: "22" },
  { name: "Patches", count: "18" },
  { name: "Wax", count: "16" },
  { name: "Plates", count: "14" },
  { name: "Slabs", count: "12" },
  { name: "Tokens", count: "10" },
  { name: "Maps", count: "8" },
  { name: "Books", count: "7" },
  { name: "Antiques", count: "6" },
  { name: "Art", count: "5" },
  { name: "Fossils", count: "4" },
  { name: "Minerals", count: "3" },
]

// ───────── Intelligence theater (4.8s loop) ─────────

export const INTEL_CYCLE_MS = 4800

export const INTEL_STAGES = {
  PHOTOS: 0.0,
  SCAN: 0.22,
  CLASSIFY: 0.4,
  TRAITS: 0.55,
  FIELDS: 0.68,
  TITLE: 0.86,
} as const

// ───────── Showcases (used by ShowcasesSection) ─────────

export interface ShowcaseEntry {
  key: PhotoKey
  photo: string
  title: string
  count: number
  jewel: string
  tag: string
  tone: "blue" | "cyan" | "orange" | "red" | "olive" | "volt"
}

export const SHOWCASES: ShowcaseEntry[] = [
  {
    key: "cards",
    photo: PHOTOS.cards,
    title: "The Vintage Files",
    count: 14,
    jewel: "1986 Fleer Jordan #57",
    tag: "BASKETBALL",
    tone: "blue",
  },
  {
    key: "watch",
    photo: PHOTOS.watch,
    title: "Speedmaster Era",
    count: 9,
    jewel: "Speedmaster Pro 1969",
    tag: "WATCHES",
    tone: "volt",
  },
  {
    key: "vinyl",
    photo: PHOTOS.vinyl,
    title: "Blue Note OGs",
    count: 22,
    jewel: "Coltrane · Blue Train",
    tag: "VINYL",
    tone: "cyan",
  },
  {
    key: "sneaker",
    photo: PHOTOS.sneaker,
    title: "AJ1 1985\u201386",
    count: 11,
    jewel: "Air Jordan 1 \u201CChicago\u201D",
    tag: "SNEAKERS",
    tone: "orange",
  },
  {
    key: "comics",
    photo: PHOTOS.comics,
    title: "Silver Age Marvel",
    count: 18,
    jewel: "Amazing Fantasy #15",
    tag: "COMICS",
    tone: "red",
  },
  {
    key: "coin",
    photo: PHOTOS.coin,
    title: "American Gold",
    count: 7,
    jewel: "1933 Double Eagle",
    tag: "COINS",
    tone: "olive",
  },
]

// ───────── Explore items ─────────

export interface ExploreItem {
  photo: string
  name: string
  set: string
  price: string
  status: "for_sale" | "for_trade" | "sell_trade" | "nfst"
  cat: string
}

export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    photo: PHOTOS.cards,
    name: "1986 Fleer Jordan #57",
    set: "Fleer · PSA 10",
    price: "$84,500",
    status: "nfst",
    cat: "CARDS",
  },
  {
    photo: PHOTOS.watch,
    name: "Speedmaster Pro 1969",
    set: "Omega · 145.022",
    price: "$42,000",
    status: "for_sale",
    cat: "WATCHES",
  },
  {
    photo: PHOTOS.sneaker,
    name: "Air Jordan 1 \"Chicago\"",
    set: "Nike 1985 · DS",
    price: "$14,800",
    status: "for_trade",
    cat: "SNEAKERS",
  },
  {
    photo: PHOTOS.vinyl,
    name: "Coltrane · Blue Train",
    set: "Blue Note BLP 1577",
    price: "$11,200",
    status: "sell_trade",
    cat: "VINYL",
  },
  {
    photo: PHOTOS.comics,
    name: "Amazing Fantasy #15",
    set: "Marvel · CGC 7.5",
    price: "$92,000",
    status: "for_sale",
    cat: "COMICS",
  },
  {
    photo: PHOTOS.coin,
    name: "1933 Double Eagle",
    set: "Saint-Gaudens",
    price: "$5.2M",
    status: "nfst",
    cat: "COINS",
  },
  {
    photo: PHOTOS.camera,
    name: "Leica M3 1954",
    set: "Leitz · Wetzlar",
    price: "$4,800",
    status: "for_trade",
    cat: "CAMERAS",
  },
  {
    photo: PHOTOS.cards,
    name: "2008 Topps Chrome Trout RC",
    set: "Topps · PSA 9",
    price: "$1,420",
    status: "for_sale",
    cat: "CARDS",
  },
]

export const EXPLORE_FILTERS = [
  "ALL",
  "CARDS",
  "WATCHES",
  "SNEAKERS",
  "VINYL",
  "COMICS",
  "COINS",
  "CAMERAS",
] as const

export const STATUS_LABEL: Record<string, string> = {
  for_sale: "FOR SALE",
  for_trade: "FOR TRADE",
  sell_trade: "SELL/TRADE",
  nfst: "NFST",
}

// ───────── Auction-house logos ─────────

export const AUCTION_HOUSE_LOGOS = [
  "ROBERT EDWARD",
  "GOLDIN",
  "PWCC",
  "HERITAGE",
  "STACK\u2019S BOWERS",
  "LELAND\u2019S",
] as const

// ───────── Footer columns ─────────

export interface FooterItem {
  label: string
  /** Optional internal/external href. When omitted, the item renders as
   * non-interactive copy (used for items that don't have a destination yet). */
  href?: string
}

export interface FooterColumn {
  title: string
  items: FooterItem[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Product overview", href: "/product" },
      { label: "Looking Glass", href: "/intelligence" },
      { label: "Pricing", href: "/pricing" },
      { label: "Get the app", href: "/#download" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About" },
      { label: "Press" },
      { label: "Careers" },
      { label: "Contact" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Help" },
      { label: "Status" },
      { label: "Changelog" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

// ───────── Press quotes / testimonials ─────────

export interface Quote {
  /** The body of the testimonial. Can include HTML entities — rendered
   * via dangerouslySetInnerHTML for typographic punctuation. */
  quote: string
  /** Display name. For placeholder cards use the literal "[Your name here]"
   * so the slot is visually obvious during the placeholder window. */
  name: string
  /** Short attribution line shown under the name. Years collecting,
   * primary category, optional handle. */
  role: string
  /** When true, this card is rendered with a deliberately muted "open
   * slot" treatment — the marketing team can swap it out for a real
   * quote without touching the component. */
  placeholder?: boolean
}

/**
 * PRESS_QUOTES — testimonials shipped on the home page (PressSection)
 * as the social-proof beat. Two real quotes from beta collectors plus
 * one explicit placeholder card so the section ships with three cells
 * filled and the open slot is unambiguous to anyone editing this file.
 *
 * Editing checklist when real testimonials land:
 *   1. Swap the placeholder entry for a real one (name, role, quote).
 *   2. Remove the `placeholder: true` flag.
 *   3. Verify quote length is roughly 90-180 chars so cards stay even.
 */
export const PRESS_QUOTES: Quote[] = [
  {
    quote:
      "The first cataloging app that treats my collection with the seriousness I do.",
    name: "Collector",
    role: "22 YR &middot; CARDS",
  },
  {
    quote:
      "Activity alone replaced four open tabs. The math under VAR is why I stayed.",
    name: "Collector",
    role: "8 YR &middot; WATCHES",
  },
  {
    quote:
      "Drop your line in here. We&rsquo;ll trade it for a slot in the gallery.",
    name: "[Your name here]",
    role: "OPEN SLOT &middot; HELLO@VITRINE.APP",
    placeholder: true,
  },
]

// ───────── FAQ ─────────

export interface FAQ {
  q: string
  a: string
}

export const FAQS: FAQ[] = [
  {
    q: "Is Vitrine a marketplace?",
    a: "No. Vitrine is a cataloging tool first. Marketplace signals (For Sale / For Trade / NFST) sit on each piece, but transactions happen through your existing channels — eBay, auction houses, DMs.",
  },
  {
    q: "How accurate is the Comps engine?",
    a: "Every comp is tagged on six attributes: set, year, parallel, grade, condition, and provenance. Perfect comps match all six. Strong match most. Loose are direction-only. The math is shown — not hidden behind a single FMV number.",
  },
  {
    q: "What categories does it support?",
    a: "38 collecting categories at launch — cards (sports + TCG), watches, comics, coins, sneakers, vinyl, autographs, memorabilia, cameras, posters, jewelry, toys, stamps, and more. Each with a per-category attribute schema.",
  },
  {
    q: "How much does it cost?",
    a: "Free to download. Free to catalog. Free to use Showcases, Pulse, AAR, VAR, and Comps. We are working on a paid tier for collectors with thousands of pieces — details when ready.",
  },
  {
    q: "How is my data handled?",
    a: "Your collection is yours. We never sell it, never advertise against it, and never auto-list it. Vitrine is a vault, not a feed.",
  },
  {
    q: "When can I download?",
    a: "Today. iOS 16+ and Android 10+. The download links above are real.",
  },
]

/**
 * PRODUCT_FAQS — product-specific questions for the /product page.
 * Pricing-specific FAQs live in lib/marketing/pricing-data.ts as
 * PRICING_FAQS so the two surfaces stay tonally and topically distinct.
 */
export const PRODUCT_FAQS: FAQ[] = [
  {
    q: "Is Vitrine a marketplace?",
    a: "Yes and no. Cataloging is the foundation; the marketplace layer (Buy / Sell / Trade with For Sale / For Trade / NFST signals on every piece) sits on top. You can catalog forever without ever transacting, or you can use Vitrine end-to-end.",
  },
  {
    q: "How accurate is the Comps engine?",
    a: "Every comp is tagged on six attributes: set, year, parallel, grade, condition, and provenance. Perfect comps match all six. Strong match most. Loose are direction-only. The math is shown — not hidden behind a single FMV number.",
  },
  {
    q: "What categories does Vitrine support?",
    a: "38 collecting categories at launch — cards (sports + TCG), watches, comics, coins, sneakers, vinyl, autographs, memorabilia, cameras, posters, jewelry, toys, stamps, and more. Each with a per-category attribute schema and its own comp logic.",
  },
  {
    q: "How does sharing work?",
    a: "Every showcase, collection, and piece has a shareable URL. Drop the link in iMessage and the recipient sees a beautifully rendered preview that opens to the showcase whether or not they have the app. Public showcase URLs are a Pro feature.",
  },
  {
    q: "What's a Crown Jewel?",
    a: "A Crown Jewel is the anchor piece of a showcase — the one that defines what the collection is about. Every showcase picks one. The supporting cast frames it. The result is curation, not a folder dump.",
  },
  {
    q: "How is my data handled?",
    a: "Your collection is yours. We never sell it, never advertise against it, and never auto-list it. Vitrine is a vault, not a feed.",
  },
  {
    q: "When can I download?",
    a: "Today. iOS 16+ and Android 10+. The download links above are real.",
  },
]

// ───────── Community card seeds ─────────

export interface CollectorCard {
  name: string
  tag: string
  count: string
  /** A grounding stat for the card. Deliberately not a follower count.
   * Identity here is the depth of the collection, not the size of the
   * audience. */
  since: string
  /** Hook line tailored to each collector — shown above the curator's
   * note. Different framing per card to vary the read. */
  hook: string
  /** Curator quote shown below the jewels. Each collector gets a
   * distinct line; the marketing-side template was previously identical
   * across all three, which read flat. */
  note: string
  jewels: [string, string, string]
  hueKey: "cyan" | "orange" | "volt"
}

export const COLLECTORS: CollectorCard[] = [
  {
    name: "whitney.r",
    tag: "BLUE NOTE OGs",
    count: "142 pieces",
    since: "Cataloging since 2019",
    hook: "What she owns",
    note: "the only complete first-pressing run of the 1500 series I&rsquo;ve seen documented anywhere.",
    jewels: [PHOTOS.vinyl, PHOTOS.cards, PHOTOS.coin],
    hueKey: "cyan",
  },
  {
    name: "grailcave",
    tag: "AJ1 1985\u201386",
    count: "38 pieces",
    since: "Curating since 2017",
    hook: "How he curates",
    note: "every pair photographed on the same plinth, same light, same angle &mdash; an archive, not a flex.",
    jewels: [PHOTOS.sneaker, PHOTOS.cards, PHOTOS.watch],
    hueKey: "orange",
  },
  {
    name: "h.ledger",
    tag: "SPEEDY ARCHIVE",
    count: "24 pieces",
    since: "Hunting since 2014",
    hook: "Why he matters",
    note: "writes the dossier you wish was on the listing &mdash; provenance, caliber, dial variant, the whole spec.",
    jewels: [PHOTOS.watch, PHOTOS.camera, PHOTOS.cards],
    hueKey: "volt",
  },
]

// ───────── Steps for HowItWorks ─────────

export interface HowStep {
  n: string
  title: string
  body: string
  hint: string
}

export const HOW_STEPS: HowStep[] = [
  {
    n: "01",
    title: "Download.",
    body: "iOS or Android. Free. No login wall — start with one piece if you want.",
    hint: "2 min",
  },
  {
    n: "02",
    title: "Snap one piece.",
    body: "Camera identifies the category. Schema appears. Fields auto-fill from card backs, dial markings, ISBN, certs.",
    hint: "~30 sec / piece",
  },
  {
    n: "03",
    title: "Build, share, track.",
    body: "Group into Showcases. Anchor a Crown Jewel. Watch comps refresh. Send a private Vitrine link to your collector friends.",
    hint: "forever",
  },
]

// ───────── Rapid-fire features (depth wall on /) ─────────

export interface RapidFireTile {
  /** kebab-case lucide icon name */
  icon: string
  /** Two-line headline — the claim */
  headline: string
  /** Single-line subhead — the qualifier */
  sub: string
  /** Optional flag rendered as a small pill (e.g. "PRO", "COLLECTOR") */
  flag?: string
}

export const RAPID_FIRE_TILES: RapidFireTile[] = [
  {
    icon: "scan-line",
    headline: "Looking Glass AI",
    sub: "Photo-only extraction across 38 categories. Tell us nothing — we read the piece.",
  },
  {
    icon: "layout-grid",
    headline: "Per-category schemas",
    sub: "38 categories, 38 form sets. Each kind has the fields it actually needs.",
  },
  {
    icon: "crown",
    headline: "Crown Jewel showcases",
    sub: "Curate, don\u2019t dump. Every showcase anchored by its defining piece.",
  },
  {
    icon: "scale",
    headline: "Comps engine",
    sub: "Math, not vibes. Perfect / Strong / Loose tiers, attribute-tagged on six axes.",
  },
  {
    icon: "trending-up",
    headline: "Live tracking",
    sub: "Watch every piece move. 30-day, 90-day, 365-day windows on each item.",
  },
  {
    icon: "shield-check",
    headline: "VAR",
    sub: "Variable Authentication Reports. Authentication you can argue with.",
    flag: "PRO",
  },
  {
    icon: "file-check",
    headline: "AAR",
    sub: "Authoritative Appraisal Reports. Appraisal-grade, on demand.",
    flag: "PRO",
  },
  {
    icon: "activity",
    headline: "Pulse",
    sub: "Per-item market intel. The signals you didn\u2019t know to ask for.",
    flag: "PRO",
  },
  {
    icon: "radio-tower",
    headline: "Activity",
    sub: "The signal layer for your network. Followers, status changes, comp alerts.",
  },
  {
    icon: "sparkles",
    headline: "Smart Collections",
    sub: "Auto-organized by what\u2019s inside. AI-curated showcases.",
    flag: "PRO",
  },
  {
    icon: "share-2",
    headline: "Vault sharing",
    sub: "Drop a link in iMessage. They see your showcase. No install required.",
  },
  {
    icon: "users",
    headline: "Discover",
    sub: "We find people who own what you own. Network-level recommendations.",
  },
]

// ───────── Live capabilities ─────────

export const LIVE_CAPABILITIES = [
  "Cataloging across 38 categories",
  "Per-category dynamic field schemas",
  "Showcases & Crown Jewels",
  "Comps engine (Perfect / Strong / Loose)",
  "Tracking & VAR (live FMV + volatility)",
  "Pulse (per-piece subscriptions)",
  "Collector profiles & follow",
  "Public, private & link-share Showcases",
] as const

export const ROADMAP_ITEMS: [string, string][] = [
  ["Marketplace transactions", "Q3 2026"],
  ["Verified-collector badges", "Q3 2026"],
  ["Auction-house API ingest", "Q4 2026"],
  ["Grading lab partnerships", "2027"],
  ["Insurance integrations", "2027"],
]

// ───────── Thesis pillars ─────────

export interface Pillar {
  kicker: "CATALOG" | "PRESENT" | "TRACK" | "TRANSACT"
  title: string
  body: string
  state: "live" | "soon"
}

export const PILLARS: Pillar[] = [
  {
    kicker: "CATALOG",
    title: "Every piece, fully described.",
    body: "Per-category schemas. Set, year, parallel, grade, condition, provenance, edition, signed-by, made-by, found-where. The fields adapt to what you collect.",
    state: "live",
  },
  {
    kicker: "PRESENT",
    title: "Showcases, not folders.",
    body: "Curate by era, theme, player, grail status. Crown Jewel anchors each one. Public, private, or share-by-link.",
    state: "live",
  },
  {
    kicker: "TRACK",
    title: "Value, modeled — not guessed.",
    body: "Live FMV against weighted comps. Volatility band. Event flags. 30-day, 90-day, 365-day windows on every piece.",
    state: "live",
  },
  {
    kicker: "TRANSACT",
    title: "Eventually — on your terms.",
    body: "For Sale / For Trade / NFST signals live alongside intrinsic data today. Marketplace transaction layer comes later, by design.",
    state: "soon",
  },
]

// ───────── Problem / Status Quo artifacts ─────────

export interface Artifact {
  kicker: string
  body: string
  sub: string
  tone: string
}

export const PROBLEM_ARTIFACTS: Artifact[] = [
  {
    kicker: "EXCEL · TAB 7",
    body: "B14   \"1986 Fleer Jordan #57\"",
    sub: "cell-merged · color-coded · last edited 2 yrs ago",
    tone: "#3a8a3a",
  },
  {
    kicker: "CAMERA ROLL",
    body: "4,218 photos",
    sub: "Card · card · card · receipt · card · cat · card",
    tone: "#888",
  },
  {
    kicker: "NOTES.APP",
    body: "wishlist (final)",
    sub: "\u2014 PSA 9 jordan rc\n\u2014 speedy cal 321\n\u2014 blue train mono",
    tone: "#f0c060",
  },
  {
    kicker: "eBay · 14 TABS",
    body: "sold listings · \"trout rc psa 9\"",
    sub: "sort: ended · last 90 days · refresh",
    tone: "#0064d2",
  },
]
