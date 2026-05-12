/**
 * Web API binding — Day 2.5 monorepo wiring.
 *
 * Server Components and route handlers should call `getServerApi()` to obtain
 * a typed `VitrineApi` instance backed by an anonymous Supabase client.
 *
 * The web app currently only consumes the package for unauthenticated
 * share-resolver routes (`/s/c/[id]`, `/s/s/[id]`, `/s/p/[id]`), all of
 * which read public columns gated by RLS. A future enhancement will swap
 * in `@supabase/ssr` cookie-based auth so authenticated server components
 * can use the same API surface.
 */

import { createApi, type VitrineApi, createConsoleLogger } from "@vitrine/api"
import { supabase } from "@/lib/supabase"

const SUPABASE_URL = process.env.SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? ""

let _serverApi: VitrineApi | null = null

/**
 * Lazily-initialized server-side API singleton. Web RSC is single-process,
 * so a module-level singleton is safe — every request shares the same
 * anonymous Supabase client (RLS handles isolation).
 */
export function getServerApi(): VitrineApi {
  if (!_serverApi) {
    _serverApi = createApi({
      supabase,
      logger: createConsoleLogger("web/api"),
      env: { supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY },
    })
  }
  return _serverApi
}
