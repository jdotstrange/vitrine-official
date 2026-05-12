# Handoff

Last updated: 2026-05-12
Last verified: 2026-05-12

## Session Summary
Replaced the legacy multi-page web marketing site (light "Contemporary Gallery" theme + ~20 home/about/pricing/features/explore/contact components, + ~21 root-level orphan components) with a single-page V3-aligned port of the `c:\Users\johnj\vitrine-2026` HTML mockup. Six atomic commits, build green at every step. Re-skinned the three share resolvers (`/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`) in matching frost-on-void aesthetic so the brand reads as one app from first impression through download. Killed all six legacy marketing routes with permanent 301s. Replaced static `/icon.svg` favicon with dynamic Next.js `next/og` icon + apple-icon + opengraph-image endpoints, all rendering the canonical Vitrine crown-in-vitrine mark from a single shared path-data module. Mobile responsive across all 20 marketing sections + share resolvers via two breakpoints (≤1024px tablet, ≤768px phone) with hamburger nav.

Six commits in `git log`:
1. Phase 1 — Rewire web to V3 design tokens + canonical brand assets
2. Phase 2 — Add marketing primitives & motion hooks for V3 rebuild
3. Phase 3 — Port marketing sections + compose MarketingSite for V3 rebuild
4. Phase 4 — Add tablet + phone breakpoints to marketing site
5. Phase 5 — Re-skin share resolvers in V3 frost-on-void + mobile responsive
6. Phase 6 — Marketing cleanup: kill legacy routes, refresh OG/icons, update memory

## Current State
- Web app routes shrunk from 12 → 8 (all needed): `/`, `/_not-found`, `/icon`, `/apple-icon`, `/opengraph-image`, `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`. Six 301 redirects in `next.config.mjs` cover legacy URLs.
- `apps/web/app/page.tsx` is now `<MarketingSite />` and nothing else. The composition mirrors the mockup section order.
- `apps/web/app/globals.css` is the single source of truth for tokens (`:root`), Tailwind theme (`@theme inline`), interactive styles (`.nav-link`, `.cta-glow`, `details summary`), keyframes, marketing breakpoints (`data-marketing-*`), and share-resolver breakpoints (`data-share-*`).
- All section JSX uses inline styles fed by the `T` token bridge in `apps/web/lib/marketing/tokens.ts` so colors/fonts/spacing flow through CSS vars without rewriting to Tailwind.
- 5 native-only API modules (Day 2 carry-over) still in `apps/native/lib/api/` — unchanged this session.
- `apps/web/components/ui/*` (shadcn) kept intentionally — currently 0 importers but useful for the eventual authenticated web app.

## Files Changed Recently

### New (Phase 1 — Foundation)
- `apps/web/public/logo.svg` — canonical wordmark with `fill="currentColor"`.
- `apps/web/components/marketing/{VitrineLogo,VitrineMark}.tsx` — React wrappers.
- `apps/web/lib/marketing/tokens.ts` — `T` object resolving CSS vars.
- `apps/web/app/globals.css` (rewired) — V3 dark palette, marketing vars, Tailwind theme bindings, keyframes.
- `apps/web/app/layout.tsx` (rewired) — fonts (Electrolize / Space Grotesk / Inter / Libre Caslon Text / JetBrains Mono), V3 metadata, dark `themeColor` + `colorScheme`.

### New (Phase 2 — Primitives + hooks)
- `apps/web/components/marketing/primitives/{FrostCard,Pill,Kicker,MIcon,AppStoreBadge,PulseRow,Button,CompRow,HolographicFrame,GradientVeil,index}.{ts,tsx}`.
- `apps/web/lib/marketing/{hooks,Reveal,Stagger,Parallax,photos,constants}.{ts,tsx}`.

### New (Phase 3 — Sections)
- `apps/web/components/marketing/sections/{SectionHeader,SiteNav,Hero,PulseSection,ProblemSection,ThesisSection,IntelligenceSection,CatalogingSection,ShowcasesSection,TrackingSection,CompsSection,CommunitySection,CategoriesSection,HowItWorksSection,LiveComingSection,ExploreSection,ProSection,PressSection,FAQSection,FinalCTA,Footer,index}.{ts,tsx}`.
- `apps/web/components/marketing/MarketingSite.tsx` — top-level composition.
- `apps/web/app/page.tsx` (replaced) — single `<MarketingSite />` render.
- `apps/web/app/globals.css` (extended) — `.nav-link`, `.cta-glow`, `details summary` polish.

