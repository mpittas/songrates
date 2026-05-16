"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import MeshGradient from "@/components/mesh/MeshGradient";
import { MeshGradientConfig } from "@/components/mesh/types";
import Button from "@/components/ui/Button";

const greenMeshConfig: MeshGradientConfig = {
  speed: 0.2,
  zoom: 1.2,
  amplitude: 0.4,
  contrast: 1.2,
  noise: 0.05,
  color1: "#10b981",
  color2: "#022c22",
};

export default function CompleteProfilePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // Check if user already has a username
  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if profile has username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.username) {
        // User already has username, redirect to home
        router.push("/");
        return;
      }

      setChecking(false);
    };

    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate username
      if (!username || username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error(
          "Username can only contain letters, numbers, and underscores",
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Check if username is already taken
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existing) {
        throw new Error("Username is already taken");
      }

      // Update profile with username
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#ebe8e5] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#ebe8e5]">
      {/* Left Column: Green Gradient */}
      <div className="relative hidden md:block h-full w-full overflow-hidden">
        <MeshGradient
          config={greenMeshConfig}
          className="absolute inset-0 w-full h-full opacity-80"
        />
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-col justify-center p-6 md:p-12 bg-[#ebe8e5] relative w-full max-w-[600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl text-neutral-900 mb-2 tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-neutral-500 text-sm">
            Choose a username to complete your registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="eg. musiclover99"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              className="w-full bg-white border border-[#d8d8d8] text-neutral-900 text-sm px-4 py-3 placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-400/50 outline-none rounded-md"
            />
            <p className="text-[11px] text-neutral-600">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-2 border border-red-500/20 rounded-none">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || username.length < 3}
            variant="secondary"
            size="md"
            className="mt-4 w-full"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}
