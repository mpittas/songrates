"use client";

import { useAuth } from "@/context/AuthContext";
import MySection from "@/components/ui/MySection";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  FaHeart,
  FaMusic,
  FaCompactDisc,
  FaMicrophoneAlt,
} from "react-icons/fa";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createSlug } from "@/lib/utils";

interface FavoriteItem {
  id: string;
  item_id: string;
  item_type: "track" | "album" | "artist";
  item_name: string | null;
  artist_name: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "favorites">("info");
  const [favoriteSubTab, setFavoriteSubTab] = useState<
    "discography" | "artists"
  >("discography");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch favorites
  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const supabase = createClient();
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

    fetchFavorites();
  }, [user]);

  if (loading) {
    return (
      <MySection className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="font-mono text-neutral-500 animate-pulse text-xs tracking-widest uppercase">
          Initializing...
        </div>
      </MySection>
    );
  }

  if (!user) {
    return null;
  }

  const renderFavoriteItem = (item: FavoriteItem) => {
    const isTrack = item.item_type === "track";
    const isAlbum = item.item_type === "album";
    const isArtist = item.item_type === "artist";

    let href = "#";
    if (isTrack) {
      href = `/track/${item.item_id}`;
    } else if (isAlbum && item.item_name) {
      href = `/album/${createSlug(item.item_name, item.item_id)}`;
    } else if (isArtist && item.item_name) {
      href = `/artist/${createSlug(item.item_name, item.item_id)}`;
    }

    return (
      <Link
        key={item.id}
        href={href}
        className="group flex items-center gap-4 p-3 bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-colors"
      >
        <div className="relative w-14 h-14 shrink-0 bg-neutral-800 overflow-hidden">
          {item.thumbnail_url ? (
            <OptimizedImage
              src={item.thumbnail_url}
              alt={item.item_name || "Unknown"}
              fill
              className="object-cover"
              fallbackSrc="/vinyl-placeholder.svg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              {isTrack && <FaMusic size={20} className="text-neutral-600" />}
              {isAlbum && (
                <FaCompactDisc size={20} className="text-neutral-600" />
              )}
              {isArtist && (
                <FaMicrophoneAlt size={20} className="text-neutral-600" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[#00f0ff] uppercase tracking-wider">
              {item.item_type}
            </span>
          </div>
          <h4 className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
            {item.item_name || "Unknown"}
          </h4>
          {item.artist_name && (
            <p className="text-xs text-neutral-500 truncate">
              {item.artist_name}
            </p>
          )}
        </div>

        <FaHeart size={14} className="text-red-500 shrink-0" />
      </Link>
    );
  };

  const favoriteStats = {
    tracks: favorites.filter((f) => f.item_type === "track").length,
    albums: favorites.filter((f) => f.item_type === "album").length,
    artists: favorites.filter((f) => f.item_type === "artist").length,
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col pt-10">
      <MySection>
        <div className="max-w-4xl">
          <div className="space-y-10">
            {/* Header section with very minimalistic typography */}
            <header className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-light tracking-tighter text-white">
                Profile
              </h1>
              <p className="text-white/40 text-xs md:text-sm font-mono tracking-widest uppercase">
                Account Information / System Settings
              </p>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/5">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === "info"
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Account Info
                {activeTab === "info" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0ff]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === "favorites"
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FaHeart size={12} className="text-red-500" />
                  Favorites
                  <span className="ml-1 text-xs text-neutral-500">
                    ({favorites.length})
                  </span>
                </span>
                {activeTab === "favorites" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0ff]" />
                )}
              </button>
            </div>

            {/* Info Tab */}
            {activeTab === "info" && (
              <div className="space-y-12">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
                    Identity
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-lg font-light text-white/90 tracking-tight">
                      @
                      {user.user_metadata?.username ||
                        user.email?.split("@")[0]}
                    </div>
                    <div className="text-sm font-mono text-white/40 tracking-tight">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Favorites Summary */}
                <div className="space-y-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
                    Your Favorites
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-neutral-900/40 border border-white/5 p-4 text-center">
                      <div className="text-2xl font-light text-white">
                        {favoriteStats.tracks}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">
                        Tracks
                      </div>
                    </div>
                    <div className="bg-neutral-900/40 border border-white/5 p-4 text-center">
                      <div className="text-2xl font-light text-white">
                        {favoriteStats.albums}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">
                        Albums
                      </div>
                    </div>
                    <div className="bg-neutral-900/40 border border-white/5 p-4 text-center">
                      <div className="text-2xl font-light text-white">
                        {favoriteStats.artists}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">
                        Artists
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col items-start gap-8">
                  <button
                    onClick={() => signOut()}
                    className="text-sm font-mono tracking-widest uppercase text-white/40 hover:text-red-400 transition-colors duration-300"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div className="space-y-6">
                {/* Sub-tabs */}
                <div className="flex items-center gap-1 border-b border-white/5">
                  <button
                    onClick={() => setFavoriteSubTab("discography")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      favoriteSubTab === "discography"
                        ? "text-white"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FaCompactDisc size={12} />
                      Discography
                      <span className="ml-1 text-xs text-neutral-500">
                        ({favoriteStats.tracks + favoriteStats.albums})
                      </span>
                    </span>
                    {favoriteSubTab === "discography" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0ff]" />
                    )}
                  </button>
                  <button
                    onClick={() => setFavoriteSubTab("artists")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      favoriteSubTab === "artists"
                        ? "text-white"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FaMicrophoneAlt size={12} />
                      Artists
                      <span className="ml-1 text-xs text-neutral-500">
                        ({favoriteStats.artists})
                      </span>
                    </span>
                    {favoriteSubTab === "artists" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0ff]" />
                    )}
                  </button>
                </div>

                {loadingFavorites ? (
                  <div className="py-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Discography Sub-tab */}
                    {favoriteSubTab === "discography" && (
                      <div className="space-y-4">
                        {favoriteStats.tracks + favoriteStats.albums === 0 ? (
                          <div className="py-20 text-center text-neutral-600 font-mono text-sm">
                            No liked tracks or albums yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {favorites
                              .filter(
                                (f) =>
                                  f.item_type === "track" ||
                                  f.item_type === "album",
                              )
                              .map(renderFavoriteItem)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Artists Sub-tab */}
                    {favoriteSubTab === "artists" && (
                      <div className="space-y-4">
                        {favoriteStats.artists === 0 ? (
                          <div className="py-20 text-center text-neutral-600 font-mono text-sm">
                            No liked artists yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {favorites
                              .filter((f) => f.item_type === "artist")
                              .map(renderFavoriteItem)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </MySection>
    </main>
  );
}
