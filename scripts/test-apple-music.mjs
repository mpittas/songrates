import { SignJWT, importPKCS8 } from "jose";
import { readFileSync } from "fs";

// Parse .env manually to handle multiline values
const envContent = readFileSync(".env", "utf8");
const envVars = {};
const regex = /^(\w+)=("[\s\S]*?"|.*?)$/gm;
let match;
while ((match = regex.exec(envContent)) !== null) {
  let value = match[2];
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  envVars[match[1]] = value;
}

const keyId = envVars.APPLE_MUSIC_KEY_ID;
const teamId = envVars.APPLE_MUSIC_TEAM_ID;
const privateKey = envVars.APPLE_MUSIC_PRIVATE_KEY;
const storefront = envVars.APPLE_MUSIC_STOREFRONT || "us";

console.log("Key ID:", keyId);
console.log("Team ID:", teamId);
console.log("Storefront:", storefront);
console.log("Private key starts with:", privateKey?.substring(0, 30));

try {
  const key = await importPKCS8(privateKey, "ES256");
  console.log("\n✓ Private key imported successfully");

  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  console.log("✓ JWT token generated successfully");
  console.log("Token (first 50 chars):", token.substring(0, 50) + "...");

  const url = `https://api.music.apple.com/v1/catalog/${storefront}/search?term=test&types=songs&limit=1`;
  console.log("\nFetching:", url);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("Status:", res.status);

  if (res.ok) {
    const data = await res.json();
    const song = data?.results?.songs?.data?.[0];
    if (song) {
      console.log("\n✓ API call successful! Sample result:");
      console.log("  Song:", song.attributes.name);
      console.log("  Artist:", song.attributes.artistName);
      console.log("  Album:", song.attributes.albumName);
    } else {
      console.log("\n✓ API call successful but no song results");
      console.log(JSON.stringify(data, null, 2).substring(0, 300));
    }
  } else {
    const body = await res.text();
    console.log("✗ API call failed:", body.substring(0, 500));
  }
} catch (e) {
  console.error("\n✗ Error:", e.message);
}
