ALTER TABLE public.user_favorites
  ADD COLUMN IF NOT EXISTS artist_id text,
  ADD COLUMN IF NOT EXISTS artists jsonb;
