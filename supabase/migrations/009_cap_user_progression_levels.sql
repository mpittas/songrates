-- Cap profile ranks at 5. Formula stays 1 + floor(sqrt(xp / 100)),
-- then LEAST(5, ...). Keep in sync with src/lib/profileProgression.ts.

CREATE OR REPLACE FUNCTION private.recompute_user_progression(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp integer := 0;
  v_count integer := 0;
  v_level smallint := 1;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(
      CASE lower(btrim(coalesce(nullif(ua.album_type, ''), 'Album')))
        WHEN 'single' THEN 15
        WHEN 'ep' THEN 60
        WHEN 'compilation' THEN 40
        ELSE 100
      END
    ), 0)::integer
  INTO v_count, v_xp
  FROM public.user_albums ua
  INNER JOIN (
    SELECT album_id, COUNT(*)::integer AS rated_count
    FROM public.ratings
    WHERE user_id = p_user_id
      AND rating > 0
    GROUP BY album_id
  ) rated ON rated.album_id = ua.album_id
  WHERE ua.user_id = p_user_id
    AND ua.total_tracks > 0
    AND rated.rated_count >= ua.total_tracks;

  v_level := LEAST(5, (1 + floor(sqrt(v_xp / 100.0)))::smallint);

  INSERT INTO public.user_progression (
    user_id, xp, level, fully_rated_count, updated_at
  )
  VALUES (p_user_id, v_xp, v_level, v_count, now())
  ON CONFLICT (user_id) DO UPDATE
    SET xp = EXCLUDED.xp,
        level = EXCLUDED.level,
        fully_rated_count = EXCLUDED.fully_rated_count,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION private.recompute_user_progression(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.recompute_user_progression(uuid) TO postgres, service_role;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM private.recompute_user_progression(r.id);
  END LOOP;
END $$;

DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.user_progression'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%level%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_progression DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.user_progression
  ADD CONSTRAINT user_progression_level_check
  CHECK (level >= 1 AND level <= 5);
