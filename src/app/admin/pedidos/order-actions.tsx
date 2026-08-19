"use client";

import { useState } from "react";
import type { OrderStatus } from "@/lib/supabase/types";
import type { ActionResult, DeliveryLink, DeliveryResult } from "./actions";

export function OrderActions({
  id,
  status,
  approve,
  cancel,
  markPaid,
  sign,
}: {
  id: number;
  status: OrderStatus;
  approve: (id: number) => Promise<ActionResult>;
  cancel: (id: number) => Promise<ActionResult>;
  markPaid: (id: number) => Promise<ActionResult>;
  sign: (id: number) => Promise<DeliveryResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [links, setLinks] = useState<DeliveryLink[] | null>(null);

  // The actions return their result instead of throwing, so the message has to
  // be rendered here — a form action that returns a value swallows it.
  async function run(work: () => Promise<ActionResult>) {
    setPending(true);
    setError(null);
    const result = await work();
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  async function generate() {
    setPending(true);
    setError(null);
    const result = await sign(id);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setLinks(result.links);
  }

  const open = status === "pending" || status === "approved";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {status === "pending" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approve(id))}
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Aprovar
          </button>
        )}

        {status === "approved" && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={generate}
              className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              Gerar links de entrega
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markPaid(id))}
              className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
            >
              Marcar como pago
            </button>
          </>
        )}

        {status === "paid" && (
          <button
            type="button"
            disabled={pending}
            onClick={generate}
            className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            Gerar links de entrega
          </button>
        )}

        {open && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => cancel(id))}
            className="rounded px-4 py-2 text-sm text-muted disabled:opacity-50"
          >
            Cancelar pedido
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="border border-border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {links && (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm text-muted">
            Links válidos até {new Date(links[0].expiresAt).toLocaleDateString("pt-BR")}. Envie
            junto da cobrança; depois disso eles param de funcionar.
          </p>
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.url} className="flex flex-wrap items-center gap-3">
                <span className="min-w-48 flex-1 text-sm">{link.title}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link.url)}
                  className="rounded border border-border px-3 py-1 text-xs"
                >
                  Copiar link
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
