# EAS Migration Plan — Expo Go → EAS Dev Client → TestFlight → App Store

**Status:** Phase 1 COMPLETE. Dev client running on device. Ready for Phase 2 (native modules).
**Document version:** 2.1
**Last updated:** 2026-05-13
**Owner:** John
**Drives toward:** v3.0.0 production launch on iOS App Store + Google Play

> **Prerequisite:** This plan assumes the Phase 0 monorepo restructure (`docs/MONOREPO_STRUCTURE.md`) is complete. After Phase 0, all native files referenced in this document live at `apps/native/<path>` rather than the repo root. For example, `app.json` becomes `apps/native/app.json`, `eas.json` (created during this plan) becomes `apps/native/eas.json`. Run all `eas` commands from `apps/native/`. The Edge Functions referenced live at `supabase/functions/*` at the repo root. Design tokens and shared types are imported from `@vitrine/design-tokens`, `@vitrine/types`, etc.

---

## Purpose

Captures the complete plan for migrating Vitrine from Expo Go-only development to an EAS-built dev client, then to TestFlight, then to a v3.0.0 App Store / Play Store launch that replaces the existing **MyVitrine** open beta listings. Designed to be picked up cold once the blocking credentials arrive.

This document supersedes `TESTFLIGHT_CHECKLIST.md` (audited 2026-04-21, partially stale).

---

## Why we're doing this

1. **Unlock native modules that Expo Go doesn't support:** Sentry crash reporting, push notifications, react-native-keyboard-controller, RevenueCat SDK (later), and any other native dep we need before launch.
2. **Get TestFlight distribution** for real-device QA with internal testers.
3. **Replace the existing MyVitrine v1.0.12 open beta** with v3.0.0 — the new V3-redesigned app.
4. **Unblock the marketing site / domain work** that depends on knowing the app's bundle ID.

The current `expo-release-guardrails.mdc` rule explicitly forbids `expo-dev-client` ("Development happens in Expo Go until feature-complete"). That guidance is now superseded by this plan and needs updating when implementation begins.

---

## Decisions locked in

| Decision | Value | Reasoning |
|----------|-------|-----------|
| Migration target | EAS dev client (not Expo Go forever) | Unlocks native modules + TestFlight |
| Sequencing | iOS first, Android parallel later | Personal dev device is iPhone; iOS App Store has higher friction |
| Versioning | **`3.0.0`** (build 1) | v3.0.0 build already exists in App Store Connect; 3.0.0 avoids ambiguity and signals the V3 redesign |
| App display name | **MyVitrine** | Continuity with existing App Store + Play listings; 100+ installed users + 7 reviewers know this name |
| `app.json` `name` | `MyVitrine` (changing from `vitrinev0`) | Matches display |
| iPad support | **No** (`supportsTablet: false`) | PWA will handle tablet; native = focused mobile experience |
| Privacy declaration update | Deferred to pre-submission | App Store Connect questionnaire, ~45 min |
| Existing `Unlimited` $4.99 IAP | **Remove cleanly at v3.0.0 submit** | Confirmed zero purchases — vestigial product from previous developer |
| RevenueCat / subscription wiring | **Deferred to v3.1.0** | v3.0.0 ships as free upgrade; subscriptions land in subsequent release per `pricing-model.md` + `subscription-architecture.md` |
| Apple Developer team access | ✓ Confirmed (John is co-founder) | No team invite needed |

---

## Blocking items

### All credentials confirmed (2026-05-13)

- ✓ **iOS bundle ID:** `com.vitrine` (confirmed from App Store Connect → App Information)
- ✓ **Android package name:** `com.vitrine.mobile` (confirmed from existing Play Store listing URL)
- ✓ **Apple Team ID:** `3RFDYDWUUV`
- ✓ **Apple ID (admin):** `john@myvitrine.app`
- ✓ **Apple App Store ID:** `6451114604`
- ✓ **SKU:** `VIT0001`
- ✓ **Marketing domain:** `myvitrine.app` (live, redesign in progress)
- ✓ **Apple Developer team:** MyVitrine, LLC (Francesco Mazza primary; John has Admin access as co-founder)

