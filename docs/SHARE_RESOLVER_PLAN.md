# Share Link Resolver — Implementation Plan

> This plan is for the `vitrinemarketing` Next.js project at `C:\Users\johnj\vitrinemarketing`.
> The agent implementing this has MCP access to the same Supabase instance and runs Opus 4.6.

---

## Overview

When a Vitrine user shares a collectible, showcase, or profile, the app generates a link like:

- `https://myvitrine.app/s/c/{id}` — Collectible
- `https://myvitrine.app/s/s/{id}` — Showcase
- `https://myvitrine.app/s/p/{id}` — Profile

These links need to:
1. **Show rich previews** in iMessage, WhatsApp, Slack, Twitter, etc. (OG meta tags)
2. **Attempt to open the Vitrine app** via Universal Links if installed
3. **Fall back to the marketing homepage** (`https://myvitrine.app`) if the app isn't installed

---

## Part 1: File Structure

Create these new files:

```
app/
└── s/
    ├── c/
    │   └── [id]/
    │       └── page.tsx          ← Collectible share resolver
    ├── s/
    │   └── [id]/
    │       ├── page.tsx          ← Showcase share resolver
    │       └── og/
    │           └── route.tsx     ← Dynamic OG image (2x2 collage) for showcases
    └── p/
        └── [id]/
            └── page.tsx          ← Profile share resolver
lib/
└── share/
    ├── constants.ts              ← Shared constants (colors, URLs, fallback image)
    ├── mini-preview.tsx          ← Shared React component for the mini-preview page
    └── universal-link.ts         ← Tiny client script for app-open attempt
public/
└── .well-known/
    ├── apple-app-site-association  ← iOS Universal Links (no file extension!)
    └── assetlinks.json             ← Android App Links
```

---

## Part 2: Shared Constants

### `lib/share/constants.ts`

```typescript
export const SHARE_CONFIG = {
  siteName: 'Vitrine',
  siteUrl: 'https://myvitrine.app',
  fallbackUrl: 'https://myvitrine.app',

  // The Vitrine app icon used for profile shares and as fallback for missing images
  fallbackImage: 'https://fxmiongkckkrllgyfwyw.supabase.co/storage/v1/object/public/brand-assets/logos/app_icon_accent.png',

  // Supabase storage base URL (for constructing image URLs)
  supabaseStorageBase: 'https://fxmiongkckkrllgyfwyw.supabase.co/storage/v1/object/public',

  // App scheme for deep linking
  appScheme: 'vitrine',

  // Brand colors (from the app's design system)
  colors: {
    background: '#0C0C10',
    foreground: '#EFEFE7',
    card: '#161618',
    cardForeground: '#EFEFE7',
    primary: '#D3FFC3',
    primaryForeground: '#0C0C10',
    muted: '#1E1E22',
    mutedForeground: '#C1C1C1',
    border: '#2A2A2E',
  },
} as const;
```

---

## Part 3: Route Handlers (Server Components)

All three share pages are **server components** that:
1. Fetch entity data from Supabase
2. Export `generateMetadata()` for OG tags
3. Render the mini-preview page as the default export

### 3A: Collectible — `app/s/c/[id]/page.tsx`

**Supabase query:**

```typescript
const { data } = await supabase
  .from('collectibles')
  .select(`
    id, title, description, photos, category, subcategory,
    user_id,
    users!collectibles_user_id_fkey ( display_name )
  `)
  .eq('id', params.id)
  .single();
```

**`generateMetadata()` return:**

