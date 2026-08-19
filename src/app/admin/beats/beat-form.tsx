"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm text-muted">
          Título
        </label>
        <input id="title" name="title" required className={field} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm text-muted">
            Preço (R$)
          </label>
          <input id="price" name="price" inputMode="decimal" required className={field} />
        </div>
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

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Categorias</legend>
        {categories.map((category) => (
          <label key={category.id} className="flex items-center gap-2">
            <input type="checkbox" name="categoryIds" value={category.id} />
            {category.name}
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="preview" className="block text-sm text-muted">
          Preview com tag (MP3)
        </label>
        <input id="preview" name="preview" type="file" accept="audio/mpeg" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="masterMp3" className="block text-sm text-muted">
          MP3 sem tag
        </label>
        <input id="masterMp3" name="masterMp3" type="file" accept="audio/mpeg" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="masterWav" className="block text-sm text-muted">
          WAV sem tag (opcional)
        </label>
        <input id="masterWav" name="masterWav" type="file" accept="audio/wav" />
      </div>
      <div className="space-y-2">
        <label htmlFor="cover" className="block text-sm text-muted">
          Capa (opcional)
        </label>
        <input id="cover" name="cover" type="file" accept="image/*" />
      </div>

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
        {pending ? "Enviando..." : "Salvar beat"}
      </button>
    </form>
  );
}