---

## Asset readiness

All four production assets verified ship-ready as of 2026-05-11:

| File | Dimensions | Format | Notes |
|------|-----------|--------|-------|
| `assets/icon.png` | 1024 × 1024 | Opaque PNG, square corners | Ship-ready ✓ |
| `assets/adaptive-icon.png` | 1024 × 1024 | Transparent PNG, mark inside 672×672 safe zone | Ship-ready ✓ |
| `assets/splash-icon.png` | 1500 × 2667 (9:16) | Opaque dark | Ship-ready ✓ (will adjust `app.json` `splash.backgroundColor` to `#020202` to match) |
| `assets/favicon.png` | 512 × 512 | Opaque | Ship-ready ✓ |

**Optional iOS 18+ variants** (not required for v3.0.0, polish for later):
- `icon-dark.png` — explicit dark-mode variant (current icon is already dark, may be redundant)
- `icon-tinted.png` — grayscale-on-transparent for iOS 18 user-tinted icons
- `adaptive-icon-monochrome.png` — Android 13+ themed icons (white silhouette on transparent)

---

## Existing app context (MyVitrine v1.0.12)

### iOS App Store
- Listing URL: https://apps.apple.com/us/app/myvitrine/id6451114604
- App Store ID: `6451114604`
- Current version: 1.0.12 (last updated 09/29/2025)
- Devices: iPhone-only ("Not verified for macOS")
- iOS minimum: 13.4 (will jump to 15.1+ with Expo SDK 54)
- Ratings: 7 (5.0 average)
- Existing IAP: "Unlimited" $4.99 — zero sales — to be removed at v3.0.0 submit
- App Privacy declaration: "Data Not Collected" — incorrect, must be updated at v3.0.0 submit
- Privacy/ToS URLs: termsfeed.com / privacypolicies.com boilerplate — must migrate to first-party `myvitrine.app/privacy` + `/terms`
- Content rating: 18+ (likely overstated; align to ~12+/17+ for v3.0.0)
- Description copy: outdated, references unbuilt features (Buy/Sell/Trade) — must rewrite for v3.0.0

### Google Play Store
- Listing URL: https://play.google.com/store/apps/details?id=com.vitrine.mobile
- Package name: `com.vitrine.mobile`
- Last updated: Sep 24, 2025
- Downloads: 100+
- Content rating: Everyone (likely understated; align to Teen for v3.0.0)
- Same boilerplate Privacy/ToS URLs and outdated description
- Developer entity: Myvitrine, LLC (frank@myvitrine.app)

### Bundle ID strategy
- Android: keep `com.vitrine.mobile` to maintain Play listing continuity
- iOS: must match whatever is currently registered in App Store Connect for app `6451114604`
- Current `app.json` has `com.vitrine.app` for both platforms — both likely wrong for the production listings

---

## Domain context — `myvitrine.app`

Marketing site is live (older aesthetic, redesign in progress). The following endpoints are needed before TestFlight / App Store submission and are **currently 404**:

| URL | Purpose | Required for |
|-----|---------|--------------|
| `https://myvitrine.app/.well-known/apple-app-site-association` | iOS Universal Links domain verification | Deep links from shared URLs working in production |
| `https://myvitrine.app/.well-known/assetlinks.json` | Android App Links domain verification | Same, on Android |
| `https://myvitrine.app/privacy` | Privacy policy | App Store + Play Store listing requirement |
| `https://myvitrine.app/terms` | Terms of service | Best practice |

### Apple AASA file template (replace `YOURTEAMID` with real value, `BUNDLEID` with confirmed bundle ID)

Served as `application/json`, no file extension:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["YOURTEAMID.BUNDLEID"],
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

