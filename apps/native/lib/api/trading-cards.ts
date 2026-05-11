/**
 * Trading Cards API Client
 * Handles all trading card operations via Supabase Edge Functions
 */

import { getAuthToken } from './config';

// Supabase Edge Functions URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// =============================================================================
// TYPES
// =============================================================================

export interface CardSearchResult {
  cardHedgeId: string;
  cardName: string;
  playerName?: string;
  year?: number;
  setName?: string;
  cardNumber?: string;
  variant?: string;
  cardHedgeCategory?: string;
  categoryGroup: string;
  categoryCode: string;
  isRookie?: boolean;
  imageUrl?: string;
  grades?: GradeInfo[];
}

export interface GradeInfo {
  grade: string;
  gradingCompany: string;
  apiPrice: number | null;
  apiPriceAvailable: boolean;
  sales7day?: number;
  sales30day?: number;
  gain7day?: number;
  gain30day?: number;
}

export interface CardDetails {
  cardHedgeId: string;
  cardName: string;
  playerName?: string;
  setName?: string;
  grades: GradeInfo[];
}

export type PricingMode = 'dynamic' | 'dynamic_margin' | 'manual';

export type TradingCardListingStatus = 'NFST' | 'FOR_SALE' | 'FOR_TRADE' | 'SELL_TRADE';

export interface CreateTradingCardRequest {
  // Card catalog data
  cardHedgeId: string;
  cardName: string;
  playerName?: string;
  year?: number;
  setName?: string;
  cardNumber?: string;
  variant?: string;
  grade: string;
  gradingCompany?: string;
  cardHedgeCategory?: string;
  categoryGroup?: string;
  categoryCode?: string;
  isRookie?: boolean;
  imageUrl?: string;
  apiPrice?: number;
  apiPriceAvailable?: boolean;
  cardHedgeMetadata?: Record<string, unknown>;

  // User collectible data
  photos: string[];
  pricingMode: PricingMode;
  marginPercentage?: number;
  manualPrice?: number;
  visibility?: string;
  // Either pass `status` (preferred, matches form output) OR the two booleans directly.
  status?: TradingCardListingStatus;
  availableForSale?: boolean;
  availableForTrade?: boolean;
  tags?: string[];
  showcaseId?: string;
  certificateNumber?: string;
}

export interface TradingCard {
  id: string;
  collectible_type: 'trading_card';
  user_id: string;
  title: string;
  photos: string[];
  category: string;
  subcategory?: string;
  visibility: string;
  available_for_sale: boolean;
  available_for_trade: boolean;
  tags: string[];
  value: number;
  created_at: string;
  updated_at: string;
  trading_card_details: {
    id: string;
    pricing_mode: PricingMode;
    margin_percentage?: number;
    manual_price?: number;
    effective_price: number;
    certificate_number?: string;
    card_catalog: {
      id: string;
      card_hedge_id: string;
      card_name: string;
      player_name?: string;
      year?: number;
      set_name?: string;
      card_number?: string;
      variant?: string;
      grade: string;
      grading_company?: string;
      card_hedge_category?: string;
      category_group?: string;
      category_code?: string;
      is_rookie?: boolean;
      image_url?: string;
      api_price?: number;
      api_price_available: boolean;
      api_price_updated_at?: string;
      sales_7day?: number;
      sales_30day?: number;
      gain_7day?: number;
      gain_30day?: number;
    };
  };
}

// =============================================================================
// API HELPERS
// =============================================================================

