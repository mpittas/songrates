"use client";

import { useEffect, useMemo, useState } from "react";
import { FaMusic, FaHeart } from "react-icons/fa";
import type { IconType } from "react-icons";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import SongRow from "@/main-components/SongRow";
import { formatTime } from "@/lib/utils";

import type { LikedSongDTO } from "@/app/api/liked-songs/route";

interface LikedSongsSectionProps {
  userId: string;
  isPrivate?: boolean;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Icon size={24} className="text-neutral-400" />
      </div>
      <p className="text-neutral-900 font-bold text-lg mb-1">{title}</p>
      <p className="text-neutral-500 text-sm">{description}</p>
    </div>
  );
}

export default function LikedSongsSection({
  userId,
  isPrivate = false,
}: LikedSongsSectionProps) {
  const [songs, setSongs] = useState<LikedSongDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isPrivate) {
      setSongs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/liked-songs?userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) {
          if (!cancelled) setSongs([]);
          return;
        }
        const json = (await res.json()) as { songs: LikedSongDTO[] };
        if (!cancelled) setSongs(json.songs || []);
      } catch (e) {
        console.error("Failed to load liked songs:", e);
        if (!cancelled) setSongs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isPrivate]);

  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((song) => {
      const title = song.title?.toLowerCase() || "";
      const artist = song.artistName?.toLowerCase() || "";
      const album = song.albumName?.toLowerCase() || "";
      return title.includes(q) || artist.includes(q) || album.includes(q);
    });
  }, [songs, searchQuery]);

  return (
    <section>
      <ProfileSectionHeader
        title="Liked Songs"
        count={!isPrivate && !loading ? filteredSongs.length : undefined}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search songs..."
      />

      {isPrivate ? (
        <EmptyState
          icon={FaMusic}
          title="Liked songs are private"
          description="This user has chosen to hide their liked songs"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSongs.length === 0 ? (
        <EmptyState
          icon={FaHeart}
          title={searchQuery ? "No songs found" : "No liked songs yet"}
          description={
            searchQuery
              ? "Try a different search term"
              : "Like tracks from any album page to see them here"
          }
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredSongs.map((song, i) => {
            const albumTitle = song.albumName || "Unknown Album";
            const duration = song.durationMs
              ? formatTime(song.durationMs, "milliseconds")
              : "--:--";

            return (
              <SongRow
                key={song.id}
                index={i + 1}
                onFavoriteChange={(liked) => {
                  if (!liked) {
                    setSongs((prev) =>
                      prev.filter((s) => s.trackId !== song.trackId),
                    );
                    return;
                  }
                  setSongs((prev) => {
                    if (prev.some((s) => s.trackId === song.trackId)) {
                      return prev;
                    }
                    return [song, ...prev];
                  });
                }}
                title={song.title}
                artist={song.artistName}
                album={albumTitle}
                duration={duration}
                artworkUrl={song.thumbnailUrl}
                artistId={song.artistId || undefined}
                track={{
                  id: song.trackId,
                  title: song.title,
                  artistName: song.artistName,
                  artistId: song.artistId || undefined,
                  artists: song.artists,
                  albumId: song.albumId || undefined,
                  albumTitle: song.albumName || undefined,
                  albumImageUrl: song.thumbnailUrl || undefined,
                  length: song.durationMs ?? undefined,
                }}
                albumId={song.albumId || undefined}
                albumContext={
                  song.albumId
                    ? {
                        albumId: song.albumId,
                        title: albumTitle,
                        artistName: song.artistName,
                        totalTracks: 1,
                        artworkUrl: song.thumbnailUrl || undefined,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
