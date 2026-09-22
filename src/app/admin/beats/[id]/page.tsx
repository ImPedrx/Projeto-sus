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

  const { data: beat } = await supabase
    .from("beats")
    .select(
      "id, title, kind, price_cents, price_wav_cents, price_exclusive_cents, bpm, musical_key, description, cover_path",
    )
    .eq("id", beatId)
    .single();

  if (!beat) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{beat.title}</h1>
      <EditBeatForm
        beat={{
          title: beat.title,
          kind: beat.kind,
          priceCents: beat.price_cents,
          priceWavCents: beat.price_wav_cents,
          priceExclusiveCents: beat.price_exclusive_cents,
          bpm: beat.bpm,
          musicalKey: beat.musical_key,
          description: beat.description,
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
