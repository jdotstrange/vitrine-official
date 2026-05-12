/**
 * Collectible primitives shared across native and web.
 *
 * Two enums lock the contract between client and server:
 *   - `ListingStatus`  — derived from (available_for_sale, available_for_trade)
 *                        in deriveStatus(). Drives every commerce surface.
 *   - `CollectibleType` — categorical kind of physical item. Memorabilia is
 *                         the V1 surface; trading_card is being deprecated
 *                         per docs/TRADING_CARD_DEPRECATION.md.
 *
 * Both shapes are reused by managed-showcase rules (status, collectible_type
 * fields) so they MUST stay synchronized with the rule grammar in
 * `@vitrine/types/managed-rules`.
 */

export type ListingStatus = 'NFST' | 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE';

export type CollectibleType = 'memorabilia' | 'trading_card';
