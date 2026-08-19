-- Profile leveling: cached XP / level from fully rated releases.
-- Keep XP weights and the level formula in sync with src/lib/profileProgression.ts.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE TABLE IF NOT EXISTS public.user_progression (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level smallint NOT NULL DEFAULT 1 CHECK (level >= 1),
  fully_rated_count integer NOT NULL DEFAULT 0 CHECK (fully_rated_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_progression IS
  'Cached profile XP and level. Written only by private.recompute_user_progression.';

CREATE INDEX IF NOT EXISTS ratings_user_id_album_id_positive_idx
  ON public.ratings (user_id, album_id)
  WHERE rating > 0;

ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read user progression" ON public.user_progression;
CREATE POLICY "Anyone can read user progression"
  ON public.user_progression
  FOR SELECT
  USING (true);

GRANT SELECT ON public.user_progression TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_progression FROM anon, authenticated;

-- XP from fully rated user_albums, weighted by album_type.
-- Guests (user_id not in auth.users) are ignored.
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

  v_level := (1 + floor(sqrt(v_xp / 100.0)))::smallint;

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

CREATE OR REPLACE FUNCTION public.trg_recompute_user_progression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM private.recompute_user_progression(OLD.user_id);
    RETURN OLD;
  END IF;

  PERFORM private.recompute_user_progression(NEW.user_id);

  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    PERFORM private.recompute_user_progression(OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_init_user_progression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_progression (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.recompute_user_progression(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recompute_user_progression() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_init_user_progression() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.recompute_user_progression(uuid) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.trg_recompute_user_progression() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.trg_init_user_progression() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_ratings_recompute_user_progression ON public.ratings;
CREATE TRIGGER trg_ratings_recompute_user_progression
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_user_progression();

DROP TRIGGER IF EXISTS trg_user_albums_insert_recompute_user_progression ON public.user_albums;
CREATE TRIGGER trg_user_albums_insert_recompute_user_progression
  AFTER INSERT OR DELETE ON public.user_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_user_progression();

DROP TRIGGER IF EXISTS trg_user_albums_update_recompute_user_progression ON public.user_albums;
CREATE TRIGGER trg_user_albums_update_recompute_user_progression
  AFTER UPDATE ON public.user_albums
  FOR EACH ROW
  WHEN (
    OLD.total_tracks IS DISTINCT FROM NEW.total_tracks
    OR OLD.album_type IS DISTINCT FROM NEW.album_type
  )
  EXECUTE FUNCTION public.trg_recompute_user_progression();

DROP TRIGGER IF EXISTS trg_profiles_init_user_progression ON public.profiles;
CREATE TRIGGER trg_profiles_init_user_progression
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_init_user_progression();

INSERT INTO public.user_progression (user_id)
SELECT u.id
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM private.recompute_user_progression(r.id);
  END LOOP;
END $$;
