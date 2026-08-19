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
  it("flattens nested category names", async () => {
    const rows = [
      {
        id: 1,
        title: "Dark Night",
        price_cents: 19900,
        status: "published",
        beat_categories: [
          { categories: { name: "Dark Trap" } },
          { categories: { name: "Drill" } },
        ],
      },
    ];

    expect(await listBeatsForAdmin(stubClient(rows))).toEqual([
      {
        id: 1,
        title: "Dark Night",
        priceCents: 19900,
        status: "published",
        categoryNames: ["Dark Trap", "Drill"],
      },
    ]);
  });

  it("returns an empty list when there are no beats", async () => {
    expect(await listBeatsForAdmin(stubClient([]))).toEqual([]);
  });

  it("tolerates a beat with no categories", async () => {
    const rows = [
      {
        id: 2,
        title: "Órfão",
        price_cents: 9900,
        status: "draft",
        beat_categories: [],
      },
    ];
    expect((await listBeatsForAdmin(stubClient(rows)))[0].categoryNames).toEqual([]);
  });
});
