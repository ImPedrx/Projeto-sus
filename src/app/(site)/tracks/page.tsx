import type { Metadata } from "next";
import { Catalog } from "@/components/storefront/catalog";
import { copyFor, pathFor } from "@/lib/i18n";

const t = copyFor("en");

export const metadata: Metadata = {
  title: `${t.catalogTitle} — Sus`,
  description: t.metaDescription,
  alternates: {
    canonical: pathFor("en", "catalog"),
    languages: { "pt-BR": pathFor("pt", "catalog"), en: pathFor("en", "catalog") },
  },
};

export default function CatalogPageEn() {
  return <Catalog locale="en" />;
}