### Android assetlinks.json template (SHA-256 fingerprint comes from EAS after first Android build)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vitrine.mobile",
      "sha256_cert_fingerprints": ["<EAS-generated cert SHA-256>"]
    }
  }
]
```

### Privacy / Terms content sources
- `content/privacy-policy.md` — first-party privacy policy (already in repo)
- `content/terms-of-service.md` — first-party terms (already in repo)
- These need to be rendered as web pages on the marketing site at `/privacy` and `/terms`

---

## Pre-build action plan — COMPLETED 2026-05-13

All steps below were executed on 2026-05-13 in a single session:

### 1. `app.json` updates

```diff
{
  "expo": {
-   "name": "vitrinev0",
+   "name": "MyVitrine",
-   "slug": "vitrinev0",
+   "slug": "myvitrine",
-   "version": "1.0.0",
+   "version": "3.0.0",
    ...
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
-     "backgroundColor": "#05050d"
+     "backgroundColor": "#020202"
    },
    "ios": {
-     "supportsTablet": true,
+     "supportsTablet": false,
-     "bundleIdentifier": "com.vitrine.app",
+     "bundleIdentifier": "com.vitrine",
+     "buildNumber": "1",
      ...
    },
    "android": {
      ...
-     "package": "com.vitrine.app",
+     "package": "com.vitrine.mobile",
+     "versionCode": 1,
      ...
    },
+   "extra": {
+     "eas": {
+       "projectId": "e6910937-7d1c-4d59-9785-7b1d311a5378"
+     }
+   }
  }
}
```

The `extra.eas.projectId` is generated when running `eas init` — captured automatically.

### 2. New file: `eas.json` (proposed structure)

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_STREAM_API_KEY": "$EXPO_PUBLIC_STREAM_API_KEY"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_STREAM_API_KEY": "$EXPO_PUBLIC_STREAM_API_KEY"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_STREAM_API_KEY": "$EXPO_PUBLIC_STREAM_API_KEY"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "john@myvitrine.app",
        "ascAppId": "6451114604",
        "appleTeamId": "3RFDYDWUUV"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

Notes:
- `autoIncrement: true` on production handles build number bumping automatically
- Apple Team ID is a 10-char alphanumeric string from developer.apple.com → Membership
- Google Play submit uses a service account JSON key file — generated from Play Console → Settings → API access. Not needed until Android submission begins
- `EXPO_PUBLIC_SENTRY_DSN` will be added to `env` blocks when Sentry is installed in Phase 2

### 3. Install command

```bash
npx expo install expo-dev-client
```

### 4. EAS secret migration commands

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "<value from .env>" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<value from .env>" --type string
eas secret:create --scope project --name EXPO_PUBLIC_STREAM_API_KEY --value "<value from .env>" --type string
```

The local `.env` stays for development; EAS reads from secrets at build time.

### 5. Memory updates (rules + DO_NOT_BREAK)

- **`.cursor/rules/expo-release-guardrails.mdc`**
  - Strike "Development happens in Expo Go until feature-complete" language
  - Strike "Do not introduce `expo-dev-client`" prohibition
  - Add: "EAS dev client is the active development environment. Native modules can be added freely; rebuild via `eas build --profile development` when adding native deps."
  - Update `name` reference from `vitrinev0` → `MyVitrine`
  - Update `bundleIdentifier` reference to confirmed value
- **`docs/ai-context/DO_NOT_BREAK.md`**
  - Strike "Keep Expo Go compatibility" line
  - Add: "Test changes in EAS dev client; native dep additions require `eas build --profile development` rebuild"
- **`docs/ai-context/CURRENT_STATE.md`**
  - Add section noting v3.0.0 is the production target and EAS dev client is the dev environment
- **`docs/ai-context/DECISION_LOG.md`**
  - Add entry: "Migrate from Expo Go to EAS dev client" with date and reasoning
- **`docs/ai-context/HANDOFF.md`**
  - Update with EAS migration status

---

## First dev build sequence — COMPLETED 2026-05-13

All steps executed successfully:

1. ✅ `eas init --force` → created `@jlocastostack/myvitrine`, project ID `e6910937-7d1c-4d59-9785-7b1d311a5378`
2. ✅ `eas secret:create` × 3 → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_STREAM_API_KEY`
3. ✅ `eas build --platform ios --profile development` → cloud build succeeded
   - Apple PLA agreement required (accepted by Frank's account)
   - John's Admin access needed "Access to Certificates, Identifiers & Profiles" checkbox (enabled)
   - New Apple Distribution Certificate generated
   - Device registered (UDID: `00008140-00167D1202E3001C`)
   - Ad-hoc provisioning profile created
4. ✅ Dev client installed on iPhone → Developer Mode enabled
5. ✅ `npx expo start --dev-client` → Metro connected at `http://192.168.4.22:8081`
6. ✅ App launched, profile hub rendered, Fast Refresh confirmed

