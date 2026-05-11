# Trading Card / CardHedge Deprecation Plan

**Status:** Frontend routing patched (Apr 27, 2026). Backend, tables, and dead UI still scheduled for removal.

## Context

The original architecture had two separate upload flows and two separate data shapes:

- **Memorabilia** → single `collectibles` row with free-form fields
- **Trading Cards** → `collectibles` row + `trading_card_details` + `card_catalog` (joined to CardHedge API data), with dynamic / margin / manual pricing modes

We've now shipped an AI enrichment pipeline (`ai_metadata`, `trait_metadata`, `field_schema`, `classification`, `collectible_type`, `confidence`, `listing_title`, `listing_description`, `traits`, `autograph_assessment`, `verification_url`, `schema_mode`) that handles any category of collectible — trading cards, memorabilia, vinyl, sneakers, whatever the model produces — out of a single upload flow and a single table. The dual-table architecture is obsolete, and the CardHedge dependency is being retired.

**`collectible_type` is now descriptive, not structural.** It drives presentation copy (subheading, icon, future category-specific polish). It does **not** drive routing or data-shape decisions.

## What's already done (Apr 27, 2026)

- `app/collectible/[id]/index.tsx` no longer forks on `collectible_type`. Every collectible renders through `CollectibleDetail` (Vault V2). This fixes the "Collectible not found" error that appeared whenever the AI classified a memorabilia-flow upload as a trading card.
- Confirmed the 3 existing `collectible_type = 'trading_card'` rows are already in the `collectibles` table with full AI enrichment and photos. No data migration needed — they now render correctly in Vault V2.
- Confirmed `trading_card_details` and `card_catalog` are completely empty (0 rows). `trading_card_price_history` also empty. No user data at risk from the cleanup below.

## What's still live and needs removal

### 1. Frontend — trading-card upload wizard

Everything below is dead the moment we remove the entry from `components/upload-entry.tsx` (the Memorabilia / Trading Cards chooser):

| File | Purpose |
| --- | --- |
| `app/upload-trading-cards.tsx` | 4-step wizard route (search → grade → details → success) |
| `components/upload-entry.tsx` | **Edit** — remove the "Trading Cards" chooser card; collapse into a single "Upload" entry |
| `components/trading-card-search.tsx` | CardHedge search UI |
| `components/trading-card-grade-select.tsx` | Grade picker |
| `components/trading-card-details-form.tsx` | Pricing + visibility form |
| `components/trading-card-success.tsx` | Post-submit confirmation screen |

### 2. Frontend — trading-card detail UI (now orphaned)

No longer referenced by any route after the Apr 27 routing change, but still present on disk:

| File | Purpose |
| --- | --- |
| `components/trading-card-detail.tsx` | Old detail screen (pre-Vault V2) |
| `components/detail/trading-card-facts.tsx` | Card facts card |
| `components/detail/trading-card-facts-sheet.tsx` | Facts bottom sheet |
| `components/detail/trading-card-pricing-card.tsx` | Dynamic / margin / manual pricing display |
| `components/detail/edit-pricing-modal.tsx` | Owner-only pricing edit modal |
| `components/pricing-mode-selector.tsx` | Shared pricing mode picker |

### 3. Frontend — API client

| File | Notes |
| --- | --- |
| `lib/api/trading-cards.ts` | Entire file. Exports: `searchCards`, `getCardDetails`, `getGradePrice`, `getCardCategories`, `createTradingCard`, `getTradingCard`, `updateTradingCardPricing`, `listTradingCards`, `deleteTradingCard`, `calculateEffectivePrice`, `formatPrice`, `getPricingModeLabel`, `PricingMode`, `TradingCard`, `CardSearchResult`, `GradeInfo`, `CardDetails`, etc. |
| `lib/api/index.ts` | Remove the `createTradingCard` re-export |

Before deleting, grep the codebase for each symbol — some (like `formatPrice`) may be used elsewhere and should be inlined or moved to a shared helper.

### 4. Backend — edge functions

Delete from Supabase:

| Slug | Status | Notes |
| --- | --- | --- |
| `trading-cards` | ACTIVE (v13) | Actions: search, details, create, get, list, update-pricing, delete |
| `card-hedge-proxy` | ACTIVE (v8) | Proxies searches/details/pricing to CardHedge |
| `price-sync` | ACTIVE (v6) | **Verify first** — likely a scheduled CardHedge pricing refresher for `card_catalog`. If so, delete. If it does anything else, keep and strip the CardHedge pieces. |

