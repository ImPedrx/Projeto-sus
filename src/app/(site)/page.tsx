import type { Metadata } from "next";
import { Home } from "@/components/storefront/home";
import { copyFor, pathFor } from "@/lib/i18n";

const t = copyFor("en");

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: {
    canonical: pathFor("en", "home"),
    languages: { "pt-BR": pathFor("pt", "home"), en: pathFor("en", "home") },
  },
};

export default function HomePageEn() {
  return <Home locale="en" />;
}
