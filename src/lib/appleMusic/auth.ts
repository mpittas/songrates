/**
 * Apple Music Authentication
 * Generates JWT tokens for MusicKit API requests
 */

import { SignJWT, importPKCS8 } from "jose";

// Apple Music API constants
export const APPLE_MUSIC_BASE_URL = "https://api.music.apple.com/v1";

// JWT token cache (tokens expire after 6 months max, but we refresh periodically)
interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;
const TOKEN_REFRESH_BUFFER_MS = 60 * 60 * 1000; // Refresh 1 hour before expiry

/**
 * Generate a signed JWT token for Apple Music API
 * Valid for up to 6 months
 */
export async function generateAppleMusicToken(): Promise<string | null> {
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;

  if (!keyId || !teamId || !privateKey) {
    console.error("Missing Apple Music credentials. Check environment variables.");
    return null;
  }

  // Check cached token
  if (tokenCache && tokenCache.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
    return tokenCache.token;
  }

  try {
    // Import the private key (ES256 requires PKCS8 format)
    const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "ES256");

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 15552000; // 6 months (max allowed by Apple)

    const token = await new SignJWT({})
      .setProtectedHeader({
        alg: "ES256",
        kid: keyId,
        typ: "JWT",
      })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(key);

    // Cache the token
    tokenCache = {
      token,
      expiresAt: exp * 1000,
    };

    return token;
  } catch (error) {
    console.error("Failed to generate Apple Music token:", error);
    return null;
  }
}

/**
 * Get authorization headers for Apple Music API
 */
export async function getAppleMusicHeaders(): Promise<Record<string, string> | null> {
  const token = await generateAppleMusicToken();
  if (!token) return null;

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
