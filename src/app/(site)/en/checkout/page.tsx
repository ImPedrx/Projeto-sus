import type { Metadata } from "next";
import { CheckoutForm } from "@/app/(site)/checkout/checkout-form";
import { copyFor } from "@/lib/i18n";

const t = copyFor("en");

export const metadata: Metadata = {
  title: `${t.checkoutTitle} — SusProd`,
  robots: { index: false, follow: false },
};

export default function CheckoutPageEn() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="display text-3xl">{t.checkoutTitle}</h1>
      <p className="mt-4 max-w-xl text-muted">{t.checkoutLead}</p>

      <div className="mt-10">
        <CheckoutForm locale="en" />
      </div>
    </main>
  );
}
