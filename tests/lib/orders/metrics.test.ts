import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getDashboardMetrics } from "@/lib/orders/metrics";

// A minimal stand-in for the two reads getDashboardMetrics makes: the orders
// read is `from("orders").select(...)`, and the best-sellers read chains an
// `.eq(...)` after select. Both resolve to a { data, error } envelope.
function fakeClient(
  orders: Array<{ total_cents: number; status: string; created_at: string }>,
  items: Array<{ beat_id: number; title: string; price_cents: number }>,
): SupabaseClient<Database> {
  return {
    from(table: string) {
      if (table === "orders") {
        return { select: () => Promise.resolve({ data: orders, error: null }) };
      }
      return {
        select: () => ({ eq: () => Promise.resolve({ data: items, error: null }) }),
      };
    },
  } as unknown as SupabaseClient<Database>;
}

const thisMonth = new Date().toISOString();

describe("getDashboardMetrics", () => {
  it("sums only paid orders into revenue and counts every status", async () => {
    const client = fakeClient(
      [
        { total_cents: 10000, status: "paid", created_at: thisMonth },
        { total_cents: 5000, status: "paid", created_at: "2020-01-15T00:00:00Z" },
        { total_cents: 8000, status: "pending", created_at: thisMonth },
        { total_cents: 3000, status: "approved", created_at: thisMonth },
        { total_cents: 9999, status: "cancelled", created_at: thisMonth },
      ],
      [],
    );

    const m = await getDashboardMetrics(client);

    expect(m.paidTotalCents).toBe(15000);
    expect(m.paidThisMonthCents).toBe(10000);
    expect(m.paidCount).toBe(2);
    expect(m.avgTicketCents).toBe(7500);
    // Cancelled never counts as open money; only pending + approved do.
    expect(m.openValueCents).toBe(11000);
    expect(m.statusCounts).toEqual({ pending: 1, approved: 1, paid: 2, cancelled: 1 });
  });

  it("ranks best sellers by count then revenue", async () => {
    const client = fakeClient(
      [],
      [
        { beat_id: 1, title: "A", price_cents: 5000 },
        { beat_id: 1, title: "A", price_cents: 5000 },
        { beat_id: 2, title: "B", price_cents: 9000 },
      ],
    );

    const m = await getDashboardMetrics(client);

    expect(m.topBeats[0]).toMatchObject({ beatId: 1, count: 2, revenueCents: 10000 });
    expect(m.topBeats[1]).toMatchObject({ beatId: 2, count: 1, revenueCents: 9000 });
  });

  it("returns zeroed metrics with no orders", async () => {
    const m = await getDashboardMetrics(fakeClient([], []));
    expect(m.paidTotalCents).toBe(0);
    expect(m.avgTicketCents).toBe(0);
    expect(m.topBeats).toEqual([]);
    expect(m.monthly).toHaveLength(6);
  });
});
