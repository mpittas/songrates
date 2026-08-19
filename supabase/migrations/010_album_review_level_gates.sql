-- Ranks come from fully rated album count + written reviews, not XP.
-- Keep thresholds in sync with src/lib/profileProgression.ts.

ALTER TABLE public.user_progression
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_progression'::regclass
      AND conname = 'user_progression_review_count_check'
  ) THEN
    ALTER TABLE public.user_progression
      ADD CONSTRAINT user_progression_review_count_check
      CHECK (review_count >= 0);
  END IF;
END $$;

ALTER TABLE public.user_progression
  ALTER COLUMN level SET DEFAULT 0;

COMMENT ON TABLE public.user_progression IS
  'Cached profile XP, fully rated count, review count, and level. Written only by private.recompute_user_progression.';

CREATE OR REPLACE FUNCTION private.recompute_user_progression(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp integer := 0;
  v_count integer := 0;
  v_reviews integer := 0;
  v_level smallint := 0;
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

  SELECT COUNT(*)::integer
  INTO v_reviews
  FROM public.album_reviews
  WHERE user_id = p_user_id;

  v_level := CASE
    WHEN v_count >= 25 AND v_reviews >= 2 THEN 5
    WHEN v_count >= 20 AND v_reviews >= 1 THEN 4
    WHEN v_count >= 15 THEN 3
    WHEN v_count >= 10 THEN 2
    WHEN v_count >= 5 THEN 1
    ELSE 0
  END;

  INSERT INTO public.user_progression (
    user_id, xp, level, fully_rated_count, review_count, updated_at
  )
  VALUES (p_user_id, v_xp, v_level, v_count, v_reviews, now())
  ON CONFLICT (user_id) DO UPDATE
    SET xp = EXCLUDED.xp,
        level = EXCLUDED.level,
        fully_rated_count = EXCLUDED.fully_rated_count,
        review_count = EXCLUDED.review_count,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION private.recompute_user_progression(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.recompute_user_progression(uuid) TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_album_reviews_recompute_user_progression ON public.album_reviews;
CREATE TRIGGER trg_album_reviews_recompute_user_progression
  AFTER INSERT OR UPDATE OR DELETE ON public.album_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_user_progression();

ALTER TABLE public.user_progression
  DROP CONSTRAINT IF EXISTS user_progression_level_check;

ALTER TABLE public.user_progression
  ADD CONSTRAINT user_progression_level_check
  CHECK (level >= 0 AND level <= 5);

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM private.recompute_user_progression(r.id);
  END LOOP;
END $$;
