# Vitrine Web Plan — Next.js Web Product (Marketing + App + Share Routes)

**Status:** Awaiting Phase 0 monorepo restructure per `docs/MONOREPO_STRUCTURE.md`. After Phase 0, ready to begin immediately.
**Document version:** 1.1
**Last updated:** 2026-05-11
**Owner:** John (product + design lead, co-founder)
**Codebase:** Lives at `apps/web/` inside the `MyVitrine` monorepo (currently `C:\Users\johnj\vitrinemarketing`, to be migrated during Phase 0)
**Drives toward:** Vitrine Web v1 — a single Next.js project containing the marketing site, public share routes, and the authenticated web app

> **Prerequisite:** This plan assumes the Phase 0 monorepo restructure (`docs/MONOREPO_STRUCTURE.md`) is complete. After Phase 0, the existing `vitrinemarketing` content lives at `apps/web/` inside the `MyVitrine` monorepo. All paths referenced in this document are relative to `apps/web/` unless noted. Shared concerns (design tokens, types, API client, constants) are imported from `@vitrine/*` workspace packages — no porting from native required.

---

## Purpose

Captures the complete plan for building Vitrine Web as a first-class product, starting from the existing `vitrinemarketing` Next.js scaffolding. Designed to be picked up cold by a different team / session running in parallel with the EAS native migration (`docs/EAS_MIGRATION_PLAN.md`).

This plan establishes:

- One Next.js codebase that serves marketing pages, public share routes, auth, and the authenticated web app
- A web product that is intentionally desktop/tablet-first, not a port of the mobile app
- A web-only flagship feature (bulk upload) that the native app will not attempt
- Clean architectural separation between marketing routes, auth routes, app routes, and public share routes within one project
- A design system that mirrors the dark Vitrine aesthetic of the native app

---

## Core decisions locked in

| Decision | Value | Reasoning |
|----------|-------|-----------|
| Codebase | **Single Next.js project** at `vitrineweb` (renamed from `vitrinemarketing`) | Marketing + share routes already there; the foundation is built |
| Repo strategy | **Two independent repos for now** (`vitrinev0` for native, `vitrineweb` for web) | Monorepo is the eventual play but not a v1 blocker |
| Stack | **Next.js 16 App Router + Tailwind v4 + Radix/shadcn primitives + TypeScript + Supabase + Vercel** | Already in place, no migration needed |
| Web product target | **Desktop and tablet-first** | Mobile web routes hit an app-download wall (except public share routes) |
| Web aesthetic | **Uniform dark Vitrine theme** across marketing + app + auth + share | Marketing site getting full V2 redesign aligned to native app aesthetic; light theme discarded |
| PWA / installable | **No** | Not trying to compete with the native app on mobile |
| Image capture | **Drag-and-drop file upload only** (no camera) | Desktop-appropriate; better UX than camera anyway |
| Bulk upload | **Web-exclusive flagship feature** | Killer desktop use case; not viable on mobile |
| Subscription / payment | **Web is the primary surface** for subscription checkout via RevenueCat Billing + Stripe | Per `subscription-architecture.md`; defers IAP friction; v2.1.0+ when implemented |
| Domain | **`myvitrine.app` apex** for everything (marketing, app, share) | No subdomain awkwardness; one domain, one mental model |
| Deployment | **Vercel** | Already configured; tightest Next.js integration; preview deploys per branch |
| Design tokens (v1) | **Option A — duplicated values, sync by discipline** | Native keeps `lib/colors.ts`; web declares same values in Tailwind v4 `@theme` |
| Design tokens (long-term) | **Option C — monorepo with `packages/design-tokens`** | Targeted for post-v1 when drift becomes painful |
| Timing | **Begin immediately, parallel to native EAS work** | Different team; no resource contention; web does not block native v2.0.0 |

---

## Architectural overview

### Route structure