```typescript
{
  title: data.title,                                     // e.g. "1986 Fleer Michael Jordan #57"
  description: `From ${ownerName}'s collection on Vitrine`,
  openGraph: {
    title: data.title,
    description: `From ${ownerName}'s collection on Vitrine`,
    siteName: 'Vitrine',
    type: 'website',
    images: [{
      url: data.photos?.[0] || SHARE_CONFIG.fallbackImage,
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: data.title,
    description: `From ${ownerName}'s collection on Vitrine`,
    images: [data.photos?.[0] || SHARE_CONFIG.fallbackImage],
  },
}
```

**Mini-preview shows:**
- Primary photo (large, centered)
- Title
- Category breadcrumb: format `category` and `subcategory` as "Trading Card · Sports" (title-case the codes, separate with " · ")
- `From {display_name}'s collection`
- [Open in Vitrine] button
- "Don't have the app? Learn more" link → `https://myvitrine.app`

**If collectible not found:** Return `notFound()` (Next.js 404).

---

### 3B: Showcase — `app/s/s/[id]/page.tsx`

**Supabase query:**

```typescript
// Get showcase + owner
const { data: showcase } = await supabase
  .from('showcases')
  .select('id, title, user_id')
  .eq('id', params.id)
  .single();

// Get owner name
const { data: owner } = await supabase
  .from('users')
  .select('display_name')
  .eq('id', showcase.user_id)
  .single();

// Get first 4 collectible photos for the collage + total count
const { data: items, count } = await supabase
  .from('showcase_collectibles')
  .select('collectible_id, display_order, collectibles ( photos )', { count: 'exact' })
  .eq('showcase_id', params.id)
  .order('display_order', { ascending: true })
  .limit(4);
```

**`generateMetadata()` return:**

```typescript
{
  title: showcase.title,                                 // e.g. "My Grail Wall"
  description: `${totalCount} items · Curated by ${ownerName} on Vitrine`,
  openGraph: {
    title: showcase.title,
    description: `${totalCount} items · Curated by ${ownerName} on Vitrine`,
    siteName: 'Vitrine',
    type: 'website',
    images: [{
      // Points to the dynamic OG image route (see Part 4)
      url: `https://myvitrine.app/s/s/${params.id}/og`,
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: showcase.title,
    description: `${totalCount} items · Curated by ${ownerName} on Vitrine`,
    images: [`https://myvitrine.app/s/s/${params.id}/og`],
  },
}
```

**Mini-preview shows:**
- 2×2 grid of item thumbnails (from the first 4 collectibles' `photos[0]`)
- If fewer than 4 items, show what exists; empty slots get a subtle placeholder
- Showcase title
- "{count} items · Curated by {display_name}"
- [Open in Vitrine] button
- "Don't have the app? Learn more" link → `https://myvitrine.app`

**If showcase not found:** Return `notFound()`.

---

### 3C: Profile — `app/s/p/[id]/page.tsx`

**Supabase query:**

```typescript
const { data: user } = await supabase
  .from('users')
  .select('id, display_name, bio, collectibles_count')
  .eq('id', params.id)
  .single();

// Optionally get showcase count
const { count: showcaseCount } = await supabase
  .from('showcases')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', params.id);
```

**`generateMetadata()` return:**

```typescript
{
  title: `${user.display_name} on Vitrine`,
  description: user.bio || `Collector on Vitrine · ${user.collectibles_count || 0} items`,
  openGraph: {
    title: `${user.display_name} on Vitrine`,
    description: user.bio || `Collector on Vitrine · ${user.collectibles_count || 0} items`,
    siteName: 'Vitrine',
    type: 'profile',
    images: [{
      url: SHARE_CONFIG.fallbackImage,    // Always app_icon_accent.png for profiles
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: 'summary',                      // "summary" (not large_image) — better for icon-style images
    title: `${user.display_name} on Vitrine`,
    description: user.bio || `Collector on Vitrine · ${user.collectibles_count || 0} items`,
    images: [SHARE_CONFIG.fallbackImage],
  },
}
```

**Mini-preview shows:**
- `app_icon_accent.png` (centered, ~120px)
- Display name
- Bio (if exists) or "Collector on Vitrine"
- "{collectibles_count} items · {showcaseCount} showcases"
- [Open in Vitrine] button
- "Don't have the app? Learn more" link → `https://myvitrine.app`

**If user not found:** Return `notFound()`.

---

## Part 4: Dynamic OG Image for Showcases

### `app/s/s/[id]/og/route.tsx`

This uses Next.js `ImageResponse` (from `next/og`) to generate a 1200×630 PNG on the fly.

**The route handler:**

