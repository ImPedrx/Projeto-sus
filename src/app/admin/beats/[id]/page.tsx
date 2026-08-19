import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { updateBeat } from "../actions";
import { EditBeatForm } from "../edit-beat-form";

export default async function EditBeatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const beatId = Number(id);
  const supabase = await createServerClient();

  const [{ data: beat }, { data: categories }] = await Promise.all([
    supabase
      .from("beats")
      .select(
        "id, title, price_cents, bpm, musical_key, description, beat_categories(category_id)",
      )
      .eq("id", beatId)
      .single(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!beat) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{beat.title}</h1>
      <EditBeatForm
        categories={categories ?? []}
        beat={{
          title: beat.title,
          priceCents: beat.price_cents,
          bpm: beat.bpm,
          musicalKey: beat.musical_key,
          description: beat.description,
          categoryIds: (beat.beat_categories ?? []).map((link) => link.category_id),
        }}
        action={updateBeat.bind(null, beatId)}
      />
    </div>
  );
}
