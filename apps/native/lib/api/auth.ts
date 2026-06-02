/**
 * Auth API
 * Handles user profile operations and availability checks
 * 
 * Authentication is now handled by Supabase Auth directly via auth-context.tsx
 * This file provides helper functions for profile operations
 */

import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/image-utils';
import { logger } from '../logger';

// Domain types now live in @vitrine/types so web RSC + future Edge functions
// share the same User shape. Re-exported here so existing
// `import { type User } from '@/lib/api/auth'` call sites keep working.
import type { User, ProfileStatus } from '@vitrine/types';
export type { User, ProfileStatus };

const log = logger.create('Auth');

export interface VerifyOtpResponse {
  user: User;
  token: string;
  profileStatus: ProfileStatus;
}

export interface SendOtpResponse {
  message: string;
  isDevAccount: boolean;
}

export interface CompleteProfileData {
  displayName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string | null;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  message: string;
}

// Error class for API errors
export class ApiException extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
  }
}

/**
 * Get profile status for authenticated user
 */
export async function getProfileStatus(userId: string): Promise<ProfileStatus> {
  const { data: user, error } = await supabase
    .from('users')
    .select('display_name, username, email, phone_number')
    .eq('id', userId)
    .single();

  if (error) {
    log.error('Error fetching profile status:', error);
    throw new ApiException('Failed to fetch profile status', 500);
  }

  const missing: ('displayName' | 'username' | 'email')[] = [];
  
  if (!user.display_name) missing.push('displayName');
  if (!user.username) missing.push('username');
  if (!user.email) missing.push('email');
  
  return {
    isComplete: missing.length === 0,
    missing,
  };
}

/**
 * Update profile (complete missing fields)
 */
export async function completeProfile(
  userId: string,
  data: CompleteProfileData
): Promise<{ message: string; user: User }> {
  const updateData: Record<string, any> = {};
  
  if (data.displayName !== undefined) updateData.display_name = data.displayName;
  if (data.username !== undefined) updateData.username = data.username?.toLowerCase();
  if (data.email !== undefined) updateData.email = data.email?.toLowerCase();
  if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber;
  if (data.bio !== undefined) updateData.bio = data.bio === '' ? null : data.bio;
  updateData.updated_at = new Date().toISOString();

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    log.error('Error updating profile:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      if (error.message.includes('username')) {
        throw new ApiException('Username is already taken', 409);
      }
      if (error.message.includes('email')) {
        throw new ApiException('Email is already in use', 409);
      }
    }
    throw new ApiException('Failed to update profile', 500);
  }

  return {
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      phoneNumber: updatedUser.phone_number,
      displayName: updatedUser.display_name,
      username: updatedUser.username,
      avatarUrl: updatedUser.avatar,
      bio: updatedUser.bio,
      featuredShowcaseId: updatedUser.featured_showcase_id,
      crownJewelCollectibleId: updatedUser.crown_jewel_collectible_id,
      onboardingCompletedAt: updatedUser.onboarding_completed_at,
    },
  };
}

/**
 * Check username availability
 */
export async function checkUsername(
  username: string,
  currentUserId?: string
): Promise<CheckAvailabilityResponse> {
  let query = supabase
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase());
  
  // Exclude current user if checking while editing profile
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    log.error('Error checking username:', error);
    throw new ApiException('Failed to check username', 500);
  }

  return {
    available: !data,
    message: data ? 'Username is already taken' : 'Username is available',
  };
}

/**
 * Check email availability
 */
export async function checkEmail(
  email: string,
  currentUserId?: string
): Promise<CheckAvailabilityResponse> {
  let query = supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase());
  
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    log.error('Error checking email:', error);
    throw new ApiException('Failed to check email', 500);
  }

  return {
    available: !data,
    message: data ? 'Email is already in use' : 'Email is available',
  };
}

/**
 * Check phone availability
 */
export async function checkPhone(
  phone: string,
  currentUserId?: string
): Promise<CheckAvailabilityResponse> {
  let query = supabase
    .from('users')
    .select('id')
    .eq('phone_number', phone);
  
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    log.error('Error checking phone:', error);
    throw new ApiException('Failed to check phone', 500);
  }

  return {
    available: !data,
    message: data ? 'Phone number is already in use' : 'Phone number is available',
  };
}

/**
 * Get current user
 */
function mapRowToUser(data: any): User {
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
    followersCount: data.followers_count ?? 0,
    followingCount: data.following_count ?? 0,
    collectiblesCount: data.collectibles_count ?? 0,
    showcasesCount: data.showcases_count ?? 0,
    followListsVisibility:
      (data.follow_lists_visibility as 'public' | 'private') ?? 'public',
    createdAt: data.created_at ?? null,
  };
}

