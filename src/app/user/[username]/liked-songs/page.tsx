import LikedSongsSection from "@/components/profile/LikedSongsSection";
import { getUserProfile } from "@/lib/getUserProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserLikedSongsPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return null;
  }

  return (
    <LikedSongsSection
      userId={profile.id}
      isPrivate={!profile.show_favorites}
    />
  );
}
