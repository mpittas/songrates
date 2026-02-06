# Plan: Integrate ListenBrainz Play Counts into Search Ranking

## Problem

Currently, the search ranking in [`searchService.ts`](src/lib/searchService.ts) uses a "Fame Index" formula that relies only on MusicBrainz metadata (release counts, primary type, title match, MB score). ListenBrainz play counts are fetched **lazily on the client** via [`useSearchEnrich`](src/hooks/useSearchEnrich.ts) and used for a client-side re-sort in [`SearchResults.tsx`](src/components/search/SearchResults.tsx:288), which causes:

1. **Wrong initial ranking** — iconic songs may not appear first until enrichment data arrives
2. **Visible re-ordering flash** — results jump around when listen counts load
3. **No server-side popularity signal** — the Fame Index can't distinguish a mega-hit (1.4M plays) from a moderately popular track

## Solution: Server-Side ListenBrainz Integration

Move ListenBrainz play count fetching **into the server-side `searchSongs()` function** so results arrive pre-ranked by true popularity. This is a surgical change primarily to one file.

## Architecture

```mermaid
flowchart TD
    A[User types query] --> B[/api/search route]
    B --> C[searchMusicBrainz]
    C --> D[searchSongs - MusicBrainz API]
    D --> E[Deduplicate recordings]
    E --> F[Extract recording MBIDs from top candidates]
    F --> G[fetchListenBrainzCounts - batch POST]
    G --> H[computeFameScore WITH listenCount]
    H --> I[Return pre-ranked results with listenCount populated]
    I --> J[Client renders - no re-sort needed]

    style G fill:#f96,stroke:#333
    style H fill:#f96,stroke:#333
```

## Weighted Scoring Formula

### Current Formula in `computeFameScore`

```
score = officialReleaseCount * 0.50
      + primaryTypeBonus     * 0.20
      + titleMatchQuality    * 0.20
      + mbRelevanceScore     * 0.10
```

### New Formula

```
score = listenBrainzPopularity * 0.35   ← NEW: strongest signal
      + officialReleaseCount   * 0.25   ← reduced from 0.50
      + primaryTypeBonus       * 0.15   ← reduced from 0.20
      + titleMatchQuality      * 0.15   ← reduced from 0.20
      + mbRelevanceScore       * 0.10   ← unchanged
```

**ListenBrainz normalization**: Use logarithmic scaling to prevent extreme outliers from dominating:

```typescript
// Normalize to 0-100 using log scale
// log10(1,400,000) ≈ 6.15, log10(100) ≈ 2
const lbNormalized =
  listenCount > 0
    ? (Math.log10(listenCount) / Math.log10(maxListenCount)) * 100
    : 0;
```

This ensures:

- 1.4M plays → ~100 (top score)
- 100K plays → ~82
- 10K plays → ~65
- 1K plays → ~49
- 100 plays → ~33
- 0 plays → 0

The log scale prevents a single mega-hit from making everything else score near zero, while still providing strong differentiation.

## Files to Modify

### 1. `src/lib/searchService.ts` — Primary changes

#### a. Update `computeFameScore()` signature and formula

- Add `listenCount` parameter
- Add `maxListenCount` parameter for normalization
- Implement log-scaled ListenBrainz weighting
- Redistribute weights as shown above

#### b. Update `searchSongs()` to fetch ListenBrainz counts before ranking

- After deduplication, extract recording MBIDs from the deduped candidates
- Call existing `fetchListenBrainzCounts()` with those MBIDs (already cached for 1 hour)
- Pass listen counts into `computeFameScore()` during the sort phase
- Populate `listenCount` field on `SongSearchResult` objects

#### c. Bump cache key version

- Change `search:song:v4:` to `search:song:v5:` to invalidate stale rankings

### 2. `src/components/search/SearchResults.tsx` — Remove client-side re-sort

#### a. Remove the `sortedResults` and `sortedGrouped` useMemo blocks

- Server now returns correctly ranked results
- Keep `useSearchEnrich` for display purposes only (showing the flame icon with listen count)
- Use `results` and `grouped` directly instead of `sortedResults`/`sortedGrouped`

### 3. No changes needed to:

- `src/types/search.ts` — `listenCount` field already exists on `SongSearchResult`
- `src/app/api/search/route.ts` — no changes needed, it just calls `searchMusicBrainz()`
- `src/app/api/search/enrich/route.ts` — keep as fallback for display
- `src/hooks/useSearchEnrich.ts` — keep for display enrichment
- `src/lib/smartSearch.ts` — no changes needed

## Performance Considerations

1. **Single additional API call per search**: `fetchListenBrainzCounts()` makes one POST request with all recording MBIDs (up to 65 for single-category, 40 for all-mode). This is already batched.

2. **Aggressive caching**: ListenBrainz counts are cached for 1 hour in the server-side LRU cache. Repeated searches for similar songs will hit cache.

3. **Parallel potential**: The ListenBrainz call happens AFTER MusicBrainz returns (sequential dependency), but the MusicBrainz response is already cached via Next.js `revalidate: 1800`. On cache hits, the total added latency is just the ListenBrainz API call (~100-200ms), which is also cached.

4. **Dedup-first optimization**: We only fetch ListenBrainz counts for **deduplicated** candidates (typically 15-25 recordings), not the raw 40-65 from MusicBrainz.

## Edge Cases

- **ListenBrainz API failure**: If the call fails, `fetchListenBrainzCounts()` returns `{}`. The formula gracefully degrades — `listenCount` is 0 for all, so the 0.35 weight contributes nothing and the remaining 0.65 of signals still rank correctly (same as current behavior).
- **New/obscure recordings with 0 plays**: They get 0 for the ListenBrainz component but can still rank well if they have high release counts and good title match.
- **All recordings have 0 plays**: The `maxListenCount` will be 0, and the formula skips the log normalization, effectively falling back to the current 4-signal formula.

## Verification

After implementation, test these queries:

1. **"Billie Jean"** → Michael Jackson, from Thriller, should be #1
2. **"Hotel California"** → Eagles, from Hotel California, should be #1
3. **"Bohemian Rhapsody"** → Queen, from A Night at the Opera, should be #1
4. **"Smells Like Teen Spirit"** → Nirvana, from Nevermind, should be #1
5. **"Yesterday"** → The Beatles, from Help!, should be #1
