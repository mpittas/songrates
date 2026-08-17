import { notFound } from "next/navigation";
import UserProfileShell from "@/components/profile/UserProfileShell";
import { getUserProfile } from "@/lib/getUserProfile";

/** Public profiles are cookie-free and change slowly — cache for 5 minutes. */
export const revalidate = 300;
export const dynamicParams = true;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export default async function UserProfileLayout({
  children,
  params,
}: LayoutProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile || !profile.is_public) {
    notFound();
  }

  return <UserProfileShell profile={profile}>{children}</UserProfileShell>;
}
