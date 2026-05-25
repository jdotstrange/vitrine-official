/**
 * Web client-side API binding.
 *
 * Mirrors `lib/api.ts` (server) but uses the browser Supabase client. Use
 * this from "use client" components and event handlers so authenticated
 * users see RLS-scoped data without re-fetching from the server.
 *
 * Mirrors apps/native/lib/api/index.ts singleton pattern.
 */

"use client"

import { createApi, type VitrineApi, createConsoleLogger } from "@vitrine/api"
import { createClient } from "@/lib/supabase/client"

let _clientApi: VitrineApi | null = null

export function getClientApi(): VitrineApi {
  if (!_clientApi) {
    const supabase = createClient()
    _clientApi = createApi({
      supabase,
      logger: createConsoleLogger("web/api-client"),
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
    })
  }
  return _clientApi
}