```
vitrineweb/
├── app/
│   ├── layout.tsx                   # Root: dark Vitrine theme, brand fonts, analytics
│   ├── page.tsx                     # Marketing home (V2 redesign)
│   │
│   │   ── Marketing routes (public, indexable, conversion-focused) ──
│   ├── features/page.tsx            # V2 redesign
│   ├── pricing/page.tsx             # V2 redesign — aligned to pricing-model.md tiers
│   ├── about/page.tsx               # V2 redesign
│   ├── contact/page.tsx             # V2 redesign
│   ├── identity/page.tsx            # V2 redesign or sunset
│   ├── explore/page.tsx             # V2 redesign or repurpose
│   │
│   │   ── Public share routes (server-rendered, OG-rich) ──
│   ├── s/
│   │   ├── c/[id]/page.tsx          # Collectible (architecture exists; visual redesign)
│   │   ├── s/[id]/page.tsx          # Showcase (architecture exists; visual redesign)
│   │   └── p/[id]/page.tsx          # Profile (architecture exists; visual redesign)
│   │
│   │   ── Auth routes (transitional chrome) ──
│   ├── (auth)/
│   │   ├── layout.tsx               # Minimal chrome
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── auth/callback/route.ts   # Supabase callback handler
│   │
│   │   ── Authenticated app routes (sidebar chrome, dark, requires auth) ──
│   ├── (app)/
│   │   ├── layout.tsx               # Sidebar nav + topbar + dark theme
│   │   ├── collection/page.tsx
│   │   ├── tracking/page.tsx
│   │   ├── messages/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── account/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── ... (mirror native settings)
│   │   ├── upload/
│   │   │   ├── page.tsx             # Single upload entry
│   │   │   └── bulk/page.tsx        # Bulk upload (flagship)
│   │   ├── showcase/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── collectible/
│   │   │   └── [id]/page.tsx
│   │   ├── community/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── profile/
│   │       └── [id]/page.tsx
│   │
│   └── middleware.ts                # Session check, app-route auth gate, mobile-web wall
│
├── components/
│   ├── marketing/                   # V2-redesigned marketing components
│   ├── share/                       # Share-route rendering components
│   ├── app/                         # App-section components (sidebar, topbar, etc.)
│   ├── ui/                          # shadcn/ui primitives
│   └── shared/                      # Cross-section primitives (logo, brand button, etc.)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client (client components)
│   │   ├── server.ts                # SSR client (server components, route handlers)
│   │   └── middleware.ts            # Session refresh helper
│   ├── api/                         # Ported from native lib/api/* — same query patterns
│   │   ├── auth.ts
│   │   ├── collectibles.ts
│   │   ├── market.ts
│   │   ├── showcases.ts
│   │   ├── tracking.ts
│   │   ├── managed-rules.ts
│   │   └── extraction.ts            # Calls existing enqueue-extraction Edge Function
│   ├── stream/
│   │   ├── chat-client.ts           # stream-chat-react setup
│   │   └── feeds-client.ts          # @stream-io/feeds-react-sdk setup
│   ├── constants.ts                 # App Store URLs, share domain, etc.
│   └── utils.ts
│
├── hooks/                           # Cross-section hooks
├── public/                          # Static assets, favicon, OG images
└── tailwind.config.ts (or @theme in CSS) — design tokens duplicated from native
```

### Route group separation

Three distinct chrome treatments via Next.js route groups:

- **No bracket** (top-level: `/`, `/features`, `/s/c/[id]`, etc.) — Marketing chrome (top nav with brand + Sign In + Download CTA) and share-page chrome (clean, focused, with Sign In + Download CTA)
- **`(auth)`** — Minimal chrome for sign-in / sign-up / callback flows
- **`(app)`** — Full app chrome (sidebar navigation, top bar with profile menu, dark theme tokens, requires authenticated session)

### What gets shared between native and web

| Asset | How it's shared |
|------|-----------------|
| Database schema | Single Supabase project; both apps read/write the same tables |
| Edge Functions (`enqueue-extraction`, `looking-glass-webhook`, `managed-evaluate`, `stream-token`, etc.) | Deployed once; called from both |
| Storage buckets | Single source; image variants live in same paths |
| Design tokens (colors, type scale, spacing, radius) | Duplicated values via discipline (Option A); migrate to shared package later |
| App Store URLs, share domain, etc. | Duplicated via constants — not changing often |

### What is intentionally web-only

- **Bulk upload** with drop-zone, queue, batch operations
- **Multi-pane desktop layouts** (filter sidebar + grid + preview pane on Collection / Market screens)
- **Keyboard shortcuts** (`⌘K` global search, `G C` go to collection, `J/K` navigation, `Shift+Click` multi-select, etc.)
- **Side-by-side comparison views** for comps and showcases
- **Bulk export** (CSV, PDF, image ZIP)
- **Advanced filter UIs** (multi-faceted filter trees, saved filter presets)
- **Right-click context menus** where they aid power users
- **Drag-to-reorder** at scale (showcase ordering with mouse precision)
- **Subscription checkout** (Stripe via RevenueCat Billing — when it lands)

