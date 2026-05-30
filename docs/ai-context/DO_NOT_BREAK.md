# Do Not Break

Last updated: 2026-05-27
Last verified: 2026-05-27

## Critical User Flows
- Auth via Supabase email/phone OTP.
- Public user row creation/linking after auth.
- Collectible creation, display, and AI-enriched metadata display.
- Showcase creation/editing/display (both manual and managed types).
- Managed showcase rule evaluation (client-side preview, immediate eval, cron sweep).
- Profile viewing across all five lenses (Profile, Collection, Showcase, Activity, Network). Profile hub IS the landing surface.
- Messages tab — dedicated tab at `/(tabs)/messages`, wraps `MessageInboxBody`.
- Following, messaging, and sharing.
- Activity feed and notification delivery. Activity badge dot on profile avatar in BottomDock.
- Network surface and suggested collectors.
- Market Surface search & discovery (mosaic browse, recent searches, tiered search results).
- EAS dev client development flow (Expo Go retired 2026-05-13).
- Push notification registration and delivery — token acquired via expo-notifications, registered with Stream Chat (provider `MyVitrineiOS`), persisted to Supabase `user_push_tokens`. Notification tap handler routes to correct screens.
- Photo library selection via native `PHPickerViewController` (`ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection, selectionLimit, orderedSelection: true })`). **Updated 2026-05-24 (evening)** — the prior custom-picker prohibition has been retired; see DECISION_LOG "Native `PHPickerViewController` via `launchImageLibraryAsync` is the photo library picker". The hang issue that originally drove the custom picker has not recurred and is now in monitoring status. `orderedSelection: true` is required because the upload grid relies on selection order.
- AI Upload flow V3 (Scan → Theater → Review → Finalize → Assembly → Success) including the queue-to-edit review pattern and the rapid-fire edit modal.
- Create Showcase V3 (CURATED multi-select + MANAGED rule builder → shared review → create).
- Theme switching (Light/Dark/Auto) — preference persists across sessions via AsyncStorage.
- Settings V3 — theme toggle, account management, sign out, delete account.

