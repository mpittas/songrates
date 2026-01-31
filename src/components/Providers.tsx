"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { PlayerProvider } from "@/context/PlayerContext";
import MiniPlayer from "@/components/MiniPlayer";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        {children}
        <MiniPlayer />
      </PlayerProvider>
    </QueryClientProvider>
  );
}
