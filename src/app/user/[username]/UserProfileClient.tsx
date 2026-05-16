"use client";

import { useEffect, useMemo, useState } from "react";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import {
  FaCalendarAlt,
  FaStar,
  FaMusic,
  FaCompactDisc,
  FaMicrophoneAlt,
  FaList,
  FaLayerGroup,
} from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { FavoriteItem } from "@/components/profile/FavoriteStatsBar";
import PublicPlaylistsSection from "@/components/profile/PublicPlaylistsSection";
import ProfileLayout, { QuickLink } from "@/components/profile/ProfileLayout";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";

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
    <ProfileLayout
      user={{
        username: profile.username,
        avatarUrl: profile.avatar_url,
        subtitle: (
          <>
            <FaCalendarAlt size={12} className="text-neutral-400" />
            <span>Member since {memberSince}</span>
          </>
        )
      }}
      quickLinks={
        profile.show_favorites || profile.show_playlists ? (
          <>
            <QuickLink icon={FaStar} label="Rated music" href="#" active />
            {profile.show_favorites && (
              <>
                <QuickLink icon={FaMusic} label="Liked songs" href="#" />
                <QuickLink icon={FaCompactDisc} label="Liked albums" href="#" />
                <QuickLink icon={FaMicrophoneAlt} label="Favourite artists" href="#" />
              </>
            )}
            {profile.show_playlists && (
              <QuickLink icon={FaList} label="Playlists" href="#" />
            )}
            <QuickLink icon={FaLayerGroup} label="Album collections" href="#" />
          </>
        ) : null
      }
    >
      {/* Playlists Section */}
      {profile.show_playlists && (
        <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-6 sm:p-8">
          <ProfileSectionHeader title="Public Playlists" headerClassName="mb-6" />
          <PublicPlaylistsSection userId={profile.id} />
        </section>
      )}

      {/* Rated Albums Section */}
      <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-6 sm:p-8">
        <ProfileSectionHeader
          title="Rated Music"
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
          onFilterChange={(id) =>
            setActiveTab(id as "all" | "full" | "partial")
          }
          footer={
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
              <p className="text-neutral-500 text-sm font-medium">
                Showing {filteredAlbums.length} album
                {filteredAlbums.length !== 1 ? "s" : ""}
              </p>
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-700 text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 font-medium cursor-pointer"
              >
                <option value="newest">Latest Added</option>
                <option value="oldest">Oldest Added</option>
                <option value="rating">Highest Rated</option>
                <option value="artist">Artist (A-Z)</option>
                <option value="title">Album (A-Z)</option>
              </select>
            </div>
          }
        />

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaStar size={24} className="text-neutral-400" />
            </div>
            <p className="text-neutral-900 font-bold text-lg mb-1">
              No albums match this filter
            </p>
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
            albums={sortedAlbums}
            initialCount={12}
            ratingMode="any"
          />
        )}
      </section>
    </ProfileLayout>
  );
}
