import { getTrendingSongs } from "@/lib/appleMusic/api";
import {
  collectionsFromTrending,
  fetchAlbumCollections,
  type CollectionCardData,
} from "@/lib/albumCollections";
import { createClient } from "@/utils/supabase/server";

export type StudySource = "user" | "empty" | "guest";

export async function loadAlbumPlaylistStudy(): Promise<{
  collections: CollectionCardData[];
  source: StudySource;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const collections = await fetchAlbumCollections(supabase, user.id, 24);
    if (collections.length > 0) {
      return { collections, source: "user" };
    }
  }

  const songs = await getTrendingSongs(25);
  return {
    collections: collectionsFromTrending(songs),
    source: user ? "empty" : "guest",
  };
}
