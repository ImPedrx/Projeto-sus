"use client";

import { useState } from "react";

export function DeleteCategoryButton({
  id,
  action,
}: {
  id: number;
  action: (id: number) => Promise<{ error: string } | { ok: true }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    setError(null);
    const result = await action(id);
    setPending(false);
    // A delete can fail for a reason the admin can act on — a category still in
    // use by a beat — so the message has to reach the screen, not the console.
    if ("error" in result) setError(result.error);
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-sm text-muted disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  );
}