```typescript
import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Fetch showcase title + first 4 item photos (same query as the page)
  // ...

  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#0C0C10',
        padding: '40px',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
      }}>
        {/* Left side: 2×2 grid of photos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '500px', height: '500px' }}>
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              style={{
                width: '244px',
                height: '244px',
                objectFit: 'cover',
                borderRadius: '12px',
              }}
            />
          ))}
          {/* Fill empty slots with dark placeholders if < 4 photos */}
        </div>

        {/* Right side: Title + attribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div style={{ color: '#EFEFE7', fontSize: '48px', fontWeight: 700 }}>
            {showcase.title}
          </div>
          <div style={{ color: '#C1C1C1', fontSize: '24px' }}>
            {totalCount} items · Curated by {ownerName}
          </div>
          <div style={{ color: '#D3FFC3', fontSize: '20px', marginTop: '16px' }}>
            VITRINE
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

**Notes:**
- `ImageResponse` uses Satori under the hood — it supports a subset of CSS (flexbox only, no grid).
- The `runtime: 'edge'` directive ensures this runs on Vercel's edge network for fast response.
- If no photos exist at all, render `app_icon_accent.png` centered with the showcase title.
- Photos should use the full-size URL from Supabase storage (not a variant — we want max quality for the OG image).

---

## Part 5: Mini-Preview Page Template

The mini-preview is a server-rendered page. No client-side React hydration needed. It should use the **dark app theme** (background `#0C0C10`, foreground `#EFEFE7`, accent `#D3FFC3`) to feel like a natural extension of the app.

### Layout Structure

```
┌──────────────────────────────────────┐
│         (centered, max-width 420px)  │
│                                      │
│         [Content Area]               │
│         (image / grid / icon)        │
│                                      │
│         Title                        │
│         Subtitle / Description       │
│                                      │
│    ┌──────────────────────────┐      │
│    │    Open in Vitrine       │      │  ← mint bg (#D3FFC3), dark text
│    └──────────────────────────┘      │
│                                      │
│    Don't have the app?               │  ← muted text (#C1C1C1)
│    Learn more at myvitrine.app       │  ← link, mint underline
│                                      │
│         ─── VITRINE ───              │  ← small wordmark, muted
│                                      │
└──────────────────────────────────────┘
```

### Behavior

The page includes a small inline `<script>` that runs on load:

```javascript
// Attempt to open the app via Universal Link
// The page URL itself IS the Universal Link — if the app is installed
// and Universal Links are configured, iOS/Android will intercept it
// before this page even renders. This script is the fallback path.

// After a short delay (user is seeing the mini-preview), if they tap
// "Open in Vitrine", try the custom scheme as a last resort:
function openInApp() {
  // Custom URL scheme attempt
  window.location.href = 'vitrine://s/c/{id}';

  // If that didn't work (no app), they stay on this page
  // The "Learn more" link is already visible
}
```

**Important:** Do NOT auto-redirect or use aggressive `setTimeout` tricks. The user landed here because they don't have the app — let them see the preview and choose to tap "Open in Vitrine" or "Learn more." This is a marketing moment, not a redirect bounce.

### Styling

Use inline styles (or Tailwind since the project already has it). The page should:
- Have `bg-[#0C0C10]` full-page background
- Use the app's font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (or use the project's existing Inter/Manrope fonts)
- Feel premium and minimal — not a "sorry you don't have the app" error page
- Be fully responsive (looks great on mobile where most share taps happen)
- Load fast — no heavy JS, no client-side data fetching
- Images should have `loading="eager"` since they're the hero content

---

## Part 6: Universal Links / App Links

### `public/.well-known/apple-app-site-association`

This file tells iOS which URLs should open in the Vitrine app. **No file extension. Must be served as `application/json`.**

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": [
          "TEAM_ID.com.vitrine.app"
        ],
        "components": [
          { "/": "/s/c/*", "comment": "Collectible share links" },
          { "/": "/s/s/*", "comment": "Showcase share links" },
          { "/": "/s/p/*", "comment": "Profile share links" }
        ]
      }
    ]
  }
}
```

> **ACTION REQUIRED:** Replace `TEAM_ID` with the actual Apple Developer Team ID
> and `com.vitrine.app` with the actual bundle identifier from the Expo app.
> These values can be found in:
> - Apple Developer portal → Membership → Team ID
> - The Expo app's `app.json` or `app.config.ts` → `ios.bundleIdentifier`

### `public/.well-known/assetlinks.json`

This file tells Android which app handles these URLs.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vitrine.app",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

> **ACTION REQUIRED:** Replace `com.vitrine.app` with the actual Android package name
> and add the SHA-256 certificate fingerprint from the signing key.

### Next.js Config for `.well-known`

The `apple-app-site-association` file has no extension but must be served as JSON. Add to `next.config.mjs`:

```javascript
export default {
  // ...existing config...
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ];
  },
};
```

---

## Part 7: What Needs to Happen in the Expo App (SEPARATE TASK)

> This part will be handled by the other agent working in `C:\Users\johnj\vitrinev0`.
> Documenting here for completeness.

### 7A: Wire up missing Share buttons

The share button visibility depends on two things:
1. **Is the viewer the owner?** → Always show the share button.
2. **Is the viewer someone else?** → Only show if `owner.sharing_permission === 'public'`.

The owner's `sharing_permission` needs to be fetched alongside the entity data. This is a UI-only gate — it does NOT affect the web share resolver.

**`components/showcase-view.tsx`** — The Share2 button on line ~248 has no `onPress`. Add:

```typescript
import { Share } from 'react-native';
import { SHARE_URLS } from '@/lib/constants';

