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
    // Audio masters no longer travel through a server action: the host rejects
    // any request body over 4.5 MB at the edge, before the action runs, so no
    // limit set here could ever have raised that ceiling. The browser uploads
    // each file straight to storage with a signed URL instead (see
    // src/lib/beats/upload-client.ts) and the action receives only paths.
    //
    // What is left to size is that text-only form, which is a few kilobytes.
    // The margin is for the description field and a long category list.
    serverActions: { bodySizeLimit: "1mb" },
  },
  // The catalogue used to live at /projects; the links are already out in the
  // world, so the old addresses keep working and point at the new ones.
  async redirects() {
    return [
      { source: "/projects", destination: "/tracks", permanent: true },
      { source: "/pt/projetos", destination: "/pt/faixas", permanent: true },
    ];
  },
  images: {
    // Cover art is served from the project's public storage bucket.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
