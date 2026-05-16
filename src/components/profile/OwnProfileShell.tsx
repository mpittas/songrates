"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaSignOutAlt, FaCog } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileQuickLinks from "@/components/profile/ProfileQuickLinks";

export default function OwnProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

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
        .select("username")
        .eq("id", user.id)
        .single();

      if (data?.username) {
        setProfileUsername(data.username);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="font-medium text-neutral-400 animate-pulse text-sm tracking-wide">
          Loading profile...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const username =
    profileUsername ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "user";

  return (
    <ProfileLayout
      user={{
        username,
        avatarUrl: user.user_metadata?.avatar_url || null,
        subtitle: user.email,
      }}
      actions={
        <>
          <Link
            href="/settings"
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <FaCog size={14} /> Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <FaSignOutAlt size={14} /> Log out
          </button>
        </>
      }
      quickLinks={<ProfileQuickLinks mode="own" />}
    >
      {children}
    </ProfileLayout>
  );
}
