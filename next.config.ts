import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Audio masters are far larger than the 1 MB default for server actions.
    serverActions: { bodySizeLimit: "150mb" },
  },
};

export default nextConfig;
