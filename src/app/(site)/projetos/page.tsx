import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { listPublishedBeats, listCategories } from "@/lib/beats/queries";
import { BeatCard } from "@/components/beat-card";

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createServerClient();
  const [beats, categories] = await Promise.all([
    listPublishedBeats(supabase, { categorySlug: categoria }),
    listCategories(supabase),
  ]);

  const active = categories.find((category) => category.slug === categoria);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">Projetos</h1>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <FilterLink href="/projetos" label="Todos" active={!categoria} />
          {categories.map((category) => (
            <FilterLink
              key={category.slug}
              href={`/projetos?categoria=${category.slug}`}
              label={category.name}
              active={category.slug === categoria}
            />
          ))}
        </div>
      )}

      {beats.length === 0 ? (
        <p className="mt-10 max-w-md text-muted">
          {active
            ? `Nenhum beat em ${active.name} por enquanto. Tente outra categoria.`
            : "Nenhum projeto publicado ainda. Os beats aparecem aqui assim que saem do rascunho no painel."}
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {beats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
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
