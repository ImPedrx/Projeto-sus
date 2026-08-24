import type { Metadata } from "next";
import { Catalog } from "@/components/storefront/catalog";
import { copyFor, pathFor } from "@/lib/i18n";

const t = copyFor("en");

export const metadata: Metadata = {
  title: `${t.servicesTitle} — Sus`,
  description: t.servicesLead,
  alternates: {
    canonical: pathFor("en", "services"),
    languages: { "pt-BR": pathFor("pt", "services"), en: pathFor("en", "services") },
  },
};

export default async function ServicesPageEn({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  return <Catalog locale="en" kind="service" categorySlug={categoria} />;
}
