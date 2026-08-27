# Implementation Log

Last updated: 2026-08-27
Last verified: 2026-08-27

## 2026-08-27 — Drop unused `user_category_interests` (prod applied)

- Summary: Table had no native/web/API/edge/SQL callers. 6 rows, all `jdotstrange`, 2026-01-15 (baseball/basketball jersey/ball/hat). Sibling quiz tables were dropped 2026-05-10; this one was left behind. Network “Shared interests” comes from collectible overlap, not this table. Future algo work should start from inventory, not this schema.
- Change: `DROP TABLE public.user_category_interests`. Removed generated type from `@vitrine/types`.
- Files: `supabase/migrations/20260827150214_drop_user_category_interests.sql`, `packages/types/src/database.ts`
- Git: branch `chore/drop-user-category-interests`. Applied live via MCP on `fxmiongkckkrllgyfwyw`. No OTA.
- Validation: `to_regclass('public.user_category_interests')` is null. No app smoke needed (zero callers).

## 2026-08-27 — Security Wave 2: path-bind storage object policies (prod applied)

- Summary: Client storage writes were bucket-only (anyone logged in could upload into any folder on `collectible-images` / `message-attachments`). `user-avatars` had no write policies, so `upsert: true` failed RLS (Sentry). Collectible DELETE compared folder[1] to `auth.uid()`, which never matches `public.users.id` (0/878 rows).
- Change: `current_profile_id()` + `owns_collectible()` helpers. INSERT/UPDATE/DELETE on `collectible-images` and `user-avatars` require `{profileId}/…`. Extra DELETE policy for `migrated/{collectible_id}/…` when the caller owns the collectible. Message-attachment client writes path-bound; `media-upload` edge still uses service_role. Public SELECT added for avatars and category thumbnails. `brand-assets` unchanged (read-only).
- Files: `supabase/migrations/20260827140913_lock_storage_object_policies.sql`
- Git: branch `fix/security-storage-policies`. Applied live via MCP on `fxmiongkckkrllgyfwyw`. No app JS, no OTA.
- Validation: 15 storage.objects policies present; anon cannot EXECUTE the helpers; authenticated can. **Founder preview smoke 2026-08-27:** photo upload + avatar upsert (previously un-updatable) both work.

## 2026-08-27 — Admin Slice 1 spec locked (no code)

- Summary: Founder accepted vault census as Slice 1. Collectors = ≥1 published collectible; Accounts = all `public.users`; calendar `America/New_York`; range control Today/7d/30d/YTD/All with prior-period deltas. Screens: Overview (KPIs, activation, top collectors, health counts), People + user detail, Catalog + item detail, Browse-by on type/category/`filter_traits`. Auth shell included. Out of scope: DAU, LG retry queue, writes, `admin_users`.
- Files: `docs/ai-context/ADMIN_SLICE_1.md`, DECISION_LOG, OPEN_THREADS, CURRENT_STATE, HANDOFF.
- Git: docs only.
- Validation: n/a (spec lock). Live aggregates used to choose definitions (878 accounts / 41 collectors / ~12k published).
- Notes: Implement on `feat/admin-portal` when kicked. Admin RPCs must follow Wave 1 DEFINER discipline (staff + AAL2, no anon EXECUTE).

## 2026-08-27 — Security Wave 1: lock dangerous SECURITY DEFINER RPCs (prod applied)

- Summary: First remediation wave from the Aug 6 app-DB security audit. Remaining client-callable DEFINER holes after the Card Hedge purge: anyone with the anon/authenticated key could rewrite any collectible’s photos, dump Firebase image URLs, unschedule pg_cron jobs, or create DMs / read unread counts as arbitrary user ids. Trigger helpers were also exposed on `/rest/v1/rpc`.
- Change: `update_collectible_photos` + `get_firebase_image_collectibles` now require `auth.role() = 'service_role'` and EXECUTE is revoked from anon/authenticated (sole caller is `migrate-images`). `unschedule_if_exists` revoked from clients; postgres/service_role kept. `get_or_create_dm` / `get_unread_count` require `auth.uid()` to be a participant; anon EXECUTE revoked. Trigger functions (`handle_new_auth_user`, `touch_collectibles_changed`, `update_follow_counts`, `update_showcase_counts`) raise if `TG_NAME IS NULL` (blocks RPC, keeps triggers). `search_path` pinned on all of the above.
- Files: `supabase/migrations/20260827134743_lock_dangerous_definer_rpcs.sql`
- Git: branch `fix/security-definer-rpcs` (undo record). Applied live via MCP `apply_migration` on project `fxmiongkckkrllgyfwyw` (preview and production share this DB). No app JS change, no OTA.
- Validation: post-apply `has_function_privilege` — anon EXECUTE false on all nine; authenticated false on photos/firebase/unschedule/auth-user trigger; `supabase_auth_admin` + `authenticator` still EXECUTE on `handle_new_auth_user`; postgres still EXECUTE on `unschedule_if_exists`. Device smoke still needed (OTP, follow, showcase, catalog).

## 2026-08-27 — Admin portal architecture locked (no code)

- Summary: Durable lock for a separate `@vitrine/admin` Next.js app at `admin.myvitrine.app`. Invite-only `staff_members` + `@myvitrine.app`, email OTP then mandatory authenticator-app TOTP (Supabase AAL2; Google Authenticator / Duo Mobile as TOTP clients — not Duo SSO). Host-only cookies, local sign-out only, no `is_admin` on `public.users`, no collector RLS widening. **Phone and desktop are equal surfaces.** **Apple HIG (`apple-hig-designer`) is the design authority** for admin UI — V3 vault/playbook and Electrolize/frost chrome stay off this app. Slice 1 later specced in `ADMIN_SLICE_1.md`.
- Files: `docs/ai-context/{DECISION_LOG,OPEN_THREADS,ARCHITECTURE,MONOREPO,DATA_MODEL,DO_NOT_BREAK,CURRENT_STATE,HANDOFF,QUICK_REFERENCE,DESIGN_SYSTEM}.md`, `.cursor/rules/{admin-hig.mdc,design-system-playbook.mdc}`.
- Git: docs only.
- Validation: n/a (decision lock).
- Notes: Production Supabase is shared; `staff_members` migration will hit real data when Slice 1 starts.

## 2026-08-14 — Android-first compat adapters (branch `feat/android-first-compat`, APK not cut)

- Summary: Pre-APK QA of the iOS-only-tested native app. No second codebase — OS-seam adapters only. **(1)** `materializeLocalImageUri` in `lib/image-utils.ts` — `file://` returns as-is (iOS); `content://` copied via ImageManipulator into cache. Wired into upload picker, messaging attach, attachment-picker. `uploadImage` still requires `file://`. **(2)** `shareContent()` puts the link in `message` so Android Share sheets include it; iOS still gets `url`. Showcase, profile, collectible, detail-footer. **(3)** Upload discard Alert moved onto `usePreventRemove` so X, stack pop, and Android hardware back share one confirm. **(4)** `expo-clipboard` + `copyToClipboard` helper; QR modal, detail footer, message copy, group invite. **(5)** Settings delete Modal `onRequestClose` + BackHandler for Change Email overlay. **(6)** `expo-image-picker` plugin `microphonePermission: false` (no unused RECORD_AUDIO). **`runtimeVersion`: `"3"`.**
- Files: `apps/native/app.json`, `apps/native/package.json`, `lib/{image-utils,share-content,clipboard}.ts`, `upload-entry.tsx`, share/clipboard/settings/messaging call sites.
- Git: branch `feat/android-first-compat`. **Not merged, no EAS build, no OTA.**
- Validation: `read_lints` clean on touched files. No device test.
- Notes: Do not `eas update --channel preview` onto runtime-`2` iOS. Next: founder check-in, then preview Android APK.

## 2026-08-08 — Looking Glass AI_FORMAT_ERROR incident: diagnose, fix, deploy (vitrinedb engine)

- Summary: Diagnosed and fixed production extraction failures surfacing as `AI_FORMAT_ERROR` / user-facing "unreadable image." Root cause: `gemini-3-flash-preview` stochastically omitted the seven universal filter-trait keys (`subject`, `franchise`, `item_type`, `maker`, `serial_number`, `year`, `special_finish`) from `fields` or emitted them top-level; strict Zod validator discarded otherwise-valid extractions. ~34 jobs failed Aug 4–7 (peak 26.6% of all jobs Aug 4). No engine deploy since Jul 9 — preview-model drift compounded by Frank's autograph-card batch (autograph overlay makes traits look redundant to the model). Raw model outputs recovered from Railway worker logs. **Fix:** (a) deterministic repair pass before Zod validation — hoists top-level filter traits into `fields` (top-level values also rescue nested nulls), backfills missing traits with defaults; (b) placement rule added to unified extraction prompts only (discovery prompts excluded after review catch); (c) `AI_FORMAT_ERROR` forensics (zod paths + raw prefix, sized to 500-char attempt-detail RPC cap) persisted to `attempt_history`.
- Repo / deploy: lookingglassAI (`C:\Users\johnj\vitrinedb`), commit `942f4d2` pushed to `main`, Railway worker auto-deployed successfully ~9:57 PM ET.
- Validation: 133 engine tests pass. Live verified — founder re-uploaded previously-failing Blake Mazza SAGE autograph card via `john@myvitrine.app`, extracted cleanly in ~16s (job `d176e240`).
- Notes: **MyVitrine app code unchanged this session** (docs-only here). `extract-asset` edge function deploy **blocked** — `SUPABASE_ACCESS_TOKEN` in `vitrinedb/.env.local` returns 401 (expired PAT). Only affects sync HTTP path; production queue path (Railway worker) is deployed. Unblock: fresh PAT → `npx supabase functions deploy extract-asset --project-ref nhshzyktaarbknzpsvtr --no-verify-jwt`. **Open threads logged:** bullion/coins classifier false-rejects (decision pending on first-class category), Google Vision pre-pass (parked), app-side `AI_FORMAT_ERROR` → "unreadable image" copy still misleading if it ever fires (`supabase/functions/_shared/engine-mapping.ts` + `upload-entry.tsx`). Watch format-error rate 1–2 days post-deploy (expect ~0).

## 2026-08-06 — Phase 1 shipping discipline (process, not code)

- Adopted trunk-based + gated promote: short-lived PRs into `main`, OTA **preview first**, production only after founder soak. Preview/production still share the same Supabase + Stream (code soak, not data sandbox).
- Added always-on Cursor rule `.cursor/rules/shipping-discipline.mdc`; tightened `ota-update-discipline.mdc` with the hard preview-first rule.
- GitHub branch protection on `main` is the remaining founder step (requires `gh auth login` — CLI was installed this session but not authenticated). Target: require a pull request before merging to `main`.

## 2026-07-29 (fourth pass) — OTA verification stamp in Settings footer

- Founder request: a visible marker to confirm a production OTA actually applied on-device. Added a second footer line under "Vitrine v3.0.0" on `app/settings/index.tsx`: `Last updated: <publish time> · <short update id>`, sourced from `expo-updates` runtime constants (`Updates.createdAt`, `Updates.updateId`, `Updates.isEmbeddedLaunch`). Shows "embedded build" when running the binary's bundled JS (no OTA applied, or dev client). No manual maintenance — the stamp always reflects the update the launch is actually running, and the short ID cross-checks against the EAS dashboard.
- OTA-safe: `expo-updates` is already a native dep in the binary; this is JS-only consumption of its constants.

## 2026-07-29 (third pass) — Photo add/remove silently dropped: nested setState inside setPhotos updaters

- Founder retest after the gridKey OTA: adds after the first still don't appear, AND **remove doesn't work either** (reorder does). That killed the grid-only theory — remove is pure state with no drag-library involvement. The discriminator: reorder is the only photo mutation that calls `setPhotos(next)` directly; `appendPhotos` and `removePhoto` both dispatched `requestPhotoUpdate(next)` → `setPhotos(next)` from **inside a `setPhotos((current) => …)` updater** that then returned `current` unchanged.
- Mechanism: React (19.x under RN 0.81) eagerly evaluates a functional updater synchronously inside the dispatch when the fiber has no pending work. The nested `setPhotos(next)` enqueues the real update during that evaluation; the outer dispatch then sees the updater returned the identical state, marks it an eager no-op, and enqueues it after the real update with the OLD state cached — the queue applies `next`, then the old state back on top. Net zero. When the fiber has pending work (first interaction after mount), the eager path is skipped and the update survives — hence "first add works, everything after silently no-ops, reorder always works."
- Fix: `appendPhotos` and `removePhoto` now compute from the `photos` closure and dispatch once via `requestPhotoUpdate` — no updater, no nesting. Closure freshness is safe: both run from picker/tap handlers and nothing else can mutate photos while the OS picker is up.
- The 2026-07-29 gridKey remount fix in `PhotoReorderGrid` remains necessary — it was the second-layer rendering bug, unexercised because state never changed underneath it.
- Same landmine spotted (NOT fixed, out of scope): `tracking-hub.tsx:170` nests `setItems` inside a `setTrackingIds` updater. Logged in OPEN_THREADS.
- Files changed: `apps/native/components/upload-entry.tsx`, `docs/ai-context/{IMPLEMENTATION_LOG,DO_NOT_BREAK,OPEN_THREADS}.md`.
- Validation: `read_lints` clean; `tsc --noEmit` shows only the 4 pre-existing `upload-entry.tsx` errors. Not yet device-verified — founder retest pending (cold restart ×2 required for OTA pickup).

## 2026-07-29 (later) — Photos added one at a time were invisible (PhotoReorderGrid remount)

- Symptom (founder device test, post-OTA): add a single photo, and no further photo can be added from either the camera or library path. Only workaround was deleting the lone photo and re-adding everything as one multi-select batch.
- Root cause is in `react-native-reanimated-dnd`, not our picker code. `useGridSortable` snapshots the item's slot **once on first render** (`initialPositionRef` reads `positions.get()[id]`, falling back to `{x:0, y:0}`). The parent's `useGridSortableList` effect that adds the new id to the positions map runs *after* the child mounts, so an item appended to an already-mounted grid initializes at slot 0. The reaction that would correct it is guarded on `previousPosition !== null && previousPosition !== undefined`, so it skips the `undefined → value` transition and never applies the real position. Net effect: photo 2 renders pinned on top of photo 1. **Display only — both photos were in state and would upload.** The batch workaround worked because `PhotoReorderGrid` only renders `SortableGrid` when `photos.length > 0`, so emptying the grid unmounts it and a batch add remounts with every id already in the map.
- Fix: `gridKey` (sorted photo ids, joined) as `key` on `SortableGrid` in `components/vault/photo-reorder-grid.tsx`. Add/remove changes the set → clean remount with a populated position map; drag-reorder keeps the same set → no remount, so the drop spring is never interrupted. Contained in the primitive, so every current and future consumer inherits it.
- Rejected: `patch-package` on the library's null guard. It is the more correct repair but adds a postinstall step plus a patch file to re-verify on every dnd bump — permanent maintenance for something one line at our call site neutralizes.
- Files changed: `apps/native/components/vault/photo-reorder-grid.tsx`, `docs/ai-context/{IMPLEMENTATION_LOG,DO_NOT_BREAK}.md`.
- Validation: `read_lints` + `tsc --noEmit` clean for the touched file. Diagnosis is from reading the library's compiled `useGridSortable.js` / `useGridSortableList.js`; **not yet confirmed on device.**

## 2026-07-29 — Upload photo pipeline: REACT-NATIVE-12 (`validatePath`) root cause + fix

- Summary: Sentry `REACT-NATIVE-12` (262 events / 8 users, `FunctionCallException: validatePath` at `image-utils.ts:15`) traced to **edit mode**, not Live Photos. `expo-file-system`'s `File` throws when `!url.isFileURL || url.hasDirectoryPath` (`FileSystemFile.swift:48`). Edit mode seeds `photos` with Supabase `https://` storage URLs via `photosFromUrls`, and the speculative-upload effect had **no `isRemotePhotoUri` guard** — so it ran `new File("https://…")`. Its `.catch` deleted the cache entry, which let the effect re-fire every render (permanent retry loop, hence the event volume from few users). Fixes: (1) remote guard + `speculativeAttemptedRef` set so the effect kicks each photo at most once while `resolveSpeculativeUrls` (user-triggered Analyze) can still retry; (2) `isLocalFileUri` guard in `readUriAsArrayBuffer` so a bad URI throws a **named error containing the URI** instead of an opaque native exception; (3) `compressImage` no longer passes an unreadable source through on manipulator failure — original-URI fallback is allowed only when the original is itself a `file://` path; (4) picked assets gated on being local files (rejects logged with uri/type/mimeType, user sees an alert); (5) picker throws are no longer swallowed — both camera and library now alert instead of leaving the grid silently unchanged.
- Live Photos investigated per founder report: **already normalized by the picker.** `MediaHandler.swift` sends a Live Photo down the plain-image path when only `mediaTypes: ['images']` is requested — iOS hands over the still frame, expo writes a JPEG to cache at our `quality: 0.85`. Every branch returns a `file://` cache URL. Deliberately **did not** opt into `livePhotos`: that returns the original uncompressed frame (quality ignored by design, so it can re-pair with the video) plus a paired video file, pushing full-res downsizing onto us on the memory-starved devices where this fails (crash event device: iPhone SE 3rd gen, 38 MB free). Rationale is comment-documented at the call site so it doesn't get "fixed" later.
- The founder-reported Live Photo symptom is most likely the swallowed picker failure (decode throw under memory pressure → nothing appeared, no feedback), now surfaced by fix (5).
- Files changed: `apps/native/lib/image-utils.ts`, `apps/native/components/upload-entry.tsx`, `docs/ai-context/{IMPLEMENTATION_LOG,DO_NOT_BREAK,OPEN_THREADS,HANDOFF}.md`.
- Validation: `read_lints` clean on both touched files; `tsc --noEmit` shows only the 4 pre-existing `upload-entry.tsx` errors (`SPACING.xl` ×3, `dimmed` style union) — unchanged by this wave. **No device test** — edit-flow photo path and the two new alerts are unvalidated on hardware.
- Notes: JS-only, `runtimeVersion` stays `"2"` (OTA-eligible). Remaining gap: `edit-info-modal.tsx`, `trading-card-details-form.tsx`, and the messaging pickers still pass raw picker URIs without the local-file gate (they now fail with a named error rather than crashing). Edge case left standing: if `manipulateAsync` fails on a local HEIC, `compressImage` uploads the HEIC bytes unconverted.

## 2026-06-24 — Web lander: anchor nav, slim footer, dynamic Looking Glass theater

- Summary: Continued single-page lander (`/`) polish for launch. **(1) Scroll-anchor nav** — `SITE_NAV_LINKS` in `constants.ts` shared by `SiteNav` + `MobileNav`: Product → `/#features`, Looking Glass → `/#intelligence`, Explore → `/#explore`; dropped Pricing + pathname active state; CTA stays `/#download`. **(2) Removed Sign in** from desktop + mobile nav ( `/login` route untouched ). **(3) Footer slimmed** — removed four-column `FOOTER_COLUMNS`; logo + tagline + Privacy Policy (`/privacy`) + Terms of Service (`/terms`) only. **(4) Dynamic Looking Glass theater** — new `intel-showcase.ts` maps `collectibles` extraction fields (`ai_metadata`, `trait_metadata`, `field_schema`, traits, photos); `page.tsx` fetches top-scored public completed extractions from `@fmazza821` (shuffle 8 per load); `IntelligenceSection` rotates showcase every 4.8s with real photos + generic field rows; Luis Robert mock fallback if empty; stat bar removed. VAR/AAR/Pulse tiles left static v1.
- Files changed (uncommitted on `main` at handoff):
  - `apps/web/lib/marketing/constants.ts` — `SITE_NAV_LINKS`; deleted `FOOTER_COLUMNS`.
  - `apps/web/lib/marketing/intel-showcase.ts` (new) — mapper, scorer, `MOCK_INTEL_SHOWCASE`.
  - `apps/web/components/marketing/sections/{SiteNav,MobileNav,Footer,IntelligenceSection}.tsx`.
  - `apps/web/components/marketing/MarketingSite.tsx` — `intelShowcases` prop.
  - `apps/web/app/page.tsx` — `getFrankIntelShowcases()` parallel with explore fetch.
- Git: not committed this session (working tree only). Recent native commits on `main`: `fc56018` (other-profile crash), `1f07381` (cold-start boot), `1be15d7` (App Review login).
- Validation: `read_lints` clean on touched web files. Full `tsc` not run on web-only delta; repo has pre-existing errors elsewhere. No browser/device test, no deploy.
- Notes: Intel pool quality depends on Frank vault extraction richness; weak rows filtered by score ≥ 6. `/intelligence`, `/product`, `/pricing` deep pages still exist — route gating / hero screenshot refresh / TestFlight CTA copy not in this wave.

## 2026-06-22 — Boot screen, unified auth V3, skeleton system reset, dark onboarding, OTP email templates (OTA + git) + battery audit

