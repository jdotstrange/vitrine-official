# Code Hygiene

Last updated: 2026-08-27

## Purpose

Ongoing cleanup discipline so we do not accumulate dead dual-architecture paths again. Every purge pass should shrink the surface area testers and agents must reason about.

## Principles (ponytail-ish)

1. **Delete before harden.** Dead code without nav or callers gets removed, not feature-flagged or RLS-wrapped.
2. **One upload architecture.** AI enrichment + unified `collectibles` row is canonical. No parallel type-specific upload wizards or join tables for presentation labels.
3. **Dead UI without nav = delete.** If nothing routes to a screen and it is not a design-lab sandbox, it goes.
4. **Edge functions without callers = delete or lock.** Test harnesses and vendor proxies (`card-hedge-proxy`, `test-push`) do not stay deployed on production projects.
5. **Empty / unused legacy tables = drop, not RLS.** If a table has no product path, drop it in a migration instead of layering policies. (`user_category_interests` dropped 2026-08-27.)
6. **Document deferrals with rebuild notes.** Native modules (fonts, media-library) that need `runtimeVersion` bumps stay out of JS-only purge PRs — note them here and in `OPEN_THREADS.md`.

## This purge (branch `fix/code-db-purge`, 2026-08-06)

### Wave 0A — verified orphans deleted

- Legacy root components: `live-ticker`, `discovery-feed`, `showcase-orb`, `spatial-card` (root; vault `SpatialCard` kept), `nav-menu`, `vitrine-boot-sequence`, `edit-info-modal`
- `components/profile/**` (superseded by `profile-lenses`)
- Unused vault icon `upload-collectible-icon`
- `underline-tabs`, `pill-tabs` (hub-only)
- Mock data: `mock-collectibles`, `mock-notifications`, `mock-showcase-collectibles`, `mock-messaging`
- Legacy tracking stack: `components/tracking.tsx`, `app/tracking/**` (tabs `TrackingHub` is canonical)
- Placeholder routes: `app/upload/bulk`, `app/upload/collectible/edit`, `app/profile/me`, `app/settings/export`, `app/settings/help`
- Stale doc `apps/native/ai-upload-flow-v2.md`
- `lib/api/trading-cards.ts`, `lib/api/client.ts` (ApiException re-exported from `auth.ts`)

### Wave 0B — community hub cut (group threads kept)

**Removed:** `app/(tabs)/community`, `community-hub`, hub-only `components/community/*` discovery widgets, `use-discover-join`, community hub skeletons.

**Kept:** `community/[id]/**`, `community/new`, `conversation-thread`, `group-feed`, `group-post-card`, `post-composer`, `post-reply-thread`, `group-info*`, `create-group`, `groups/**`, `mock-communities`, `skeletons/group-page`.

**Nav fix:** `create-group` success → open created group at `/community/{id}` (not stale `/community/demo-group`).

### Card Hedge removed

- Upload wizard + detail UI + `pricing-mode-selector` + edge function `trading-cards` (local source + **remote deleted** 2026-08-06)
- DB migration `20260806200000_drop_card_hedge_schema.sql`: `collectibles_unified` without Card Hedge joins; dropped `card_catalog`, `trading_card_details`, `trading_card_price_history`, and related RPCs
- **`collectible_type === 'trading_card'` kept** as descriptive label (263 rows) in `category-identity`, `identity-strip`, `managed-rule-builder`, `CollectibleType`
- **`formatPrice`** canonical in `components/collectibles/collection.ts`

### Test / vendor edges — remote deleted 2026-08-06

`trading-cards`, `card-hedge-proxy`, `price-sync`, `test-push`, `stream-test-notify`, `test-seed-notifications` — confirmed absent via `list_edge_functions`. Optional: remove `CARD_HEDGE_API_KEY` from project secrets.

### Deferred (rebuild / out of scope)

| Item | Why deferred |
| --- | --- |
| `expo-media-library` / native fonts | Requires dev-client rebuild + `runtimeVersion` bump |
| `migrate-images` edge function | Still has callers; founder defer |
| `generate-variants` edge function | Still has callers; founder defer |
| `messaging.ts`, Stream paths | Live product surface |

## Checklist for future PRs

Before merging feature work, ask:

- [ ] Does this add a **second** way to do something we already do (upload, pricing, detail)?
- [ ] Grep for imports — if a new file has **zero** importers after the PR, delete it in the same PR.
- [ ] If removing a tab or route, grep `router.push`, `href`, and `Tabs.Screen` for stale paths.
- [ ] Strip deleted paths from `apps/native/.eslintrc.js` `LEGACY_COLOR_CONSUMERS` when files go away.
- [ ] Edge function added? Document caller or delete before merge.
- [ ] Schema table with 0 rows and 0 product path? Prefer `DROP TABLE` migration over RLS hardening.
- [ ] Native dep with config plugin? Note rebuild requirement in PR description; do not ship as OTA-only.
- [ ] Update this file + `OPEN_THREADS.md` when a purge wave lands.
