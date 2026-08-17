import { notFound } from "next/navigation";
import UserRatedMusicSection from "@/components/profile/UserRatedMusicSection";
import { getUserProfile } from "@/lib/getUserProfile";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    notFound();
  }

  return <UserRatedMusicSection userId={profile.id} />;
}
