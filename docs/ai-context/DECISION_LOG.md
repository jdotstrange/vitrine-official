# Decision Log

Last updated: 2026-08-27
Last verified: 2026-08-27

## Decision: Admin Slice 1 is vault census analytics (not the Looking Glass queue)

- Reason: Founder priority is seeing who and what is in the system — user counts, growth windows, collectible lists, and composition by type / person / franchise / etc. — with click-through. Live data showed “users” without a definition is misleading (~878 account rows vs ~41 with published items), so Slice 1 locks **Accounts vs Collectors** and ships lists, not dashboards-without-doors.
- Alternatives Considered: (A) Looking Glass queue / retry as Slice 1 — deferred (health *counts* on Overview only). (B) `onboarding_completed_at` as “real user” — rejected (almost unused). (C) DAU via `last_seen_at` — rejected (stale). (D) Census Overview + People + Catalog + Browse-by, Collectors = ≥1 published item, ET calendar math — selected.
- Status: **Spec locked 2026-08-27.** Canonical write-up: `docs/ai-context/ADMIN_SLICE_1.md`. Not implemented.
- Files Or Areas Affected (planned): `apps/admin/`, `staff_members` + admin RPCs (staff + AAL2 DEFINER, Wave 1 discipline), founder seed on roster. Production DB — call out on the PR.
- Notes: Time range control is Today / 7d / 30d / YTD / All with prior-period deltas. Phone tabs Overview | People | Catalog. Out of scope listed in the spec.

## Decision: Admin portal is a separate `apps/admin` app with TOTP MFA (pre–slice 1 lock)

- Reason: Founder-as-operator (Supabase dashboard, Railway logs, MCP SQL) does not scale, and stuffing ops into collector `/v/*` or marketing `apps/web` would share sessions, cookies, and auth with the phone app. A dedicated Next.js app on its own hostname keeps collector identity, collector RLS, and admin privilege as separate doors. Founder + co-founder are often on the go, so the HQ must be a first-class phone surface, not a desktop console with a squeezed breakpoint.
- Alternatives Considered: (A) Route group inside `apps/web` on `admin.myvitrine.app` — rejected; marketing + collector web + ops in one deploy, and cookie isolation is too easy to get wrong. (B) Third-party (Retool / Appsmith) — rejected; this is Vitrine HQ, not a vendor CRUD shell, and those tools are desktop-first. (C) Admin screens inside `/v/*` — rejected; collector session, `shouldCreateUser: true`, and the native logout-on-web-signin bug. (D) Separate native admin app — rejected; two people, browser + authenticator is enough. (E) Separate `apps/admin` (`@vitrine/admin`) on `admin.myvitrine.app`, phone + desktop as equal surfaces — selected.
- Status: **Architecture locked 2026-08-27.** Slice 1 spec locked the same day (`ADMIN_SLICE_1.md`). Not implemented.
- Files Or Areas Affected (planned): `apps/admin/` (new), root `package.json` scripts, `docs/ai-context/{ARCHITECTURE,MONOREPO,DATA_MODEL}.md`, future `staff_members` migration, admin-only Edge Functions / RPCs. `apps/web` and `apps/native` stay untouched for this work except `scope: 'local'` sign-out hygiene if we touch auth.
- Notes: Locked contracts below. Changing any of them is a new decision, not a silent implementation choice.

### Locked contracts

**App + deploy**
- New workspace app `apps/admin` (`@vitrine/admin`). pnpm workspace already includes `apps/*`.
- Next.js 16 + React 19 + Tailwind, same generation as `apps/web`. Do **not** import native vault, collector `/v/*` shells, or marketing page components. Do **not** treat `@vitrine/design-tokens` or the V3 playbook as the admin visual system (see Design authority).
- Own Vercel project. Hostname **`admin.myvitrine.app`**. Noindex, no sitemap, no link from the marketing site or the collector web app.
- Same production Supabase as native + web (preview/prod already share that project). Admin is live against real data the first day it authenticates — call that out on every migration PR.
- Root scripts when scaffolded: `dev:admin`, `build:admin`.

**Surfaces (phone + desktop)**
- Phone and desktop are **equal** priority surfaces. Founder and co-founder use this on the go. Do not ship a desktop console and “make it fit” later.
- Responsive web in Mobile Safari / Chrome — not a second native app, not a required PWA in v1. “Add to Home Screen” may come later; it is not a Slice 1 gate.
- Every screen (auth included) must work at ~390px: 44pt touch targets, safe-area insets, keyboard-safe OTP / TOTP fields. Desktop may add density (side nav, multi-column); it must not be the only layout.
- Navigation is a real mobile pattern (bottom bar or sheet menu), not a collapsed desktop sidebar that overflows. Dense ops data (queues, tables) gets a stacked/card phone layout — horizontal-scroll-only admin tables are not acceptable as the phone experience.
- TOTP enroll must work on a phone: QR to scan with a second device **and** a copyable secret for the same-phone authenticator-app path.
- Slice 1 verification includes a phone pass, not a desktop screenshot.

**Design authority (Apple HIG)**
- For every visual and interaction choice in `apps/admin` (phone **and** desktop), the **`apple-hig-designer` skill is the priority decision maker.** Native V3 playbook, vault components, and marketing DNA do not govern this app.
- Follow HIG: SF system font stack, 8pt grid, 44×44pt targets, grouped lists, sheets/alerts, capsule primary actions, tab labels always visible, solid backgrounds by default (glass only if explicitly requested). Phone: tab bar (or HIG-equivalent). Desktop: sidebar / split view per HIG platform adaptation — not a squeezed phone layout and not a custom V3 lens strip.
- Conflict rule: HIG structure, type, spacing, semantics (system blue primary, system red destructive), and motion win. Vitrine wordmark/mark may appear; ivory/volt may tint accent **only** when it does not fight HIG semantics. Do not port Electrolize, frost-on-void theater chrome, or vault primitives into admin.
- Verification: HIG checklist in the skill + phone pass. Agents working in `apps/admin` must read `apple-hig-designer` before inventing UI.

**Identity + gates (all required)**
- Invite-only. Source of truth is a `staff_members` table (email + role + optional `user_id` + `revoked_at`), **not** a boolean on `public.users`.
- Roles: `owner` | `ops` | `support`. Domain gate is `@myvitrine.app` (lowercase, trim). Roster is the second gate — a Workspace mailbox is not automatically staff.
- Login rejects anyone not on an active (non-revoked) roster row **before** OTP is sent. Client never uses `shouldCreateUser: true`; only a server path that has already checked the roster may create an auth user.
- Same Auth user as a collector account is allowed (founder’s `john@myvitrine.app`). Staff grants the admin door; collector RLS does not change.

**Authenticator MFA (AAL2)**
- Supabase Auth TOTP (`factorType: 'totp'`, RFC 6238). This is an **authenticator app** factor: Google Authenticator, Duo Mobile (as a TOTP account), 1Password, Authy, Microsoft Authenticator, etc.
- **Not** Duo SSO / Duo Push. **Not** SMS. **Not** email as the second factor. **Not** passkeys in v1.
- Login sequence: roster+domain → email OTP (AAL1) → mandatory TOTP enroll (QR + copyable secret + verify) on first admin session → TOTP challenge on later sessions → AAL2. Middleware and privileged RPCs both require `auth.jwt()->>'aal' = 'aal2'`. No admin page is reachable at AAL1.
- v1 TOTP recovery: founder resets the factor in Supabase (no self-serve recovery codes yet).

**Session isolation (load-bearing)**
- Admin cookies are host-only on `admin.myvitrine.app` (not parent `.myvitrine.app`). Separate storage key from collector `/v/*`.
- `signOut({ scope: 'local' })` only. Never global sign-out from admin.
- This is the containment for the existing “web sign-in logs out native” bug — admin must not rotate the collector/native refresh token.

**Data access**
- Do **not** put `is_admin` on `public.users`. Do **not** widen collector RLS for staff JWTs.
- Admin reads/writes go through staff-checked RPCs or Edge Functions (`auth.uid()` ∈ active `staff_members` **and** AAL2). A stolen collector JWT remains a collector.
- No impersonation, no marketing CMS, no feature-flag console until those slices are specced.

**Out of scope for later slices (Slice 1 is specced in `ADMIN_SLICE_1.md`)**
- Looking Glass retry/queue, DAU/WAU, brand CMS, moderation, impersonation, writes to collector data.

## Decision: Storage writes bind to `public.users.id`, not `auth.uid()` (2026-08-27)

- Reason: All 878 profile rows have `id <> supabase_auth_id`. Native and web upload to `{profile.id}/…`. The canvas suggested `(storage.foldername(name))[1] = auth.uid()::text`, which would reject every live client upload. The old collectible DELETE policy already made that mistake (silent no-op).
- Alternatives Considered: (A) Bind to `auth.uid()` as the audit canvas wrote — rejected; (B) Rewrite all upload paths to auth uid + dual-policy for old objects — rejected (OTA + two folder conventions forever); (C) `current_profile_id()` helper + path-bound INSERT/UPDATE/DELETE, extra DELETE for `migrated/{collectible_id}` via `owns_collectible` — selected.
- Status: Active. Applied to production as `20260827140913_lock_storage_object_policies`.
- Files Or Areas Affected: `supabase/migrations/20260827140913_lock_storage_object_policies.sql`. `media-upload` / `migrate-images` / `generate-variants` still service_role.

## Decision: Wave 1 DEFINER RPCs are service_role- or caller-bound (2026-08-27)

- Reason: Client-callable SECURITY DEFINER functions bypassed RLS. `update_collectible_photos` had no owner check; `unschedule_if_exists` could kill cron; `get_or_create_dm` trusted client-supplied user ids. Card Hedge RPCs were already dropped.
- Alternatives Considered: (A) Enable RLS only and leave DEFINER EXECUTE open — rejected (DEFINER still bypasses RLS); (B) Drop unused RPCs (`get_or_create_dm`) — deferred (Stream replaced callers, but a bound function is safer than a surprise drop); (C) Revoke client EXECUTE on write/cron helpers, bind remaining RPCs to `auth.uid()`, guard trigger functions with `TG_NAME` — selected.
- Status: Active. Applied to production app DB `fxmiongkckkrllgyfwyw` as `20260827134743_lock_dangerous_definer_rpcs`.
- Files Or Areas Affected: `supabase/migrations/20260827134743_lock_dangerous_definer_rpcs.sql`. `migrate-images` edge still uses service_role.

## Decision: Bump `runtimeVersion` to `3` for Android-first compat (expo-clipboard + image-picker plugin)

- Reason: First Android binary needs `expo-clipboard` (RN 0.81 removed `Clipboard` from `react-native`) and an `expo-image-picker` plugin config that sets `microphonePermission: false`. Both are native/plugin changes. Bumping to `"3"` keeps this JS off runtime-`2` iOS preview IPAs so we don't OTA a missing native module onto existing installs.
- Alternatives Considered: (A) Stay on runtime `2` and OTA to iOS — rejected (clipboard native module missing from those IPAs); (B) Skip clipboard package and keep the removed RN API — rejected (crash risk on RN 0.81); (C) Bump to `3`, ship via new Android APK + later iOS IPA — selected.
- Status: Active on branch `feat/android-first-compat`. APK not cut yet (founder gate).
- Files Or Areas Affected: `apps/native/app.json`, `apps/native/package.json` (`expo-clipboard`), picker/share/back/clipboard adapters.

## Decision: Unified passwordless auth — one `AuthScreen` (email→OTP) replaces separate login/signup pages
- Reason: Two near-identical password-era screens (`login-page.tsx` / `signup-page.tsx`) carried duplicate UI and diverged in styling. A single email→6-digit-OTP flow with `shouldCreateUser: true` serves both new and returning users — the email lookup decides the path server-side, so the client doesn't need a login/signup fork.
- Alternatives Considered: (A) Keep two screens, share a component — rejected (still two routes, two styling surfaces to drift); (B) Magic-link deep link instead of OTP code — rejected (worse on-device UX, harder autofill); (C) Single `AuthScreen` email→OTP, delete both pages — selected.
- Status: Active. Shipped 2026-06-22 (`a0bfd8d`, preview OTA `668da060-6c25-4a52-a8c7-1113117db615`, runtime `2`).
- Files Or Areas Affected: `components/auth-screen.tsx` (new), `app/login/index.tsx` (renders it), `app/signup/index.tsx` (redirects `/login`), deleted `components/{login-page,signup-page}.tsx`, `nav-menu.tsx` test link.
- Notes: OTP step uses a **single `TextInput`** with `textContentType="oneTimeCode"` + `autoComplete` + auto-submit on 6 digits — this is required for iOS autofill; six separate boxes break it. Dark V3 throughout (Matter-style email step, Endel-style OTP step).

