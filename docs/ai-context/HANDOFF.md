# Handoff

Last updated: 2026-05-12
Last verified: 2026-05-12

## Session Summary
Restructured the V3 web marketing site from a single-page lander into a hybrid multi-page architecture, then ran a copy/content refinement pass and a final cleanup. The shipped IA: a tight 10-section `/` lander plus three deep pages (`/pricing`, `/intelligence`, `/product`), a `/login` "Web App Coming Soon" placeholder, and draft `/privacy` + `/terms` legal pages. Seven atomic phases, build green at every step. The seventh phase deleted the temporary `/lab` snapshot route, the `MarketingSiteLab` composition, and two orphaned section files (`LiveComingSection`, `ProSection` — the latter's content folded into `/pricing` in Phase 2). Routes grew from 8 → 16. No /lab in production, no orphaned imports, sitemap + robots wired.

Seven commits in `git log`:
1. Phase 1 — Multi-page restructure foundation (`marketing: phase 1`)
2. Phase 2 — `/pricing` real page from `pricing-model.md` (`marketing: phase 2`)
3. Phase 3 — `/intelligence` cornerstone Looking Glass page (`marketing: phase 3`)
4. Phase 4 — `/product` full toolkit page (`marketing: phase 4`)
5. Phase 5 — `/login` + `/privacy` + `/terms` + sitemap/robots (`marketing: phase 5`)
6. Phase 6 — Copy + content refinement across all pages (`marketing: phase 6`)
7. Phase 7 — Cleanup: delete `/lab`, orphaned sections, doc updates (`marketing: phase 7`)

## Current State
- **Routes (16 total)**: `/`, `/_not-found`, `/pricing`, `/intelligence`, `/product`, `/login`, `/privacy`, `/terms`, `/icon`, `/apple-icon`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`. No `/lab` (deleted in Phase 7).
- **Home (`/`) — 10 sections**: SiteNav → Hero → Problem (`§01`) → Thesis (`§02`) → Intelligence (`§03`, "Tell us nothing. We read the piece.") → HowItWorks (`§04`) → RapidFireFeatures (`§05`, 12-tile feature wall) → Explore (`§06`, 4×2 spatial grid) → Community (`§07`, 3 collector cards with varied hooks) → Press (`§08`, testimonials with explicit `[Your name here]` placeholder slot) → FinalCTA (`§09`) → Footer.
- **`/pricing`**: PricingHero → FoundersPricingBanner → PricingCards (Free / Pro $9.99 / Collector $24.99 with monthly/annual toggle) → ViewVsGenerateSection (the "everyone views, Pro+ generates" keystone) → MarketplaceFeeMath (10% Free/Pro vs 7% Collector + tier recommender) → ComparisonTable (collapsible full feature matrix) → PricingFAQ. All numbers live in `apps/web/lib/marketing/pricing-data.ts` keyed to `vitrinedb/docs/pricing-model.md`.
- **`/intelligence`** (Looking Glass cornerstone): IntelligenceHero → MultiVerticalExamples (cards / watches / wine / coins / comics / vinyl extraction examples with field-level confidence) → BeforeAfterComparison → VARExplanation → AARExplanation → PulseLensExplanation (clarifies vs marketing-side Activity) → CompsArea (migrated from old `CompsSection`) → TechnicalCredibility (Gemini Flash / multi-pass / validation) → IntelligenceCTA. Data + report-card content in `apps/web/lib/marketing/intelligence-data.ts`. Shared `ReportExplanationCard` standardizes the VAR/AAR/Pulse layouts.
- **`/product`** (the longest, deepest page — "we have features for days"): ProductHero (8 surfaces lined up) → CatalogArea → ShowcaseArea → TrackArea → ActivityArea (the social-signal feed for the network — formerly "Pulse" on the marketing side, renamed to eliminate the in-app-Pulse-lens collision) → ShareArea (drop a link in iMessage / `/s/c/[id]` resolvers) → TradeArea (marketplace summary + fee structure → `/pricing`) → DiscoverArea (network signals + suggested collectors) → CategoriesArea (6×6 category grid) → ProductFAQ → ProductCTA. ~11 areas total.
- **`/login`** placeholder: V3-styled "Web App Coming Soon" page with App Store + Play badges, "your collection lives in your pocket" headline, link back to home. Noindexed via metadata. Replaces the bare skeleton from Phase 1.
- **`/privacy` + `/terms`** drafts: shared `LegalPage.tsx` component with sticky DRAFT banner, plain-English placeholder copy flagged for legal review, structured by section. Both noindexed via metadata.
- **Discovery files**: `apps/web/app/robots.ts` (`User-Agent: *  Allow: /` + sitemap pointer; no active disallow rules — the `/lab` rule was Phase 5 era and was removed in Phase 7 when `/lab` was deleted) and `apps/web/app/sitemap.ts` (includes `/`, `/pricing`, `/intelligence`, `/product`, `/privacy`, `/terms`; excludes `/login`).
- **Footer** reads from `FOOTER_COLUMNS` constant. Items shape evolved from `string[]` to `FooterItem[] = { label, href? }`. Live links: Product → `/product`, Looking Glass → `/intelligence`, Pricing → `/pricing`, Get the app → `/#download`, Privacy → `/privacy`, Terms → `/terms`. Items without an `href` (Company / Resources columns: About, Press, Careers, Contact, Help, Status, Changelog) render as muted "coming soon" text.
- **Cross-page nav**: `SiteNav.tsx` + `MobileNav.tsx` use `next/link` deep links + `usePathname()` for active state. Cross-page download CTA → `/#download` (so navigating from any deep page → "Get the app" reaches the home anchor). The "Lab" link was removed in Phase 7.
- **Legacy redirects in `next.config.mjs`**: 5 active 308s — `/about → /#thesis`, `/features → /product`, `/explore → /#explore`, `/contact → /#footer`, `/identity → /`. The `/pricing → /#pro` redirect was deleted in Phase 2 — `/pricing` is a real page now.
- **Data modules (`apps/web/lib/marketing/`)**: `pricing-data.ts`, `intelligence-data.ts`, `constants.ts` (now includes `RAPID_FIRE_TILES`, refined `Quote` + `CollectorCard` shapes, `FOOTER_COLUMNS` with hrefs, `PRODUCT_FAQS` split out from old `FAQS`), `photos.ts`, `tokens.ts`, `hooks.ts`, `Reveal.tsx`, `Stagger.tsx`, `Parallax.tsx`, `brand-paths.ts`.

## Files Changed Recently

### New (across the multi-page restructure)
- `apps/web/app/{pricing,intelligence,product,login,privacy,terms}/page.tsx` — six new public route files.
- `apps/web/app/{robots,sitemap}.ts` — discovery wiring.
- `apps/web/components/marketing/{ComingSoonPage,LegalPage}.tsx` — shared layouts for skeleton + legal pages.
- `apps/web/components/marketing/pricing/*` — `PricingHero`, `FoundersPricingBanner`, `PricingCards`, `ViewVsGenerateSection`, `MarketplaceFeeMath`, `ComparisonTable`, `PricingFAQ` (7 files).
- `apps/web/components/marketing/intelligence/*` — `IntelligenceHero`, `MultiVerticalExamples`, `BeforeAfterComparison`, `VARExplanation`, `AARExplanation`, `PulseLensExplanation`, `CompsArea` (migrated), `TechnicalCredibility`, `IntelligenceCTA`, `ReportExplanationCard` (~10 files).
- `apps/web/components/marketing/product/*` — `ProductHero`, `CatalogArea` (migrated), `ShowcaseArea` (migrated), `TrackArea` (migrated), `ActivityArea` (migrated + renamed from PulseSection), `ShareArea`, `TradeArea`, `DiscoverArea`, `CategoriesArea` (migrated), `ProductFAQ` (migrated), `ProductCTA` (~11 files).
- `apps/web/components/marketing/sections/RapidFireFeatures.tsx` — new 12-tile feature wall on home.
- `apps/web/lib/marketing/{pricing-data,intelligence-data}.ts` — new content modules.

### Modified
- `apps/web/components/marketing/MarketingSite.tsx` — now composes 10 sections (down from 18). Doc comment updated in Phase 7 to drop the `/lab`/MarketingSiteLab reference.
- `apps/web/components/marketing/sections/{SiteNav,MobileNav,Footer,Hero,IntelligenceSection,CommunitySection,PressSection,ThesisSection,ProblemSection,HowItWorksSection,ExploreSection,FinalCTA,SectionHeader,index}.tsx` — kicker numbers renumbered, deep-page nav links wired, copy refined per-section (Phase 6), Footer rebuilt with `next/link`. `index.ts` exports trimmed in Phase 7 (no more `LiveComingSection` / `ProSection`).
- `apps/web/lib/marketing/constants.ts` — `RAPID_FIRE_TILES` added (Phase 1), `Quote` shape refactored from `{ q, a }` → `{ quote, name, role, placeholder? }` (Phase 6), `CollectorCard` shape refactored (no follower counts; new `since` / `hook` / `note` fields, Phase 6), `FOOTER_COLUMNS` now uses `FooterItem[]` with hrefs (Phase 5), `FAQS` split into `PRODUCT_FAQS` here + `PRICING_FAQS` in pricing-data.ts (Phase 4).
- `apps/web/next.config.mjs` — removed legacy `/pricing → /#pro` redirect (Phase 2); updated `/features → /product` (Phase 1).

### Deleted (Phase 3-4 migrations)
- `apps/web/components/marketing/sections/{CompsSection,CatalogingSection,ShowcasesSection,TrackingSection,PulseSection,CategoriesSection,FAQSection}.tsx` — all moved/renamed to `intelligence/` and `product/` directories.

### Deleted (Phase 7 cleanup)
- `apps/web/app/lab/page.tsx` — temporary snapshot route, no longer needed.
- `apps/web/components/marketing/MarketingSiteLab.tsx` — frozen 18-section composition, no surviving consumer.
- `apps/web/components/marketing/sections/LiveComingSection.tsx` — orphaned (excluded from new home IA).
- `apps/web/components/marketing/sections/ProSection.tsx` — orphaned (content folded into `/pricing`).

## Incomplete Work
- **Real testimonial copy.** The third `PressSection` slot ships with an explicit `placeholder: true` entry rendering as "[Your name here]" / "OPEN SLOT · HELLO@VITRINE.APP" with a dashed border. When real testimonials land, swap the entry in `PRESS_QUOTES` in `apps/web/lib/marketing/constants.ts` and remove the flag — no component changes required. The first two cards are also generic placeholders ("Collector / 22 YR · CARDS" etc.) that should become real names + roles.
- **Real photos.** The 8 image URLs in `apps/web/lib/marketing/photos.ts` remain Unsplash placeholders. Same applies to the 3 collector avatars in `CommunitySection` and the 8 spatial cards in `ExploreSection`. Swap is a one-file edit per location.
- **Real ThesisSection app screenshots.** Plan called for inline visuals of FramedHero, lens architecture, dossier card. No real assets are available — flagged in OPEN_THREADS.
- **Legal review on `/privacy` and `/terms`.** Both pages ship with a sticky DRAFT banner and `metadata.robots = { index: false, follow: false }`. Real legal review must happen before launch. The "first 10K Pro subscribers locked at $9.99 forever" founders pricing is referenced in both `/pricing` (`FoundersPricingBanner`) and `/terms` — keep them in sync if the offer changes.
- **`/explore` real page deferred.** The home page keeps the 4×2 spatial Explore grid as a category visualizer; the wire-to-Supabase `/explore` page (real DB-backed proof page) is its own engineering project (~2-3 weeks), explicitly out of scope for this restructure.
- **`/changelog` deferred.** The Live Now / Roadmap content from the deleted `LiveComingSection` could revive on a future `/changelog` page if there's product appetite.
- **Day 2 carry-over** — same as previous sessions:
  - 5 native-only API modules (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`) still in `apps/native/lib/api/`. Migrating them is essentially Day 3 web-buildout work (authenticated routes).
  - Web SSR Supabase client split (`@supabase/ssr` browser/server clients) deferred until web adds authenticated routes.
  - Native tsc baseline at 107 errors (pre-existing, none added this session).

## Validation Performed
- `pnpm --filter @vitrine/web build` after every phase → green.
- Final route inventory printed by `next build`: `/`, `/_not-found`, `/intelligence`, `/login`, `/pricing`, `/privacy`, `/product`, `/terms`, `/icon`, `/apple-icon`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`. (16 routes, vs. 8 pre-restructure, 0 of them `/lab`.)
- Cross-page nav verified in dev: every header link resolves 200, footer Privacy / Terms / Product / Intelligence / Pricing all 200, "Get the app" → `/#download` from every deep page.
- `ReadLints` clean on every new + modified file across all 7 phases.
- Phase 7 specifically: grep sweep for `LiveComingSection|MarketingSiteLab|ProSection` returns zero matches; grep sweep for `/lab` paths returns zero matches.

## Risks And Warnings
- **Inline-style overrides require `!important` in the responsive layer.** Same caveat as the V3 rebuild — section components carry inline `style={{ ... }}` so the `data-marketing-*` rules in `globals.css` use `!important` to win specificity. New responsive rules should follow the same pattern.
- **Dynamic icon endpoints use the Edge runtime.** Disables static generation for those pages. Expected — they need to render `ImageResponse` per request. Don't move them off Edge unless you also stop using `next/og`.
- **Brand mark path data lives in two places.** `apps/web/lib/marketing/brand-paths.ts` (web) and `apps/native/components/vault/icons/vitrine-mark-icon.tsx` (native). If the brand mark ever changes, update both files in lockstep.
- **`apps/web/components/ui/*` (shadcn) kept with zero importers.** Tree-shaken out of the marketing bundle so no runtime cost; deliberately retained for the eventual authenticated web app.
- **`PRESS_QUOTES` ships with a placeholder slot.** The third testimonial card is intentionally `placeholder: true` so the open slot is visually unambiguous to anyone editing the file. If a real testimonial lands but you forget to remove the flag, the dashed-border treatment will still ship. Toggle the flag.
- **The Pulse → Activity rename happened only on the marketing side.** The in-app Pulse lens (per-piece market intel report) keeps its name; `intelligence/PulseLensExplanation.tsx` describes it. The marketing-side `ActivityArea` (under `/product`) is the social-signal feed for the collector network. Don't rename either side without updating the other's narrative.
- **`/product` is heavy.** ~11 areas including the rich `TrackArea` SVG chart, the showcase parallax cards, the cataloging tab demo, etc. Worth profiling page weight if mobile load times degrade.
- **Section kicker numbers (`§01`, `§02`, ...) are hardcoded per section.** Adding/removing a home section requires renumbering. Same for migrating a section between pages.
- **Founders pricing referenced in two places.** `apps/web/lib/marketing/pricing-data.ts` `FOUNDERS_PRICING` constant + `apps/web/app/terms/page.tsx` placeholder copy. Keep them in sync.

## Next Best Task
1. **Real testimonial copy + brand photos.** Structure + design system are stable; the third PressSection slot is wired as an explicit `[Your name here]` placeholder. Photos are still Unsplash placeholders. Real ThesisSection app screenshots (FramedHero / lens architecture / dossier card) also deferred.
2. **Legal review on `/privacy` + `/terms`.** Both pages ship with a sticky DRAFT banner and noindex; real legal copy needs to land before launch.
3. **EAS / TestFlight pipeline** (`docs/EAS_MIGRATION_PLAN.md`, `docs/TESTFLIGHT_CHECKLIST.md`) — gating any real device distribution.
4. **Product features** — Crown Jewel detail-screen assignment UI; AI upload flow QA pass.
5. **Day 3 web buildout** (`docs/VITRINE_WEB_PLAN.md`) — eventual authenticated web app surfaces.

## Suggested Starter Prompt
```
/rehydrate-project-memory — then we're picking up after the multi-page marketing site restructure (7 phases shipped). Read the latest IMPLEMENTATION_LOG entry ("Vitrine Marketing Site Multi-Page Restructure (7 phases)") and the refreshed CURRENT_STATE "Web Marketing Site (V3 — Multi-Page, Live)" section to see the shipped IA. Today I want to start with [real testimonial copy + photos | legal review on privacy/terms | EAS pipeline | product features | Day 3 web buildout].
```

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — appended entry: "Vitrine Marketing Site Multi-Page Restructure (7 phases)" covering Phases 1-7 in detail.
- `CURRENT_STATE.md` — replaced "Web Marketing Site (V3 — Live)" section with "Web Marketing Site (V3 — Multi-Page, Live)"; refreshed Current Build Phase + Current Priority + timestamps.
- `HANDOFF.md` — this file, full rewrite for the multi-page session boundary.
- `OPEN_THREADS.md` — closed the single-page V3 rebuild thread; opened new threads for real testimonial copy, real ThesisSection screenshots, legal review on `/privacy` + `/terms`, deferred `/explore` and `/changelog` pages.

## What Not To Touch
- The `T` token bridge (`apps/web/lib/marketing/tokens.ts`). Section JSX assumes `T.void`, `T.volt`, `T.fg1` etc. exist with exactly those names. Add to it, don't rename.
- `apps/web/lib/marketing/brand-paths.ts`. Both `VitrineMark` and the three icon endpoints consume it.
- The `data-marketing-*` and `data-share-*` attribute system. The responsive layer in `globals.css` targets these specifically.
- `apps/web/components/ui/*` (shadcn). Zero current importers but valuable for the eventual authenticated app.
- The 5 native-only API modules (Day 2 carry-over). They depend on RN/Expo APIs and stay put until web actually needs them.
- The DRAFT banner on `/privacy` and `/terms`. It's the only thing visually distinguishing draft policy from finalized — leave it until legal sign-off.
- `PRESS_QUOTES[2].placeholder = true`. Don't remove unless you're swapping in a real testimonial.
