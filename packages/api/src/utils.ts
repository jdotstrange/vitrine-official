/**
 * Cross-module helpers shared by @vitrine/api modules.
 *
 * Keep this file small. If a helper is only used by one module, inline
 * it there. Adding shared helpers here is a coupling decision — only
 * promote when at least two modules need the same behavior.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve the current authenticated user id. Throws if no session —
 * which is what most API write paths want (you can't update a record
 * without an auth context).
 */
export async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error('Not authenticated');
  }
  return data.user.id;
}

/**
 * Resolve the current authenticated user id, returning null if no
 * session. For best-effort flows (anonymous view tracking, public
 * read paths that filter self-content).
 */
export async function maybeUserId(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}