- Summary: Large catch-up wave. **(1) Void-continuous boot screen** — `vitrine-boot-screen.tsx` reuses the native splash PNG + `#020202` bg + contain layout (`lib/splash-contain-layout.ts`: `SPLASH_BG` / `SPLASH_SOURCE` / `getContainRect`), hides the native splash on mount, and shows only a volt progress hairline so the launch→app handoff never flashes. Wired into `app/index.tsx` (shows while `auth.isLoading`); splash hide deferred out of `app/_layout.tsx` into the boot component. **(2) Unified auth** — single `components/auth-screen.tsx` (email → 6-digit OTP, no passwords, `shouldCreateUser: true` both paths) replaces and **deletes** `login-page.tsx` + `signup-page.tsx`. Dark V3: `#020202` canvas, `brandVolt` CTAs, Matter-style email step, Endel-style OTP step (Mail icon in 100px volt ring), single `TextInput` with `oneTimeCode`/`autoComplete` for iOS autofill + auto-submit on 6 digits. `app/login/index.tsx` → `AuthScreen`; `app/signup/index.tsx` → redirect `/login`. **(3) Complete-profile** redone dark V3 (`useTheme()`, vault `Button`, `SPLASH_BG`, volt accents). **(4) Skeleton system overhaul** — new `components/skeleton/` barrel (`primitives`, `community`, `feed`, `market`, `messaging`, `stale-overlay`, `collectible-grid-layout`) on a shared pulse provider in `components/vault/skeleton.tsx`; new composed skeletons (`skeletons/collectible-detail`, `profile-hub`, `showcase-detail`, `tracking-overview`); deleted legacy `skeleton.tsx`, `skeleton-community.tsx`, `skeleton-messaging.tsx` and ~10 dead `skeletons/*`. **(5) Profile hub cache** — `lib/profile-hub-cache.ts` (45s TTL Map + invalidation listeners, consumed by `collector-profile.tsx`). **(6) Pro ship-dark** — `lib/pro-ship-dark.ts` + `components/vault/vitrine-pro-coming-soon-sheet.tsx` + `lens-paywall-card.tsx`; `PRO_SHIP_DARK` flag forces paywall on PULSE/VAR/AAR detail lenses. **(7) AAR no-signature variant** — `detail/lenses/aar-lens-no-signature.tsx`. **(8) Global `<KeyboardToolbar />` removed** from `app/_layout.tsx` (upload-entry keeps its own scoped `InputAccessoryView`). **(9) Supabase OTP email templates** (repo only, Dashboard paste manual — NOT OTA): `supabase/templates/auth/email-otp.html` (light theme, `{{ .Token }}` / `{{ .Email }}`), subject/plain/README, `supabase/scripts/upload-auth-email-icon.mjs`. Plus broad V3 theming touch-ups across community/market/tracking/detail/collector-profile. **(10) Battery-drain audit** performed (read-only, no code) — findings reported in chat; captured as OPEN_THREADS entry.
- Files changed (commit `a0bfd8d`, 81 files):
  - Boot: `components/vitrine-boot-screen.tsx`, `lib/splash-contain-layout.ts`, `app/index.tsx`, `app/_layout.tsx`.
  - Auth: `components/auth-screen.tsx` (new), `app/login/index.tsx`, `app/signup/index.tsx`, deleted `components/{login-page,signup-page}.tsx`, `app/complete-profile/index.tsx`, `nav-menu.tsx`, `.eslintrc.js`.
  - Skeletons: new `components/skeleton/*`, `components/skeletons/{collectible-detail,profile-hub,showcase-detail,tracking-overview}.tsx`, `components/vault/skeleton.tsx`; deleted `components/{skeleton,skeleton-community,skeleton-messaging}.tsx` + `components/skeletons/{connections,detail,edit-profile,group-info,inbox,notifications,profile,showcase,thread,tracking,upload}.tsx`.
  - Pro/detail: `lib/pro-ship-dark.ts`, `components/vault/vitrine-pro-coming-soon-sheet.tsx`, `components/vault/lens-paywall-card.tsx`, `detail/lenses/{aar-lens,aar-lens-no-signature,pulse-lens,var-lens}.tsx`, `collectible-detail-v3.tsx`, `showcase-detail-v3.tsx`.
  - Cache + misc theming: `lib/profile-hub-cache.ts`, `collector-profile.tsx`, `community-hub.tsx`, `community/*`, `market/{mosaic-grid,search-results}.tsx`, `tracking-hub.tsx`, `tracking-lenses/{overview,tracked}-lens.tsx`, `lib/api/collectibles.ts`, `package.json`, `docs/ai-context/OPEN_THREADS.md`.
  - Email: `supabase/templates/auth/{email-otp.html,email-otp-subject.txt,email-otp-plain.txt,README.md}`, `supabase/scripts/upload-auth-email-icon.mjs`.
- Git: `a0bfd8d` on `main`, **pushed** `a56590f..a0bfd8d` → `origin/main`.
- OTAs: `eas update --channel preview` — group `668da060-6c25-4a52-a8c7-1113117db615`, runtime `2`, iOS `019e90bb-3ce3-7552-b47c-9266a5ac82fd`, Android `019e90bb-3ce3-7d37-9e08-b5d042c7632d`, message `feat: boot screen, unified auth V3, skeleton reset, dark onboarding`. **Production channel NOT shipped** this session.
- Validation: git push + EAS export/upload/publish succeeded (both platforms bundled). Battery audit was read-only static analysis. No device soak, no `tsc`/test run this session.
- Notes: **Cold restart** (force-quit + reopen twice) required for preview OTA pickup. **Manual Supabase Dashboard steps pending:** paste `email-otp.html` into Authentication → Email Templates (Magic Link / OTP), and upload `apps/native/assets/icon.png` to Storage `brand-assets/logos/icon.png` (public) for the email logo. `supabase/.temp/*` excluded from commit. All changes were JS/assets only — `runtimeVersion` stayed `"2"` (OTA-eligible, confirmed against `ota-update-discipline` rule).

## 2026-06-02 — Edit collectible flow, provenance reconcile fix, OTA + git

- Summary: Shipped **owner edit collectible** end-to-end: route `app/collectible/[id]/edit.tsx` → `UploadEntry` `mode="edit"` with S0 snapshot, metadata-only vs LG photo-rerun fork (multiset detect, confirm modal, Reset photos), `custom_fields` editor on Review, `metadata_provenance` **Edited** chips on Specs lens, API paths `commitMetadataUpdate` / `commitReExtraction` (staging draft via `reextraction_of`). Migration `20260602120000_edit_collectible_custom_fields_provenance.sql` (`custom_fields`, `metadata_provenance`, `reextraction_of`). **Bugfix:** `computeMetadataProvenance` now **deletes** stale `ai.*` / `trait.*` / listing markers when final values match baseline (fixes false Edited badges after LG rerun with no field edits). **Git `e83f6e4`** on `main`. **OTA** runtime `2`: preview group `fd922925`, production group `db889dfe`. Migration applied to prod project `fxmiongkckkrllgyfwyw` earlier in feature work.
- Files changed:
  - `apps/native/app/collectible/[id]/edit.tsx`, `components/upload-entry.tsx`, `components/collectible-detail-v3.tsx`
  - `components/detail/lenses/specs-lens.tsx`, `components/vault/{custom-fields-editor,schema-row,index}.ts`
  - `apps/native/lib/{api/collectibles.ts,api/index.ts,edit-collectible-helpers.ts}`
  - `packages/types/src/database.ts`, `supabase/migrations/20260602120000_edit_collectible_custom_fields_provenance.sql`
  - `docs/ai-context/*` (memory sync this handoff)
- Git: `e83f6e4` on `main` (local; **2 commits ahead of `origin/main`** unless founder pushed).
- OTAs: `eas update --channel preview` → `fd922925`; `eas update --channel production` → `db889dfe`; message `feat: edit collectible flow + provenance reconcile fix`.
- Validation: ESLint on touched native files; founder device soak of edit + rerun path reported one provenance bug (fixed in same wave). No formal automated test suite for provenance.
- Notes: **Cold restart** required for OTA pickup. Existing DB rows with stale provenance clear on next save after OTA. Listing-line Edited badges out of V1 scope. `supabase/.temp/*` never commit.

## 2026-06-02 — Identify-first upload, Lattice Theater, extraction contract alignment

- Summary: Shipped the native single-lane upload overhaul: **Scan + Finalize merged into scrolling Identify** (owner prefs on draft insert, strict Analyze gate, "Activate Looking Glass" CTA, Personal Value + PRICELESS NFST placeholder). **Replaced Theater HUD** (progress ring / holographic frame) with **The Lattice** — stage-choreographed SVG reasoning graph wired to real engine `stage` via `pollEngineJobStatus`. **Review → Catalog** (client-owned `published_at` on commit). Removed **Assembly** step and `assembly-step.tsx`; upload flow is now `identify → theater → review → success`. Simplified `image-utils` to `uploadImage` / `getOptimizedUrl` (no client-side variant assembly in this path). **ActionDock** HIG primary pill (44pt, filled volt enabled / muted disabled). Extraction backend artifacts committed: `job-status` proxy + reconciler, `looking-glass-webhook` rejection/idempotency, shared `engine-mapping.ts`, migration `client_owned_completion_and_rejected`, `docs/EXTRACTION_CONTRACT.md`. **Production Supabase already had migration + edge functions** (audited via MCP — no redeploy needed). **Git `feb0c25`**; **preview OTA** runtime `2` update group `8e9655e9-2eff-44c4-a157-6e3446788fbb`.
- Files changed:
  - `apps/native/components/upload-entry.tsx` — Identify-first state machine, Lattice `TheaterStep`, freeze fix (immediate theater transition), engine stage polling + rejection routes.
  - `apps/native/components/vault/action-dock.tsx` — floating HIG primary pill.
  - `apps/native/lib/api/collectibles.ts` — prefs on `createDraftCollectible`, client-owned `commitDraftCollectible`.
  - `packages/api/src/modules/extraction.ts` — `pollEngineJobStatus`, `EngineJobStatus`.
  - `apps/native/lib/image-utils.ts` — simplified upload/transform helpers (variants deferred/removed from client path).
  - `apps/native/components/upload/assembly-step.tsx` — **deleted**.
  - `supabase/functions/job-status/`, `supabase/functions/_shared/engine-mapping.ts`, `supabase/functions/looking-glass-webhook/index.ts`, migration, `docs/EXTRACTION_CONTRACT.md`.
- Git: `feb0c25` on `main` (local; not pushed to `origin` this session).
- OTAs: `eas update --channel preview` — group `8e9655e9-2eff-44c4-a157-6e3446788fbb`, runtime `2`, message matches commit.
- Validation: ESLint clean on `upload-entry.tsx`; `tsc` on native app has pre-existing errors only (no new Lattice-specific failures). Supabase MCP audit confirmed migration + `job-status` v1 + `looking-glass-webhook` v2 ACTIVE. No device soak of Lattice on preview binary this session.
- Notes: Extraction still requires **vitrinedb worker running** (local PC today). Lattice falls back to cosmetic copy if `job-status` unreachable. Old Theater 25s/85% ring OTA superseded by Lattice for runtime-`2` devices after this OTA cold-starts. **Open:** push `feb0c25` to origin; variant generation strategy post-Assembly removal; preview binary cut still pending if team on runtime-`1`.

## 2026-05-30 — Preview runtimeVersion 2 + EAS binary audit

- Summary: Audited EAS build history via `eas build:list` / `eas update:list`. Confirmed team risk: **runtime-`1` preview installs** (especially May 24 build `e5113d4a` at `c357fae`, fingerprint `6617dd77`) cannot run `PhotoReorderGrid` / `react-native-reanimated-dnd` (Reanimated 4.1.1, no native dnd). May 26 preview `c69ae9b1` (`fd26b591`, fingerprint `9c713ce6`) had native deps but still used `runtimeVersion: "1"`, so incompatible JS OTAs could still target stale devices. **Bumped `runtimeVersion` to `"2"`** in `apps/native/app.json` to isolate the preview channel. Synced ai-context memory; pushed `origin/main`.
- Files changed:
  - `apps/native/app.json` — `runtimeVersion` `"1"` → `"2"`.
  - `docs/ai-context/*` — memory sync for 5/27 polish wave + 5/30 preview-cut notes.
  - `.cursor/rules/ota-update-discipline.mdc` — current runtime documented as `"2"`.
- Git: `6a53a98` (docs 5/27 memory), `33ec04f` (runtimeVersion 2 + preview-cut memory). Pushed `f09e891..33ec04f` to `origin/main`.
- Validation: `eas build:list` / `eas update:list` read-only. No new EAS preview build completed this session (founder cutting manually). No `tsc` / device test this session.
- Notes:
  - **EAS preview builds (iOS only, no Android preview history):** `e5113d4a` (2026-05-24, runtime `1`, pre–PhotoReorderGrid native); `c69ae9b1` (2026-05-26, runtime `1`, includes Reanimated 4.3.1 + dnd). **Development** latest `f0a71aef` (2026-05-26, `cbc131b`) — older than `main`; dev client + Metro for JS, not preview channel.
  - **Runtime-`1` OTAs still on channel** (Assembly, LensPager, Theater) — safe only on matching native binary; dangerous on May 24 installs.
  - **Next:** `eas build --profile preview --platform ios` from `apps/native/` on `33ec04f+`; team **reinstall** IPA; then `eas update --channel preview` for runtime-`2`-only JS fixes.
  - **Dev build download:** `eas build:download --platform ios --latest` with `--profile development` via list+id; see HANDOFF.

## 2026-05-27 — LensPager page-0 edge-back + Theater 25s pacing (preview OTAs)

- Summary: **LensPager** — on page index `0` only, `activeOffsetX([-12, 1_000_000])` so the pager claims leftward swipes (next lens) but never rightward swipes, restoring iOS/Android stack edge-back in the collectible detail content band without adding a back chevron beside the display `LensSelector`. **Theater** — cosmetic ring/reveal/checklist retimed to 25s linear crawl capped at 85% until extraction completes; ring animation starts after `extractionJobId` exists (not on bare step transition); percent label uses `floor()` + cap so "90%" misread is avoided; poll success still sprints to 100%.
- Files changed:
  - `apps/native/components/vault/lens-pager.tsx` — `FIRST_PAGE_RIGHT_ACTIVE_OFFSET`, index-aware `activeOffsetX`, docblock gesture contract.
  - `apps/native/components/collectible-detail-v3.tsx` — back-navigation comment aligned with asymmetric activation.
  - `apps/native/components/upload-entry.tsx` — `THEATER_COSMETIC_MS = 25_000`, `THEATER_PROGRESS_CAP = 0.85`, checklist 4×4s + 9s, linear easing, `extractionJobId` gate on ring/reveal effects, `TheaterStep` percent cap props.
- Git: `5d32845` (lens pager), `f09e891` (theater) on `main`, pushed to `origin/main`.
- OTAs (channel `preview`, runtime `1`):
  - Update group `a3610490-8612-4e9f-858f-ece6e2ca932b` — lens 0 edge-back.
  - Update group `7356da1c-9b2c-4a34-b3d3-486c07796c54` — Theater pacing.
- Validation: Founder dev-client — edge-back from middle of DETAILS lens works; lens 0 swipe-left → Specs; lens 1+ swipe-right → Details; vertical scroll in lenses unchanged. Theater pacing validated on dev client before OTA.
- Notes: Collectible detail intentionally has **no visible back control** in the lens strip — product chrome is the display `LensSelector`. Do not "fix" back by adding a chevron without explicit design approval. `LensPager` on pages 1..N remains bidirectional `[-12, 12]`. Theater extraction-reliability thread (poll never completes) is unchanged — this OTA only fixes cosmetic pacing/cap behavior.

## 2026-05-27 — Upload Assembly step + deferred image variants

- Summary: Decoupled image-variant generation from the Identify/Theater path. Variants no longer fire via `generateVariantsBackground` immediately after originals upload; they run in a new **Assembly** step after Finalize commit and before Success. `assemblyVariants()` caps concurrent resize+upload work (default 4). Upload Review/Finalize `FramedHero` uses `displaySize="full"` so heroes render originals until variants exist.
- Files changed:
  - `apps/native/lib/image-utils.ts` — `generateVariants()` (awaited), `assemblyVariants()` (worker pool), `generateVariantsBackground` delegates to `generateVariants`; `VariantWorkJob` type exported.
  - `apps/native/components/detail/framed-hero.tsx` — optional `displaySize` prop (default `'detail'`).
  - `apps/native/components/upload/assembly-step.tsx` (new) — v1 shelf + progress bar; **v2 (Assembly B)** replaced with dossier seals UI (see sub-entry below).
  - `apps/native/components/upload-entry.tsx` — `UploadStep` adds `'assembly'`; `variantWork` state; Identify populates work, `resetFlow` clears; Finalize → Assembly → Success; passes `title` into Assembly.
- Rollout: **OTA-eligible** (JS-only, no native/`runtimeVersion` change). Founder dev-client validation + `eas update --channel preview` soak before production.
- Notes: `uploadWithVariants` consumers (avatar, legacy collectibles, trading-cards) unchanged. Theater 1 / extraction reliability work remains a separate thread.

### Assembly B — Dossier seals (same day, second OTA)

- Summary: Replaced v1 shelf/progress-bar Assembly with **Direction B**: frosted card on void + faint scanlines, `BINDING TO VAULT` → `BOUND` kicker swap, listing title header, overlapping blur-to-sharp photo filmstrip (volt border on seal), four ledger rows with variable-tempo cosmetic stagger (identity 200ms, classification 600ms, display earliest 1350ms gated on real `assemblyVariants` completion, ledger +900ms after display). Closing beat: 1→2px brandVolt border + inner glow (PhotoReorderGrid family, no shadow). `MIN_TOTAL_MS` 2.6s floor. Reduce Motion: instant border/kicker, haptics unchanged. 45s timeout → silent Success (unchanged).
- Files: `apps/native/components/upload/assembly-step.tsx` (rewrite), `upload-entry.tsx` (`title={effectiveListingTitle}`).

## 2026-05-26 — Drag-Reorder V2 Migration + PhotoReorderGrid extraction

- Summary: Migrated the upload-flow photo grid from `react-native-draggable-flatlist@4.0.3` (DFL) to `react-native-reanimated-dnd@^2.0.0` and **extracted the implementation into a canonical vault primitive `PhotoReorderGrid`** so every future multi-photo reorder surface (Upload Lane Chunk B / Batch Lane, future edit-existing-photos UI, possible bug-report attachments) consumes the same component rather than copy-pasting the DFL→react-native-reanimated-dnd swap surface area. Replaces the entire DFL grid block in `upload-entry.tsx` ScanStep with a single `<PhotoReorderGrid />` invocation. Closes the Layer-2 drag-reorder polish thread that's been open since 2026-05-24. Net upload-entry.tsx delta: ~140 line deletion (GridItem union, gridData, gridKey, handleDragEnd, renderGridItem, and 8 obsolete styles), ~10 line addition (the primitive invocation). Branch: `feature/drag-reorder-v2`.
- Files Changed (planned commit chunks; not yet committed):
  - `apps/native/components/vault/photo-reorder-grid.tsx` (new, ~520 lines) — owns SortableGrid integration, lift visual, live COVER badge, remove-X disable, haptic wiring, and theme reads. Cross-platform-consistent inner-glow + brandVolt border instead of platform-branched drop shadow.
  - `apps/native/components/vault/index.ts` — barrel export adds `PhotoReorderGrid` (component) + `PhotoReorderGridProps` + `PhotoAsset` type.
  - `apps/native/components/upload-entry.tsx` — DFL/ScaleDecorator/RenderItemParams imports removed; `PhotoReorderGrid` added to existing vault import block; `GridItem` discriminated union deleted; `gridData` / `gridKey` / `handleDragEnd` / `renderGridItem` deleted; `<DraggableFlatList<GridItem>...>` block replaced with `<PhotoReorderGrid photos onReorder onRemove onAddMore disabled />`; stale styles purged (`emptyTile`, `photoTile`, `photoImage`, `removeBadge`, `coverBadge`, `coverBadgeText`, `photoGridList`, `photoGridRow`); unused `LinearGradient` + `ImagePlus` imports + the dead `TILE_WIDTH`/`GRID_GAP`/`GRID_COLS`/`GRID_H_PAD` constants removed.
  - `apps/native/package.json` — adds `react-native-reanimated-dnd@^2.0.0`; bumps `react-native-reanimated` from `~4.1.1` to `^4.2.0` (resolved to 4.3.1); bumps `react-native-worklets` from `^0.5.1` to `^0.8.0` (resolved to 0.8.x). **DFL stays in package.json** — see `Constraints discovered` below.

- Aesthetic spec (locked, captured in PhotoReorderGrid):
  - Lift scale 1.12 (theatrical, was 1.06)
  - Lift visual: inner glow (`rgba(255,255,255,0.06)`) + `brandVolt` border 1px→2px on lift, animated with `withTiming(120)`
  - Spring on scale: `damping: 18, stiffness: 220`
  - **Zero shadow / elevation properties anywhere** — the cross-platform-consistency rule (see DECISION_LOG)
  - Drop indicator: NONE separately rendered — the void left by items shuffling aside IS the indicator (Apple Photos pattern)
  - COVER badge re-anchors live to whichever tile is at grid index 0 via `useAnimatedStyle` reading `positions.value[id].index`
  - Remove-X disabled (opacity 0.4, pointerEvents none) while ANY tile is in drag state
  - Per-tile long-press 220ms lifts that specific tile only (Pattern A — matches iOS Photos)
  - "+" add-photo sentinel rendered OUTSIDE SortableGrid as an absolutely positioned sibling; not draggable, not a drop target

- Constraints discovered during implementation:
  - **`react-native-reanimated-dnd@2.0.0` requires Reanimated >=4.2.0 + Worklets >=0.7.0.** v1.1.0 satisfies our 4.1.7/0.5.2 stack but lacks `SortableGrid` / `SortableGridItem` / `GridStrategy` — those grid components landed in v2.0.0. Decision: bump Reanimated to ^4.2.0 (resolved 4.3.1) and Worklets to ^0.8.0. **This makes the migration a binary rebuild, NOT an OTA-eligible drop.** Plan originally claimed OTA-eligibility based on incomplete library intel.
  - **`upload/photo-grid.tsx` is NOT an orphan** — it's consumed by the legacy V1 `memorabilia-core-form.tsx` flow, which is still reachable via `/upload/memorabilia/[type]/[category]` from `memorabilia-type-selector.tsx`. That flow still depends on DFL. Decision: **keep `react-native-draggable-flatlist` in package.json** for this PR; migrating the V1 memorabilia photo grid to consume `PhotoReorderGrid` is tracked as a separate follow-up thread (different shape — V1 is a horizontal carousel, current V2 primitive defaults to 3-column vertical; would need orientation prop expansion or a sibling primitive). Reverses one bullet of the plan's "same-PR DFL removal" promise; cleaner separation of concerns.
  - **Reanimated 4 changed the return type of `useAnimatedStyle` to `AnimatedStyleHandle`** but the library's `animatedStyle` prop typing on `SortableGridItem` still expects `StyleProp<ViewStyle>`. Runtime accepts both forms on `Animated.View`; static typing requires a one-line cast at the call site. Annotated in the primitive's source.
  - **`SortableGrid` is wrapped in `React.MemoExoticComponent<...SortableGridProps<any>>`** — the generic is lost at the wrapper level. Dropped explicit `<SortableGrid<PhotoAsset>>` type arg; the inner `renderItem` is typed against `SortableGridRenderItemProps<PhotoAsset>` and the data flows correctly at runtime.
  - **`SortableGridItem`'s built-in `animatedStyle` hard-codes `transform: [{ scale: withSpring(moving ? 1.05 : 1) }]` + drop shadow.** Both are overridden by our `customAnimatedStyle` because React Native style-array merging gives precedence to the LATER entry. Net effect: our `1.12` scale + zero shadow take over cleanly without forking the library.
  - **The library doesn't expose `isMoving` as a shared value** — only as React state. Solution: track lift state at the primitive scope via a `liftedItemId` shared value flipped on `onDragStart` / `onDrop` (via JS-thread mirror) and read by each tile's `useAnimatedStyle` for the lift visual and the COVER badge logic.

- Validation:
  - **`npx tsc --noEmit -p apps/native/tsconfig.json` against the new branch: 107 errors — exactly matches the documented baseline.** Zero net new TS errors. The two errors that touched `upload-entry.tsx` (line 1419 `SPACING.xl` unknown, line 2438 duplicate `heroBlock` key) were both pre-existing on `cbc131b`. Two transient new errors in `photo-reorder-grid.tsx` were fixed during implementation: SortableGrid type-arg removal + AnimatedStyleHandle cast.
  - **`ReadLints` clean on all three modified files** (`apps/native/components/vault/photo-reorder-grid.tsx`, `apps/native/components/vault/index.ts`, `apps/native/components/upload-entry.tsx`).
  - **iOS + Android dev-client validation: NOT YET RUN.** The 12-step validation plan (cold-launch render, 1-6 photos, lift visual, shuffle motion, COVER swap, drop at every position, drop on "+" slot, remove-X disable, theme switch mid-upload, full upload-flow regression, tsc, lint) is the founder's hardware-required next step. Cannot complete autonomously.

