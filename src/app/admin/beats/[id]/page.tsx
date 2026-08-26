import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { publicAssetUrl } from "@/lib/beats/storage";
import { editBeatUploadTargets, updateBeat } from "../actions";
import { EditBeatForm } from "../edit-beat-form";

export default async function EditBeatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const beatId = Number(id);
  const supabase = await requireAdmin();

  const [{ data: beat }, { data: categories }] = await Promise.all([
    supabase
      .from("beats")
      .select(
        "id, title, kind, price_cents, price_wav_cents, price_exclusive_cents, bpm, musical_key, description, cover_path, beat_categories(category_id)",
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
          kind: beat.kind,
          priceCents: beat.price_cents,
          priceWavCents: beat.price_wav_cents,
          priceExclusiveCents: beat.price_exclusive_cents,
          bpm: beat.bpm,
          musicalKey: beat.musical_key,
          description: beat.description,
          categoryIds: (beat.beat_categories ?? []).map((link) => link.category_id),
          coverUrl: publicAssetUrl(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            beat.cover_path,
          ),
        }}
        action={updateBeat.bind(null, beatId)}
        uploadTargets={editBeatUploadTargets.bind(null, beatId)}
      />
    </div>
  );
}