### New (Phase 4 — Responsive)
- `apps/web/components/marketing/sections/MobileNav.tsx` — hamburger toggle + slide-down panel.
- `apps/web/components/marketing/sections/SiteNav.tsx` (extended) — `data-marketing-*` attributes + `<MobileNav />` mount.
- `apps/web/components/marketing/sections/SectionHeader.tsx` (extended) — `data-marketing-section-{header,num,title}` attributes.
- `apps/web/app/globals.css` (extended) — full responsive layer (≤1024px and ≤768px breakpoints).

### New (Phase 5 — Resolvers)
- `apps/web/components/share/share-landing.tsx` (full rewrite) — V3 frost-on-void ShareLanding + ShareNotFound.
- `apps/web/app/globals.css` (extended) — `data-share-*` responsive overrides.

### New (Phase 6 — Cleanup)
- `apps/web/lib/marketing/brand-paths.ts` — single source of truth for VitrineMark SVG path data.
- `apps/web/components/marketing/VitrineMark.tsx` (refactored) — consumes `brand-paths.ts`.
- `apps/web/app/{icon,apple-icon,opengraph-image}.tsx` — Edge-runtime `ImageResponse` endpoints.
- `apps/web/app/not-found.tsx` (rewritten) — V3 frost-on-void 404.
- `apps/web/next.config.mjs` (extended) — six 301 redirects.

## Files Deleted Recently
- **Routes**: `apps/web/app/{about,pricing,identity,features,contact,explore}/` (6 directories, all `page.tsx`s + nested files).
- **Component categories**: `apps/web/components/{home,about,pricing,features,contact,explore,identity,app-ui}/` (~40 files total).
- **Root-level orphans**: `apps/web/components/{navigation,footer,universal-cta,tilt-card,live-ticker,error-state,page-transition,download-modal,custom-cursor,scroll-reveal,spatial-background,theme-provider,category-orbs,magnetic-button,empty-state,loading-state,profile-ring,data-stream,adaptive-image,chromatic-logo,section-label}.tsx` (~21 files).
- **Orphaned data files**: `apps/web/lib/{explore-data,category-data}.ts`.
- **Static asset**: `apps/web/app/icon.svg` (replaced by dynamic `icon.tsx`).

