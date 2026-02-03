"use client";

import { useAuth } from "@/context/AuthContext";
import MySection from "@/components/MySection";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <MySection className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="font-mono text-neutral-500 animate-pulse text-xs tracking-widest uppercase">
          initializing_
        </div>
      </MySection>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col pt-10">
      <MySection>
        <div className="max-w-4xl">
          <div className="space-y-10">
            {/* Header section with very minimalistic typography */}
            <header className="space-y-4">
              <h1 className="text-6xl font-light tracking-tighter text-white">
                Profile
              </h1>
              <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
                Account Information / System Settings
              </p>
            </header>

            {/* Content sectin */}
            <div className="space-y-12">
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
                  identity_
                </div>
                <div className="text-lg font-light text-white/90 tracking-tight">
                  {user.email}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex flex-col items-start gap-8">
                <button
                  onClick={() => signOut()}
                  className="text-sm font-mono tracking-widest uppercase text-white/40 hover:text-red-400 transition-colors duration-300"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
