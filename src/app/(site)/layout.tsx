import { headers } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { PreviewPlayerProvider } from "@/components/preview-player";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { copyFor, localeFromPathname } from "@/lib/i18n";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy puts the pathname on the request, which is what lets a shared
  // layout know which language the page below it is rendering.
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const locale = localeFromPathname(pathname);
  const t = copyFor(locale);

  return (
    <PreviewPlayerProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
        <SiteHeader locale={locale} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border">
          <div className="mono mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[11px] text-muted">
            <span>{t.footerTagline}</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </footer>
        </div>
        <CartDrawer locale={locale} />
      </CartProvider>
    </PreviewPlayerProvider>
  );
}
