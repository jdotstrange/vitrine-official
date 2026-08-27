-- Drop leftover onboarding-quiz sibling. No app/RPC/edge callers.
-- 6 rows, all jdotstrange, 2026-01-15 (baseball/basketball jersey/ball/hat).
-- Sibling tables user_type_interests / user_usage_intents /
-- user_marketplace_preferences were dropped 2026-05-10.
-- Future algo work should derive from collectibles, not this schema.

DROP TABLE IF EXISTS public.user_category_interests;

NOTIFY pgrst, 'reload schema';
