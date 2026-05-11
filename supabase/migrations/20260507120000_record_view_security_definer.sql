-- Make record_view SECURITY DEFINER so callers don't need INSERT privileges
-- on recent_views / view_counters. The function is already self-gatekept:
-- it validates target_type, short-circuits on private items, and dedupes via
-- ON CONFLICT, so elevation is safe.

CREATE OR REPLACE FUNCTION public.record_view(
  p_target_type text,
  p_target_id text,
  p_viewer_anon_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_privacy text;
  v_inserted integer;
BEGIN
  IF p_target_type NOT IN ('collectible', 'showcase', 'profile') THEN
    RAISE EXCEPTION 'invalid_target_type' USING ERRCODE = '22023';
  END IF;

  IF p_target_type = 'collectible' THEN
    SELECT privacy INTO v_privacy
      FROM collectibles WHERE id = p_target_id;
    IF v_privacy IS NULL OR v_privacy = 'private' THEN
      RETURN;
    END IF;
  ELSIF p_target_type = 'showcase' THEN
    SELECT visibility INTO v_privacy
      FROM showcases WHERE id = p_target_id;
    IF v_privacy IS NULL OR v_privacy = 'private' THEN
      RETURN;
    END IF;
  END IF;

  INSERT INTO recent_views (target_type, target_id, viewer_anon_id)
  VALUES (p_target_type, p_target_id, p_viewer_anon_id)
  ON CONFLICT (target_type, target_id, viewed_on, viewer_anon_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    INSERT INTO view_counters (target_type, target_id, total_views, updated_at)
    VALUES (p_target_type, p_target_id, 1, now())
    ON CONFLICT (target_type, target_id) DO UPDATE SET
      total_views = view_counters.total_views + 1,
      updated_at = now();
  END IF;
END;
$function$;

-- Make sure both authenticated and anon callers can invoke it
GRANT EXECUTE ON FUNCTION public.record_view(text, text, text) TO authenticated, anon;
