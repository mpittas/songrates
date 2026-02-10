-- Playlists schema for songrates
-- Run this in Supabase SQL Editor

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create playlist_tracks table
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    track_name TEXT,
    artist_name TEXT,
    album_name TEXT,
    thumbnail_url TEXT,
    duration_ms INTEGER,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(playlist_id, track_id)
);

-- Create index for faster playlist lookups
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists
CREATE POLICY "Users can view own playlists"
    ON playlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own playlists"
    ON playlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
    ON playlists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
    ON playlists FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for playlist_tracks
CREATE POLICY "Users can view tracks in own playlists"
    ON playlist_tracks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add tracks to own playlists"
    ON playlist_tracks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tracks in own playlists"
    ON playlist_tracks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove tracks from own playlists"
    ON playlist_tracks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
