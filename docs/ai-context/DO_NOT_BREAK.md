# Do Not Break

Last updated: 2026-05-08
Last verified: 2026-05-10

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
- Expo Go development flow.
- AI Upload flow V3 (Scan → Theater → Review → Finalize → Success) including the queue-to-edit review pattern and the rapid-fire edit modal.
- Create Showcase V3 (CURATED multi-select + MANAGED rule builder → shared review → create).
- Theme switching (Light/Dark/Auto) — preference persists across sessions via AsyncStorage.
- Settings V3 — theme toggle, account management, sign out, delete account.

## Critical Technical Constraints
- Keep Expo Go compatibility unless John explicitly approves otherwise.
- Use `stream-chat-expo`, not `stream-chat-react-native`.
- Use `EXPO_PUBLIC_*` env vars; do not hardcode backend keys or URLs.
- Treat Supabase migrations, RLS, and Edge Functions as high-risk.
- Do not add production MCP write access or credentials.
- Managed showcase rule evaluator in `lib/api/managed-rules.ts` and `supabase/functions/_shared/managed-eval.ts` must stay in lockstep. Never change one without the other.

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
- `components/detail/framed-hero.tsx` — shared photo carousel + lightbox. Used by `components/detail/lenses/details-lens.tsx` AND `components/upload-entry.tsx`. Breaking the prop interface (`images`, `enableLightbox`) cascades to both. Visual changes ship to upload Review and CollectibleDetail in lockstep — that's the point.
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
- `app/_layout.tsx` — wraps the app with `ThemeProvider`. Do not remove or reorder the provider wrapper.
- `components/create-showcase.tsx` — mutual exclusion logic between CURATED and MANAGED modes.
- `components/managed-rule-builder.tsx` — rule builder UI with live preview. Depends on `previewRuleMatches` and `managed-rules.ts` types.
- `components/showcase-detail-v3.tsx` — two-lens showcase detail with managed badge and owner actions.

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