Removal command (per function):
```bash
supabase functions delete trading-cards --project-ref <ref>
```

### 5. Backend — database

All tables are empty. Verified `2026-04-27`.

```sql
-- Preflight: confirm still empty
SELECT COUNT(*) FROM trading_card_details;      -- expect 0
SELECT COUNT(*) FROM card_catalog;              -- expect 0
SELECT COUNT(*) FROM trading_card_price_history;-- expect 0
```

Migration (to apply when ready — do **not** run yet):

```sql
-- Drop PL/pgSQL functions first (they reference the tables)
DROP FUNCTION IF EXISTS public.create_trading_card(...);
DROP FUNCTION IF EXISTS public.update_trading_card_pricing(...);
DROP FUNCTION IF EXISTS public.update_trading_card_effective_price(...);

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.trading_card_price_history;
DROP TABLE IF EXISTS public.trading_card_details;
DROP TABLE IF EXISTS public.card_catalog;
```

Full signatures can be pulled from `information_schema.routines` at deletion time; they'll want explicit parameter lists for the `DROP FUNCTION` calls.

### 6. Environment / secrets

- Remove `CARD_HEDGE_API_KEY` from Supabase edge function secrets and from any `.env`/CI secret stores.
- Remove `CARD_HEDGE_BASE_URL` references if they live in config.

### 7. Ancillary cleanup

- `trading-cards-edge-function-brief.md` — retire or move to `docs/archive/`. It's an implementation brief for the flow we're deprecating.
- `WIRING_CHECKLIST.md` — remove the "Trading Cards upload" bullets.
- Any nav / tab / filter that says "Trading Cards" can become (a) a client-side `collectible_type === 'trading_card'` filter on the unified collection, or (b) removed outright if redundant with category filters.
- `components/upload-entry.tsx` will go from a two-option chooser to a single "Upload" CTA. Likely can be removed entirely and replaced with a direct route to the memorabilia upload flow (which is now just "upload").

## Known references to audit at cleanup time

Any file in this list either imports a trading-card symbol or references the string literal. Review each to confirm it's removable vs. needs a local rewrite:

- `components/community/category-filter.tsx`
- `components/community/group-list-item.tsx`
- `components/community/group-discover-card.tsx`
- `components/community/new-this-week.tsx`
- `components/community/for-you-section.tsx`
- `hooks/use-collection-affinity.ts`
- `components/profile/profile-grid-card.tsx`
- `components/groups/fallback-types.tsx`
- `lib/mock-messaging.ts`
- `lib/category-identity.ts`
- `components/collector-profile.tsx`
- `components/detail/identity-strip.tsx` *(uses `collectible_type` as a descriptive kicker — keep)*

## Execution checklist (for a future pass)

- [ ] Remove the Trading Cards option from `components/upload-entry.tsx` and simplify or delete the chooser
- [ ] Delete `app/upload-trading-cards.tsx` and its 4 wizard components
- [ ] Delete orphaned detail UI (`trading-card-detail.tsx`, `trading-card-facts.tsx`, `trading-card-facts-sheet.tsx`, `trading-card-pricing-card.tsx`, `edit-pricing-modal.tsx`, `pricing-mode-selector.tsx`)
- [ ] Delete `lib/api/trading-cards.ts`; remove `createTradingCard` from `lib/api/index.ts`; relocate any shared helpers still in use
- [ ] Sweep remaining references from the audit list above
- [ ] Delete `trading-cards` edge function from Supabase
- [ ] Delete `card-hedge-proxy` edge function from Supabase
- [ ] Verify and delete/strip `price-sync` edge function
- [ ] Remove `CARD_HEDGE_API_KEY` secret
- [ ] Apply migration dropping `trading_card_details`, `card_catalog`, `trading_card_price_history`, and the 3 PL/pgSQL functions
- [ ] Delete `trading-cards-edge-function-brief.md` (or archive)
- [ ] Update `WIRING_CHECKLIST.md`
- [ ] Regenerate TypeScript types (`generate_typescript_types` MCP tool) and commit the diff

## Rollback

The Apr 27 frontend routing change is a one-file, additive simplification — revert `app/collectible/[id]/index.tsx` to restore the old branching. The trading-card edge function and tables are untouched, so nothing else needs rolling back until we actually start deleting things in the execution checklist.