## Incomplete Work
- **Marketing copy is verbatim from the mockup.** Per the user: structure is right, but narrative needs another iteration. Outside the hero, most copy is "filler and not fully realized" — fixing it is a separate pass on top of the now-stable structure.
- **Photos are Unsplash placeholders.** The 8 image URLs in `apps/web/lib/marketing/photos.ts` are temporary; real brand assets to be provided. Swap is a one-file edit.
- **Roadmap dates** in `LiveComingSection` / `ProSection` are likely stale (ported from the months-old mockup). Fix when narrative iteration happens.
- **Day 2 carry-over** — same as previous session:
  - 5 native-only API modules (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`) still in `apps/native/lib/api/`. Migrating them is essentially Day 3 web-buildout work (authenticated routes).
  - Collectible (`/s/c/[id]`) and profile (`/s/p/[id]`) share resolvers still on direct Supabase queries — blocked by the 5 native-only modules above.
  - Web SSR Supabase client split (`@supabase/ssr` browser/server clients) deferred until web adds authenticated routes.
  - Native tsc baseline at 107 errors (all pre-existing, none added this session).

## Validation Performed
- `pnpm --filter @vitrine/web build` after every phase → green.
- Final route inventory printed by `next build`: `/`, `/_not-found`, `/icon`, `/apple-icon`, `/opengraph-image`, `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`.
- `ReadLints` clean on every new + modified file in this session (marketing/, share/, lib/marketing/, app routes, globals.css, next.config.mjs).
- Pre-deletion grep sweeps confirmed zero remaining importers of every deleted file.

## Risks And Warnings
- **Inline-style overrides require `!important` in the responsive layer.** Section components carry inline `style={{ gridTemplateColumns, padding, fontSize }}`. Inline-style specificity beats every external rule short of `!important`. Trade-off accepted: `globals.css` is the single source of truth for breakpoints, no cascade ambiguity. If you add a new responsive override, follow the same pattern.
- **Dynamic icon endpoints use the Edge runtime.** Disables static generation for those pages (Next prints `⚠ Using edge runtime on a page currently disables static generation`). Expected — they need to render `ImageResponse` per request. Don't move them off Edge unless you also stop using `next/og`.
- **Brand mark path data lives in two places: `brand-paths.ts` (web) and `apps/native/components/vault/icons/vitrine-mark-icon.tsx` (native).** If the brand mark ever changes, update both files in lockstep. The native side has a separate component so it can ship as RN SVG.
- **Shadcn `apps/web/components/ui/*` kept with zero importers.** Tree-shaken out of the marketing bundle so no runtime cost; deliberately retained for the eventual authenticated web app. If a future cleanup deletes them, also remove `apps/web/components/theme-provider.tsx` (already deleted) and any related wiring.
- **`MIcon` does namespace import of `lucide-react`** (`import * as Icons from "lucide-react"`) so the kebab-case → PascalCase conversion works without an explicit registry. Tree-shaking still applies. If bundle size becomes a concern, swap to a shipped registry of the icons actually used.

## Next Best Task
Two natural follow-ups, plus any of the existing Day 3 tracks:
1. **Marketing narrative iteration.** Rewrite the section copy (Problem/Thesis/Pro/Press/FAQ in particular) to land the actual product story. Structure + design system are now stable — this is pure content work.
2. **Real brand photos.** Swap the 8 Unsplash URLs in `apps/web/lib/marketing/photos.ts` for real assets (Showcases, Hero card variants, Categories highlights, Crown Jewel artwork).
3. **Day 3 carry-overs**: web product buildout (`docs/VITRINE_WEB_PLAN.md`), EAS / TestFlight pipeline (`docs/EAS_MIGRATION_PLAN.md`, `docs/TESTFLIGHT_CHECKLIST.md`), or product features (Crown Jewel detail-screen assignment UI; AI upload flow QA).

## Suggested Starter Prompt
```
/rehydrate-project-memory — then we're picking up after the V3 marketing site rebuild. Read the latest IMPLEMENTATION_LOG entry ("Vitrine Marketing Site V3 Rebuild") and the new CURRENT_STATE "Web Marketing Site (V3 — Live)" section to see the shipped structure. The site is up at /, share resolvers re-skinned, six legacy routes 301'd. Today I want to start with [marketing copy iteration | real brand photos | EAS pipeline | Day 3 web buildout].
```

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — appended entry: "Vitrine Marketing Site V3 Rebuild (single-page, dark-first)" covering Phases 1-6 in detail.
- `CURRENT_STATE.md` — added "Web Marketing Site (V3 — Live)" section, refreshed Current Build Phase + Current Priority + timestamps.
- `HANDOFF.md` — this file, full rewrite for the new session boundary.

## What Not To Touch
- The `T` token bridge (`apps/web/lib/marketing/tokens.ts`). Section JSX assumes `T.void`, `T.volt`, `T.fg1` etc. exist with exactly those names. Add to it, don't rename.
- `apps/web/lib/marketing/brand-paths.ts`. Both `VitrineMark` and the three icon endpoints consume it. Edit only when the actual brand mark changes; keep `VITRINE_MARK_VIEWBOX` and `VITRINE_MARK_PATHS` exported with those names.
- The `data-marketing-*` and `data-share-*` attribute system. The responsive layer in `globals.css` targets these specifically. New sections should follow the same convention (`data-marketing-section="<name>"` on the outer `<section>`, `data-marketing-grid="<id>"` on grid divs).
- `apps/web/components/ui/*` (shadcn). Zero current importers but valuable for the eventual authenticated app — don't delete.
- The 5 native-only API modules (Day 2 carry-over) — same warning as last session. They depend on RN/Expo APIs and stay put until web actually needs them.
