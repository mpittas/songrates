"use client";

import { useAuth } from "@/context/AuthContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { FaUser, FaStar, FaSignOutAlt, FaCog } from "react-icons/fa";
import OptimizedImage from "@/components/ui/OptimizedImage";
import AlbumGrid from "@/components/album/AlbumGrid";
import PlaylistsSection from "@/components/profile/PlaylistsSection";
import { Album } from "@/types/music";
import FavoriteStatsBar, {
  FavoriteItem,
} from "@/components/profile/FavoriteStatsBar";

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const { albumRatings, ratings } = useRatingsContext();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch profile username and favorites
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (data?.username) {
        setProfileUsername(data.username);
      }
    };

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching favorites:", error);
      } else {
        setFavorites(data || []);
      }
      setLoadingFavorites(false);
    };

    fetchProfile();
    fetchFavorites();
  }, [user]);

  // Build rated albums from context
  const ratedAlbums: Album[] = useMemo(() => {
    return Object.values(albumRatings)
      .filter((a) => a.ratedTrackIds.length > 0)
      .sort((a, b) => (b.ratedAt || "").localeCompare(a.ratedAt || ""))
      .map((a) => {
        let avgRating: number | null = null;
        if (a.ratedTrackIds.length > 0) {
          let sum = 0;
          let count = 0;
          a.ratedTrackIds.forEach((tId) => {
            if (ratings[tId]) {
              sum += ratings[tId];
              count++;
            }
          });
          if (count > 0) avgRating = sum / count;
        }
        return {
          id: a.id,
          title: a.title,
          artistName: a.artistName,
          artworkUrl: a.artworkUrl,
          releaseDate: a.releaseDate,
          rating: avgRating,
        };
      });
  }, [albumRatings, ratings]);

  // Build album ratings lookup for track linking in favorites modal
  const albumRatingsLookup = useMemo(() => {
    const lookup: Record<
      string,
      { id: string; title: string; ratedTrackIds: string[] }
    > = {};
    Object.values(albumRatings).forEach((album) => {
      lookup[album.id] = {
        id: album.id,
        title: album.title,
        ratedTrackIds: album.ratedTrackIds,
      };
    });
    return lookup;
  }, [albumRatings]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="font-mono text-neutral-500 animate-pulse text-xs tracking-widest uppercase">
          Initializing...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const username =
    profileUsername ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "user";
  const avatarUrl = user.user_metadata?.avatar_url || null;

  return (
    <main className="min-h-screen bg-[#050507]">
      {/* Cover Art Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        <img
          src="/profile-cover.svg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050507]" />
      </div>

      {/* Profile Header — overlaps the banner */}
      <div className="relative max-w-4xl mx-auto px-6 -mt-20 md:-mt-24 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-neutral-900 border-4 border-[#050507] shadow-2xl shrink-0">
            {avatarUrl ? (
              <OptimizedImage
                src={avatarUrl}
                alt={username}
                fill
                className="object-cover"
                fallbackSrc="/vinyl-placeholder.svg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                <FaUser size={40} className="text-neutral-600" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 pb-2">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">
              @{username}
            </h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              {user.email}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-[#00f0ff] border border-white/5 hover:border-[#00f0ff]/20 bg-neutral-900/40 transition-all duration-200"
            >
              <FaCog size={12} />
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-red-400 border border-white/5 hover:border-red-400/20 bg-neutral-900/40 transition-all duration-200"
            >
              <FaSignOutAlt size={12} />
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <FavoriteStatsBar
          favorites={favorites}
          loading={loadingFavorites}
          albumRatings={albumRatingsLookup}
        />
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 mt-12 pb-20 space-y-16">
        {/* Playlists Section */}
        <PlaylistsSection />

        {/* Rated Music Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-[#00f0ff]" />
            <h2 className="text-lg font-light tracking-tight text-white">
              Rated Music
            </h2>
            <span className="text-xs text-neutral-600 font-mono">
              {ratedAlbums.length}
            </span>
          </div>

          {ratedAlbums.length === 0 ? (
            <div className="py-16 text-center border border-white/[0.04] bg-neutral-900/20">
              <FaStar size={24} className="text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-600 font-mono text-sm">
                No rated albums yet
              </p>
              <p className="text-neutral-700 text-xs mt-1">
                Rate tracks on any album page to see them here
              </p>
            </div>
          ) : (
            <>
              <AlbumGrid
                albums={ratedAlbums.slice(0, 12)}
                onSelectAlbum={() => {}}
                layout="grid"
                gridCols={4}
                priorityCount={4}
              />
              {ratedAlbums.length > 12 && (
                <div className="mt-6 flex justify-center">
                  <Link
                    href={`/user/${username}`}
                    className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white border border-white/[0.06] hover:border-[#00f0ff]/30 bg-neutral-900/30 hover:bg-neutral-900/50 transition-all duration-200"
                  >
                    Show all {ratedAlbums.length} albums
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
