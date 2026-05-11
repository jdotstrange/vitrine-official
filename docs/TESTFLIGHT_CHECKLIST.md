# Vitrine — TestFlight & App Store Readiness Checklist

> Status snapshot at audit time: **~70% ready**. One trivial blocker for building, two real blockers for App Store review, rest is cleanup.
>
> **Audited:** 2026-04-21. **Target:** first TestFlight build + App Store submission.
>
> Legend: 🔴 hard blocker · 🟠 soft blocker (OK for internal TF, not for review) · 🟡 functional gap · ⚪ polish

---

## Priority 0 — Build is literally impossible without these

### 🔴 1. Create `eas.json`
- **Why:** No EAS config exists at the repo root. `eas build` will error immediately.
- **Scope:**
  - Three profiles: `development`, `preview`, `production`
  - `submit.ios` pointing at App Store Connect (`ascAppId`, `appleTeamId`, `appleId`)
  - Resource class: `m-medium` for iOS is the usual default
  - Env var bindings for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_STREAM_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN` (once installed)
- **Done when:** `eas build --platform ios --profile production` starts without complaining.
- [ ] Draft `eas.json`
- [ ] Move secrets to `eas secret:create` (do NOT commit them)
- [ ] Test with a `preview` build first

### 🔴 2. Add iOS `buildNumber` to `app.json`
- **Why:** Each TestFlight upload requires a unique incrementing build number. Default `"1"` works once, then Apple rejects with `ITMS-90062`.
- **Scope:** Add `"buildNumber": "1"` under `ios` in `app.json`. Long-term, either bump manually or use EAS's `autoIncrement` in `eas.json`.
- **Done when:** `app.json` has an initial `buildNumber` and we've chosen an increment strategy.
- [ ] Add `ios.buildNumber` to `app.json`
- [ ] Add `android.versionCode` for parity (`"versionCode": 1`)
- [ ] Decide: `autoIncrement: true` in eas.json production profile vs. manual bump discipline

### 🔴 3. App Store Connect registration
- **Why:** Can't upload without an App Store Connect record tied to the bundle identifier.
- **Scope:**
  - Register `com.vitrine.app` on developer.apple.com if not already
  - Create the App Store Connect app record
  - Capture `appleTeamId`, `ascAppId` → put in `eas.json`
- **Done when:** Team ID + ASC App ID are in `eas.json` and a test upload reaches App Store Connect.
- [ ] Bundle ID registered
- [ ] ASC app record created
- [ ] IDs wired into `eas.json`

---

## Priority 1 — Required before App Store Review (OK to TestFlight internally without these)

### 🟠 4. Add in-app Account Deletion
- **Why:** Apple **Guideline 5.1.1(v)** requires in-app account deletion for apps with user accounts (enforced since June 2022). Will get rejected otherwise.
- **Status:** `WIRING_CHECKLIST.md` claims "Account deletion" under item #8, but `grep -i "delete.account"` returns zero matches. It's not actually implemented.
- **Scope:**
  - New `delete-user` Supabase Edge Function (service-role): deletes `auth.users` row + `public.users` row + cascades (collectibles, showcases, follows, tracking, trading_card_details, notification_preferences)
  - Storage cleanup for user avatars + collectible photos
  - Stream Chat + Feeds: delete user on Stream side
  - UI: red destructive row in Settings → confirm modal → "Type DELETE to confirm" → call edge function → sign out
  - Files to touch: `components/settings-account.tsx`, `lib/api/auth.ts`, new `supabase/functions/delete-user/index.ts`
- **Done when:** A test user can delete their account end-to-end and their data is gone from all 4 surfaces (Supabase, Storage, Stream Chat, Stream Feeds).
- [ ] Edge function: `delete-user`
- [ ] Storage cleanup helper
- [ ] Stream Chat + Feeds deletion calls
- [ ] Settings UI (destructive row + confirm)
- [ ] End-to-end test

### 🟠 5. Load Privacy Policy + ToS from `content/*.md` (not inline stale copy)
- **Why:** `components/settings-privacy-policy.tsx` and `settings-terms.tsx` currently embed **"January 2024"** markdown inline. `content/privacy-policy.md` and `content/terms-of-service.md` exist but aren't loaded. This is both a freshness problem and a single-source-of-truth problem (marketing site uses `content/*`).
- **Scope:**
  - Import and parse `content/privacy-policy.md` and `content/terms-of-service.md` at build time (via `require` or a plugin that inlines MD)
  - Render with a simple Markdown component (or leave as formatted text if full markdown isn't needed)
  - Remove the inline strings
- **Done when:** Both screens render the current content from `content/*.md` and there's no duplicated copy in TSX files.
- [ ] Decide: require+inline at build time, OR fetch from marketing site on open
- [ ] Strip inline markdown from `settings-privacy-policy.tsx` + `settings-terms.tsx`
- [ ] Verify "last updated" dates reflect reality

### 🟠 6. Public HTTPS URL for Privacy Policy
- **Why:** App Store Connect requires a publicly accessible privacy policy URL for the listing. The in-app screen doesn't satisfy this.
- **Scope:** Host `content/privacy-policy.md` (and ToS) on the marketing site at e.g. `https://myvitrine.app/privacy` and `https://myvitrine.app/terms`.
- **Done when:** Both URLs resolve publicly and are pasted into App Store Connect > App Information.
- [ ] `myvitrine.app/privacy` live
- [ ] `myvitrine.app/terms` live
- [ ] URLs added to App Store Connect

### 🟠 7. Install + wire Sentry (or another crash reporter)
- **Why:** `lib/sentry.ts` is scaffolded but `@sentry/react-native` is not in `package.json`. The `require('@sentry/react-native')` silently fails in the catch. Production crashes are invisible today.
- **Scope:**
  - `npx expo install @sentry/react-native`
  - Add Sentry plugin to `app.json` per their RN docs
  - Set `EXPO_PUBLIC_SENTRY_DSN` as an EAS secret
  - Optionally wire source maps upload in EAS postInstall hook
- **Done when:** A deliberate `throw new Error('sentry-test')` in a dev build shows up in Sentry within ~1 min.
- [ ] Install SDK
- [ ] Plugin entry in `app.json`
- [ ] DSN as EAS secret
- [ ] Source maps (can defer to v1.1)
- [ ] Verify a test error lands

---

## Priority 2 — Functional gaps (should fix before handing to external testers)

### 🟡 8. Universal Links open to 404 inside the app
- **Why:** `app.json` has `associatedDomains: ["applinks:myvitrine.app"]`. Share URLs use `https://myvitrine.app/s/c/:id` (see `lib/constants.ts`). But the app has NO `/s/c/`, `/s/s/`, or `/s/p/` routes — only `/collectible/:id`. Tapping a shared link from an app-installed device hits `app/[...unmatched].tsx`.
- **Scope (pick one):**
  - **Option A (recommended):** Add shim routes — `app/s/c/[id].tsx`, `app/s/s/[id].tsx`, `app/s/p/[id].tsx` — that each `router.replace()` to the canonical internal route
  - **Option B:** Update the AASA file on the marketing site to exclude `/s/*` paths, forcing browser fallback (users without app installed already get this)
- **Done when:** Tapping a share link on a device with the app installed opens the correct in-app screen (not a 404).
- [ ] Decide: shim routes vs. AASA exclusion
- [ ] Implement
- [ ] Test on real device with a real shared link

### 🟡 9. Decide: push notifications in v1 or v1.1?
- **Why:** `expo-notifications` is not installed. The wiring checklist says "deferred". Notifications DO render in the in-app bell/feed via Stream Activity Feeds — just no OS-level push (lockscreen/banner).
- **If v1:** Install `expo-notifications`, configure APNs, wire Stream Chat + Feeds push webhooks, add a permission prompt on first relevant action.
- **If v1.1:** Leave as-is. Document the deferral in App Store review notes if asked.
- **Done when:** Decision made and documented in `WIRING_CHECKLIST.md`.
- [ ] Decide scope
- [ ] If shipping in v1: implement + test on a real device (push doesn't work in simulator)

### 🟡 10. Account deletion is one thing — data export is another
- **Why:** `WIRING_CHECKLIST.md` item #8 also claims "Data export" is functional. I didn't find evidence of this either. Some jurisdictions (GDPR/CCPA) require it, and it's adjacent to the account-delete work.
- **Scope:**
  - Edge function that assembles a user's collectibles + showcases + tracked items + profile into a JSON or ZIP
  - Email the user a download link (or direct download)
  - Settings row: "Export my data"
- **Done when:** A test user can request and receive their data within X minutes.
- [ ] Verify whether this is actually wired (may already exist — re-grep)
- [ ] Build if missing

---

## Priority 3 — Hygiene that'll save a resubmission round

### 🟡 11. `MOCK_CONNECTIONS` reachable via `create-group.tsx`
- **Why:** `components/create-group.tsx:16` imports `MOCK_CONNECTIONS` and uses it to populate the invite list (line 129). Community hub ships dark, but this path may still be reachable from somewhere.
- **Scope:** Grep for references to `CreateGroup` component. If unreachable, delete both files. If reachable, replace mock with real follows list (`getFollowCounts` → fetch followers).
- [ ] Audit reachability
- [ ] Delete-or-fix

### 🟡 12. `smart-showcase-create.tsx` has `// TODO: Save showcase to database`
- **Why:** Line 204 of `components/smart-showcase-create.tsx`. Imported by `app/upload/showcase/[type]/index.tsx`. Wiring checklist says Smart Showcase ships dark, but the route file is present. If any button navigates to `/upload/showcase/smart`, the submit is a no-op.
- **Scope:** Verify no UI exposes the smart variant. If any does, either wire it up or block the route.
- [ ] Grep for navigation to `/upload/showcase/smart`
- [ ] Block or implement

### ⚪ 13. Raw `console.error` in `lib/supabase.ts`
- **Why:** Lines 17–21. Bypasses `lib/logger.ts` prod-silencing. On a misconfigured build, the error goes to the JS console but not Sentry.
- **Scope:** Replace with `log.error(...)` using the existing logger. Trivial.
- [ ] 1-line fix

### ⚪ 14. `lib/mock-explore.ts` ships a real Supabase hostname in the bundle
- **Why:** Line 6 has `https://fxmiongkckkrllgyfwyw.supabase.co/storage/...` hardcoded. Only imported by `components/explore/price-drops.tsx`, which is not used anywhere. But both files still get bundled.
- **Scope:** Delete `lib/mock-explore.ts` and `components/explore/price-drops.tsx`. Verify nothing else imports them.
- [ ] Confirm unused
- [ ] Delete

### ⚪ 15. Delete other unused mock files
Candidates flagged by the audit — confirm each and delete:
- [x] `lib/mock-connections.ts` — deleted with Network Surface V3 (no live imports)
- [ ] `lib/mock-notifications.ts` — search imports, delete if unreferenced
- [ ] `lib/mock-collectibles.ts` — search imports, delete if unreferenced
- [ ] `lib/mock-feed.ts` — used by `components/home/feed-card.tsx`; verify if that card is still rendered
- [ ] `components/discovery-feed.tsx` — contains `MOCK_SHOWCASES`; likely dead, verify + delete
- [ ] `components/search-results.tsx` — still imported by `app/search/index.tsx` + `components/search-interface.tsx`; check if still uses mocks

### ⚪ 16. Repo hygiene: edge functions not tracked in git
Client code calls edge function names that **don't exist** as folders in `supabase/functions/`:
- [ ] `card-hedge-proxy` — pull deployed source into repo
- [ ] `stream-token` — pull deployed source into repo
- [ ] `stream-notify` — pull deployed source into repo
- [ ] `stream-backfill` — pull deployed source into repo
- [ ] `media-upload` — pull deployed source into repo
- [ ] `stream-test-notify` (if still deployed) — pull or delete
- [ ] `delete-user` (once built in §4) — commit to repo

Present in repo: `generate-variants`, `migrate-images`, `trading-cards`. Everything else is deployed-only, which is a rollback hazard.

### ⚪ 17. Testing coverage
- Only test file is `__tests__/lib/logger.test.ts`. For a v1 ship we're not going to write full coverage, but a handful of critical-path smoke tests would pay for themselves:
- [ ] Auth sign-in happy path
- [ ] Collectible create + read
- [ ] Trading card create + read
- [ ] Image upload returns valid URL

---

## Priority 4 — Marketing / Store Listing prep (needed for submission, not for TestFlight)

- [ ] **App icon** — `assets/icon.png` is 1024×1024, confirmed present ✅
- [ ] **Screenshots** — need 6.7" (Pro Max), 6.5" (Plus), 5.5" (legacy), iPad 12.9" if `supportsTablet` stays true. At least 3 screenshots per size.
- [ ] **App preview video** (optional but helps conversion)
- [ ] **Store description** — short (170 char promo text) + long (4000 char)
- [ ] **Keywords** — 100 chars, comma-separated
- [ ] **Support URL** — public page on marketing site with contact form or email
- [ ] **Marketing URL** — landing page
- [ ] **Primary category** — Lifestyle? Shopping? Social Networking?
- [ ] **Age rating** — fill out the questionnaire (user-generated content implications)
- [ ] **Export Compliance** — standard answer is "no, does not use encryption beyond HTTPS"
- [ ] **Demo account** for Apple reviewers (email + password) — required since reviewers can't do OTP signup easily

---

## Priority 5 — Post-launch nice-to-haves (track but don't block)

- [ ] Analytics beyond crash reporting (PostHog / Amplitude)
- [ ] Price history visualization for trading cards (schema ready, UI deferred)
- [ ] Trading-card-specific search (by player/year/set)
- [ ] Storage cleanup job for deleted collectibles' photos
- [ ] Community Hub (intentionally shipping dark in v1)
- [ ] Smart Showcase (intentionally shipping dark in v1)
- [ ] Sharing permission toggle in Settings UI (column exists)

---

## Cross-references

- Full audit context: see assistant message transcript from 2026-04-21 audit
- Existing wiring status: `WIRING_CHECKLIST.md`
- Trading cards implementation details: `trading-cards-edge-function-brief.md`
- Share flow architecture: `WIRING_CHECKLIST.md` item #6 (Sharing) + §8 above

---

## Rough effort estimate

| Block | Hours | Notes |
|-------|-------|-------|
| §1–3 (build config) | ~2 | One pass, then wait on Apple for propagation |
| §4 (account deletion) | ~4-6 | Edge function + Stream teardown + UI + testing |
| §5–6 (legal copy + URLs) | ~1-2 | If marketing site infra is already there |
| §7 (Sentry) | ~1 | Straight install + verify |
| §8 (deep link shim) | ~30min | Three tiny route files |
| §11–15 (mock cleanup) | ~2 | Mostly delete + verify |
| §16 (edge function repo sync) | ~1 | `supabase functions download ...` |
| **Total "must ship"** | **~10-12 focused hours** | Spread over 1-2 days |
