-- grant_market_read_access
--
-- The Market Surface RPCs (browse_market_v2, get_category_counts) run as
-- SECURITY INVOKER and need to read two public schema objects that the
-- authenticated/anon roles had no access to:
--
--   * public.view_counters       — joined by browse_market_v2 for view_count
--   * public.collectibles_unified — read by get_category_counts for category counts
--
-- Without these grants, every Market browse/category call fails with
-- 42501 permission denied. View counts and aggregate category counts are
-- non-sensitive read-only data, so we expose SELECT to the public roles.
-- Writes remain restricted to service_role.

GRANT SELECT ON public.view_counters       TO authenticated, anon;
GRANT SELECT ON public.collectibles_unified TO authenticated, anon;
