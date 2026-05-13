"use client";

import { useAuth } from "@/context/AuthContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  FaStar,
  FaSignOutAlt,
  FaCog,
  FaMusic,
  FaCompactDisc,
  FaMicrophoneAlt,
  FaList,
  FaLayerGroup,
  FaChevronRight,
} from "react-icons/fa";
import AlbumGrid from "@/components/album/AlbumGrid";
import { Album } from "@/types/music";
import { FavoriteItem } from "@/components/profile/FavoriteStatsBar";
import ProfileLayout, { QuickLink } from "@/components/profile/ProfileLayout";

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
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="font-medium text-neutral-400 animate-pulse text-sm tracking-wide">
          Loading profile...
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
    <ProfileLayout
      user={{
        username,
        avatarUrl,
        subtitle: user.email,
      }}
      actions={
        <>
          <Link
            href="/settings"
            className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <FaCog size={14} /> Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <FaSignOutAlt size={14} /> Log out
          </button>
        </>
      }
      quickLinks={
        <>
          <QuickLink icon={FaStar} label="Rated music" href="#" active />
          <QuickLink icon={FaMusic} label="Liked songs" href="#" />
          <QuickLink icon={FaCompactDisc} label="Liked albums" href="#" />
          <QuickLink icon={FaMicrophoneAlt} label="Favourite artists" href="#" />
          <QuickLink icon={FaList} label="Playlists" href="/profile/playlists" />
          <QuickLink icon={FaLayerGroup} label="Album collections" href="#" />
        </>
      }
    >
      <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-neutral-900 rounded-full" />
            Latest Rated Music
          </h2>

          <div className="flex bg-neutral-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
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
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id ? "bg-neutral-100 text-neutral-600" : "bg-neutral-200 text-neutral-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredAlbums.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaStar size={24} className="text-neutral-400" />
            </div>
            <p className="text-neutral-900 font-bold text-lg mb-1">
              No albums found
            </p>
            <p className="text-neutral-500 text-sm">
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
              gridCols={3}
              priorityCount={3}
            />
            {filteredAlbums.length > 12 && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/user/${username}`}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all duration-200"
                >
                  Show all {filteredAlbums.length} albums
                  <FaChevronRight size={12} />
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </ProfileLayout>
  );
}