### What is intentionally web-skipped

- **Camera capture** (replaced by file picker + drag-and-drop)
- **OS-level push notifications** (use email / in-app notification center; web push is Phase 2 if at all)
- **Haptic feedback** (no equivalent on web)
- **Offline-first behaviors** (web is online; if connectivity matters, leave that to the native app)
- **Native sharing sheets** (use Web Share API where supported, fall back to copy-link)

---

## Existing codebase audit

Audit of `C:\Users\johnj\vitrinemarketing` as of 2026-05-11:

### Stack confirmed

```
next: 16.0.10
react: 19.2.0
tailwindcss: 4.1.9 (with @tailwindcss/postcss)
typescript: 5.x
@supabase/supabase-js: 2.98.0
@vercel/analytics: 1.3.1
framer-motion: 12.26.2
gsap: 3.14.2
lucide-react: 0.454.0
react-hook-form + zod: ✓
@radix-ui/* (full kit): ✓
shadcn/ui flavored components: ✓
```

### What's already built (KEEP — architecture)

- **Next.js 16 App Router** structure with Server Components
- **Tailwind v4** with PostCSS pipeline
- **Vercel deployment** (analytics integrated, deploys on push)
- **Supabase client wiring** at `lib/supabase.ts` (basic — needs auth extension)
- **Share routes** — `app/s/c/[id]/page.tsx`, `app/s/s/[id]/page.tsx`, `app/s/p/[id]/page.tsx`
  - Server-side fetching from real `collectibles` / `showcases` / `users` tables
  - Generated OG metadata (Open Graph + Twitter Card)
  - 404 handling
  - **Architecture is correct; visual rendering will be redesigned**
- **App Store URLs** at `lib/constants.ts` (matches EAS plan)
- **Form primitives** (react-hook-form + zod resolvers)
- **Animation libraries** (Framer Motion + GSAP — usage TBD by V2 design)
- **Folder structure** (`app/`, `components/`, `lib/`, `hooks/`)

### What's there but DISCARD / REWORK (visual content)

- All marketing page components (`components/home/*`, `components/features/*`, `components/about/*`, `components/pricing/*`, `components/identity/*`, `components/explore/*`) — full V2 redesign
- Light theme — `themeColor: "#FAFAF7"`, `colorScheme: "light"` in `app/layout.tsx` → switch to dark Vitrine
- `share/share-landing.tsx` visual surface — keep the data flow; redesign the UI
- Custom animation primitives (`magnetic-button`, `tilt-card`, `chromatic-logo`, `data-stream`, `live-ticker`, `profile-ring`, `category-orbs`, `spatial-background`, `custom-cursor`, `page-transition`) — survive only if the V2 design uses them; otherwise sunset
- `lib/category-data.ts`, `lib/explore-data.ts` — likely synthetic / placeholder, audit and discard or rewire to live data

### What's missing and needs to be added

- `@supabase/ssr` (server-side session handling)
- `lib/supabase/client.ts` + `lib/supabase/server.ts` split
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars (in addition to current unprefixed)
- `middleware.ts` at app root for session refresh + route gating + mobile-web wall
- Auth routes (`(auth)/login`, `(auth)/signup`, `(auth)/auth/callback`)
- App route group `(app)/*` with sidebar layout
- Stream Chat React + Stream Feeds React SDK installs and provider setup
- `lib/api/*` ported from native repo
- Design tokens in Tailwind v4 `@theme` block (mirror `lib/colors.ts` from native)
- Fix `metadataBase` from `vitrine.app` → `myvitrine.app`
- Fix `package.json` `name` from `my-v0-project` → `vitrineweb`

### Bugs to fix immediately

- `app/layout.tsx` line 54: `metadataBase: new URL("https://vitrine.app")` should be `https://myvitrine.app`
- `app/layout.tsx` line 83: `generator: 'v0.app'` — keep or remove based on preference

---

## Workstreams

Web work splits cleanly into four streams that can run mostly in parallel after stream 1:

### Stream 1: Foundation (must come first — ~1 week)

Establishes everything else. Single agent / session focus.

