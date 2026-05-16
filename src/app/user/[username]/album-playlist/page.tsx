import AlbumCollectionsSection from "@/components/profile/AlbumCollectionsSection";
import { getUserProfile } from "@/lib/getUserProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserAlbumPlaylistPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return null;
  }

  return (
    <AlbumCollectionsSection
      userId={profile.id}
      isPrivate={!profile.show_favorites}
    />
  );
}