JS/TSX changes hot-reload identically to Expo Go. Rebuilds only required when adding native modules.

---

## Phase 2 — Native modules (after dev client is running)

Order of operations, each adds ~15 min cloud rebuild:

1. ~~**`@sentry/react-native`**~~ — **INSTALLED 2026-05-13.** Production crash visibility live. SDK wired with `Sentry.wrap()` on root layout, source map uploads via `@sentry/react-native/expo` plugin, DSN + auth token as EAS secrets. Dashboard: `https://myvitrine-llc.sentry.io/projects/react-native/`.
2. **`expo-notifications`** — OS-level push (lockscreen banners). Stream Chat + Feeds already have webhook hooks server-side; just need device token registration + permission prompt.
3. **`react-native-keyboard-controller`** — modern keyboard handling. Migration plan already documented in `future-ideas.md`.

Each can be a separate dev build cycle or batched into one. RevenueCat SDK is **NOT** in this phase — deferred to v3.1.0 per the subscription architecture.

---

## Pre-TestFlight requirements

Anything below blocks distribution to internal testers via TestFlight, but does NOT block dev client iteration:

- [ ] All Phase 2 native modules installed (or deliberate decision to ship without)
- [ ] First-party `myvitrine.app/privacy` and `/terms` pages live — **owned by Vitrine Web team** per `docs/VITRINE_WEB_PLAN.md` Stream 2 (Marketing redesign)
- [ ] App Privacy declaration filled out correctly in App Store Connect
- [ ] Apple AASA file served at `myvitrine.app/.well-known/apple-app-site-association` (Universal Links) — **owned by Vitrine Web team** during Stream 1 (Foundation). After EAS first build completes, send the iOS Team ID + bundle ID to web team so they can populate the file.
- [ ] Android assetlinks.json served at `myvitrine.app/.well-known/assetlinks.json` (App Links) — **owned by Vitrine Web team**. After EAS first Android build completes, send the SHA-256 cert fingerprint to web team.
- [ ] Verify deep linking works end-to-end with a real shared URL
- [ ] Internal tester list configured in App Store Connect

---

## Pre-App-Store-submission requirements

Anything below blocks the v3.0.0 production submission:

- [ ] All pre-TestFlight items above
- [ ] App Store listing copy rewritten to match v3.0.0 functionality (current copy describes unbuilt features)
- [ ] Play Store listing copy rewritten similarly
- [ ] Content rating questionnaires re-run on both stores (current iOS 18+ overstated, Android Everyone understated; target ~12+/17+ on iOS, Teen on Android)
- [ ] App Store screenshots captured for v3.0.0 UI (6.7" Pro Max minimum, ideally 6.5" Plus too)
- [ ] Play Store screenshots captured for v3.0.0 UI
- [ ] App preview video (optional but boosts conversion)
- [ ] Demo account credentials prepared for Apple reviewers (OTP-based auth is hard for reviewers; pre-create a test account they can use)
- [ ] Existing `Unlimited` $4.99 IAP product removed from App Store Connect
- [ ] App Store Connect "What's New" copy for the v3.0.0 update written
- [ ] Privacy / contact email updated in App Store Connect (`support@myvitrine.app` already correct)

---

## Subscription deferral note

Per `c:\Users\johnj\vitrinedb\docs\pricing-model.md` and `c:\Users\johnj\vitrinedb\docs\subscription-architecture.md`:

- v3.0.0 ships as **free** (no tier gating, no paywall, no payment processing)
- v3.1.0 introduces the three-tier subscription model (Free / Pro $9.99 / Collector $24.99) via web-only Stripe through RevenueCat Billing
- RevenueCat SDK install (`react-native-purchases` configured for entitlement reads, no IAP) belongs in the v3.1.0 cycle
- App Store review for v3.0.0 should expect to see no IAP and no in-app subscription UI — clean and uncomplicated

