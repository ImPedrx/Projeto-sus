import { BeatRow } from "@/components/beat-row";
import { createServerClient } from "@/lib/supabase/server";
import { listPublishedBeats, type BeatKind } from "@/lib/beats/queries";
import { copyFor, type Locale } from "@/lib/i18n";

export async function Catalog({
  locale,
  kind = "beat",
}: {
  locale: Locale;
  kind?: BeatKind;
}) {
  const t = copyFor(locale);
  const supabase = await createServerClient();
  const beats = await listPublishedBeats(supabase, { kind });

  const services = kind === "service";

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="display text-[clamp(1.75rem,4vw,2.75rem)]">
        {services ? t.servicesTitle : t.catalogTitle}
      </h1>

      {services && <p className="mt-4 max-w-xl text-muted">{t.servicesLead}</p>}

      {beats.length === 0 ? (
        <p className="mt-10 max-w-md text-muted">
          {services ? t.emptyServices : t.emptyCatalog}
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
