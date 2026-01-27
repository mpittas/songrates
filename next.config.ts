import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "coverartarchive.org",
      },
      {
        protocol: "https",
        hostname: "coverartarchive.org",
      },
    ],
  },
};

export default nextConfig;
