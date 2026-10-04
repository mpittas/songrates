"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { FaSignOutAlt, FaCog } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileQuickLinks from "@/components/profile/ProfileQuickLinks";
import ProfilePageSkeleton from "@/components/layout/ProfilePageSkeleton";
import ProfileRank from "@/components/profile/ProfileRank";
import LevelProgressionModal from "@/components/profile/LevelProgressionModal";
import { useOwnProgression } from "@/components/profile/useOwnProgression";
import { enlargeAvatarUrl } from "@/lib/albumReviews";

export default function OwnProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, loading } = useAuth();
  const { view: progressionView } = useOwnProgression();
  const router = useRouter();
  const [rankOpen, setRankOpen] = useState(false);
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

  if (loading) {
    return <ProfilePageSkeleton />;
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
      }}
      progression={
        <ProfileRank
          view={progressionView}
          showProgress
          onClick={() => setRankOpen(true)}
          className="w-full max-w-none"
        />
      }
      actions={
        <>
          <Button href="/settings" variant="secondary" size="sm" iconLeft={<FaCog size={13} />}>
            Settings
          </Button>
          <Button onClick={() => signOut()} variant="ghost" size="sm" iconLeft={<FaSignOutAlt size={13} />}>
            Sign out
          </Button>
        </>
      }
      quickLinks={<ProfileQuickLinks mode="own" />}
    >
      {children}
      {rankOpen ? (
        <LevelProgressionModal onClose={() => setRankOpen(false)} />
      ) : null}
    </ProfileLayout>
  );
}
