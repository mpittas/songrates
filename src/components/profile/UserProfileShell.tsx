"use client";

import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileQuickLinks from "@/components/profile/ProfileQuickLinks";

export interface UserProfileShellProfile {
  id: string;
  username: string;
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
        avatarUrl: profile.avatar_url,
        subtitle: `Member since ${memberSince}`,
      }}
      quickLinks={<ProfileQuickLinks mode="user" username={profile.username} />}
    >
      {children}
    </ProfileLayout>
  );
}
