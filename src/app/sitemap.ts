import type { MetadataRoute } from "next";

// Public routes only. The admin panel is intentionally absent and is also
// disallowed in robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prodigosus.store"
  ).replace(/\/+$/, "");
  const paths = ["", "/projetos", "/en", "/en/projects"];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
