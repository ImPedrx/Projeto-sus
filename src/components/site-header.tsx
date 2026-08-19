import Link from "next/link";
import { copyFor, pathFor, type Locale } from "@/lib/i18n";
import { CartButton } from "@/components/cart/cart-button";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = copyFor(locale);
  const other: Locale = locale === "pt" ? "en" : "pt";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={pathFor(locale, "home")} className="display text-lg tracking-tight">
          SUSPROD<span className="text-muted">_</span>
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
              href="/admin/login"
              className="mono bg-foreground px-4 py-2 text-xs text-background transition-opacity hover:opacity-80"
            >
              {t.navLogin}
            </Link>
            <CartButton locale={locale} />
          </nav>
        </div>
      </div>
    </header>
  );
}
