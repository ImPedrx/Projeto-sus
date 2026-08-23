import type { MetadataRoute } from "next";

// Keep the admin panel out of search indexes. This is hygiene, not a security
// boundary — the RLS policies are what actually protect the data.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prodigosus.store";
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${base}/sitemap.xml`,
  };
}