## Critical Technical Constraints
- Test changes in EAS dev client; native dep additions require `eas build --profile development` rebuild. Expo Go is no longer the development target.
- Use `stream-chat-expo`, not `stream-chat-react-native`.
- Use `EXPO_PUBLIC_*` env vars; do not hardcode backend keys or URLs.
- Treat Supabase migrations, RLS, and Edge Functions as high-risk.
- Do not add production MCP write access or credentials.
- Managed showcase rule evaluator in `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` must stay in lockstep. Never change one without the other.
- **`published_at IS NOT NULL` is the visibility gate for all public collectible queries.** Never NULL this column on a complete collectible — it hides the item from all surfaces (collection, market, search, comps, showcases, tracking). All new public-facing queries MUST include this filter.
- **After any DDL change (new table, column, or function) applied via MCP or migration, always run `NOTIFY pgrst, 'reload schema'`** or PostgREST will serve stale schema and REST API calls to the new entity will silently fail.
- **The `complete_and_publish` trigger on `collectibles` is load-bearing.** AFTER UPDATE trigger that fires when `extraction_status` transitions to `'extracted'`. It atomically (a) flips `extraction_status` from `'extracted'` to `'complete'` and (b) sets `published_at = now()` — unconditionally for single-lane uploads (`batch_id IS NULL`), conditionally on `batch_uploads.auto_publish` for batch-lane uploads. It does NOT touch `extraction_completed_at` (no such column exists) and does NOT insert showcase rows. Do not disable or modify without understanding the full cascade.
- **Keyboard handling uses the three vault wrappers, NOT raw `KeyboardAvoidingView`.** All new input surfaces MUST use `KeyboardSafeScroll` (forms/scrollable lists), `KeyboardSafeSheet` (modals/sheets), or `KeyboardSafeComposer` (sticky composer bars) from `@/components/vault`. The wrappers own offset / behavior / keyboard-toolbar contracts; consumers don't reinvent. The non-existent `automaticOffset` prop has been removed from 23 surfaces — don't re-introduce it.
- **`PhotoReorderGrid` is the canonical multi-photo reorder primitive.** Any new surface that lets the user reorder multiple images (Batch Lane Review tab, future edit-existing-collectible-photos UI, multi-image bug-report attachments) MUST consume `<PhotoReorderGrid />` from `@/components/vault` — NEVER reach for `react-native-reanimated-dnd` (or any other drag library) directly. The primitive owns the lift visual (inner glow + brandVolt border, no shadow), the live COVER badge re-anchoring, the remove-X disable during drag, the haptic wiring, and the 220ms long-press threshold. Breaking the prop interface (`photos`, `onReorder`, `onRemove`, `onAddMore`, `maxPhotos`, `columns`, `aspectRatio`, `gap`, `showCoverBadge`, `disabled`) cascades to every consumer. Migrations to a different underlying drag library, future Reanimated bumps, or aesthetic tweaks all happen INSIDE the primitive — never at the call site.
- **Cross-platform consistency first.** When a UI/UX decision has multiple valid implementations, prefer the one that renders identically on iOS AND Android over platform-branched alternatives. Concrete application: drop shadows / `elevation` are PROHIBITED in any new "elevated"/"lifted"/"selected" visual — use inner-glow overlays + animated borders (the `PhotoReorderGrid` pattern). See the "Cross-platform consistency first" entry in DECISION_LOG for the full rationale and the design-system playbook for the codified rule.
- **Variant generation runs in Assembly for the V3 upload flow — not at Identify.** Do NOT re-add `generateVariantsBackground` (or any `generateVariants*` call) in `handleAnalyze` / the Identify path. That was the device-load contention path decoupled in 2026-05-27. `uploadWithVariants` inline paths (avatar, legacy collectibles, trading-cards) are intentionally unchanged.
- **`LensPager` page 0 must not claim rightward horizontal drags.** On index `0`, use asymmetric `activeOffsetX([-12, LARGE])` so stack edge-back wins in the content band. Collectible detail V3 has **no back chevron** in the lens strip by design — do not "fix" navigation by adding one without explicit product approval. Reverting to symmetric `[-12, 12]` on page 0 regresses the swipe-back bug in the middle of DETAILS. Pages 1..N stay bidirectional.
- **Theater cosmetic constants are load-bearing:** `THEATER_COSMETIC_MS = 25_000`, `THEATER_PROGRESS_CAP = 0.85`, linear easing, ring gated on `extractionJobId`. Do not raise the cap to 0.97 during wait — it reads as stuck. Poll success path must still sprint progress to 100%.
- **Reanimated 4.2+ and Worklets 0.7+ are now the floor** as of 2026-05-26 (current resolved: 4.3.1 and 0.8.x). Required by `react-native-reanimated-dnd@^2.0.0` (the SortableGrid components landed in 2.0.0; v1.x has no grid support). This is OFF Expo SDK 54's `~4.1.1` pin — `expo doctor` will warn but the upgrade resolves cleanly. Do NOT downgrade either module without first reverting `PhotoReorderGrid` to the v1.1.0 API (which would require hand-rolling grid math).
- **DFL legacy constraint — V1 memorabilia upload flow only.** `react-native-draggable-flatlist@4.0.3` is still in `package.json` because `components/upload/memorabilia-core-form.tsx` → `components/upload/photo-grid.tsx` (the legacy V1 memorabilia route at `/upload/memorabilia/[type]/[category]`) still consumes it. For THAT file only: (1) do NOT enable DFL's `enableLayoutAnimationExperimental` flag with `numColumns` (crash-verified May 24); (2) do NOT wrap `<ScaleDecorator>` children in another `<Animated.View layout={...}>` (crash-verified); (3) theme-aware colors must read from `useTheme()` inline, not from static `StyleSheet.create()` (no `#C8FA38` hardcodes — `brandVolt` is now `#E8E0D4` dark / `#7A7168` light). When V1 memorabilia is migrated to `PhotoReorderGrid` (see OPEN_THREADS), DFL can leave `package.json` and these constraints become moot.

