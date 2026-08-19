import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copyFor, pathFor } from "@/lib/i18n";
import { isOrderCode, normalizeOrderCode } from "@/lib/orders/code";

const t = copyFor("en");

export const metadata: Metadata = {
  title: `${t.confirmTitle} — SusProd`,
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPageEn({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = normalizeOrderCode((await params).code);
  if (!isOrderCode(code)) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="mono text-[11px] text-muted">{t.confirmEyebrow}</p>
      <h1 className="display mt-6 text-3xl">{t.confirmTitle}</h1>

      <p className="mono mt-8 border border-border bg-surface px-5 py-4 text-lg">{code}</p>

      <p className="mt-8 leading-relaxed text-muted">{t.confirmLead}</p>
      <p className="mt-4 leading-relaxed text-muted">{t.confirmPayment}</p>

      <Link
        href={pathFor("en", "catalog")}
        className="mono mt-10 inline-block border border-border px-4 py-2 text-xs transition-colors hover:border-foreground"
      >
        {t.confirmBack}
      </Link>
    </main>
  );
}
