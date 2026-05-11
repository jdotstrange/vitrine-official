/**
 * API Configuration
 * 
 * Consumer app now uses Supabase directly for all data operations.
 * Railway backend is only used by the Admin PWA.
 */

import { getAccessToken } from '@/lib/supabase';
import { logger } from '../logger';

// Supabase URL for Edge Functions
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const log = logger.create('API');

log.info('Using Supabase URL:', SUPABASE_URL);

export const API_CONFIG = {
  supabaseUrl: SUPABASE_URL,
  functionsUrl: `${SUPABASE_URL}/functions/v1`,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Get auth token from Supabase session
 * This is the Supabase JWT that can be used for Edge Functions and RLS
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await getAccessToken();
  } catch (error) {
    log.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Build full URL for Supabase Edge Function
 */
export function buildEdgeFunctionUrl(functionName: string): string {
  return `${API_CONFIG.functionsUrl}/${functionName}`;
}

// Legacy export for backwards compatibility - now points to Supabase
export function buildUrl(endpoint: string): string {
  // If it's already a full URL, return as-is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.functionsUrl}/${cleanEndpoint}`;
}
