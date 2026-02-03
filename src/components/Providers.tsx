"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { PlayerProvider } from "@/context/PlayerContext";
import { RatingsProvider } from "@/context/RatingsContext";
import MiniPlayer from "@/components/MiniPlayer";

import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <RatingsProvider>
            {children}
            <MiniPlayer />
          </RatingsProvider>
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
