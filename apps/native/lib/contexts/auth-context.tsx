import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  supabase,
  getPublicUserProfile,
  ensurePublicUserExists,
  sendEmailOtp,
  verifyEmailOtp,
  signOut as supabaseSignOut,
  Session,
} from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { isReviewAuthEmail } from '@/lib/review-auth';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Rejects if the wrapped promise doesn't settle within `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const PROFILE_FETCH_TIMEOUT_MS = 8000;
const SESSION_REFRESH_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 4;

export interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  featuredShowcaseId?: string | null;
  crownJewelCollectibleId?: string | null;
  onboardingCompletedAt?: string | null;
}

export interface ProfileStatus {
  isComplete: boolean;
  missing: ('displayName' | 'username' | 'email')[];
}

export interface CompleteProfileData {
  displayName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  token: string | null;
  profileStatus: ProfileStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  login: (email: string, code: string) => Promise<void>;
  sendOtpCode: (email: string) => Promise<{ isDevAccount: boolean }>;
  logout: () => Promise<void>;

  // Profile actions
  updateProfile: (data: CompleteProfileData) => Promise<void>;
  refreshProfileStatus: () => Promise<void>;
}

const log = logger.create('Auth');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Coalesces concurrent profile loads (initializeAuth + onAuthStateChange can
  // both fire on boot, e.g. a TOKEN_REFRESHED during our manual refresh).
  const profileLoadRef = useRef<Promise<void> | null>(null);

  // Initialize auth state and listen for changes
  useEffect(() => {
    log.info('Initializing Supabase Auth...');
    
    // Safety net - if bootstrap somehow stalls past every internal timeout,
    // stop blocking the boot screen so the user isn't stuck forever.
    const safetyTimeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) log.warn('Safety timeout hit - forcing isLoading to false');
        return false;
      });
    }, 20000);

    // Get initial session
    initializeAuth().finally(() => {
      clearTimeout(safetyTimeout);
    });

    // Sync callback only — awaiting Supabase/PostgREST inside onAuthStateChange
    // deadlocks the auth exclusive lock (cold-start hang → ErrorBoundary).
    // Defer profile work off the lock with setTimeout(0).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        log.info('Auth state changed:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          if (newSession) {
            // ponytail: setTimeout(0) escapes the auth lock; do not await here
            setTimeout(() => {
              void loadUserProfile(newSession);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfileStatus(null);
        }
      },
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    const segment = segments[0] || '';
    log.debug('Route | isLoading:', isLoading, 'session:', !!session, 'segment:', segment);
    
    if (isLoading) {
      log.debug('Route | Still loading, skipping routing');
      return;
    }

    const inAuthGroup = segment === 'login' || segment === 'signup';
    const inCompleteProfile = segment === 'complete-profile';
    const atRoot = segment === '' || segment === 'index';

    log.debug('Route | profileStatus:', profileStatus);

    if (!session) {
      log.info('Route | No session, redirecting to login');
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else if (profileStatus && !profileStatus.isComplete) {
      log.info('Route | Profile incomplete, redirecting to complete-profile');
      if (!inCompleteProfile) {
        router.replace('/complete-profile');
      }
    } else if (session && profileStatus?.isComplete) {
      log.info('Route | Fully authenticated, checking if need to redirect to tabs');
      if (inAuthGroup || inCompleteProfile || atRoot) {
        log.info('Route | Redirecting to tabs...');
        router.replace('/(tabs)');
      }
    } else if (session && !profileStatus) {
      // Session is present but the profile hasn't resolved yet. Do NOT route into
      // the tabs profileless — stay on the boot surface (app/index keeps showing
      // VitrineBootScreen while authenticated && !user) and let the retrying
      // profile load / auto-refresh fill it in. This is what prevents the
      // "app loads with no profile mounted" symptom.
      log.debug('Route | Session present, awaiting profile before routing');
    } else {
      log.debug('Route | No routing action taken, current segment:', segment);
    }
  }, [session, profileStatus, isLoading, segments]);

  async function initializeAuth() {
    log.debug('Loading session...');
    try {
      const { data: { session: existingSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        log.error('Error getting session:', error);
        setIsLoading(false);
        return;
      }

      log.info('Session exists:', !!existingSession);

      if (!existingSession) {
        setIsLoading(false);
        return;
      }

      // Validate the stored token before trusting it. getSession() returns
      // whatever is in AsyncStorage, which on a cold start is frequently expired.
      // Refreshing here (instead of letting the first authenticated request hang
      // or 401) is the core fix for both the boot hang and the profileless mount.
      const freshSession = await ensureFreshSession(existingSession);
      setSession(freshSession);
      await loadUserProfile(freshSession);
    } catch (error) {
      log.error('Error initializing auth:', error);
    } finally {
      log.debug('Setting isLoading to false');
      setIsLoading(false);
    }
  }

  /**
   * Returns a non-expired session. If the token is expired/expiring, refreshes
   * with bounded retries. On exhaustion it returns the original session rather
   * than signing out — the AppState auto-refresh recovers it on next foreground,
   * preserving the "reopen fixes it" path instead of bouncing the user to login.
   */
  async function ensureFreshSession(current: Session): Promise<Session> {
    const expiresAt = current.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt - now > 60) {
      return current;
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.refreshSession(),
          SESSION_REFRESH_TIMEOUT_MS,
          'refreshSession',
        );
        if (!error && data.session) {
          log.info('Session refreshed on boot');
          return data.session;
        }
        log.warn(`refreshSession attempt ${attempt} failed:`, error?.message);
      } catch (err) {
        log.warn(`refreshSession attempt ${attempt} threw:`, err);
      }
      if (attempt < MAX_ATTEMPTS) await delay(attempt * 800);
    }

    log.error('refreshSession exhausted; using existing session');
    return current;
  }

  /**
   * Loads the public profile + completeness status for the given session.
   * Uses the session's auth id (no extra getUser round-trip), wraps each fetch
   * in a timeout, retries on transient failure, and coalesces concurrent calls.
   */
  async function loadUserProfile(activeSession?: Session): Promise<void> {
    if (profileLoadRef.current) {
      return profileLoadRef.current;
    }

    const promise = (async () => {
      const sess =
        activeSession ?? (await supabase.auth.getSession()).data.session ?? undefined;
      if (!sess) {
        log.warn('loadUserProfile: no session available');
        return;
      }
      const authId = sess.user.id;

      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          let profile = await withTimeout(
            getPublicUserProfile(authId),
            PROFILE_FETCH_TIMEOUT_MS,
            'getPublicUserProfile',
          );

          if (!profile) {
            // Auth user may exist without a public.users row (e.g. created before
            // the trigger). Ensure the row exists, then read again.
            await ensurePublicUserExists();
            profile = await withTimeout(
              getPublicUserProfile(authId),
              PROFILE_FETCH_TIMEOUT_MS,
              'getPublicUserProfile(retry)',
            );
          }

          if (!profile) {
            throw new Error('Profile not found after ensurePublicUserExists');
          }

          log.info('Profile loaded');
          setUser({
            id: profile.id,
            email: profile.email,
            phoneNumber: profile.phoneNumber,
            displayName: profile.displayName,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            featuredShowcaseId: profile.featuredShowcaseId,
            crownJewelCollectibleId: profile.crownJewelCollectibleId,
            onboardingCompletedAt: profile.onboardingCompletedAt,
          });

          const missing: ('displayName' | 'username' | 'email')[] = [];
          if (!profile.displayName) missing.push('displayName');
          if (!profile.username) missing.push('username');
          if (!profile.email) missing.push('email');
          setProfileStatus({ isComplete: missing.length === 0, missing });
          return;
        } catch (err) {
          lastError = err;
          log.warn(`loadUserProfile attempt ${attempt} failed:`, err);
          if (attempt < MAX_ATTEMPTS) await delay(attempt * 800);
        }
      }

      log.error('loadUserProfile failed after retries:', lastError);
    })();

    profileLoadRef.current = promise;
    try {
      await promise;
    } finally {
      profileLoadRef.current = null;
    }
  }

  async function sendOtpCode(email: string) {
    const trimmed = email.trim();

    if (isReviewAuthEmail(trimmed)) {
      log.info('Review account — skipping Supabase OTP send');
      return { isDevAccount: true };
    }

    log.info('Sending OTP to:', trimmed);

    const result = await sendEmailOtp(trimmed);
    if (!result.success) {
      throw new Error(result.error || 'Failed to send code');
    }

    return { isDevAccount: false };
  }

  async function login(email: string, code: string) {
    const trimmed = email.trim();
    log.info('Verifying OTP for:', trimmed);

    if (isReviewAuthEmail(trimmed)) {
      // App Review demo login. The app is passwordless for real users, but
      // Apple needs a working sign-in. This one allowlisted email authenticates
      // with a fixed password entered in the code field. We use the standard
      // signInWithPassword primitive (no setSession / token-hash machinery),
      // which shares the proven session-save path used by normal OTP login.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed.toLowerCase(),
        password: code,
      });

      if (signInError) {
        log.error('Review sign-in failed:', signInError.message);
        throw new Error('Invalid review code. Please try again.');
      }

      log.info('Review account login successful');
      return;
    }

    const result = await verifyEmailOtp(trimmed, code);

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.session) {
      throw new Error('No session returned');
    }

    log.info('Login successful, session set');
  }

  async function logout() {
    log.info('Logging out...');
    await supabaseSignOut();
    router.replace('/login');
  }

  async function updateProfile(data: CompleteProfileData) {
    if (!session) throw new Error('Not authenticated');
    if (!user) throw new Error('No user loaded');

    log.info('Updating profile:', data);
    
    // Update the public.users table
    const { error } = await supabase
      .from('users')
      .update({
        display_name: data.displayName,
        username: data.username,
        email: data.email,
        phone_number: data.phoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (error) {
      log.error('Error updating profile:', error);
      throw new Error(error.message);
    }
    
    // Reload profile
    await loadUserProfile();
  }

  async function refreshProfileStatus() {
    await loadUserProfile();
  }

  const value = {
    user,
    session,
    // Keep token for backwards compatibility - use session.access_token
    token: session?.access_token || null,
    profileStatus,
    isLoading,
    isAuthenticated: !!session,
    login,
    sendOtpCode,
    logout,
    updateProfile,
    refreshProfileStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