async function callEdgeFunction(
  functionName: string,
  action: string,
  body?: Record<string, unknown>,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<any> {
  const token = await getAuthToken();
  
  const url = `${SUPABASE_URL}/functions/v1/${functionName}?action=${action}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }
  
  return data;
}

// =============================================================================
// CARD HEDGE PROXY API
// =============================================================================

/**
 * Search for cards in Card Hedge
 */
export async function searchCards(params: {
  query?: string;
  category?: string;
  sortBy?: 'gain_7_days' | 'gain_30_days' | 'sales_7_days' | 'sales_30_days' | 'price';
  limit?: number;
}): Promise<{ cards: CardSearchResult[]; total: number }> {
  const response = await callEdgeFunction('card-hedge-proxy', 'search', params);
  return { cards: response.cards || [], total: response.total || 0 };
}

/**
 * Get card details with all available grades and pricing
 */
export async function getCardDetails(cardHedgeId: string): Promise<CardDetails> {
  const response = await callEdgeFunction('card-hedge-proxy', 'card-details', { cardHedgeId });
  return response;
}

/**
 * Get price for a specific card + grade combination
 */
export async function getGradePrice(cardHedgeId: string, grade: string): Promise<GradeInfo> {
  const response = await callEdgeFunction('card-hedge-proxy', 'grade-price', { cardHedgeId, grade });
  return response;
}

/**
 * Get available card categories
 */
export async function getCardCategories(): Promise<{ code: string; label: string; group: string }[]> {
  const response = await callEdgeFunction('card-hedge-proxy', 'categories', {});
  return response.categories || [];
}

// =============================================================================
// TRADING CARDS API
// =============================================================================

/**
 * Create a new trading card collectible
 */
export async function createTradingCard(data: CreateTradingCardRequest): Promise<{
  collectibleId: string;
  cardCatalogId: string;
  effectivePrice: number;
  pricingMode: PricingMode;
}> {
  const response = await callEdgeFunction('trading-cards', 'create', data);
  return response;
}

/**
 * Get a trading card by collectible ID
 */
export async function getTradingCard(collectibleId: string): Promise<TradingCard> {
  const response = await callEdgeFunction('trading-cards', 'get', { collectibleId });
  return response.tradingCard;
}

/**
 * Update pricing mode for a trading card
 */
export async function updateTradingCardPricing(params: {
  collectibleId: string;
  pricingMode: PricingMode;
  marginPercentage?: number;
  manualPrice?: number;
}): Promise<{
  collectibleId: string;
  pricingMode: PricingMode;
  effectivePrice: number;
}> {
  const response = await callEdgeFunction('trading-cards', 'update-pricing', params);
  return response;
}

/**
 * List user's trading cards
 */
export async function listTradingCards(params?: {
  limit?: number;
  offset?: number;
}): Promise<{
  tradingCards: TradingCard[];
  total: number;
}> {
  const response = await callEdgeFunction('trading-cards', 'list', params || {});
  return { tradingCards: response.tradingCards || [], total: response.total || 0 };
}

/**
 * Delete a trading card
 */
export async function deleteTradingCard(collectibleId: string): Promise<void> {
  await callEdgeFunction('trading-cards', 'delete', { collectibleId });
}

// =============================================================================
// PRICING HELPERS
// =============================================================================

/**
 * Calculate effective price based on pricing mode
 */
export function calculateEffectivePrice(
  pricingMode: PricingMode,
  apiPrice: number | null,
  marginPercentage?: number,
  manualPrice?: number
): number {
  switch (pricingMode) {
    case 'dynamic':
      return apiPrice ?? 0;
    case 'dynamic_margin':
      if (apiPrice !== null && marginPercentage !== undefined && marginPercentage !== 0) {
        // marginPercentage can be positive (markup) or negative (discount)
        // +15 = 15% above market, -15 = 15% below market
        return Math.round(apiPrice * (1 + marginPercentage / 100) * 100) / 100;
      }
      return apiPrice ?? 0;
    case 'manual':
      return manualPrice ?? 0;
    default:
      return apiPrice ?? 0;
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return 'Price unavailable';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Get pricing mode label
 */
export function getPricingModeLabel(mode: PricingMode, marginPercentage?: number): string {
  switch (mode) {
    case 'dynamic':
      return 'Market Price';
    case 'dynamic_margin':
      if (marginPercentage !== undefined) {
        return marginPercentage >= 0 
          ? `${marginPercentage}% Above Market`
          : `${Math.abs(marginPercentage)}% Below Market`;
      }
      return 'Margin Price';
    case 'manual':
      return 'Custom Price';
    default:
      return 'Unknown';
  }
}
