"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/beats/format";
import { copyFor, pathFor, type Locale } from "@/lib/i18n";
import { placeOrder } from "@/app/(site)/checkout/actions";

export function CheckoutForm({ locale }: { locale: Locale }) {
  const t = copyFor(locale);
  const router = useRouter();
  const { items, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = items.reduce((sum, item) => sum + item.priceCents, 0);

  function onSubmit(formData: FormData) {
    setError(null);

    // A field no person can see and no person fills. Anything in it is a bot,
    // and it gets the confirmation screen without an order being written.
    if (formData.get("website")) {
      router.push(`${pathFor(locale, "checkout")}/SUS-000000`);
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        customerName: String(formData.get("customerName") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? ""),
        artistName: String(formData.get("artistName") ?? ""),
        instagram: String(formData.get("instagram") ?? ""),
        note: String(formData.get("note") ?? ""),
        beatIds: items.map((item) => item.id),
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      clear();
      router.push(`${pathFor(locale, "checkout")}/${result.code}`);
    });
  }

  if (items.length === 0) {
    return (
      <div className="border border-border p-8">
        <p className="text-muted">{t.checkoutEmpty}</p>
        <Link
          href={pathFor(locale, "catalog")}
          className="mono mt-6 inline-block border border-border px-4 py-2 text-xs transition-colors hover:border-foreground"
        >
          {t.navCatalog}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_20rem]">
      <form action={onSubmit} className="flex flex-col gap-5">
        <Field name="customerName" label={t.checkoutName} required maxLength={80} autoComplete="name" />
        <Field
          name="customerEmail"
          label={t.checkoutEmail}
          hint={t.checkoutEmailHint}
          required
          type="email"
          maxLength={120}
          autoComplete="email"
        />
        <Field name="artistName" label={t.checkoutArtist} maxLength={80} />
        <Field name="instagram" label={t.checkoutInstagram} maxLength={80} placeholder="@" />

        <label className="flex flex-col gap-2">
          <span className="mono text-[11px] text-muted">{t.checkoutNote}</span>
          <textarea
            name="note"
            rows={4}
            maxLength={1000}
            className="border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
          />
        </label>

        <div aria-hidden className="hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {error && (
          <p role="alert" className="border border-border bg-surface px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mono w-full bg-foreground px-4 py-3 text-xs text-background transition-opacity hover:opacity-80 disabled:opacity-40 md:w-fit"
        >
          {pending ? t.checkoutSending : t.checkoutSubmit}
        </button>

        <p className="text-xs leading-relaxed text-muted">{t.checkoutDisclaimer}</p>
      </form>

      <aside className="h-fit border border-border">
        <h2 className="mono border-b border-border px-5 py-3 text-[11px] text-muted">
          {t.checkoutSummary}
        </h2>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <span className="truncate text-sm">{item.title}</span>
              <span className="mono shrink-0 text-[11px] text-muted">
                {formatPrice(item.priceCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mono flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted">{t.cartTotalLabel}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  );
}

function Field({
  name,
  label,
  hint,
  ...props
}: {
  name: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="mono text-[11px] text-muted">
        {label}
        {!props.required && " ·"}
      </span>
      <input
        name={name}
        className="border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
        {...props}
      />
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
