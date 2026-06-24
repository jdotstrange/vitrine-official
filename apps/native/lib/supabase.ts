/**
 * Supabase Client for React Native
 * 
 * This client is used for authentication and all Supabase interactions.
 * It uses AsyncStorage for session persistence across app restarts.
 */

import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { logger } from './logger';

// Get Supabase config from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
  });
}

const log = logger.create('Supabase');

// Create Supabase client with React Native specific config
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Drive Supabase's token auto-refresh off the app foreground state. Supabase's
// RN guidance requires this: without it the refresh timer doesn't reliably run
// across background/foreground, which is the root of the "first cold launch has
// a stale/expired token, reopening fixes it" boot bug. Active = refresh on;
// background/inactive = pause so we don't churn while suspended.
if (AppState.currentState === 'active') {
  supabase.auth.startAutoRefresh();
}
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Export types for convenience
export type { Session, User };

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  log.debug('Getting session...');
  const { data: { session }, error } = await supabase.auth.getSession();
  log.debug('getSession result:', {
    hasSession: !!session,
    error: error?.message || null,
    expiresAt: session?.expires_at,
  });
  if (error) {
    log.error('Error getting session:', error);
    return null;
  }
  return session;
}

/**
 * Get the current user
 */
export async function getUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    log.error('Error getting user:', error);
    return null;
  }
  return user;
}

/**
 * Get the current access token (for API calls / Edge Functions).
 * Checks the cached session first, and explicitly refreshes if the
 * token is expired or about to expire (60-second buffer).
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    log.warn('getAccessToken: no session available');
    return null;
  }

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt - now < 60) {
    log.debug('getAccessToken: token expired or expiring soon, refreshing...');
    const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed) {
      log.error('getAccessToken: refresh failed', refreshError);
      return null;
    }
    return refreshed.access_token;
  }

  return session.access_token;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    log.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Send OTP to email
 */
export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Create user if doesn't exist
    },
  });
  
  if (error) {
    log.error('Error sending email OTP:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Send OTP to phone
 */
export async function sendPhoneOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  // Ensure phone is in E.164 format
  const formattedPhone = formatPhoneE164(phone);
  
  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
    options: {
      shouldCreateUser: true,
    },
  });
  
  if (error) {
    log.error('Error sending phone OTP:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Verify email OTP
 */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ session: Session | null; user: User | null; error?: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  
  if (error) {
    log.error('Error verifying email OTP:', error);
    return { session: null, user: null, error: error.message };
  }
  
  return { session: data.session, user: data.user };
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<{ session: Session | null; user: User | null; error?: string }> {
  const formattedPhone = formatPhoneE164(phone);
  
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: 'sms',
  });
  
  if (error) {
    log.error('Error verifying phone OTP:', error);
    return { session: null, user: null, error: error.message };
  }
  
  return { session: data.session, user: data.user };
}

/**
 * Format phone number to E.164 format (required by Supabase)
 * Assumes US numbers if no country code provided
 */
function formatPhoneE164(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code (11+ digits starting with 1), format as-is
  if (digits.length >= 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Assume US number, prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Return as-is with + prefix for international numbers
  return `+${digits}`;
}

/**
 * Get the public user profile from public.users table
 * This is linked via supabase_auth_id
 */
export async function getPublicUserProfile(authUserId?: string): Promise<{
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  featuredShowcaseId: string | null;
  crownJewelCollectibleId: string | null;
  onboardingCompletedAt: string | null;
} | null> {
  // Callers on the boot path pass the auth id from the already-loaded session to
  // avoid a redundant (and on cold start, refresh-triggering / hang-prone)
  // network round-trip to auth.getUser().
  let userId = authUserId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, phone_number, display_name, username, avatar, bio, featured_showcase_id, crown_jewel_collectible_id, onboarding_completed_at')
    .eq('supabase_auth_id', userId)
    .single();
  
  if (error) {
    log.error('Error getting public user profile:', error);
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    phoneNumber: data.phone_number,
    displayName: data.display_name,
    username: data.username,
    avatarUrl: data.avatar,
    bio: data.bio,
    featuredShowcaseId: data.featured_showcase_id,
    crownJewelCollectibleId: data.crown_jewel_collectible_id,
    onboardingCompletedAt: data.onboarding_completed_at,
  };
}

/**
 * Ensure the current auth user has a row in public.users.
 * 1) If a row already exists for this supabase_auth_id, return true.
 * 2) If a row exists with same email/phone but supabase_auth_id is null, link it (UPDATE).
 * 3) Otherwise insert a new row.
 * Idempotent and matches the backend trigger logic so "User not found" is resolved.
 */
export async function ensurePublicUserExists(): Promise<boolean> {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    log.warn('ensurePublicUserExists: no auth user', authError);
    return false;
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_auth_id', authUser.id)
    .maybeSingle();
  if (existing) return true;

  // Link an existing row by email or phone if it has no supabase_auth_id (e.g. pre-trigger user)
  const email = authUser.email?.trim() || null;
  const phone = authUser.phone ?? null;
  let linkableId: string | null = null;
  if (email) {
    const { data: byEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .is('supabase_auth_id', null)
      .maybeSingle();
    if (byEmail) linkableId = byEmail.id;
  }
  if (!linkableId && phone) {
    const { data: byPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phone)
      .is('supabase_auth_id', null)
      .maybeSingle();
    if (byPhone) linkableId = byPhone.id;
  }
  if (linkableId) {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        supabase_auth_id: authUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkableId);
    if (!updateError) {
      log.info('Linked existing public.users row to auth user', authUser.id);
      return true;
    }
    log.warn('Failed to link existing user row', updateError);
  }

  // Insert new row (use placeholder email to avoid unique violation if email already taken)
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  const insertEmail = email || `user-${authUser.id}@vitrine.placeholder`;
  const now = new Date().toISOString();
  const { error } = await supabase.from('users').insert({
    id,
    supabase_auth_id: authUser.id,
    email: insertEmail,
    phone_number: phone,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    log.error('Error ensuring public user:', error);
    return false;
  }
  log.info('Created missing public.users row for auth user', authUser.id);
  return true;
}

/**
 * Check if user profile is complete
 */
export async function checkProfileStatus(): Promise<{
  isComplete: boolean;
  missing: string[];
} | null> {
  const profile = await getPublicUserProfile();
  
  if (!profile) return null;
  
  const missing: string[] = [];
  
  if (!profile.displayName) missing.push('displayName');
  if (!profile.username) missing.push('username');
  if (!profile.email) missing.push('email');
  
  return {
    isComplete: missing.length === 0,
    missing,
  };
}
