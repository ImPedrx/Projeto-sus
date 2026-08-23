import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OrderStatus } from "@/lib/supabase/types";

// Payment happens off-platform and is recorded by hand, so "revenue" means the
// total of orders the producer has marked paid — nothing is earned until then.
// Every read here runs as the signed-in admin; RLS is what allows any of it.

export type TopBeat = { beatId: number; title: string; count: number; revenueCents: number };

export type MonthlyRevenue = { month: string; revenueCents: number };

export type DashboardMetrics = {
  paidTotalCents: number;
  paidThisMonthCents: number;
  paidCount: number;
  avgTicketCents: number;
  // The open pipeline: requests waiting on the producer, and value not yet paid.
  pendingCount: number;
  approvedCount: number;
  openValueCents: number;
  statusCounts: Record<OrderStatus, number>;
  topBeats: TopBeat[];
  monthly: MonthlyRevenue[];
};

const EMPTY_STATUS: Record<OrderStatus, number> = {
  pending: 0,
  approved: 0,
  paid: 0,
  cancelled: 0,
};

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

// The last `count` months as YYYY-MM, oldest first, so a month with no sales
// still shows as a zero rather than a gap.
function recentMonths(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function getDashboardMetrics(
  supabase: SupabaseClient<Database>,
): Promise<DashboardMetrics> {
  const [{ data: orders, error: ordersError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase.from("orders").select("total_cents, status, created_at"),
      // Only items from paid orders count toward the best-sellers ranking.
      supabase
        .from("order_items")
        .select("beat_id, title, price_cents, orders!inner(status)")
        .eq("orders.status", "paid"),
    ]);

  if (ordersError) throw ordersError;
  if (itemsError) throw itemsError;

  const rows = (orders ?? []) as Array<{
    total_cents: number;
    status: OrderStatus;
    created_at: string;
  }>;

  const statusCounts = { ...EMPTY_STATUS };
  const thisMonth = monthKey(new Date().toISOString());
  const monthTotals = new Map<string, number>();

  let paidTotalCents = 0;
  let paidThisMonthCents = 0;
  let paidCount = 0;
  let openValueCents = 0;

  for (const row of rows) {
    statusCounts[row.status] += 1;

    if (row.status === "paid") {
      paidTotalCents += row.total_cents;
      paidCount += 1;
      const key = monthKey(row.created_at);
      monthTotals.set(key, (monthTotals.get(key) ?? 0) + row.total_cents);
      if (key === thisMonth) paidThisMonthCents += row.total_cents;
    }

    // Pending and approved are money still on the table, not yet earned.
    if (row.status === "pending" || row.status === "approved") {
      openValueCents += row.total_cents;
    }
  }

  const monthly: MonthlyRevenue[] = recentMonths(6).map((month) => ({
    month,
    revenueCents: monthTotals.get(month) ?? 0,
  }));

  const byBeat = new Map<number, TopBeat>();
  const itemRows = (items ?? []) as Array<{
    beat_id: number;
    title: string;
    price_cents: number;
  }>;
  for (const item of itemRows) {
    const current = byBeat.get(item.beat_id) ?? {
      beatId: item.beat_id,
      title: item.title,
      count: 0,
      revenueCents: 0,
    };
    current.count += 1;
    current.revenueCents += item.price_cents;
    byBeat.set(item.beat_id, current);
  }

  const topBeats = [...byBeat.values()]
    .sort((a, b) => b.count - a.count || b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    paidTotalCents,
    paidThisMonthCents,
    paidCount,
    avgTicketCents: paidCount ? Math.round(paidTotalCents / paidCount) : 0,
    pendingCount: statusCounts.pending,
    approvedCount: statusCounts.approved,
    openValueCents,
    statusCounts,
    topBeats,
    monthly,
  };
}
