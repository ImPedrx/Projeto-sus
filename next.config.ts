import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Next blocks cross-origin requests to dev assets, and a phone on the LAN
  // reaches the server by IP rather than localhost. Without this the pages
  // render but every client chunk 403s, so nothing hydrates: no player, no
  // cart, no tilt.
  allowedDevOrigins: ['10.253.1.187', '10.253.1.*', '127.0.0.1'],
  experimental: {
    // Audio masters are far larger than the 1 MB default for server actions.
    serverActions: { bodySizeLimit: "150mb" },
    // A second, separate cap: because this app has a proxy, Next buffers each
    // request body in memory so both the proxy and the action can read it, and
    // that buffer defaults to 10 MB. Past it the body is silently truncated and
    // the action's multipart parser dies with "Unexpected end of form".
    // It has to sit above the largest upload, not above the largest file.
    proxyClientMaxBodySize: "120mb",
  },
  images: {
    // Cover art is served from the project's public storage bucket.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
