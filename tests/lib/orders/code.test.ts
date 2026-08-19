import { describe, it, expect } from "vitest";
import { isOrderCode, normalizeOrderCode } from "@/lib/orders/code";

describe("isOrderCode", () => {
  it("accepts the shape place_order produces", () => {
    expect(isOrderCode("SUS-A1B2C3")).toBe(true);
    expect(isOrderCode("SUS-000000")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isOrderCode("SUS-a1b2c3")).toBe(false);
    expect(isOrderCode("SUS-A1B2C")).toBe(false);
    expect(isOrderCode("SUS-A1B2C34")).toBe(false);
    expect(isOrderCode("XXX-A1B2C3")).toBe(false);
    expect(isOrderCode("../../etc/passwd")).toBe(false);
    expect(isOrderCode("")).toBe(false);
  });
});

describe("normalizeOrderCode", () => {
  it("survives a copy-paste", () => {
    expect(normalizeOrderCode("  sus-a1b2c3 ")).toBe("SUS-A1B2C3");
  });
});
