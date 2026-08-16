-- Album-level written reviews (Albums and EPs only).
-- A review can be inserted/updated only when the author has rated every track.

CREATE OR REPLACE FUNCTION public.user_has_fully_rated_album(p_user_id uuid, p_album_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_albums ua
    WHERE ua.user_id = p_user_id
      AND ua.album_id = p_album_id
      AND ua.total_tracks > 0
      AND (
        SELECT COUNT(*)::integer
        FROM public.ratings r
        WHERE r.user_id = p_user_id
          AND r.album_id = p_album_id
          AND r.rating > 0
      ) >= ua.total_tracks
  );
$$;

CREATE TABLE IF NOT EXISTS public.album_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id text NOT NULL,
  album_title text,
  artist_name text,
  album_type text NOT NULL,
  body text NOT NULL,
  score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT album_reviews_user_album_unique UNIQUE (user_id, album_id),
  CONSTRAINT album_reviews_body_length CHECK (char_length(btrim(body)) >= 10 AND char_length(body) <= 2000),
  CONSTRAINT album_reviews_score_range CHECK (score >= 1 AND score <= 10),
  CONSTRAINT album_reviews_type_check CHECK (album_type IN ('Album', 'EP'))
);

CREATE INDEX IF NOT EXISTS idx_album_reviews_album_id_created_at
  ON public.album_reviews (album_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_album_reviews_user_id
  ON public.album_reviews (user_id);

ALTER TABLE public.album_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read album reviews"
  ON public.album_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own album reviews"
  ON public.album_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_fully_rated_album(auth.uid(), album_id)
  );

CREATE POLICY "Users can update own album reviews"
  ON public.album_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_fully_rated_album(auth.uid(), album_id)
  );

CREATE POLICY "Users can delete own album reviews"
  ON public.album_reviews FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT ON public.album_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.album_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_fully_rated_album(uuid, text) TO anon, authenticated;
