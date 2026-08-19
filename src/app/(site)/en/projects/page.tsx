import type { Metadata } from "next";
import { Catalog } from "@/components/storefront/catalog";
import { copyFor, pathFor } from "@/lib/i18n";

const t = copyFor("en");

export const metadata: Metadata = {
  title: `${t.catalogTitle} — SusProd`,
  description: t.metaDescription,
  alternates: {
    canonical: pathFor("en", "catalog"),
    languages: { "pt-BR": pathFor("pt", "catalog"), en: pathFor("en", "catalog") },
  },
};

export default async function CatalogPageEn({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  return <Catalog locale="en" categorySlug={categoria} />;
}
