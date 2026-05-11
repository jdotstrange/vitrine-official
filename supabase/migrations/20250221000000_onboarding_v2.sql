-- Phase 2 Onboarding: new tables + reset existing users

-- 1. user_usage_intents: stores multi-select usage intents from onboarding Step 1
CREATE TABLE IF NOT EXISTS public.user_usage_intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL CHECK (intent IN (
    'display_collection',
    'discover',
    'track',
    'buy',
    'trade',
    'sell'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, intent)
);

ALTER TABLE public.user_usage_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intents"
  ON public.user_usage_intents FOR SELECT
  USING (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own intents"
  ON public.user_usage_intents FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can delete own intents"
  ON public.user_usage_intents FOR DELETE
  USING (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

-- 2. user_marketplace_preferences: conditional marketplace signals from onboarding Steps 3a/3b
CREATE TABLE IF NOT EXISTS public.user_marketplace_preferences (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  price_range TEXT NOT NULL CHECK (price_range IN ('budget', 'grails', 'both')),
  acquisition_style TEXT NOT NULL CHECK (acquisition_style IN ('buy', 'trade', 'both')),
  decision_style TEXT NOT NULL CHECK (decision_style IN ('heart', 'head', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_marketplace_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own marketplace prefs"
  ON public.user_marketplace_preferences FOR SELECT
  USING (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own marketplace prefs"
  ON public.user_marketplace_preferences FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can update own marketplace prefs"
  ON public.user_marketplace_preferences FOR UPDATE
  USING (user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

-- 3. Reset all existing users so they re-run the new onboarding
UPDATE public.users SET onboarding_completed_at = NULL WHERE onboarding_completed_at IS NOT NULL;
