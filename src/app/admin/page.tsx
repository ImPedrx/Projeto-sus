import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { listBeatsForAdmin } from "@/lib/beats/queries";
import { formatPrice } from "@/lib/beats/format";
import { setBeatStatus, deleteBeat } from "./beats/actions";
import { BeatRowActions } from "./beats/beat-row-actions";

const STATUS_LABEL = {
  draft: "Rascunho",
  published: "Publicado",
  sold: "Vendido",
} as const;

export default async function AdminHomePage() {
  const supabase = await createServerClient();
  const beats = await listBeatsForAdmin(supabase);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Beats</h1>
        <Link
          href="/admin/beats/novo"
          className="rounded bg-foreground px-4 py-2 font-medium text-background"
        >
          Novo beat
        </Link>
      </div>

      {beats.length === 0 ? (
        <p className="text-muted">Nenhum beat cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-border">
          {beats.map((beat) => (
            <li key={beat.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-48 flex-1">
                <Link href={`/admin/beats/${beat.id}`} className="font-medium">
                  {beat.title}
                </Link>
                <p className="text-sm text-muted">
                  {beat.categoryNames.join(", ") || "Sem categoria"} ·{" "}
                  {formatPrice(beat.priceCents)}
                </p>
              </div>
              <span className="text-sm text-muted">{STATUS_LABEL[beat.status]}</span>
              <BeatRowActions
                id={beat.id}
                status={beat.status}
                setStatus={setBeatStatus}
                remove={deleteBeat}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
