"use client";

import { useEffect, useMemo, useState } from "react";
import { FaHeart, FaMicrophoneAlt } from "react-icons/fa";
import type { IconType } from "react-icons";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import ArtistGridSection from "@/components/artist/ArtistGridSection";
import type { ArtistCardArtist } from "@/components/artist/ArtistCard";

import type { LikedArtistDTO } from "@/app/api/liked-artists/route";

interface LikedArtistsSectionProps {
  userId: string;
  isPrivate?: boolean;
  hideHeader?: boolean;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Icon size={24} className="text-neutral-400" />
      </div>
      <p className="text-neutral-900 font-bold text-lg mb-1">{title}</p>
      <p className="text-neutral-500 text-sm">{description}</p>
    </div>
  );
}

export default function LikedArtistsSection({
  userId,
  isPrivate = false,
  hideHeader = false,
}: LikedArtistsSectionProps) {
  const [artists, setArtists] = useState<LikedArtistDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isPrivate) {
      setArtists([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/liked-artists?userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) {
          if (!cancelled) setArtists([]);
          return;
        }
        const json = (await res.json()) as { artists: LikedArtistDTO[] };
        if (!cancelled) setArtists(json.artists || []);
      } catch (e) {
        console.error("Failed to load liked artists:", e);
        if (!cancelled) setArtists([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isPrivate]);

  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => {
      const name = a.name?.toLowerCase() || "";
      const genres = (a.genres || []).join(" ").toLowerCase();
      return name.includes(q) || genres.includes(q);
    });
  }, [artists, searchQuery]);

  const gridArtists: ArtistCardArtist[] = useMemo(
    () =>
      filteredArtists.map((a) => ({
        id: a.artistId,
        name: a.name,
        artworkUrl: a.thumbnailUrl || undefined,
        genres: a.genres,
      })),
    [filteredArtists],
  );

  return (
    <section>
      {!hideHeader && (
        <ProfileSectionHeader
          title="Favourite Artists"
          count={!isPrivate && !loading ? filteredArtists.length : undefined}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search artists..."
        />
      )}

      {isPrivate ? (
        <EmptyState
          icon={FaMicrophoneAlt}
          title="Favourite artists are private"
          description="This user has chosen to hide their favourite artists"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredArtists.length === 0 ? (
        <EmptyState
          icon={FaHeart}
          title={
            searchQuery ? "No artists found" : "No favourite artists yet"
          }
          description={
            searchQuery
              ? "Try a different search term"
              : "Like artists from any artist page to see them here"
          }
        />
      ) : (
        <ArtistGridSection
          artists={gridArtists}
          initialCount={12}
          onArtistFavoriteChange={(artistId, liked) => {
            if (!liked) {
              setArtists((prev) => prev.filter((a) => a.artistId !== artistId));
            }
          }}
        />
      )}
    </section>
  );
}
