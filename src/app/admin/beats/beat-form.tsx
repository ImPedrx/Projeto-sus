"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryField } from "./category-field";
import { CoverField } from "./cover-field";
import { KindField, PriceFields } from "./price-fields";

type Category = { id: number; name: string };
type Result = { error: string } | { ok: true; id: number };

export function BeatForm({
  categories,
  action,
}: {
  categories: Category[];
  action: (formData: FormData) => Promise<Result>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // A service has no audio and one price, so the type decides which half of the
  // form exists at all rather than merely how it is labelled.
  const [kind, setKind] = useState<"beat" | "service">("beat");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await action(new FormData(event.currentTarget));
    setPending(false);
    if ("error" in result) setError(result.error);
    else router.push("/admin");
  }

  const field = "w-full rounded border border-border bg-surface px-3 py-2";
  const fileInput =
    "text-sm text-muted file:mr-3 file:rounded file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:border-foreground";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      <div className="space-y-5">
      <KindField value={kind} onChange={setKind} />

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm text-muted">
          Título
        </label>
        <input id="title" name="title" required className={field} />
      </div>

      <PriceFields kind={kind} />

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
            placeholder="140"
            className={field}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="musicalKey" className="block text-sm text-muted">
            Tom
          </label>
          <input id="musicalKey" name="musicalKey" className={field} />
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
          placeholder="Do que esse beat é feito, para quem serve, referências."
          className={`${field} resize-y`}
        />
      </div>
      </div>

      <CategoryField categories={categories} />

      {kind === "beat" && (
      <div className="space-y-5 border-t border-border pt-6">
        <div className="space-y-2">
          <label htmlFor="preview" className="block text-sm text-muted">
            Preview com tag (MP3)
          </label>
          <input id="preview" name="preview" type="file" accept="audio/mpeg" required className={fileInput} />
        </div>
        <div className="space-y-2">
          <label htmlFor="masterMp3" className="block text-sm text-muted">
            MP3 sem tag
          </label>
          <input id="masterMp3" name="masterMp3" type="file" accept="audio/mpeg" required className={fileInput} />
        </div>
        <div className="space-y-2">
          <label htmlFor="masterWav" className="block text-sm text-muted">
            WAV sem tag (opcional)
          </label>
          <input id="masterWav" name="masterWav" type="file" accept="audio/wav" className={fileInput} />
        </div>
      </div>
      )}

      <CoverField />

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Enviando..." : kind === "beat" ? "Salvar beat" : "Salvar serviço"}
      </button>
    </form>
  );
}
