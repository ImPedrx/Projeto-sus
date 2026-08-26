"use client";

import { useState } from "react";
import { uploadAssets, type TargetRequest } from "@/lib/beats/upload-client";
import { CategoryField } from "./category-field";
import { CoverField } from "./cover-field";
import { KindField, PriceFields } from "./price-fields";

type Category = { id: number; name: string };
type Result = { error: string } | { ok: true };

export function EditBeatForm({
  categories,
  beat,
  action,
  uploadTargets,
}: {
  categories: Category[];
  beat: {
    title: string;
    kind: "beat" | "service";
    priceCents: number | null;
    priceWavCents: number | null;
    priceExclusiveCents: number | null;
    bpm: number | null;
    musicalKey: string | null;
    description: string | null;
    categoryIds: number[];
    coverUrl: string | null;
  };
  action: (formData: FormData) => Promise<Result>;
  uploadTargets: TargetRequest;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState(beat.kind);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);

    // A Server Action that throws — an expired session, a rejected request —
    // rejects this promise. Without the catch the button would sit on
    // "Salvando..." for ever and the producer would never learn why.
    try {
      const formData = new FormData(event.currentTarget);
      const uploadError = await uploadAssets(formData, uploadTargets);
      if (uploadError) {
        setError(uploadError);
        return;
      }

      const result = await action(formData);
      if ("error" in result) setError(result.error);
      else setSaved(true);
    } catch {
      setError("Não foi possível salvar. Recarregue a página e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  const field = "w-full rounded border border-border bg-surface px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      <div className="space-y-5">
        <KindField value={kind} onChange={setKind} />

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm text-muted">
            Título
          </label>
          <input id="title" name="title" defaultValue={beat.title} required className={field} />
        </div>

        <PriceFields
          // Remounts when the type changes so the fields for the other type do
          // not keep a stale defaultValue from the one just left behind.
          key={kind}
          kind={kind}
          defaults={{
            priceCents: beat.priceCents,
            priceWavCents: beat.priceWavCents,
            priceExclusiveCents: beat.priceExclusiveCents,
          }}
        />

        {kind === "beat" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="bpm" className="block text-sm text-muted">
              BPM
            </label>
            <input
              id="bpm"
              name="bpm"
              type="number"
              min={40}
              max={300}
              step={1}
              defaultValue={beat.bpm ?? ""}
              className={field}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="musicalKey" className="block text-sm text-muted">
              Tom
            </label>
            <input
              id="musicalKey"
              name="musicalKey"
              defaultValue={beat.musicalKey ?? ""}
              className={field}
            />
          </div>
        </div>
        )}

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm text-muted">
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={600}
            defaultValue={beat.description ?? ""}
            className={`${field} resize-y`}
          />
        </div>
      </div>

      <CoverField currentUrl={beat.coverUrl} />

      <CategoryField categories={categories} selected={beat.categoryIds} />

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-muted">Alterações salvas.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
