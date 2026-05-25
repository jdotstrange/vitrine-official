import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!

/**
 * Anonymous Supabase client for server-only, unauthenticated queries
 * (share resolvers, public explore feed). Authenticated routes should
 * use lib/supabase/server.ts instead.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
