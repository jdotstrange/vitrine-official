import type { SupabaseClient } from '@supabase/supabase-js';

export interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function createBlockedApi(supabase: SupabaseClient) {
  async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id, blocked_id, created_at, user:users!blocked_id(id, display_name, username, avatar_url)')
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as BlockedUser[];
  }

  async function blockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) {
      if (error.code === '23505') return;
      throw error;
    }
  }

  async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;
  }

  async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  return {
    getBlockedUsers,
    blockUser,
    unblockUser,
    isBlocked,
  };
}

export type BlockedApi = ReturnType<typeof createBlockedApi>;
