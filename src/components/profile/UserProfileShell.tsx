"use client";

import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileQuickLinks from "@/components/profile/ProfileQuickLinks";
import { enlargeAvatarUrl } from "@/lib/albumReviews";

export interface UserProfileShellProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function UserProfileShell({
  profile,
  children,
}: {
  profile: UserProfileShellProfile;
  children: React.ReactNode;
}) {
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ProfileLayout
      user={{
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: enlargeAvatarUrl(profile.avatar_url),
        subtitle: `Joined ${memberSince}`,
      }}
      quickLinks={
        <ProfileQuickLinks mode="user" username={profile.username} />
      }
    >
      {children}
    </ProfileLayout>
  );
}
