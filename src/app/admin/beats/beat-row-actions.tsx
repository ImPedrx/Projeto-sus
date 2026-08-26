"use client";

import { useState } from "react";
import type { BeatStatus } from "@/lib/beats/queries";

type Result = { error: string } | { ok: true };

export function BeatRowActions({
  id,
  status,
  orderCount,
  setStatus,
  archive,
  remove,
}: {
  id: number;
  status: BeatStatus;
  orderCount: number;
  setStatus: (id: number, status: BeatStatus) => Promise<Result>;
  archive: (id: number) => Promise<Result>;
  remove: (id: number) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(work: () => Promise<Result>) {
    setPending(true);
    setError(null);
    // A Server Action that throws rejects this promise, so without the catch
    // the row would stay disabled with nothing said.
    try {
      const result = await work();
      if ("error" in result) setError(result.error);
    } catch {
      setError("Não foi possível concluir. Recarregue a página e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  // A sold beat is out of circulation; flipping it back to draft or published
  // would put a beat someone bought exclusively back on the shelf.
  const nextStatus: BeatStatus = status === "published" ? "draft" : "published";

  // A beat with an order line behind it cannot be deleted: the foreign key is
  // ON DELETE RESTRICT, so the row has to survive for the order history. Taking
  // it off the shelf is archiving, and offering that button instead of a delete
  // that can only fail is the honest thing to show.
  const isArchived = status === "archived";
  const canDelete = orderCount === 0;

  const link = "text-sm underline disabled:opacity-50";

  return (
    <div className="flex items-center gap-4">
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      {isArchived ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setStatus(id, "draft"))}
          className={link}
        >
          Restaurar
        </button>
      ) : (
        <>
          {status !== "sold" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setStatus(id, nextStatus))}
              className={link}
            >
              {status === "published" ? "Despublicar" : "Publicar"}
            </button>
          )}
          {canDelete ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => remove(id))}
              className="text-sm text-muted disabled:opacity-50"
            >
              Excluir
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => archive(id))}
              className="text-sm text-muted disabled:opacity-50"
              title="Já vendido: a linha do pedido precisa dele, então sai da loja em vez de ser excluído."
            >
              Arquivar
            </button>
          )}
        </>
      )}
    </div>
  );
}
