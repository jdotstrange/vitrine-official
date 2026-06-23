import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  supabase,
  getPublicUserProfile,
  checkProfileStatus,
  ensurePublicUserExists,
  sendEmailOtp,
  verifyEmailOtp,
  signOut as supabaseSignOut,
  Session,
} from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { isReviewAuthEmail } from '@/lib/review-auth';

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

  // Initialize auth state and listen for changes
  useEffect(() => {
    log.info('Initializing Supabase Auth...');
    
    // Safety timeout - if init takes too long, force loading to false
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        log.warn('Safety timeout hit - forcing isLoading to false');
        setIsLoading(false);
      }
    }, 15000);

    // Get initial session
    initializeAuth().finally(() => {
      clearTimeout(safetyTimeout);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        log.info('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          if (newSession) {
            await loadUserProfile();
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfileStatus(null);
        }
      }
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
    const inTabs = segment === '(tabs)';
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
      log.info('Route | Session exists but no profileStatus, going to tabs');
      if (!inTabs) {
        router.replace('/(tabs)');
      }
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
      
      if (existingSession) {
        setSession(existingSession);
        await loadUserProfile();
      }
    } catch (error) {
      log.error('Error initializing auth:', error);
    } finally {
      log.debug('Setting isLoading to false');
      setIsLoading(false);
    }
  }

  async function loadUserProfile() {
    try {
      log.debug('Loading user profile...');
      
      // Get public user profile
      let profile = await getPublicUserProfile();
      if (!profile) {
        // Auth user may exist without a public.users row (e.g. created before trigger).
        // Ensure row exists so messaging/group-join and other APIs find the user.
        await ensurePublicUserExists();
        profile = await getPublicUserProfile();
      }
      log.info('Profile loaded:', !!profile);
      
      if (profile) {
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
      }
      
      // Check profile status
      const status = await checkProfileStatus();
      log.debug('Profile status:', status);
      
      if (status) {
        setProfileStatus({
          isComplete: status.isComplete,
          missing: status.missing as ('displayName' | 'username' | 'email')[],
        });
      }
    } catch (error) {
      log.error('Error loading user profile:', error);
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
