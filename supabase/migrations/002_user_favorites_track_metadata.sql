ALTER TABLE public.user_favorites
  ADD COLUMN IF NOT EXISTS album_id text,
  ADD COLUMN IF NOT EXISTS album_name text,
  ADD COLUMN IF NOT EXISTS duration_ms integer;
