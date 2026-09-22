import type { Metadata } from "next";
import { Catalog } from "@/components/storefront/catalog";
import { copyFor, pathFor } from "@/lib/i18n";

const t = copyFor("pt");

export const metadata: Metadata = {
  title: `${t.servicesTitle} — Sus`,
  description: t.servicesLead,
  alternates: {
    canonical: pathFor("pt", "services"),
    languages: { "pt-BR": pathFor("pt", "services"), en: pathFor("en", "services") },
  },
};

export default function ServicesPagePt() {
  return <Catalog locale="pt" kind="service" />;
}