export async function getCurrentUser(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    log.error('Error fetching user:', error);
    throw new ApiException('Failed to fetch user', 500);
  }

  return mapRowToUser(data);
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string,
  filename: string
): Promise<{ message: string; avatarUrl: string }> {
  try {
    const fileExt = filename.split('.').pop() || 'jpg';
    const basePath = `${userId}/${Date.now()}.${fileExt}`;

    const { url: avatarUrl } = await uploadImage(
      'user-avatars',
      basePath,
      imageUri,
      { upsert: true },
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      log.error('Error updating avatar URL:', updateError);
      throw new ApiException('Failed to update profile with avatar', 500);
    }

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  } catch (error) {
    if (error instanceof ApiException) throw error;
    log.error('Upload avatar error:', error);
    throw new ApiException('Failed to upload avatar', 500);
  }
}

/**
 * Delete avatar
 */
export async function deleteAvatar(userId: string): Promise<{ message: string }> {
  // Get current avatar URL to extract path
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('avatar')
    .eq('id', userId)
    .single();

  if (fetchError) {
    log.error('Error fetching user for avatar delete:', fetchError);
    throw new ApiException('Failed to fetch user', 500);
  }

  // Delete from storage if avatar exists
  if (user?.avatar) {
    try {
      // Extract path from URL
      const url = new URL(user.avatar);
      const pathMatch = url.pathname.match(/\/user-avatars\/(.+)$/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage.from('user-avatars').remove([filePath]);
      }
    } catch (e) {
      // Log but don't fail - file might not exist
      log.warn('Could not delete avatar file:', e);
    }
  }

  // Update user profile to remove avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      avatar: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    log.error('Error clearing avatar URL:', updateError);
    throw new ApiException('Failed to update profile', 500);
  }

  return { message: 'Avatar deleted successfully' };
}

/**
 * Set or clear the user's featured showcase (shown on profile).
 * The showcase must belong to the user.
 */
export async function setFeaturedShowcase(
  userId: string,
  showcaseId: string | null
): Promise<{ message: string }> {
  if (showcaseId) {
    const { data: showcase, error: fetchError } = await supabase
      .from('showcases')
      .select('user_id')
      .eq('id', showcaseId)
      .single();

    if (fetchError || !showcase) {
      log.error('Showcase not found or error:', fetchError);
      throw new ApiException('Showcase not found', 404);
    }
    if (showcase.user_id !== userId) {
      throw new ApiException('You can only feature your own showcase', 403);
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      featured_showcase_id: showcaseId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    log.error('Error setting featured showcase:', error);
    throw new ApiException('Failed to update featured showcase', 500);
  }
  return { message: showcaseId ? 'Featured showcase updated' : 'Featured showcase cleared' };
}

/**
 * Set or clear the user's Crown Jewel collectible (shown on profile).
 * The collectible must belong to the user.
 */
export async function setCrownJewelCollectible(
  userId: string,
  collectibleId: string | null
): Promise<{ message: string }> {
  if (collectibleId) {
    const { data: collectible, error: fetchError } = await supabase
      .from('collectibles')
      .select('user_id')
      .eq('id', collectibleId)
      .single();

    if (fetchError || !collectible) {
      log.error('Collectible not found or error:', fetchError);
      throw new ApiException('Collectible not found', 404);
    }
    if (collectible.user_id !== userId) {
      throw new ApiException('You can only crown your own collectible', 403);
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      crown_jewel_collectible_id: collectibleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    log.error('Error setting Crown Jewel collectible:', error);
    throw new ApiException('Failed to update Crown Jewel', 500);
  }
  return { message: collectibleId ? 'Crown Jewel updated' : 'Crown Jewel cleared' };
}

/**
 * Get user by Supabase Auth ID
 */
export async function getUserByAuthId(supabaseAuthId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_auth_id', supabaseAuthId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    log.error('Error fetching user by auth ID:', error);
    throw new ApiException('Failed to fetch user', 500);
  }

  return mapRowToUser(data);
}

/**
 * Get a public user profile by their user ID.
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    log.error('Error fetching user by ID:', error);
    throw new ApiException('Failed to fetch user', 500);
  }

  return mapRowToUser(data);
}

/**
 * Get a public user profile by username.
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    log.error('Error fetching user by username:', error);
    throw new ApiException('Failed to fetch user', 500);
  }

  return mapRowToUser(data);
}
