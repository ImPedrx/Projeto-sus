import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { listPublishedBeats, listCategories } from "@/lib/beats/queries";
import { BeatCard } from "@/components/beat-card";
import { Waveform } from "@/components/waveform";

export default async function HomePage() {
  const supabase = await createServerClient();
  const [beats, categories] = await Promise.all([
    listPublishedBeats(supabase, { limit: 8 }),
    listCategories(supabase),
  ]);

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-10 md:pt-28">
          <p className="mono text-[11px] text-muted">Produção musical · SusProd</p>

          <h1 className="display mt-6 text-[clamp(2.25rem,10.5vw,9rem)]">
            Seu som
            <br />
            entra em
            <br />
            emergência
          </h1>

          <div className="mt-10 h-16 md:h-24">
            <Waveform seed="susprod" bars={96} />
          </div>

          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-muted">
              Beats prontos para gravar, com preview no navegador e entrega do
              arquivo sem tag depois da compra.
            </p>
            <Link
              href="/projetos"
              className="mono w-fit bg-foreground px-6 py-3 text-xs text-background transition-opacity hover:opacity-80"
            >
              Ouvir os projetos
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mono mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2 px-6 py-4 text-[11px] text-muted">
          <span>
            {beats.length} {beats.length === 1 ? "projeto publicado" : "projetos publicados"}
          </span>
          <span>
            {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
          </span>
          <span>preview com tag de voz</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display text-3xl">Últimos beats</h2>
          <Link href="/projetos" className="mono text-xs text-muted hover:text-foreground">
            ver todos
          </Link>
        </div>

        {beats.length === 0 ? (
          <p className="mt-8 max-w-md text-muted">
            Nenhum projeto publicado ainda. Os beats aparecem aqui assim que
            saem do rascunho no painel.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {beats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