## Decision: Void-continuous boot screen (reuse native splash art; hide splash in the boot component)
- Reason: The launch handoff flashed the app stack underneath before content was ready. Reusing the exact native splash PNG + `#020202` background + contain math in a JS boot screen makes the transition seamless — only a progress hairline appears; the art never moves or rescales.
- Alternatives Considered: (A) Hide native splash in `app/_layout.tsx` on font load — rejected (flashes stack before auth resolves); (B) Custom animated logo intro — rejected (breaks splash continuity); (C) Boot screen that mirrors splash layout and hides the native splash itself on mount — selected.
- Status: Active. Shipped 2026-06-22 (`a0bfd8d`).
- Files Or Areas Affected: `components/vitrine-boot-screen.tsx`, `lib/splash-contain-layout.ts` (`SPLASH_BG` / `SPLASH_SOURCE` / `getContainRect`), `app/index.tsx` (mounts while `auth.isLoading`), `app/_layout.tsx` (splash-hide deferred out — comment only).
- Notes: `SPLASH_BG` / `SPLASH_SOURCE` must stay matched to `app.json` splash (`#020202`, `splash-icon.png`, `resizeMode: contain`). If `app.json` splash changes, update `splash-contain-layout.ts` in lockstep.

## Decision: Skeleton system consolidated into one `components/skeleton/` barrel on a shared pulse provider
- Reason: Skeletons were scattered across `skeleton.tsx`, `skeleton-community.tsx`, `skeleton-messaging.tsx`, and a `skeletons/*` folder with overlapping/dead files, each running its own animation. One barrel + a shared opacity-pulse driver reduces duplication and animation cost.
- Alternatives Considered: (A) Leave scattered, fix piecemeal — rejected (import sprawl, per-component loops); (B) Single barrel (`primitives` + per-domain modules) with composed screen skeletons, delete legacy — selected.
- Status: Active. Shipped 2026-06-22 (`a0bfd8d`).
- Files Or Areas Affected: new `components/skeleton/*`, composed `components/skeletons/{collectible-detail,profile-hub,showcase-detail,tracking-overview}.tsx`, shared pulse in `components/vault/skeleton.tsx`; deleted legacy skeleton files (see IMPLEMENTATION_LOG).
- Notes: Any import of the old `@/components/skeleton.tsx` / `skeleton-community` / `skeleton-messaging` or deleted `skeletons/*` must move to the new `components/skeleton/` barrel.

## Decision: Pro lenses ship dark behind a paywall now (`PRO_SHIP_DARK`) instead of "coming soon"
- Reason: PULSE / VAR / AAR detail lenses aren't ready to deliver live analytics, but showing a "coming soon" placeholder undersells the product. A `PRO_SHIP_DARK` flag renders a `LensPaywallCard` upsell instead, framing them as Pro features pending rollout.
- Alternatives Considered: (A) Keep "coming soon" body — rejected (reads as unfinished); (B) Hide the lenses entirely — rejected (loses the Pro narrative); (C) Flag-gated paywall card with per-feature copy — selected.
- Status: Active. Shipped 2026-06-22 (`a0bfd8d`).
- Files Or Areas Affected: `lib/pro-ship-dark.ts` (`PRO_SHIP_DARK`, `PRO_FEATURE_COPY`), `components/vault/lens-paywall-card.tsx`, `components/vault/vitrine-pro-coming-soon-sheet.tsx`, `detail/lenses/{pulse,var,aar}-lens.tsx`, `aar-lens-no-signature.tsx`.
- Notes: Flag-controlled — flip `PRO_SHIP_DARK` off to restore "coming soon" once real analytics ship.

## Decision: Edit collectible provenance reconciles against session baseline (clear markers when values match)
- Reason: `computeMetadataProvenance` only added `ai.*` / `trait.*` keys when final ≠ baseline but never removed them when values matched again. After a prior edit save, a photo-rerun + save with no field changes left stale **Edited** chips (e.g. Grip Tape, Inscribed on Ohtani bat).
- Alternatives Considered: (A) Strip all spec provenance on every rerun commit — rejected (loses legitimate listing provenance); (B) Reconcile: set marker when different, **delete** when equal, union keys from baseline + final + existing — selected.
- Status: Active. Shipped 2026-06-02 (`e83f6e4`, OTAs `fd922925` preview / `db889dfe` production, runtime `2`).
- Files Or Areas Affected: `apps/native/lib/api/collectibles.ts` (`computeMetadataProvenance`, `provenanceFieldKeys`), `upload-entry.tsx` (`provenanceBaseline` from S0 or `engineBaselineRef` on rerun).
- Notes: Metadata-only edit path uses S0 baseline at open. Rerun path uses fresh LG output as baseline. Existing DB rows may need one post-OTA save to clear orphan markers.

## Decision: Edit collectible uses staging draft for photo rerun (`reextraction_of`), metadata-only path preserves row id
- Reason: Photo add/remove must re-run Looking Glass without mutating the published collectible in place during extraction. Staging draft holds engine output; `commitReExtraction` merges engine cols + photos onto original id and deletes draft. Reorder-only photo changes skip rerun (`commitMetadataUpdate`).
- Alternatives Considered: (A) In-place overwrite on original row during extraction — rejected (partial failure leaves published row inconsistent); (B) Staging draft + merge commit — selected.
- Status: Active. Shipped 2026-06-02 (`e83f6e4`).
- Files Or Areas Affected: `collectibles.reextraction_of`, `createReExtractionDraft`, `commitReExtraction`, `commitMetadataUpdate`, `upload-entry.tsx` photo multiset detector.
- Notes: `custom_fields` preserved across rerun; never overwritten by LG. `published_at` preserved on both paths.

## Decision: Theater becomes The Lattice (stage-choreographed reasoning graph, no fake progress)
- Reason: Progress ring / HUD read as generic and time-faked. The Lattice visualizes the real engine reasoning process (stage signals from `job-status`) in a time-agnostic way — ambient motion keeps 15s and 90s runs alive without inventing progressive data reveal (atomic at completion).
- Alternatives Considered: (A) Iterate on HUD (crosshair, hex logs) — rejected (still generic CV aesthetic); (B) Progressive attribute reveal — rejected (engine delivers data atomically); (C) Full-bleed SVG graph choreographed to `STAGE_RANK` — selected.
- Status: Active. Shipped 2026-06-02 (`feb0c25`, preview OTA `8e9655e9-2eff-44c4-a157-6e3446788fbb`, runtime `2`).
- Files Or Areas Affected: `apps/native/components/upload-entry.tsx` (`TheaterStep`, `buildLattice`, lattice sub-components), `@vitrine/api` `pollEngineJobStatus`.
- Notes: **Supersedes Theater 25s linear / 85% cap UX** — old ring OTA still on runtime-`1` channel history; runtime-`2` devices get Lattice after cold restart. Extraction poll/reconcile path unchanged. Monochrome ivory while reasoning; single trait color at verdict.

## Decision: Native single-lane upload becomes Identify-first (prefs before Analyze, Review ends with Catalog)
- Reason: Web bulk uploader already collects photos + context + owner preferences on one card before processing. Native's post-AI Finalize step added a full screen at the end of the critical path and encouraged "snap → Analyze" without catalog intent. Merging prefs into Identify (with strict Analyze validation) aligns platforms, pairs with speculative upload overlap, and reframes the product as cataloging — not casual image lookup.
- Alternatives Considered: (A) Keep Scan + Finalize separate — rejected (extra screen after Review, underuses Identify dwell time); (B) Move prefs to Review — rejected (prefs are owner intent, not AI verification); (C) Identify-first with prefs on draft insert + Catalog on Review — selected.
- Status: Implemented (2026-06-02).
- Files Or Areas Affected: `apps/native/components/upload-entry.tsx`, `apps/native/lib/api/collectibles.ts`, future authenticated web single-lane (must follow same pattern — see OPEN_THREADS).
- Notes: Analyze blocked until photos + valid value (when sale/trade). Showcase links still at Catalog commit. CTA lexicon: **Catalog** = confirm & publish. Tier 1 speculative upload + Theater dwell trim already shipped separately.

## Decision: Bump `runtimeVersion` to `2` when cutting new preview binary (isolate PhotoReorderGrid native stack)
- Reason: `PhotoReorderGrid` required native bumps (Reanimated 4.1.7→4.3.1, Worklets 0.5→0.8, `react-native-reanimated-dnd@2`). May 26 preview binary `c69ae9b1` included those natives but still shipped with `runtimeVersion: "1"`, same as May 24 preview `e5113d4a` (without dnd). Expo Updates delivered runtime-`1` JS bundles to both — upload tab crash risk on older installs. Bumping to `"2"` ensures only binaries built after the bump receive new preview OTAs.
- Alternatives Considered: (A) OTA only, no runtime bump — rejected (continues cross-delivering to incompatible natives); (B) New preview build without runtime bump — rejected; (C) Bump `runtimeVersion` + new `eas build --profile preview` — selected.
- Status: Active. `runtimeVersion: "2"` committed `33ec04f` on `main` (2026-05-30). **Preview binary build pending** founder `eas build`.
- Files Or Areas Affected: `apps/native/app.json`, preview/production EAS Update channels (future OTAs must target runtime `2` on preview until next native bump).
- Notes: Production channel still on runtime `1` until a production binary is cut with matching version. After runtime-`2` preview IPA ships, publish baseline: `eas update --channel preview --message "runtime 2 baseline"`. Team must reinstall — do not expect OTA to fix runtime-`1` devices.

## Decision: LensPager page 0 reserves rightward horizontal drags for stack edge-back (no back chevron in lens chrome)
- Reason: Collectible detail V3 uses Philosophy B — the display `LensSelector` *is* the top bar. A persistent back chevron beside DETAILS/SPECS breaks the analytical-surface concept. Users expect edge-swipe-back on iOS; the custom `LensPager` `Pan` with symmetric `activeOffsetX([-12, 12])` claimed rightward drags across the full middle flex band and blocked interactive pop except at selector/dock zones (no pan there). On page 0 there is no lens −1 — rightward drag should mean navigation pop, not pager.
- Alternatives Considered: (A) Visible back button in lens row — rejected (founder/design: disrupts chrome); (B) `react-native-pager-view` full rewrite — rejected for scope; (C) Edge carve-out + asymmetric `activeOffsetX` on index 0 only — selected; (D) Material Top Tabs per lens — rejected (route explosion, same chrome issue).
- Status: Active. Shipped 2026-05-27 (`5d32845`, preview OTA `a3610490-8612-4e9f-858f-ece6e2ca932b`). Founder dev-client validated.
- Files Or Areas Affected: `apps/native/components/vault/lens-pager.tsx`, `apps/native/components/collectible-detail-v3.tsx` (comment only). Applies to every consumer of `LensPager` when `index === 0` (collectible detail, and any hub opened on first lens).
- Notes: Pages 1..N keep bidirectional `[-12, 12]`. Optional future belt-and-suspenders: `manualActivation` fail for touches starting in left ~32pt on page 0 — not required after asymmetric offset shipped. Android predictive back benefits the same rule.

## Decision: Theater cosmetic progress uses 25s linear crawl to 85% cap (poll-driven exit unchanged)
- Reason: 30s `easeInOut(quad)` to 0.97 parked early in the middle and read as "stuck at 90%+" while extraction was still running. Linear 25s to 0.85 keeps steady motion; percent label floors and caps at 84 until `extracted`/`complete`, then existing 250ms sprint to 100% on poll success. Ring/reveal animations wait for `extractionJobId` so upload-to-enqueue time is not counted as fake progress.
- Alternatives Considered: (A) Keep 30s easeInOut to 97% — rejected (founder pacing feedback); (B) 90s linear — rejected (too slow); (C) 25s linear to 85% + poll sprint — selected.
- Status: **Superseded for UX** by Lattice Theater (2026-06-02). Extraction poll path unchanged. Historical reference for runtime-`1` OTAs only.
- Files Or Areas Affected: `apps/native/components/upload-entry.tsx` (`THEATER_COSMETIC_MS`, `THEATER_PROGRESS_CAP`, `TheaterStep`, checklist durations).
- Notes: Does not fix extraction never completing (97% hang when poll stalls) — see OPEN_THREADS "Theater 1 extraction reliability". Checklist total remains 25s (4×4s + 9s).

## Decision: Assembly UI is dossier seals (Direction B), not a utilitarian progress screen
- Reason: v1 Assembly (shelf + linear bar + `2 of 6` counter) read as infrastructure, not closure. Direction B uses a frosted dossier card, blur-to-sharp filmstrip, ledger row seals, and a volt border + `BOUND` kicker swap so the beat reads as "this piece is now yours in the vault" — distinct from Theater's analytical HUD.
- Alternatives Considered: (A) Keep v1 shelf — rejected after founder review; (B) HolographicFrame continuity from Theater — rejected (too similar to Theater); (C) Frosted card + filmstrip + ledger rows + volt seal — selected; (D) VAULT stamp under card — rejected (less is more).
- Status: Active. Shipped 2026-05-27 (Assembly B OTA).
- Files Or Areas Affected: `apps/native/components/upload/assembly-step.tsx`, `apps/native/components/upload-entry.tsx` (`title` prop).
- Notes: Display row (`Mounting display`) is the only row gated on real variant work; other rows use cosmetic stagger capped by `MIN_TOTAL_MS`. Theater cosmetic pacing shipped separately (`f09e891`, 25s linear / 85% cap).

