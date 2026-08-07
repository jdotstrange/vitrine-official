/**
 * API Configuration shim — kept native because messaging.ts relies on
 * getAuthToken / buildUrl helpers for Supabase Edge Functions.
 */

import { getAccessToken } from '@/lib/supabase';
import { logger } from '../logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const log = logger.create('API');

log.info('Using Supabase URL:', SUPABASE_URL);

export const API_CONFIG = {
  supabaseUrl: SUPABASE_URL,
  functionsUrl: `${SUPABASE_URL}/functions/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/** Get auth token from Supabase session (JWT for Edge Functions and RLS). */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await getAccessToken();
  } catch (error) {
    log.error('Error getting auth token:', error);
    return null;
  }
}

export function buildEdgeFunctionUrl(functionName: string): string {
  return `${API_CONFIG.functionsUrl}/${functionName}`;
}

export function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.functionsUrl}/${cleanEndpoint}`;
}
