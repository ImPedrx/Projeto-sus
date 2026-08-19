import { describe, expect, it } from "vitest";
import { beatInputSchema } from "@/lib/beats/schema";

const valid = {
  title: "Dark Night",
  priceCents: 19900,
  bpm: 140,
  musicalKey: "F#m",
  categoryIds: [1],
};

describe("beatInputSchema", () => {
  it("accepts a complete beat", () => {
    expect(beatInputSchema.parse(valid).title).toBe("Dark Night");
  });

  it("requires at least one category", () => {
    expect(beatInputSchema.safeParse({ ...valid, categoryIds: [] }).success).toBe(false);
  });

  it("rejects a zero or negative price", () => {
    expect(beatInputSchema.safeParse({ ...valid, priceCents: 0 }).success).toBe(false);
    expect(beatInputSchema.safeParse({ ...valid, priceCents: -1 }).success).toBe(false);
  });

  it("rejects a fractional price", () => {
    expect(beatInputSchema.safeParse({ ...valid, priceCents: 199.5 }).success).toBe(false);
  });

  it("rejects an implausible bpm", () => {
    expect(beatInputSchema.safeParse({ ...valid, bpm: 12 }).success).toBe(false);
  });

  it("allows bpm and key to be omitted", () => {
    const result = beatInputSchema.safeParse({
      title: "Sem Info",
      priceCents: 9900,
      bpm: null,
      musicalKey: null,
      categoryIds: [2],
    });
    expect(result.success).toBe(true);
  });
});
