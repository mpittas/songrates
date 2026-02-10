"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import MySection from "@/components/ui/MySection";
import AlbumGrid from "@/components/album/AlbumGrid";
import { FaUser, FaCalendarAlt } from "react-icons/fa";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

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

interface UserProfileClientProps {
  profile: UserProfile;
}

export default function UserProfileClient({ profile }: UserProfileClientProps) {
  const [albums, setAlbums] = useState<RatedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortFilter, setSortFilter] = useState<string>("newest");

  useEffect(() => {
    const fetchUserAlbums = async () => {
      const supabase = createClient();

      // Fetch user's albums from user_albums table
      const { data: userAlbums, error: albumsError } = await supabase
        .from("user_albums")
        .select("*")
        .eq("user_id", profile.id);

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

      // Fetch ratings for all tracks in these albums
      const albumIds = userAlbums.map((a) => a.album_id);
      const { data: ratings, error: ratingsError } = await supabase
        .from("ratings")
        .select("track_id, album_id, rating")
        .eq("user_id", profile.id)
        .in("album_id", albumIds);

      if (ratingsError) {
        console.error("Error fetching ratings:", ratingsError);
      }

      // Group track IDs by album
      const albumTracksMap: Record<string, string[]> = {};
      const trackRatings: Record<string, number> = {};

      ratings?.forEach((r) => {
        trackRatings[r.track_id] = Number(r.rating);
        if (!albumTracksMap[r.album_id]) {
          albumTracksMap[r.album_id] = [];
        }
        albumTracksMap[r.album_id].push(r.track_id);
      });

      // Calculate album ratings and build album list
      const ratedAlbums: RatedAlbum[] = userAlbums.map((album) => {
        const trackIds = albumTracksMap[album.album_id] || [];
        const trackRatingsList = trackIds.map((id) => trackRatings[id] || 0);
        const avgRating =
          trackRatingsList.length > 0
            ? trackRatingsList.reduce((a, b) => a + b, 0) / trackRatingsList.length
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
  }, [profile.id]);

  const sortedAlbums = useMemo(() => {
    return [...albums].sort((a, b) => {
      if (sortFilter === "newest") {
        return (b.ratedAt || "").localeCompare(a.ratedAt || "");
      }
      if (sortFilter === "oldest") {
        return (a.ratedAt || "").localeCompare(b.ratedAt || "");
      }
      if (sortFilter === "artist") {
        const artistCompare = (a.artistName || "").localeCompare(b.artistName || "");
        if (artistCompare !== 0) return artistCompare;
        return a.title.localeCompare(b.title);
      }
      if (sortFilter === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortFilter === "rating") {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA; // Highest first
      }
      return 0;
    });
  }, [albums, sortFilter]);

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fullAlbumsCount = albums.filter(
    (a) => a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0
  ).length;

  const partialAlbumsCount = albums.filter(
    (a) => a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks
  ).length;

  return (
    <main className="min-h-screen bg-[#050507]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - User Profile */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Profile Card */}
              <div className="bg-neutral-900/40 border border-white/5 p-6 space-y-6">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/10">
                    {profile.avatar_url ? (
                      <OptimizedImage
                        src={profile.avatar_url}
                        alt={profile.username}
                        fill
                        className="object-cover"
                        fallbackSrc="/vinyl-placeholder.svg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <FaUser size={48} className="text-neutral-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    @{profile.username}
                  </h1>
                  {profile.display_name && (
                    <p className="text-neutral-400 text-sm">
                      {profile.display_name}
                    </p>
                  )}
                </div>

                {/* Member Since */}
                <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs">
                  <FaCalendarAlt size={12} />
                  <span>Member since {memberSince}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-xl font-light text-white">
                      {fullAlbumsCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Full Ratings
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-light text-white">
                      {partialAlbumsCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Partial Ratings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - Rated Albums */}
          <div className="flex-1 min-w-0">
            <MySection className="pt-0">
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-light tracking-tight text-white">
                      Rated Albums
                    </h2>
                    <p className="text-neutral-500 text-sm font-mono mt-1">
                      {albums.length} album{albums.length !== 1 ? "s" : ""} rated
                    </p>
                  </div>

                  {/* Sort Filter */}
                  <select
                    value={sortFilter}
                    onChange={(e) => setSortFilter(e.target.value)}
                    className="bg-neutral-900 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00f0ff]/50"
                  >
                    <option value="newest">Latest Rated</option>
                    <option value="oldest">Oldest Rated</option>
                    <option value="rating">Highest Rated</option>
                    <option value="artist">Artist (A-Z)</option>
                    <option value="title">Album (A-Z)</option>
                  </select>
                </div>

                {/* Albums Grid */}
                {loading ? (
                  <div className="py-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : albums.length === 0 ? (
                  <div className="py-20 text-center text-neutral-600 font-mono text-sm">
                    No rated albums yet.
                  </div>
                ) : (
                  <AlbumGrid
                    albums={sortedAlbums}
                    onSelectAlbum={() => {}}
                    layout="grid"
                    gridCols={3}
                  />
                )}
              </div>
            </MySection>
          </div>
        </div>
      </div>
    </main>
  );
}
