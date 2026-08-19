import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { listOrders } from "@/lib/orders/queries";
import { formatPrice } from "@/lib/beats/format";
import type { OrderStatus } from "@/lib/supabase/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando",
  approved: "Aprovado",
  paid: "Pago",
  cancelled: "Cancelado",
};

const FILTERS: Array<{ value: OrderStatus | "todos"; label: string }> = [
  { value: "pending", label: "Aguardando" },
  { value: "approved", label: "Aprovados" },
  { value: "paid", label: "Pagos" },
  { value: "cancelled", label: "Cancelados" },
  { value: "todos", label: "Todos" },
];

function isStatus(value: string | undefined): value is OrderStatus {
  return value === "pending" || value === "approved" || value === "paid" || value === "cancelled";
}

function age(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.round(hours / 24)} d`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const requested = (await searchParams).status;
  // Pending leads by default: those are the ones waiting on the producer.
  const filter = isStatus(requested) ? requested : requested === "todos" ? undefined : "pending";

  const supabase = await createServerClient();
  const orders = await listOrders(supabase, filter);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>

      <nav className="flex flex-wrap gap-4 text-sm">
        {FILTERS.map((option) => {
          const active =
            option.value === "todos" ? filter === undefined : filter === option.value;
          return (
            <Link
              key={option.value}
              href={`/admin/pedidos?status=${option.value}`}
              className={active ? "underline" : "text-muted"}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="text-muted">Nenhum pedido nesse filtro.</p>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-56 flex-1">
                <Link href={`/admin/pedidos/${order.id}`} className="font-mono font-medium">
                  {order.code}
                </Link>
                <p className="text-sm text-muted">
                  {order.customerName} · {order.customerEmail}
                </p>
              </div>
              <span className="text-sm text-muted">
                {order.itemCount === 1 ? "1 beat" : `${order.itemCount} beats`}
              </span>
              <span className="text-sm">{formatPrice(order.totalCents)}</span>
              <span className="text-sm text-muted">{STATUS_LABEL[order.status]}</span>
              <span className="text-sm text-muted">{age(order.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
