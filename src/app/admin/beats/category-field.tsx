"use client";

import { useState } from "react";

type Category = { id: number; name: string };

// A grid of toggle chips instead of a tall checkbox column. State is tracked in
// React and mirrored into hidden inputs, so the form still submits `categoryIds`
// exactly as the plain checkboxes did — no dependency on a Tailwind :has variant.
export function CategoryField({
  categories,
  selected = [],
}: {
  categories: Category[];
  selected?: number[];
}) {
  const [chosen, setChosen] = useState<Set<number>>(() => new Set(selected));

  function toggle(id: number) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm text-muted">Categorias</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map((category) => {
          const on = chosen.has(category.id);
          return (
            <button
              type="button"
              key={category.id}
              onClick={() => toggle(category.id)}
              aria-pressed={on}
              className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground hover:border-foreground"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
      {[...chosen].map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}
    </fieldset>
  );
}
