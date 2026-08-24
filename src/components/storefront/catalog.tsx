import Link from "next/link";
import { BeatRow } from "@/components/beat-row";
import { createServerClient } from "@/lib/supabase/server";
import { listPublishedBeats, listCategories, type BeatKind } from "@/lib/beats/queries";
import { copyFor, pathFor, type Locale } from "@/lib/i18n";

export async function Catalog({
  locale,
  categorySlug,
  kind = "beat",
}: {
  locale: Locale;
  categorySlug?: string;
  kind?: BeatKind;
}) {
  const t = copyFor(locale);
  const supabase = await createServerClient();
  const [beats, categories] = await Promise.all([
    listPublishedBeats(supabase, { categorySlug, kind }),
    listCategories(supabase),
  ]);

  const services = kind === "service";
  const base = pathFor(locale, services ? "services" : "catalog");
  const active = categories.find((category) => category.slug === categorySlug);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="display text-[clamp(1.75rem,4vw,2.75rem)]">
        {services ? t.servicesTitle : t.catalogTitle}
      </h1>

      {services && <p className="mt-4 max-w-xl text-muted">{t.servicesLead}</p>}

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <FilterLink href={base} label={t.filterAll} active={!categorySlug} />
          {categories.map((category) => (
            <FilterLink
              key={category.slug}
              href={`${base}?categoria=${category.slug}`}
              label={category.name}
              active={category.slug === categorySlug}
            />
          ))}
        </div>
      )}

      {beats.length === 0 ? (
        <p className="mt-10 max-w-md text-muted">
          {active
            ? t.emptyCategory(active.name)
            : services
              ? t.emptyServices
              : t.emptyCatalog}
        </p>
      ) : (
        // Rows rather than a grid: the catalogue is scanned by title, price and
        // tempo, and a list puts those in aligned columns the eye can run down.
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {beats.map((beat) => (
            <li key={beat.id}>
              <BeatRow beat={beat} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`mono border px-4 py-2 text-xs transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
