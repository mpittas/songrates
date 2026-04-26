"use client";

import { useEffect, useMemo, useState } from "react";
import AlbumGrid from "@/components/album/AlbumGrid";
import { FaUser, FaCalendarAlt, FaStar } from "react-icons/fa";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createClient } from "@/utils/supabase/client";
import FavoriteStatsBar, {
  FavoriteItem,
} from "@/components/profile/FavoriteStatsBar";
import PublicPlaylistsSection from "@/components/profile/PublicPlaylistsSection";
import MySection from "@/components/ui/MySection";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  show_favorites: boolean;
  show_playlists: boolean;
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
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [sortFilter, setSortFilter] = useState<string>("newest");
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");

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
      const albumIds = (userAlbums as { album_id: string }[]).map(
        (a) => a.album_id,
      );
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

      (
        ratings as { track_id: string; album_id: string; rating: number }[]
      )?.forEach((r) => {
        trackRatings[r.track_id] = Number(r.rating);
        if (!albumTracksMap[r.album_id]) {
          albumTracksMap[r.album_id] = [];
        }
        albumTracksMap[r.album_id].push(r.track_id);
      });

      // Calculate album ratings and build album list
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

    const fetchFavorites = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching favorites:", error);
        setLoadingFavorites(false);
        return;
      }

      setFavorites(data || []);
      setLoadingFavorites(false);
    };

    fetchUserAlbums();
    if (profile.show_favorites) {
      fetchFavorites();
    } else {
      setLoadingFavorites(false);
    }
  }, [profile.id, profile.show_favorites]);

  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
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
    });
  }, [albums, activeTab]);

  const sortedAlbums = useMemo(() => {
    return [...filteredAlbums].sort((a, b) => {
      if (sortFilter === "newest") {
        return (b.ratedAt || "").localeCompare(a.ratedAt || "");
      }
      if (sortFilter === "oldest") {
        return (a.ratedAt || "").localeCompare(b.ratedAt || "");
      }
      if (sortFilter === "artist") {
        const artistCompare = (a.artistName || "").localeCompare(
          b.artistName || "",
        );
        if (artistCompare !== 0) return artistCompare;
        return a.title.localeCompare(b.title);
      }
      if (sortFilter === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortFilter === "rating") {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      }
      return 0;
    });
  }, [filteredAlbums, sortFilter]);

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fullAlbumsCount = albums.filter(
    (a) => a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0,
  ).length;

  const partialAlbumsCount = albums.filter(
    (a) => a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks,
  ).length;

  // Build album ratings lookup for track linking in favorites modal
  const albumRatingsLookup = useMemo(() => {
    const lookup: Record<
      string,
      { id: string; title: string; ratedTrackIds: string[] }
    > = {};
    albums.forEach((album) => {
      lookup[album.id] = {
        id: album.id,
        title: album.title,
        ratedTrackIds: album.ratedTrackIds,
      };
    });
    return lookup;
  }, [albums]);

  return (
    <main className="min-h-screen">
      {/* Cover Art Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        <img
          src="/profile-cover.svg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ebe8e5]" />
      </div>

      {/* Profile Header */}
      <MySection className="relative -mt-20 md:-mt-24 z-10">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white border-4 border-[#ebe8e5] shadow-xl shrink-0">
              {profile.avatar_url ? (
                <OptimizedImage
                  src={profile.avatar_url}
                  alt={profile.username}
                  fill
                  className="object-cover"
                  fallbackSrc="/vinyl-placeholder.svg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#efefef]">
                  <FaUser size={40} className="text-neutral-600" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 pb-2">
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-neutral-900">
                @{profile.username}
              </h1>
              {profile.display_name && (
                <p className="text-sm text-neutral-400 mt-1">
                  {profile.display_name}
                </p>
              )}
              <div className="flex items-center gap-2 text-neutral-500 text-xs mt-2">
                <FaCalendarAlt size={12} />
                <span>Member since {memberSince}</span>
              </div>
            </div>

            {/* Rating Stats */}
            <div className="flex gap-4 shrink-0 pb-2">
              <div className="text-center px-4 py-2 bg-white border border-[#d9d9d9] rounded-sm">
                <div className="text-xl font-light text-neutral-900">
                  {fullAlbumsCount}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-neutral-500">
                  Full Ratings
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-white border border-[#d9d9d9] rounded-sm">
                <div className="text-xl font-light text-neutral-900">
                  {partialAlbumsCount}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-neutral-500">
                  Partial
                </div>
              </div>
            </div>
          </div>
        </div>
      </MySection>

      {/* Favorites Stats Bar */}
      {profile.show_favorites && (
        <MySection className="mt-10">
          <div className="w-full max-w-4xl">
            <FavoriteStatsBar
              favorites={favorites}
              loading={loadingFavorites}
              albumRatings={albumRatingsLookup}
            />
          </div>
        </MySection>
      )}

      {/* Playlists Section */}
      {profile.show_playlists && (
        <MySection className="mt-12">
          <div className="w-full max-w-4xl">
            <PublicPlaylistsSection userId={profile.id} />
          </div>
        </MySection>
      )}

      {/* Rated Albums Section */}
      <MySection className="mt-16 pb-20">
        <div className="w-full max-w-4xl">
          <div className="flex items-center gap-6 border-b border-[#dadada] mb-8">
            {[
              { id: "all", label: "All", count: albums.length },
              { id: "full", label: "Fully rated", count: fullAlbumsCount },
              {
                id: "partial",
                label: "Partially rated",
                count: partialAlbumsCount,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "all" | "full" | "partial")
                }
                className={`pb-3 text-lg font-light tracking-tight transition-colors relative ${
                  activeTab === tab.id
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs font-mono">{tab.count}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1f1f1f]" />
                )}
              </button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-neutral-500 text-sm font-mono">
              {filteredAlbums.length} album
              {filteredAlbums.length !== 1 ? "s" : ""}
            </p>
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="bg-white border border-[#d5d5d5] text-neutral-900 text-sm px-3 py-2 focus:outline-none focus:border-[#bcbcbc] rounded-sm"
            >
              <option value="newest">Latest Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="rating">Highest Rated</option>
              <option value="artist">Artist (A-Z)</option>
              <option value="title">Album (A-Z)</option>
            </select>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="py-16 text-center border border-[#e1e1e1] bg-white rounded-md">
              <FaStar size={24} className="text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-600 font-mono text-sm">
                No albums match this filter
              </p>
              <p className="text-neutral-700 text-xs mt-1">
                {activeTab === "full"
                  ? "This user hasn't fully rated any albums yet"
                  : activeTab === "partial"
                    ? "This user has no partially rated albums"
                    : "This user hasn't added any albums yet"}
              </p>
            </div>
          ) : (
            <>
              <AlbumGrid
                albums={sortedAlbums}
                onSelectAlbum={() => {}}
                layout="grid"
                gridCols={4}
                priorityCount={4}
              />
            </>
          )}
        </div>
      </MySection>
    </main>
  );
}
