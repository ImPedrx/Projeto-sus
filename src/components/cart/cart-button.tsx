"use client";

import { useCart } from "@/components/cart/cart-provider";
import { copyFor, type Locale } from "@/lib/i18n";

export function CartButton({ locale }: { locale: Locale }) {
  const t = copyFor(locale);
  const { items, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t.cartOpen}
      className="mono flex items-center gap-2 border border-border px-3 py-2 text-xs transition-colors hover:border-foreground"
    >
      <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current" aria-hidden>
        <path d="M2 3h2l1.5 8h7L14 5.5H5" strokeWidth="1.4" />
        <circle cx="6.5" cy="13.5" r="1" />
        <circle cx="12" cy="13.5" r="1" />
      </svg>
      {items.length > 0 && <span>{items.length}</span>}
    </button>
  );
}
