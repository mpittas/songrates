"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

type FavoriteItemType = "track" | "album" | "artist";
type FavoriteKey = `${FavoriteItemType}:${string}`;

interface FavoriteInput {
  itemId: string;
  itemType: FavoriteItemType;
  itemName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  albumId?: string;
  albumName?: string;
  durationMs?: number;
  artistId?: string;
  artists?: { id: string; name: string }[];
}

interface FavoriteRow {
  item_id: string;
  item_type: FavoriteItemType;
}

interface FavoritesContextType {
  isFavorite: (itemId: string, itemType: FavoriteItemType) => boolean;
  toggleFavorite: (input: FavoriteInput) => Promise<boolean | null>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

const favoriteKeys = {
  user: (userId: string | undefined) => ["favorites", userId] as const,
};

function toFavoriteKey(itemType: FavoriteItemType, itemId: string): FavoriteKey {
  return `${itemType}:${itemId}`;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [supabase] = useState(() => createClient());

  const { data: favoriteKeyList = [] } = useQuery({
    queryKey: favoriteKeys.user(user?.id),
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_favorites")
        .select("item_id, item_type")
        .eq("user_id", user.id);

      if (error) throw error;

      return ((data || []) as FavoriteRow[]).map((row) =>
        toFavoriteKey(row.item_type, row.item_id),
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const favoriteSet = useMemo(
    () => new Set<FavoriteKey>(favoriteKeyList as FavoriteKey[]),
    [favoriteKeyList],
  );

  const isFavorite = useCallback(
    (itemId: string, itemType: FavoriteItemType) =>
      favoriteSet.has(toFavoriteKey(itemType, itemId)),
    [favoriteSet],
  );

  const setCachedFavorite = useCallback(
    (key: FavoriteKey, liked: boolean) => {
      if (!user) return;

      queryClient.setQueryData<FavoriteKey[]>(
        favoriteKeys.user(user.id),
        (current = []) => {
          const next = new Set(current);
          if (liked) {
            next.add(key);
          } else {
            next.delete(key);
          }
          return Array.from(next);
        },
      );
    },
    [queryClient, user],
  );

  const toggleFavorite = useCallback(
    async (input: FavoriteInput) => {
      if (!user) return null;

      const key = toFavoriteKey(input.itemType, input.itemId);
      const wasFavorite = favoriteSet.has(key);
      const nextFavorite = !wasFavorite;

      setCachedFavorite(key, nextFavorite);

      try {
        if (wasFavorite) {
          const { error } = await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("item_id", input.itemId)
            .eq("item_type", input.itemType);

          if (error) throw error;
          return false;
        }

        const { error } = await supabase.from("user_favorites").upsert({
          user_id: user.id,
          item_id: input.itemId,
          item_type: input.itemType,
          item_name: input.itemName,
          artist_name: input.artistName,
          thumbnail_url: input.thumbnailUrl,
          album_id: input.itemType === "track" ? input.albumId : null,
          album_name: input.itemType === "track" ? input.albumName : null,
          duration_ms: input.itemType === "track" ? input.durationMs : null,
          artist_id: input.itemType === "track" ? input.artistId : null,
          artists:
            input.itemType === "track" &&
            input.artists &&
            input.artists.length > 0
              ? input.artists
              : input.itemType === "track" &&
                  input.artistId &&
                  input.artistName
                ? [{ id: input.artistId, name: input.artistName }]
                : null,
        });

        if (error) throw error;
        return true;
      } catch (error) {
        setCachedFavorite(key, wasFavorite);
        throw error;
      }
    },
    [favoriteSet, setCachedFavorite, supabase, user],
  );

  const value = useMemo(
    () => ({ isFavorite, toggleFavorite }),
    [isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
