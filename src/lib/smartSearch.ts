/**
 * smartSearch.ts — Truly smart search query normalization and fuzzy matching
 *
 * Handles edge cases like:
 *   ▸ Spaced-out titles:    "a m a r i"  ↔  "amari"
 *   ▸ Typo tolerance:       "beyonse"    →  "beyonce"   (Lucene fuzzy ~)
 *   ▸ Special characters:   "AC/DC"      ↔  "acdc"
 *   ▸ Diacritics:           "beyoncé"    ↔  "beyonce"
 *   ▸ Punctuation:          "don't"      ↔  "dont"
 *   ▸ Common substitutions: "&" ↔ "and", "ft." ↔ "featuring"
 *   ▸ Collapsed words:      "jcole"      →  "j cole"
 *
 * ─── Architecture ──────────────────────────────────────────────────────
 *   1. normalizeText()            — lowercase, strip diacritics & special chars
 *   2. generateQueryVariations()  — produces alternate forms of the query
 *   3. buildSmartLuceneQuery()    — combines variations with fuzzy operators
 *   4. smartRerank()              — post-fetch re-ordering by match quality
 */

// ─── Text Normalization ────────────────────────────────────────────────────────

/**
 * Normalize a string for comparison:
 * lowercase → strip diacritics → remove non-alphanumeric (keep spaces) → collapse spaces
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics (é→e, ü→u, ñ→n)
    .replace(/[^a-z0-9\s]/g, "") // Strip everything except letters, digits, spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Remove ALL whitespace: "a m a r i" → "amari", "j cole" → "jcole"
 */
export function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, "");
}

/**
 * Expand a word to spaced-out letters: "amari" → "a m a r i"
 */
export function expandToSpaced(word: string): string {
  return word.split("").join(" ");
}

// ─── Pattern Detection ─────────────────────────────────────────────────────────

/**
 * Detect if text is spaced-out single characters: "a m a r i" → true
 */
export function isSpacedOut(text: string): boolean {
  const parts = text.trim().split(/\s+/);
  return parts.length >= 3 && parts.every((p) => p.length === 1);
}

/**
 * Detect if text is a single continuous word (no spaces).
 */
export function isSingleWord(text: string): boolean {
  return !text.trim().includes(" ") && text.trim().length >= 3;
}

// ─── Common Substitutions ──────────────────────────────────────────────────────

const SUBSTITUTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\band\b/g, replacement: "&" },
  { pattern: /&/g, replacement: "and" },
  { pattern: /\bfeat\b/g, replacement: "featuring" },
  { pattern: /\bfeaturing\b/g, replacement: "feat" },
  { pattern: /\bft\b/g, replacement: "featuring" },
  { pattern: /\bpt\b/g, replacement: "part" },
  { pattern: /\bvol\b/g, replacement: "volume" },
];

// ─── Query Variation Generation ────────────────────────────────────────────────

/**
 * Generate smart query variations from a raw user query.
 *
 * Example outputs:
 *   "amari"      → ["amari", "a m a r i"]
 *   "a m a r i"  → ["a m a r i", "amari"]
 *   "j cole"     → ["j cole", "jcole"]
 *   "beyonse"    → ["beyonse"]  (fuzzy handled by Lucene ~, not here)
 *   "rock and roll" → ["rock and roll", "rock & roll"]
 */
export function generateQueryVariations(rawQuery: string): string[] {
  const normalized = normalizeText(rawQuery);
  if (!normalized) return [];

  const variations = new Set<string>();
  const words = normalized.split(/\s+/);

  // 1. Always include the normalized original
  variations.add(normalized);

  // 2. If it looks like spaced-out characters ("a m a r i"), add collapsed version
  if (isSpacedOut(normalized)) {
    const collapsed = collapseSpaces(normalized);
    if (collapsed.length >= 2) {
      variations.add(collapsed);
    }
  }

  // 3. If it's a single word (3–12 chars), add the spaced-out version
  //    This catches "amari" → "a m a r i"
  if (words.length === 1 && words[0].length >= 3 && words[0].length <= 12) {
    variations.add(expandToSpaced(words[0]));
  }

  // 4. For multi-word queries, add collapsed version: "j cole" → "jcole"
  //    Useful for artist names that are sometimes written without spaces
  if (words.length >= 2 && words.length <= 4) {
    const collapsed = collapseSpaces(normalized);
    if (collapsed.length >= 3 && collapsed.length <= 20) {
      variations.add(collapsed);
    }
  }

  // 5. For two-word queries where first word is a single letter ("j cole"),
  //    add version with period: "j. cole" (won't match Lucene but helps with alias matching)
  if (words.length === 2 && words[0].length === 1) {
    // The MusicBrainz search handles this via aliases, but we add the variation anyway
    variations.add(`${words[0]}. ${words.slice(1).join(" ")}`);
  }

  // 6. Common substitutions ("and" ↔ "&", "feat" ↔ "featuring")
  for (const { pattern, replacement } of SUBSTITUTIONS) {
    // Reset regex state (global flag)
    pattern.lastIndex = 0;
    if (pattern.test(normalized)) {
      pattern.lastIndex = 0;
      const sub = normalized.replace(pattern, replacement);
      if (sub !== normalized) {
        variations.add(sub);
      }
    }
  }

  // Cap at 8 variations max to keep queries reasonable
  return Array.from(variations).slice(0, 8);
}