## Decision: Image variants are generated in Assembly, not at Identify (Looking Glass path stays variant-free)
- Reason: `generateVariantsBackground` at Identify launched up to 18 parallel resize+upload jobs that continued through Theater 1 and into the next upload's Identify — the realistic source of back-to-back single-lane uploads feeling stuck/slow at the cosmetic 97% ring. Looking Glass extraction only consumes original URLs, so deferring variants does not affect extraction quality.
- Alternatives Considered: (A) Keep background variants at Identify with a lower concurrency cap only — rejected, still overlaps Theater polling and the next upload's Identify; (B) Defer all variants to a gated Assembly step after Finalize commit — selected; (C) Regenerate variants on app relaunch only — rejected, grid thumbnails would 404 until then.
- Status: Active. Shipped 2026-05-27 on `main` (`62d8222`, preview OTA soak completed).
- Files Or Areas Affected: `apps/native/lib/image-utils.ts` (`generateVariants`, `assemblyVariants`, `uploadOriginalOnly` comment), `apps/native/components/upload/assembly-step.tsx`, `apps/native/components/upload-entry.tsx`, `apps/native/components/detail/framed-hero.tsx` (`displaySize` for upload Review/Finalize).
- Notes: `uploadWithVariants` (avatar, legacy collectibles, trading-cards) remains inline — out of scope. Assembly hard-skips on empty work or 45s timeout (proceeds to Success; Sentry breadcrumb `assembly_complete`). Variant backfill after timeout is tracked in OPEN_THREADS.

## Decision: `PhotoReorderGrid` is the canonical multi-photo reorder primitive (built on `react-native-reanimated-dnd@^2.0.0`)
- Reason: The upload-flow photo grid needed a Layer-2 polish (drop indicator + items-shuffle-aside motion) that DFL couldn't deliver without crashing (see the May 24 crash chain). Migrating the upload grid alone would have left the same UX gap on every FUTURE multi-photo surface — Upload Lane Chunk B (Batch Lane Review tab), the eventual edit-existing-collectible-photos surface, possibly bug-report multi-image attach. Extracting the implementation into `apps/native/components/vault/photo-reorder-grid.tsx` (a `<PhotoReorderGrid>` primitive in the vault barrel) locks the interface against the highest-value future consumer right now and prevents the copy-paste drift class that produced the DFL crash chain.
- Alternatives Considered: (A) Migrate only the upload grid inline, extract later when Batch Lane lands — rejected, recreates the drift risk and forces a second migration; (B) Build the grid on top of `react-native-reanimated-dnd@1.1.0` (compatible with Reanimated 4.1.7) using only `useSortable` and hand-rolled grid math — rejected, more custom code defeats the migration's purpose; (C) Switch to `react-native-reorderable-list` (omahili) — rejected, list-only, would also require hand-rolled grid math, aesthetically locked to dashed drop-indicator (we deliberately chose the shuffle-aside-as-indicator pattern); (D) Extract `PhotoReorderGrid` as the canonical primitive on `react-native-reanimated-dnd@^2.0.0` — selected.
- Status: Active. Shipped 2026-05-26 on `main` (`c474d7c`–`c69300a`, founder dev-client validated). **Preview cut:** `runtimeVersion` `2` committed 2026-05-30; founder running `eas build --profile preview` — see OPEN_THREADS "Preview binary runtime 2 distribution".
- Files Or Areas Affected: `apps/native/components/vault/photo-reorder-grid.tsx` (new primitive), `apps/native/components/vault/index.ts` (barrel + `PhotoReorderGridProps` + `PhotoAsset` type), `apps/native/components/upload-entry.tsx` (ScanStep consumer — DFL block deleted, ~140-line net reduction, replaced with `<PhotoReorderGrid />`), `apps/native/package.json` (added `react-native-reanimated-dnd@^2.0.0`, bumped `react-native-reanimated` to `^4.2.0`, bumped `react-native-worklets` to `^0.8.0`).
- Notes: Aesthetic spec is locked inside the primitive: lift scale 1.12, inner glow `rgba(255,255,255,0.06)` + brandVolt 1→2px border (NO shadow / NO elevation), spring `damping:18, stiffness:220`, 220ms long-press, per-tile lift (Pattern A), `+` sentinel rendered OUTSIDE SortableGrid as absolute sibling, remove-X disabled during drag. The "items shuffle aside" affordance IS the drop indicator — no separate dashed overlay (Apple Photos pattern). Future surfaces consume this primitive; do NOT reach for `react-native-reanimated-dnd` directly. **DFL has NOT been removed from `package.json`** — the legacy V1 memorabilia upload flow (`components/upload/memorabilia-core-form.tsx` → `components/upload/photo-grid.tsx`) still consumes DFL; migrating that to `PhotoReorderGrid` is tracked as a separate follow-up thread in OPEN_THREADS (the V1 flow uses a horizontal carousel, not the 3-column grid, so it needs either an orientation prop expansion on `PhotoReorderGrid` or a sibling primitive). **Migration required bumping `react-native-reanimated` and `react-native-worklets`** (native modules) — this is a binary rebuild, not an OTA, contradicting one bullet of the original migration plan. The new binary then becomes the OTA baseline for future JS iterations.

## Decision: Cross-platform consistency first — prefer one implementation that works identically on iOS + Android over platform-branched alternatives
- Reason: Founder principle, captured during the 2026-05-26 PhotoReorderGrid design. When facing a UI/UX decision with multiple valid implementations (e.g., drop shadow for elevation, blur effects, gesture timing), prefer the solution that renders identically on both iOS and Android over solutions that require `Platform.OS` branching, OS-specific values, or visually different fallbacks. The friction of maintaining parallel paths compounds across every component; the user-perceived inconsistency between platforms compounds across every screen.
- Alternatives Considered: (A) Platform-branch when the native idiom diverges and accept the maintenance tax — rejected as default (use only when no cross-platform path exists); (B) Pick the iOS idiom and live with degraded Android — rejected, both platforms are first-class targets; (C) Cross-platform-consistent solution first; branch only when no equivalent exists — selected.
- Status: Active. Applied as the design principle behind the PhotoReorderGrid lift visual (inner glow + brandVolt border instead of platform-branched drop shadows).
- Files Or Areas Affected: New design principle. Codified in `.cursor/rules/design-system-playbook.mdc`. Concrete first application: `apps/native/components/vault/photo-reorder-grid.tsx` — zero `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` / `elevation` properties anywhere in the file. The "lifted tile" affordance uses an inner-glow Animated.View overlay + animated `borderColor` / `borderWidth` instead. Theme-agnostic too — renders correctly in Dark and Light without re-tuning.
- Notes: Drop shadows are the canonical anti-example. On iOS dark mode they're invisible (need much higher opacity than light mode); on Android they require `elevation` which is a different property with different semantics and z-stacking implications; the result is either platform branching or platform inconsistency. The inner-glow + accent-border pattern matches Apple's own dark-mode UI (notifications, share sheet, action-sheet selected state) and renders the same way on Android with no branching. When a future component needs an "elevated"/"lifted"/"selected" visual, START from this pattern; only reach for shadows if there's a documented reason this pattern can't carry the design.

