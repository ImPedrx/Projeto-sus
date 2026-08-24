export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

export type Page = "home" | "catalog" | "services" | "checkout";

// English lives at the root and Portuguese under /pt: most buyers are abroad,
// so they get the clean URLs, while the Brazilian audience keeps a real address
// for each language and search engines get one per locale.
const PATHS: Record<Locale, Record<Page, string>> = {
  en: {
    home: "/",
    catalog: "/tracks",
    services: "/services",
    checkout: "/checkout",
  },
  pt: {
    home: "/pt",
    catalog: "/pt/faixas",
    services: "/pt/servicos",
    checkout: "/pt/checkout",
  },
};

export function pathFor(locale: Locale, page: Page): string {
  return PATHS[locale][page];
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/pt" || pathname.startsWith("/pt/") ? "pt" : "en";
}

export const dictionary = {
  pt: {
    heroEyebrow: "Sus · produção musical",
    heroTitleLine1: "Escolhe",
    heroTitleLine2: "o beat.",
    heroTitleLine3: "Grava hoje.",
    heroLead:
      "Trap, drill, boom bap e o que mais aparecer. Ouça o preview aqui mesmo; depois da compra o arquivo sem tag vai direto pro seu e-mail.",
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
    catalogTitle: "Faixas",
    servicesTitle: "Serviços",
    servicesLead:
      "Mixagem, master, beat sob encomenda e o que mais o seu projeto pedir. Escolha um serviço e o produtor responde por e-mail com prazo e forma de pagamento.",
    emptyServices:
      "Nenhum serviço publicado ainda. Eles aparecem aqui assim que saem do rascunho no painel.",
    filterAll: "Todos",
    navCatalog: "Faixas",
    navServices: "Serviços",
    navLogin: "Login",
    footerTagline: "Sus — beats e projetos exclusivos",
    cardNoCategory: "sem categoria",
    cardNoMeta: "sem metadados",
    cardPlay: "ouvir preview",
    cardPlaying: "tocando preview",
    cardPlayLabel: (title: string) => `Ouvir ${title}`,
    cardPauseLabel: (title: string) => `Pausar ${title}`,
    languageLabel: "Idioma",
    cardExpand: "Ver detalhes",
    dialogClose: "Fechar",
    specBpm: "BPM",
    specKey: "Tom",
    specDuration: "Duração",
    specFormats: "Formatos",
    specCategories: "Categorias",
    specPosted: "Postado em",
    specUnknown: "—",
    postedOn: (date: string) => `postado em ${date}`,
    priceFrom: (price: string) => `a partir de ${price}`,
    licenseTitle: "Licença",
    licenseMp3: "MP3",
    licenseWav: "WAV",
    licenseExclusive: "EXCLUSIVE",
    licenseInquire: "sob consulta",
    licenseMp3Note: "MP3 sem tag, uso não exclusivo.",
    licenseWavNote: "WAV e MP3 sem tag, uso não exclusivo.",
    licenseExclusiveNote:
      "Direitos exclusivos: o beat sai do catálogo. Valor combinado direto com o produtor.",
    licenseMp3Name: "Basic MP3",
    licenseWavName: "WAV Lease",
    licenseExclusiveName: "Exclusive",
    licenseMakeOffer: "Faça uma oferta",
    termsTitle: "O que essa licença permite",
    termsFor: (license: string, price: string) => `${license} · ${price}`,
    termFiles: "Arquivos liberados na hora da confirmação",
    termFormats: (formats: string) => `Formatos: ${formats}`,
    // Label first, value last: it reads the same whether the cap is a number or
    // "Ilimitado", and sidesteps agreeing the noun with a count of one.
    termStreams: (value: string) => `Streams: ${value}`,
    termPerformances: (value: string) => `Apresentações ao vivo: ${value}`,
    termBroadcasts: (value: string) => `Rádio/TV: ${value}`,
    termMusicVideos: (value: string) => `Videoclipes: ${value}`,
    termDistribution: (value: string) => `Cópias distribuídas: ${value}`,
    termUnlimited: "Ilimitado",
    termExclusiveNote:
      "Direitos exclusivos, sem limite de uso. O beat sai do catálogo e ninguém mais pode comprá-lo.",
    addToCart: "Adicionar ao carrinho",
    inCart: "No carrinho",
    cartTitle: "Carrinho",
    cartEmpty: "Seu carrinho está vazio. Escolha um beat para começar.",
    cartRemove: "Remover",
    cartTotalLabel: "Total",
    cartQuoteNote:
      "Os itens sob consulta não entram no total — o produtor envia o valor quando responder.",
    cartCheckout: "Finalizar pedido",
    cartOpen: "Abrir carrinho",
    checkoutTitle: "Fechar pedido",
    checkoutLead:
      "Confira os beats e deixe seu contato. O produtor responde por e-mail para combinar a forma de pagamento e enviar os arquivos.",
    checkoutEmpty: "Seu carrinho está vazio. Escolha um beat antes de fechar o pedido.",
    checkoutName: "Nome",
    checkoutEmail: "E-mail",
    checkoutEmailHint: "É por aqui que o produtor responde.",
    checkoutArtist: "Nome artístico",
    checkoutInstagram: "Instagram",
    checkoutNote: "Recado",
    fieldOptional: "opcional",
    checkoutSummary: "Seu pedido",
    checkoutSubmit: "Enviar pedido",
    checkoutSending: "Enviando...",
    checkoutDisclaimer:
      "Isto é um pedido, não uma cobrança. Nada é debitado agora: o produtor confirma a disponibilidade e combina o pagamento direto com você.",
    confirmEyebrow: "Pedido registrado",
    confirmTitle: "Recebemos seu pedido",
    confirmLead:
      "Guarde este código — é por ele que o produtor identifica seu pedido quando responder.",
    confirmPayment:
      "O contato chega no e-mail que você informou, com a forma de pagamento e o envio dos arquivos. Se não aparecer, confira a caixa de spam.",
    confirmBack: "Voltar ao catálogo",
    metaTitle: "Sus — beats exclusivos",
    metaDescription:
      "Beats de trap, drill e boom bap prontos para gravar. Preview no navegador e entrega do arquivo sem tag por e-mail.",
  },
  en: {
    heroEyebrow: "Sus · music production",
    heroTitleLine1: "Pick",
    heroTitleLine2: "the beat.",
    heroTitleLine3: "Record today.",
    heroLead:
      "Trap, drill, boom bap and whatever comes next. Preview it right here; once you buy, the untagged file lands in your inbox.",
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
    catalogTitle: "Tracks",
    servicesTitle: "Services",
    servicesLead:
      "Mixing, mastering, custom beats and whatever else the project needs. Pick a service and the producer replies by email with the turnaround and how to pay.",
    emptyServices:
      "No services published yet. They show up here as soon as they leave draft in the admin panel.",
    filterAll: "All",
    navCatalog: "Tracks",
    navServices: "Services",
    navLogin: "Login",
    footerTagline: "Sus — exclusive beats and custom projects",
    cardNoCategory: "no category",
    cardNoMeta: "no metadata",
    cardPlay: "play preview",
    cardPlaying: "playing preview",
    cardPlayLabel: (title: string) => `Play ${title}`,
    cardPauseLabel: (title: string) => `Pause ${title}`,
    languageLabel: "Language",
    cardExpand: "View details",
    dialogClose: "Close",
    specBpm: "BPM",
    specKey: "Key",
    specDuration: "Length",
    specFormats: "Formats",
    specCategories: "Categories",
    specPosted: "Posted",
    specUnknown: "—",
    postedOn: (date: string) => `posted ${date}`,
    priceFrom: (price: string) => `from ${price}`,
    licenseTitle: "License",
    licenseMp3: "MP3",
    licenseWav: "WAV",
    licenseExclusive: "EXCLUSIVE",
    licenseInquire: "inquire",
    licenseMp3Note: "Untagged MP3, non-exclusive use.",
    licenseWavNote: "Untagged WAV and MP3, non-exclusive use.",
    licenseExclusiveNote:
      "Full rights: the beat leaves the catalog. Price agreed directly with the producer.",
    licenseMp3Name: "Basic MP3",
    licenseWavName: "WAV Lease",
    licenseExclusiveName: "Exclusive",
    licenseMakeOffer: "Make offer",
    termsTitle: "What this license covers",
    termsFor: (license: string, price: string) => `${license} · ${price}`,
    termFiles: "Files released as soon as the order is confirmed",
    termFormats: (formats: string) => `Formats: ${formats}`,
    // Label first, value last: it reads the same whether the cap is a number or
    // "Unlimited", and sidesteps pluralising a noun after a count of one.
    termStreams: (value: string) => `Streams: ${value}`,
    termPerformances: (value: string) => `Live performances: ${value}`,
    termBroadcasts: (value: string) => `Radio/TV broadcasts: ${value}`,
    termMusicVideos: (value: string) => `Music videos: ${value}`,
    termDistribution: (value: string) => `Distributed copies: ${value}`,
    termUnlimited: "Unlimited",
    termExclusiveNote:
      "Full rights, no usage caps. The beat leaves the catalog and nobody else can buy it.",
    addToCart: "Add to cart",
    inCart: "In cart",
    cartTitle: "Cart",
    cartEmpty: "Your cart is empty. Pick a beat to start.",
    cartRemove: "Remove",
    cartTotalLabel: "Total",
    cartQuoteNote:
      "Items marked inquire stay out of the total — the producer sends the price when he replies.",
    cartCheckout: "Place order",
    cartOpen: "Open cart",
    checkoutTitle: "Place your order",
    checkoutLead:
      "Check the beats and leave your contact details. The producer replies by email to arrange payment and send the files.",
    checkoutEmpty: "Your cart is empty. Pick a beat before placing an order.",
    checkoutName: "Name",
    checkoutEmail: "Email",
    checkoutEmailHint: "This is where the producer replies.",
    checkoutArtist: "Artist name",
    checkoutInstagram: "Instagram",
    checkoutNote: "Message",
    fieldOptional: "optional",
    checkoutSummary: "Your order",
    checkoutSubmit: "Send order",
    checkoutSending: "Sending...",
    checkoutDisclaimer:
      "This is a request, not a charge. Nothing is billed now: the producer confirms availability and arranges payment with you directly.",
    confirmEyebrow: "Order received",
    confirmTitle: "We got your order",
    confirmLead:
      "Keep this code — it is how the producer identifies your order when he replies.",
    confirmPayment:
      "You will hear back at the email you gave, with the payment details and the files. If nothing arrives, check your spam folder.",
    confirmBack: "Back to the catalog",
    metaTitle: "Sus — exclusive beats",
    metaDescription:
      "Trap, drill and boom bap beats ready to record on. Preview in the browser, untagged files delivered by email.",
  },
} as const;

export type Copy = (typeof dictionary)[Locale];

export function copyFor(locale: Locale): Copy {
  return dictionary[locale];
}