## Files Requiring Extra Caution
- `lib/supabase.ts`
- `lib/api/auth.ts`
- `lib/contexts/auth-context.tsx`
- `lib/api/collectibles.ts`
- `lib/api/showcases.ts` — discriminated create (manual|managed), visitor visibility filtering, Edge Function invocation.
- `lib/api/managed-rules.ts` — canonical rule evaluator. Any operator/field semantic change must also update `supabase/functions/_shared/managed-eval.ts`.
- `supabase/functions/_shared/managed-eval.ts` — Deno mirror of the rule evaluator. Must match `managed-rules.ts` exactly.
- `supabase/migrations/*`
- `supabase/functions/*`
- `app.json`
- `package.json`
- `components/vault/*` — barrel-exported reusable V3 primitives.
- `lib/design/*` — V3 tokens, status config, trait config, **theme context**.
- `lib/design/theme-context.tsx` — ThemeProvider + useTheme hook. All V3 components depend on this. Breaking the `ThemeContextValue` interface will break ~100 consumers.
- `lib/design/tokens.ts` — `DARK_COLORS`, `LIGHT_COLORS`, and `ThemeColors` type. The interface must stay in sync between both objects.
- `components/upload-entry.tsx` — holds the full upload-flow state machine. Changes can break review, finalize, rapid-fire, or extraction overlay simultaneously. Listing title/description editing flows through `listingEdits` state (NOT `fieldEdits`); commit logic merges both. Char caps `LISTING_TITLE_MAX = 90` / `LISTING_DESCRIPTION_MAX = 420` are grounded in production data — don't loosen without checking real-world usage.
- `components/detail/framed-hero.tsx` — shared photo carousel + lightbox. Used by `components/detail/lenses/details-lens.tsx` AND `components/upload-entry.tsx` (Review uses `displaySize="full"` until Assembly builds variants). Breaking the prop interface (`images`, `enableLightbox`, `displaySize`) cascades to both. Visual changes ship to upload Review and CollectibleDetail in lockstep — that's the point.
- `components/vault/schema-row.tsx` — consumed by collectible detail page, design lab, and upload review. Interactive-chrome opt-in must stay opt-in.
- `components/vault/status-pill.tsx` — theme-immune with `inverted` prop exception. The DARK_COLORS base + inverted logic is critical for legibility across both themes.
- `components/vault/trait-pill.tsx` — theme-immune with DARK_COLORS base.
- `components/collectibles/collection-surface.tsx` — shared FlatList used by profile, showcase detail, create showcase, share picker, and tracking. Breaking changes cascade to five+ consumers.
- `components/market/market-surface.tsx` — three-state market orchestrator. Owns filter/sort state and state machine transitions for mosaic/drawer/results.
- `components/vault/search-bar.tsx` — extended with `forwardRef` and `SearchBarHandle`. Market surface and potentially other future surfaces depend on the ref API. Do not remove `forwardRef` or change the `SearchBarHandle` interface without updating all consumers.
- `components/shared/qr-code-modal.tsx` — unified QR modal with HolographicFrame. Used by 5 consumers (profile, showcase detail, collectible detail, trading card detail, design-lab collectible). Breaking the prop interface cascades everywhere.
- `components/collector-profile.tsx` — five-lens profile hub and app landing surface. Lens ordering and URL param deep linking are load-bearing.
- `components/bottom-dock.tsx` — BottomDock with profile avatar badge (activity), messages icon badge (unread), and theme-aware styling. Tab order, badge logic, and theme adaptation are load-bearing.
- `app/(tabs)/index.tsx` — this IS the profile tab / landing surface. Do not replace with a different screen without understanding the profile-as-home architecture.
- `app/_layout.tsx` — wraps the app with `ThemeProvider`, `Sentry.wrap`, `PushProvider`, and `NotificationTapHandler`. Provider ordering is load-bearing. Do not remove or reorder.
- `lib/push.ts` — push token management with backoff, Stream named provider registration, Supabase persistence. The lazy `require('expo-notifications')` pattern avoids Metro crashes.
- `lib/contexts/push-context.tsx` — push lifecycle. Module-level `_hasAttemptedAutoRegister` flag survives hot reloads.
- `components/photo-library-picker.tsx` — **DELETED 2026-05-24 (evening)** in commit `5e72933`. Recoverable from `git show 5e72933^:apps/native/components/photo-library-picker.tsx` if the native PHPicker hang regression recurs. See DECISION_LOG for full rollback path.
- `components/vault/keyboard-safe-scroll.tsx`, `keyboard-safe-sheet.tsx`, `keyboard-safe-composer.tsx` — canonical keyboard wrappers built on `react-native-keyboard-controller`. Used by 23 input surfaces. Breaking their prop interfaces cascades across the entire app's input behavior.
- `components/vault/photo-reorder-grid.tsx` — canonical multi-photo reorder primitive (built on `react-native-reanimated-dnd@^2.0.0`). Currently used by `upload-entry.tsx` (ScanStep). Future consumers will include Upload Lane Chunk B (Batch Lane Review tab), the eventual edit-existing-collectible-photos surface, and possibly multi-image bug-report attachments. Breaking the prop interface (`photos`, `onReorder`, `onRemove`, `onAddMore`, `maxPhotos`, `columns`, `aspectRatio`, `gap`, `showCoverBadge`, `disabled`) cascades to every consumer. Aesthetic spec (lift scale 1.12, inner-glow + brandVolt border, no shadow, live COVER, remove-X disable, 220ms long-press) is locked INSIDE this file — don't reproduce it at call sites.
- `components/create-showcase.tsx` — mutual exclusion logic between CURATED and MANAGED modes.
- `components/managed-rule-builder.tsx` — rule builder UI with live preview. Depends on `previewRuleMatches` and `managed-rules.ts` types.
- `components/showcase-detail-v3.tsx` — two-lens showcase detail with managed badge and owner actions.
- `components/vault/lens-pager.tsx` — swipeable lens bodies; page-0 gesture contract is load-bearing for collectible detail edge-back. Partners with `lens-selector.tsx` at parents — keep `index` / `onIndexChange` in sync.

