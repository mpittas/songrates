-- Recently clicked search results for logged-in users
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    result_id TEXT NOT NULL,
    result_type TEXT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, result_id)
);

-- Fast lookup of a user's most recently clicked results
CREATE INDEX IF NOT EXISTS idx_user_searches_user_recent
    ON public.user_searches(user_id, created_at DESC);

ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own searches" ON public.user_searches;
CREATE POLICY "Users can view own searches"
    ON public.user_searches FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own searches" ON public.user_searches;
CREATE POLICY "Users can insert own searches"
    ON public.user_searches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own searches" ON public.user_searches;
CREATE POLICY "Users can update own searches"
    ON public.user_searches FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own searches" ON public.user_searches;
CREATE POLICY "Users can delete own searches"
    ON public.user_searches FOR DELETE
    USING (auth.uid() = user_id);