---

## Estimated time investment

| Phase | Active work | Wait time |
|-------|------------|-----------|
| Pre-build setup (when credentials arrive) | ~90 min | n/a |
| First iOS dev build | ~5 min trigger | ~15-20 min cloud build |
| Phase 2 native modules | ~30-60 min per module | ~15 min rebuild per |
| Pre-TestFlight (well-known files, marketing site updates, privacy declaration) | ~3-5 hours | n/a — depends on marketing site work |
| First TestFlight upload | ~5 min trigger | ~15-20 min build + ~10 min Apple processing |
| Pre-App-Store-submission tasks | ~4-6 hours | n/a — listing copy, screenshots, content rating |
| App Store review | n/a | 24-72 hours typical |
| **Total to v3.0.0 in App Store** | **~10-15 active hours** | **~1-2 weeks elapsed** |

---

## Key references

- `assets/` — production icons + splash (verified 2026-05-11)
- `app.json` — current Expo configuration
- `metro.config.js` — Metro bundler config (includes `@supabase/functions-js` empty-resolve workaround for Hermes)
- `babel.config.js` — Babel preset (vanilla, just `babel-preset-expo` + Reanimated plugin)
- `lib/sentry.ts` — Sentry scaffold awaiting SDK install
- `lib/api/extraction.ts` — example of the direct-fetch pattern used to bypass Hermes/`supabase.functions.invoke()` incompatibility
- `content/privacy-policy.md` + `content/terms-of-service.md` — first-party legal copy for marketing site
- `c:\Users\johnj\vitrinedb\docs\pricing-model.md` — v3.1.0+ subscription tier definitions
- `c:\Users\johnj\vitrinedb\docs\subscription-architecture.md` — v3.1.0+ billing rails
- `docs/ai-context/CURRENT_STATE.md` — current product state
- `docs/ai-context/DO_NOT_BREAK.md` — current critical constraints (updated 2026-05-13)
- `.cursor/rules/expo-release-guardrails.mdc` — current release rules (updated 2026-05-13)

---

## Pickup instructions for next session

Phase 1 is complete. The next session should:

1. Pick which Phase 2 native modules to install (Sentry, push notifications, keyboard-controller — can batch or do individually)
2. Install packages via `npx expo install <package>`
3. Add any required `app.json` plugin entries
4. Run `eas build --platform ios --profile development` to rebuild with native modules
5. Validate on device
6. When ready for TestFlight, work through the pre-TestFlight checklist above

### Credentials reference (for future builds)
- **EAS account:** `@jlocastostack` (john@myvitrine.app)
- **EAS project:** `@jlocastostack/myvitrine` (ID: `e6910937-7d1c-4d59-9785-7b1d311a5378`)
- **Apple Team:** MyVitrine, LLC (`3RFDYDWUUV`)
- **Apple ID (admin):** `john@myvitrine.app`
- **iOS bundle ID:** `com.vitrine`
- **Android package:** `com.vitrine.mobile`
- **App Store ID:** `6451114604`
- **Device UDID:** `00008140-00167D1202E3001C`
- **Apple session cached at:** `C:\Users\johnj\.app-store\auth\john@myvitrine.app\cookie`

---

## Open questions (parking lot)

These don't block the EAS build itself — surface and resolve when each becomes relevant:

- App display name confirmed as "MyVitrine" — but should we use App Store Connect's subtitle field for "Where Collections Come Alive" or similar tagline?
- iOS version target: SDK 54 minimum is iOS 15.1. Current MyVitrine v1.0.12 targets iOS 13.4. Anyone on iOS 13/14 will not get the v3.0.0 update. Acceptable?
- App Store reviewer demo account: which test user gets used? Recommend creating a dedicated reviewer account not used for development.
- Push notification permission flow: when does it prompt? On first launch? On first notification trigger? On settings opt-in? (Best practice: contextually, e.g., "let us notify you when comp alerts fire").
- TestFlight tester group: who's the initial internal testers list? Just John, or wider circle?
