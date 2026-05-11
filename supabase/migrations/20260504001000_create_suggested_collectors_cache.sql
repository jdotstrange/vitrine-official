-- Network Surface V3 — per-viewer Suggested Collectors cache
--
-- The Suggested chip on the NETWORK lens scores candidate collectors against
-- five signals (inventory affinity, comp overlap, tracking overlap, network
-- proximity, authority). The scoring pass involves a get_collectible_comps
-- fan-out per viewer collectible, so it's expensive enough to amortize via
-- a per-viewer materialized cache with a 24-48h TTL.
--
-- Cache lifecycle:
--   - Lens load reads cache rows where expires_at > now().
--   - Cache miss (no rows OR all expired) triggers a recompute inside the
--     suggest_collectors_for RPC; results are upserted with a new
--     expires_at = now() + interval '36 hours' (midpoint of the agreed
--     24-48h window).
--   - Pull-to-refresh on the lens calls the RPC with p_force_recompute=true,
--     which deletes the viewer's rows before rescoring.
--   - Following or unfollowing a candidate deletes the (viewer, candidate)
--     row immediately so the just-followed collector doesn't reappear on
--     the next render.
--   - A daily pg_cron job purges expired rows globally.

CREATE TABLE IF NOT EXISTS public.suggested_collectors_cache (
  viewer_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_score numeric(5, 2) NOT NULL,
  -- Highest-contributing signal at scoring time. Drives the reason chip
  -- copy on the SuggestedRow primitive.
  reason_code text NOT NULL CHECK (
    reason_code IN ('inventory', 'comp', 'tracking', 'network', 'authority', 'serendipity')
  ),
  -- Free-form payload the reason chip needs to render its copy
  -- (e.g., { "compCount": 7 } or { "viaUserIds": ["..."] }). Kept as
  -- jsonb so we can extend signals without a migration.
  reason_meta jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (viewer_id, candidate_id)
);

-- Hot path: "give me viewer's top N suggestions ordered by score".
CREATE INDEX IF NOT EXISTS idx_suggested_cache_viewer_score
  ON public.suggested_collectors_cache (viewer_id, match_score DESC);

-- Cron purge path: "delete every row past its TTL".
CREATE INDEX IF NOT EXISTS idx_suggested_cache_expires
  ON public.suggested_collectors_cache (expires_at);

COMMENT ON TABLE public.suggested_collectors_cache IS
  'Per-viewer materialized cache for the V3 NETWORK lens Suggested chip. Rows live 24-48h; recompute triggered on cache miss, pull-to-refresh, or follow/unfollow events.';
