-- Public album stats should count distinct raters, not individual song ratings.
-- average_rating is the mean of each user's album average so one person
-- rating 15 tracks still counts as 1 user.

CREATE INDEX IF NOT EXISTS ratings_album_id_positive_idx
  ON public.ratings (album_id)
  WHERE rating > 0;

CREATE OR REPLACE FUNCTION public.update_public_album_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
    target_album_id TEXT;
    new_avg NUMERIC;
    new_count INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_album_id := OLD.album_id;
    ELSE
        target_album_id := NEW.album_id;
    END IF;

    SELECT ROUND(AVG(user_avg), 2), COUNT(*)::integer
    INTO new_avg, new_count
    FROM (
        SELECT AVG(rating) AS user_avg
        FROM public.ratings
        WHERE album_id = target_album_id
          AND rating > 0
        GROUP BY user_id
    ) user_avgs;

    IF new_count IS NULL OR new_count = 0 THEN
        DELETE FROM public.public_album_ratings WHERE album_id = target_album_id;
    ELSE
        INSERT INTO public.public_album_ratings (
            album_id,
            average_rating,
            rating_count,
            updated_at
        )
        VALUES (target_album_id, new_avg, new_count, NOW())
        ON CONFLICT (album_id)
        DO UPDATE SET
            average_rating = EXCLUDED.average_rating,
            rating_count = EXCLUDED.rating_count,
            updated_at = NOW();
    END IF;

    RETURN NULL;
END;
$function$;

COMMENT ON COLUMN public.public_album_ratings.rating_count IS
  'Number of distinct users who have rated at least one track on the album.';
COMMENT ON COLUMN public.public_album_ratings.average_rating IS
  'Mean of each user''s average track rating on the album.';

INSERT INTO public.public_album_ratings (
    album_id,
    average_rating,
    rating_count,
    updated_at
)
SELECT
    album_id,
    ROUND(AVG(user_avg), 2),
    COUNT(*)::integer,
    NOW()
FROM (
    SELECT album_id, AVG(rating) AS user_avg
    FROM public.ratings
    WHERE rating > 0
    GROUP BY album_id, user_id
) user_album_avgs
GROUP BY album_id
ON CONFLICT (album_id)
DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    rating_count = EXCLUDED.rating_count,
    updated_at = NOW();

DELETE FROM public.public_album_ratings par
WHERE NOT EXISTS (
    SELECT 1
    FROM public.ratings r
    WHERE r.album_id = par.album_id
      AND r.rating > 0
);