- Rename folder `vitrinemarketing` → `vitrineweb`
- Update `package.json` `name`
- Update Vercel project name (or leave)
- Set up dual env var convention (unprefixed + `NEXT_PUBLIC_*`)
- Add `@supabase/ssr` + create `lib/supabase/client.ts` + `lib/supabase/server.ts`
- Add `middleware.ts` with session refresh + auth guard for `(app)/*` + mobile-web wall for non-share routes
- Port design tokens from native `lib/colors.ts` into Tailwind v4 `@theme` block
- Switch `app/layout.tsx` to dark theme (`colorScheme: "dark"`, `themeColor: "#020202"` or matching native splash bg)
- Fix `metadataBase`
- Port `lib/api/*` from native (auth, collectibles, market, showcases, tracking, managed-rules, extraction)
- Port `lib/constants.ts` updates
- Establish folder convention for `(auth)`, `(app)`, marketing routes, share routes

### Stream 2: Marketing redesign (~3-4 weeks, parallelizable)

Apply the V2 dark Vitrine aesthetic to all marketing pages. Driven by the design lead (John) with implementation support.

- Home (`/`) — V2 narrative, hero, value props, social proof, download CTAs
- Features (`/features`) — Aligned to v2.0.0 + v2.1.0 capabilities
- Pricing (`/pricing`) — Wired to `pricing-model.md` tiers (Free / Pro / Collector)
- About (`/about`) — Brand story, beliefs, team
- Contact (`/contact`) — Support, legal, business inquiries
- Identity (`/identity`), Explore (`/explore`) — V2 redesign or sunset (decision needed)
- Privacy (`/privacy`), Terms (`/terms`) — NEW — render `content/privacy-policy.md` + `content/terms-of-service.md` from native repo
- Share routes visual layer — apply V2 design to `share/share-landing.tsx` and the three `app/s/*` pages
- Marketing nav, footer, brand chrome — V2 design

### Stream 3: Auth + app shell (~2 weeks, parallelizable after Stream 1)

The bridge from marketing to product.

- Login page (email + password, magic link, OAuth providers if any)
- Signup page
- Auth callback route handler at `(auth)/auth/callback/route.ts`
- Session middleware (refresh, redirect logic)
- Sign out flow
- Profile completion gate (mirroring native `complete-profile/index.tsx` if profile is incomplete)
- App layout shell at `(app)/layout.tsx` — sidebar nav with primary destinations (Profile, Collection, Tracking, Messages, Notifications, Settings, Upload, Sign Out)
- Top bar with global search (`⌘K`), notifications bell, profile dropdown
- Responsive container — desktop full sidebar, tablet collapsed sidebar, all sized for `min-width: 768px` minimum (below that hits the mobile-web wall)
- Dark theme tokens applied consistently
- Loading states, error boundaries, 404 page, 500 page

### Stream 4: App features (~8-10 weeks, parallelizable after Stream 3)

The bulk of the actual product. Can be split across multiple sessions / agents working different feature slices.

| Feature | Estimate | Notes |
|---------|----------|-------|
| Profile (own + others) | 1 week | Mirror lens model from native (Profile, Collection, Showcase, Activity, Network) |
| Collection (with multi-pane desktop layout) | 1-2 weeks | Filter sidebar + grid + preview pane |
| Showcase create / edit / view | 1 week | Drag-to-reorder, image arrangements |
| Tracking + Market browse | 1-2 weeks | Comp comparison, advanced filters |
| Messaging (`stream-chat-react`) | 1-2 weeks | DMs, group chats, share-collectible / share-showcase modals |
| Activity / Notifications (`@stream-io/feeds-react-sdk`) | 3-5 days | Notification center, activity feed |
| Settings (forms across many screens) | 3-5 days | Account, profile, privacy, blocked, notifications, support, etc. |
| Single image upload + AI extraction | 3-5 days | Drop-zone or click-to-upload → existing Edge Function → review → save |
| **Bulk upload (FLAGSHIP)** | **2-3 weeks** | Drop-zone (drag 50+ images) → queue grid → AI per-item → review/edit/merge → batch approve |
| Community surface (groups, posts) | 1 week | Mirror native community routes |
| Mobile-web wall + responsive guard | 1-2 days | Below 768px, app routes show "this is best on desktop" + app store buttons |
| Polish, browser testing, accessibility, perf | 1-2 weeks | Chrome / Safari / Firefox; Safari is the pain |

---

## Critical implementation details

### Supabase client/server split

Replace current minimal `lib/supabase.ts` with this pattern (canonical Next.js + Supabase setup):

