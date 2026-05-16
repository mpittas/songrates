"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import {
  FaStar,
  FaMusic,
  FaCompactDisc,
  FaMicrophoneAlt,
  FaList,
  FaLayerGroup,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { createClient } from "@/utils/supabase/client";
import { Album } from "@/types/music";
import type { Playlist } from "@/types/playlist";
import ProfileLayout, { QuickLink } from "@/components/profile/ProfileLayout";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import LikedSongsSection from "@/components/profile/LikedSongsSection";
import LikedAlbumsSection from "@/components/profile/LikedAlbumsSection";

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

type PlaylistWithCount = Playlist & { itemCount: number };

type PlaylistWithCountRow = Playlist & {
  playlist_tracks?: { count: number }[];
  playlist_albums?: { count: number }[];
};

type ProfileContentTab =
  | "rated"
  | "liked-songs"
  | "liked-albums"
  | "playlists";

interface UserProfileClientProps {
  profile: UserProfile;
}

export default function UserProfileClient({ profile }: UserProfileClientProps) {
  const [albums, setAlbums] = useState<RatedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContentTab, setActiveContentTab] =
    useState<ProfileContentTab>("rated");
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  useEffect(() => {
    const fetchUserAlbums = async () => {
      const supabase = createClient();

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
  }, [profile.id]);

  useEffect(() => {
    if (!profile.show_playlists) {
      setPlaylists([]);
      setLoadingPlaylists(false);
      return;
    }

    const fetchPlaylists = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playlists")
        .select(
          "id, user_id, name, type, created_at, updated_at, playlist_tracks(count), playlist_albums(count)",
        )
        .eq("user_id", profile.id)
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

    fetchPlaylists();
  }, [profile.id, profile.show_playlists]);

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
      .sort((a, b) => (b.ratedAt || "").localeCompare(a.ratedAt || ""))
      .map((album) => ({
        id: album.id,
        title: album.title,
        artistName: album.artistName,
        artworkUrl: album.artworkUrl,
        releaseDate: album.releaseDate,
        rating: album.rating,
      }));
  }, [albums, activeTab]);

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ProfileLayout
      user={{
        username: profile.username,
        avatarUrl: profile.avatar_url,
        subtitle: `Member since ${memberSince}`,
      }}
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
          <QuickLink
            icon={FaMusic}
            label="Liked songs"
            href="#"
            active={activeContentTab === "liked-songs"}
            onClick={(e) => {
              e.preventDefault();
              setActiveContentTab("liked-songs");
            }}
          />
          <QuickLink
            icon={FaCompactDisc}
            label="Liked albums"
            href="#"
            active={activeContentTab === "liked-albums"}
            onClick={(e) => {
              e.preventDefault();
              setActiveContentTab("liked-albums");
            }}
          />
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
              <p className="text-neutral-900 font-bold text-lg mb-1">
                No albums found
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
              albums={filteredAlbums}
              initialCount={12}
              ratingMode="any"
            />
          )}
        </section>
      ) : null}

      {activeContentTab === "liked-songs" ? (
        <LikedSongsSection
          userId={profile.id}
          isPrivate={!profile.show_favorites}
        />
      ) : null}

      {activeContentTab === "liked-albums" ? (
        <LikedAlbumsSection
          userId={profile.id}
          isPrivate={!profile.show_favorites}
        />
      ) : null}

      {activeContentTab === "playlists" ? (
        <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-6 sm:p-8">
          <ProfileSectionHeader
            title="Playlists"
            headerClassName="mb-6"
            trailing={
              <span className="text-xs text-neutral-600 font-mono">
                {playlists.length}
              </span>
            }
          />

          {!profile.show_playlists ? (
            <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FaList size={24} className="text-neutral-400" />
              </div>
              <p className="text-neutral-900 font-bold text-lg mb-1">
                Playlists are private
              </p>
              <p className="text-neutral-500 text-sm">
                This user has chosen to hide their playlists
              </p>
            </div>
          ) : loadingPlaylists ? (
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
                This user hasn&apos;t created any playlists
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
