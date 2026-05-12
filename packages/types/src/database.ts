/**
 * Generated Supabase types — STUB.
 *
 * The full type is produced by:
 *   supabase gen types typescript --project-id <PROJECT_ID> --schema public > database.ts
 *
 * Until that's wired into a CI step (or a `pnpm types:generate` script),
 * this file ships a permissive Database type so consumers can import
 * `Database` and `Tables<'name'>` without TS errors. Replace this whole
 * file with the generator output when ready.
 *
 * Tracking: docs/ai-context/IMPLEMENTATION_LOG.md (Day 2 — types package).
 */

export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }>;
    Views: Record<string, {
      Row: Record<string, unknown>;
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
    Enums: Record<string, string>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
