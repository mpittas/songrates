"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { RecentSearchClick, SearchResult } from "@/types/search";

type SearchHistoryResponse = {
  searches?: RecentSearchClick[];
  search?: RecentSearchClick;
  error?: string;
};

const SEARCH_HISTORY_ENDPOINT = "/api/search-history";

async function readSearchHistoryResponse(
  response: Response,
): Promise<SearchHistoryResponse> {
  const body = (await response.json().catch(() => ({}))) as SearchHistoryResponse;

  if (!response.ok) {
    throw new Error(body.error || `Search history request failed (${response.status})`);
  }

  return body;
}

/**
 * Manages a logged-in user's recently clicked search results.
 *
 * - Fetches recent results when a user is authenticated.
 * - `recordClick` persists a clicked result and optimistically moves it to the top.
 * - `removeClick` / `clearHistory` prune the list.
 *
 * For guests (no user) the history stays empty and writes are no-ops.
 */
async function fetchSearchHistory(): Promise<RecentSearchClick[]> {
  const response = await fetch(SEARCH_HISTORY_ENDPOINT, {
    cache: "no-store",
  });
  const body = await readSearchHistoryResponse(response);
  return body.searches || [];
}

export function useSearchHistory() {
  const { user, loading } = useAuth();
  const userId = user?.id;
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
        const searches = await fetchSearchHistory();
        if (!cancelled) setHistory(searches);
      } catch (error) {
        console.warn("Search history fetch failed:", error);
        if (!cancelled) setHistory([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, userId]);

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

      fetch(SEARCH_HISTORY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, clickedAt }),
      })
        .then(readSearchHistoryResponse)
        .then(({ search }) => {
          if (!search) return;

          setHistory((prev) =>
            prev.map((item) =>
              item.result.id === result.id
                ? {
                    ...item,
                    recordId: search.recordId,
                    clickedAt: search.clickedAt,
                  }
                : item,
            ),
          );
        })
        .catch((error) => {
          console.warn("Search history save failed:", error);
        });
    },
    [userId],
  );

  const removeClick = useCallback(
    (resultId: string) => {
      if (!userId) return;
      setHistory((prev) => prev.filter((item) => item.result.id !== resultId));
      if (lastRecordedRef.current === resultId) {
        lastRecordedRef.current = null;
      }
      fetch(
        `${SEARCH_HISTORY_ENDPOINT}?resultId=${encodeURIComponent(resultId)}`,
        { method: "DELETE" },
      )
        .then(readSearchHistoryResponse)
        .catch((error) => {
          console.warn("Search history delete failed:", error);
        });
    },
    [userId],
  );

  const clearHistory = useCallback(() => {
    if (!userId) return;
    setHistory([]);
    lastRecordedRef.current = null;
    fetch(SEARCH_HISTORY_ENDPOINT, { method: "DELETE" })
      .then(readSearchHistoryResponse)
      .catch((error) => {
        console.warn("Search history clear failed:", error);
      });
  }, [userId]);

  return { history, recordClick, removeClick, clearHistory };
}