**`lib/supabase/client.ts`** (browser components)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`lib/supabase/server.ts`** (server components, route handlers, server actions)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — set in middleware instead
          }
        },
      },
    }
  )
}
```

**`middleware.ts`** (root)
```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Mobile-web wall for app routes
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
  const isAppRoute = pathname.startsWith('/(app)') ||
    ['/collection', '/tracking', '/messages', '/notifications', '/settings', '/upload', '/showcase', '/collectible', '/community', '/profile']
      .some(p => pathname.startsWith(p))

  if (isMobile && isAppRoute) {
    return NextResponse.redirect(new URL('/use-the-app', request.url))
  }

  // Auth gate for app routes
  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Environment variables

Two conventions coexist:

| Var | Used by | Notes |
|-----|---------|-------|
| `SUPABASE_URL` | Server-only (existing share routes) | Keep for backwards compat with existing share routes |
| `SUPABASE_ANON_KEY` | Server-only (existing share routes) | Same |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | NEW — required for `@supabase/ssr` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | NEW — same |
| `NEXT_PUBLIC_STREAM_API_KEY` | Browser | For Stream Chat / Feeds web SDKs |
| `STREAM_API_SECRET` | Server-only | If we generate Stream tokens server-side instead of via existing Edge Function |
| `NEXT_PUBLIC_APP_SHARE_DOMAIN` | Browser + server | `https://myvitrine.app` |

**Migration:** existing share routes continue to work with unprefixed vars. New code uses `NEXT_PUBLIC_*` versions. Both can read the same Supabase project.

### Design tokens duplication (Option A)

Native source of truth: `lib/colors.ts` + `DESIGN_SYSTEM.md` in `vitrinev0`.

Web mirror: declare in Tailwind v4 `@theme` block in `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Mirror values from vitrinev0/lib/colors.ts — keep in sync */
  --color-background: #020202;
  --color-foreground: #fafafa;
  --color-muted: #1a1a1f;
  --color-muted-foreground: #888;
  --color-brand: <value from native>;
  --color-brand-volt: <value from native>;
  /* ...etc */

  --font-display: "Bodoni Moda", serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-serif: "Instrument Serif", serif;
  --font-libre: "Libre Caslon Display", serif;

  --radius-card: 12px;
  --radius-button: 8px;
  --radius-pill: 999px;

  /* etc. */
}
```

**Discipline:** any color change in `vitrinev0/lib/colors.ts` requires a parallel update to `vitrineweb/app/globals.css`. Document this in both repos' contributing notes.

**Migration path to Option C:** when drift becomes painful, extract to a `packages/design-tokens` shared module in a monorepo restructure.

### Stream Chat web SDK

Replace `stream-chat-expo` (native-only) with `stream-chat-react`:

```bash
npm install stream-chat stream-chat-react
```

Setup pattern (sketch):

```typescript
// lib/stream/chat-client.ts
import { StreamChat } from 'stream-chat'

export const chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!)

export async function connectStreamUser(userId: string, jwt: string, profile: { name: string; image?: string }) {
  // Same token endpoint as native — calls existing stream-token Edge Function
  const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stream-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
    },
  })
  const { token } = await tokenRes.json()

  await chatClient.connectUser({ id: userId, name: profile.name, image: profile.image }, token)
  return chatClient
}
```

Then use `<Chat client={chatClient}>`, `<ChannelList>`, `<Channel>`, `<MessageList>`, `<MessageInput>` from `stream-chat-react`. The token endpoint is shared with native — no new Edge Function work needed.

### Stream Feeds web SDK

Replace `@stream-io/feeds-react-native-sdk` with `@stream-io/feeds-react-sdk`:

```bash
npm install @stream-io/feeds-react-sdk
```

Same `useCreateFeedsClient` hook signature. Same notification feed pattern (`feedsClient.feed('notification', userId)`). Same token endpoint.

### Edge Function reuse

All Supabase Edge Functions live in `vitrinev0/supabase/functions/*` and are deployed once. The web app calls them via direct HTTP `fetch()` (the same pattern native uses to bypass Hermes/`supabase.functions.invoke()` issues — works identically on web).

