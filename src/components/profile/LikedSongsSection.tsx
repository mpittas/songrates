"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaMusic, FaHeart } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useDebounce } from "use-debounce";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import SharedEmptyState from "@/components/ui/EmptyState";
import SongRow from "@/main-components/SongRow";
import TrackList from "@/components/ui/TrackList";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";

import type { LikedSongDTO } from "@/app/api/liked-songs/route";

const PAGE_SIZE = 24;

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
    <SharedEmptyState
      icon={<Icon size={20} />}
      title={title}
      description={description}
    />
  );
}

export default function LikedSongsSection({
  userId,
  isPrivate = false,
}: LikedSongsSectionProps) {
  const [songs, setSongs] = useState<LikedSongDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 350);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const params = new URLSearchParams({
        userId,
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearchQuery.trim()) {
        params.set("q", debouncedSearchQuery.trim());
      }

      const res = await fetch(`/api/liked-songs?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load liked songs");
      }

      const json = (await res.json()) as {
        songs: LikedSongDTO[];
        total: number;
        hasMore: boolean;
      };

      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(pageNum);
      const nextSongs = json.songs || [];
      setSongs((prev) => (append ? [...prev, ...nextSongs] : nextSongs));
    },
    [userId, debouncedSearchQuery],
  );

  useEffect(() => {
    if (isPrivate) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await fetchPage(1, false);
      } catch (e) {
        console.error("Failed to load liked songs:", e);
        if (!cancelled) {
          setSongs([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isPrivate, fetchPage]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } catch (e) {
      console.error("Failed to load more liked songs:", e);
    } finally {
      setLoadingMore(false);
    }
  };

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
        count={!isPrivate && !loading ? total : undefined}
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
          <div className="size-6 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
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
        <>
          <TrackList>
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
                      setTotal((value) => Math.max(0, value - 1));
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
                          artworkUrl: song.thumbnailUrl || undefined,
                        }
                      : undefined
                  }
                />
              );
            })}
          </TrackList>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="border"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? "Loading..."
                  : `Load more (${songs.length} of ${total})`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