## Decision: `published_at IS NOT NULL` as the system-wide visibility gate
- Reason: The previous draft/staging pattern (`extraction_status = 'complete'` + client-side commit) had multiple failure modes — app closure before commit, stale drafts accumulating, sweep jobs as bandaids. A single nullable `published_at` timestamp cleanly separates "exists in DB" from "visible to the world." Backfill sets it for all existing complete collectibles. All public-facing queries (~30 client-side + 9 RPCs) now filter on `published_at IS NOT NULL`.
- Alternatives Considered: (A) Add a `state` enum column (public/private/draft) — rejected, adds a third axis of visibility alongside `status`; (B) Keep extraction_status as gate — rejected, conflates processing state with publication intent; (C) `published_at` timestamp — selected, enables future scheduling, is a single boolean-equivalent check, and cleanly supports "hold for review" (just don't set it).
- Status: Active. Shipped 2026-05-19.
- Files Or Areas Affected: `supabase/migrations/20260519170000_upload_lane_unification.sql` (column + backfill + trigger), all public-facing queries in native + web + RPCs, `packages/api/src/modules/collection-queries.ts` (helpers).
- Notes: Legacy collectibles are safe — backfill sets `published_at = extraction_completed_at` for all rows where `extraction_status = 'complete'`. The `complete_and_publish` trigger auto-sets it on future completions unless `batch_uploads.auto_publish = false`.

## Decision: Server-side auto-commit via DB trigger (no client-side commit step)
- Reason: The old pattern required the client to call `commitDraftCollectible` after extraction succeeded. If the app closed, the user navigated away, or the network dropped, the collectible would remain in a ghost "extracted but uncommitted" state requiring sweep jobs to clean up. Moving the commit to a Postgres AFTER UPDATE trigger that fires when `extraction_status` transitions to `'extracted'` eliminates client dependency entirely. The trigger atomically flips `extraction_status` to `'complete'` and sets `published_at = now()`.
- Alternatives Considered: (A) Keep client-side commit with more robust retry — rejected, still fails on app close; (B) Edge Function webhook does the commit — rejected, adds network hop and failure mode; (C) DB trigger — selected, zero latency, atomic, cannot be skipped.
- Status: Active. Shipped 2026-05-19.
- Files Or Areas Affected: `supabase/migrations/20260519170000_upload_lane_unification.sql` (`complete_and_publish` trigger function), `apps/web/app/v/upload/batch-processor.ts` (removed Phase 5 client commit), `apps/native/components/upload-entry.tsx` (handles 'complete' same as 'extracted'), `apps/native/app/_layout.tsx` (removed sweep component).
- Notes: The trigger does NOT touch `extraction_completed_at` (no such column exists in the schema) and does NOT insert showcase rows. It only flips `extraction_status` and sets `published_at`. `published_at` is set unconditionally for single-lane uploads (`batch_id IS NULL`); for batch-lane uploads it respects `batch_uploads.auto_publish` — if false, `published_at` is left NULL and the item goes to the user's review queue.

## Decision: Monochrome Theater checklist — brandVolt only, no trait colors
- Reason: The Theater (Looking Glass HUD) checklist previously used per-row trait colors (`traitCyan`, `traitViolet`, `traitPink`, `traitOlive`, `semanticGreen`) for completed items. This was removed in favor of a single brandVolt (warm ivory) completion color. Trait colors are reserved for their semantic uses across the app (trait pills, match tiers, status indicators) and using them decoratively in the checklist dilutes their meaning. The monochrome approach lets the gradient progress ring own the color on the Theater surface.
- Alternatives Considered: (A) Keep per-row trait colors — rejected, trains users to associate those colors with the wrong context; (B) Monochrome brandVolt for all completed items — selected, cleaner and on-brand; (C) Dim white for completed items — rejected, brandVolt provides stronger hierarchy.
- Status: Active.
- Files Or Areas Affected: `apps/native/components/upload-entry.tsx` — removed `ChecklistColorKey` type, `CHECKLIST_COLORS` array; `ChecklistRow` now uses `colors.brandVolt` for all complete states. Checklist items dimmed when queued, brandVolt when processing/complete.

## Decision: Stream-first push notification architecture (Option A)
- Reason: Stream Chat handles chat message push natively. Stream Activity Feeds handles activity notification push natively. Both use APNs/FCM directly. Using Stream for all push delivery avoids building a parallel push infrastructure (Expo Push API, server-side delivery, token relay). `expo-notifications` handles client-side only: permission, token acquisition via `getDevicePushTokenAsync()`, foreground display, badge, deep-link routing.
- Alternatives Considered: (A) Stream handles all push — selected; (B) Expo Push API handles everything — rejected, duplicates what Stream already does for chat, requires server-side push infrastructure; (C) Hybrid Stream for chat + Expo for activity — rejected, two pipelines to debug, deduplication risk.
- Status: Active. **Implemented and verified on device 2026-05-14.**
- Files Or Areas Affected: `.cursor/plans/push_notifications_build2.plan.md` (comprehensive plan), Stream Dashboard (APNs key uploaded, `message.new` enabled), `apps/native/lib/push.ts` (implemented), `apps/native/lib/contexts/push-context.tsx` (implemented), `apps/native/app/_layout.tsx` (NotificationTapHandler + PushProvider), `supabase/migrations/20260513000000_create_user_push_tokens.sql`, `supabase/functions/test-push/index.ts`.
- Notes: 8 notification types push-enabled, 5 feed-only, 4 journal (never pushed). APNs Key ID `L7S5Z47YPL`. Stream does NOT support Expo push tokens (issue #3316) — use native APNs tokens via `getDevicePushTokenAsync()`. Firebase not needed for iOS. Named push provider `MyVitrineiOS` required in `addDevice` call. RLS on `user_push_tokens` checks `auth.uid()` (NOT `public.users.id`). Test push verified via `supabase/functions/test-push` Edge Function.

## Decision: Custom in-app photo picker replaces native UIImagePickerController/PHPickerViewController
- Reason: `expo-notifications` native module registers delegates that break iOS photo picker delegate callbacks. The `ImagePicker.launchImageLibraryAsync` Promise hangs indefinitely for iCloud-optimized and HEIC photos when expo-notifications is in the native layer. This was diagnosed as a native-level delegate chain conflict — JS-only workarounds (removing quality option, forcing single-select) only partially mitigated the issue. Building a custom picker using `expo-media-library` provides full control, bypasses the native picker entirely, handles iCloud downloads explicitly via `getAssetInfoAsync`, and supports multi-select with a polished grid UI.
- Alternatives Considered: (A) JS-only workarounds (partial fix, still hangs for some photos); (B) Remove expo-notifications (unacceptable — push is a core feature); (C) Patch expo-image-picker native code (fragile, version-locked); (D) Custom picker with expo-media-library — selected.
- Status: **SUPERSEDED 2026-05-24 (evening)** by "Decision: Native `PHPickerViewController` via `launchImageLibraryAsync` is the photo library picker (custom picker retired)". The custom picker felt janky on scroll (paginated `FlatList` grid via `expo-media-library` cannot match Apple's native picker for smoothness, smart suggestions, or albums) and the hang issue that originally drove the custom picker has not recurred with the current expo-image-picker / expo-notifications stack on the current EAS preview binary. Treat the hang as a **monitoring item** — see OPEN_THREADS for rollback path if it returns. Keep this entry for historical context.
- Files Or Areas Affected: `apps/native/components/photo-library-picker.tsx` (now deleted, recoverable from git history at `5e72933^`), `apps/native/components/upload-entry.tsx`, `apps/native/app.json` (expo-image-picker plugin retained for camera AND library), `apps/native/package.json` (expo-media-library may now be safe to remove — confirm no other consumers first).

## Decision: Native `PHPickerViewController` via `launchImageLibraryAsync` is the photo library picker (custom picker retired)
- Reason: Founder flagged the custom in-app picker as feeling "janky" on scroll (Camera roll "turns black during scrolling") with no smart suggestions, no recently-added grouping, no native search. The native iOS picker (`PHPickerViewController`, accessed via `ImagePicker.launchImageLibraryAsync`) is buttery smooth, supports search, albums, smart suggestions, and ordered multi-select for free. Re-tested in tonight's EAS preview build: the Promise-hang issue that originally drove the custom picker did NOT recur (multi-pick + ordered-selection completed successfully on iCloud-optimized photos). Stack version dependencies have evidently resolved the delegate-chain conflict that existed in earlier expo-notifications versions.
- Alternatives Considered: (A) Keep the custom picker forever and accept the jank — rejected, the UX gap is real and the founder explicitly called it out; (B) Use both pickers, gated by an environment flag — rejected, two code paths to maintain; (C) Wait for native picker bugs to be re-verified across more devices — rejected, current EAS preview build is healthy and we have a documented rollback if it regresses; (D) Switch to native PHPicker — selected.
- Status: Active. Shipped 2026-05-24 (evening) in commit `5e72933` as part of OTA 2.
- Files Or Areas Affected: `apps/native/components/upload-entry.tsx` (`pickFromLibrary` callback rewritten — calls `ImagePicker.requestMediaLibraryPermissionsAsync` then `ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit, orderedSelection: true })`), `apps/native/components/photo-library-picker.tsx` (deleted), `docs/ai-context/DO_NOT_BREAK.md` (prior "do not use launchImageLibraryAsync" prohibition removed), `docs/ai-context/OPEN_THREADS.md` (former "permanent fix" thread re-opened as a monitoring item).
- Notes: **Monitoring path**: if the indefinite-hang Promise recurs (especially on iCloud-only HEIC photos), the rollback is to resurrect `photo-library-picker.tsx` from `git show 5e72933^:apps/native/components/photo-library-picker.tsx > apps/native/components/photo-library-picker.tsx` and revert `pickFromLibrary` to invoke it. Watch crash reports and user feedback for the next few weeks. `orderedSelection: true` preserves selection order in the returned array, which the upload grid relies on — do not remove without updating downstream logic.

## Decision: KeyboardSafeScroll / KeyboardSafeSheet / KeyboardSafeComposer are the canonical input-surface wrappers
- Reason: 23 surfaces across the native app were managing keyboard avoidance in 4-5 different ad-hoc ways — some using raw `KeyboardAvoidingView` with hand-tuned `keyboardVerticalOffset` per screen, some using `KeyboardAwareScrollView` with stale `automaticOffset` props that don't exist in `react-native-keyboard-controller`, some using nothing and relying on layout luck. The founder reported keyboard "hiding" or looking awkward across multiple screens. Building three wrappers around `react-native-keyboard-controller` primitives (a HIG-aligned scrollable form wrapper, a sheet/modal wrapper with iOS padding + Android height behavior, a sticky composer wrapper using `KeyboardStickyView`) lets every input surface inherit correct behavior via a single named import. Also mounted a globally themed `<KeyboardToolbar />` for prev/next/done navigation across `TextInput` chains, and configured Android `KeyboardController.setInputMode(SOFT_INPUT_ADJUST_RESIZE)` once at app root.
- Alternatives Considered: (A) Document the right way to use raw `KeyboardAvoidingView` per surface — rejected, requires perfect discipline forever; (B) Pick one of `react-native-keyboard-aware-scroll-view` / `react-native-keyboard-controller` and migrate to direct use everywhere — rejected, every surface still needs to know offset/behavior knobs; (C) Three named wrappers with HIG-aligned defaults — selected, one import per surface and the wrappers own the keyboard contract.
- Status: Active. Shipped 2026-05-24 (evening) in commit `fd7ce61`.
- Files Or Areas Affected: `apps/native/components/vault/keyboard-safe-scroll.tsx` (new), `apps/native/components/vault/keyboard-safe-sheet.tsx` (new), `apps/native/components/vault/keyboard-safe-composer.tsx` (new), `apps/native/components/vault/index.ts` (barrel-exports added), `apps/native/app/_layout.tsx` (Android `setInputMode` configured, global `<KeyboardToolbar />` mounted with V3 theming, `GestureHandlerRootView` confirmed wrapping for DFL), 23 input surfaces migrated.
- Notes: New input surfaces should ALWAYS reach for one of the three wrappers, never raw `KeyboardAvoidingView`. The wrappers do NOT accept `automaticOffset` — that prop never existed in `react-native-keyboard-controller` and was removed from 14 files during migration. Stream Chat's internal composer may visually compete with the global `KeyboardToolbar`; treat as a Phase 2 follow-up if reports surface. A full `keyboardType` / `textContentType` / `returnKeyType` accessibility audit across all `TextInput`s is also a Phase 2 follow-up (improves autofill + native keyboard layouts).

## Decision: Photo upload grid uses DraggableFlatList with numColumns=3 (DFL Layer 1); polish via library migration deferred (Layer 2)
- Reason: The native upload flow needed two things from the photo grid: (1) dynamic capacity (start with a single `+` tile, grow as photos are added, no fixed 6-tile pretense) and (2) long-press drag-to-reorder so collectors can fix the COVER photo after selection. `react-native-draggable-flatlist@4.0.3` is already in our binary, supports `numColumns={3}` for the existing 3-column visual rhythm, and ships with `ScaleDecorator` for the lift animation. That's enough for "functional" reorder. **Visual polish (drop-target indicator + items-shuffle-out-of-the-way animation, both core HIG/Springboard patterns) is intentionally NOT in this iteration** — first attempt to add them via DFL's `renderPlaceholder` callback + `enableLayoutAnimationExperimental` flag + nested `<Animated.View layout={CurvedTransition}>` inside `ScaleDecorator` crashed the upload tab on open (nested Reanimated layout-animation managers + experimental flag + numColumns incompatibility). Recovery hotfix reverted to the functional-only configuration. The Layer 2 plan is to migrate to `react-native-reanimated-drag-list` (Fabric/new-arch ready, UI-thread Reanimated 4 worklets, `renderDropIndicator` and "items animate out of the way" both first-class with no experimental flags) in a separate, dev-client-tested feature-branch ship.
- Alternatives Considered: (A) DFL with full experimental polish — rejected, verified to crash; (B) Custom drag implementation in reanimated + gesture-handler — rejected, too much code for the value at this stage; (C) Stay on DFL functional-only + plan Layer 2 migration — selected; (D) Native Swift module wrapping `UICollectionView` drag-and-drop — rejected, requires custom dev client + binary rebuild, not OTA-eligible, very high cost.
- Status: **SUPERSEDED 2026-05-26** by "Decision: `PhotoReorderGrid` is the canonical multi-photo reorder primitive (built on `react-native-reanimated-dnd@^2.0.0`)" above. The upload-flow Scan step no longer uses DFL — it consumes `<PhotoReorderGrid />`. **DFL remains in `package.json`** because the legacy V1 memorabilia upload flow (`upload/memorabilia-core-form.tsx` → `upload/photo-grid.tsx`) still depends on it; migrating V1 to `PhotoReorderGrid` is a follow-up thread.
- Files Or Areas Affected: `apps/native/components/upload-entry.tsx` (DFL integration in ScanStep — gridData with `+` sentinel, renderGridItem with ScaleDecorator + brandVolt-inline isActive border + COVER badge on photo[0], handleReorderPhotos callback, haptic on dragBegin + placeholderIndexChange). **All of the above DELETED in the 2026-05-26 migration.**
- Notes: Original crash-forensics constraints (no `enableLayoutAnimationExperimental`, no nested `<Animated.View layout={...}>` inside `ScaleDecorator`) are now MOOT for the upload flow because DFL is no longer in the upload path. They REMAIN valid as cautions for the V1 memorabilia photo grid, which still uses DFL — captured in DO_NOT_BREAK under the legacy V1 section. The "active color must read from `useTheme().colors.brandVolt` inline" rule survives as a general V3 token-discipline rule (still tracked in the design system playbook).

## Decision: Migrate from Expo Go to EAS dev client, target v3.0.0
- Reason: Expo Go blocks native modules needed before launch: Sentry crash reporting, push notifications, react-native-keyboard-controller, and eventually RevenueCat. The existing MyVitrine v1.0.12 open beta has a 2.0.0 build already uploaded, so the V3 redesign targets v3.0.0 (build 1) to avoid ambiguity. iOS-first, Android parallel later.
- Alternatives Considered: Stay on Expo Go until feature-complete then build production directly (original plan per guardrails); intermediate dev-client phase was originally rejected but is now required because native deps are no longer deferrable.
- Status: Active.
- Files Or Areas Affected: `apps/native/app.json` (name → MyVitrine, slug → myvitrine, version → 3.0.0, bundleIdentifier → com.vitrine, package → com.vitrine.mobile, supportsTablet → false, splash bg → #020202), `apps/native/eas.json` (new — dev/preview/production profiles + submit config), `apps/native/package.json` (added expo-dev-client), `.cursor/rules/expo-release-guardrails.mdc` (removed Expo Go restrictions), `docs/ai-context/DO_NOT_BREAK.md`, `docs/ai-context/CURRENT_STATE.md`.
- Notes: Confirmed credentials: iOS bundle ID `com.vitrine`, Android package `com.vitrine.mobile`, Apple Team ID `3RFDYDWUUV`, Apple ID `john@myvitrine.app`, App Store ID `6451114604`. RevenueCat deferred to v3.1.0 per subscription architecture. The `expo-release-guardrails.mdc` rule has been updated to reflect EAS as the active dev environment.

## Decision: Remove onboarding quiz; set onboarding_completed_at during profile completion
- Reason: The onboarding quiz (usage intents, collectible type interests, marketplace personality) was designed to feed a personalized social feed home screen. That home screen was replaced by the profile-as-home architecture. The quiz data had zero consumers — `getUserPreferences` and `getOnboardingStatus` were never called outside of `user-preferences.ts`. The only downstream use of onboarding was `onboarding_completed_at IS NOT NULL` as a "real user" filter in RPCs (`suggest_collectors_for`, `search_collectors_tiered`, `getCollectorsToFollow`). Setting that timestamp at the end of profile completion preserves the filter while eliminating 3-4 screens of friction for new users.
- Alternatives Considered: Keep quiz but actually wire the data to surfaces; slim to one screen (type interests only); make quiz optional/skippable; keep as-is.
- Status: Active.
- Files Or Areas Affected: `app/complete-profile/index.tsx` (now sets `onboarding_completed_at`), `lib/contexts/auth-context.tsx` (removed onboarding gate + `markOnboardingComplete`), `lib/supabase.ts` + `lib/api/auth.ts` (removed `onboardingRequired` from `ProfileStatus`). Deleted: `app/onboarding/`, `components/onboarding.tsx`, `lib/api/user-preferences.ts`. Migration: `20260510000000_drop_onboarding_quiz_tables.sql` drops `user_usage_intents`, `user_marketplace_preferences`, `user_type_interests`.
- Notes: The `users.onboarding_completed_at` column is intentionally kept — it gates "real user" visibility in search/explore/suggested RPCs. If personalized discovery is needed later, collect preferences in-context (e.g., Market empty state) rather than a gated quiz at signup.

## Decision: Listing copy edits inline; schema atoms via rapid-fire
- Reason: Listing title and description are *narrative content* the collector authored or wants to author. Schema atoms (subject, year, set, traits, etc.) are *structured fields* extracted from images and best edited as a focused queue. Forcing both through the same rapid-fire modal blurred the distinction and made the title/description feel like just another field. Inline edit (always-on `TextInput` styled to look like display text + always-visible `Pencil` icon + focus chrome + char counter) communicates "this is your story, edit it where it lives." Schema atoms remain queue-based because batch-editing many short fields is faster than tapping each one.
- Alternatives Considered: Both via rapid-fire (original); both inline; modal-per-field for copy; only description inline.
- Status: Active.
- Files Or Areas Affected: `components/upload-entry.tsx` (`InlineEditableField` component, `listingEdits` state, `commitDraftCollectible` merge logic).
- Notes: `listingEdits` is intentionally a separate state slice from `fieldEdits`. Commit logic prefers `listingEdits.title || effectiveExtraction.listingTitle` and similar for description.

## Decision: Listing copy character caps grounded in production data (90 title / 420 description)
- Reason: Char caps were initially proposed at 120 / 600 (round-number guesses). Re-grounded to 90 / 420 after querying `john@myvitrine.app`'s 529 production collectibles via Supabase MCP — observed max title was 86, max description 418. The new caps give a 4-char buffer over the historical max, force concise writing without truncating any existing content, and protect downstream surfaces (cards, list rows) from runaway text. Capture screen's context input also moved to the same 90-char `LISTING_TITLE_MAX` constant for consistency (was 180).
- Alternatives Considered: 120/600 (original guess); 100/500; uncapped with overflow truncation in display layer; per-template caps.
- Status: Active.
- Files Or Areas Affected: `components/upload-entry.tsx` (`LISTING_TITLE_MAX = 90`, `LISTING_DESCRIPTION_MAX = 420`, applied to ScanStep context input + ReviewStep title/description fields).
- Notes: Caps will need re-evaluation if user roles ever support long-form storytelling (e.g., a "story" or "provenance notes" field separate from listing description).

## Decision: FramedHero extracted to shared component, used by both DetailsLens and upload Review
- Reason: The upload Review screen previously used a custom single-image identity card overlay, while CollectibleDetail DETAILS lens used an inline `FramedHero` carousel. The result: collectors saw a different photo treatment on Review than they'd see on the actual detail page after committing. Extracting `FramedHero` to a shared component (`components/detail/framed-hero.tsx`) and using it on both surfaces gives a 1:1 preview — collectors see the production presentation before they commit. Also adds a tap-to-zoom **lightbox** that benefits both surfaces simultaneously.
- Alternatives Considered: Path B — keep DetailsLens inline, copy the carousel JSX into upload-entry (duplication, drift risk). Path C — build a shrunken "preview" carousel for upload only (better than nothing, still inconsistent).
- Status: Active.
- Files Or Areas Affected: `components/detail/framed-hero.tsx` (new), `components/detail/lenses/details-lens.tsx` (imports shared, removed inline), `components/upload-entry.tsx` (Review step uses FramedHero).
- Notes: Lightbox is V1 — paginated swipe + counter + X-to-close, no pinch-to-zoom yet. The component accepts `enableLightbox={false}` for consumers that want to handle zoom themselves. **Critical**: changes here ship to both surfaces in lockstep.

## Decision: Theater animations unified on `Easing.inOut(Easing.quad)` for coordinated rhythm
- Reason: Three animations run concurrently in the Theater Looking Glass HUD over 30 seconds — progress ring fill, image opacity reveal (0 → 0.5), and sharp blur fade (0 → 1). They were originally on different easings: ring on `Easing.out(Easing.quad)` (front-loaded sprint), image + blur on `Easing.inOut(Easing.cubic)` (dramatic mid-burst). The result felt rushed and uncoordinated — ring sprinted, image lingered, eye couldn't lock onto a single rhythm. Unifying all three on `Easing.inOut(Easing.quad)` (gentler S-curve) makes the screen breathe — slow start (analyzing), gradual reveal (extracting), confident finish (almost done) — all moving together.
- Alternatives Considered: Different easings per element by design; `Easing.inOut(Easing.cubic)` everywhere (more dramatic, feels "engineered"); linear easing (mechanical); custom Bezier curves.
- Status: Active.
- Files Or Areas Affected: `components/upload-entry.tsx` (3 easing call sites in TheaterStep).
- Notes: The fix also tightened the `ANALYZING` text color in the ring from `textTertiary` (#5c5c5c, invisible against both backdrop and reveal image) to `textPrimary` (#f0f0f0). Visual hierarchy preserved by the 32pt% vs 10pt label gap.

## Decision: Light/Dark theme uses dual static token objects + ThemeProvider context
- Reason: A hybrid approach: two pre-built token objects (`DARK_COLORS`, `LIGHT_COLORS`) avoid runtime computation, while a React context (`ThemeProvider`) + `useTheme()` hook provides dynamic access. AsyncStorage persistence means preference survives sessions. Auto mode uses `useColorScheme()` (Appearance API). Default is Dark. This is simpler than CSS variables, more flexible than a single token set with conditional overrides, and mirrors patterns in production apps like Telegram and Discord.
- Alternatives Considered: CSS-variable-style dynamic tokens; single token set with theme key selectors; runtime computed styles; Reanimated-based animated theme transitions.
- Status: Active.
- Files Or Areas Affected: `lib/design/tokens.ts`, `lib/design/theme-context.tsx`, `lib/design/index.ts`, `app/_layout.tsx`.

## Decision: Theme toggle is a 3-state segmented control on settings header (not a sub-menu)
- Reason: The user wanted theme switching to be easily accessible, not buried in a settings sub-menu. A compact 3-state toggle (Sun/Moon/Smartphone icons) fits in the existing settings header row (far right, alongside back arrow and title) without adding a new screen or navigation step.
- Alternatives Considered: Dedicated "Appearance" sub-screen; toggle inside a general preferences section; system-only with no manual override.
- Status: Active.
- Files Or Areas Affected: `app/settings/index.tsx`.

## Decision: StatusPill and TraitPill are theme-immune (always dark-backed)
- Reason: These pills use semi-transparent colored fills (18-20% alpha) designed to composite on dark surfaces. On a white background, the fills become nearly invisible and the white text is illegible. Adding a solid `DARK_COLORS.sheetBg` base background makes them consistently dark-backed regardless of theme, preserving their "glass material" visual identity.
- Alternatives Considered: Redesigning pills with opaque fills per theme; using theme-aware colors with adjusted alphas; making all pills fully opaque.
- Status: Active.
- Files Or Areas Affected: `components/vault/status-pill.tsx`, `components/vault/trait-pill.tsx`.
- Notes: Exception: `StatusPill` accepts an `inverted` prop. When `inverted=true`, status is NFST, and resolved mode is light, the pill renders dark text on a light background for legibility on light detail screens.

## Decision: SpatialCard overlays pin to DARK_COLORS regardless of theme
- Reason: SpatialCard renders text, badges, and price labels over a dark image gradient. The gradient is always dark (it's the image's own gradient overlay). Using the theme's dynamic colors would make these elements invisible in light mode (dark text on dark gradient). Pinning to `DARK_COLORS` ensures consistent light-on-dark legibility.
- Alternatives Considered: Making the gradient theme-aware (complex, doesn't match image content); separate overlay component with forced dark context.
- Status: Active.
- Files Or Areas Affected: `components/vault/spatial-card.tsx`.

## Decision: Comps lens uses 75% threshold with Realtor-style fallback display
- Reason: The old "View more comps" button routed to a dedicated screen — over-engineered for a non-first-class feature. Instead, the comps lens now shows all strong matches inline (>= 75% match score, not `valueFallback`) and, when none exist, shows up to 6 fallback items with a "No direct matches — showing similar value range" header. This mirrors how Realtor.com handles zero-result searches: transparent about the shortfall, still showing useful content.
- Alternatives Considered: Routing to Market screen with pre-filtering; dedicated comps screen with expanded results; "Explore Similar" button linking to market; showing all comps uncapped.
- Status: Active.
- Files Or Areas Affected: `components/detail/lenses/comps-lens.tsx`, `app/collectible/[id]/comps.tsx` (deleted).

## Decision: Settings V3 Overhaul removes Tracking Settings and Collection Defaults
- Reason: Tracking Settings and Collection Defaults were legacy features that no longer align with V3 architecture. Tracking is managed entirely through the Tracking Hub. Collection defaults were never used in production. Removing them simplifies the settings surface and eliminates maintenance burden.
- Alternatives Considered: Keep but redesign; move to hidden "Advanced" section.
- Status: Active.
- Files Or Areas Affected: `app/settings/tracking/index.tsx` (deleted), `components/tracking-settings.tsx` (deleted), `app/settings/collection-defaults/index.tsx` (deleted), `components/settings-collection-defaults.tsx` (deleted).

## Decision: Delete Account uses type-username confirmation
- Reason: Account deletion is irreversible and destructive. A simple "Are you sure?" dialog is insufficient friction. Requiring the user to type their exact username (case-sensitive) provides strong confirmation intent while avoiding accidental deletions. This mirrors GitHub's repo deletion and Vercel's project deletion patterns.
- Alternatives Considered: Simple confirm dialog; email-based verification; cooldown period with undo.
- Status: Active.
- Files Or Areas Affected: `components/settings-account.tsx`, `supabase/functions/delete-account/index.ts`.

## Decision: Unified QR Code Modal with HolographicFrame treatment
- Reason: Three separate QR modal implementations (inline overlay in collector-profile, local QrModal in showcase-detail, shared QRCodeModal in components/shared/) had inconsistent styling, different feature sets, and didn't match the V3 design system. Unifying into a single shared component with the same HolographicFrame treatment used on Crown Jewel and Featured Showcase cards creates premium consistency and reduces maintenance surface.
- Alternatives Considered: Keep separate implementations with aligned styles; use HolographicFrame only on profile QR; add holo to each implementation independently.
- Status: Active.
- Files Or Areas Affected: `components/shared/qr-code-modal.tsx` (canonical), `components/collector-profile.tsx`, `components/showcase-detail-v3.tsx`, `components/collectible-detail-v3.tsx`, `components/trading-card-detail.tsx`, `app/(design-lab)/collectible-detail.tsx`.

## Decision: Brand color pivot from neon volt to warm ivory monochrome
- Reason: The neon volt (#CCFF00) competed with the collectibles themselves for visual attention. A monochrome palette (warm ivory #E8E0D4) lets collectibles own the color system while conveying permanence over energy — more appropriate for a collector app about preservation, provenance, and presentation. Token names (`brandVolt`, etc.) are deliberately kept for hot-swap capability.
- Alternatives Considered: Pure white; cool gray; keeping volt but reducing usage; removing brand accent entirely.
- Status: Active.
- Files Or Areas Affected: `lib/design/tokens.ts` (3-line change).
- Notes: The monochrome palette also makes Light/Dark toggle a genuine brand feature rather than just an accessibility option.

## Decision: Settings on DossierCard, QR Code + Share in action row
- Reason: Settings (gear) belongs in the identity zone of the DossierCard alongside Edit Profile — both are profile management actions. QR Code is a sharing action and belongs next to Share in the action row. This separation makes the owner's action hierarchy clearer: identity management (top) vs. distribution (middle). A redundant footer "SETTINGS" button provides a secondary entry point for discoverability.
- Alternatives Considered: Keep QR on DossierCard and Settings in action row (original); dedicate a lens to settings; floating settings FAB.
- Status: Active.
- Files Or Areas Affected: `components/collector-profile.tsx`.

## Decision: VitrineMarkIcon replaces UploadCollectibleIcon in BottomDock
- Reason: The Vitrine brand mark wasn't visible anywhere in the app chrome. The center upload button is the most prominent dock position and doesn't need a generic "scan" icon — it benefits from brand presence. The filled SVG mark reads well at 36px against the circular background.
- Alternatives Considered: Keep UploadCollectibleIcon; add logo to a splash/header elsewhere; use brand mark as a watermark.
- Status: Active.
- Files Or Areas Affected: `components/bottom-dock.tsx`, `components/vault/icons/vitrine-mark-icon.tsx`.

## Decision: Profile-as-home replaces the traditional home screen
- Reason: The home screen was the last V3 surface resisting a clear design. Every other surface found its identity quickly because each had a clear job. The home screen's job — "orient me and show me what matters right now" — was already covered by the profile hub (identity, collection, activity), tracking hub (intelligence), and market surface (discovery). A home screen for Vitrine would be a digest of surfaces that already exist. Collectors are identity-first people; the deepest psychological pull isn't "what's new in the world" — it's "let me see my stuff." The persistent difficulty designing the home screen was the design telling us it doesn't need to exist.
- Alternatives Considered: Traditional home screen with greeting, collection pulse, radar strip, discovery grid, and featured showcase (built and operational, but never felt essential); home screen as a "since you were last here" digest; no home screen with market as the landing tab.
- Status: Active.
- Files Or Areas Affected: `app/(tabs)/index.tsx` (now profile), `app/(tabs)/profile.tsx` (deleted), `components/home/*` (deleted), `hooks/use-home-data.ts` (deleted), `hooks/use-collection-affinity.ts` (deleted), `components/skeletons/home.tsx` (deleted), `components/bottom-dock.tsx`.

## Decision: Messages graduates from profile hub lens to dedicated tab
- Reason: The MESSAGE lens was always the odd one in the profile hub — the other lenses (PROFILE, COLLECTION, SHOWCASE, ACTIVITY, NETWORK) are all about the collector's identity. Messages is a communication tool. It was in the profile hub because there wasn't a better place, not because it belonged. A dedicated tab gives messages room to grow into a communications hub (DMs, eventually community/groups/deal rooms) and reduces the profile hub from 6 to 5 lenses (cleaner, less swipe distance).
- Alternatives Considered: Keep MESSAGE as a profile hub lens; move messages to a floating action button; combine messages with notifications.
- Status: Active.
- Files Or Areas Affected: `app/(tabs)/messages.tsx` (new), `components/collector-profile.tsx` (MESSAGE removed from lenses), `components/bottom-dock.tsx` (messages icon added).

## Decision: Activity signals through profile avatar badge, not standalone notification icon
- Reason: A notification dot on the user's avatar says "your world has updates" rather than "the system has alerts." For collectors, that's a more resonant signal. The profile IS the landing tab, so the user is usually already there. Push notifications can deep-link directly to `?lens=ACTIVITY`. The HUD overlay (which housed the notification bell) has been removed, and adding a dedicated notification tab would dilute the five-tab architecture.
- Alternatives Considered: Dedicated notification bell icon on the BottomDock; notification count badge on a separate tab; keeping the HUD overlay for notification access.
- Status: Active. Badge clears on navigating to ACTIVITY lens or on dismiss gesture (design TBD).
- Files Or Areas Affected: `components/bottom-dock.tsx` (BadgeDot on avatar), `components/hud-overlay.tsx` (deleted).

## Decision: HUD overlay removed entirely
- Reason: With profile as the landing tab, there's no "home screen" that needs a top navigation bar. The HUD's three functions (messages, notifications, menu) are redistributed: messages → dedicated tab, notifications → avatar badge dot, menu → deferred (settings access TBD). The logo doesn't need a persistent chrome position.
- Alternatives Considered: Keep HUD on specific screens; move HUD to a collapsible header on the profile surface; relocate individual HUD actions to the profile lens.
- Status: Active.
- Files Or Areas Affected: `components/hud-overlay.tsx` (deleted), `app/(tabs)/community.tsx`, `app/upload/bulk/index.tsx`, `app/upload/memorabilia/[type]/index.tsx`, `app/settings/index.tsx` (HUD imports removed).

## Decision: BottomDock tab order: Profile | Tracking | Upload | Market | Messages
- Reason: The Upload FAB stays center as the primary action. Profile (avatar) in first position is consistent with many apps putting "me" first and reinforces the profile-as-home paradigm. Messages in last position pairs communication with the right edge (opposite from identity on the left). Tracking and Market fill the middle slots.
- Alternatives Considered: Profile | Market | Upload | Tracking | Messages; Messages | Tracking | Upload | Market | Profile (Instagram-style with messages on the far left).
- Status: Active.
- Files Or Areas Affected: `components/bottom-dock.tsx`.

## Decision: Market Surface uses Instagram-style three-state architecture
- Reason: The legacy search/explore tab was a flat, underbuilt surface. Instagram's search UX (persistent search bar, mosaic grid, progressively revealed search) is a proven pattern for discovery surfaces. Three states (mosaic → drawer → results) give each concern its own full-screen real estate without tab/lens overhead. State transitions are driven by SearchBar focus/blur and query input, keeping the interaction model simple.
- Alternatives Considered: Two-lens "Market Hub V3" with Discover + Browse lenses (built first, rejected as over-engineered); single scrolling surface with inline search results; tab-based Collectibles | Showcases | Collectors split.
- Status: Active.
- Files Or Areas Affected: `components/market/market-surface.tsx`, `components/market/*`.

## Decision: Market search header uses inline Filter/Sort icons instead of Cancel button
- Reason: The SearchBar already has an "X" clear button, making a Cancel button redundant. Inline Filter (SlidersHorizontal) and Sort (ArrowUpDown) icons to the right of the SearchBar consolidate the toolbar into a single row, eliminating the awkward separate toolbar with filter/sort chips below the chip rail. Active states use brandVolt color with a badge for active filter count.
- Alternatives Considered: Cancel button with expand/collapse SearchBar; separate toolbar row below chip rail; filter/sort in a FAB.
- Status: Active.
- Files Or Areas Affected: `components/market/search-header.tsx`, `components/market/market-surface.tsx`.

## Decision: Market search uses tiered RPCs with priority-based matching
- Reason: Flat keyword search across all fields produces noisy results. Tiered search (priority 1: direct name/title match, priority 2: broader content match) surfaces the most relevant results first. For collectors, display name → username → collection content. For showcases, title → collectible content. Each tier is deduplicated so results don't repeat across priority levels.
- Alternatives Considered: Full-text search with `ts_rank`; client-side filtering of flat results; single `ILIKE` across all fields.
- Status: Active.
- Files Or Areas Affected: `supabase/migrations/20260505040000_market_search_rpcs.sql`, `lib/api/explore.ts`.

## Decision: Market filter uses listing_title ILIKE for Person/Character and Team/IP
- Reason: Indexing full AI metadata (person names, team names) for a filter dropdown would produce massive lists in a marketplace context. Free-text inputs that search `listing_title ILIKE '%term%'` are a clever shortcut — listing titles almost always contain the athlete/character name and team/franchise. This avoids metadata indexing while delivering the same user-facing result.
- Alternatives Considered: Dropdown of all unique person/team values from metadata; full-text search index on AI metadata; no person/team filtering.
- Status: Active.
- Files Or Areas Affected: `components/collectibles/market-search-filter-sheet.tsx`, `supabase/migrations/20260505030000_browse_market_v2.sql`.

## Decision: Market results use Promise.allSettled for graceful degradation
- Reason: The "All" view in search results fires three independent RPCs (collectibles, showcases, collectors) in parallel. Using `Promise.all` caused the entire results surface to blank when any single RPC failed (e.g., the `search_showcases_tiered` bug). `Promise.allSettled` allows each section to render independently — a failing showcase search doesn't hide working collectible and collector results.
- Alternatives Considered: Sequential RPC calls with early-exit on failure; `Promise.all` with per-call try/catch wrappers; single combined search RPC.
- Status: Active.
- Files Or Areas Affected: `components/market/search-results.tsx`.

## Decision: SearchBar extended with forwardRef and SearchBarHandle
- Reason: The market surface needs programmatic focus/blur control (e.g., blur on state transition, focus on drawer tap). The original approach used a transparent `Pressable` overlay to intercept taps, which blocked the underlying `TextInput` from receiving direct focus — causing a double-tap bug. Extending `SearchBar` with `forwardRef` and an imperative `SearchBarHandle` interface (`focus()`, `blur()`) solves this cleanly and makes the component reusable for any future surface needing programmatic search control.
- Alternatives Considered: Transparent overlay with `onPress` forwarding; wrapper component with internal `TextInput` ref; state-driven `autoFocus` prop.
- Status: Active.
- Files Or Areas Affected: `components/vault/search-bar.tsx`, `components/vault/index.ts`, `components/market/search-header.tsx`.

## Decision: Tracking Hub uses four-lens architecture with display-variant LensSelector
- Reason: The legacy tracking screen (summary card + flat list) lacked depth. The four-lens structure (OVERVIEW | TRACKED | ACTIVITY | COMPS) matches the hub pattern established by the profile and showcase surfaces while giving each tracking concern its own full-screen real estate. The `display` variant of LensSelector (oversized, brandVolt active) signals that this is a primary hub, not a sub-surface.
- Alternatives Considered: Two lenses (TRACKED | ACTIVITY); three lenses without COMPS; single scrolling surface with section headers; keeping the legacy flat list with enhanced header.
- Status: Active.
- Files Or Areas Affected: `components/tracking-hub.tsx`, `components/tracking-lenses/*`, `app/(tabs)/tracking.tsx`.

## Decision: Tracking OVERVIEW is a DossierCard-anchored intelligence surface
- Reason: The same DNA as the Profile lens and Showcase Detail INFO lens — DossierCard with watermark, MetricCardRow, DNA sections — creates a consistent "intelligence briefing" pattern across the app. The OVERVIEW is where the real upgrade happens vs. the legacy summary card.
- Alternatives Considered: Simple metric cards without DossierCard framing; dashboard-style grid of charts; minimalist "at a glance" strip.
- Status: Active.
- Files Or Areas Affected: `components/tracking-lenses/overview-lens.tsx`.

## Decision: Owner attribution on spatial cards only
- Reason: Tracked items come from other collectors, so attribution matters. But grid and list cards are dense surfaces where an extra avatar would create visual noise. Spatial cards have enough breathing room for a small owner avatar overlay in the bottom-right corner.
- Alternatives Considered: Attribution on all card types; no attribution (rely on detail screen); owner name text label instead of avatar.
- Status: Active.
- Files Or Areas Affected: `components/vault/spatial-card.tsx`, `components/collectibles/collection.ts`.

## Decision: Tracking activity filters Stream Feed for tracking-relevant verbs only
- Reason: Reusing the existing Stream Feed infrastructure avoids a second data pipeline. The tracking activity lens filters to `status_change`, `value_change`, `comp_alert`, and `tracking_alert` verbs via `getTrackingCategory()`. No journal entries — the tracking surface is about items you watch, not actions you took.
- Alternatives Considered: Dedicated tracking notifications table; real-time WebSocket channel; polling `collectible_change_log` directly.
- Status: Active.
- Files Or Areas Affected: `lib/design/activity-verbs.ts`, `components/tracking-lenses/tracking-activity-lens.tsx`.

## Decision: Blended comps RPC with two quality gates
- Reason: Without quality gates, sparse legacy items (e.g., a Rawlings glove with 0 meaningful fields but a subcategory) achieve trivial 100% match scores and flood the entire comps feed from a single source. Gate 1 (source quality floor: meaningful_field_count >= 2) excludes unenriched sources entirely. Gate 2 (match quality floor: matched_signals >= 3 AND score_fraction >= 0.5) ensures candidates are genuinely comparable. Together they distribute comps across multiple well-enriched tracked sources.
- Alternatives Considered: Artificial per-source cap (e.g., max 30% of results from one source); lower threshold with client-side deduplication; no threshold and accept noise.
- Status: Active. Tunable via three declared constants in the RPC body.
- Files Or Areas Affected: `supabase/migrations/20260505020000_create_tracked_comps_rpc.sql`, `lib/api/comps.ts`.
- Notes: Verified with real data — 30 comps distributed across 8 sources (vs. 30/30 from one source before gates). Constants: `v_min_source_fields=2`, `v_min_matched_signals=3`, `v_min_score_fraction=0.5`.

## Decision: Tracking Hub removes HUD overlay and uses SafeAreaView edges=['top']
- Reason: The HUD overlay (logo, messages, notifications bar) collided with the LensSelector on the tracking tab. Since the tracking hub has its own LensSelector as primary navigation, the HUD is redundant and was removed. SafeAreaView with edges=['top'] provides proper status bar avoidance, matching the profile hub pattern.
- Alternatives Considered: Keeping HUD with adjusted z-index; hiding HUD on scroll; absolute positioning LensSelector below HUD.
- Status: Active.
- Files Or Areas Affected: `app/(tabs)/tracking.tsx`, `components/tracking-hub.tsx`.

## Decision: Showcase Detail mirrors the Collector Profile two-lens architecture
- Reason: Users have already learned the Profile / Collection lens model on the user-profile screen. Reusing the same `LensSelector` + `LensPager` shape on showcase detail leverages that mental model and keeps the FlatList chrome shared. Two surfaces (`INFO | COLLECTION`) cleanly separate the identity-zone "dossier cover" from the data surface.
- Alternatives Considered: Single long scrolling page with the dossier on top and the collection below; a 3-tab structure (Info / Items / Activity); only redesigning the items grid and keeping the legacy header.
- Status: Active in production at `app/showcase/[id]/index.tsx`.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx`, `app/showcase/[id]/index.tsx`, `components/vault/lens-pager.tsx`, `components/vault/lens-selector.tsx`, `components/collectibles/collection-surface.tsx`.

## Decision: INFO lens is one bracketed Dossier card, scrollable, not single-viewport-locked
- Reason: A single-viewport mandate forced compression that hurt the Showcase DNA section (Asset Matrix, Status Breakdown, Trait Mix). User explicitly chose quality over forced compression — ~1.5 viewports of scroll is acceptable. The dossier card uses `<DossierCard watermark="DOSSIER">` so the surface has a recognizable identity-zone DNA matching the user profile's profile lens.
- Alternatives Considered: Strict single-viewport with collapsed metric/DNA tiles; sticky dossier header with the DNA section as a separate scroll region.
- Status: Active.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx` (INFO lens), `components/vault/dossier-card.tsx`.

## Decision: Showcase title lives inside the Dossier card, not above the lens selector ("Choice B")
- Reason: Entering a showcase is a deliberate user action — the title doesn't need to be the topmost atomic chrome. Placing it inside the dossier keeps the floating top nav clean and lets the title participate in the dossier's identity-zone composition (with brackets, watermark, and metric row). The compact title in the floating nav appears on scroll for context recovery.
- Alternatives Considered: Choice A — large title above the lens selector at the top of the screen; sticky title-bar that morphs with scroll.
- Status: Active.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx`.

## Decision: Showcase descriptions are not surfaced in V3 UI
- Reason: Production verification via Supabase MCP confirmed `0 of 690` showcases use the `description` column. The legacy edit screen exposes a description field but it has zero adoption. Adding a description block to the V3 Dossier card would optimize for an unused affordance and dilute the dossier's identity-zone density.
- Alternatives Considered: Render description below the title when present; collapse a "More" disclosure that reveals it.
- Status: Active. The DB column persists for backward compatibility but the UI no longer surfaces or accepts a description.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx`, `lib/api/showcases.ts`.

## Decision: Action pair on Dossier card is QR · SHARE for owners and MESSAGE · SHARE for visitors
- Reason: Mirrors the user profile's owner/visitor button DNA so users learn one pattern across both surfaces. SHARE is universal (uses `SHARE_URLS.showcase(id)`). Showcase tracking ("track this showcase") was rejected because product currently only tracks individual collectibles — adding it just on this surface would be inconsistent.
- Alternatives Considered: TRACK · SHARE for visitors; FOLLOW (owner) · SHARE for visitors; single-button SHARE only.
- Status: Active.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx`.

## Decision: Featured showcases wrap the entire Dossier card in HolographicFrame
- Reason: Featured Showcase already uses holo chrome on the user profile's Featured Showcase card. Carrying that visual language onto the showcase detail's dossier card reinforces the "this is the user's featured showcase" semantic in-place. Wrapping the full card (rather than just the title) keeps the holo as identity-zone chrome rather than a label decoration.
- Alternatives Considered: FEATURED pill only with no holo; holo on title text only; holo on the 3-up collage only.
- Status: Active. Uses `<HolographicFrame intensity="standard">`.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx`, `components/vault/holographic-frame.tsx`.

## Decision: Trait Mix uses per-trait horizontal bars, not a barcode-spectrum like Asset Matrix
- Reason: Three distinct DNA visualizations (Asset Matrix barcode-spectrum / Status Breakdown grid / Trait Mix per-trait bars) keep the eye moving and signal that each block reads a different dimension of the showcase. Reusing the barcode-spectrum for Trait Mix would have made the section feel like one repeated chart.
- Alternatives Considered: Reuse `AssetMatrixCard` shape for traits; 2-up grid like Status Breakdown; pie/donut.
- Status: Active.
- Files Or Areas Affected: `components/vault/trait-mix-card.tsx`, `components/showcase-detail-v3.tsx`.

## Decision: COLLECTION lens v1 default sort is `recent`; curated sort + drag-to-reorder is v2
- Reason: Matches the user-profile collection's default sort, so the COLLECTION lens behaves identically wherever it appears. A "curated" sort and drag-to-reorder for owners is the right long-term experience for a showcase but requires a `position` column on `showcase_items`, write-path support, and a sort handle on each card primitive — too much surface area for v1.
- Alternatives Considered: Default to curated/manual order with no sort UI; default to `recent` and hide other sort options for non-owners.
- Status: Active for v1. Curated + drag-to-reorder tracked in OPEN_THREADS.
- Files Or Areas Affected: `components/showcase-detail-v3.tsx`, `components/collectibles/collection-surface.tsx`.

## Decision: Lift CollectionSurface and shared collection types into `components/collectibles/`
- Reason: ShowcaseDetailV3 needs the same FlatList chrome (toolbar, type pills, filter/sort sheets, virtualized grid/spatial/list rendering, refresh control, crown-jewel framing) as the profile's collection lens. Inlining a second copy would have invited drift; keeping it inside `collector-profile.tsx` would have invited circular imports. A neutral `components/collectibles/` module avoids both.
- Alternatives Considered: Keep CollectionSurface inside `collector-profile.tsx` and import from there; build a thinner per-screen list and accept duplication.
- Status: Active.
- Files Or Areas Affected: `components/collectibles/collection.ts`, `components/collectibles/collection-surface.tsx`, `components/collectibles/index.ts`, `components/collector-profile.tsx`, `components/showcase-detail-v3.tsx`.
- Notes: `components/collectibles/collection.ts` owns the `CollectionItem` type, sort keys/options, status copy, mappers (`mapToCollectionItem`, `resolveCrownJewel`, `normalizeTraitKey`, `toCardData`), formatters (`formatPrice`, `formatFilterLabel`), and filter/sort derivation helpers. `MetricCardRow` exports `metricValueTextStyle` rather than a static-property — TS-friendly named export.

## Decision: getShowcaseById returns CollectionItem-shaped items + numeric total value
- Reason: To render the COLLECTION lens with the same `CollectionSurface` as the profile, the showcase API has to emit rows in the same shape (`traits`, `classification`, `aiMetadata`, `traitMetadata`, `collectible_type`, numeric value, track counts). Doing this in the API rather than mapping client-side keeps the boundary clean and avoids duplicate normalization logic.
- Alternatives Considered: Map `ShowcaseDetailCollectible[]` → `CollectionItem[]` inside `ShowcaseDetailV3` (forces every consumer to repeat the mapping); fetch the showcase and then re-fetch each collectible with a separate query (N+1).
- Status: Active.
- Files Or Areas Affected: `lib/api/showcases.ts`, `lib/api/index.ts`.
- Notes: `ShowcaseDetail.items: ShowcaseDetailItem[]` is the new canonical surface. `stats.totalValueNumeric: number` is a parallel numeric field next to the existing display string. `ShowcaseDetail.collectibles: ShowcaseDetailCollectible[]` is preserved only for the messaging vitrine-attachment preview — drop when that surface migrates. Track counts are batched via a single `getTrackCounts` call rather than per-row.

## Decision: Owner ⋯ menu uses cross-platform ActionSheet; delete uses native Alert.alert
- Reason: Native ActionSheet is the iOS HIG-correct surface for a bound list of options on a row/icon-button trigger; it shouldn't be replaced with a custom modal on the platform that has it. Android has no native equivalent so a V3-styled bottom sheet stands in. Delete is destructive — the user explicitly chose to use the native confirmation `Alert.alert` because it's the platform-canonical destructive confirmation pattern, with no V3-styled alternative warranted.
- Alternatives Considered: A custom V3 modal everywhere (loses iOS native feel); inline destructive button with no confirmation; long-press to confirm delete.
- Status: Active.
- Files Or Areas Affected: `components/vault/action-sheet.tsx`, `components/showcase-detail-v3.tsx`.

## Decision: "Straight production route" — overwrite legacy showcase view in one chunk
- Reason: There was no consumer of `components/showcase-view.tsx` outside the `app/showcase/[id]/index.tsx` route, and the V3 surface fully covers the legacy behavior. Keeping both alive would have invited drift and confused future agents. Deleting `showcase-view.tsx` and `showcase-dna.tsx` in the same chunk as the route swap forces every regression to be fixed forward inside the V3 surface.
- Alternatives Considered: Soft-launch under a new route, leave legacy in place, feature-flag, dual-write.
- Status: Active.
- Files Or Areas Affected: `app/showcase/[id]/index.tsx`, `components/showcase-view.tsx` (deleted), `components/showcase-dna.tsx` (deleted).

## Decision: Expo Go remains the development target until production EAS/TestFlight
- Reason: Existing release guardrails explicitly avoid dev-client/prebuild unless a concrete feature requires it.
- Alternatives Considered: Dev client or custom native build during development.
- Status: **SUPERSEDED 2026-05-13** by "Decision: Migrate from Expo Go to EAS dev client, target v3.0.0" — the native deps that drove the move (Sentry, push notifications, react-native-keyboard-controller, expo-updates for OTA) are no longer deferrable. Keep this entry for historical context only.
- Files Or Areas Affected: `app.json`, `package.json`, `.cursor/rules/expo-release-guardrails.mdc`.

## Decision: V3 UI uses `lib/design` and `components/vault`
- Reason: Prevent visual drift and allow iterative extraction from proven screen patterns.
- Alternatives Considered: Per-screen hardcoded styles or legacy `lib/colors.ts`.
- Status: Active.
- Files Or Areas Affected: `lib/design/*`, `components/vault/*`, `app/(design-lab)/design-system.tsx`.

## Decision: Collector profile uses top-level lenses
- Reason: Profile, Collection, and Showcase surfaces need independent visual/function space.
- Alternatives Considered: Single long scrolling profile with embedded collection/showcase tabs.
- Status: In progress in design-lab sandbox.
- Files Or Areas Affected: `app/(design-lab)/collector-profile.tsx`.

## Decision: Collection grid/list/spatial cards should reuse vault card patterns
- Reason: Existing V3 detail/design-system card patterns render strongly and reduce duplication.
- Alternatives Considered: Screen-local card implementations.
- Status: Active direction.
- Files Or Areas Affected: `components/vault/*`, `app/(design-lab)/collector-profile.tsx`.

## Decision: Thinktank is advisory, project memory is canonical
- Reason: Prevent stale global memory from overriding the current repo.
- Alternatives Considered: Treating Thinktank as a global source of truth.
- Status: Active.
- Files Or Areas Affected: `docs/ai-context/*`, `AGENTS.md`.

## Decision: Profile collection surfaces must prioritize perceived speed
- Reason: A sub-600 item profile felt too sluggish when rendering full arrays in scroll views.
- Alternatives Considered: Waiting for server-side filtering/facets before optimizing the sandbox.
- Status: Active direction.
- Files Or Areas Affected: `app/(design-lab)/collector-profile.tsx`.
- Notes: Current sandbox uses virtualized collection lists, short-burst in-memory cache, pull-to-refresh, and memoized derivations. Long-term direction remains summary-first payloads, lightweight paginated card rows, server-side facets/filter/sort, and cache-by-query.

## Decision: Vitrine filter is a first-class collector feature
- Reason: Filters should use both obvious fields and AI-enriched collector semantics, not just generic ecommerce chips.
- Alternatives Considered: Basic Type/Status/Sort-only utility filtering.
- Status: Active in V3 profile sandbox.
- Files Or Areas Affected: `app/(design-lab)/collector-profile.tsx`, future API/RPC facets.
- Notes: V1 groups are Status, Traits, Types, Value Range, People/Athletes, Teams/Franchise/IP. Current implementation derives options from loaded collection rows and AI metadata; future production shape should move to server-side facets.

## Decision: Crown Jewel is one per collector with manual override plus fallback
- Reason: The profile should always have a meaningful Crown Jewel, while allowing user control later from collectible detail.
- Alternatives Considered: Manual-only Crown Jewel assignment.
- Status: Active direction.
- Files Or Areas Affected: `users.crown_jewel_collectible_id`, `lib/api/auth.ts`, `app/(design-lab)/collector-profile.tsx`.
- Notes: Manual `users.crown_jewel_collectible_id` wins. Fallback is highest value, then most tracked, then newest. Public UI does not need to label auto vs manual.

## Decision: Featured semantic chrome uses one reusable holographic frame
- Reason: Crown Jewel and Featured Showcase should share a subtle, learnable "owner-featured" visual language without forking card layouts.
- Alternatives Considered: Separate bespoke holo designs per card type.
- Status: Active in sandbox.
- Files Or Areas Affected: `components/vault/holographic-frame.tsx`, `app/(design-lab)/collector-profile.tsx`.
- Notes: `HolographicFrame` is a chrome wrapper, not a card variant. Use `standard` intensity for hero/profile Crown Jewel, `subtle` for dense card surfaces. Apply selectively, not to all cards.

## Decision: Upload flow uses a seeded-prototype pipeline
- Reason: Wiring the engine end-to-end before review/finalize UX was solid risked building the wrong downstream screens. Using a real DB collectible as the theater's "AI output" lets the whole flow render real data shapes while the engine integration stays mocked.
- Alternatives Considered: Fully mocked JSON extraction; full Edge Function integration first.
- Status: Active until engine wiring replaces the seed.
- Files Or Areas Affected: `components/upload-entry.tsx` (SEED constant, theater useEffect).
- Notes: Seed is collectible id `3c89a535-f972-4a66-8d5d-3cf9dd509ec8` (Luis Robert signed ball). Downstream review/finalize rendering exactly matches the collectible detail `SpecsLens`. Keep the seed fresh when the schema or authentication shape evolves.

## Decision: Review uses a queue-to-edit pattern for schema corrections
- Reason: The review screen has 20-30+ extracted fields but most uploads only need 1-5 corrections. Inline edit chrome on every row clutters the scan experience; a single giant edit form loses the correction context. Tap-to-flag keeps review a reading surface, then rapid-fire walks the flagged items in a focused modal.
- Alternatives Considered: Inline edit chrome on every row; single consolidated edit form; drill-into-detail per row.
- Status: Active.
- Files Or Areas Affected: `components/upload-entry.tsx`, `components/vault/schema-row.tsx` (added `queued`/`edited` props), `components/vault/rapid-fire-edit.tsx`, `components/vault/field-editor.tsx`.
- Notes: Queue uses namespaced ids (`ai:Year`, `trait:signer_name`). Dock label flips to `Make Edits (N) ✏️` when queue is non-empty. Edited rows run a one-shot 900ms volt pulse on return to review — no persistent "edited" badge. No mid-flow queue edits in v1; rapid-fire is a committed linear walk.

## Decision: ActionDock is the canonical sticky-CTA primitive
- Reason: Every multi-step flow needs a committing CTA pinned to the bottom edge. Reinventing per-screen was causing inconsistent safe-area handling, keyboard behavior, and visual DNA.
- Alternatives Considered: Per-screen `Button` placement with local safe-area math; bottom-docked `Button` variant.
- Status: Active.
- Files Or Areas Affected: `components/vault/action-dock.tsx`, `components/upload-entry.tsx` (review + finalize docks).
- Notes: Visual DNA mirrors `BottomDock`: `sheetBg` surface, `frostBorder` top hairline, volt shadow glow, blur backdrop, `brandVolt` label. Absolute-positioned so it stays flush to the screen edge regardless of nested flex. Static `ActionDock.reservedHeight(bottomInset)` helper computes the scroll padding parents should add. Rapid-fire uses the same visual DNA but inline (not absolute) so `KeyboardAvoidingView` can lift it above the keyboard.

## Decision: InputDialog replaces Alert.prompt across V3 surfaces
- Reason: `Alert.prompt` is iOS-only and themed against the system UI rather than the app canvas. Every single-input confirmation in V3 should live in a cross-platform, V3-styled modal.
- Alternatives Considered: Wrapping `Alert.prompt` behind a Platform check with a custom Android path.
- Status: Active.
- Files Or Areas Affected: `components/vault/input-dialog.tsx`, `components/upload-entry.tsx` (tag-add, showcase-create).
- Notes: Auto-focus, submit-on-return, disabled submit when blank, supports `autoCapitalize` / `maxLength` / `initialValue`. Parent retains control over the transformed value (trim, lowercase, de-dupe).

## Decision: Multi-select showcases use a bottom-sheet picker, not chips
- Reason: A collectible can belong to multiple showcases. Chip segmented controls imply single-select, cap at 3-4 showcases before overflow, and offer no affordance for creating a new showcase inline.
- Alternatives Considered: Horizontal scrolling chip rail; inline checkbox list in finalize; dedicated settings route.
- Status: Active.
- Files Or Areas Affected: `components/vault/showcase-selector-sheet.tsx`, `components/upload-entry.tsx` (finalize showcase row).
- Notes: Finalize shows a tappable summary row with a comma-joined, truncated list of selected names (or muted `None`). Deselection only via re-opening the picker — keeps the parent surface text-only. Inline create uses `InputDialog`; unpersisted showcases get `local-${ts}` ids and prepend the list. Real user showcases loaded via `getUserShowcases(user.id)` with silent failure (picker still works via local entries).

## Decision: Listing value >0 is required when status != NFST
- Reason: For-sale / for-trade / sale+trade listings must have a real asking price before going live. Catalog-only (NFST) entries can live without one.
- Alternatives Considered: Non-empty check only; no gating at all; modal confirmation if missing.
- Status: Active.
- Files Or Areas Affected: `components/upload-entry.tsx` (finalize step).
- Notes: `valueRequired = status !== 'NFST'`. `valueMissing = valueRequired && !(parseFloat(value) > 0)` — `0`, `0.00`, blank, and non-numeric all fail. When missing: `REQUIRED` kicker tints `semanticRed`, `$` glyph tints red, placeholder tints red, dock goes disabled with `Set a Value First` label. Default value after extraction is `'0.00'` so the user consciously sets an asking price rather than inheriting a sample from the seed.

## Decision: Activity Surface replaces Notifications with expanded trigger set
- Reason: "Activity" is more expressive than "Notifications." The expanded trigger set surfaces self-actions (YOU listed, YOU edited status/value, YOU created showcase) alongside social signals and comp alerts, making the lens useful for both owner journaling and social awareness.
- Alternatives Considered: Keeping the "Notifications" framing with a narrow push-only trigger set.
- Status: Active.
- Files Or Areas Affected: `lib/api/activity.ts`, `components/activity/*`, `components/collector-profile.tsx`.
- Notes: Chip filters are ALL | INBOX | SIGNALS | JOURNAL. Comp alerts use >75% threshold with max 5 rows/day. `YOU edited metadata` was explicitly dropped from Journal — only status and value edits qualify.

## Decision: Profile Hub is five lenses in fixed order
- Reason: PROFILE | COLLECTION | SHOWCASE | ACTIVITY | NETWORK gives each surface its own full-screen real estate. MESSAGE was removed from the hub when it graduated to a dedicated tab — it was always the odd one out since the other lenses are all about collector identity.
- Alternatives Considered: Six lenses (including MESSAGE); four lenses with Network folded into Profile.
- Status: Active (updated from six to five).
- Files Or Areas Affected: `components/collector-profile.tsx`.

## Decision: Network Surface uses a 5-signal weighted suggested-collectors algorithm
- Reason: Simple follower/following lists are table stakes. A "suggested" tab that surfaces affinity-based collector recommendations drives discovery and engagement.
- Alternatives Considered: Random suggestions; follow-of-follows only; no suggestions.
- Status: Active.
- Files Or Areas Affected: `suggest_collectors_for` RPC, `suggested_collectors_cache` table, `components/network/*`.
- Notes: Signals: inventory affinity 25%, comp overlap 30%, tracking overlap 20%, network proximity 15%, authority 10%. Computed on-demand, cached 24-48hrs. Cache busted on follow/unfollow and pull-to-refresh.

## Decision: Binary public/private toggle for follower/following visibility
- Reason: Overcomplicated granular privacy settings (friends-only, mutual-only) add UX friction with minimal value. Users either don't mind public visibility or prefer full privacy.
- Alternatives Considered: Three-tier visibility (public/mutual/private); per-list separate controls.
- Status: Active.
- Files Or Areas Affected: `notification_preferences` table, settings UI.

## Decision: Create Showcase uses lens-based CURATED | MANAGED architecture
- Reason: Mirrors the two-lens pattern used elsewhere (showcase detail, profile hub). Each lens owns only the selection problem for that mode (pick items vs. define rules). Metadata (title, description, visibility) lives on a shared review screen.
- Alternatives Considered: 3-step wizard (Name → Select → Visibility); single screen with mode toggle.
- Status: Active.
- Files Or Areas Affected: `components/create-showcase.tsx`, `components/showcase-review.tsx`.
- Notes: Mutual exclusion: CURATED is locked when MANAGED has rules, and vice versa. Swipe gestures wired through `LensPager`. Both lenses route to the same review screen.

## Decision: Managed Showcase adopts Shopify smart-collection mental model
- Reason: Shopify's flat rule grammar (single ALL/ANY match mode, flat condition list, no manual overrides) is proven, simple to build, and simple to explain. Users who understand Shopify smart collections will recognize the pattern immediately.
- Alternatives Considered: Complex nested rule trees; hybrid manual+auto overlay; metadata-first wizard.
- Status: Active.
- Files Or Areas Affected: `lib/api/managed-rules.ts`, `supabase/functions/_shared/managed-eval.ts`, `components/managed-rule-builder.tsx`.
- Notes: 6 fields, 8 operators, `ALL`/`ANY` match mode. Fields: `collectible_type`, `listing_title`, `value`, `status`, `traits`, `tags`. `category`/`subcategory`/`classification` explicitly dropped due to polymorphic inconsistency across schema modes — `listing_title contains` serves as proxy.

## Decision: Managed showcase uses hybrid evaluation: immediate + cron sweep
- Reason: Users expect to see membership results immediately after saving rules (blocking on first eval). But collections change independently of rule saves, so a cron sweep catches drifted membership. The incremental sweep (every 5min, watermark-filtered) keeps most runs cheap; the nightly full sweep corrects any accumulated drift.
- Alternatives Considered: Immediate-only (misses collection changes); cron-only (user waits for first results); real-time trigger on every collectible insert/update.
- Status: Active.
- Files Or Areas Affected: `supabase/functions/managed-evaluate/`, `supabase/functions/managed-sweep-worker/`, `supabase/migrations/20260505010000_schedule_managed_workers.sql`.

## Decision: Tags are free-form chip input for managed showcase rules
- Reason: Users who tag their collectibles know the tags they use. Restricting to a dropdown of existing tags would prevent pre-building rules for tags not yet present. Case-insensitive and normalized whitespace matching handles input variation.
- Alternatives Considered: Dropdown restricted to existing user tags; controlled vocabulary.
- Status: Active.
- Files Or Areas Affected: `components/managed-rule-builder.tsx` (TagInput component), `lib/api/managed-rules.ts`.

## Decision: Managed showcase V2 grammar adds filter_traits fields, excludes subject
- Reason: The `filter_traits` JSONB column provides normalized, consistent data for `franchise`, `item_type`, `year`, and `maker`. These are added as rule fields with appropriate operators (is_one_of/is_none_of for string fields, eq/gte/lte/between for year). `subject` was explicitly excluded because: (1) users would typically combine subject rules with AND logic which conflicts with multi-value array matching; (2) the existing `listing_title contains` rule already serves subject-based filtering and works for items without `filter_traits`; (3) subject matching is "fuzzy" by nature (Kobe vs Kobe Bryant) and exact-match operators feel wrong.
- Alternatives Considered: Including `subject` with `is_one_of` operator; including `subject` with custom "contains any" semantics; adding all filter_traits fields including subject.
- Status: Active.
- Files Or Areas Affected: `lib/api/managed-rules.ts`, `supabase/functions/_shared/managed-eval.ts`, `components/managed-rule-builder.tsx`, `supabase/functions/managed-evaluate/index.ts`, `supabase/functions/managed-sweep-worker/index.ts`.

## Decision: Only four canonical traits available for managed showcase rules
- Reason: `is_rookie`, `is_autographed`, `is_game_used`, `is_graded` are the four traits surfaced by `TRAIT_CONFIG`. Deeper AI-enriched traits from `trait_metadata` are too granular and inconsistent for rule-based matching in V1.
- Alternatives Considered: All trait_metadata keys; user-selectable custom traits.
- Status: Active.
- Files Or Areas Affected: `lib/api/managed-rules.ts`, `components/managed-rule-builder.tsx`.

## Decision: Empty managed showcases visible only to owner
- Reason: A managed showcase with zero matches is useful to the owner (shows the rules are live, just no matches yet), but confusing/useless to visitors. Hiding from visitors prevents empty-shelf UX while keeping the owner informed.
- Alternatives Considered: Hide from everyone; show to everyone with empty state.
- Status: Active.
- Files Or Areas Affected: `lib/api/showcases.ts` (`getUserShowcases`, `getShowcaseById`).
