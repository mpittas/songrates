"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCompactDisc, FaHeart } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useDebounce } from "use-debounce";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import Button from "@/components/ui/Button";
import type { Album } from "@/types/music";

import type { LikedAlbumDTO } from "@/app/api/liked-albums/route";

const PAGE_SIZE = 24;

interface LikedAlbumsSectionProps {
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

export default function LikedAlbumsSection({
  userId,
  isPrivate = false,
}: LikedAlbumsSectionProps) {
  const [albums, setAlbums] = useState<LikedAlbumDTO[]>([]);
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

      const res = await fetch(`/api/liked-albums?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load liked albums");
      }

      const json = (await res.json()) as {
        albums: LikedAlbumDTO[];
        total: number;
        hasMore: boolean;
      };

      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(pageNum);
      setAlbums((prev) =>
        append ? [...prev, ...json.albums] : json.albums || [],
      );
    },
    [userId, debouncedSearchQuery],
  );

  useEffect(() => {
    if (isPrivate) {
      setAlbums([]);
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
        console.error("Failed to load liked albums:", e);
        if (!cancelled) {
          setAlbums([]);
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
      console.error("Failed to load more liked albums:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredAlbums = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter((a) => {
      const title = a.title?.toLowerCase() || "";
      const artist = a.artistName?.toLowerCase() || "";
      return title.includes(q) || artist.includes(q);
    });
  }, [albums, searchQuery]);

  const gridAlbums: Album[] = useMemo(
    () =>
      filteredAlbums.map((a) => ({
        id: a.albumId,
        title: a.title,
        artistName: a.artistName,
        artworkUrl: a.thumbnailUrl || undefined,
        releaseDate: a.releaseDate || undefined,
      })),
    [filteredAlbums],
  );

  return (
    <section>
      <ProfileSectionHeader
        title="Liked Albums"
        count={!isPrivate && !loading ? total : undefined}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search albums..."
      />

      {isPrivate ? (
        <EmptyState
          icon={FaCompactDisc}
          title="Liked albums are private"
          description="This user has chosen to hide their liked albums"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlbums.length === 0 ? (
        <EmptyState
          icon={FaHeart}
          title={searchQuery ? "No albums found" : "No liked albums yet"}
          description={
            searchQuery
              ? "Try a different search term"
              : "Like albums from any album page to see them here"
          }
        />
      ) : (
        <>
          <ArtistAlbumGridSection
            albums={gridAlbums}
            initialCount={PAGE_SIZE}
            ratingMode="any"
            onAlbumFavoriteChange={(albumId, liked) => {
              if (!liked) {
                setAlbums((prev) => prev.filter((a) => a.albumId !== albumId));
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
                  : `Load more (${albums.length} of ${total})`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
