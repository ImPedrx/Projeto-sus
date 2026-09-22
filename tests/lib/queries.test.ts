import { describe, expect, it, vi } from "vitest";
import { listBeatsForAdmin } from "@/lib/beats/queries";

function stubClient(rows: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }),
  } as never;
}

describe("listBeatsForAdmin", () => {
  it("maps the row into the shape the admin renders", async () => {
    const rows = [
      {
        id: 1,
        title: "Dark Night",
        kind: "beat",
        price_cents: 19900,
        status: "published",
        order_items: [{ count: 3 }],
      },
    ];

    expect(await listBeatsForAdmin(stubClient(rows))).toEqual([
      {
        id: 1,
        title: "Dark Night",
        kind: "beat",
        priceCents: 19900,
        status: "published",
        orderCount: 3,
      },
    ]);
  });

  // An embedded count comes back as no rows at all when nothing points at the
  // beat, and that is the case that decides whether the admin offers a delete.
  it("reads a beat nobody ordered as zero orders", async () => {
    const rows = [
      {
        id: 4,
        title: "Sem pedido",
        kind: "beat",
        price_cents: 9900,
        status: "draft",
        order_items: [],
      },
    ];

    expect((await listBeatsForAdmin(stubClient(rows)))[0].orderCount).toBe(0);
  });

  it("returns an empty list when there are no beats", async () => {
    expect(await listBeatsForAdmin(stubClient([]))).toEqual([]);
  });
});