- Notes / next-agent flags:
  - **Same-binary OTA is OFF the table for this code.** Because we bumped two native modules (Reanimated 4.1.7→4.3.1, Worklets 0.5→0.8) the existing TestFlight binary cannot consume this JS bundle. The rollout path is: build new EAS preview binary → distribute to test devices → run §Validation on iOS + Android → if green, that binary becomes the new OTA-able baseline → all future JS-only iterations on top of it can OTA normally. Capture this clearly when explaining to founder.
  - **Expo SDK 54 ships Reanimated `~4.1.1` officially.** We're going off-pin to 4.3.1. The `expo doctor` command will warn but not fail. If a SDK 55 upgrade lands, Expo will bless 4.2+/4.3+ natively. If anything breaks at `eas build` time (native compile error, Hermes issue, JSI conflict), the rollback is to pin Reanimated back to 4.1.x and Worklets to 0.5.x, accept the `react-native-reanimated-dnd@1.1.0` API surface (only vertical Sortable, no grid), and hand-roll the grid math on top — significantly more code, but stays on the Expo-blessed Reanimated pin.
  - **The "shuffle aside" motion is driven by the library's `withSpring(currentPosition.y)` default config inside `useGridSortable`** — we can't tune it from outside without forking the library. If founder feels it's too bouncy or too stiff after dev-client testing, options are (a) live with it (cheapest), (b) PR upstream to expose spring config (medium), (c) fork the library (expensive, defeats the purpose of migrating). Tracked as a watch item.
  - **`PhotoReorderGrid`'s `liftedItemId` shared-value mirror approach** is intentionally JS-thread-bridged (`onDragStart` / `onDrop` callbacks flip the shared value via JS thread). The library's gesture activates via `activateAfterLongPress(220)` so `onDragStart` fires AFTER the 220ms long-press completes — exactly when we WANT the lift visual to engage. There's a sub-50ms JS→UI thread bridge delay between gesture activation and lift visual onset; imperceptible in practice. If a future Reanimated-native lift trigger is preferred, fork the library to expose `movingSV` and switch.

## 2026-05-24 (evening) - Native polish wave: keyboard system + upload-flow UX fixes + photo grid v2 + first real OTA exercise

- Summary: Six-commit polish wave run entirely through the new OTA pipeline that landed in the priming wave. (1) V3 token hygiene + iOS HIG toggle + carousel dot fix opened the session. (2) Built the canonical keyboard wrapper system — `KeyboardSafeScroll` / `KeyboardSafeSheet` / `KeyboardSafeComposer` primitives, configured Android `setInputMode` to `SOFT_INPUT_ADJUST_RESIZE`, mounted a globally themed `<KeyboardToolbar />`, migrated all 23 existing input surfaces (5 V3 gap surfaces + 14 KAV surfaces + 4 sheet primitives) off raw `KeyboardAvoidingView`. Removed non-existent `automaticOffset` prop while migrating. (3) Fixed founder-reported showcase-persistence bug in `upload-entry.tsx` — `resetFlow` now scrubs `selectedShowcaseIds`, `localShowcases`, `tags`, `status`, `visibility`, `estimatedValue`; showcase fetch refactored into a `useCallback` and re-fired via `useFocusEffect` on tab focus. (4) Replaced the static finalize-step showcase summary row with removable showcase chips (mirroring the tag UX) — gives users a way to see and remove selections without re-opening the picker. (5) Refactored photo grid to be dynamic + draggable — replaced the fixed 3×2 static grid with a `DraggableFlatList<GridItem>` that starts with a single `+` tile and grows as photos are added, long-press lifts a tile for reorder with haptic feedback on drag begin + each placeholder change, COVER badge anchored to photo[0] so the featured slot is always visually unambiguous after a reorder. (6) **Full swap from custom photo-library-picker.tsx to native `PHPickerViewController` via `expo-image-picker.launchImageLibraryAsync`** with `allowsMultipleSelection`, `selectionLimit`, `orderedSelection: true`. **This reverses the prior "do not use launchImageLibraryAsync" decision** — the hang issue that drove the custom picker has not reappeared with the current expo-image-picker / expo-notifications stack. `components/photo-library-picker.tsx` deleted. (7) **Shipped, crashed, hotfixed:** "HIG-align drag-reorder visuals" commit (`553fe46`) bundled three experimental DFL/Reanimated features at once — `CurvedTransition` layout prop on a nested `<Animated.View>` inside DFL's `ScaleDecorator`, `enableLayoutAnimationExperimental` flag, `renderPlaceholder` callback. **Crashed the upload tab on open.** Diagnosed root cause as nested layout-animation managers (DFL's ScaleDecorator already uses Reanimated internally) + experimental flag incompatibility with `numColumns` grid mode. Hotfix commit `cbc131b` stripped all three suspect features, kept only the safe `colors.brandVolt` inline color swap for the lift-active border (replacing legacy hardcoded `#C8FA38` which is no longer in the V3 token set). Shipped recovery OTA in <2 minutes. **First real validation that the OTA pipeline can handle a roll-forward hotfix.**

- Files Changed (by commit):
  - `299dbe4` native: V3 token hygiene + iOS HIG toggle + carousel dot fix
  - `fd7ce61` native: first-class keyboard rendering across all input surfaces
    - `apps/native/components/vault/keyboard-safe-scroll.tsx` (new)
    - `apps/native/components/vault/keyboard-safe-sheet.tsx` (new)
    - `apps/native/components/vault/keyboard-safe-composer.tsx` (new)
    - `apps/native/components/vault/index.ts` (barrel-export)
    - `apps/native/app/_layout.tsx` (KeyboardController.setInputMode for Android, themed KeyboardToolbar mount, GestureHandlerRootView confirmed)
    - `apps/native/components/vault/filter-sheet.tsx` (uses KeyboardSafeSheet)
    - 23 input surfaces migrated to wrappers (full list in git diff of fd7ce61)
  - `49aae14` native(upload): fix cross-upload state leak + showcase chips + focus refetch
    - `apps/native/components/upload-entry.tsx` (resetFlow scrub, useFocusEffect refetch, selectedShowcases memo, FinalizeStep chips JSX + styles)
    - `apps/native/components/vault/showcase-selector-sheet.tsx` (comment updated to reflect chip-based parent UX)
  - `5e72933` native(upload): dynamic photo grid with drag-to-reorder + native PHPicker
    - `apps/native/components/upload-entry.tsx` (DraggableFlatList integration with numColumns=3, grid sentinel pattern, ScaleDecorator, COVER badge, handleReorderPhotos callback, pickFromLibrary rewritten to launchImageLibraryAsync with orderedSelection)
    - `apps/native/components/photo-library-picker.tsx` (deleted)
  - `553fe46` fix(native): HIG-align photo drag-reorder visuals  *(crashed in production — reverted by next commit)*
  - `cbc131b` fix(native): hotfix upload-screen crash from prior OTA
    - `apps/native/components/upload-entry.tsx` (removed CurvedTransition import + Animated.View layout wrapper + enableLayoutAnimationExperimental + renderPlaceholder + dropPlaceholder style + dragItemOverflow; kept brandVolt inline color on isActive Pressable style)

- OTAs shipped (channel `preview`):
  - Update group `f1d7083a-ad7c-4010-99d9-8c95189250b1` — OTA 1 (showcase scrub + chips + refetch)
  - Update group [from 5e72933 publish, identifier not retained in chat] — OTA 2 (drag reorder + native picker)
  - Update group `f1d7083a-ad7c-4010-99d9-8c95189250b1` — bad OTA 3 (HIG-align polish, crashed)
  - Update group `9c695430-4209-4506-b79c-354cfb0cfa09` — OTA 4 (hotfix recovery, current production state)

- Validation:
  - `npx tsc --noEmit` against `apps/native/tsconfig.json` — 107 errors, identical to pre-session baseline (`SPACING.xl` at line 1567, duplicate `heroBlock` property key at line 2658). Both pre-existing, not from session edits.
  - `ReadLints` clean on `apps/native/components/upload-entry.tsx` after every edit.
  - Recovery OTA confirmed by user: "we are back up and running with no crash" after `cbc131b` shipped.
  - Drag-and-drop functionality verified by user as "still feels janky" but functionally intact — drag works, items can be reordered, no crash. This is the known remaining gap (Layer 2 work, deferred).
  - **Pre-existing TypeScript errors that should NOT be attributed to this session**: `SPACING.xl` (line 1567, pre-existing token typo) and duplicate `heroBlock` key in styles object (line 2658, pre-existing duplicate). Verified at start AND end of session.

- Notes:
  - **The crash forensics matter for the next agent.** The combination that crashed was `<Animated.View layout={CurvedTransition.duration(220)}>` wrapping `<Pressable>` *inside* DFL's `<ScaleDecorator>`. ScaleDecorator already wraps its children in a Reanimated Animated.View internally — so we were nesting two layout-animation managers in the same view subtree. The `enableLayoutAnimationExperimental` flag on `DraggableFlatList` with `numColumns={3}` is also flagged in the DFL docs as experimental; combined with the nested wrappers it's the most likely native-layout crash trigger. `CurvedTransition` itself is present in Reanimated 4.1.1 (`node_modules/react-native-reanimated/src/layoutReanimation/defaultTransitions/CurvedTransition.ts` exists) — so the import isn't undefined; the bug is structural.
  - **The Layer-2 drag-reorder polish plan** (for next session): migrate from `react-native-draggable-flatlist@4.0.3` to `react-native-reanimated-drag-list` (Jurrian Lammerts, Fabric/new-arch ready, UI-thread Reanimated 4 worklets, "items animate out of the way" baked in, supports `renderDropIndicator` natively). Only links to deps we already have (reanimated + gesture-handler), so it's OTA-eligible in the current binary — but the correct workflow is: feature branch → dev-client local build → full upload-flow regression test (long-press, drag across grid, drop at every position, cancel mid-drag, drop near edges, remove tile, add tile, theme switch) → OTA to preview.
  - **Picker reversal is real.** The custom `photo-library-picker.tsx` was retired. The previous `DO_NOT_BREAK` rule "Do NOT use `ImagePicker.launchImageLibraryAsync` for photo library" was load-bearing for several months because of an `expo-notifications` ↔ native picker delegate conflict that caused indefinite Promise hangs on iCloud-optimized/HEIC photos. We have NOT seen that hang recur with the current expo-image-picker on the current EAS preview binary. If a regression surfaces (hang on library pick, especially with iCloud-only photos), the rollback is to resurrect `photo-library-picker.tsx` from git history (commit `5e72933^`) — but watch for it. Tracked as an assumption in OPEN_THREADS.
  - **Founder noticed the legacy `#C8FA38` neon-volt color leaking into the active drag-tile border.** V3 renamed `brandVolt` from neon (`#C8FA38`) to warm ivory (`#E8E0D4` dark / `#7A7168` light) months ago, but my first ship hardcoded the legacy hex inside a static `StyleSheet.create()` call instead of pulling from `colors.brandVolt` inline. Lesson: any "active state" or "highlight" color inside the upload flow must read from the `useTheme().colors` object at render time, not from a static StyleSheet. Other surfaces should be audited for the same pattern at next opportunity.

## 2026-05-24 - Priming wave: source-control catch-up + batch_uploads bug fix + OTA pipeline + docs reset

- Summary: Eleven-commit priming wave that brought the project into a known-clean state for fast iteration. (1) Diagnosed and fixed the `batch_uploads` INSERT bug — root cause was missing `GRANT SELECT, INSERT, UPDATE ON batch_uploads TO authenticated`, not the PostgREST schema cache suspected during the previous session. Reconciliation migration applied via Supabase MCP. (2) Built and verified an EAS preview iOS build with `expo-updates` baked in, giving the project a live OTA pipeline on the `preview` channel — JS-only hotfixes now ship in ~90 seconds instead of a full native rebuild + manual reinstall. (3) Committed the entire untracked Upload Lane Unification backend (4 migrations + edge functions stream-token + test-push) to source control. (4) Committed the full authenticated web app scaffolding — `@supabase/ssr` clients, `/login`, `/signup`, `/complete-profile`, `/v/*` shell with sidebar + 4 context providers, 20 vault component primitives, 6 React Query data hooks, design tokens + status/trait/verb configs, and 55+ feature route pages across collection / collectible / explore / messages / network / profile / showcase / tracking / activity / settings / catalog / batch / upload. (5) Committed the locked subscription architecture (9 docs) + AAR/Pulse handoffs. (6) Refreshed all 7 memory docs: corrected the `complete_and_publish` trigger description in DO_NOT_BREAK + DECISION_LOG (it does NOT touch `extraction_completed_at` and does NOT insert showcase rows — only flips `extraction_status` and sets `published_at`), marked obsolete "Expo Go remains dev target" decision as SUPERSEDED, and moved 3 resolved threads (batch_uploads bug, edge function deployment, keyboard-controller rebuild) from OPEN_THREADS to the Resolved section with their actual resolutions.

- Files Changed (by commit):
  - `6087e15` supabase: add user_push_tokens schema migration
    - `supabase/migrations/20260513000000_create_user_push_tokens.sql`
  - `4c172d3` supabase: upload lane unification (batch_uploads + trigger + crons + RPC pass)
    - `supabase/migrations/20260518000000_create_batch_uploads.sql` (amended to include GRANT clause)
    - `supabase/migrations/20260519170000_upload_lane_unification.sql`
    - `supabase/migrations/20260519170100_upload_lane_cron_jobs.sql`
    - `supabase/migrations/20260519170200_upload_lane_publish_filter_rpcs.sql`
    - `docs/UPLOAD_LANE_UNIFICATION_PLAN.md`
  - `b20a0f2` supabase: reconcile batch_uploads grants and restore restrictive RLS
    - `supabase/migrations/20260525003750_reconcile_batch_uploads_access.sql` (new)
  - `d751ce7` supabase: commit deployed stream-token + test-push edge functions
    - `supabase/functions/stream-token/index.ts`
    - `supabase/functions/test-push/index.ts`
  - `4fca1b7` @vitrine/api: published_at filter pass + add collection-queries module
    - `packages/api/src/index.ts`, `packages/api/src/modules/activity.ts`, `packages/api/src/modules/explore.ts`, `packages/api/src/modules/collection-queries.ts`
  - `2261588` web: supabase SSR auth scaffold + login/signup/complete-profile (12 files)
  - `fae1e9c` web: vault shell + design system + vault primitives + hooks + contexts (44 files)
  - `2f2629e` web: vault feature surfaces (all /v routes + /batch + upload lib) (59 files)
  - `88acac4` web: marketing tweaks + share resolver published_at filter + holo-frame utility (4 files)
  - `6d69b77` docs: subscription architecture (locked) + AAR/Pulse handoffs + EAS migration plan refresh (12 files)
  - `<this commit>` docs(memory): refresh after upload-lane-unification + EAS modernization + priming wave

- Validation:
  - Reconciliation migration applied via Supabase MCP. Post-state verified: `authenticated` role now has SELECT, INSERT, UPDATE on `batch_uploads`; all 3 policies restored to restrictive `user_id = (SELECT id FROM users WHERE supabase_auth_id = auth.uid())`; migration tracked in `supabase_migrations.schema_migrations` as `20260525003750_reconcile_batch_uploads_access`.
  - EAS preview build `e5113d4a-13c4-4e39-b276-3cf86e229435` completed in 7m 43s, runtime version `1`, channel `preview`, fingerprint `6617dd77...`. IPA installed on device. Smoke test passed: app boots clean, upload completes end-to-end (validates the polling fix), push permission prompt appears.
  - OTA channel created server-side (`Created update channel "preview" and branch "preview" on @jlocastostack/myvitrine`) — first `eas update --channel preview` push will be picked up by the installed binary on next cold start.
  - Build's source commit `c357fae` matches local HEAD pre-priming wave — confirmed via `git show --stat`.
  - All 11 commits in the priming wave passed `git commit` cleanly. No pre-commit hook interventions required.

