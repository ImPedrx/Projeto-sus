"use client";

import { useState } from "react";
import type { BeatStatus } from "@/lib/beats/queries";

type Result = { error: string } | { ok: true };

export function BeatRowActions({
  id,
  status,
  setStatus,
  remove,
}: {
  id: number;
  status: BeatStatus;
  setStatus: (id: number, status: BeatStatus) => Promise<Result>;
  remove: (id: number) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(work: () => Promise<Result>) {
    setPending(true);
    setError(null);
    const result = await work();
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  // A sold beat is out of circulation; flipping it back to draft or published
  // would put a beat someone bought exclusively back on the shelf.
  const nextStatus: BeatStatus = status === "published" ? "draft" : "published";

  return (
    <div className="flex items-center gap-4">
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {status !== "sold" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setStatus(id, nextStatus))}
          className="text-sm underline disabled:opacity-50"
        >
          {status === "published" ? "Despublicar" : "Publicar"}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => remove(id))}
        className="text-sm text-muted disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  );
}
