"use client";

import { useAuth } from "@/context/AuthContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { usePlaylist } from "@/context/PlaylistContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaSignOutAlt, FaCog } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileQuickLinks from "@/components/profile/ProfileQuickLinks";
import Button from "@/components/ui/Button";
import { enlargeAvatarUrl } from "@/lib/albumReviews";
import type { ProfileNavSegment } from "@/lib/profileNav";

export default function OwnProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, loading } = useAuth();
  const { albumRatings, ratings } = useRatingsContext();
  const { playlists } = usePlaylist();
  const router = useRouter();
  const [profile, setProfile] = useState<{
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  }>({ username: null, displayName: null, avatarUrl: null });

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
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile({
        username: data?.username ?? null,
        displayName: data?.display_name ?? null,
        avatarUrl: enlargeAvatarUrl(data?.avatar_url ?? null),
      });
    };

    fetchProfile();
  }, [user]);

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<ProfileNavSegment, number>> = {
      rated: Object.values(albumRatings).filter(
        (album) => album.ratedTrackIds.length > 0,
      ).length,
      "rated-songs": Object.values(ratings).filter((value) => value > 0).length,
      "songs-playlist": playlists.filter((playlist) => playlist.type === "songs")
        .length,
      "album-playlist": playlists.filter(
        (playlist) => playlist.type === "albums",
      ).length,
    };
    return counts;
  }, [albumRatings, ratings, playlists]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="h-44 animate-pulse bg-[#c13a62] sm:h-56 md:h-64" />
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            <div className="h-24 w-24 animate-pulse rounded-full bg-neutral-300 ring-[3px] ring-[var(--background)] sm:h-28 sm:w-28" />
            <div className="mb-2 space-y-2">
              <div className="h-8 w-40 animate-pulse rounded-md bg-neutral-300" />
              <div className="h-4 w-28 animate-pulse rounded-md bg-neutral-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const username =
    profile.username ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "user";

  const avatarUrl =
    profile.avatarUrl ||
    enlargeAvatarUrl(
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
    );

  return (
    <ProfileLayout
      user={{
        username,
        displayName: profile.displayName,
        avatarUrl,
        subtitle: user.email,
      }}
      actions={
        <>
          <Button
            href="/settings"
            variant="border"
            size="xs"
            iconLeft={<FaCog size={12} className="mr-1.5" />}
          >
            Settings
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            iconLeft={<FaSignOutAlt size={12} className="mr-1.5" />}
            onClick={() => signOut()}
          >
            Log out
          </Button>
        </>
      }
      quickLinks={<ProfileQuickLinks mode="own" counts={tabCounts} />}
    >
      {children}
    </ProfileLayout>
  );
}