| Function | Purpose | Web usage |
|---------|---------|-----------|
| `enqueue-extraction` | Kicks off AI extraction job for an uploaded image | Single + bulk upload flows |
| `looking-glass-webhook` | Receives extraction result | n/a (server-to-server) |
| `managed-evaluate` | Evaluates managed showcase rules | Showcase create/edit |
| `managed-sweep-worker` | Periodic sweep | n/a (cron) |
| `stream-token` | Issues Stream chat / feeds JWT | Stream connection |
| Polling endpoints | Job status polling | Single + bulk upload UX |

**No new Edge Function work for v1 web.**

### Image upload pipeline

Native uses `expo-image-picker` + `expo-image-manipulator` + `expo-file-system`. Web replacement:

- **Drop-zone**: `react-dropzone` (or shadcn variant)
- **Compression / resize**: `browser-image-compression` (handles large client-side resizes well; same JPEG output we expect server-side)
- **Upload**: same `supabase.storage.from(bucket).upload(path, blob)` API — works identically in browser
- **Variants**: same `_400`, `_800` etc. naming convention as native; can fire variant generation client-side or punt to a future Edge Function

### Bulk upload UX (flagship)

Two design candidates from earlier discussion:

**Option A — Controlled queue (more control, more clicks)**
1. Drop 30+ images
2. Each renders as a card in a queue grid
3. AI extraction fires per-card (parallelized)
4. Each card transitions: pending → extracting → extracted → reviewed → approved
5. User edits any card inline (title, value, category, tags)
6. User can flag duplicates, merge, delete
7. Final action: "Add 28 collectibles to collection" (one button)

**Option B — Background batch (more magical, less control)**
1. Drop 30+ images
2. Toast: "Uploading 30 collectibles in the background"
3. User can navigate away
4. AI extracts everything; results go to a "Pending review" pile
5. Notification when done: "30 collectibles ready to review"
6. Review surface: grid of cards with extracted data, swipe-to-approve / edit / reject

**Decision needed before bulk upload work begins.** John's gut from prior conversation TBD; both are valid. Suggested: **Option A** for v1 because it gives users confidence in AI accuracy; can layer Option B later as a power-user toggle.

### Mobile-web wall

For non-share, non-marketing routes (i.e., `(auth)` and `(app)`), if the visitor's User-Agent is mobile, redirect to `/use-the-app` which shows:

- Vitrine logo + brand
- Headline: "Vitrine on mobile lives in the app"
- Subhead: "The web experience is built for desktop and tablet. Continue your collection on iOS or Android."
- Two big buttons: App Store + Play Store (using `lib/constants.ts` URLs)
- Below: "Want web on mobile someday? [Tell us why]" → link to feedback form
- Subtle option: "Continue to mobile web anyway →" (small text link, for the determined power user)

**Importantly:** `/s/c/[id]`, `/s/s/[id]`, `/s/p/[id]`, and all marketing routes (`/`, `/features`, `/pricing`, etc.) work fully on mobile web. The wall only applies to authenticated app surface.

### Auth flow specifics

Different from native:

- **Magic link redirect**: `${origin}/auth/callback` (web) instead of `vitrine://auth/callback` (native deep link)
- **OAuth providers**: redirect URLs registered in Supabase dashboard for both `vitrine://` (native) and `https://myvitrine.app/auth/callback` (web) — both can coexist
- **Session storage**: cookies (handled by `@supabase/ssr`) instead of AsyncStorage
- **Profile completion gate**: same logic as native (`useAuth.profileStatus.isComplete`), redirect to `/complete-profile` if incomplete

---

## Mobile web behavior summary

| Route | Mobile web behavior |
|-------|---------------------|
| `/`, `/features`, `/pricing`, `/about`, `/contact` | **Full mobile-responsive marketing experience** |
| `/s/c/*`, `/s/s/*`, `/s/p/*` | **Full public share page**, with prominent "Open in App" CTA below content |
| `/login`, `/signup`, `/auth/callback` | Redirect to `/use-the-app` |
| `(app)/*` (any authenticated route) | Redirect to `/use-the-app` |
| `/use-the-app` | The "go download" landing page |

This pattern preserves virality (share links open and look great on mobile) while protecting the app experience from being judged on mobile-web compromises.

---

## Pre-launch requirements

Before vitrineweb v1 ships to `myvitrine.app`:

