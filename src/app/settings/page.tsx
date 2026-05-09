"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaLock,
  FaGlobe,
} from "react-icons/fa";
import Button from "@/components/ui/Button";
import MySection from "@/components/ui/MySection";
import { cn } from "@/lib/utils";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";

interface ProfileSettings {
  username: string;
  is_public: boolean;
  show_favorites: boolean;
  show_playlists: boolean;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [settings, setSettings] = useState<ProfileSettings>({
    username: "",
    is_public: true,
    show_favorites: true,
    show_playlists: true,
  });
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Username validation state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch current profile settings
  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, is_public, show_favorites, show_playlists")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setSettings({
          username: data.username || "",
          is_public: data.is_public ?? true,
          show_favorites: data.show_favorites ?? true,
          show_playlists: data.show_playlists ?? true,
        });
        setOriginalUsername(data.username || "");
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user, supabase]);

  // Check username availability with debounce
  useEffect(() => {
    if (
      !settings.username ||
      settings.username === originalUsername ||
      settings.username.length < 3
    ) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", settings.username)
        .neq("id", user?.id || "")
        .maybeSingle();

      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [settings.username, originalUsername, supabase, user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate username
      if (!settings.username || settings.username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(settings.username)) {
        throw new Error(
          "Username can only contain letters, numbers, and underscores",
        );
      }

      // If username changed, check availability
      if (settings.username !== originalUsername) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", settings.username)
          .neq("id", user.id)
          .maybeSingle();

        if (existing) {
          throw new Error("Username is already taken");
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: settings.username,
          is_public: settings.is_public,
          show_favorites: settings.show_favorites,
          show_playlists: settings.show_playlists,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Sync username to auth user_metadata so it's available everywhere
      if (settings.username !== originalUsername) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: { username: settings.username },
        });
        if (metaError) {
          console.error("Error syncing username to auth metadata:", metaError);
        }
      }

      setOriginalUsername(settings.username);
      setSuccess("Settings saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const usernameChanged = settings.username !== originalUsername;
  const hasValidUsername =
    settings.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(settings.username);
  const canSave =
    hasValidUsername &&
    (!usernameChanged || usernameAvailable === true) &&
    !checkingUsername;

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-neutral-500 animate-pulse text-xs tracking-widest uppercase">
          Loading...
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-12")}>
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              href="/profile"
              className="text-neutral-500 hover:text-neutral-900 transition-colors p-2 hover:bg-neutral-200 rounded"
            >
              <FaArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-light tracking-tight text-neutral-900">
                Settings
              </h1>
              <p className="text-sm text-neutral-500 font-mono mt-0.5">
                Manage your account
              </p>
            </div>
          </div>

          {/* Username Section */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-[#1f1f1f] rounded-full" />
              <h2 className="text-lg font-light tracking-tight text-neutral-900">
                Username
              </h2>
            </div>

            <div className="bg-white border border-[#e1e1e1] p-6 rounded-md">
              <label className="block text-xs text-neutral-500 uppercase tracking-wider font-mono mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      username: e.target.value.toLowerCase().replace(/\s/g, ""),
                    }))
                  }
                  className="w-full bg-[#f7f7f7] border border-[#dcdcdc] rounded px-3 pl-8 py-2.5 text-sm text-neutral-900 placeholder-neutral-500 focus:border-[#b9b9b9] focus:outline-none"
                  placeholder="username"
                  minLength={3}
                  maxLength={20}
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && (
                    <FaSpinner
                      size={14}
                      className="text-neutral-500 animate-spin"
                    />
                  )}
                  {!checkingUsername &&
                    usernameChanged &&
                    usernameAvailable === true &&
                    hasValidUsername && (
                      <FaCheck size={14} className="text-emerald-500" />
                    )}
                  {!checkingUsername &&
                    usernameChanged &&
                    usernameAvailable === false && (
                      <FaTimes size={14} className="text-red-500" />
                    )}
                </div>
              </div>
              <p className="text-[11px] text-neutral-600 mt-2">
                3-20 characters, letters, numbers, and underscores only
              </p>
              {usernameChanged && usernameAvailable === false && (
                <p className="text-xs text-red-400 mt-1">
                  This username is already taken
                </p>
              )}
              {usernameChanged &&
                usernameAvailable === true &&
                hasValidUsername && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Username is available
                  </p>
                )}
            </div>
          </section>

          {/* Privacy Section */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-[#1f1f1f] rounded-full" />
              <h2 className="text-lg font-light tracking-tight text-neutral-900">
                Privacy
              </h2>
            </div>

            <div className="bg-white border border-[#e1e1e1] rounded-md divide-y divide-[#ececec]">
              {/* Profile Visibility Toggle */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#f2f2f2] rounded-sm">
                    {settings.is_public ? (
                      <FaGlobe size={16} className="text-emerald-400" />
                    ) : (
                      <FaLock size={16} className="text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm text-neutral-900">
                      Profile Visibility
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {settings.is_public
                        ? "Your profile is public and can be found by others"
                        : "Your profile is private and hidden from others"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      is_public: !prev.is_public,
                    }))
                  }
                  className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.is_public ? "bg-emerald-500" : "bg-amber-500"}
                `}
                >
                  <span
                    className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm
                    ${settings.is_public ? "translate-x-5" : "translate-x-0"}
                  `}
                  />
                </button>
              </div>

              {!settings.is_public && (
                <div className="px-5 py-3 bg-amber-500/5">
                  <p className="text-xs text-amber-400/80 flex items-center gap-2">
                    <FaLock size={10} />
                    Your profile won&apos;t appear in search or be accessible
                    via direct link. You can still use all features privately.
                  </p>
                </div>
              )}

              {/* Favourites Toggle */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#f2f2f2] rounded-sm">
                    {settings.show_favorites ? (
                      <FaEye size={16} className="text-emerald-400" />
                    ) : (
                      <FaEyeSlash size={16} className="text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm text-neutral-900">Favourites</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Show liked artists, albums, and tracks on your public
                      profile
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      show_favorites: !prev.show_favorites,
                    }))
                  }
                  className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.show_favorites ? "bg-emerald-500" : "bg-neutral-700"}
                `}
                >
                  <span
                    className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm
                    ${settings.show_favorites ? "translate-x-5" : "translate-x-0"}
                  `}
                  />
                </button>
              </div>

              {/* Playlists Toggle */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#f2f2f2] rounded-sm">
                    {settings.show_playlists ? (
                      <FaEye size={16} className="text-emerald-400" />
                    ) : (
                      <FaEyeSlash size={16} className="text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm text-neutral-900">Playlists</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Show your playlists on your public profile
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      show_playlists: !prev.show_playlists,
                    }))
                  }
                  className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.show_playlists ? "bg-emerald-500" : "bg-neutral-700"}
                `}
                >
                  <span
                    className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm
                    ${settings.show_playlists ? "translate-x-5" : "translate-x-0"}
                  `}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Messages */}
          {error && (
            <div className="mb-6 text-red-400 text-sm bg-red-500/10 p-3 border border-red-500/20 rounded-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 text-emerald-400 text-sm bg-emerald-500/10 p-3 border border-emerald-500/20 rounded-sm flex items-center gap-2">
              <FaCheck size={12} />
              {success}
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors font-mono"
            >
              Cancel
            </Link>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saving || !canSave}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </MySection>
    </main>
  );
}
