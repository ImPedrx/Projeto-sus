import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getOrder } from "@/lib/orders/queries";
import { formatPrice } from "@/lib/beats/format";
import { STATUS_LABEL } from "../page";
import { OrderActions } from "../order-actions";
import { approveOrder, cancelOrder, markOrderPaid, signDelivery } from "../actions";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createServerClient();
  const order = await getOrder(supabase, id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/admin/pedidos" className="text-sm text-muted">
          ← Pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-mono text-2xl font-bold tracking-tight">{order.code}</h1>
          <span className="text-sm text-muted">{STATUS_LABEL[order.status]}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {new Date(order.createdAt).toLocaleString("pt-BR")}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Contato</h2>
        <dl className="divide-y divide-border border-y border-border text-sm">
          <Row label="Nome" value={order.customerName} />
          <Row
            label="E-mail"
            value={
              <a href={`mailto:${order.customerEmail}`} className="underline">
                {order.customerEmail}
              </a>
            }
          />
          {order.artistName && <Row label="Nome artístico" value={order.artistName} />}
          {order.instagram && (
            <Row
              label="Instagram"
              value={
                <a
                  href={`https://instagram.com/${order.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  @{order.instagram}
                </a>
              }
            />
          )}
        </dl>
      </section>

      {order.note && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Recado do cliente</h2>
          <p className="border border-border p-4 text-sm whitespace-pre-wrap">{order.note}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Beats</h2>
        {/* Titles and prices as they were when the order was placed, not as the
            catalog reads today. */}
        <ul className="divide-y divide-border border-y border-border text-sm">
          {order.items.map((item) => (
            <li key={item.beatId} className="flex items-baseline justify-between gap-4 py-3">
              <span>{item.title}</span>
              <span className="text-muted">{formatPrice(item.priceCents)}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-baseline justify-between gap-4 pt-2 text-sm font-medium">
          <span>Total</span>
          <span>{formatPrice(order.totalCents)}</span>
        </p>
      </section>

      <OrderActions
        id={order.id}
        status={order.status}
        approve={approveOrder}
        cancel={cancelOrder}
        markPaid={markOrderPaid}
        sign={signDelivery}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
