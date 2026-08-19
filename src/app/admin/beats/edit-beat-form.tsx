"use client";

import { useState } from "react";

type Category = { id: number; name: string };
type Result = { error: string } | { ok: true };

export function EditBeatForm({
  categories,
  beat,
  action,
}: {
  categories: Category[];
  beat: {
    title: string;
    priceCents: number;
    bpm: number | null;
    musicalKey: string | null;
    description: string | null;
    categoryIds: number[];
  };
  action: (formData: FormData) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const result = await action(new FormData(event.currentTarget));
    if ("error" in result) setError(result.error);
    else setSaved(true);
  }

  const field = "w-full rounded border border-border bg-surface px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm text-muted">
          Título
        </label>
        <input id="title" name="title" defaultValue={beat.title} required className={field} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm text-muted">
            Preço (R$)
          </label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={(beat.priceCents / 100).toFixed(2)}
            required
            className={field}
          />
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

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Categorias</legend>
        {categories.map((category) => (
          <label key={category.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="categoryIds"
              value={category.id}
              defaultChecked={beat.categoryIds.includes(category.id)}
            />
            {category.name}
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-muted">Alterações salvas.</p>}

      <button
        type="submit"
        className="rounded bg-foreground px-4 py-2 font-medium text-background"
      >
        Salvar
      </button>
    </form>
  );
}
