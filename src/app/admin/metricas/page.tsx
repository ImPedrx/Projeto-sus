import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardMetrics } from "@/lib/orders/metrics";
import { formatPrice } from "@/lib/beats/format";
import type { OrderStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando",
  approved: "Aprovados",
  paid: "Pagos",
  cancelled: "Cancelados",
};

const MONTH_LABEL = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function monthShort(key: string): string {
  const month = Number(key.slice(5, 7));
  return MONTH_LABEL[month - 1] ?? key;
}

export default async function AdminMetricsPage() {
  const supabase = await requireAdmin();
  const m = await getDashboardMetrics(supabase);

  const peak = Math.max(1, ...m.monthly.map((row) => row.revenueCents));

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Receita paga" value={formatPrice(m.paidTotalCents)} hint="pedidos marcados pagos" />
        <Stat label="Neste mês" value={formatPrice(m.paidThisMonthCents)} hint="pago no mês corrente" />
        <Stat label="Ticket médio" value={formatPrice(m.avgTicketCents)} hint={`${m.paidCount} ${m.paidCount === 1 ? "venda" : "vendas"}`} />
        <Stat label="Em aberto" value={formatPrice(m.openValueCents)} hint="aguardando + aprovados" />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted">Receita paga · últimos 6 meses</h2>
        <div className="flex items-end gap-3 border-y border-border py-6">
          {m.monthly.map((row) => (
            <div key={row.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[11px] tabular-nums text-muted">
                {row.revenueCents > 0 ? formatPrice(row.revenueCents) : "—"}
              </span>
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t bg-foreground"
                  style={{ height: `${Math.round((row.revenueCents / peak) * 100)}%` }}
                  aria-hidden
                />
              </div>
              <span className="text-xs text-muted">{monthShort(row.month)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted">Pedidos por status</h2>
          <ul className="divide-y divide-border border-y border-border">
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((status) => (
              <li key={status} className="flex items-center justify-between py-3 text-sm">
                <span>{STATUS_LABEL[status]}</span>
                <span className="tabular-nums font-medium">{m.statusCounts[status]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted">Mais vendidos</h2>
          {m.topBeats.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma venda paga ainda.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {m.topBeats.map((beat) => (
                <li key={beat.beatId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{beat.title}</span>
                  <span className="text-muted">
                    {beat.count === 1 ? "1 venda" : `${beat.count} vendas`}
                  </span>
                  <span className="tabular-nums font-medium">{formatPrice(beat.revenueCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="space-y-1 border border-border p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px] text-muted">{hint}</p>
    </div>
  );
}
