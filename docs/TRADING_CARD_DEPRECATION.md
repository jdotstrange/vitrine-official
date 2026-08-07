# Trading Card / CardHedge Deprecation Plan

**Status: Completed — superseded by `fix/code-db-purge` (2026-08-06).** See `docs/ai-context/CODE_HYGIENE.md` for the full purge record.

## Summary

The dual-table Card Hedge architecture (`trading_card_details`, `card_catalog`, upload wizard, pricing modes) is removed. All collectibles — including 263 rows with `collectible_type = 'trading_card'` — live in unified `collectibles` with AI enrichment and render through Vault V3 (`collectible-detail-v3`).

`collectible_type` remains a **descriptive label** only (category copy, icons, filters). It does not drive routing or schema.

## What was removed

| Layer | Items |
| --- | --- |
| Native UI | `upload-trading-cards`, `trading-card-*` components, `pricing-mode-selector`, `edit-pricing-modal`, trading-card detail cards/sheets |
| API | `lib/api/trading-cards.ts`, `lib/api/client.ts` |
| Edge (remote) | `trading-cards`, `card-hedge-proxy`, `price-sync` (+ test edges per hygiene doc) |
| Database | `card_catalog`, `trading_card_details`, `trading_card_price_history`; RPCs `create_trading_card`, `update_trading_card_pricing`, `refresh_effective_prices_for_catalog`, `update_trading_card_effective_price` |
| View | `collectibles_unified` no longer joins Card Hedge tables |

## What was kept

- `collectible_type === 'trading_card'` label handling in `category-identity`, `identity-strip`, `managed-rule-builder`, `CollectibleType`
- `formatPrice` in `components/collectibles/collection.ts`
- Unified upload flow (`upload-entry.tsx`) and `collectible-detail-v3`

## Migration

Applied: `supabase/migrations/20260806200000_drop_card_hedge_schema.sql`

Preflight at purge time: `trading_card_details=0`, `card_catalog=2` (orphan catalog rows), `trading_card_price_history=0`, `collectibles` with `trading_card` type `=263` (unchanged).

## Rollback

Not recommended. Frontend Card Hedge UI and edge functions are deleted. DB rollback would require restoring tables, RPCs, and the old `collectibles_unified` view from git history.