## Known Fragile Areas
- Legacy data migration quality for collectibles.
- AI-enriched schema fields may vary by old vs new uploads.
- V3 design system extraction and gallery sync.
- EAS/TestFlight configuration not fully audited for submission readiness.
- Edge Function deployment state — new functions may not be deployed yet.
- `pg_cron` job scheduling depends on Vault secrets (`cron_secret`, `project_url`).
- Market RPCs (`browse_market_v2`, `search_collectors_tiered`, `search_showcases_tiered`) use `SECURITY INVOKER` and depend on `GRANT SELECT` permissions from migration `20260505050000`. Revoking those grants will break the entire market tab.
- `collectibles_last_changed_at` trigger drives managed showcase incremental sweep — disabling or altering the trigger breaks automatic showcase updates.

## Security Boundaries
- Do not reveal secrets if discovered.
- Do not commit `.env` or credentials.
- Do not configure production write MCPs.
- Do not casually change auth, RLS, or user identity linking.
- Edge Function `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` must stay in Vault secrets, never in code.

## Product Boundaries
- Do not treat design-lab sandbox work as final production UX without explicit approval.
- Do not add speculative components to the design system; extract proven patterns.
- Do not backport V3 visual DNA into legacy screens unless explicitly part of a redesign.
- Do not modify managed showcase rule semantics without updating both evaluator copies.
- Do not remove the `collectibles_last_changed_at` trigger — it's the managed showcase watermark signal.
- Do not theme legacy screens (those importing `@/lib/colors`) — they're slated for deletion after a safety audit.
- Do not remove the `COLORS` backward-compat alias from `tokens.ts` — module-level constants in config files depend on it.
- Do not change the `ThemeColors` interface without updating both `DARK_COLORS` and `LIGHT_COLORS` objects simultaneously.
