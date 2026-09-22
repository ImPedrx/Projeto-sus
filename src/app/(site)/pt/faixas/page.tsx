import type { Metadata } from "next";
import { Catalog } from "@/components/storefront/catalog";
import { copyFor, pathFor } from "@/lib/i18n";

const t = copyFor("pt");

export const metadata: Metadata = {
  title: `${t.catalogTitle} — Sus`,
  description: t.metaDescription,
  alternates: {
    canonical: pathFor("pt", "catalog"),
    languages: { "pt-BR": pathFor("pt", "catalog"), en: pathFor("en", "catalog") },
  },
};

export default function CatalogPagePt() {
  return <Catalog locale="pt" />;
}
