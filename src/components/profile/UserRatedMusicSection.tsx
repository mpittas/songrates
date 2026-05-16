"use client";

import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
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
        trackRatings[r.track_id] = Number(r.rating);
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

  const fullAlbumsCount = albums.filter(
    (a) => a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0,
  ).length;

  const partialAlbumsCount = albums.filter(
    (a) => a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks,
  ).length;

  const filteredAlbums: Album[] = useMemo(() => {
    return albums
      .filter((album) => {
        if (activeTab === "all") return true;
        if (activeTab === "full") {
          return (
            album.ratedTrackIds.length >= album.totalTracks &&
            album.totalTracks > 0
          );
        }
        return (
          album.ratedTrackIds.length > 0 &&
          album.ratedTrackIds.length < album.totalTracks
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
  }, [albums, activeTab, searchQuery]);

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
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FaStar size={24} className="text-neutral-400" />
          </div>
          <p className="text-neutral-900 font-bold text-lg mb-1">No albums found</p>
          <p className="text-neutral-500 text-sm">
            {activeTab === "full"
              ? "This user hasn't fully rated any albums yet"
              : activeTab === "partial"
                ? "This user has no partially rated albums"
                : "This user hasn't added any albums yet"}
          </p>
        </div>
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
