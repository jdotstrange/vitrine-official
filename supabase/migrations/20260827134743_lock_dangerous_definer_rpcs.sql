-- Wave 1 security: lock client-callable SECURITY DEFINER RPCs.
-- Applied to the shared production app DB (preview and production share it).
-- Card Hedge RPCs already dropped in 20260806200000.

-- ─────────────────────────────────────────────────────────────────────────────
-- update_collectible_photos — no ownership check; anyone could rewrite photos.
-- Sole caller: migrate-images edge (service_role). Native updates the row
-- directly. Restrict to service_role and pin search_path.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_collectible_photos(p_id text, p_photos text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE collectibles
     SET photos = p_photos,
         updated_at = now()
   WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_collectible_photos(text, text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_collectible_photos(text, text[])
  TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_firebase_image_collectibles — DEFINER dump of every Firebase photo URL.
-- Sole caller: migrate-images (service_role).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_firebase_image_collectibles(batch_limit integer DEFAULT 50)
RETURNS TABLE(id text, photos text[], user_id text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT c.id, c.photos, c.user_id
    FROM collectibles c
    WHERE c.photos IS NOT NULL
      AND array_length(c.photos, 1) > 0
      AND c.photos::text LIKE '%firebasestorage%'
    LIMIT batch_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_firebase_image_collectibles(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_firebase_image_collectibles(integer)
  TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- unschedule_if_exists — clients could kill pg_cron jobs by name.
-- Keep for postgres (migrations) and service_role.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.unschedule_if_exists(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_jobid bigint;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = p_name;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.unschedule_if_exists(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unschedule_if_exists(text)
  TO postgres, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_or_create_dm — trusted client-supplied user ids (IDOR).
-- No live app callers (Stream Chat is the messaging path). Bind to auth.uid()
-- so a re-grant later cannot recreate the hole. Revoke anon.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_or_create_dm(p_user1_id text, p_user2_id text)
RETURNS TABLE(conversation_id text, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id TEXT;
  v_is_new BOOLEAN := false;
  v_uid TEXT := auth.uid()::text;
BEGIN
  IF v_uid IS NULL OR v_uid NOT IN (p_user1_id, p_user2_id) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_user1_id IS NULL OR p_user2_id IS NULL OR p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'invalid participants' USING ERRCODE = '22023';
  END IF;

  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM conversation_members cm1
      WHERE cm1.conversation_id = c.id AND cm1.user_id = p_user1_id
    )
    AND EXISTS (
      SELECT 1 FROM conversation_members cm2
      WHERE cm2.conversation_id = c.id AND cm2.user_id = p_user2_id
    );

  IF v_conversation_id IS NULL THEN
    v_is_new := true;

    INSERT INTO conversations (type)
    VALUES ('direct')
    RETURNING id INTO v_conversation_id;

    INSERT INTO conversation_members (conversation_id, user_id, role, is_accepted)
    VALUES
      (v_conversation_id, p_user1_id, 'member', true),
      (v_conversation_id, p_user2_id, 'member', false);
  END IF;

  RETURN QUERY SELECT v_conversation_id, v_is_new;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_dm(text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_dm(text, text)
  TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_unread_count — trusted p_user_id (IDOR). Bind to caller. Revoke anon.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_unread_count(p_conversation_id text, p_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_read_at TIMESTAMPTZ;
  v_unread INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid()::text IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT last_read_at INTO v_last_read_at
  FROM conversation_members
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  IF v_last_read_at IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_unread
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND created_at > v_last_read_at
    AND sender_id != p_user_id
    AND deleted_at IS NULL;

  RETURN COALESCE(v_unread, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_unread_count(text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unread_count(text, text)
  TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger-only DEFINER helpers were also executable via /rest/v1/rpc.
-- TG_NAME is NULL on a direct call; keep EXECUTE for authenticated so table
-- triggers still fire. Revoke anon.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_NAME IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.users
  SET supabase_auth_id = NEW.id
  WHERE (email = NEW.email AND NEW.email IS NOT NULL)
     OR (phone_number = NEW.phone AND NEW.phone IS NOT NULL);

  IF NOT FOUND THEN
    INSERT INTO public.users (
      id,
      supabase_auth_id,
      email,
      phone_number,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid()::text,
      NEW.id,
      NEW.email,
      NEW.phone,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user()
  TO supabase_auth_admin, authenticator, postgres, service_role;

CREATE OR REPLACE FUNCTION public.touch_collectibles_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
BEGIN
  IF TG_NAME IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF v_user_id IS NOT NULL THEN
    UPDATE public.users
      SET collectibles_last_changed_at = now()
      WHERE id = v_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.touch_collectibles_changed()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_collectibles_changed()
  TO authenticated, postgres, service_role;

CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_NAME IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.update_follow_counts()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_follow_counts()
  TO authenticated, postgres, service_role;

CREATE OR REPLACE FUNCTION public.update_showcase_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_NAME IS NULL THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET showcases_count = showcases_count + 1 WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET showcases_count = GREATEST(showcases_count - 1, 0) WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.update_showcase_counts()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_showcase_counts()
  TO authenticated, postgres, service_role;

NOTIFY pgrst, 'reload schema';
