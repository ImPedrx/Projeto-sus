import Link from "next/link";
import { BeatCard } from "@/components/beat-card";
import { createServerClient } from "@/lib/supabase/server";
import { listPublishedBeats, listCategories } from "@/lib/beats/queries";
import { copyFor, pathFor, type Locale } from "@/lib/i18n";

export async function Catalog({
  locale,
  categorySlug,
}: {
  locale: Locale;
  categorySlug?: string;
}) {
  const t = copyFor(locale);
  const supabase = await createServerClient();
  const [beats, categories] = await Promise.all([
    listPublishedBeats(supabase, { categorySlug }),
    listCategories(supabase),
  ]);

  const base = pathFor(locale, "catalog");
  const active = categories.find((category) => category.slug === categorySlug);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="display text-[clamp(1.75rem,4vw,2.75rem)]">{t.catalogTitle}</h1>

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
          {active ? t.emptyCategory(active.name) : t.emptyCatalog}
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {beats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} locale={locale} />
          ))}
        </div>
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
