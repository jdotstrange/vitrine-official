-- Wave 5 security: pin search_path on leftover functions; view invoker.
-- Preview and production share this DB.
--
-- ALTER FUNCTION … SET search_path does not rewrite bodies.
-- complete_and_publish is load-bearing (publish trigger) — path pin only.
-- collectibles_unified is service_role-only; security_invoker still applies
-- collectibles RLS if that ever changes.
--
-- Policy initplan / duplicate-permissive rewrite is NOT in this file
-- (40+ policies; keep diffs reviewable). HIBP is Auth dashboard, not SQL.
-- App uses email OTP, not passwords.

ALTER FUNCTION public.browse_collectibles(text[], text[], numeric, numeric, text[], text, text, integer, integer, text)
  SET search_path = public;

ALTER FUNCTION public.calculate_effective_price(public.pricing_mode, numeric, integer, numeric)
  SET search_path = public;

ALTER FUNCTION public.can_send_dm(text, text)
  SET search_path = public;

ALTER FUNCTION public.complete_and_publish()
  SET search_path = public;

ALTER FUNCTION public.get_category_counts()
  SET search_path = public;

ALTER FUNCTION public.get_current_user_id()
  SET search_path = public;

ALTER FUNCTION public.get_group_member_limit(public.group_tier)
  SET search_path = public;

ALTER FUNCTION public.get_hot_items(integer, text)
  SET search_path = public;

ALTER FUNCTION public.get_track_counts(text[])
  SET search_path = public;

ALTER FUNCTION public.get_tracked_category_counts(text)
  SET search_path = public;

ALTER FUNCTION public.get_user_id_from_auth()
  SET search_path = public;

ALTER FUNCTION public.get_user_track_count(text)
  SET search_path = public;

ALTER FUNCTION public.mark_question_answered()
  SET search_path = public;

ALTER FUNCTION public.search_collectibles(text, text, text, numeric, numeric, boolean, boolean, integer, integer, text)
  SET search_path = public;

ALTER FUNCTION public.update_conversation_last_message()
  SET search_path = public;

ALTER FUNCTION public.update_conversation_member_count()
  SET search_path = public;

ALTER FUNCTION public.update_updated_at()
  SET search_path = public;

ALTER VIEW public.collectibles_unified SET (security_invoker = true);

-- Unused DEFINER helpers: no app callers. Keep authenticated for policies.
REVOKE ALL ON FUNCTION public.get_current_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_id_from_auth() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_from_auth() TO authenticated, service_role;
