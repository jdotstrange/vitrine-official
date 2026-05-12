/**
 * Public user profile shape.
 *
 * Mirrors the columns that the collector-facing surfaces (profile, activity,
 * settings, etc.) read from `public.users`. Auth-only fields (email/phone
 * verification timestamps, supabase_auth_id, etc.) live in the auth API
 * module and are not part of the shared domain type.
 *
 * Counts (followers/following/collectibles/showcases) are optional because
 * not every fetch requests them — only the surfaces that need them include
 * the corresponding RPC counts.
 */
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
  /**
   * V3 soft-launch quality gate. Used as a "real user" filter in
   * collector-discovery RPCs (Network suggested-collectors, Market
   * search). NULL = stub user / pre-onboarding; ISO timestamp = the
   * user has completed the V3 first-run.
   */
  onboardingCompletedAt?: string | null;
  followersCount?: number;
  followingCount?: number;
  collectiblesCount?: number;
  showcasesCount?: number;
  /**
   * V3 Network surface privacy gate. Controls whether visitors can see
   * this user's Followers / Following chips on the NETWORK lens. Owners
   * always bypass the gate when viewing their own profile.
   */
  followListsVisibility?: 'public' | 'private';
  createdAt?: string | null;
}

/**
 * Profile-completion status returned by checkProfileStatus(). Owns the
 * gating logic that drives the complete-profile flow.
 */
export interface ProfileStatus {
  isComplete: boolean;
  missing: ('displayName' | 'username' | 'email')[];
}
