import { requireAdmin } from "@/lib/auth/require-admin";
import { createBeat, createBeatUploadTargets } from "../actions";
import { BeatForm } from "../beat-form";

export default async function NewBeatPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Novo beat</h1>
      <BeatForm action={createBeat} uploadTargets={createBeatUploadTargets} />
    </div>
  );
}
