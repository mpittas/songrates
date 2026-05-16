import SongCollectionsSection from "@/components/profile/SongCollectionsSection";
import { getUserProfile } from "@/lib/getUserProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserSongsPlaylistPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return null;
  }

  return (
    <SongCollectionsSection
      userId={profile.id}
      isPrivate={!profile.show_favorites}
    />
  );
}
