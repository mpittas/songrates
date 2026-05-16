"use client";

import { useEffect, useMemo, useState } from "react";
import { FaCompactDisc, FaHeart } from "react-icons/fa";
import type { IconType } from "react-icons";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import type { Album } from "@/types/music";

import type { LikedAlbumDTO } from "@/app/api/liked-albums/route";

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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isPrivate) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/liked-albums?userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) {
          if (!cancelled) setAlbums([]);
          return;
        }
        const json = (await res.json()) as { albums: LikedAlbumDTO[] };
        if (!cancelled) setAlbums(json.albums || []);
      } catch (e) {
        console.error("Failed to load liked albums:", e);
        if (!cancelled) setAlbums([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isPrivate]);

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
        count={!isPrivate && !loading ? filteredAlbums.length : undefined}
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
        <ArtistAlbumGridSection
          albums={gridAlbums}
          initialCount={12}
          ratingMode="any"
          onAlbumFavoriteChange={(albumId, liked) => {
            if (!liked) {
              setAlbums((prev) => prev.filter((a) => a.albumId !== albumId));
            }
          }}
        />
      )}
    </section>
  );
}