- [ ] All Stream 1 (Foundation) work complete
- [ ] All Stream 2 (Marketing redesign) work complete OR a deliberate decision to ship app-only first and redesign marketing post-launch
- [ ] All Stream 3 (Auth + shell) work complete
- [ ] Stream 4 (App features) — at minimum: Profile, Collection, Showcase view, Settings, Single upload, Mobile-web wall. Bulk upload + Messaging + Tracking can be Phase 2 if needed.
- [ ] `myvitrine.app` DNS pointing to Vercel
- [ ] `apple-app-site-association` and `assetlinks.json` files served from `/.well-known/` (also unblocks native deep links per EAS plan)
- [ ] `/privacy` and `/terms` pages live (also unblocks native App Store submission)
- [ ] Sentry web integration (separate `@sentry/nextjs` install)
- [ ] Analytics events instrumented (Vercel Analytics is in place; consider adding PostHog or similar if product analytics needed)
- [ ] Browser test pass: Chrome, Safari, Firefox (latest two each)
- [ ] Accessibility audit: keyboard navigation, screen reader, color contrast
- [ ] Performance budget: LCP < 2.5s on share + marketing routes; app routes can be heavier (authenticated)
- [ ] Cookie consent banner if EU traffic significant
- [ ] OG image (`/OG_image.png`) updated for V2 brand

---

## Estimated time investment

| Phase | Active work | Notes |
|-------|------------|-------|
| Stream 1: Foundation | ~1 week | Single agent, sequential |
| Stream 2: Marketing redesign | ~3-4 weeks | Designer-led with implementation support |
| Stream 3: Auth + shell | ~2 weeks | Parallel to Stream 2 |
| Stream 4: App features (full set including bulk upload) | ~8-10 weeks | Splittable across multiple sessions |
| Polish, accessibility, browser testing | ~1-2 weeks | Final |
| **Total to vitrineweb v1** | **~12-16 weeks active** | **~10-14 weeks elapsed** with parallel streams |

