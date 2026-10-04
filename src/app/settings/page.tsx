"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaUser } from "react-icons/fa";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import MySection from "@/components/ui/MySection";
import { cn } from "@/lib/utils";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import SettingsLoading from "./loading";
import { enlargeAvatarUrl } from "@/lib/albumReviews";

interface ProfileSettings {
  username: string;
  is_public: boolean;
  show_favorites: boolean;
  show_playlists: boolean;
}

function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
}) {
  return (
    <Button
      size="xxs"
      variant={checked ? "primary" : "secondary"}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onCheckedChange}
      className="relative w-11"
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </Button>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-2">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        label={title}
      />
    </div>
  );
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
  const [original, setOriginal] = useState<ProfileSettings | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{ username: string; available: boolean } | null>(null);
  const usernameAvailable = usernameCheck?.username === settings.username ? usernameCheck.available : null;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(
          "username, display_name, avatar_url, is_public, show_favorites, show_playlists",
        )
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        setLoading(false);
        return;
      }

      if (data) {
        const next: ProfileSettings = {
          username: data.username || "",
          is_public: data.is_public ?? true,
          show_favorites: data.show_favorites ?? true,
          show_playlists: data.show_playlists ?? true,
        };
        setSettings(next);
        setOriginal(next);
        setDisplayName(data.display_name || null);
        setAvatarUrl(
          enlargeAvatarUrl(data.avatar_url) ||
            enlargeAvatarUrl(
              typeof user.user_metadata?.avatar_url === "string"
                ? user.user_metadata.avatar_url
                : null,
            ),
        );
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user, supabase]);

  useEffect(() => {
    if (
      !settings.username ||
      settings.username === original?.username ||
      settings.username.length < 3
    ) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", settings.username)
        .neq("id", user?.id || "")
        .maybeSingle();

      if (!cancelled) {
        setUsernameCheck(checkError ? null : { username: settings.username, available: !data });
        setCheckingUsername(false);
      }
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [settings.username, original?.username, supabase, user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      if (!settings.username || settings.username.length < 3 || settings.username.length > 20) {
        throw new Error("Username must be 3–20 characters");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(settings.username)) {
        throw new Error(
          "Username can only contain letters, numbers, and underscores",
        );
      }

      if (settings.username !== original?.username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", settings.username)
          .neq("id", user.id)
          .maybeSingle();

        if (existing) {
          throw new Error("This username is already taken");
        }
      }

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

      if (settings.username !== original?.username) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: { username: settings.username },
        });
        if (metaError) {
          console.error("Error syncing username to auth metadata:", metaError);
        }
      }

      setOriginal(settings);
      toast.success("Settings saved");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save settings";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const usernameChanged = settings.username !== original?.username;
  const hasValidUsername =
    settings.username.length >= 3 && settings.username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(settings.username);
  const isDirty =
    original != null &&
    (settings.username !== original.username ||
      settings.is_public !== original.is_public ||
      settings.show_favorites !== original.show_favorites ||
      settings.show_playlists !== original.show_playlists);
  const canSave =
    isDirty &&
    hasValidUsername &&
    (!usernameChanged || usernameAvailable === true) &&
    !checkingUsername;

  if (authLoading || loading) {
    return <SettingsLoading />;
  }

  if (!user) return null;

  const shownName = displayName?.trim() || settings.username || "You";

  return (
    <main className="min-h-screen bg-canvas">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-28")}>
        <div className="mx-auto w-full max-w-xl">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
          >
            <FaArrowLeft size={12} />
            Back to profile
          </Link>

          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            How you appear on Songrates, and what others can see.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-subtle ring-1 ring-line-strong">
              {avatarUrl ? (
                <OptimizedImage
                  src={avatarUrl}
                  alt={shownName}
                  fill
                  className="object-cover"
                  fallbackSrc="/vinyl-placeholder.svg"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FaUser size={22} className="text-ink-3" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{shownName}</p>
              <p className="truncate text-sm text-ink-2">{user.email}</p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">
              Profile
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Your public handle. This is how people find you.
            </p>

            <label
              htmlFor="username"
              className="mt-5 block text-sm font-medium text-ink"
            >
              Username
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={settings.username}
                onChange={(e) => {
                  setCheckingUsername(false);
                  setSettings((prev) => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, "") }));
                }}
                className="h-11 w-full rounded-xl border border-line-strong bg-surface pr-10 pl-8 text-sm text-ink placeholder:text-ink-3"
                placeholder="username"
                minLength={3}
                maxLength={20}
                aria-invalid={
                  usernameChanged && usernameAvailable === false
                    ? true
                    : undefined
                }
                aria-describedby="username-hint"
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                {checkingUsername && (
                  <FaSpinner
                    size={14}
                    className="animate-spin text-ink-3"
                  />
                )}
                {!checkingUsername &&
                  usernameChanged &&
                  usernameAvailable === true &&
                  hasValidUsername && (
                    <FaCheck size={14} className="text-emerald-600" />
                  )}
                {!checkingUsername &&
                  usernameChanged &&
                  usernameAvailable === false && (
                    <FaTimes size={14} className="text-red-600" />
                  )}
              </div>
            </div>
            <p id="username-hint" className="mt-2 text-xs text-ink-2">
              3–20 characters. Letters, numbers, and underscores.
            </p>
            {usernameChanged && usernameAvailable === false && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                This username is already taken
              </p>
            )}
            {usernameChanged &&
              usernameAvailable === true &&
              hasValidUsername && (
                <p className="mt-1 text-xs text-emerald-700">
                  Username is available
                </p>
              )}
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">
              Privacy
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Choose what appears on your public profile.
            </p>

            <div className="mt-2 divide-y divide-line-strong border-y border-line-strong">
              <SettingRow
                title="Public profile"
                description={
                  settings.is_public
                    ? "Anyone can find your profile and open it from a link."
                    : "Your profile is hidden from search and direct links."
                }
                checked={settings.is_public}
                onCheckedChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    is_public: !prev.is_public,
                  }))
                }
              />
              <SettingRow
                title="Favourites"
                description="Show liked artists, albums, and tracks."
                checked={settings.show_favorites}
                onCheckedChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    show_favorites: !prev.show_favorites,
                  }))
                }
              />
              <SettingRow
                title="Playlists"
                description="Show your song and album playlists."
                checked={settings.show_playlists}
                onCheckedChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    show_playlists: !prev.show_playlists,
                  }))
                }
              />
            </div>
          </section>

          {error ? (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              {isDirty ? "You have unsaved changes." : "\u00a0"}
            </p>
            <div className="flex items-center gap-2">
              <Button href="/profile" variant="ghost" size="sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || !canSave}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
