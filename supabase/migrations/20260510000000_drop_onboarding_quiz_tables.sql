-- Remove onboarding quiz tables. The quiz flow has been removed; onboarding_completed_at
-- is now set during profile completion instead. The column on public.users stays because
-- downstream RPCs use it as a "real user" filter.

DROP TABLE IF EXISTS public.user_usage_intents CASCADE;
DROP TABLE IF EXISTS public.user_marketplace_preferences CASCADE;
DROP TABLE IF EXISTS public.user_type_interests CASCADE;