// ─── Lucene Query Building ─────────────────────────────────────────────────────

/**
 * Escape special Lucene characters in a VALUE (not in operators like OR, ~, *).
 */
export function escapeLuceneValue(input: string): string {
  return input.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

/**
 * Determine the appropriate Lucene fuzzy edit distance for a word.
 * Shorter words get smaller distance to avoid too many false positives.
 */
function fuzzyDistance(word: string): number {
  if (word.length <= 3) return 0; // Too short for fuzzy
  if (word.length <= 5) return 1; // 1 edit for short words
  return 2; // 2 edits for longer words
}

/**
 * Build a smart MusicBrainz Lucene query that combines:
 *   - Phrase queries for each variation (OR'd) with BOOST operators
 *   - Fuzzy term queries for typo tolerance (low boost)
 *   - Wildcard prefix matching for partial input (low boost)
 *
 * The ^N boost operators ensure exact phrase matches score MUCH higher than
 * fuzzy/variation matches, so popular exact matches (like "Billie Jean" by MJ)
 * aren't buried under noise from fuzzy expansions.
 *
 * @param field     Lucene field name ("recording", "artist", "releasegroup")
 * @param rawQuery  The user's raw search input
 * @returns         A Lucene query string
 *
 * @example
 *   buildSmartLuceneQuery("recording", "amari")
 *   // → (recording:"amari"^4 OR recording:"a m a r i"^2 OR recording:amari~2 OR recording:amari*)
 *
 *   buildSmartLuceneQuery("recording", "Billie Jean")
 *   // → (recording:"billie jean"^4 OR recording:"billiejean"^2 OR (recording:billie~1 AND recording:jean~1))
 */
export function buildSmartLuceneQuery(field: string, rawQuery: string): string {
  const variations = generateQueryVariations(rawQuery);
  const normalized = normalizeText(rawQuery);
  const words = normalized.split(/\s+/);
  const parts: string[] = [];

  // ─── Phrase queries with boost ─────────────────────────────────────
  // First variation = original normalized query → highest boost
  // Remaining variations → medium boost
  for (let i = 0; i < variations.length; i++) {
    const boost = i === 0 ? 4 : 2;
    parts.push(`${field}:"${escapeLuceneValue(variations[i])}"^${boost}`);
  }

  // ─── Fuzzy term queries (low boost) ────────────────────────────────
  // Only for words 4+ chars to avoid noise. Low boost so they don't
  // outrank exact phrase matches.
  const fuzzyTerms = words
    .filter((w) => fuzzyDistance(w) > 0)
    .map((w) => `${field}:${escapeLuceneValue(w)}~${fuzzyDistance(w)}`);

  if (fuzzyTerms.length > 0) {
    if (fuzzyTerms.length > 1) {
      // Multiple fuzzy terms → AND them so all must match
      parts.push(`(${fuzzyTerms.join(" AND ")})`);
    } else {
      parts.push(fuzzyTerms[0]);
    }
  }

  // ─── Wildcard prefix for partial input (low boost) ─────────────────
  // Supports "type-ahead" behavior.
  // Single word: "michae" -> "michae*" matches "michael"
  // Multi word:  "beat i" -> "beat AND i*" matches "beat it"

  if (words.length > 0) {
    const lastWord = words[words.length - 1];
    const dropLast = words.slice(0, -1);

    // Valid for prefix if last word is at least 2 chars (e.g. "Be" -> "Beat")
    // OR if we have multiple words and the last is at least 1 char (e.g. "Beat I" -> "Beat It")
    const isPrefixable =
      words.length > 1 ? lastWord.length >= 1 : lastWord.length >= 3;

    if (isPrefixable) {
      const prefixPart = `${field}:${escapeLuceneValue(lastWord)}*`;
      if (dropLast.length > 0) {
        // AND with previous words: (field:beat AND field:i*)
        const previousPart = dropLast
          .map((w) => `${field}:${escapeLuceneValue(w)}`)
          .join(" AND ");
        parts.push(`(${previousPart} AND ${prefixPart})`);
      } else {
        // Single word prefix
        parts.push(prefixPart);
      }
    }
  }

  // ─── Combine with OR ──────────────────────────────────────────────
  if (parts.length === 1) return parts[0];
  return `(${parts.join(" OR ")})`;
}

// ─── Post-fetch Smart Re-ranking ───────────────────────────────────────────────

/**
 * Calculate a "smart match score" between a user query and a result title.
 * Uses normalized + collapsed comparison to handle spaced-out titles, special chars, etc.
 *
 * @returns 0–100 where 100 = perfect match
 */
export function smartMatchScore(query: string, title: string): number {
  const normQuery = normalizeText(query);
  const normTitle = normalizeText(title);
  const collapsedQuery = collapseSpaces(normQuery);
  const collapsedTitle = collapseSpaces(normTitle);

  // Perfect match (after normalization or collapsing)
  if (normTitle === normQuery || collapsedTitle === collapsedQuery) return 100;

  // Title starts with query
  if (
    normTitle.startsWith(normQuery) ||
    collapsedTitle.startsWith(collapsedQuery)
  )
    return 90;

  // Query starts with title (user typed more than the title)
  if (
    normQuery.startsWith(normTitle) ||
    collapsedQuery.startsWith(collapsedTitle)
  )
    return 85;

  // Title contains query
  if (normTitle.includes(normQuery) || collapsedTitle.includes(collapsedQuery))
    return 75;

  // Query contains title
  if (normQuery.includes(normTitle) || collapsedQuery.includes(collapsedTitle))
    return 70;

  // Word-level overlap
  const queryWords = new Set(
    normQuery.split(/\s+/).filter((w) => w.length > 1),
  );
  const titleWords = normTitle.split(/\s+/).filter((w) => w.length > 1);
  if (queryWords.size > 0 && titleWords.length > 0) {
    const matchedWords = titleWords.filter((w) => queryWords.has(w)).length;
    if (matchedWords > 0) {
      const overlap =
        matchedWords / Math.max(queryWords.size, titleWords.length);
      return 40 + overlap * 30;
    }
  }

  // Character-level similarity on collapsed versions
  const similarity = longestCommonSubsequenceRatio(
    collapsedQuery,
    collapsedTitle,
  );
  return Math.round(similarity * 40);
}

/**
 * Longest Common Subsequence ratio (0–1).
 * Measures how much of the shorter string appears in order within the longer one.
 */
function longestCommonSubsequenceRatio(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;

  const m = a.length;
  const n = b.length;

  // Optimized 2-row DP
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  const lcsLen = prev[n];
  return lcsLen / Math.max(m, n);
}

/**
 * Re-rank search results by how well their title matches the user's query.
 *
 * Items with significantly higher smart match scores are promoted.
 * For items within a small score difference, the original MusicBrainz order
 * (which encodes popularity/relevance) is preserved.
 *
 * @param results  Array of results with at least a `title` and optional `score`
 * @param query    The user's raw search query
 * @returns        Re-ranked array (same items, different order)
 */
export function smartRerank<T extends { title: string; score?: number }>(
  results: T[],
  query: string,
): T[] {
  if (results.length <= 1) return results;

  return results
    .map((item, originalIndex) => ({
      item,
      matchScore: smartMatchScore(query, item.title),
      originalIndex,
    }))
    .sort((a, b) => {
      // Only reorder if there's a meaningful difference in match quality
      const scoreDiff = b.matchScore - a.matchScore;
      if (Math.abs(scoreDiff) > 10) return scoreDiff;

      // Within similar match quality, preserve MusicBrainz relevance order
      return a.originalIndex - b.originalIndex;
    })
    .map(({ item }) => item);
}
