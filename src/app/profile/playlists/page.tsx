"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuArrowLeft, LuListMusic } from "react-icons/lu";
import { BsThreeDotsVertical } from "react-icons/bs";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import type { Playlist } from "@/types/playlist";
import MySection from "@/components/ui/MySection";
import Button from "@/components/ui/Button";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type PlaylistWithCount = Playlist & { itemCount: number };

export default function ProfilePlaylistsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("playlists")
          .select(
            "id, user_id, name, type, created_at, updated_at, playlist_tracks(count), playlist_albums(count)",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error || !data) {
          setPlaylists([]);
          return;
        }

        const mapped = (data as any[]).map((p) => {
          const tracksCount =
            Array.isArray(p.playlist_tracks) && p.playlist_tracks[0]?.count != null
              ? Number(p.playlist_tracks[0].count)
              : 0;
          const albumsCount =
            Array.isArray(p.playlist_albums) && p.playlist_albums[0]?.count != null
              ? Number(p.playlist_albums[0].count)
              : 0;

          return {
            id: p.id,
            user_id: p.user_id,
            name: p.name,
            type: p.type,
            created_at: p.created_at,
            updated_at: p.updated_at,
            itemCount: p.type === "albums" ? albumsCount : tracksCount,
          } satisfies PlaylistWithCount;
        });

        setPlaylists(mapped);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const totalCount = useMemo(() => playlists.length, [playlists.length]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-neutral-500 animate-pulse text-xs tracking-widest uppercase">
          Initializing...
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-20")} container={false}>
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          <div className="mb-8">
            <Button
              href="/profile"
              variant="secondary"
              size="xs"
              iconLeft={<LuArrowLeft size={14} className=" mr-2" />}
            >
              BACK TO USER PROFILE
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <LuListMusic size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              My Playlists
            </h1>
            <span className="text-xs text-neutral-600 font-mono">
              {totalCount}
            </span>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-16 text-center border border-[#e1e1e1] bg-white rounded-md">
              <LuListMusic size={24} className="text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-600 font-mono text-sm">
                No playlists yet
              </p>
              <p className="text-neutral-700 text-xs mt-1">
                Add songs or albums to a playlist from any album page
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {playlists.map((p) => (
                <Link
                  key={p.id}
                  href={`/playlist/${p.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono">
                        {p.itemCount} items
                      </div>
                    </div>
                  </div>

                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 group-hover:text-neutral-900 shrink-0">
                    <BsThreeDotsVertical size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </MySection>
    </main>
  );
}

