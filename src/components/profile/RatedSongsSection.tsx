"use client";

import { useCallback, useEffect, useState } from "react";
import { FaMusic, FaStar } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useDebounce } from "use-debounce";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import SharedEmptyState from "@/components/ui/EmptyState";
import SongRow from "@/main-components/SongRow";
import TrackList from "@/components/ui/TrackList";
import Button from "@/components/ui/Button";
import DropdownFilter from "@/components/ui/DropdownFilter";
import { formatTime } from "@/lib/utils";
import { useRatingsContext } from "@/context/RatingsContext";
import type { RatedSongDTO } from "@/app/api/rated-songs/route";
import type { AlbumContext } from "@/types/music";

const PAGE_SIZE = 20;
type SortOption = "newest" | "oldest" | "title" | "artist";
const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Newest added", value: "newest" },
  { label: "Oldest added", value: "oldest" },
  { label: "Title (A-Z)", value: "title" },
  { label: "Artist (A-Z)", value: "artist" },
];

interface RatedSongsSectionProps {
  userId: string;
  isPrivate?: boolean;
  /** Allow changing ratings inline (own profile only). */
  editable?: boolean;
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

export default function RatedSongsSection({
  userId,
  isPrivate = false,
  editable = false,
}: RatedSongsSectionProps) {
  const { setRating } = useRatingsContext();
  const [songs, setSongs] = useState<RatedSongDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 350);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const res = await fetch(
        `/api/rated-songs?userId=${encodeURIComponent(userId)}&page=${pageNum}&limit=${PAGE_SIZE}&sort=${sort}&q=${encodeURIComponent(debouncedSearchQuery)}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load rated songs");
      }
      const json = (await res.json()) as {
        songs: RatedSongDTO[];
        total: number;
        hasMore: boolean;
      };
      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(pageNum);
      setSongs((prev) => (append ? [...prev, ...json.songs] : json.songs));
    },
    [userId, sort, debouncedSearchQuery],
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
        console.error("Failed to load rated songs:", e);
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
      console.error("Failed to load more rated songs:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRate = useCallback(
    (song: RatedSongDTO, rating: number) => {
      if (!editable) return;
      if (!song.albumId || !song.albumName) return;

      const albumContext: AlbumContext = {
        albumId: song.albumId,
        title: song.albumName,
        artistName: song.artistName,
        artworkUrl: song.thumbnailUrl || undefined,
      };

      setRating(song.trackId, rating, albumContext);

      if (rating <= 0) {
        setSongs((prev) => prev.filter((s) => s.trackId !== song.trackId));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        setSongs((prev) =>
          prev.map((s) =>
            s.trackId === song.trackId ? { ...s, rating } : s,
          ),
        );
      }
    },
    [editable, setRating],
  );

  return (
    <section>
      <ProfileSectionHeader
        title="Liked Songs"
        count={!isPrivate && !loading ? total : undefined}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search songs..."
        trailing={
          !isPrivate ? (
            <div className="w-[170px]">
              <DropdownFilter
                options={sortOptions}
                value={sort}
                onChange={setSort}
              />
            </div>
          ) : undefined
        }
      />

      {isPrivate ? (
        <EmptyState
          icon={FaMusic}
          title="Rated songs are private"
          description="This user has chosen to hide their liked songs"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
        </div>
      ) : songs.length === 0 ? (
        <EmptyState
          icon={FaStar}
          title="No liked songs yet"
          description="Like tracks on any album page to see them here"
        />
      ) : (
        <>
          <TrackList>
            {songs.map((song, i) => {
              const albumTitle = song.albumName || "Unknown Album";
              const duration = song.durationMs
                ? formatTime(song.durationMs, "milliseconds")
                : "--:--";

              return (
                <SongRow
                  key={`${song.trackId}-${song.albumId}`}
                  index={i + 1}
                  title={song.title}
                  artist={song.artistName}
                  album={albumTitle}
                  duration={duration}
                  rating={song.rating}
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
                  onRate={
                    editable
                      ? (rating) => handleRate(song, rating)
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
