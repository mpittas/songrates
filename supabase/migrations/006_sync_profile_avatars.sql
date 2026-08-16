-- Copy Google/auth avatars onto public profiles so reviews can show the real photo.

UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE u.id = p.id
  AND p.avatar_url IS NULL
  AND COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) IS NOT NULL;
