"use client";

import { PlayerProvider } from "@/context/PlayerContext";
import MiniPlayer from "@/components/MiniPlayer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <MiniPlayer />
    </PlayerProvider>
  );
}
