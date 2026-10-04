"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AuthLayout, { AUTH_INPUT_CLASS } from "@/components/auth/AuthLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

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
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate username
      if (!username || username.length < 3 || username.length > 20) {
        throw new Error("Username must be 3–20 characters");
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
      const avatarUrl =
        (typeof user.user_metadata?.avatar_url === "string" &&
          user.user_metadata.avatar_url) ||
        (typeof user.user_metadata?.picture === "string" &&
          user.user_metadata.picture) ||
        null;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username, avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Redirect to home
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save your profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout>
        <div aria-busy="true" aria-label="Loading profile" className="space-y-5">
          <Skeleton className="h-10 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-12 w-full" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.045em]">
            Make it yours
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-2">
            Choose a username to complete your registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-username" className="text-sm font-medium text-ink-2">Username</label>
            <input
              id="profile-username"
              autoComplete="username"
              aria-describedby="profile-username-hint"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="musiclover99"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              className={AUTH_INPUT_CLASS}
            />
            <p id="profile-username-hint" className="text-xs text-ink-3">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || username.length < 3}
            variant="primary"
            size="lg"
            className="mt-4 w-full"
          >
            {loading ? "Saving..." : "Save profile"}
          </Button>
        </form>
    </AuthLayout>
  );
}
