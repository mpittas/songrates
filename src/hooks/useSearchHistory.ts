"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent, PostgrestError, Session } from "@supabase/supabase-js";
import type { RecentSearchClick, SearchResult } from "@/types/search";

interface SearchHistoryRow {
  id: string;
  result: SearchResult;
  created_at: string;
}

type SearchHistoryMutationResult<T = null> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Manages a logged-in user's recently clicked search results.
 *
 * - Fetches recent results when a user is authenticated.
 * - `recordClick` persists a clicked result and optimistically moves it to the top.
 * - `removeClick` / `clearHistory` prune the list.
 *
 * For guests (no user) the history stays empty and writes are no-ops.
 */
async function fetchSearchHistory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<RecentSearchClick[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || session.user.id !== userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_searches")
    .select("id, result, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return ((data || []) as SearchHistoryRow[]).map((row) => ({
    recordId: row.id,
    result: row.result,
    clickedAt: row.created_at,
  }));
}

export function useSearchHistory() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [supabase] = useState(() => createClient());
  const [history, setHistory] = useState<RecentSearchClick[]>([]);

  // Avoid persisting the same result repeatedly within a session.
  const lastRecordedRef = useRef<string | null>(null);

  // Re-fetch whenever auth changes. Guests have no persisted history.
  useEffect(() => {
    let cancelled = false;
    lastRecordedRef.current = null;

    if (loading) {
      return;
    }

    if (!userId) {
      Promise.resolve().then(() => {
        if (!cancelled) setHistory([]);
      });
      return;
    }

    (async () => {
      try {
        const searches = await fetchSearchHistory(supabase, userId);
        if (!cancelled) setHistory(searches);
      } catch (error) {
        console.error("Search history fetch failed:", error);
        if (!cancelled) setHistory([]);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setHistory([]);
        lastRecordedRef.current = null;
        return;
      }

      if (session.user.id !== userId) return;

      fetchSearchHistory(supabase, userId)
        .then((searches) => {
          if (!cancelled) setHistory(searches);
        })
        .catch((error) => {
          console.error("Search history fetch failed:", error);
        });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loading, supabase, userId]);

  const recordClick = useCallback(
    (result: SearchResult) => {
      if (!userId || !result?.id) return;
      if (lastRecordedRef.current === result.id) return;
      lastRecordedRef.current = result.id;
      const clickedAt = new Date().toISOString();

      // Optimistic: dedupe by result id and move to the top.
      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.result.id !== result.id,
        );
        return [
          {
            recordId: `temp-${result.id}`,
            result,
            clickedAt,
          },
          ...filtered,
        ].slice(0, 10);
      });

      supabase
        .from("user_searches")
        .upsert(
          {
            user_id: userId,
            result_id: result.id,
            result_type: result.type,
            result,
            created_at: clickedAt,
          },
          { onConflict: "user_id,result_id" },
        )
        .select("id, created_at")
        .single()
        .then(
          ({
            data,
            error,
          }: SearchHistoryMutationResult<
            Pick<SearchHistoryRow, "id" | "created_at">
          >) => {
          if (error) {
            console.error("Search history save failed:", error);
            return;
          }

          if (!data) return;

          setHistory((prev) =>
            prev.map((item) =>
              item.result.id === result.id
                ? {
                    ...item,
                    recordId: data.id,
                    clickedAt: data.created_at,
                  }
                : item,
            ),
          );
          },
        );
    },
    [supabase, userId],
  );

  const removeClick = useCallback(
    (resultId: string) => {
      if (!userId) return;
      setHistory((prev) => prev.filter((item) => item.result.id !== resultId));
      if (lastRecordedRef.current === resultId) {
        lastRecordedRef.current = null;
      }
      supabase
        .from("user_searches")
        .delete()
        .eq("user_id", userId)
        .eq("result_id", resultId)
        .then(({ error }: SearchHistoryMutationResult) => {
          if (error) console.error("Search history delete failed:", error);
        });
    },
    [supabase, userId],
  );

  const clearHistory = useCallback(() => {
    if (!userId) return;
    setHistory([]);
    lastRecordedRef.current = null;
    supabase
      .from("user_searches")
      .delete()
      .eq("user_id", userId)
      .then(({ error }: SearchHistoryMutationResult) => {
        if (error) console.error("Search history clear failed:", error);
      });
  }, [supabase, userId]);

  return { history, recordClick, removeClick, clearHistory };
}
