export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

export type Page = "home" | "catalog";

// Portuguese lives at the root and English under /en, so the Brazilian
// audience keeps the clean URLs and search engines still get a real address
// for each language.
const PATHS: Record<Locale, Record<Page, string>> = {
  pt: { home: "/", catalog: "/projetos" },
  en: { home: "/en", catalog: "/en/projects" },
};

export function pathFor(locale: Locale, page: Page): string {
  return PATHS[locale][page];
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pt";
}

export const dictionary = {
  pt: {
    heroEyebrow: "SusProd · produção musical",
    heroTitleLine1: "Escolhe",
    heroTitleLine2: "o beat.",
    heroTitleLine3: "Grava hoje.",
    heroLead:
      "Trap, drill, boom bap e o que mais aparecer. Ouça o preview aqui mesmo; depois da compra o arquivo sem tag vai direto pro seu e-mail.",
    heroCta: "Ouvir os beats",
    statBeats: (count: number) => (count === 1 ? "1 beat no catálogo" : `${count} beats no catálogo`),
    statCategories: (count: number) =>
      count === 1 ? "1 categoria" : `${count} categorias`,
    statDelivery: "preview com tag · arquivo final limpo",
    latestTitle: "Últimos beats",
    seeAll: "ver todos",
    emptyCatalog:
      "Nenhum beat publicado ainda. Eles aparecem aqui assim que saem do rascunho no painel.",
    emptyCategory: (category: string) =>
      `Nenhum beat em ${category} por enquanto. Tente outra categoria.`,
    catalogTitle: "Projetos",
    filterAll: "Todos",
    navCatalog: "Projetos",
    navLogin: "Login",
    footerTagline: "SusProd — beats e projetos exclusivos",
    cardNoCategory: "sem categoria",
    cardNoMeta: "sem metadados",
    cardPlay: "ouvir preview",
    cardPlaying: "tocando preview",
    cardPlayLabel: (title: string) => `Ouvir ${title}`,
    cardPauseLabel: (title: string) => `Pausar ${title}`,
    languageLabel: "Idioma",
    metaTitle: "SusProd — beats exclusivos",
    metaDescription:
      "Beats de trap, drill e boom bap prontos para gravar. Preview no navegador e entrega do arquivo sem tag por e-mail.",
  },
  en: {
    heroEyebrow: "SusProd · music production",
    heroTitleLine1: "Pick",
    heroTitleLine2: "the beat.",
    heroTitleLine3: "Record today.",
    heroLead:
      "Trap, drill, boom bap and whatever comes next. Preview it right here; once you buy, the untagged file lands in your inbox.",
    heroCta: "Hear the beats",
    statBeats: (count: number) => (count === 1 ? "1 beat in the catalog" : `${count} beats in the catalog`),
    statCategories: (count: number) =>
      count === 1 ? "1 category" : `${count} categories`,
    statDelivery: "tagged preview · clean master on purchase",
    latestTitle: "Latest beats",
    seeAll: "see all",
    emptyCatalog:
      "No beats published yet. They show up here as soon as they leave draft in the admin panel.",
    emptyCategory: (category: string) =>
      `No beats in ${category} right now. Try another category.`,
    catalogTitle: "Projects",
    filterAll: "All",
    navCatalog: "Projects",
    navLogin: "Login",
    footerTagline: "SusProd — exclusive beats and custom projects",
    cardNoCategory: "no category",
    cardNoMeta: "no metadata",
    cardPlay: "play preview",
    cardPlaying: "playing preview",
    cardPlayLabel: (title: string) => `Play ${title}`,
    cardPauseLabel: (title: string) => `Pause ${title}`,
    languageLabel: "Language",
    metaTitle: "SusProd — exclusive beats",
    metaDescription:
      "Trap, drill and boom bap beats ready to record on. Preview in the browser, untagged files delivered by email.",
  },
} as const;

export type Copy = (typeof dictionary)[Locale];

export function copyFor(locale: Locale): Copy {
  return dictionary[locale];
}
