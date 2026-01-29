import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

export async function GET(request: NextRequest) {
  const albumId = request.nextUrl.searchParams.get("id"); // Release Group ID
  if (!albumId)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // 1. Fetch Release Group Info (includes artist, tags (genres), and URL relations for wikidata)
    const url = `${MB_BASE_URL}/release-group/${albumId}?inc=artist-credits+tags+url-rels+ratings&fmt=json`;

    const rgRes = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!rgRes.ok) throw new Error("MB Release Group Fetch Error");
    const rgData = await rgRes.json();

    const title = rgData.title;
    const artistName = rgData["artist-credit"]?.[0]?.name || "Unknown Artist";
    const artistId = rgData["artist-credit"]?.[0]?.artist?.id;
    const releaseDate = rgData["first-release-date"];
    const rating = rgData.rating?.score
      ? Math.round(rgData.rating.score * 10) / 10
      : null; // 0-5 scale usually, maybe 0-100? MB is 0-5 stars usually.
    const primaryType = rgData["primary-type"];
    const secondaryTypes = rgData["secondary-types"] || [];
    const type =
      secondaryTypes.length > 0 ? secondaryTypes.join(" / ") : primaryType;

    // Genres/Tags
    const genres =
      rgData.tags
        ?.sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)
        .map((t: any) => t.name) || [];

    // 2. Fetch Wikipedia URL via Wikidata (if available)
    let wikipediaUrl = null;
    const wikidataRel = rgData.relations?.find(
      (rel: any) => rel.type === "wikidata",
    );
    if (wikidataRel?.url?.resource) {
      const wikidataId = wikidataRel.url.resource.split("/").pop();
      try {
        const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks/urls&format=json`;
        const wdRes = await fetch(wdUrl, { next: { revalidate: 3600 } });
        const wdData = await wdRes.json();
        const siteLink = wdData.entities?.[wikidataId]?.sitelinks?.enwiki;
        if (siteLink?.url) {
          wikipediaUrl = siteLink.url;
        }
      } catch (e) {
        console.error("Wikidata fetch error", e);
      }
    }

    // 3. Fetch Tracks (from oldest release)
    // Similar heuristic as tracks endpoint
    const releasesRes = await fetch(
      `${MB_BASE_URL}/release-group/${albumId}?inc=releases&fmt=json`,
      {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );
    const releasesData = await releasesRes.json();

    // Pick oldest release (usually original)
    const release = releasesData.releases?.sort((a: any, b: any) =>
      (a.date || "9999").localeCompare(b.date || "9999"),
    )[0];

    let tracks = [];
    if (release) {
      const tracksRes = await fetch(
        `${MB_BASE_URL}/release/${release.id}?inc=recordings&fmt=json`,
        {
          headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
          next: { revalidate: 3600 },
        },
      );
      const tracksData = await tracksRes.json();

      tracks =
        tracksData.media
          ?.flatMap((m: any) => m.tracks)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            number: t.number,
            length: t.length,
          })) || [];
    }

    return NextResponse.json({
      id: albumId,
      title,
      artist: { name: artistName, id: artistId },
      type,
      releaseDate,
      genres,
      rating, // MB User Rating
      wikipediaUrl,
      tracks,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch info" },
      { status: 500 },
    );
  }
}
