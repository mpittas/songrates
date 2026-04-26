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
import MySection from "@/components/ui/MySection";
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
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");

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

  const allUserAlbums = useMemo(
    () => Object.values(albumRatings),
    [albumRatings],
  );

  const fullAlbumsCount = allUserAlbums.filter(
    (a) => a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0,
  ).length;

  const partialAlbumsCount = allUserAlbums.filter(
    (a) => a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks,
  ).length;

  // Build filtered albums from context
  const filteredAlbums: Album[] = useMemo(() => {
    return Object.values(albumRatings)
      .filter((a) => {
        if (activeTab === "all") return true;
        if (activeTab === "full") {
          return a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0;
        }
        return (
          a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks
        );
      })
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
  }, [albumRatings, ratings, activeTab]);

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
      <main className="min-h-screen flex items-center justify-center">
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

      {/* Profile Header — overlaps the banner */}
      <MySection className="relative -mt-20 md:-mt-24 z-10">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white border-4 border-[#ebe8e5] shadow-xl shrink-0">
              {avatarUrl ? (
                <OptimizedImage
                  src={avatarUrl}
                  alt={username}
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
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-900 border border-[#d6d6d6] hover:border-[#c3c3c3] bg-white transition-all duration-200 rounded"
              >
                <FaCog size={12} />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-neutral-600 hover:text-red-600 border border-[#d6d6d6] hover:border-red-300 bg-white transition-all duration-200 rounded"
              >
                <FaSignOutAlt size={12} />
                Log out
              </button>
            </div>
          </div>
        </div>
      </MySection>

      {/* Stats Bar */}
      <MySection className="mt-8">
        <div className="w-full max-w-4xl">
          <FavoriteStatsBar
            favorites={favorites}
            loading={loadingFavorites}
            albumRatings={albumRatingsLookup}
          />
        </div>
      </MySection>

      {/* Content Sections */}
      <MySection className="mt-12 pb-20">
        <div className="w-full max-w-4xl space-y-16">
          {/* Playlists Section */}
          <PlaylistsSection />

          <section>
            <div className="flex items-center gap-6 border-b border-[#dadada] mb-8">
              {[
                { id: "all", label: "All", count: allUserAlbums.length },
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

            {filteredAlbums.length === 0 ? (
              <div className="py-16 text-center border border-[#e1e1e1] bg-white rounded-md">
                <FaStar size={24} className="text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-600 font-mono text-sm">
                  No albums match this filter
                </p>
                <p className="text-neutral-700 text-xs mt-1">
                  {activeTab === "full"
                    ? "You haven't fully rated any albums yet"
                    : activeTab === "partial"
                      ? "You have no partially rated albums"
                      : "Rate tracks on any album page to see them here"}
                </p>
              </div>
            ) : (
              <>
                <AlbumGrid
                  albums={filteredAlbums.slice(0, 12)}
                  onSelectAlbum={() => {}}
                  layout="grid"
                  gridCols={4}
                  priorityCount={4}
                />
                {filteredAlbums.length > 12 && (
                  <div className="mt-6 flex justify-center">
                    <Link
                      href={`/user/${username}`}
                      className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-900 border border-[#d8d8d8] hover:border-[#c8c8c8] bg-white hover:bg-[#f8f8f8] transition-all duration-200 rounded"
                    >
                      Show all {filteredAlbums.length} albums
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </MySection>
    </main>
  );
}
