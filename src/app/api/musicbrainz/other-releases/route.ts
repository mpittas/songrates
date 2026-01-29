import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

interface ReleaseGroup {
  id: string;
  title: string;
  "first-release-date"?: string;
  "primary-type"?: string;
  "secondary-types"?: string[];
}

interface GroupedReleases {
  [type: string]: {
    id: string;
    title: string;
    releaseDate?: string;
  }[];
}

export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");
  if (!artistId) return NextResponse.json({ releases: {} });

  try {
    // Fetch all release groups for this artist
    const limit = 100;
    let offset = 0;
    let allReleaseGroups: ReleaseGroup[] = [];
    let hasMore = true;

    while (hasMore) {
      const url = `${MB_BASE_URL}/release-group?artist=${artistId}&release-group-status=website-default&fmt=json&limit=${limit}&offset=${offset}`;

      const res = await fetch(url, {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (!res.ok) throw new Error("MB API Error");
      const data = await res.json();

      const pageGroups = data["release-groups"] || [];
      allReleaseGroups = [...allReleaseGroups, ...pageGroups];

      if (pageGroups.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        // Be nice to the API (approx 1 req/sec)
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    const releaseGroups = allReleaseGroups;

    // Group releases by type
    const grouped: GroupedReleases = {};

    releaseGroups.forEach((rg) => {
      const primaryType = rg["primary-type"];
      const secondaryTypes = rg["secondary-types"] || [];

      // Skip regular studio albums (those are shown in the main section)
      if (primaryType === "Album" && secondaryTypes.length === 0) {
        return;
      }

      // Skip albums with only "Soundtrack" or "Remix" secondary types (also in main section)
      if (primaryType === "Album") {
        const allowedInMainSection = ["Soundtrack", "Remix"];
        const hasOnlyAllowed = secondaryTypes.every((t) =>
          allowedInMainSection.includes(t),
        );
        if (hasOnlyAllowed) {
          return;
        }
      }

      // Determine the category for this release
      let category: string;

      if (primaryType === "Single") {
        category = "Singles";
      } else if (primaryType === "EP") {
        category = "EPs";
      } else if (secondaryTypes.includes("Compilation")) {
        category = "Compilations";
      } else if (secondaryTypes.includes("Live")) {
        category = "Live Albums";
      } else if (primaryType === "Album") {
        // Other album types we excluded from main
        category = "Other Albums";
      } else {
        // Broadcast, Other, etc.
        category = "Other";
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        id: rg.id,
        title: rg.title,
        releaseDate: rg["first-release-date"],
      });
    });

    // Sort each category by release date (newest first)
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );
    });

    return NextResponse.json({ releases: grouped });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ releases: {} });
  }
}
