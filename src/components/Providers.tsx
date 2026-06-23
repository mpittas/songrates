"use client";

import "sonner/dist/styles.css";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { PlayerProvider } from "@/context/PlayerContext";
import { RatingsProvider } from "@/context/RatingsContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import MiniPlayer from "@/components/player/MiniPlayer";

import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <RatingsProvider>
              <PlaylistProvider>
                {children}
                <MiniPlayer />
                <Toaster
                  position="bottom-right"
                  closeButton
                  toastOptions={{
                    classNames: {
                      toast:
                        "rounded-3xl bg-neutral-950 text-white border border-neutral-800 shadow-xl p-4",
                      title: "text-white",
                      description: "text-neutral-300",
                      actionButton:
                        "rounded-full bg-white text-neutral-950 hover:bg-neutral-200",
                      cancelButton:
                        "rounded-full bg-neutral-900 text-neutral-200 hover:bg-neutral-800",
                      closeButton:
                        "bg-transparent text-neutral-300 hover:text-white border-neutral-700",
                    },
                  }}
                />
              </PlaylistProvider>
            </RatingsProvider>
          </PlayerProvider>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
