"use client";

import { useState } from "react";

// Shows the current cover (on the edit form) and swaps in a live preview the
// moment a new file is picked, so the producer sees the art before saving.
export function CoverField({ currentUrl }: { currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // A blob URL renders the chosen file without a round-trip; falling back to
    // the current cover when the picker is cleared.
    setPreview(file ? URL.createObjectURL(file) : currentUrl ?? null);
  }

  return (
    <div className="space-y-2">
      <label htmlFor="cover" className="block text-sm text-muted">
        Capa (opcional)
      </label>
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 flex-none overflow-hidden rounded border border-border bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Capa do beat" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
              sem capa
            </div>
          )}
        </div>
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          onChange={onChange}
          className="text-sm text-muted file:mr-3 file:rounded file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:border-foreground"
        />
      </div>
    </div>
  );
}
