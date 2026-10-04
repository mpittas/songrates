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
                  offset={{ bottom: "calc(var(--player-h) + 20px)", right: 20 }}
                  mobileOffset={{
                    bottom: "calc(var(--app-bottom-inset) + 12px)",
                  }}
                  toastOptions={{
                    classNames: {
                      toast:
                        "rounded-2xl bg-ink text-white border border-white/10 shadow-pop p-4",
                      title: "text-white font-medium",
                      description: "text-white/65",
                      actionButton:
                        "rounded-full bg-white text-ink hover:bg-white/90",
                      cancelButton:
                        "rounded-full bg-white/10 text-white/80 hover:bg-white/15",
                      closeButton:
                        "bg-ink text-white/70 hover:text-white border-white/15",
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
