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
import { BsThreeDotsVertical } from "react-icons/bs";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import { Album } from "@/types/music";
import type { Playlist } from "@/types/playlist";
import ProfileLayout, { QuickLink } from "@/components/profile/ProfileLayout";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";

type PlaylistWithCount = Playlist & { itemCount: number };

type PlaylistWithCountRow = Playlist & {
  playlist_tracks?: { count: number }[];
  playlist_albums?: { count: number }[];
};

type ProfileContentTab = "rated" | "playlists";

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const { albumRatings, ratings } = useRatingsContext();
  const router = useRouter();
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] =
    useState<ProfileContentTab>("rated");
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

    const fetchPlaylists = async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select(
          "id, user_id, name, type, created_at, updated_at, playlist_tracks(count), playlist_albums(count)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setPlaylists([]);
        setLoadingPlaylists(false);
        return;
      }

      const mapped = (data as PlaylistWithCountRow[]).map((p) => {
        const tracksCount =
          Array.isArray(p.playlist_tracks) && p.playlist_tracks[0]?.count != null
            ? Number(p.playlist_tracks[0].count)
            : 0;
        const albumsCount =
          Array.isArray(p.playlist_albums) && p.playlist_albums[0]?.count != null
            ? Number(p.playlist_albums[0].count)
            : 0;

        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          type: p.type,
          created_at: p.created_at,
          updated_at: p.updated_at,
          itemCount: p.type === "albums" ? albumsCount : tracksCount,
        } satisfies PlaylistWithCount;
      });

      setPlaylists(mapped);
      setLoadingPlaylists(false);
    };

    fetchProfile();
    fetchPlaylists();
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
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <FaCog size={14} /> Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <FaSignOutAlt size={14} /> Log out
          </button>
        </>
      }
      quickLinks={
        <>
          <QuickLink
            icon={FaStar}
            label="Rated music"
            href="#"
            active={activeContentTab === "rated"}
            onClick={(e) => {
              e.preventDefault();
              setActiveContentTab("rated");
            }}
          />
          <QuickLink icon={FaMusic} label="Liked songs" href="#" />
          <QuickLink icon={FaCompactDisc} label="Liked albums" href="#" />
          <QuickLink icon={FaMicrophoneAlt} label="Favourite artists" href="#" />
          <QuickLink
            icon={FaList}
            label="Playlists"
            href="#"
            active={activeContentTab === "playlists"}
            onClick={(e) => {
              e.preventDefault();
              setActiveContentTab("playlists");
            }}
          />
          <QuickLink icon={FaLayerGroup} label="Album collections" href="#" />
        </>
      }
    >
      {activeContentTab === "rated" ? (
      <section>
        <ProfileSectionHeader
          title="Latest Rated Music"
          filters={[
            { id: "all", label: "All", count: allUserAlbums.length },
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
        />

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
          <ArtistAlbumGridSection
            albums={filteredAlbums}
            initialCount={12}
            ratingMode="any"
          />
        )}
      </section>
      ) : null}

      {activeContentTab === "playlists" ? (
      <section
        className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-6 sm:p-8"
      >
        <ProfileSectionHeader
          title="Playlists"
          headerClassName="mb-6"
          trailing={
            <span className="text-xs text-neutral-600 font-mono">
              {playlists.length}
            </span>
          }
        />

        {loadingPlaylists ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaList size={24} className="text-neutral-400" />
            </div>
            <p className="text-neutral-900 font-bold text-lg mb-1">
              No playlists yet
            </p>
            <p className="text-neutral-500 text-sm">
              Add songs or albums to a playlist from any album page
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 truncate">
                      {playlist.name}
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">
                      {playlist.itemCount} items
                    </div>
                  </div>
                </div>

                <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 group-hover:text-neutral-900 shrink-0">
                  <BsThreeDotsVertical size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      ) : null}
    </ProfileLayout>
  );
}
