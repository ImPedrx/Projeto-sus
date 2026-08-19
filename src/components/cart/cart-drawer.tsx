"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/beats/format";
import { cartTotal } from "@/lib/cart";
import { copyFor, pathFor, type Locale } from "@/lib/i18n";

export function CartDrawer({ locale }: { locale: Locale }) {
  const t = copyFor(locale);
  const { items, remove, open, setOpen } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label={t.dialogClose}
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-label={t.cartTitle}
        className="relative flex h-full w-full max-w-sm flex-col border-l border-border bg-surface"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="display text-lg">{t.cartTitle}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mono text-xs text-muted hover:text-foreground"
          >
            {t.dialogClose}
          </button>
        </header>

        {items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">{t.cartEmpty}</p>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="relative size-14 shrink-0 overflow-hidden border border-border bg-surface-raised">
                  {item.coverUrl && (
                    <Image
                      src={item.coverUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover grayscale"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.title}</p>
                  <p className="mono text-[11px] text-muted">
                    {formatPrice(item.priceCents)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="mono text-[11px] text-muted hover:text-foreground"
                >
                  {t.cartRemove}
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="border-t border-border px-5 py-4">
          <div className="mono flex items-center justify-between text-sm">
            <span className="text-muted">{t.cartTotalLabel}</span>
            <span>{formatPrice(cartTotal(items))}</span>
          </div>
          <Link
            href={pathFor(locale, "checkout")}
            onClick={() => setOpen(false)}
            aria-disabled={items.length === 0}
            className={`mono mt-4 block w-full bg-foreground px-4 py-3 text-center text-xs text-background transition-opacity hover:opacity-80 ${
              items.length === 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            {t.cartCheckout}
          </Link>
        </footer>
      </aside>
    </div>
  );
}