// Inside the component:
const handleShare = async () => {
  const shareUrl = SHARE_URLS.showcase(showcase.id);
  try {
    await Share.share({
      message: `Check out "${showcase.title}" on Vitrine\n\n${shareUrl}`,
      url: shareUrl,
    });
  } catch (err) {
    console.error('Share failed:', err);
  }
};

// Conditionally render the button:
// Show if: isOwner OR owner.sharing_permission === 'public'
```

**`components/collector-profile.tsx`** — The Share2 button on line ~614 has no `onPress`. Add:

```typescript
const handleShare = async () => {
  const shareUrl = SHARE_URLS.profile(collector.id);
  try {
    await Share.share({
      message: `Check out ${collector.display_name}'s collection on Vitrine\n\n${shareUrl}`,
      url: shareUrl,
    });
  } catch (err) {
    console.error('Share failed:', err);
  }
};

// Conditionally render the button:
// Show if: isOwnProfile OR collector.sharing_permission === 'public'
```

**`components/collectible-detail.tsx`** — Share is already wired, but needs the same conditional visibility:
```typescript
// The handleShare function already exists and works.
// Just wrap the share button in the DetailTopControls with the same permission check:
// Show if: isOwner OR owner.sharing_permission === 'public'
```

### 7B: Wire Settings > Privacy > "Who can share my content"

In the existing `components/settings-privacy.tsx`, replace the mock `MOCK_PRIVACY_SETTINGS` entry for sharing with a real toggle that:
1. Reads `sharing_permission` from the user's profile
2. Shows two options: "Everyone" (`public`) and "Only Me" (`only_me`)
3. On save, updates the `users` table: `supabase.from('users').update({ sharing_permission }).eq('id', userId)`

### 7C: Configure deep linking in Expo

In `app.json` or `app.config.ts`, add:

```json
{
  "expo": {
    "scheme": "vitrine",
    "ios": {
      "associatedDomains": ["applinks:myvitrine.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "myvitrine.app",
              "pathPrefix": "/s/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 7D: Handle incoming deep links in the Expo Router

Add a linking configuration or handle in the root layout that maps:
- `/s/c/{id}` → navigate to `/collectible/{id}`
- `/s/s/{id}` → navigate to `/showcase/{id}`
- `/s/p/{id}` → navigate to `/profile/{id}`

This can be done via Expo Router's built-in URL handling or a `useURL()` hook in the root layout.

### 7E: Update `SHARE_URLS` domain

In `lib/constants.ts`, confirm the domain matches:

```typescript
export const APP_SHARE_DOMAIN = 'https://myvitrine.app';
```

(This is already correct.)

---

## Part 8: Sharing Privacy Model

### How It Works

There are NO server-side permission checks on the share resolver. If an entity exists in the DB, the resolver serves it. Privacy is enforced entirely at the **UI level** in the mobile app.

**Private collectibles** are hidden from other users *within the app* (feeds, search, profile views). But the owner can still share the URL. This enables "private link" functionality — like Google Docs "anyone with the link can view." This is intentional and considered a feature.

**The `sharing_permission` column** on the `users` table controls whether *other users* see the share button on that person's content in the app. It does NOT affect the web resolver.

| `sharing_permission` | Owner sees share button? | Other users see share button? | Resolver behavior |
|---------------------|--------------------------|-------------------------------|-------------------|
| `'public'` (default) | Yes | Yes | Serves page normally |
| `'only_me'` | Yes | No | Serves page normally (no change) |

This column is managed via **Settings > Privacy > "Who can share my content"** in the mobile app.

**The resolver does not need to query `sharing_permission` at all.** It simply fetches the entity and serves the page. The privacy gate is upstream in the mobile app's UI.

### DB Migration Required

Add this column to the `users` table (can be done via MCP):

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS sharing_permission text NOT NULL DEFAULT 'public'
CHECK (sharing_permission IN ('public', 'only_me'));
```

---

## Part 9: Supabase Access

The marketing site already has Supabase configured:

- **Client:** `lib/supabase.ts` — uses `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- **Env vars:** `.env` has `SUPABASE_URL` and `SUPABASE_ANON_KEY` (server-side only, no `NEXT_PUBLIC_` prefix)
- **Same Supabase instance** as the mobile app (`fxmiongkckkrllgyfwyw`)

The share routes can import `supabase` from `@/lib/supabase` and query directly. No new Supabase setup needed.

**RLS note:** The `collectibles`, `showcases`, `showcase_collectibles`, and `users` tables need to allow `SELECT` for the anon key (public read). Verify these RLS policies exist using MCP:
- `collectibles`: public read (all rows — the resolver serves even private collectibles via share links)
- `showcases`: public read
- `showcase_collectibles`: public read
- `users`: public read for profile fields (display_name, bio, collectibles_count)

If any policies are missing, create them. The resolver only needs `SELECT` — no writes.

---

## Part 11: Dependency

Check if `next/og` is available in Next.js 16 (it should be built-in since Next.js 14). If `import { ImageResponse } from 'next/og'` works, no new dependency needed. Otherwise:

```bash
npm install @vercel/og
```

---

## Part 12: Implementation Order

1. **Run the DB migration** — Add `sharing_permission` column to `users` table (use MCP)
2. **Verify RLS policies** — Ensure `collectibles`, `showcases`, `showcase_collectibles`, and `users` allow public `SELECT` via anon key (use MCP)
3. **Create `lib/share/constants.ts`** — shared config
4. **Create `public/.well-known/apple-app-site-association`** — placeholder with TODO for Team ID
5. **Create `public/.well-known/assetlinks.json`** — placeholder with TODO for fingerprint
6. **Update `next.config.mjs`** — add Content-Type header for AASA file
7. **Create `app/s/c/[id]/page.tsx`** — Collectible share (simplest, do first)
8. **Create `app/s/p/[id]/page.tsx`** — Profile share (second simplest, no dynamic image)
9. **Create `app/s/s/[id]/og/route.tsx`** — Showcase OG image generator
10. **Create `app/s/s/[id]/page.tsx`** — Showcase share (uses the OG route)
11. **Test** — Hit each route in the browser to verify HTML renders, then test OG tags with https://www.opengraph.xyz/ or Twitter Card Validator
12. **Deploy** — Push to Vercel, verify `.well-known` files are accessible

---

## Part 13: Testing Checklist

- [ ] `/s/c/{real-collectible-id}` returns page with correct OG tags
- [ ] `/s/c/{nonexistent-id}` returns 404
- [ ] `/s/s/{real-showcase-id}` returns page with correct OG tags
- [ ] `/s/s/{real-showcase-id}/og` returns a PNG image
- [ ] `/s/p/{real-user-id}` returns page with correct OG tags
- [ ] `/.well-known/apple-app-site-association` returns JSON with correct Content-Type
- [ ] `/.well-known/assetlinks.json` returns valid JSON
- [ ] OG tags validate on https://www.opengraph.xyz/
- [ ] Mini-preview looks correct on mobile viewport
- [ ] "Open in Vitrine" button triggers custom scheme
- [ ] "Learn more" link navigates to marketing homepage

---

## Appendix: Real Test IDs

To test the share routes, you'll need real entity IDs from Supabase. Use MCP to grab a few:

```sql
-- A real collectible ID
SELECT id, title FROM collectibles LIMIT 3;

-- A real showcase ID
SELECT id, title FROM showcases LIMIT 3;

-- A real user ID
SELECT id, display_name FROM users LIMIT 3;
```
