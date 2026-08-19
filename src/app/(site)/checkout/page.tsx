import type { Metadata } from "next";
import { CheckoutForm } from "@/app/(site)/checkout/checkout-form";
import { copyFor } from "@/lib/i18n";

const t = copyFor("pt");

export const metadata: Metadata = {
  title: `${t.checkoutTitle} — SusProd`,
  // A request form has nothing to offer a search engine and everything to lose
  // from being indexed.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="display text-3xl">{t.checkoutTitle}</h1>
      <p className="mt-4 max-w-xl text-muted">{t.checkoutLead}</p>

      <div className="mt-10">
        <CheckoutForm locale="pt" />
      </div>
    </main>
  );
}
