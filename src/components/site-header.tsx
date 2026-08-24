import Link from "next/link";
import { copyFor, pathFor, type Locale } from "@/lib/i18n";
import { CartButton } from "@/components/cart/cart-button";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = copyFor(locale);
  const other: Locale = locale === "pt" ? "en" : "pt";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 h-[var(--header-h)]">
        <Link href={pathFor(locale, "home")} className="display text-lg tracking-tight">
          SUS
        </Link>

        <div className="flex items-center gap-4">
          {/* The language switch is a plain text pair rather than a third
              button, so the header still reads as two destinations. */}
          <Link
            href={pathFor(other, "home")}
            hrefLang={other}
            aria-label={t.languageLabel}
            className="mono text-xs text-muted transition-colors hover:text-foreground"
          >
            {locale === "pt" ? "EN" : "PT"}
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href={pathFor(locale, "catalog")}
              className="mono border border-border px-4 py-2 text-xs transition-colors hover:border-foreground"
            >
              {t.navCatalog}
            </Link>
            <Link
              href={pathFor(locale, "services")}
              className="mono border border-border px-4 py-2 text-xs transition-colors hover:border-foreground"
            >
              {t.navServices}
            </Link>
            {/* No login link: the panel is reached by typing /admin, which
                redirects to the login on its own. Keeping it out of the header
                also keeps it out of the buyer's way. */}
            <CartButton locale={locale} />
          </nav>
        </div>
      </div>
    </header>
  );
}
