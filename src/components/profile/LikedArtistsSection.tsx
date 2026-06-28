"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaHeart, FaMicrophoneAlt } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useDebounce } from "use-debounce";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import ArtistGridSection from "@/components/artist/ArtistGridSection";
import Button from "@/components/ui/Button";
import type { ArtistCardArtist } from "@/components/artist/ArtistCard";

import type { LikedArtistDTO } from "@/app/api/liked-artists/route";

const PAGE_SIZE = 24;

interface LikedArtistsSectionProps {
  userId: string;
  isPrivate?: boolean;
  hideHeader?: boolean;
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

export default function LikedArtistsSection({
  userId,
  isPrivate = false,
  hideHeader = false,
}: LikedArtistsSectionProps) {
  const [artists, setArtists] = useState<LikedArtistDTO[]>([]);
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

      const res = await fetch(`/api/liked-artists?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load liked artists");
      }

      const json = (await res.json()) as {
        artists: LikedArtistDTO[];
        total: number;
        hasMore: boolean;
      };

      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(pageNum);
      setArtists((prev) =>
        append ? [...prev, ...json.artists] : json.artists || [],
      );
    },
    [userId, debouncedSearchQuery],
  );

  useEffect(() => {
    if (isPrivate) {
      setArtists([]);
      setTotal(0);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await fetchPage(1, false);
      } catch (e) {
        console.error("Failed to load liked artists:", e);
        if (!cancelled) {
          setArtists([]);
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
      console.error("Failed to load more liked artists:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => {
      const name = a.name?.toLowerCase() || "";
      const genres = (a.genres || []).join(" ").toLowerCase();
      return name.includes(q) || genres.includes(q);
    });
  }, [artists, searchQuery]);

  const gridArtists: ArtistCardArtist[] = useMemo(
    () =>
      filteredArtists.map((a) => ({
        id: a.artistId,
        name: a.name,
        artworkUrl: a.thumbnailUrl || undefined,
        genres: a.genres,
      })),
    [filteredArtists],
  );

  return (
    <section>
      {!hideHeader && (
        <ProfileSectionHeader
          title="Favourite Artists"
          count={!isPrivate && !loading ? total : undefined}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search artists..."
        />
      )}

      {isPrivate ? (
        <EmptyState
          icon={FaMicrophoneAlt}
          title="Favourite artists are private"
          description="This user has chosen to hide their favourite artists"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredArtists.length === 0 ? (
        <EmptyState
          icon={FaHeart}
          title={
            searchQuery ? "No artists found" : "No favourite artists yet"
          }
          description={
            searchQuery
              ? "Try a different search term"
              : "Like artists from any artist page to see them here"
          }
        />
      ) : (
        <>
          <ArtistGridSection
            artists={gridArtists}
            initialCount={PAGE_SIZE}
            onArtistFavoriteChange={(artistId, liked) => {
              if (!liked) {
                setArtists((prev) =>
                  prev.filter((a) => a.artistId !== artistId),
                );
                setTotal((value) => Math.max(0, value - 1));
              }
            }}
          />

          {hasMore && (
            <div className="mt-4 flex justify-center pb-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore
                  ? "Loading..."
                  : `Load more (${artists.length} of ${total})`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
