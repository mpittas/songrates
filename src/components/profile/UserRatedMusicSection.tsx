"use client";

import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useAlbumTrackCounts } from "@/hooks/useAlbumTrackCounts";
import { isFullyRatedAlbum, isPartiallyRatedAlbum } from "@/lib/albumPageStats";
import type { Album } from "@/types/music";

interface RatedAlbum {
  id: string;
  title: string;
  artistName: string;
  artworkUrl?: string;
  releaseDate?: string;
  rating: number | null;
  totalTracks: number;
  ratedTrackIds: string[];
  ratedAt: string;
}

export default function UserRatedMusicSection({ userId }: { userId: string }) {
  const [albums, setAlbums] = useState<RatedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUserAlbums = async () => {
      const supabase = createClient();

      const { data: userAlbums, error: albumsError } = await supabase
        .from("user_albums")
        .select("*")
        .eq("user_id", userId);

      if (albumsError) {
        console.error("Error fetching user albums:", albumsError);
        setLoading(false);
        return;
      }

      if (!userAlbums || userAlbums.length === 0) {
        setAlbums([]);
        setLoading(false);
        return;
      }

      const albumIds = (userAlbums as { album_id: string }[]).map(
        (a) => a.album_id,
      );
      const { data: ratings, error: ratingsError } = await supabase
        .from("ratings")
        .select("track_id, album_id, rating")
        .eq("user_id", userId)
        .in("album_id", albumIds);

      if (ratingsError) {
        console.error("Error fetching ratings:", ratingsError);
      }

      const albumTracksMap: Record<string, string[]> = {};
      const trackRatings: Record<string, number> = {};

      (
        ratings as { track_id: string; album_id: string; rating: number }[]
      )?.forEach((r) => {
        const value = Number(r.rating);
        if (!(value > 0)) return;
        trackRatings[r.track_id] = value;
        if (!albumTracksMap[r.album_id]) {
          albumTracksMap[r.album_id] = [];
        }
        albumTracksMap[r.album_id].push(r.track_id);
      });

      const ratedAlbums: RatedAlbum[] = (
        userAlbums as {
          album_id: string;
          title: string;
          artist_name: string;
          thumbnail_url: string | null;
          release_date: string;
          total_tracks: number;
          created_at: string;
        }[]
      ).map((album) => {
        const trackIds = albumTracksMap[album.album_id] || [];
        const trackRatingsList = trackIds.map((id) => trackRatings[id] || 0);
        const avgRating =
          trackRatingsList.length > 0
            ? trackRatingsList.reduce((a, b) => a + b, 0) /
              trackRatingsList.length
            : null;

        return {
          id: album.album_id,
          title: album.title,
          artistName: album.artist_name,
          artworkUrl: album.thumbnail_url || undefined,
          releaseDate: album.release_date,
          rating: avgRating,
          totalTracks: album.total_tracks,
          ratedTrackIds: trackIds,
          ratedAt: album.created_at,
        };
      });

      setAlbums(ratedAlbums);
      setLoading(false);
    };

    fetchUserAlbums();
  }, [userId]);

  const albumIds = useMemo(() => albums.map((album) => album.id), [albums]);
  const trackCounts = useAlbumTrackCounts(albumIds);

  const albumsWithTrackCounts = useMemo(
    () =>
      albums.map((album) => ({
        ...album,
        totalTracks: trackCounts[album.id] || album.totalTracks,
      })),
    [albums, trackCounts],
  );

  const fullAlbumsCount = albumsWithTrackCounts.filter((a) =>
    isFullyRatedAlbum(a.ratedTrackIds.length, a.totalTracks),
  ).length;

  const partialAlbumsCount = albumsWithTrackCounts.filter((a) =>
    isPartiallyRatedAlbum(a.ratedTrackIds.length, a.totalTracks),
  ).length;

  const filteredAlbums: Album[] = useMemo(() => {
    return albumsWithTrackCounts
      .filter((album) => {
        if (activeTab === "all") return true;
        if (activeTab === "full") {
          return isFullyRatedAlbum(
            album.ratedTrackIds.length,
            album.totalTracks,
          );
        }
        return isPartiallyRatedAlbum(
          album.ratedTrackIds.length,
          album.totalTracks,
        );
      })
      .filter((album) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          album.title.toLowerCase().includes(q) ||
          album.artistName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.ratedAt || "").localeCompare(a.ratedAt || ""))
      .map((album) => ({
        id: album.id,
        title: album.title,
        artistName: album.artistName,
        artworkUrl: album.artworkUrl,
        releaseDate: album.releaseDate,
        rating: album.rating,
      }));
  }, [albumsWithTrackCounts, activeTab, searchQuery]);

  return (
    <section>
      <ProfileSectionHeader
        title="Rated Albums"
        filters={[
          { id: "all", label: "All", count: albums.length },
          { id: "full", label: "Fully rated", count: fullAlbumsCount },
          {
            id: "partial",
            label: "Partially rated",
            count: partialAlbumsCount,
          },
        ]}
        activeFilterId={activeTab}
        onFilterChange={(id) => setActiveTab(id as "all" | "full" | "partial")}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search albums..."
      />

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
        </div>
      ) : filteredAlbums.length === 0 ? (
        <EmptyState
          icon={<FaStar size={20} />}
          title="No albums found"
          description={
            activeTab === "full"
              ? "This user hasn't fully rated any albums yet"
              : activeTab === "partial"
                ? "This user has no partially rated albums"
                : "This user hasn't added any albums yet"
          }
        />
      ) : (
        <ArtistAlbumGridSection
          albums={filteredAlbums}
          initialCount={12}
          ratingMode="any"
        />
      )}
    </section>
  );
}