If split across two parallel agents (one on marketing, one on app), elapsed time compresses to ~8-11 weeks.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **Design token drift** between native and web | Discipline + a checklist on `lib/colors.ts` PRs; migrate to monorepo when drift causes a real bug |
| **Schema migration coordination** between teams (web added a column query before native expects it, or vice versa) | Single source of truth: native repo's `supabase/migrations/`. Both teams pull migrations. Staging environment for testing. |
| **Feature drift** (web ships a feature native doesn't have, and users get confused) | Explicit feature-parity matrix in this doc (see "Web-only" / "Web-skipped" / "Shared" sections). Decide intentionally per feature. |
| **Stream Chat UX divergence** (web message UI looks different from native) | Customize `stream-chat-react` theming to match native messaging look as closely as possible without trying for pixel parity |
| **Edge Function changes break web** (native team changes a function signature) | Document Edge Function contracts. Treat them like an external API. Versioning if needed. |
| **Auth redirect URL collision** | Whitelist both `vitrine://` and `https://myvitrine.app/auth/callback` in Supabase dashboard from day one |
| **Marketing redesign drags Stream 2 timeline** | Ship app routes (Stream 3 + 4) first under the existing marketing chrome; redesign marketing as a Phase 1.5 |
| **Mobile users frustrated by app-download wall** | Track wall-page views, conversion to download, and explicit "continue anyway" clicks; revisit if friction is high |
| **Bulk upload edge cases** (50 images, AI failures, partial uploads) | Build with explicit per-item state machine; never lose user data; allow retry per-item |

---

## Dependencies on the native repo

The web project depends on the native repo for:

1. **Supabase migrations** — schema source of truth. Web pulls and runs them locally for dev.
2. **Edge Functions** — deployed from native repo.
3. **Design tokens** — `lib/colors.ts` is the canonical reference until migrated.
4. **Privacy / Terms content** — `content/privacy-policy.md` + `content/terms-of-service.md` should be rendered on web at `/privacy` + `/terms`. Decide: copy the markdown into web, or import via shared package later.
5. **Domain ownership decisions** — both share `myvitrine.app`.

The native project depends on the web project for:

1. **`/privacy`, `/terms`** pages going live (App Store submission requirement).
2. **`.well-known/apple-app-site-association` and `assetlinks.json`** served on the domain (Universal Links / App Links).
3. **OG meta on share routes** — already partially shipped, will improve with V2 redesign.

These cross-dependencies should be coordinated via shared docs (this one + `EAS_MIGRATION_PLAN.md`) and a shared communication channel between teams.

---

## Pickup instructions for the team starting web work

The team picking this up can start immediately. No blocking credentials required (unlike the EAS plan).

### Day 1

1. Read this document end-to-end
2. Read `docs/EAS_MIGRATION_PLAN.md` for context on parallel native work
3. Read `docs/ai-context/CURRENT_STATE.md` for product state
4. Read `c:\Users\johnj\vitrinedb\docs\pricing-model.md` and `c:\Users\johnj\vitrinedb\docs\subscription-architecture.md` for pricing/subscription context
5. Inspect `C:\Users\johnj\vitrinemarketing` — confirm what's already there
6. Confirm Vercel access and which Vercel project this repo deploys to
7. Confirm Supabase access (read-only is fine to start; write needed for schema changes)

### Day 2-5 — Stream 1 (Foundation)

Execute the bullet list in "Stream 1: Foundation" above. Commit incrementally. End the week with:

- Renamed folder + package
- `@supabase/ssr` integrated
- Middleware in place
- Design tokens ported
- Dark theme applied
- API client ported from native
- A working `/login` page (even if barebones) that authenticates and lands on `/(app)/collection` (even if Collection is just a "Hello World")

### Week 2+ — Streams 2, 3, 4 in parallel

Branch out per workstream. Coordinate via PR reviews and weekly syncs.

### Coordination with native team

- Schema changes: native team owns migrations. Web team requests changes via PR or async ping.
- Design token changes: any change to `vitrinev0/lib/colors.ts` requires a parallel PR to `vitrineweb/app/globals.css`. Cross-link PRs.
- Edge Function changes: native team announces changes; web team adapts.
- Domain DNS / Vercel config: coordinate.
- Subscription work (v2.1.0): when RevenueCat lands, web is the primary checkout surface. Coordinate carefully.

---

## Key references

- `C:\Users\johnj\vitrinemarketing` — existing codebase (to be renamed `vitrineweb`)
- `package.json` — current stack snapshot
- `app/layout.tsx` — root metadata, fonts (and the bug at line 54)
- `app/s/c/[id]/page.tsx`, `app/s/s/[id]/page.tsx`, `app/s/p/[id]/page.tsx` — share routes (architecture exists)
- `lib/supabase.ts` — minimal current setup (will be replaced)
- `lib/constants.ts` — App Store URLs
- `c:\Users\johnj\vitrinev0\docs\EAS_MIGRATION_PLAN.md` — parallel native plan
- `c:\Users\johnj\vitrinev0\docs\ai-context\CURRENT_STATE.md` — product state
- `c:\Users\johnj\vitrinev0\lib\colors.ts` — design token source of truth
- `c:\Users\johnj\vitrinev0\DESIGN_SYSTEM.md` — design system documentation
- `c:\Users\johnj\vitrinev0\lib\api\*` — API client to port
- `c:\Users\johnj\vitrinev0\supabase\functions\*` — Edge Functions to call
- `c:\Users\johnj\vitrinedb\docs\pricing-model.md` — subscription tiers (web is checkout surface)
- `c:\Users\johnj\vitrinedb\docs\subscription-architecture.md` — RevenueCat + Stripe architecture

---

## Open questions (parking lot)

These can be resolved as the relevant work begins; none block kickoff:

- **Bulk upload UX**: Option A (controlled queue) or Option B (background batch)? Suggested Option A for v1.
- **Identity (`/identity`) and Explore (`/explore`) marketing pages**: V2 redesign or sunset? TBD by marketing redesign.
- **Server-side image variants**: client-side variant generation (`browser-image-compression`) for v1, or new Edge Function for transforms? Client-side is faster to ship.
- **Stream Chat theming depth**: how close to native messaging UI does web messaging need to look? Probably "feels like Vitrine" not "pixel match."
- **Web push notifications**: skip entirely for v1, or wire up later? Suggest skip for v1.
- **Analytics depth**: Vercel Analytics for traffic; need PostHog or Mixpanel for product analytics? Decide pre-launch.
- **Cookie consent**: needed for EU users; implement only if traffic warrants.
- **Marketing CMS**: do we want copy/content editable without code changes? If yes, integrate Sanity or similar; if no, hardcode in components for v1.
- **Support / contact form**: form to email, or integrated ticketing (e.g., Plain.com)?
- **A11y compliance target**: WCAG 2.1 AA is the right baseline; commit to it.
- **`.well-known/` files**: who owns deploying these to `myvitrine.app`? Web team during Stream 1.
- **Domain TLS / cert management**: Vercel handles automatically; just confirm.
