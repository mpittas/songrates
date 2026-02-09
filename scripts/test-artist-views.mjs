import { SignJWT, importPKCS8 } from "jose";
import { readFileSync } from "fs";

const envContent = readFileSync(".env", "utf8");
const envVars = {};
const regex = /^(\w+)=("[\s\S]*?"|.*?)$/gm;
let match;
while ((match = regex.exec(envContent)) !== null) {
  let value = match[2];
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  envVars[match[1]] = value;
}

const key = await importPKCS8(envVars.APPLE_MUSIC_PRIVATE_KEY, "ES256");
const now = Math.floor(Date.now() / 1000);
const token = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: envVars.APPLE_MUSIC_KEY_ID, typ: "JWT" })
  .setIssuer(envVars.APPLE_MUSIC_TEAM_ID)
  .setIssuedAt(now)
  .setExpirationTime(now + 3600)
  .sign(key);

const h = { Authorization: `Bearer ${token}` };
const artistId = "21769"; // Snoop Dogg

// First: get the artist with views to see what's available
console.log("=== Fetching artist with ?include=albums&views=... ===\n");

const artistRes = await fetch(
  `https://api.music.apple.com/v1/catalog/us/artists/${artistId}?views=top-songs,full-albums,singles,compilation-albums,appears-on-albums,similar-artists,featured-albums,latest-release,top-music-videos,essential-albums,featured-playlists`,
  { headers: h }
);
const artistData = await artistRes.json();
const views = artistData?.data?.[0]?.views || {};
console.log("Available views:", Object.keys(views));
for (const [name, view] of Object.entries(views)) {
  const count = view.data?.length || 0;
  const href = view.href || "";
  console.log(`  ${name}: ${count} items, href=${href}`);
  if (count > 0 && view.data[0]?.attributes) {
    console.log(`    first: ${view.data[0].attributes.name}`);
  }
}

// Also test direct view endpoints
console.log("\n=== Testing direct /view/ endpoints ===\n");
const viewNames = [
  "top-songs", "full-albums", "singles", "compilation-albums",
  "appears-on-albums", "similar-artists", "featured-albums",
  "latest-release", "top-music-videos", "essential-albums",
  "featured-playlists", "live-albums"
];

for (const v of viewNames) {
  const r = await fetch(
    `https://api.music.apple.com/v1/catalog/us/artists/${artistId}/view/${v}?limit=3`,
    { headers: h }
  );
  const d = r.ok ? await r.json() : null;
  const count = d?.data?.length || 0;
  const total = d?.meta?.total;
  console.log(`${v}: status=${r.status}, items=${count}${total ? ', total=' + total : ''}`);
  if (count > 0 && d.data[0]?.attributes) {
    console.log(`  first: ${d.data[0].attributes.name} (type: ${d.data[0].type})`);
  }
}
