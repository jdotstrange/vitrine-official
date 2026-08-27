-- Wave 2 security: path-bind storage writes to the caller's public.users.id.
-- Preview and production share this DB.
--
-- Do NOT use auth.uid() as the folder check. Every public.users.id differs
-- from supabase_auth_id (878/878). Native + web upload to `{profileId}/…`.
-- The old collectible DELETE policy compared folder[1] to auth.uid() and
-- never matched, so client deletes were already a silent no-op.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: profile id for the JWT (INVOKER-safe via DEFINER + search_path).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.owns_collectible(p_collectible_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collectibles c
    WHERE c.id = p_collectible_id
      AND c.user_id = public.current_profile_id()
  );
$$;

REVOKE ALL ON FUNCTION public.owns_collectible(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_collectible(text) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- collectible-images
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can upload collectible images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own collectible images" ON storage.objects;

CREATE POLICY "collectible_images_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'collectible-images'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "collectible_images_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'collectible-images'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
)
WITH CHECK (
  bucket_id = 'collectible-images'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "collectible_images_delete_own_folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'collectible-images'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "collectible_images_delete_migrated_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'collectible-images'
  AND (storage.foldername(name))[1] = 'migrated'
  AND public.owns_collectible((storage.foldername(name))[2])
);

-- ─────────────────────────────────────────────────────────────────────────────
-- user-avatars — no write policies existed (upsert:true hit Sentry RLS).
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view user avatars" ON storage.objects;

CREATE POLICY "user_avatars_select_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "user_avatars_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "user_avatars_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
)
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "user_avatars_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

-- ─────────────────────────────────────────────────────────────────────────────
-- message-attachments — INSERT was bucket-only; DELETE was bucket-only.
-- media-upload edge uses service_role (bypasses RLS) and may write
-- `{auth.uid()}/…` or `group-covers/…`. Client writes must be profile-owned.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

CREATE POLICY "message_attachments_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "message_attachments_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
)
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = (SELECT public.current_profile_id())
);

CREATE POLICY "message_attachments_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (
    (storage.foldername(name))[1] = (SELECT public.current_profile_id())
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- category-thumbnails — catalog icons. Public read only; no client writes.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view category thumbnails" ON storage.objects;

CREATE POLICY "category_thumbnails_select_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'category-thumbnails');

NOTIFY pgrst, 'reload schema';
