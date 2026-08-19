import { describe, it, expect } from "vitest";
import { orderInputSchema } from "@/lib/orders/schema";

const valid = {
  customerName: "  João Paulo ",
  customerEmail: "  Joao@Example.COM ",
  beatIds: [1, 2],
};

describe("orderInputSchema", () => {
  it("trims the name and lowercases the email", () => {
    const parsed = orderInputSchema.parse(valid);
    expect(parsed.customerName).toBe("João Paulo");
    expect(parsed.customerEmail).toBe("joao@example.com");
  });

  it("treats blank optional fields as absent", () => {
    const parsed = orderInputSchema.parse({ ...valid, artistName: "  ", note: "" });
    expect(parsed.artistName).toBeUndefined();
    expect(parsed.note).toBeUndefined();
  });

  it("reduces an Instagram handle to the username", () => {
    for (const input of [
      "@susprod",
      "susprod",
      "https://www.instagram.com/susprod/",
      "instagram.com/susprod",
    ]) {
      expect(orderInputSchema.parse({ ...valid, instagram: input }).instagram).toBe("susprod");
    }
  });

  it("refuses an empty cart and an oversized one", () => {
    expect(orderInputSchema.safeParse({ ...valid, beatIds: [] }).success).toBe(false);
    expect(
      orderInputSchema.safeParse({ ...valid, beatIds: Array.from({ length: 21 }, (_, i) => i + 1) })
        .success,
    ).toBe(false);
  });

  it("refuses a malformed email, since it is the only way back to the buyer", () => {
    expect(orderInputSchema.safeParse({ ...valid, customerEmail: "joao@" }).success).toBe(false);
  });

  it("ignores a price smuggled into the payload", () => {
    const parsed = orderInputSchema.parse({ ...valid, totalCents: 1, priceCents: 1 });
    expect(parsed).not.toHaveProperty("totalCents");
    expect(parsed).not.toHaveProperty("priceCents");
  });
});