- Notes:
  - Skipped `supabase/.temp/*` from all commits — those are ephemeral CLI working files (project-ref, version files). Adding `supabase/.temp/` to `.gitignore` deferred to a future hygiene pass; existing tracked `cli-latest` left unchanged.
  - Two non-blocking warnings observed at build time: `ios.buildNumber` ignored when EAS manages versions remotely (recommendation only); `watcher.unstable_workerThreads` Metro option warning (comes from Sentry's metro wrapper, not our config — safe to ignore).
  - Native session conflict (web sign-in logs out native app) remains unresolved — root cause identified (refresh-token rotation + global `signOut` scope) but no fix applied. Tracked in OPEN_THREADS.
  - 97% hang on single-lane uploads remains unresolved — intermittent, most uploads complete fine, signed items with no context most affected. Next step is Sentry-instrument `upload-entry.tsx` to capture timing + extraction status at hang points. Deferred to a focused follow-up session per user direction.
  - Build install/smoke-test was the only manual step the user performed; all DB writes, commits, and file edits were executed via tools.

## 2026-05-19 - Upload Lane Unification: Chunk A (Full Web Foundation)

- Summary: Shipped the complete web-side Upload Lane Unification — server-side auto-commit via DB trigger, `published_at` publish gate across all public queries (~30 client-side + 9 RPCs), batch processor rewrite removing client-side commit, auto-publish/hold-for-review toggle in batch defaults drawer, and a rewritten History detail page with live status queries and inline Publish/Retry/Remove actions. Removed legacy sweep code (`deleteDraftCollectible`, `sweepStaleStagingRows`) from native. Created centralized visibility query helpers in `@vitrine/api`. Schema includes failure tracking columns, watchdog cron (every minute), and auto-purge cron (daily 04:00 UTC, 45-day window).

- Files Changed:
  - `supabase/migrations/20260519170000_upload_lane_unification.sql` (new) — published_at, failure columns, batch_id FK, auto_publish, backfill, trigger, partial indexes
  - `supabase/migrations/20260519170100_upload_lane_cron_jobs.sql` (new) — watchdog + auto-purge crons
  - `supabase/migrations/20260519170200_upload_lane_publish_filter_rpcs.sql` (new) — collectibles_unified view update + 9 RPC rewrites with published_at filter
  - `packages/api/src/modules/collection-queries.ts` (new) — publishedCollectibles, publicCollectibles, queueReviewItems, queueErrorItems, applyPublishedFilter
  - `packages/api/src/index.ts` — exports new module
  - `apps/web/app/v/upload/batch-processor.ts` — full rewrite: batch_id on insert, value at insert time, showcase rows at insert time, removed Phase 5 (client commit), poll for 'complete'/'failed' terminal states
  - `apps/web/app/v/upload/page.tsx` — renamed "Batch Catalog", auto-publish state moved to drawer, footer shows publish mode + change link, "Looking Glass" branding, "collectibles" terminology
  - `apps/web/app/v/upload/batch-defaults-drawer.tsx` — added "After Cataloging" section (Publish/Review first) with green/orange status-style buttons, removed Apply All
  - `apps/web/app/v/upload/history/[id]/page.tsx` — full rewrite: live-queries collectibles for real status, inline Publish/Retry/Remove/Discard actions, Publish All bulk action, auto-poll while in-flight, retry re-enqueues existing row
  - `apps/web/app/v/upload/history/page.tsx` — terminology update
  - `apps/web/app/batch/top-bar.tsx` — tier badge moved to dropdown, dropdown bg → bg-void
  - `apps/native/app/_layout.tsx` — removed sweepStaleStagingRows import + StagingRowSweep component
  - `apps/native/components/upload-entry.tsx` — replaced deleteDraftCollectible with deleteCollectible, handle 'complete' status same as 'extracted'
  - `apps/native/lib/api/collectibles.ts` — deleted deleteDraftCollectible + sweepStaleStagingRows, added published_at filters to 5 query functions
  - `apps/native/lib/api/tracking.ts` — added published_at filters to tracked item queries
  - `apps/web/lib/hooks/use-collectibles.ts` — published_at filter
  - `apps/web/lib/hooks/use-collectible.ts` — viewerUserId param, unpublished items hidden from non-owners
  - `apps/web/app/page.tsx`, `app/s/c/[id]/page.tsx`, `app/s/p/[id]/page.tsx`, `app/v/page.tsx`, `app/v/tracking/tracked/page.tsx`, `app/v/collectible/[id]/page.tsx`, `app/v/collectible/[id]/edit/page.tsx` — published_at filters
  - `packages/api/src/modules/explore.ts` — published_at + visibility filters on 4 functions
  - `packages/api/src/modules/activity.ts` — published_at filter on journal queries

- Validation:
  - All RPCs verified returning rows post-filter via SQL queries
  - Backfill confirmed: 0 unpublished complete rows in production
  - Trigger verified active (`tgenabled = 'O'`)
  - Cron jobs verified scheduled
  - User test: 3 collectibles uploaded via batch, all reached 'complete' with published_at set
  - batch_uploads INSERT failing due to PostgREST schema cache (NOTIFY pgrst issued, RLS simplified — still debugging at session end)
  - Zero linter errors across all changed files

- Notes: batch_uploads table creation via MCP `apply_migration` did not trigger automatic PostgREST schema reload. Issued `NOTIFY pgrst, 'reload schema'` manually. RLS policies simplified to `WITH CHECK (true)` for INSERT + `USING (true)` for SELECT during debugging. The batch record creation issue was not fully resolved by session end — the error persists as `{}` (empty object). Next session should instrument the Supabase client call to capture the full response.

## 2026-05-14 - Subscription Tier Architecture (Full Design Session)

- Summary: Designed and documented the complete subscription tier architecture through iterative discussion. Produced 9 architecture documents covering pricing model, cap enforcement, bulk uploader, reports, billing rails, paywall UX, tier gating, and RevenueCat integration. Went through three successive simplifications of the cap model (two-cap → unified single-cap; daily+monthly → monthly-only; per-type report caps → single combined pool). Locked all cap numbers, grace behavior, gate set, and marketing framing. No code shipped — pure architecture and documentation session.

- Files Changed:
  - `docs/subscription/subscription-implementation.md` (new) — master orchestration doc
  - `docs/subscription/pricing-model.md` (new) — tier tables, cap numbers, unit economics, strategic rationale
  - `docs/subscription/cap-counter-architecture.md` (new) — cap predicate, extraction_events schema, cap_config schema, grace logic, can_use_bulk function
  - `docs/subscription/bulk-uploader-architecture.md` (new) — draft state machine, app↔engine contract surface
  - `docs/subscription/reports-architecture.md` (new) — single table, append-only, staleness handling, Pulse regen
  - `docs/subscription/subscription-architecture.md` (new) — RevenueCat + Stripe billing rails rationale
  - `docs/subscription/revenuecat-integration.md` (new) — RC wiring stub
  - `docs/subscription/paywall-ux.md` (new) — UX patterns stub
  - `docs/subscription/tier-gating-implementation.md` (new) — v1 gate set, grace exception matrix, telemetry contract

- Validation: None (documentation only, no code shipped).

- Notes: Originally placed in vitrinedb/docs/ by accident; moved to docs/subscription/ same session. Key decisions: unified single-cap (one scan = one scan), monthly-only (no daily), grace = tier substitution (free→pro for caps + bulk), report viewing during grace (yes), report generation during grace (no), data export Pro+ only, hard cliff at grace expiry with in-flight batch grace-through, rate limit details deferred to post-launch telemetry, hybrid RC paywall approach (custom contextual + RC builder for plan picker).

## 2026-05-14 - Upload Flow & BottomDock Design Polish

- Summary: Redesigned the BottomDock upload FAB for dark mode — replaced bright ivory background with a subtle dark lifted circle (`rgba(255,255,255,0.08)`) and brandVolt logo mark, matching how the light mode handles contrast. Unified all three upload flow steps (Scan, Review, Finalize) to use the `ActionDock` commit-action pattern — Scan previously used an inline `Button`. Made Theater transition instant on "Identify" tap — upload now runs in background while the Looking Glass HUD shows progress immediately, eliminating the ambiguous wait on the Scan screen. Removed per-row trait colors from the Theater checklist in favor of monochrome brandVolt (warm ivory) completion color — keeps trait colors reserved for semantic uses elsewhere and lets the gradient progress ring own the surface color. Removed the "Uploading photos" visible checklist item; upload happens silently under "Visual calibration."

- Files Changed:
  - `apps/native/components/bottom-dock.tsx` — dark mode upload FAB: background, shadow, glow, halo, inner ring, icon color all changed
  - `apps/native/components/upload-entry.tsx` — Scan step: replaced `Button` with `ActionDock` as sibling (matches Review/Finalize pattern); `handleAnalyze`: transitions to Theater immediately, upload runs async; Theater: split progress-ring init into separate effect; checklist: removed `ChecklistColorKey` type, `CHECKLIST_COLORS` array, `colorKey` prop; `ChecklistRow`: monochrome brandVolt for complete state, dimmed for queued; removed "Uploading photos" checklist item

- Validation:
  - Visual inspection on device confirmed dark mode FAB reads as subtle dark lift with brandVolt mark
  - Upload flow transitions to Theater instantly on tap
  - Theater checklist renders monochrome completion states correctly
  - ActionDock pins flush to bottom edge on Scan step (matches Review/Finalize)

- Notes: No EAS rebuild required — all changes are JS/TSX only.

## 2026-05-14 - Build 2: Push Notifications + Custom Photo Picker (Phase 2 Native Module #2)

- Summary: Implemented full push notification pipeline using Stream-first architecture. Installed `expo-notifications`, created `lib/push.ts` with lazy-loaded module, token management, Stream device registration (named provider `MyVitrineiOS`), badge sync, and Supabase persistence. Built `PushProvider` context with permission lifecycle and auto-register on login. Added `NotificationTapHandler` for deep-link routing from notification taps. Created contextual `PushPrePrompt` component. Applied Supabase migration for `user_push_tokens` table with RLS and GRANT. Fixed multiple issues: Metro assert shim for `@ide/backoff`, Stream rate-limiting backoff, named push provider in `addDevice`, and RLS policy mismatch (auth.uid() vs public.users.id). Also diagnosed and permanently fixed photo library picker hang caused by expo-notifications native module conflicting with iOS picker delegates. Built custom `PhotoLibraryPicker` component using `expo-media-library` with grid UI, album switching, multi-select, and iCloud download handling. Created `test-push` Edge Function for dev push verification. Verified end-to-end push delivery on device.

- Files Changed:
  - `apps/native/lib/push.ts` (new) — token management, Stream registration, notification helpers
  - `apps/native/lib/contexts/push-context.tsx` (new) — PushProvider with permission lifecycle
  - `apps/native/components/push-pre-prompt.tsx` (new) — contextual pre-prompt card
  - `apps/native/components/photo-library-picker.tsx` (new) — custom in-app photo grid
  - `apps/native/components/upload-entry.tsx` — integrated custom picker
  - `apps/native/app/_layout.tsx` — added PushProvider, NotificationTapHandler
  - `apps/native/app.json` — added expo-notifications + expo-image-picker plugins
  - `apps/native/package.json` — added expo-notifications, expo-media-library
  - `apps/native/metro.config.js` — added assert shim
  - `apps/native/shims/assert.js` (new) — minimal assert polyfill
  - `apps/native/lib/design/activity-verbs.ts` — updated pushDefault flags
  - `supabase/migrations/20260513000000_create_user_push_tokens.sql` (new) — push token table
  - `supabase/functions/test-push/index.ts` (new) — dev push verification tool

- Validation:
  - Push token registered with Stream Chat (provider name resolved)
  - Push token persisted in Supabase user_push_tokens (RLS + GRANT verified)
  - Test push notification received on device via test-push Edge Function
  - Custom photo picker loads photos, multi-select works, iCloud photos resolve
  - Two EAS builds succeeded (expo-notifications only, then + expo-media-library)

- Notes:
  - expo-notifications native module conflicts with iOS photo picker delegates (PHPicker/UIImagePickerController) for iCloud/HEIC photos. This is a known issue. The custom picker using expo-media-library is the permanent fix. Camera via expo-image-picker still works fine.
  - Stream `addDevice` requires explicit `pushProviderName` argument matching the Stream Dashboard provider name ('MyVitrineiOS' for iOS).
  - RLS on `user_push_tokens` checks `auth.uid()`. The app must use Supabase auth user ID (not the public.users profile ID) for the `user_id` column.
  - `test-push` Edge Function is dev-only (no auth guard). Add service-role key check before production.
  - Push notification settings UI (per-verb toggles) not yet wired to `notification_preferences` table.

## 2026-05-13 - Build 1: Sentry Crash Reporting (Phase 2 Native Module #1)

- Summary: Installed `@sentry/react-native` ~7.2.0 and wired full crash reporting pipeline. Fixed duplicate `associatedDomains` and `privacyManifests` entries in `app.json` left by `eas init`. Added `@sentry/react-native/expo` plugin with org/project slugs. Swapped Metro config from `getDefaultConfig` to `getSentryExpoConfig` for source map Debug ID injection. Rewrote `lib/sentry.ts` from lazy `require()` scaffold to static imports with `Sentry.init()`, `sendDefaultPii`, and re-exported `Sentry` namespace. Wrapped root layout with `Sentry.wrap(RootLayout)` for automatic navigation breadcrumbs and unhandled error capture. Added `EXPO_PUBLIC_SENTRY_DSN` to `.env`, all three `eas.json` build profiles, and EAS secrets. Added `SENTRY_AUTH_TOKEN` to EAS secrets for build-time source map uploads. Approved `@sentry/cli` postinstall in root `package.json` `pnpm.onlyBuiltDependencies`. Rebuilt dev client, installed on device, and verified test error appeared on Sentry dashboard with correct source location (symbolicated). Updated memory files.

- Files Changed:
  - `apps/native/app.json` — removed duplicate `associatedDomains` entry and duplicate `NSPrivacyAccessedAPICategoryUserDefaults` block; added `@sentry/react-native/expo` plugin with `organization: myvitrine-llc`, `project: react-native`.
  - `apps/native/metro.config.js` — replaced `getDefaultConfig` import from `expo/metro-config` with `getSentryExpoConfig` from `@sentry/react-native/metro`.
  - `apps/native/lib/sentry.ts` — full rewrite: static `import * as Sentry`, `sendDefaultPii: true`, `enableAutoSessionTracking: true`, trace sample rate, re-export of `Sentry` namespace.
  - `apps/native/app/_layout.tsx` — imported `Sentry` from `@/lib/sentry`, changed `export default function RootLayout()` to `function RootLayout()` + `export default Sentry.wrap(RootLayout)`.
  - `apps/native/.env` — added `EXPO_PUBLIC_SENTRY_DSN`.
  - `apps/native/eas.json` — added `EXPO_PUBLIC_SENTRY_DSN` to `development`, `preview`, and `production` env blocks.
  - `apps/native/package.json` — `@sentry/react-native` ~7.2.0 added as dependency (via `npx expo install`).
  - `package.json` (root) — added `pnpm.onlyBuiltDependencies: ["@sentry/cli"]`.
  - `docs/EAS_MIGRATION_PLAN.md` — marked Sentry as installed in Phase 2 checklist.
  - `docs/ai-context/CURRENT_STATE.md` — noted Sentry is live.
  - `docs/ai-context/OPEN_THREADS.md` — updated EAS/TestFlight readiness with Sentry status and EAS secrets reference; updated keyboard-controller thread.

- Validation:
  - Lint-clean on `_layout.tsx` and `sentry.ts`.
  - EAS build succeeded (build ID `dd187977-de6b-4471-9821-0acec9a86ced`, 13m 42s).
  - Test error `"Test crash from MyVitrine v3.0.0"` appeared on Sentry dashboard at `https://myvitrine-llc.sentry.io/projects/react-native/` with correct source location (`initSentry` in `sentry.ts`), confirming source maps are working.
  - Test error removed after verification.

- Notes: EAS secrets created: `EXPO_PUBLIC_SENTRY_DSN` (runtime DSN) and `SENTRY_AUTH_TOKEN` (build-time source map upload). Sentry dashboard: `https://myvitrine-llc.sentry.io/projects/react-native/`. The `@sentry/cli` postinstall downloads the Sentry CLI binary needed for source map uploads at build time — `pnpm.onlyBuiltDependencies` allowlist is required in the root `package.json`.

## 2026-05-13 - Build 2: Push Notifications Plan + Stream Dashboard Configuration

- Summary: Researched and designed comprehensive push notification architecture for Build 2. Decided on Stream-first push delivery (Stream Chat for chat messages, Stream Feeds for activity notifications). Documented per-notification-type push verdicts (8 push-enabled, 5 feed-only, 4 journal/never), iOS notification grouping strategy (5 thread ID patterns), Android notification channels (4 channels), contextual permission prompt strategy (5 trigger surfaces), and badge count sync approach. User generated new APNs key (Key ID `L7S5Z47YPL`), uploaded to Stream Dashboard Chat push config, enabled `message.new` template, and verified Activity Feeds `notification` feed group settings. Wrote full Build 2 implementation plan.

- Files Changed:
  - `.cursor/plans/push_notifications_build2.plan.md` — created comprehensive 16-step implementation plan.
  - `docs/ai-context/DECISION_LOG.md` — added "Stream-first push notification architecture" decision entry.

- Validation: None (planning only, no code shipped).

- Notes: APNs Key ID `L7S5Z47YPL` (generated 2026-05-13, replacing old key `HFBF4P5V9D` which can't be re-downloaded). `.p8` file saved at `docs/AuthKey_L7S5Z47YPL.p8` (gitignored). Stream Dashboard: APNs provider "MyVitrine iOS" created under Chat → Push Notifications. `message.new` push template enabled. Activity Feeds `notification` feed group has Realtime Notifications ON; push delivery uses app-level APNs provider.

## 2026-05-12 - Marketing Home Narrative Refresh + Live Explore Wiring

- Summary: Reworked the marketing home (`/`) around a clearer problem/solution narrative and stronger proof points. Hero now uses real production app screenshots inside the phone mockup, has a centered "Now Live — Looking Glass AI (v1)" announcement bar, refreshed collector-first subhead copy, and no KPI cards. Home order now reads Hero → Before Vitrine problem → With Vitrine thesis → How It Works feature loop → Looking Glass AI → Real Pieces live Explore → FinalCTA → Footer. Looking Glass home section now frames Pro+ report layers (VAR, AAR, Market Pulse) instead of generic classify/detect/extract cards. Explore now pulls 8 random public collectibles from `@fmazza821` instead of static placeholder cards.

- Files Changed:
  - `apps/web/app/page.tsx` — made home dynamic, fetched Frank's public collectibles from Supabase by username, shuffled server-side, and passed a serializable Explore card model into the marketing site.
  - `apps/web/components/marketing/MarketingSite.tsx` — accepted live Explore items and reordered Problem before Thesis.
  - `apps/web/components/marketing/sections/Hero.tsx` — replaced hand-coded phone UI with real screenshots, added status-bar mask, announcement bar, new subhead, and removed KPI stat cards.
  - `apps/web/components/marketing/sections/ProblemSection.tsx` — changed kicker to `BEFORE VITRINE`.
  - `apps/web/components/marketing/sections/ThesisSection.tsx` — changed kicker to `WITH VITRINE`; rewrote thesis headline and four pillar card concepts.
  - `apps/web/components/marketing/sections/RapidFireFeatures.tsx` — reframed as `HOW IT WORKS`; rewrote the 12 tiles around the collector loop and equalized card heights.
  - `apps/web/components/marketing/sections/IntelligenceSection.tsx` — rewrote Looking Glass copy, added record-to-intelligence bridge, replaced three capability cards with VAR/AAR/Market Pulse Pro+ report cards, made cards clickable to `/intelligence`, and added card arrow affordance.
  - `apps/web/components/marketing/sections/ExploreSection.tsx` — removed category filters, category badge, subtitle, and `FMV` label; renders status, listing title, and value from live rows with static fallback.
  - `apps/web/app/globals.css` + `apps/web/lib/marketing/tokens.ts` + `apps/web/components/marketing/primitives/Pill.tsx` — added official PRO tier yellow token bridge and `Pill` variants for `pro` and `green`.
  - `apps/web/public/marketing/screens/*` — added four production app screenshots used by the hero phone mockup.

- Validation:
  - `ReadLints` clean on touched files during the session.
  - `GET /` smoke test returned 200 after live Explore wiring and confirmed Frank collectible title content in rendered HTML.
  - Supabase MCP read-only checks confirmed user `@fmazza821` (`id=26885ab0-37a8-499e-a4c4-77cb3c6010f9`) and 515 public collectibles with photos.
  - Pushed commits to `main`: `02e666f`, `5e30781`, `14c91f8`, `ab3efd2`.

- Notes:
  - Home Explore uses public/RLS-readable rows via the web anon Supabase client; no service-role key or privileged write path introduced.
  - `export const dynamic = "force-dynamic"` was added to `apps/web/app/page.tsx` so the random sample is not frozen at build time.
  - `@fmazza821` is intentionally the current source account for the live home Explore sample.
  - The real `/explore` product page remains separate future work; only the home Explore sample grid is live DB-backed now.

## 2026-05-12 - Marketing Home Mobile Optimization Pass

- Summary: Comprehensive mobile pass on the marketing home (`/`) — not a stack-and-shrink, a treated-as-first-class redesign at small viewports. Added a third breakpoint at 420px (small phones — Pixel 7 / iPhone 14 Pro / etc.) on top of the existing 1024px / 768px tiers. Restored the Hero phone mockup on mobile (it was previously `display: none !important` at ≤768px — throwing away the most compelling visual on the page). Now scaled to 78% at 768px / 70% at 420px via CSS transform, with negative `margin-bottom` to absorb the resulting empty layout space; the inner phone screens stay pixel-perfect because they're scaled, not reflowed. Reworked App Store badges into full-width 50/50 grid at 768px → stacked at 420px. RapidFireFeatures now goes 4-up → 2-up at 768px (overrides base 1-up — 12 stacked tiles is a wall) → 1-up at 420px. Problem section's brand-tile cards stay 2×2 on mobile (deliberately preserved — the "fragmented" feeling needs all four visible at once). Hidden decorative elements that don't translate: the FinalCTA horizontal SVG line connector across step badges (meaningless when stacked), the 6-stage marker bar inside the Intelligence theater (PHOTOS · SCAN · CLASSIFY · TRAITS · EXTRACT · TITLE — unreadable at small widths). Type bumped: h1 56px (was 44px) at 768px → 48px at 420px; section h2 42px (was 36px) at 768px → 34px at 420px. Intelligence ExtractionArtifact's `gridTemplateColumns: "150px 1fr"` field rows collapse to label-over-value on mobile.

- Files Changed:
  - `apps/web/app/globals.css` — appended a new "ENHANCED MOBILE PASS" block after the existing responsive layer. Two `@media` queries: `(max-width: 768px)` adds the design-led overrides; `(max-width: 420px)` adds the small-phone tier. Net add: ~150 lines. Non-destructive — sits after the existing layer so its selectors win on overlap.
  - `apps/web/components/marketing/sections/Hero.tsx` — added `data-marketing-hero-actions` to the App Store buttons row, `data-marketing-phone-frame` to the PhoneFrame outer div.
  - `apps/web/components/marketing/sections/ThesisSection.tsx` — added `data-marketing-section-title` to h2, `data-marketing-thesis-pillar` to pillar card, `data-marketing-thesis-num` to the 0X number.
  - `apps/web/components/marketing/sections/ProblemSection.tsx` — added `data-marketing-section-title` to h2, `data-marketing-problem-card` to the brand-tile cards.
  - `apps/web/components/marketing/sections/RapidFireFeatures.tsx` — added `data-marketing-rapid-tile` to RapidFireTileCard.
  - `apps/web/components/marketing/sections/IntelligenceSection.tsx` — added `data-marketing-intel-panel` (TheaterInputPanel + ExtractionArtifact), `data-marketing-intel-stages` (the 6-stage marker bar), `data-marketing-intel-stat` (AVG EXTRACTION row), `data-marketing-intel-field-row` (each field in ExtractionArtifact), `data-marketing-intel-cap-tile` (CapabilityTile).
  - `apps/web/components/marketing/sections/FinalCTA.tsx` — added `data-marketing-cta-line` (decorative SVG connector), `data-marketing-cta-actions` (App Store badges row), `data-marketing-cta-step` (step cards).
  - `apps/web/components/marketing/sections/Footer.tsx` — added `data-marketing-footer-bottom` to the © row, plus inline `flexWrap: "wrap"` + `gap: 8` so it wraps cleanly on narrow screens.

- Validation:
  - `ReadLints` clean across all 7 modified files. No TypeScript or ESLint errors.
  - Dev server (`pnpm --filter @vitrine/web dev`) compiled clean with no errors. All `GET /` returned 200 throughout.
  - Served CSS bundle confirmed to contain all new rules (144 `data-marketing-*` selectors total, including the new mobile pass additions). Both `[data-marketing-hero-actions]` and `[data-marketing-cta-actions]` rules present at 768px and 420px breakpoints with identical structure.
  - Live smoke test in `cursor-ide-browser` at 390×844 (iPhone 14 Pro). Hero h1 measured at 186px tall = 4 lines × ~46px line-height, matching the 48px @420px override (48 × 0.96 line-height ≈ 46px). Hero App Store badges measured at 340px wide = full content width = correct 1-up layout at <420px. The browser MCP returned stale measurements after viewport resize, so deeper-page elements were verified via served-CSS inspection rather than live measurement.
  - Cross-page bleed check: the new `data-marketing-section-title`, `data-marketing-cta-actions`, and `data-marketing-thesis-num` selectors only match elements that have those attributes — no impact on `/pricing`, `/intelligence`, or `/product` deep pages (they don't carry the same hooks). Existing 1024px and 768px base rules untouched.

- Notes:
  - **Mobile design philosophy applied**: (1) The phone mockup stays visible on mobile — it's the most compelling visual asset and a phone-within-a-phone reads as "the app I'm about to download running on the device I'm holding right now." (2) Density preserved where it carries meaning (Problem 2×2 brand tiles, RapidFire 2-up). (3) Type that earns its space — bigger headlines on mobile than the current spec, but tighter line-heights for vertical rhythm. (4) Touch targets ≥56px (App Store badges go from 52 → 56px height + full-width on mobile). (5) Hide what doesn't translate (FinalCTA SVG line, Intelligence stage markers). (6) New small-phone breakpoint at 420px for the tightest layouts.
  - **The pattern for future mobile work**: add `data-marketing-*` hooks to component elements that need conditional layout, then drive the responsive behavior entirely from `globals.css`. The "ENHANCED MOBILE PASS" block at the bottom of `globals.css` is non-destructive and additive — append new rules there, don't edit the older layer.
  - **Choreographed scroll reveals are unaffected** — the prior session's `Reveal` rhythm (header opener + staggered content) works the same on mobile as desktop, no changes needed.
  - **Deep pages (`/pricing`, `/intelligence`, `/product`) were NOT touched in this pass** — they still have only the base 2-tier mobile layer. They'll need their own audit for the same first-class treatment when product calls for it. Captured as an open thread.
  - **The `cursor-ide-browser` MCP returns stale layout data after viewport resize calls** — `browser_resize` was acknowledged but the page didn't reflow. Bounding-box queries returned the same y-coordinates regardless of resize. Workaround: trust the served CSS bundle as the source of truth (the rules are confirmed present) and verify visually in a real browser/DevTools when needed. Not a blocker for this session, but worth knowing for future verification.

## 2026-05-12 - Vitrine Marketing Site Multi-Page Restructure (7 phases)

- Summary: Restructured the V3 marketing site from a single-page lander into a hybrid multi-page architecture: a tight `/` lander (10 narrative sections) plus three deep pages — `/pricing`, `/intelligence`, `/product` — for the surfaces that earn their own URL. Added `/login` as a "Web App Coming Soon" placeholder, plus draft `/privacy` and `/terms` legal pages flagged for legal review. Deleted the `/lab` snapshot route and three orphaned section files (`LiveComingSection`, `ProSection`, `MarketingSiteLab`) once design sign-off cleared. Seven atomic phases with build-green commits at every step.

- Phase 1 — Lab mirror + home restructure (`marketing: phase 1 — multi-page restructure foundation`):
  - `apps/web/components/marketing/MarketingSiteLab.tsx` (new) — frozen snapshot of the original 18-section composition, used by `/lab` as the reference surface during the build.
  - `apps/web/components/marketing/sections/RapidFireFeatures.tsx` (new) — 12-tile feature wall with icon + headline + subhead per tile. Sourced from `RAPID_FIRE_TILES` constant added to `apps/web/lib/marketing/constants.ts`.
  - `apps/web/components/marketing/MarketingSite.tsx` — restructured to compose 10 sections (down from 18): SiteNav → Hero → Problem → Thesis → Intelligence → HowItWorks → RapidFireFeatures → Explore → Community → Press → FinalCTA → Footer. Section kicker numbers (`§01`–`§09`) renumbered to reflect the new IA.
  - `SiteNav.tsx` + `MobileNav.tsx` — wired to actual `next/link` deep pages (`/intelligence`, `/product`, `/pricing`, `/lab`, `/login`) instead of in-page `#anchor` links. `usePathname()` for active-link state. Cross-page download CTA → `/#download` (so navigating from `/pricing` → "Get the app" reaches the home anchor).
  - `apps/web/components/marketing/ComingSoonPage.tsx` (new) — shared placeholder layout for skeleton routes during the build.
  - Skeleton routes shipped: `apps/web/app/{pricing,intelligence,product,login}/page.tsx`. `apps/web/app/lab/page.tsx` mounts `MarketingSiteLab` with `metadata.robots = { index: false, follow: false }`.

- Phase 2 — `/pricing` (`marketing: phase 2 — /pricing real page from pricing-model.md`):
  - `apps/web/lib/marketing/pricing-data.ts` (new) — single source of truth for pricing: `TIERS` (Free / Pro $9.99 / Collector $24.99 with monthly/annual + effective monthly), `FOUNDERS_PRICING` (10K-cohort lock at $9.99 forever), `VIEW_VS_GENERATE` keystone rows, `FEE_TABLE` (10% Free/Pro, 7% Collector), `COMPARISON_ROWS` (full feature matrix), `PRICING_FAQS`.
  - `apps/web/components/marketing/pricing/` (new) — `PricingHero`, `FoundersPricingBanner`, `PricingCards` (monthly/annual toggle), `ViewVsGenerateSection` (the "everyone views, Pro+ generates" keystone), `MarketplaceFeeMath` (3% Collector discount + tier-recommender), `ComparisonTable` (collapsible full matrix), `PricingFAQ`.
  - `apps/web/app/pricing/page.tsx` — replaced skeleton with full composition.
  - `apps/web/next.config.mjs` — removed legacy `/pricing → /#pro` 308 redirect that would otherwise block the new page.

- Phase 3 — `/intelligence` (`marketing: phase 3 — /intelligence cornerstone Looking Glass page`):
  - `apps/web/lib/marketing/intelligence-data.ts` (new) — `EXTRACTION_EXAMPLES` (multi-vertical: cards / watches / wine / coins / comics / vinyl with field-level confidence), `BEFORE_AFTER_FIELDS` (what other apps make you fill vs what we extract from one photo), `VAR_EXPLANATION`, `AAR_EXPLANATION`, `PULSE_EXPLANATION`, `TECH_CREDIBILITY` cards.
  - `apps/web/components/marketing/intelligence/` (new) — `IntelligenceHero` (the "Tell us nothing. We read the piece." manifesto), `MultiVerticalExamples`, `BeforeAfterComparison`, `VARExplanation`, `AARExplanation`, `PulseLensExplanation` (clarifies vs the marketing-side Activity), `TechnicalCredibility` (Gemini Flash + multi-pass + validation), `IntelligenceCTA`. Shared `ReportExplanationCard` standardizes VAR/AAR/Pulse layouts.
  - Migrated `sections/CompsSection.tsx` → `intelligence/CompsArea.tsx` (move + rename, refactored copy for the inline narrative).
  - `apps/web/app/intelligence/page.tsx` — replaced skeleton with full composition.

- Phase 4 — `/product` (`marketing: phase 4 — /product full toolkit page`):
  - Migrated 6 sections from `sections/` → `product/` (move + rename + product-page narrative refactor): `CatalogingSection` → `CatalogArea`, `ShowcasesSection` → `ShowcaseArea`, `TrackingSection` → `TrackArea`, `PulseSection` → `ActivityArea` (this is where the Pulse → Activity rename eliminates the in-app-Pulse-lens naming collision), `CategoriesSection` → `CategoriesArea`, `FAQSection` → `ProductFAQ`. Original `FAQS` constant split into `PRODUCT_FAQS` (here) + `PRICING_FAQS` (in pricing-data.ts).
  - `apps/web/components/marketing/product/` new components: `ProductHero` (8 surfaces lined up), `ShareArea` (drop a link in iMessage / `/s/c/[id]` resolvers / friction-free preview), `TradeArea` (marketplace summary + fee structure → `/pricing`), `DiscoverArea` (network signals + suggested collectors), `ProductCTA`.
  - `apps/web/app/product/page.tsx` — replaced skeleton with composition: ProductHero → CatalogArea → ShowcaseArea → TrackArea → ActivityArea → ShareArea → TradeArea → DiscoverArea → CategoriesArea → ProductFAQ → ProductCTA. The longest, deepest page on the site (~11 areas) — appropriate for the "we have features for days" surface.

- Phase 5 — `/login` + footer pages + sitemap/robots (`marketing: phase 5 — /login + /privacy + /terms + sitemap/robots`):
  - `apps/web/app/login/page.tsx` — replaced skeleton with a richer "Web App Coming Soon" page: V3 dark frame, app store + Play badges, "your collection lives in your pocket" headline, link back to home. Noindexed via metadata.
  - `apps/web/components/marketing/LegalPage.tsx` (new) — shared layout for legal placeholder pages: sticky DRAFT banner, intro copy, sectioned body, contact line. Used by both privacy and terms.
  - `apps/web/app/privacy/page.tsx` + `apps/web/app/terms/page.tsx` — plain-English draft policies covering data collection, sharing/visibility, retention/export, marketplace, fees, acceptable use, etc. Both noindexed via metadata pending real legal review.
  - `apps/web/app/robots.ts` (new) — disallows `/lab` (Phase 5 era). Updated in Phase 7 to remove `/lab` rules entirely.
  - `apps/web/app/sitemap.ts` (new) — includes `/`, `/pricing`, `/intelligence`, `/product`, `/privacy`, `/terms`. Excludes `/lab` and `/login`.
  - `apps/web/components/marketing/sections/Footer.tsx` — rebuilt with proper `Link` components. `FooterColumn` items shape evolved from `string[]` to `FooterItem[] = { label, href? }`. Live links: Product → `/product`, Looking Glass → `/intelligence`, Pricing → `/pricing`, Get the app → `/#download`, Privacy → `/privacy`, Terms → `/terms`. Items without an href render as muted "coming soon" text.
  - Fixed React 19 spread-key warning in `product/ShowcaseArea.tsx` (destructure `key` out before spreading).

- Phase 6 — Copy + content refinement (`marketing: phase 6 — copy + content refinement across all pages`):
  - Hero (`/`): refreshed lead paragraph from a soft three-clause description into tighter beats — "One photo. Every field, extracted. The market, watched. The comp, found. The piece, valued." Closes on "the apparatus it deserved."
  - Intelligence (`/`): new section title "Tell us nothing. We read the piece." (was "Four photos. Four seconds.") Subhead rewritten around the tell-us-nothing thesis.
  - Activity (`/product`): subhead rewritten as the social-signal feed for collectors and pieces the user actually cares about. Concrete examples (grail listed, NFST → For Sale, comp inside tolerance, Showcase crown jewel updated) ground the abstract claim.
  - Community (`/`): three identical "Followed because of: <same quote>" lines replaced with three distinct hooks per collector card (What she owns / How he curates / Why he matters) and three distinct curator notes. Misleading follower-count stat replaced with "Cataloging since YYYY" — depth signal, not engagement-bait. Subhead explicitly calls out no follower scoreboards / no reposts of reposts.
  - Testimonials (`PressSection /`): restructured `Quote` shape from `{ q, a }` to `{ quote, name, role, placeholder? }`. New shape lets us drop in real names + roles cleanly. Third card ships as a placeholder "[Your name here]" / "OPEN SLOT" styled with a dashed border so the slot is unambiguous to anyone editing the file.
  - Cross-page QA: section kicker numbers (§01-§09) verified sequential, all deep-page nav links resolve 200, pricing math reconciled to source doc, no orphaned legacy imports.

- Phase 7 — Cleanup (this commit):
  - Deleted `apps/web/app/lab/` (route) and `apps/web/components/marketing/MarketingSiteLab.tsx` (composition).
  - Deleted orphaned section files left over from the migration: `sections/LiveComingSection.tsx` (already excluded from new home IA, no surviving consumer post-Lab) and `sections/ProSection.tsx` (content folded into `/pricing` in Phase 2).
  - Removed `LiveComingSection` and `ProSection` exports from `sections/index.ts`.
  - Removed the "Lab" link from `SiteNav.tsx` and `MobileNav.tsx` (along with the `lab` flag and WIP badge code paths).
  - Updated `MarketingSite.tsx` doc comment to drop the `/lab`/MarketingSiteLab reference.
  - `robots.ts` — dropped `/lab` disallow rules (path no longer exists).
  - Doc updates: this entry, plus `CURRENT_STATE.md`, `HANDOFF.md`, `OPEN_THREADS.md`.

- Files Changed:
  - **New (Phases 1-7)**: `apps/web/app/{pricing,intelligence,product,login,privacy,terms}/page.tsx`, `apps/web/app/{robots,sitemap}.ts`, `apps/web/components/marketing/{ComingSoonPage,LegalPage}.tsx`, `apps/web/components/marketing/pricing/*` (7 files), `apps/web/components/marketing/intelligence/*` (~10 files), `apps/web/components/marketing/product/*` (~11 files), `apps/web/components/marketing/sections/RapidFireFeatures.tsx`, `apps/web/lib/marketing/{pricing-data,intelligence-data}.ts`.
  - **Modified**: `apps/web/components/marketing/MarketingSite.tsx` (10-section composition + comment), `apps/web/components/marketing/sections/{SiteNav,MobileNav,Footer,Hero,IntelligenceSection,CommunitySection,PressSection,ThesisSection,ProblemSection,HowItWorksSection,ExploreSection,FinalCTA,SectionHeader,index}.tsx`, `apps/web/lib/marketing/constants.ts` (`RAPID_FIRE_TILES`, refined `Quote` + `CollectorCard` shapes, `FOOTER_COLUMNS` with hrefs, `PRODUCT_FAQS`), `apps/web/next.config.mjs` (legacy redirect cleanup).
  - **Deleted (Phases 3-4 migrations)**: `apps/web/components/marketing/sections/{CompsSection,CatalogingSection,ShowcasesSection,TrackingSection,PulseSection,CategoriesSection,FAQSection}.tsx` (moved/renamed to `intelligence/` and `product/`).
  - **Deleted (Phase 7)**: `apps/web/app/lab/page.tsx`, `apps/web/components/marketing/MarketingSiteLab.tsx`, `apps/web/components/marketing/sections/{LiveComingSection,ProSection}.tsx`.

- Validation:
  - `pnpm --filter @vitrine/web build` after every phase → green.
  - Final route inventory: `/`, `/_not-found`, `/intelligence`, `/login`, `/pricing`, `/privacy`, `/product`, `/terms`, `/icon`, `/apple-icon`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`. (16 routes vs. 8 pre-restructure.)
  - All routes return 200 in dev smoke test. Cross-page nav verified. Footer Privacy / Terms / Product / Intelligence / Pricing links resolve.
  - `ReadLints` clean on every new + modified file across all 7 phases.

- Notes:
  - **The Pulse → Activity rename happened only on the marketing side.** The in-app Pulse lens (per-piece market intel report) keeps its name; `intelligence/PulseLensExplanation.tsx` describes it. The marketing-side `ActivityArea` (under `/product`) is the social-signal feed for the collector network. Prior to this rename, both surfaces shared the "Pulse" name and confused new visitors.
  - **`PRESS_QUOTES` ships with a placeholder slot.** The third testimonial card is intentionally `placeholder: true` with `name: "[Your name here]"` and `role: "OPEN SLOT · HELLO@VITRINE.APP"`. When a real testimonial lands, swap the entry and remove the flag — no component changes required.
  - **Pricing math sanity-check**: Pro $89/yr ÷ 12 = $7.42/mo effective; Collector $249/yr ÷ 12 = $20.75/mo effective; 3% Collector marketplace fee discount pays for itself at ~$1,000 GMV/mo. Verified against `vitrinedb/docs/pricing-model.md`.
  - **Real ThesisSection app screenshots deferred.** The plan called for inline visuals of FramedHero, lens architecture, dossier card. No real assets are available; flagged in OPEN_THREADS.
  - **Founders pricing as "first 10K Pro subscribers locked at $9.99 forever"** is referenced both in the `/pricing` page (FoundersPricingBanner) and in the `/terms` placeholder page. Keep them in sync if the offer changes.
  - **`/privacy` and `/terms` are draft.** Sticky DRAFT banner makes this unambiguous in the UI; pages are noindexed via metadata. Real legal review must happen before launch.
  - **Legacy `/features` URL** now 308 redirects to `/product` (not `/#intelligence` as before). Other legacy redirects preserved: `/about → /#thesis`, `/explore → /#explore`, `/contact → /#footer`, `/identity → /`. `/pricing` redirect was deleted — it's a real page now.

## 2026-05-12 - Vitrine Marketing Site V3 Rebuild (single-page, dark-first)

- Summary: Replaced the legacy multi-page web marketing site (light "Contemporary Gallery" + ~20 home/about/pricing/features/explore/contact components) with a single-page V3-aligned port of the `c:\Users\johnj\vitrine-2026` HTML mockup. Re-skinned the three share resolvers (`/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`) in matching frost-on-void aesthetic so the brand reads as one app from first impression through download. Killed all six legacy marketing routes with permanent 301s to `#anchor` sections of `/`. Replaced static `/icon.svg` favicon with dynamic Next.js `next/og` icon + apple-icon + opengraph-image endpoints, all rendering the canonical Vitrine crown-in-vitrine mark from a single shared path-data module. Mobile responsive across all 20 marketing sections + share resolvers via two breakpoints (≤1024px tablet, ≤768px phone) with hamburger nav. Six atomic commits, build green at every step.

- Phase 1 — Foundation (`Rewire web to V3 design tokens + canonical brand assets`):
  - Rewrote `apps/web/app/globals.css` `:root` block with V3 dark palette sourced from `@vitrine/design-tokens` `DARK_COLORS`. Mapped existing shadcn vars (`--background`, `--foreground`, `--primary`, etc.) onto V3 values so authenticated UI components keep working. Added marketing-specific vars: `--fg1` `--fg2` `--fg3` `--frost-divider` `--frost-border(-strong)` `--brand-volt(-fill/-border)` semantic colors (`--green/blue/orange/red` + fills/borders), trait colors (`--pink/violet/olive/cyan` + fills/borders), `--sheet-bg` `--press-overlay` `--scrim`. Updated the `@theme inline {}` block to expose new vars as Tailwind utilities.
  - Switched `viewport.themeColor` to `#000000`, `colorScheme: "dark"` in `apps/web/app/layout.tsx`. Swapped fonts: kept Inter + JetBrains Mono, added Space Grotesk (Manrope replacement), Libre Caslon Text (Instrument Serif replacement, both regular + italic), and Electrolize. All via `next/font/google`. CSS variables: `--font-electrolize` `--font-grotesk` `--font-inter` `--font-jetbrains-mono` `--font-caslon`.
  - Brand assets: copied `apps/native/assets/logo.svg` → `apps/web/public/logo.svg` with `fill="#F0F4FA"` swapped to `fill="currentColor"` so the wordmark adapts to its container's text color. Created `apps/web/components/marketing/VitrineLogo.tsx` (full lockup React wrapper) and `apps/web/components/marketing/VitrineMark.tsx` (standalone crown mark, mirrored from `apps/native/components/vault/icons/vitrine-mark-icon.tsx`).
  - Token bridge: `apps/web/lib/marketing/tokens.ts` exports a `T` object resolving CSS vars (`void: "var(--background)"`, `volt: "var(--brand-volt)"`, `frostDiv: "var(--frost-divider)"`, etc.) so section components consume tokens as `T.void` / `T.volt` rather than re-typing every `var(--…)` reference. This makes the JSX port a near-1:1 translation of the mockup.
  - Added marketing keyframes to `globals.css`: `pulseGlow`, `feedFadeIn`, `marqueeX`, `ctaGlow`, `lineDraw`, `printoutIn`, `holoSheen`, `blink`.

- Phase 2 — Primitives & motion hooks (`Add marketing primitives & motion hooks for V3 rebuild`):
  - 11 primitives in `apps/web/components/marketing/primitives/`: `FrostCard.tsx` (frost-bordered card with hover state), `Pill.tsx` (status variants: `for_sale`, `for_trade`, `sell_trade`, `nfst`, `rookie`, `signed`, `game_used`, `graded`, `volt`), `Kicker.tsx` (Space Grotesk uppercase label), `MIcon.tsx` (lucide-react wrapper with kebab→Pascal helper so the mockup's `<MIcon name="arrow-up-right">` works as-is), `AppStoreBadge.tsx` (Apple/Google badges with inline SVGs), `PulseRow.tsx` (single feed-event row), `Button.tsx` (solid/volt/frost/ghost variants), `CompRow.tsx`, `HolographicFrame.tsx`, `GradientVeil.tsx`, plus a barrel `index.ts`.
  - 7 motion + util modules in `apps/web/lib/marketing/`: `hooks.ts` (`useTicker`, `useDriftingPrice`, `usePulseFeed`, `usePrefersReducedMotion`, `useInView`, `useScrollProgress`, `useScrollY`, `useActiveSection`, `timeAgo`), `Reveal.tsx` (fade-up wrapper), `Stagger.tsx` (child stagger), `Parallax.tsx` (scroll-bound translateY), `photos.ts` (the 8 Unsplash URLs from the mockup's `blocks.jsx`), `constants.ts` (`SCHEMAS` 5 per-category field schemas, `CATS` 38 categories, `INTEL_STAGES` theater stage timings, `KICKER_CYCLE` hero category carousel, `PULSE_TEMPLATES` 9 feed templates), and the existing `tokens.ts` from Phase 1. Most primitives + all hooks marked `"use client"`.

- Phase 3 — 20 section components + `MarketingSite` composition (`Port marketing sections + compose MarketingSite for V3 rebuild`):
  - Ported every section from `c:\Users\johnj\vitrine-2026\marketing-{site,sections}.jsx` into `apps/web/components/marketing/sections/`: `SectionHeader`, `SiteNav`, `Hero` (+ `HeroPhone`, `PhoneFrame`, `PhoneScreen`, `ScreenIndicator`, `LiveStat`, `PhoneAppHome/Lens/Pulse`, kicker carousel), `PulseSection`, `ProblemSection`, `ThesisSection`, `IntelligenceSection` (+ `TheaterInputPanel`, `ExtractionArtifact`, `CapabilityTile`, `TaxonomyChip`, the 4.8s loop), `CatalogingSection` (CARD/WATCH/COMIC/SNEAKER/COIN tab switcher with cascading printout), `ShowcasesSection` (+ `ShowcaseCard`, parallax stagger), `TrackingSection` (left-text/right-SVG-chart with volatility band), `CompsSection` (+ `CompTier`), `CommunitySection` (3 collector cards with jewel grids), `CategoriesSection` (6×6 grid with hot highlighting), `HowItWorksSection` (3-step rail), `LiveComingSection` (Live Now / Roadmap split), `ExploreSection` (+ `SpatialCard`, filter chips, 4×2 grid), `ProSection` (+ `VARCard`, `AARCard`, `MarketPulseCard`, `AutoShowcaseCard`, `RuleChip`, Pro Covenant pull-quote), `PressSection` (3 quote cards + auction-house logo strip), `FAQSection` (+ `FAQItem` accordion), `FinalCTA`, `Footer`.
  - Mechanical swaps applied per file:
    - `const T = window.tokens` → `import { T } from "@/lib/marketing/tokens"`.
    - `const PHOTOS = ...` → `import { PHOTOS } from "@/lib/marketing/photos"`.
    - `window.useTicker` (etc.) → `import { useTicker } from "@/lib/marketing/hooks"`.
    - `window.lucide` MIcon → `<MIcon name="..." />` from primitives.
    - `accent.color` → hardcoded `T.volt`; `ACCENTS` palette object dropped (no volt/cyan/pink/amber injection).
    - `headline.lead/mid/tail` → hardcoded `Everything serious collectors deserve.` (`HEADLINES` map dropped).
    - `ctaLabel` → hardcoded `Get the app` (`CTA_COPY` map dropped).
    - `<TweaksUI>` and `useTweaks` → removed entirely.
    - `T.frost` / `T.frostStrong` / `T.sheet` → `T.frostBorder` / `T.frostBorderStrong` / `T.sheetBg` (V3 token names).
  - Composed everything in `apps/web/components/marketing/MarketingSite.tsx` (mirrors the mockup's section order, `"use client"`).
  - Replaced `apps/web/app/page.tsx` content with `<MarketingSite />` — no more `getMosaicImages` / `getCategoryTypes` / `getFieldExamples` data-loading.
  - Added `.nav-link`, `.cta-glow`, `details summary` polish to `globals.css` so `SiteNav` anchors and CTA pills get global hover/active treatments without per-component `<style>` blocks. All glows use V3 ivory (`rgba(232,224,212,…)`) instead of the original cyan/volt mix.

- Phase 4 — Mobile + tablet responsive (`Add tablet + phone breakpoints to marketing site`):
  - Two-tier responsive layer driven entirely from `globals.css` using `data-marketing-*` attributes that section components carry on every `<section>` and grid div. Section components include `data-marketing-section="<name>"`, `data-marketing-grid="<grid-id>"`, `data-marketing-section-header`, `data-marketing-section-num`, `data-marketing-section-title`, `data-marketing-hero(-grid|-title|-stats|-phone)`, `data-marketing-nav(-links|-actions|-cta|-signin)`, `data-marketing-mobile-nav`, `data-marketing-cta-title`.
  - **Tablet (≤1024px)**: section padding `140px 40px → 100px 24px`; hero collapses to single column (phone stacks under text); h1 `92 → 64`; SectionHeader stacks (`180px 1fr → 1fr`), §num `64 → 48`, h2 `76 → 56`; 4-col grids → 2-col; 6-col grid (Categories) → 3-col; 3-col grids → 2-col; all two-pane splits → stacked.
  - **Phone (≤768px)**: section padding → `72px 20px` (Pro/CTA → `96px 20px`); hero h1 `64 → 44`, hero phone hidden (type-led); hero stats 4-col → 2×2 wrap; SectionHeader §num `48 → 36`, h2 `56 → 36`; all multi-col grids → single column; Categories 3-col → 2-col; Footer top stacks; Explore filters → horizontal scroll, items 2-up; Final CTA title → 56px.
  - Hamburger nav: new `MobileNav.tsx` primitive — 38px circular toggle, slide-down fullscreen panel (anchor links + sign-in + ivory CTA), ESC-closes, body scroll-locks while open. Desktop links/sign-in/CTA hidden via `[data-marketing-nav-links]` / `[data-marketing-nav-actions]` on phone; mobile button hidden on desktop.
  - All overrides use `!important` because section components carry inline styles for `gridTemplateColumns`, `padding`, and `fontSize`. Inline-style specificity beats every external rule short of `!important`. Trade-off accepted — this stylesheet is the single source of truth for breakpoints, no cascade ambiguity.

- Phase 5 — Share-resolver re-skin (`Re-skin share resolvers in V3 frost-on-void + mobile responsive`):
  - `apps/web/components/share/share-landing.tsx` rewritten end-to-end. Pure void background with the same faint grid + warm halo used in `Hero`. Wordmark header bar (`VitrineLogo`) with frost "Get the app" pill on the right. Stack: Kicker → image card (frost-bordered, aspect-ratio 1:1) → display title (Electrolize, balanced wrap) → italic Caslon subtitle → optional description → stats row (JetBrains Mono with kicker labels) → ivory CTA pill (`var(--brand-volt)` / `cta-glow` className) → muted Google Play text link → fine-print.
  - 404 state: oversized `404` numeral in volt, italic Caslon explainer line, ivory CTA back home.
  - Re-uses marketing primitives so the design system stays single-source: `T` token bridge, `Kicker`, `VitrineLogo`, `cta-glow` className.
  - Mobile responsive (≤768px / ≤420px) handled in `globals.css` via new `data-share-*` attributes (`data-share-page` / `-header` / `-stack` / `-title` / `-stats` / `-image` / `-header-cta`).
  - Direct Supabase queries in `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]` are unchanged — the resolver pages still render `<ShareLanding />` with the same prop shape so all three URL types pick up the new design automatically.

- Phase 6 — Cleanup, redirects, OG/icons (`Marketing cleanup: kill legacy routes, refresh OG/icons, update memory`):
  - **Routes deleted**: `apps/web/app/{about,pricing,identity,features,contact,explore}/`.
  - **Components deleted**: every file under `apps/web/components/{home,about,pricing,features,contact,explore,identity,app-ui}/` (~40 files), plus root-level orphans `navigation.tsx`, `footer.tsx`, `universal-cta.tsx`, `tilt-card.tsx`, `live-ticker.tsx`, `error-state.tsx`, `page-transition.tsx`, `download-modal.tsx`, `custom-cursor.tsx`, `scroll-reveal.tsx`, `spatial-background.tsx`, `theme-provider.tsx`, `category-orbs.tsx`, `magnetic-button.tsx`, `empty-state.tsx`, `loading-state.tsx`, `profile-ring.tsx`, `data-stream.tsx`, `adaptive-image.tsx`, `chromatic-logo.tsx`, `section-label.tsx`. Verified zero remaining importers via grep before each delete sweep. Shadcn `apps/web/components/ui/*` kept in place (no current importers but reusable for future authenticated routes).
  - **Orphaned data files deleted**: `apps/web/lib/explore-data.ts`, `apps/web/lib/category-data.ts`. `apps/web/lib/` now contains only `api.ts`, `supabase.ts`, `utils.ts`, plus the `marketing/` subtree.
  - **`apps/web/app/not-found.tsx` rewritten** in V3 frost-on-void (it previously imported the deleted `Navigation` and `Footer`). Same atmosphere as ShareLanding.
  - **Redirects** added to `apps/web/next.config.mjs`:
    - `/about → /#thesis` `/pricing → /#pro` `/features → /#intelligence` `/explore → /#explore` `/contact → /#footer` `/identity → /` (all `permanent: true`).
  - **Dynamic icon endpoints** at `apps/web/app/{icon,apple-icon,opengraph-image}.tsx` using `next/og` `ImageResponse` on the Edge runtime. All three render the crown mark from a shared path-data module `apps/web/lib/marketing/brand-paths.ts` (`VITRINE_MARK_VIEWBOX` + `VITRINE_MARK_PATHS` array). `VitrineMark` component refactored to consume the same module so brand changes propagate to all three endpoints + the in-page mark in lockstep. Icon: 64×64 ivory mark on void. Apple-icon: 180×180 same. OG: 1200×630 with mark + ELECTROLIZE wordmark + headline + tagline + warm halo.
  - Removed static `apps/web/app/icon.svg` (replaced by dynamic `icon.tsx`) and removed the `metadata.icons` block from `layout.tsx` (Next picks up `icon.tsx` automatically).

- Files Changed:
  - **New (Phase 1-2)**: `apps/web/app/globals.css` (rewired), `apps/web/app/layout.tsx` (fonts + metadata), `apps/web/public/logo.svg`, `apps/web/components/marketing/{VitrineLogo,VitrineMark}.tsx`, `apps/web/lib/marketing/{tokens,hooks,photos,constants,Reveal,Stagger,Parallax}.{ts,tsx}`, `apps/web/components/marketing/primitives/{FrostCard,Pill,Kicker,MIcon,AppStoreBadge,PulseRow,Button,CompRow,HolographicFrame,GradientVeil,index}.{ts,tsx}`.
  - **New (Phase 3)**: `apps/web/components/marketing/MarketingSite.tsx`, `apps/web/components/marketing/sections/{SectionHeader,SiteNav,Hero,PulseSection,ProblemSection,ThesisSection,IntelligenceSection,CatalogingSection,ShowcasesSection,TrackingSection,CompsSection,CommunitySection,CategoriesSection,HowItWorksSection,LiveComingSection,ExploreSection,ProSection,PressSection,FAQSection,FinalCTA,Footer,index}.{ts,tsx}`. `apps/web/app/page.tsx` reduced to a single `<MarketingSite />` render.
  - **New (Phase 4)**: `apps/web/components/marketing/sections/MobileNav.tsx`. Responsive CSS appended to `apps/web/app/globals.css`. SiteNav + SectionHeader instrumented with `data-marketing-*` attributes.
  - **New (Phase 5)**: `apps/web/components/share/share-landing.tsx` (full rewrite). Share responsive CSS appended to `globals.css`.
  - **New (Phase 6)**: `apps/web/app/{icon,apple-icon,opengraph-image}.tsx`, `apps/web/lib/marketing/brand-paths.ts`. `apps/web/app/not-found.tsx` rewritten. `apps/web/next.config.mjs` redirects added. `VitrineMark.tsx` refactored to consume `brand-paths.ts`.
  - **Deleted (Phase 6)**: 6 route directories, 7 component-category directories, ~21 root-level orphan components, 2 orphaned data files, static `icon.svg`. See per-phase commits for the exhaustive list.

- Validation:
  - `pnpm --filter @vitrine/web build` after every phase → green. Final route inventory: `/`, `/_not-found`, `/icon`, `/apple-icon`, `/opengraph-image`, `/s/c/[id]`, `/s/p/[id]`, `/s/s/[id]`. Down from 12 routes pre-rebuild.
  - `ReadLints` clean on every new + modified file.
  - Build successfully generates dynamic icon, apple-icon, OG image (Edge runtime, Satori-rendered SVG path data).

- Notes:
  - Inline styles preserved across section components (rather than rewritten to Tailwind) because the mockup encodes hundreds of micro-decisions (`letterSpacing: -1.4`, `lineHeight: 0.94`, etc.) that don't translate cleanly to utility classes. Every color/font/spacing reference still flows through CSS variables fed by `@vitrine/design-tokens` via the `T` bridge — token consistency without rewrite cost.
  - `cta-glow` className is shared by SiteNav, ShareLanding, and 404 because all three need the same hover treatment. Defined once in `globals.css` so future surfaces just opt in.
  - `data-marketing-*` attribute system was chosen over per-component `<style jsx>` blocks because (a) it keeps all breakpoint logic in one file, (b) section components stay framework-agnostic (work in any React tree), and (c) inline-style overrides require `!important` regardless of where the media query lives.
  - `next/og` Satori does support `<svg><path>` so the dynamic icon endpoints can render the canonical brand mark without rasterizing. Single source of truth for the path data lives in `brand-paths.ts`; both `VitrineMark` and the three icon endpoints consume it. If the brand mark ever changes, edit one file.
  - Legacy `apps/web/components/ui/*` (shadcn) kept intentionally — no current importers, but the eventual authenticated web app will need the primitives. Tree-shaken out of the marketing bundle.
  - 301 redirect for `/identity → /` (no anchor analog) is the only "soft" redirect; the rest map to thematically-closest sections of the new single-page narrative.

## 2026-05-11 - Day 2 Shared Packages: design-tokens, constants, types, api

- Summary: Completed Day 2 of the monorepo migration by extracting four shared workspace packages from the native codebase. Day 2.1 lifted design tokens (`tokens.ts`, `status-config.ts`, `trait-config.ts`, `match-tiers.ts`, `activity-verbs.ts`) into `@vitrine/design-tokens` and unified `APP_STORE_URL` / `PLAY_STORE_URL` / share-domain constants into `@vitrine/constants`. Day 2.2 extracted shared domain types (User, Collectible, ShowcaseDetail, MarketItem, ManagedRules, JournalEntry, ListingStatus, …) into `@vitrine/types`, including a generated Supabase `Database` type, and rewired ~20 native components + every API module to import from `@vitrine/types`. Day 2.5 (the most invasive phase) rebuilt the API layer: 12 portable Supabase modules were converted from singleton imports to factory functions (`createXApi(supabase, logger, env?)`) and moved into `packages/api/src/modules/`. A mega-factory `createApi({ supabase, logger, env })` composes them all and returns a typed `VitrineApi`. To avoid breaking hundreds of existing native call sites, `bindToSingleton()` stores the composed instance and the package re-exports ~60 flat functions; the native app calls `bindToSingleton()` once at module load via `apps/native/lib/api/index.ts` and 14 thin shim files (`apps/native/lib/api/notifications.ts`, etc.) re-export the relevant symbols under their original paths. Five modules stayed native-only because they depend on Expo / React Native APIs (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`). The web app gained `apps/web/lib/api.ts` with a `getServerApi()` helper that lazily builds a `VitrineApi` against the web Supabase client; the showcase share resolver (`/s/s/[id]`) was migrated to use it. Notifications and extraction modules accept a small `env` object (`supabaseUrl`, `supabaseAnonKey`) so they don't reach for `process.env` directly. Follows now injects the notifications API for new-follower side effects. Showcases inlined `getTrackCounts` and the pure `previewRuleMatches` helper to stay portable without dragging in the native-only `tracking` module.
- Files Changed:
  - **New packages**:
    - `packages/design-tokens/` — colors, typography, spacing, radii, status/trait/match-tier helpers. Pure TS.
    - `packages/constants/` — share URL helpers, store URLs, image upload limits, pagination defaults.
    - `packages/types/` — domain types + generated `Database` type.
    - `packages/api/` — factory modules in `src/modules/` (`blocked`, `comps`, `fields`, `search`, `activity`, `notifications`, `follows`, `network`, `categories`, `extraction`, `explore`, `showcases`, `managed-rules`), `factory.ts`, `logger.ts`, `utils.ts`, `index.ts` (mega-factory + singleton facade + flat re-exports).
  - **Native rewire**:
    - `apps/native/package.json` — added `@vitrine/design-tokens`, `@vitrine/constants`, `@vitrine/types`, `@vitrine/api` (`workspace:*`).
    - `apps/native/lib/design/index.ts` — re-exports `@vitrine/design-tokens` plus the native-only `theme-context.tsx`.
    - `apps/native/lib/api/index.ts` — calls `bindToSingleton()` once, re-exports `@vitrine/api` plus native-only modules (`auth`, `collectibles`, `tracking`, `views`, `market`, `trading-cards`, `client`, `config`, `messaging`).
    - `apps/native/lib/api/{blocked,comps,fields,search,activity,notifications,follows,network,categories,extraction,explore,showcases,managed-rules}.ts` — replaced with shim files that import `@/lib/api` for singleton bind, then re-export from `@vitrine/api` (with type aliases where old barrel names differed, e.g. `ResolveFieldsResponse`, `getMutualFollowsV2`).
    - ~20 components updated to import domain types from `@vitrine/types` and design primitives from `@vitrine/design-tokens`.
  - **Web rewire**:
    - `apps/web/package.json` — added `@vitrine/api`, `@vitrine/constants`, `@vitrine/types` (`workspace:*`).
    - `apps/web/lib/api.ts` (new) — `getServerApi()` lazy-builds a `VitrineApi` with the web Supabase client + console logger.
    - `apps/web/app/s/s/[id]/page.tsx` — share resolver migrated to `getServerApi().showcases.getShowcaseById(id)`.
- Validation:
  - `pnpm install` clean.
  - `pnpm --filter @vitrine/api exec tsc --noEmit` → 0 errors.
  - `pnpm --filter @vitrine/web build` → all 12 routes build.
  - `pnpm --filter @vitrine/native exec tsc --noEmit` → 125 errors (down from 137 pre-Day-2 baseline; all remaining errors are pre-existing in legacy components, not introduced by this work).
- Notes:
  - The factory pattern was chosen over a global `setSupabaseClient(...)` mutator because it (a) makes the API trivially testable with a mock Supabase client and (b) lets the web side spin up a per-request client without polluting native singleton state.
  - `bindToSingleton()` is the bridge that keeps the native app's hundreds of legacy `import { ... } from '@/lib/api/...'` call sites working unchanged. Long-term the plan is to migrate native call sites to the API instance directly, but that's a separate sweep.
  - `notifications` and `extraction` were the only modules that needed env injection; everything else is purely supabase + logger.
  - `managed-rules` stayed a pure module (no factory) because it has zero Supabase dependency and is also mirrored on the Edge Function side.
  - Web's collectible (`/s/c/[id]`) and profile (`/s/p/[id]`) share resolvers still use direct Supabase queries because the underlying data needs `collectibles` / `auth` modules that remain native-only. Migrating those is a Day 3 item.

## 2026-05-10 - Remove Onboarding Quiz: Simplify Auth Flow to Profile Completion Only

- Summary: Removed the multi-step onboarding quiz (usage intents → collectible type interests → marketplace personality) that was designed to feed a social feed home screen that no longer exists. The quiz data had zero consumers — `getUserPreferences` and `getOnboardingStatus` were defined but never called. The only downstream use of onboarding was `onboarding_completed_at IS NOT NULL` as a "real user" filter in RPCs. Solution: set `onboarding_completed_at` at the end of profile completion, remove the onboarding gate from auth routing, delete all quiz code and DB tables. Auth flow is now: Login/Signup (email OTP) → Complete Profile (name, username, email → optional avatar/bio) → Tabs.
- Files Changed:
  - `app/complete-profile/index.tsx` — added `markOnboardingComplete()` helper that sets `onboarding_completed_at` on the user row; called from both `handleFinishProfile` and `handleSkipFinish`.
  - `lib/contexts/auth-context.tsx` — removed `onboardingRequired` from `ProfileStatus`, removed `markOnboardingComplete` from context, removed `/onboarding` routing gate.
  - `lib/supabase.ts` — `checkProfileStatus` no longer returns `onboardingRequired`.
  - `lib/api/auth.ts` — `getProfileStatus` no longer selects `onboarding_completed_at`; `ProfileStatus` type updated.
  - `components/nav-menu.tsx` — removed "Onboarding (TEST)" from dev test links.
  - `supabase/migrations/20260510000000_drop_onboarding_quiz_tables.sql` (new) — drops `user_usage_intents`, `user_marketplace_preferences`, `user_type_interests`.
  - **Deleted**: `app/onboarding/index.tsx`, `components/onboarding.tsx`, `lib/api/user-preferences.ts`.
- Validation: All lints clean on edited files. Grep confirms zero remaining references to `onboardingRequired`, `saveOnboardingPreferences`, or `user-preferences` imports. `onboarding_completed_at` still used correctly in `lib/api/search.ts`, `lib/api/explore.ts`, and RPC migrations. Migration applied manually via Supabase Dashboard SQL Editor.
- Notes: The `users.onboarding_completed_at` column is intentionally kept — it gates "real user" visibility in search/explore/suggested RPCs. If personalized discovery is needed later, collect preferences in-context rather than a gated quiz at signup.

## 2026-05-08 - Upload Flow Polish: Capture Sheet + Review Redesign + FramedHero Extraction + Theater Tuning

- Summary: Comprehensive polish pass on the AI upload flow following the prior session's async pipeline + Looking Glass HUD work. Five major deliverables: (1) **Capture screen UX** — added an `ActionSheet` (Take Photo / Choose from Library) on empty-tile tap so collectors can shoot in-hand instead of the library-only flow; added camera permission handling with deep-link to Settings on denial. (2) **Keyboard avoidance** — wrapped both Scan and Review steps in `KeyboardAvoidingView` using the proven `vault/rapid-fire-edit.tsx` pattern (`offset={0}` + ScrollView + docked footer); first attempt with `offset={insets.top + 62}` was wrong because RN's KAV offset compensates for native chrome RN can't measure, not for in-layout headers. (3) **Review screen redesign** — extracted `FramedHero` from `details-lens.tsx` into a shared `components/detail/framed-hero.tsx` (Path A — single source of truth, no inline copy), and added a fullscreen tap-to-zoom **lightbox** with paginated swipe + counter + X-to-close. Both DetailsLens and the upload Review now share the exact same hero component, giving collectors a 1:1 preview of the production surface. Removed "Identified" + classification breadcrumb, replaced single-image identity card with `FramedHero` carousel, moved trait pills above title (matching DetailsLens order), folded "Needs review" badge into the confidence hint card. (4) **Inline editable listing copy** — title and description now render as `InlineEditableField` components (always-on `TextInput` styled to look like display text + always-visible `Pencil` icon + focus chrome + counter on focus). Edits flow through new `listingEdits` state and the commit step, separate from the rapid-fire `fieldEdits` queue. Title is multiline-with-newlines-stripped to support visual wrap without semantic line breaks. Char caps tightened from initial 120/600 to **90/420** based on observed max in `john@myvitrine.app`'s 529 production collectibles (max title 86, max desc 418). Capture screen context input also unified to `LISTING_TITLE_MAX` (90, was 180) for consistency. (5) **Theater easing rebalance** — unified all three concurrent animations (progress ring, image reveal opacity, sharp-fade blur removal) on `Easing.inOut(Easing.quad)`. Previously the ring used `Easing.out(Easing.quad)` (front-loaded sprint) while images used `Easing.inOut(Easing.cubic)` (dramatic mid-burst), making the screen feel rushed and uncoordinated. Also fixed `ANALYZING` text in the ring being invisible — was `textTertiary` (#5c5c5c, blended into both backdrop and reveal image), bumped to `textPrimary` (#f0f0f0). Visual hierarchy preserved by 32pt vs 10pt size gap.
- Files Changed:
  - **New shared component**:
    - `components/detail/framed-hero.tsx` (new) — extracted from DetailsLens with new Lightbox subcomponent. `enableLightbox` prop defaults true; consumers can opt out.
  - **Detail lens (modified)**:
    - `components/detail/lenses/details-lens.tsx` — imports shared `FramedHero`, removed ~70 lines of inline carousel + 8 orphaned styles. Auto-inherits the new lightbox.
  - **Upload entry (extensive)**:
    - `components/upload-entry.tsx` — capture sheet (`openPhotoSourceSheet` + `pickFromCamera` + `pickFromLibrary`), review redesign (`InlineEditableField` component, `listingEdits` state, FramedHero integration, KAV wrapping, removed identity card overlay + "Identified" header), `LISTING_TITLE_MAX`/`LISTING_DESCRIPTION_MAX` constants (90/420), theater easing unified to `Easing.inOut(Easing.quad)` in 3 places, `ANALYZING` color fix (`textTertiary` → `textPrimary`), context input cap unified, dropped unused `AdaptiveImage` import + orphaned `featuredPhoto` local + ~80 lines of orphaned identity-card styles.
  - **Future ideas (modified)**:
    - `future-ideas.md` — added "Forms & Keyboard Polish — Migrate to `react-native-keyboard-controller`" section with rationale, what we'd unlock, why deferring (Expo Go), migration plan.
- Validation: All lints clean across `components/upload-entry.tsx`, `components/detail/framed-hero.tsx`, `components/detail/lenses/details-lens.tsx`. Char caps grounded in real production data via Supabase MCP query against john@myvitrine.app's 529 collectibles. Pattern parity with `vault/rapid-fire-edit.tsx` confirmed for keyboard handling.
- Notes:
  - The `FramedHero` lightbox is V1 — no pinch-to-zoom yet (would need `react-native-gesture-handler` integration). Both deps are already installed if/when we want to add it.
  - Title is `multiline={true}` with newline-stripping in `onChange` because RN `TextInput` only wraps when multiline is true; semantically the title is still single-line.
  - `listingEdits` is intentionally separate from `fieldEdits` because copy edits are conceptually different from schema atom edits — see DECISION_LOG entry "Listing copy edits inline, schema atoms via rapid-fire."
  - The keyboard offset fix applies a learning from this session: RN's `KeyboardAvoidingView.keyboardVerticalOffset` is meant to compensate for *native chrome RN can't measure* (e.g., `react-navigation`'s native stack header), NOT for in-layout headers. For surfaces with `headerShown: false` and an in-layout header, offset should be `0`.

## 2026-05-06 - filter_traits Rewire: Comps V3 + Filter Sheets + Market RPC + Managed Showcase V2 Grammar

- Summary: Comprehensive rewire of search, filter, comps, and managed showcase systems to leverage the new `filter_traits` JSONB column on the `collectibles` table. Four major deliverables: (1) Comps Scoring V3 — `get_collectible_comps` and `get_tracked_comps` RPCs rewritten with weighted `filter_traits` + `traits` array matching (Subject:5, ItemType:4, Trait:4, Franchise:2, Year:1, Maker:1, Serial:1, Finish:1), graceful degradation for items lacking `filter_traits`, GIN indexes. (2) Filter Sheet overhaul — new `EntitySearchInput` token/tag component for scalable high-cardinality filter options (people, teams, types), section reorganization, inline toolbar clear buttons, simplified value slider. Applied to both Collection and Market surfaces. (3) Market RPC enhancement — `browse_market_v2` rewritten to prefer `filter_traits.subject` and `filter_traits.franchise` for person/team search with fallback to `listing_title ILIKE`. (4) Managed Showcase V2 Grammar — expanded from 6 to 10 fields: added `franchise` (is_one_of/is_none_of), `item_type` (is_one_of/is_none_of), `year` (eq/gte/lte/between), `maker` (is_one_of/is_none_of). Updated rule builder UI with tag-style inputs for franchise/item_type/maker and numeric inputs for year. Edge Functions updated to select and hydrate `filter_traits`.
- Files Changed:
  - **Comps V3 (new migrations)**:
    - `supabase/migrations/20260506020000_comps_v3_filter_traits.sql` — `get_collectible_comps` V3 + `_comps_v2_legacy` fallback + GIN indexes.
    - `supabase/migrations/20260506030000_tracked_comps_v3_filter_traits.sql` — `get_tracked_comps` V3 with same scoring logic.
  - **Market RPC V3 (new migration)**:
    - `supabase/migrations/20260506040000_browse_market_v3_filter_traits.sql` — `browse_market_v2` rewrite with `filter_traits`-preferred search.
  - **API layer (modified)**:
    - `lib/api/collectibles.ts` — added `FilterTraits` type, mapped `filter_traits` in `mapRowToResponse`.
    - `lib/api/tracking.ts` — added `filter_traits` to SELECT, mapped in response.
    - `lib/api/showcases.ts` — added `filter_traits` to SELECT, mapped in `ShowcaseDetailItem`, extended `previewRuleMatches` type.
    - `lib/api/market.ts` — mapped `filter_traits` in `mapRowToMarketItem`.
    - `lib/api/comps.ts` — (consumed by existing hooks, no direct changes needed).
  - **Collection logic (modified)**:
    - `components/collectibles/collection.ts` — added `filterTraits` to `CollectionItem`, new helpers `getItemType`/`getItemPeople`/`getItemTeams` prioritizing `filter_traits`, rewired `deriveCollectionFilterOptions`/`itemMatchesCollectionFilters`/`deriveTypeFilters`.
  - **Filter UI (new + modified)**:
    - `components/collectibles/collection-filter-controls.tsx` — new `EntitySearchInput` component, section reorganization (Listing Status, Traits, People/Athletes, Teams/Franchise/IP, Collectible Type, Value), simplified `ValueRangeSlider`.
    - `components/collectibles/collection-toolbar.tsx` — inline per-button clear (X) replacing global clear-all.
    - `components/collectibles/collection-surface.tsx` — wired `onClearFilter`/`onClearSort` callbacks.
    - `components/collectibles/market-search-filter-sheet.tsx` — aligned sections, `EntitySearchInput` for types, updated placeholders.
    - `components/collectibles/index.ts` — exported `EntitySearchInput`.
  - **Comps UI (modified)**:
    - `components/detail/lenses/comps-lens.tsx` — added `StatusFilterRail` component for client-side status filtering.
  - **Managed Showcase V2 Grammar (modified)**:
    - `lib/api/managed-rules.ts` — expanded `RuleField` (4 new), `FIELD_OPS`, `FIELD_LABELS`, `EvalCollectible` (franchise/itemType/year/maker), `DbCollectibleRow` (filter_traits), both hydrators, `conditionMatches` switch.
    - `components/managed-rule-builder.tsx` — 4 new fields in `FIELD_OPTIONS`, value input cases (TagInput for franchise/item_type/maker, NumericInput for year), `TagInput` accepts `placeholder` prop, `getDefaultValue`/`needsValueReset` updated for `year`, live preview passes `filterTraits`.
    - `supabase/functions/_shared/managed-eval.ts` — mirror of all type/logic changes.
    - `supabase/functions/managed-evaluate/index.ts` — added `filter_traits` to SELECT.
    - `supabase/functions/managed-sweep-worker/index.ts` — added `filter_traits` to SELECT.
- Validation: All lints clean across all modified files. Comps RPC tested via Supabase MCP with real data. `browse_market_v2` tested with person/team searches against `filter_traits` data.
- Notes:
  - `subject` was explicitly excluded from managed showcase rules — the existing `listing_title contains` rule serves that use case better (works without `filter_traits`, more familiar to users).
  - `filter_traits` is only populated for one account currently (`d039f1eb-...`). Cross-user comps and market search improvements will become more visible as coverage scales.
  - The `EntitySearchInput` component shows top-5 suggestions by default, expands to 8 when searching, with a "No matches" empty state.
  - Inline toolbar clear buttons use `e.stopPropagation()` to avoid opening the filter/sort sheet when clearing.

## 2026-05-06 - Light/Dark Theme System + Settings V3 Overhaul + Comps Lens Polish
- Summary: Three major deliverables shipped in one session: (1) Settings V3 Overhaul — full redesign removing legacy features (Tracking Settings, Collection Defaults), wiring up Blocked Users, adding Sign Out/Delete Account with confirmations, shipping Push Notifications and Support dark, adding auto-updating app version. (2) Light/Dark/Auto theme system — dual token objects, ThemeProvider context, useTheme hook, AsyncStorage persistence, 3-state segmented control, migration of ~100 V3 components from static COLORS to dynamic theme hook. (3) Post-theme polish — BottomDock theme adaptation, Crown Jewel card background, SpatialCard overlay pinning, StatusPill/TraitPill theme-immunity with NFST inversion exception, detail screen badge reordering, and comps lens threshold + Realtor-style fallback display.
- Files Changed:
  - **Theme Infrastructure (new)**:
    - `lib/design/tokens.ts` (extended) — added `DARK_COLORS`, `LIGHT_COLORS`, `ThemeColors` type. `COLORS` = backward-compat alias.
    - `lib/design/theme-context.tsx` (new) — `ThemeProvider`, `useTheme()` hook, AsyncStorage persistence, Auto mode via `useColorScheme()`.
    - `lib/design/index.ts` (extended) — exports all theme utilities.
    - `app/_layout.tsx` (modified) — wraps app with `<ThemeProvider>`.
  - **Settings V3 (new/rewritten)**:
    - `app/settings/index.tsx` (rewritten) — V3 design, theme toggle, section navigation.
    - `components/settings-account.tsx` (rewritten) — Sign Out, Delete Account (type-username confirm).
    - `components/settings-edit-profile.tsx`, `components/settings-privacy.tsx`, `components/settings-blocked-users.tsx` (rewritten).
    - `components/settings-notifications.tsx`, `components/settings-help.tsx` (rewritten — shipped dark).
    - `components/settings-privacy-policy.tsx`, `components/settings-terms.tsx` (rewritten).
    - `supabase/functions/delete-account/index.ts` (new) — account deletion Edge Function.
    - `supabase/migrations/20260506010000_create_blocked_users.sql` (new).
    - `lib/api/blocked.ts` (new) — blocked users API.
  - **Settings V3 (deleted)**:
    - `app/settings/tracking/index.tsx`, `components/tracking-settings.tsx`, `lib/mock-tracking.ts`.
    - `app/settings/collection-defaults/index.tsx`, `components/settings-collection-defaults.tsx`.
    - `lib/mock-explore.ts`, `lib/mock-command-center.ts`, `lib/mock-feed.ts`.
  - **Theme migration (~100 files)**: All V3 components/screens migrated from static `COLORS` import to `useTheme()` hook. Key files: `components/collector-profile.tsx`, `components/bottom-dock.tsx`, `components/showcase-detail-v3.tsx`, all `components/vault/*` cards, all `components/market/*`, all `components/tracking-lenses/*`, all `components/detail/lenses/*`, `components/create-showcase.tsx`, all settings screens.
  - **Theme-immune elements**:
    - `components/vault/status-pill.tsx` (modified) — `DARK_COLORS.sheetBg` base + `inverted` prop for NFST exception.
    - `components/vault/trait-pill.tsx` (modified) — `DARK_COLORS.sheetBg` base.
    - `components/vault/spatial-card.tsx` (modified) — overlay text/badge pinned to `DARK_COLORS`.
  - **BottomDock theme**: `components/bottom-dock.tsx` (modified) — dynamic background, BlurView tint, upload button inversion.
  - **Crown Jewel**: `components/collector-profile.tsx` (modified) — `crownCard`/`crownRail` use dynamic `colors`.
  - **Comps Lens**: `components/detail/lenses/comps-lens.tsx` (modified) — 75% threshold, strong/fallback partition, Realtor-style headers, 6-item fallback cap, removed SeeAllFooter.
  - **Detail screen layout**: `components/detail/lenses/details-lens.tsx` (modified) — badge row above title, spacing adjustments. NFST `inverted` prop on detail screens.
  - **Deleted legacy**: `app/collectible/[id]/comps.tsx` (deleted) — consolidated into CompsLens.
- Validation: All lints clean. Live device testing confirmed light/dark/auto modes render correctly across all V3 surfaces. Theme toggle persists across app restarts. Comps threshold verified with real data.
- Notes:
  - Legacy screens using `@/lib/colors` remain untouched (intentional — will be deleted in a future pass).
  - Module-level constants that reference `COLORS` directly are legitimate cases (theme defaults, config objects, utility functions) and don't need migration.
  - The Metro bundler may serve stale cached versions after large migrations — `npx expo start --clear` resolves any phantom syntax errors.

## 2026-05-05 - Unified QR Code Modal with HolographicFrame
- Summary: Consolidated three separate QR code modal implementations (inline overlay in collector-profile, local QrModal in showcase-detail-v3, shared QRCodeModal in components/shared/) into a single unified V3 component with HolographicFrame treatment. The new modal uses the same animated holographic border seen on Crown Jewel and Featured Showcase cards. All five QR modal consumers across the app now render identically.
- Files Changed:
  - `components/shared/qr-code-modal.tsx` (rewritten) — V3 design system tokens, HolographicFrame wrap, dark glass card with frost divider, COPY LINK action with green confirmed state, full-width DONE close button.
  - `components/collector-profile.tsx` (modified) — removed inline QR overlay (~90 lines + 6 styles), replaced with `<QRCodeModal>`. Removed `react-native-qrcode-svg` direct import.
  - `components/showcase-detail-v3.tsx` (modified) — removed local `QrModal` component + `qrS` stylesheet (~60 lines), replaced with `<QRCodeModal>`. Removed unused `Modal` and `Platform` imports.
  - `components/collectible-detail-v3.tsx` — no changes needed (already used shared QRCodeModal, automatically inherits new design).
  - `components/trading-card-detail.tsx` — no changes needed (already used shared QRCodeModal).
  - `app/(design-lab)/collectible-detail.tsx` — no changes needed (already used shared QRCodeModal).
- Validation: Lints clean on all modified files. No remaining direct `react-native-qrcode-svg` imports outside the shared modal. All consumers verified against consistent prop interface (visible, onClose, value, title, subtitle).

## 2026-05-05 - VitrineMarkIcon replaces UploadCollectibleIcon in BottomDock
- Summary: Created a new `VitrineMarkIcon` SVG component from the Vitrine brand mark and replaced the `UploadCollectibleIcon` in the BottomDock center upload button. The brand mark now serves as the upload action icon, giving the logo presence in the app chrome.
- Files Changed:
  - `components/vault/icons/vitrine-mark-icon.tsx` (new) — React Native SVG component from user-provided SVG. Filled paths (not stroked), `size` and `color` props.
  - `components/vault/icons/index.ts` (modified) — added `VitrineMarkIcon` export.
  - `components/vault/index.ts` (modified) — added `VitrineMarkIcon` to barrel exports.
  - `components/bottom-dock.tsx` (modified) — replaced `UploadCollectibleIcon` with `VitrineMarkIcon`, size=36, removed strokeWidth (filled icon).
- Validation: Lints clean. Import chain verified (icons/index → vault/index → bottom-dock).

## 2026-05-05 - Settings entry point and QR/Share button swap
- Summary: Reorganized the profile surface buttons: Settings gear icon now lives on the DossierCard (top-right, next to Edit Profile), QR Code moved to the action button row (next to Share), and a redundant footer "SETTINGS" button was added at the bottom of the PROFILE lens scroll for discoverability.
- Files Changed:
  - `components/collector-profile.tsx` (modified) — DossierCard top-right: Settings icon for owner (was QR Code). Action row: QR Code button for owner (was Settings). Footer: new "SETTINGS" button visible to owner only. Visitor views unchanged (QR Code on DossierCard, MESSAGE in action row).
- Validation: Lints clean. Owner and visitor button permutations verified.

## 2026-05-05 - Activity Banner on PROFILE lens
- Summary: Built and wired the alive activity banner component for the PROFILE lens. When `useFeeds().unseenCount > 0`, a slide-in banner appears between the action buttons and key metrics on the PROFILE surface. Shows count label + smart summary of recent notifications (using `getVerbConfig` from activity-verbs). Tapping navigates to ACTIVITY lens. Dismiss via X button. Banner reappears when new activity arrives.
- Files Changed:
  - `components/collector-profile.tsx` (modified) — new `ActivityBanner` component with `SlideInUp`/`SlideOutUp` animation, `summarizeNotifications` helper, dismiss state, conditional rendering for owner-only. `handleNavigateToActivity` callback sets active lens to ACTIVITY. `ProfileSurface` accepts `onNavigateToActivity` prop.
- Validation: Lints clean. Test notifications seeded via temporary Edge Function verified banner renders and navigates correctly.

## 2026-05-05 - Brand color pivot: brandVolt to warm ivory
- Summary: Changed the brand accent color from neon volt (#CCFF00) to warm ivory (#E8E0D4) as part of a monochrome design philosophy shift. The design rationale: collectibles should own the color system (not the UI chrome), and a monochrome palette conveys permanence over energy — more appropriate for a collector app. The token names (`brandVolt`, `brandVoltFill`, `brandVoltBorder`) were deliberately kept for continuity even though the underlying color changed.
- Files Changed:
  - `lib/design/tokens.ts` (modified) — `brandVolt: '#E8E0D4'`, `brandVoltFill: 'rgba(232, 224, 212, 0.10)'`, `brandVoltBorder: 'rgba(232, 224, 212, 0.28)'`. Three-line change.
- Validation: Lints clean. Visual confirmation that all surfaces using brandVolt tokens automatically inherited the new color.

## 2026-05-05 - Profile-as-Home Architecture Restructure
- Summary: Eliminated the home screen entirely. Promoted the collector's profile hub to the app's landing surface at `app/(tabs)/index.tsx`. Graduated Messages from a profile hub lens (6→5 lenses) to a dedicated tab at `app/(tabs)/messages.tsx`. Removed the HUD overlay (logo/messages/notifications/menu top bar). Restructured the BottomDock: profile avatar with activity badge dot (brandVolt, driven by `useFeeds().unseenCount`) in first position, messages icon with unread count badge (semanticBlue, driven by Stream `total_unread_count`) in last position. New tab order: Profile (avatar+badge) | Tracking | [Upload FAB] | Market | Messages. Updated all `/(tabs)/profile` navigation references to `/(tabs)`. Deleted 21 `components/home/*` widgets, 3 home-specific hooks/skeletons, and the HUD overlay component. Removed HUD imports from community, bulk upload, memorabilia type, and settings screens.
- Files Changed:
  - `app/(tabs)/index.tsx` (rewritten) — was home screen, now profile tab content.
  - `app/(tabs)/profile.tsx` (deleted) — merged into index.tsx.
  - `app/(tabs)/messages.tsx` (new) — dedicated messages tab wrapping MessageInboxBody.
  - `app/(tabs)/_layout.tsx` (rewritten) — removed profile screen, added messages screen.
  - `components/bottom-dock.tsx` (rewritten) — new tab order, avatar-first with BadgeDot, messages icon with CountBadge.
  - `components/collector-profile.tsx` (modified) — removed MESSAGE from LensKey and ME_PROFILE_LENSES (6→5), removed MessageInboxBody from LensPager.
  - `components/showcase-review.tsx` (modified) — route update.
  - `components/upload-entry.tsx` (modified) — route update.
  - `components/key-details-success.tsx` (modified) — route update.
  - `components/nav-menu.tsx` (modified) — route update.
  - `app/upload-trading-cards.tsx` (modified) — route update.
  - `app/(tabs)/community.tsx` (modified) — removed HUDOverlay.
  - `app/upload/bulk/index.tsx` (modified) — removed HUDOverlay.
  - `app/upload/memorabilia/[type]/index.tsx` (modified) — removed HUDOverlay.
  - `app/settings/index.tsx` (modified) — removed HUDOverlay.
  - `components/hud-overlay.tsx` (deleted).
  - `components/skeletons/home.tsx` (deleted).
  - `hooks/use-home-data.ts` (deleted).
  - `hooks/use-collection-affinity.ts` (deleted).
  - All 21 files in `components/home/` (deleted).
- Validation: Lints clean on all modified files. No remaining imports of deleted files. All `/(tabs)/profile` references updated.
- Notes:
  - The profile avatar badge uses brandVolt color (not semanticBlue like the old HUD notification dot) — this is a deliberate choice to tie the badge to the brand identity rather than a generic notification color.
  - The messages icon badge uses semanticBlue (matching the old HUD messages badge) for continuity.
  - Settings/Logout access is temporarily inaccessible — NavMenu component still exists but has no entry point. This is flagged as a deferred item.
  - `hooks/use-scroll-direction.ts` was NOT deleted — it's still used by `community-hub.tsx` and `settings/index.tsx`.

## 2026-05-05 - Market Surface V3 (Instagram-style Search & Discovery)
- Summary: Replaced the legacy search/explore tab with an Instagram-inspired three-state surface: (1) Mosaic — persistent SearchBar with inline Filter/Sort icons, horizontal chip rail (collectible types + traits), paginated 2-column grid via `browse_market_v2` RPC; (2) Drawer — recent searches (AsyncStorage-backed) shown on SearchBar focus; (3) Results — tiered search across Collectibles, Showcases, and Collectors via `search_collectors_tiered` and `search_showcases_tiered` RPCs, with ALL | Collectibles | Showcases | Collectors pill filter. Filter/Sort use existing V3 FilterSheet/SortSheet with market-specific `MarketSearchFilterSheet` (Person/Character and Team/IP as free-text `listing_title contains` filters). Uses `Promise.allSettled` for graceful degradation when individual search RPCs fail. SearchBar extended with `forwardRef` and imperative `SearchBarHandle` for programmatic focus/blur. Recent searches persisted via `lib/storage/recent-searches.ts`. Multiple rounds of bug fixes: database permission grants, RPC type mismatches (`timestamptz` casting), non-existent column references (`item_count` on showcases), PL/pgSQL `#variable_conflict` directives, `Promise.all` → `Promise.allSettled`, ScrollView `flexGrow: 0` constraints, BottomDock occlusion padding (120px), collector navigation route fix, filter/sort object memoization, and search header redesign (Cancel button replaced with inline Filter + Sort icon buttons).
- Files Changed:
  - `components/market/market-surface.tsx` (new) — three-state orchestrator (mosaic | drawer | results), filter/sort state, recent search management.
  - `components/market/mosaic-grid.tsx` (new) — paginated 2-column FlatList using `browse_market_v2`, chip rail for type/trait filtering.
  - `components/market/search-header.tsx` (new) — persistent SearchBar with inline Filter (SlidersHorizontal) and Sort (ArrowUpDown) icon buttons, active-state brandVolt highlighting, filter count badge.
  - `components/market/search-drawer.tsx` (new) — recent searches list with per-item delete, shown on SearchBar focus.
  - `components/market/search-results.tsx` (new) — tiered search results with ALL | Collectibles | Showcases | Collectors pill filter, `Promise.allSettled` for graceful degradation.
  - `components/market/collector-result-row.tsx` (new) — collector search result row with avatar, display name, username, item count, tracking overlap.
  - `components/market/showcase-result-row.tsx` (new) — showcase search result row with thumbnails, title, item count, owner info.
  - `components/collectibles/market-search-filter-sheet.tsx` (new) — market-specific FilterSheet with Person/Character and Team/IP free-text inputs (listing_title contains pattern).
  - `components/vault/search-bar.tsx` (extended) — added `forwardRef`, `SearchBarHandle` interface with `focus()`/`blur()`, `onFocus`/`onBlur` props.
  - `components/vault/index.ts` (extended) — exports `SearchBarHandle` type.
  - `lib/storage/recent-searches.ts` (new) — AsyncStorage-backed recent search helper with `addRecentSearch`, `getRecentSearches`, `removeRecentSearch`, `clearRecentSearches`.
  - `lib/api/explore.ts` (extended) — market browse/search API wrappers.
  - `supabase/migrations/20260505030000_browse_market_v2.sql` (new) — `browse_market_v2` RPC with chip filtering, sort options, offset pagination, `created_at AT TIME ZONE 'UTC'` cast.
  - `supabase/migrations/20260505040000_market_search_rpcs.sql` (new) — `search_collectors_tiered` and `search_showcases_tiered` RPCs with priority-based tiering.
  - `supabase/migrations/20260505050000_grant_market_read_access.sql` (new) — permanent GRANT SELECT on `view_counters` and `collectibles_unified` for authenticated/anon roles.
  - `components/market/toolbar.tsx` (deleted) — functionality merged into search-header.
- Validation: RPCs deployed and tested via Supabase MCP. Multiple rounds of live-device testing with user feedback. Lints clean on all modified files. `Promise.allSettled` verified: individual RPC failures no longer blank the entire results surface.
- Notes:
  - Search header uses inline Filter/Sort icons (no Cancel button) — "X" on the SearchBar handles clearing; blurring with empty query returns to mosaic state.
  - `browse_market_v2` supports `p_search_person` and `p_search_team` params as `listing_title ILIKE` patterns — avoids indexing full metadata while still surfacing person/team filtering.
  - `search_showcases_tiered` computes `item_count` via a CTE from `showcase_collectibles` (not a column on `showcases` table).
  - `search_collectors_tiered` provides `tracking_overlap` count for social proof in result rows.
  - Market-specific filter sheet removes descriptive hint text under Person/Character and Team/IP fields — users don't need instruction on how filters work.
  - All scrollable areas include `paddingBottom: 120` to avoid BottomDock occlusion.
  - Horizontal ScrollViews (chip rail, pill rail) use `flexGrow: 0` to prevent vertical expansion.

## 2026-05-05 - Tracking Hub V3 (four-lens redesign)
- Summary: Replaced the legacy tracking screen (summary card + flat list) with a four-lens hub: OVERVIEW | TRACKED | ACTIVITY | COMPS. Built on the same LensSelector + LensPager pattern as the profile hub. OVERVIEW is a DossierCard-anchored intelligence surface with RADAR watermark, 3-up metrics, status changes, recently tracked strip, DNA section (AssetMatrixCard, StatusBreakdownGrid, TraitMixCard), and top collectors. TRACKED reuses CollectionSurface with full view modes and spatial-card owner attribution. ACTIVITY filters Stream notifications to tracking-relevant verbs with ALL | STATUS | VALUE | COMPS chips. COMPS uses a new blended `get_tracked_comps` RPC (V2) with two quality gates: source quality floor (meaningful_field_count >= 2) and match quality floor (matched_signals >= 3 AND score_fraction >= 0.5). Each comp row attributes its source tracked item. Deep linking via `?lens=` param. HUD overlay removed from tracking tab to avoid LensSelector collision. SafeAreaView edges=['top'] for proper status bar avoidance.
- Files Changed:
  - `components/tracking-hub.tsx` (new) — main orchestrator with LensSelector (display variant), LensPager (lazy), data loading, state management, cross-lens navigation.
  - `components/tracking-lenses/overview-lens.tsx` (new) — DossierCard/RADAR, MetricCardRow, Status Changes, Recently Tracked, DNA section, Top Collectors.
  - `components/tracking-lenses/tracked-lens.tsx` (new) — CollectionSurface wrapper for tracked items.
  - `components/tracking-lenses/tracking-activity-lens.tsx` (new) — tracking-filtered activity feed with category chips.
  - `components/tracking-lenses/tracking-comps-lens.tsx` (new) — blended comps with TrackedCompRow and source attribution.
  - `components/tracking-lenses/index.ts` (new) — barrel export.
  - `hooks/use-tracked-comps.ts` (new) — data hook wrapping getTrackedComps().
  - `app/(tabs)/tracking.tsx` (updated) — mounts TrackingHub, removed HUDOverlay, added SafeAreaView, ?lens= deep linking.
  - `lib/api/tracking.ts` (extended) — `getTrackedCollectionItems()` with full AI-enriched join returning CollectionItem[] + ownerMap, `deriveTrackedOverviewStats()` for client-side metric derivation.
  - `lib/api/comps.ts` (extended) — `TrackedCompItem` interface, `mapTrackedRow()`, `getTrackedComps()` client wrapper.
  - `lib/design/activity-verbs.ts` (extended) — `TrackingChipCategory` type, `trackingCategory` field on VerbConfig, `getTrackingCategory()` helper.
  - `components/vault/spatial-card.tsx` (extended) — owner avatar overlay (ownerAvatar/ownerName on CollectibleCardData).
  - `components/collectibles/collection.ts` (extended) — ownerAvatar/ownerName on CollectionItem.
  - `supabase/migrations/20260505020000_create_tracked_comps_rpc.sql` (new) — V2 blended comps RPC with #variable_conflict use_column, Gate 1 (source quality floor), Gate 2 (match quality floor). Three tunable constants: v_min_source_fields=2, v_min_matched_signals=3, v_min_score_fraction=0.5.
- Validation: RPC deployed and tested via Supabase MCP — returns 30 comps distributed across 8 tracked sources (vs. single-source domination before quality gates). Pre-existing TS errors unrelated to new files. Lints clean on modified files.
- Notes:
  - LensSelector uses `display` variant (oversized, brandVolt active) matching the profile hub pattern.
  - Owner attribution is spatial-card-only (not grid or list cards).
  - Activity lens filters to tracking-relevant verbs only; no journal entries.
  - The Rawlings glove problem (sparse legacy items with 0 meaningful fields dominating comps) is fully solved by Gate 1.
  - Fallback comps (value-range matches when primary < 3) use src_totals not qualified_sources, so fallback still works when all sources are filtered out.

## 2026-05-05 - Managed Showcase V1 (full stack)
- Summary: Built the complete managed showcase system — Shopify smart-collection-inspired auto-updating showcases. 6-field rule grammar, 8 operators, ALL/ANY match mode. Pure TypeScript evaluator shared between client and Edge Functions. Immediate eval on rule save + incremental cron sweep (5min) + nightly full sweep. Rule builder UI with live preview, create/review integration, edit-rules route, and showcase detail updates (MANAGED badge, rules summary, Edit Rules action).
- Files Changed:
  - `supabase/migrations/20260505000000_add_managed_showcases.sql` (new) — rules columns on showcases, collectibles_last_changed_at watermark on users, AFTER trigger on collectibles.
  - `supabase/migrations/20260505010000_schedule_managed_workers.sql` (new) — pg_cron scheduling for incremental + nightly sweep.
  - `lib/api/managed-rules.ts` (new) — canonical rule evaluator: types, validation, matching, formatting, row hydration.
  - `supabase/functions/_shared/managed-eval.ts` (new) — Deno-compatible mirror of the evaluator for Edge Functions.
  - `supabase/functions/managed-evaluate/index.ts` (new) — immediate eval Edge Function.
  - `supabase/functions/managed-sweep-worker/index.ts` (new) — cron-driven sweep Edge Function (incremental + full modes).
  - `lib/api/showcases.ts` (extended) — discriminated `CreateShowcaseParams` (manual|managed), `updateShowcaseRules`, `previewRuleMatches`, `invokeManagedEvaluate`, visitor visibility filtering on `getUserShowcases`/`getShowcaseById`.
  - `lib/api/index.ts` (extended) — exports all managed-rules types and new showcase functions.
  - `components/managed-rule-builder.tsx` (new) — match mode toggle, condition stack with field/op/value controls, live preview card with count + value + thumbnails.
  - `components/create-showcase.tsx` (updated) — replaced ManagedComingSoon with ManagedRuleBuilder, wired managed draft state, updated mutual exclusion, bottom summary bar shows match count for managed mode.
  - `components/showcase-review.tsx` (updated) — handles `mode=managed` with rules param, branched create handler, rules summary in summary card.
  - `app/upload/showcase/[id]/rules.tsx` (new) — edit-rules route for existing managed showcases.
  - `components/showcase-detail-v3.tsx` (updated) — MANAGED badge, rules-summary line below title meta, "Edit Rules" in owner action sheet.
  - `components/collector-profile.tsx` (updated) — passes `viewer?.id` to `getUserShowcases` for visibility filtering.
- Validation: All lints clean. `tsc --noEmit` passes on `managed-rules.ts`. Cron jobs verified in `cron.job` table. Schema migration applied successfully.

## 2026-05-04 - Create Showcase V3 redesign
- Summary: Replaced the legacy 3-step wizard with a lens-based CURATED | MANAGED architecture. Multi-select CollectionSurface for curated, ManagedComingSoon placeholder (later replaced by rule builder) for managed. Shared review screen for both paths. Mutual exclusion logic prevents building in both modes simultaneously.
- Files Changed:
  - `components/create-showcase.tsx` (new) — lens-based create surface with LensSelector + LensPager.
  - `components/showcase-review.tsx` (new) — shared review/finalize screen.
  - `app/upload/showcase/index.tsx` (updated) — routes to new create surface.
  - `app/upload/showcase/review.tsx` (updated) — routes to review screen.
  - `components/collectibles/collection-surface.tsx` (extended) — added multi-select support via `selectedIds` + `onToggleSelect` props with brandVolt border chrome.
  - `components/vault/collectible-grid-card.tsx`, `components/vault/spatial-card.tsx`, `components/vault/collectible-list-card.tsx` (extended) — selection visual treatment.
  - Legacy `ManualShowcaseCreate`, `SmartShowcaseCreate`, `ShowcaseTypeSelect`, `ShowcaseSuccess` deleted.
- Validation: All lints clean.

## 2026-05-03 - Showcase toolbar refinement
- Summary: Removed irrelevant filter/sort controls from the Showcase surface toolbar on the profile screen. Added a "Create Showcase" CTA button visible only for user-owned profiles, taking remaining row width next to the view selector.
- Files Changed: `components/collector-profile.tsx` (showcase surface toolbar section).
- Validation: All lints clean.

## 2026-05-03 - Custom branded React Native SVG icons
- Summary: Created three custom icons: `CollectibleIcon`, `ShowcaseIcon`, `UploadCollectibleIcon`. Lucide-safe patterns with `BRAND_STROKE_SCALE` (0.45) for consistent weight. Integrated into conversations quick action bar, Activity surface, and bottom dock.
- Files Changed:
  - `components/ui/custom-icons.tsx` (new) — three branded SVG icons.
  - `components/bottom-dock.tsx` (updated) — `UploadCollectibleIcon` replaces `ScanText`, larger at 40px within circular background.
  - `components/messaging/quick-attach-bar.tsx` (updated) — `CollectibleIcon` and `ShowcaseIcon` replace generic lucide icons.
- Validation: All lints clean.

## 2026-05-02 - Network Surface V3
- Summary: Built the full Network lens replacing legacy follower/following screen. Four chips: SUGGESTED (default) | MUTUAL (visitor-only) | FOLLOWERS | FOLLOWING. 5-signal weighted suggested collectors algorithm via `suggest_collectors_for` RPC with server-side cache. Binary public/private privacy toggle. Deep linking from profile header follower/following counts.
- Files Changed:
  - `components/network/*` (new) — network lens, suggested/mutual/follower rows.
  - `supabase/migrations/` — `suggested_collectors_cache` table, `suggest_collectors_for` RPC, notification preferences table.
  - `supabase/functions/network-suggested-cache-purge/index.ts` (new) — cache invalidation Edge Function.
  - `lib/api/follows.ts` (extended) — mutual check, privacy settings.
  - `components/collector-profile.tsx` (updated) — Network lens integration, deep linking.
  - `app/profile/[id]/connections.tsx` (deleted) — legacy connections screen.
- Validation: All lints clean. RPC tested with real data. Cache round-trip verified.

## 2026-05-01 - Activity Surface V1
- Summary: Built the full Activity lens replacing the Notifications placeholder. 15 activity triggers across four chip categories (ALL | INBOX | SIGNALS | JOURNAL). Backend Edge Functions for notifications, comp alerts, view rollups, and view milestones. pg_cron scheduling for periodic workers.
- Files Changed:
  - `lib/api/activity.ts` (new) — activity feed queries.
  - `lib/api/views.ts` (new) — view recording and aggregation.
  - `components/activity/*` (new) — activity-row, journal-row, signal-row, inbox-row.
  - `supabase/functions/stream-notify/index.ts` (new/updated) — notification dispatch.
  - `supabase/functions/comp-alert-worker/index.ts` (new) — daily comp alert scan.
  - `supabase/functions/view-rollup-worker/index.ts` (new) — hourly view rollup.
  - `supabase/functions/view-milestone-checker/index.ts` (new) — milestone notification.
  - `supabase/migrations/` — views table, view_rollups, notification_preferences, pg_cron schedules.
  - `components/collector-profile.tsx` (updated) — Activity lens integration, settings.
- Validation: All lints clean. Edge Functions tested. Cron jobs scheduled and verified.

## 2026-05-01 - Profile Hub reordering to six lenses
- Summary: Reordered profile hub lenses to: PROFILE | COLLECTION | SHOWCASE | ACTIVITY | MESSAGE | NETWORK.
- Files Changed: `components/collector-profile.tsx`.
- Validation: All lints clean.

## 2026-04-30 (PM) - Showcase Detail V3 rebuild
- Summary: Replaced the legacy `ShowcaseView` with a V3 two-lens (`INFO | COLLECTION`) screen at the production route `app/showcase/[id]/index.tsx`. INFO lens is a single dossier card containing title + 3-up collage + Total Value/Showcase Size metrics + owner row (visitor FOLLOW chip / owner YOU pill) + action pair (owner: QR · SHARE; visitor: MESSAGE · SHARE) + Showcase DNA (Asset Matrix, Status Breakdown, Trait Mix). COLLECTION lens reuses the profile's `CollectionSurface` chrome scoped to the showcase items. Floating top nav with compact-title fade, owner-only `⋯` ActionSheet (Mark/Unmark Featured · Edit · Delete), native `Alert.alert` delete confirmation, haptics on lens swap and key actions. Featured showcases get a `<HolographicFrame intensity="standard">` wrap around the dossier card.
- Files Changed:
  - `components/showcase-detail-v3.tsx` (new) — main V3 screen.
  - `app/showcase/[id]/index.tsx` (rewrite) — production route now binds `ShowcaseDetailV3`.
  - `components/showcase-view.tsx` (deleted) — ~1170 LOC legacy screen.
  - `components/showcase-dna.tsx` (deleted) — superseded by `AssetMatrixCard` / `TraitMixCard` / `StatusBreakdownGrid`.
  - `components/vault/brackets.tsx` (new) — extracted bracket primitive.
  - `components/vault/dossier-card.tsx` (new) — bracketed shell + watermark glyph.
  - `components/vault/metric-card-row.tsx` (new) — N-up bracketed metric tiles, exports `metricValueTextStyle`.
  - `components/vault/asset-matrix-card.tsx` (new) — barcode-spectrum bar with legend.
  - `components/vault/status-breakdown-grid.tsx` (new) — 2-up status summary grid with progress bars.
  - `components/vault/trait-mix-card.tsx` (new) — per-trait horizontal bars (top-N, "+N more" counter).
  - `components/vault/action-sheet.tsx` (new) — cross-platform action sheet (native `ActionSheetIOS` on iOS, V3 modal on Android).
  - `components/vault/index.ts` (extended) — barrel adds the seven new primitives + their type exports.
  - `components/collectibles/collection.ts` (new) — shared `CollectionItem` type, sort keys/options, status copy, mappers (`mapToCollectionItem`, `resolveCrownJewel`, `normalizeTraitKey`, `toCardData`), formatters (`formatPrice`, `formatFilterLabel`), filter/sort derivation helpers (`itemMatchesCollectionFilters`, `sortCollectionItems`, `deriveTypeFilters`, `deriveCollectionFilterOptions`).
  - `components/collectibles/collection-surface.tsx` (new) — generic FlatList chrome (toolbar, type pills, filter/sort sheets, virtualized grid/spatial/list rendering, refresh control, crown-jewel holo framing) lifted from `collector-profile.tsx`.
  - `components/collectibles/index.ts` (extended) — re-exports collection types/helpers and `CollectionSurface`.
  - `components/collector-profile.tsx` (refactored) — now consumes the new vault primitives and `CollectionSurface` from `components/collectibles`. All inline equivalents removed; zero visual drift.
  - `lib/api/showcases.ts` (extended) — `getShowcaseById` enriched: expanded SELECT (`listing_title`, `collectible_type`, `classification`, `traits`, `ai_metadata`, `trait_metadata`), batched `getTrackCounts` enrichment, returns `items: ShowcaseDetailItem[]` (CollectionItem-shaped) plus `stats.totalValueNumeric`. Legacy `collectibles: ShowcaseDetailCollectible[]` retained for messaging vitrine-attachment preview.
  - `lib/api/index.ts` (extended) — exports `ShowcaseDetailCollectible` and `ShowcaseDetailItem` types.
- Validation: `ReadLints` passed across all touched files after each step. Manual trace of owner / visitor / featured / non-featured / small-vs-large permutations against schema.
- Notes:
  - "Straight production route" was approved up front: legacy screen removed in the same chunk as the new wiring.
  - INFO lens is allowed to scroll (~1.5 viewports). Quality of Showcase DNA section was prioritized over forced single-screen compression per user direction.
  - Showcase title placement = "Choice B" (inside the dossier card, not above the lens selector). The compact title in the floating nav appears on scroll.
  - Showcases do not use descriptions in production data (verified via Supabase MCP: `0 of 690` rows had a description). The DB column persists for backward compatibility but the UI no longer surfaces or accepts a description.
  - COLLECTION lens passes `crownJewelCollectibleId={null}` so no per-card holo competes with the dossier-level holo for featured showcases.
  - Visitor MESSAGE button routes to `/messages/new?userId=…`; the new-message screen does not yet consume `userId` to prefill, but the hook is in place (see OPEN_THREADS).
  - `Button` `variant="outline"` was attempted and corrected — that variant does not exist in `components/vault/button.tsx`. Use `'frost'` (or `'solid'` / `'ghost'`).
  - `setFeaturedShowcase` and `deleteShowcase` are wrapped in `try/catch` with `Alert.alert` user feedback (they throw `ApiException`, they don't return booleans).

## 2026-04-29 - Installed project memory system
- Summary: Added repo-local AI memory docs, AGENTS entrypoint, and Cursor rules for project memory, model routing, MCP usage, and handoff protocol.
- Files Changed: `AGENTS.md`, `docs/ai-context/*`, `.cursor/rules/*`.
- Validation: File creation verified by tool results; no product code changed.
- Notes: Thinktank synced and used as advisory source only.

## 2026-04-29 - Cleaned stale docs and artifacts
- Summary: Removed approved stale documentation, generated brainstorm artifacts, the Figma/Vite profile prototype folder, the React migration history folder, and a local Firebase export script with a hardcoded service-account path.
- Files Changed: Deleted `.superpowers/`, `temp_profile_design/`, `REACT_MIGRATION/`, `docs/superpowers/`, `scripts/firebase-export-baseball.js`, `WHITE_CUBE_REDESIGN.md`, `MIGRATION-TRACKING.md`, `docs/DESIGN_AUDIT_2026-04-10.md`, `trading-cards-edge-function-brief.md`, `BEST_PRACTICES.md`, and `WIRING_CHECKLIST.md`.
- Validation: Verified cleanup targets no longer appear in file searches.
- Notes: Product/source code cleanup was intentionally deferred until after the current design iteration.

## 2026-04-29 - Added memory-first Cursor rule
- Summary: Added an always-on Cursor rule requiring project memory to be consulted before relying on chat history.
- Files Changed: `.cursor/rules/000-memory-first.mdc`.
- Validation: File created successfully.
- Notes: Rule establishes priority order: project memory, current code, then chat context.

## Recent Context - Collector profile V3 sandbox
- Summary: `app/(design-lab)/collector-profile.tsx` has been iteratively redesigned and substantially wired to real auth, collection, follow, featured showcase, Crown Jewel, and showcase data.
- Files Changed: `app/(design-lab)/collector-profile.tsx`, related `lib/api/*`, vault components as consumed.
- Validation: Lint checks on edited screen reported no linter errors during recent changes.
- Notes: Current sandbox includes performance work, first-class filters/sort, tracking interactions, and semantic holo chrome for Crown Jewel/Featured Showcase.

## 2026-04-30 - Collector Profile V3 performance/filter/card pass
- Summary: Reworked collection rendering around virtualized lists, short-burst in-memory profile cache, pull-to-refresh, memoized derivations, first-class collection filters, and single-select sort.
- Files Changed: `app/(design-lab)/collector-profile.tsx`, `components/vault/spatial-card.tsx`, `components/vault/collectible-grid-card.tsx`, `components/vault/collectible-list-card.tsx`, `components/vault/grid-card.tsx`, `lib/api/tracking.ts`.
- Validation: Recent linter checks reported no errors on edited profile/card/auth files.
- Notes: Filter V1 covers Status, Traits, Types, Value Range, People/Athletes, Teams/Franchise/IP. Future production version should move facets/filter/sort server-side for large profiles.

## 2026-04-30 - Crown Jewel and Featured Showcase holo semantics
- Summary: Added reusable `HolographicFrame`; redesigned Crown Jewel hero; applied subtle holo treatment to Crown Jewel cards across collection card views and Featured Showcase cards across profile/showcase surfaces.
- Files Changed: `components/vault/holographic-frame.tsx`, `components/vault/index.ts`, `app/(design-lab)/collector-profile.tsx`.
- Validation: Recent linter checks reported no errors on edited files.
- Notes: Holo should stay subtle and semantic: Crown Jewel and Featured Showcase are "IYKYK" featured states, not generic decoration.

## 2026-04-30 - Crown Jewel user field/API helper
- Summary: Added optional `users.crown_jewel_collectible_id` schema field and surfaced it through user mapping/update helpers plus a setter with ownership validation.
- Files Changed: `supabase/migrations/20260430000000_add_users_crown_jewel_collectible.sql`, `lib/api/auth.ts`.
- Validation: Recent linter checks reported no errors on edited auth/profile files.
- Notes: Confirm migration application in Supabase before using the field in production routes.

## 2026-04-30 - AI Upload flow V3 rebuild
- Summary: Rebuilt the AI upload flow end-to-end around a seeded-prototype pipeline. Five steps wired: Scan (batch image picker, 180-char context, disabled-state CTA), Theater (staged AI animation landing a seeded extraction), Review (queue-to-edit pattern with Add-More-Details accordion and Complete-Extraction reward chip), Finalize (status grid, required-value gating, full-width visibility pair, showcase picker, tag chips), Success. Shipped five new canonical vault primitives and extended one.
- Files Changed:
  - `components/upload-entry.tsx` (full rewrite/extension)
  - `components/vault/action-dock.tsx` (new) — sticky-CTA primitive, sheetBg + blur + volt label, absolute-positioned, `reservedHeight()` helper for scroll padding.
  - `components/vault/input-dialog.tsx` (new) — cross-platform V3 single-input modal, replaces `Alert.prompt`.
  - `components/vault/showcase-selector-sheet.tsx` (new) — bottom-sheet multi-select with search, inline "Create new showcase" via `InputDialog`, item-count meta rows.
  - `components/vault/field-editor.tsx` (new) — type-aware input (string / number / boolean) for rapid-fire edit flows.
  - `components/vault/rapid-fire-edit.tsx` (new) — slide-up full-screen modal for batched field edits. Progress pips, back/close/swipe-down dismiss, save-or-discard confirm, keyboard-aware inline footer styled to match `ActionDock`.
  - `components/vault/schema-row.tsx` (extended) — optional `onPress` / `queued` / `edited` / `editedNonce` props. Queued state uses `brandVoltBorder + brandVoltFill` (same DNA as filter chips); `edited + editedNonce` drives a one-shot 900ms volt pulse. Non-interactive callers unchanged — chrome (border, radius, overflow) only applies when `onPress` is set so the collectible detail page keeps its original row heights and hairline rhythm.
  - `components/vault/index.ts` (barrel exports updated).
- Validation: `ReadLints` passed across all touched files. Queue, edit overlay, pulse, and accordion flows traced manually end-to-end.
- Notes:
  - Seeded extraction is DB row `3c89a535-f972-4a66-8d5d-3cf9dd509ec8`. Review rendering mirrors the production `SpecsLens` on the collectible detail page 1:1 (same `jsonbToRows`, `buildAuthentications`, `SchemaRow`, `AuthenticationsLedger`).
  - Queue model uses namespaced ids (`ai:Year`, `trait:signer_name`) so the same key in both buckets stays distinct.
  - Edit overlay: `fieldEdits: { ai: {...}, trait: {...} }` applied via `applyEdits()` onto the base extraction so Review and Finalize both see user corrections without mutating the seed.
  - Showcase picker consumes real user showcases via `getUserShowcases(user.id)`. Locally-created (unpersisted) showcases prepend to the list with `local-${ts}` ids and survive through the commit step.
  - Value required gating: `valueRequired = status !== 'NFST'`; `valueMissing = valueRequired && !(parseFloat(value) > 0)`. `0`, `0.00`, blank, and non-numeric all fail. Default after extraction is `'0.00'` (not the seed value) — collectors should consciously set an asking price.
  - Confidence banner renders when `extraction.confidence !== 'high'`; dormant on the current seed (`'high'`). Flip `SEED.confidence` to `'medium'` to preview.

## 2026-05-14 - react-native-keyboard-controller migration (Phase 2 Step 3)
- Summary: Installed `react-native-keyboard-controller@1.18.5`, added Expo config plugin, wrapped root layout in `KeyboardProvider`, and migrated all 17 files (19 `KeyboardAvoidingView` instances) from RN's built-in KAV to the library's drop-in replacement. Eliminated every hardcoded `keyboardVerticalOffset` and `Platform.OS` behavior branching. Auth forms (login, signup, complete-profile) upgraded further to `KeyboardAwareScrollView` for auto-scroll-to-focused-input. Forms with docked footers kept as `KeyboardAvoidingView` + `automaticOffset`. Stream Chat keyboard handling left untouched (owned by SDK).
- Files Changed:
  - `app.json` — added `"react-native-keyboard-controller"` to plugins array
  - `app/_layout.tsx` — added `KeyboardProvider` wrapper (statusBarTranslucent, navigationBarTranslucent)
  - `components/upload-entry.tsx` (x2 KAVs) — drop-in replacement + automaticOffset
  - `components/vault/rapid-fire-edit.tsx` — drop-in replacement + automaticOffset
  - `components/showcase-review.tsx` — drop-in replacement + automaticOffset
  - `components/login-page.tsx` — upgraded to KeyboardAwareScrollView
  - `components/signup-page.tsx` — upgraded to KeyboardAwareScrollView
  - `app/complete-profile/index.tsx` (x2 KAVs) — upgraded to KeyboardAwareScrollView
  - `components/vault/input-dialog.tsx` — drop-in replacement + automaticOffset
  - `components/settings-account.tsx` — drop-in replacement + automaticOffset
  - `components/edit-info-modal.tsx` — drop-in replacement + automaticOffset
  - `components/detail/edit-pricing-modal.tsx` — drop-in replacement + automaticOffset
  - `components/key-details-form.tsx` — drop-in replacement + automaticOffset
  - `components/key-details-modal.tsx` — drop-in replacement + automaticOffset
  - `components/upload/memorabilia-core-form.tsx` — drop-in replacement + automaticOffset
  - `components/trading-card-details-form.tsx` — drop-in replacement + automaticOffset
  - `components/conversation-thread.tsx` — drop-in replacement + automaticOffset
  - `components/community/post-composer.tsx` — drop-in replacement + automaticOffset
  - `components/community/post-reply-thread.tsx` — drop-in replacement + automaticOffset
- Validation: ReadLints passed on all 18 edited files. No linter errors introduced.
- Notes:
  - Requires EAS dev client rebuild (`eas build --platform ios --profile development`) before runtime testing.
  - Stream Chat's `<Channel keyboardVerticalOffset>` is untouched — it owns its own keyboard avoidance.
  - `quick-attach-bar.tsx` `Keyboard.addListener` pattern left as-is — visibility detection, not avoidance.
  - `KeyboardToolbar` (prev/next/Done) deferred as optional polish pass.
