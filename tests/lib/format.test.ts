import { describe, expect, it } from "vitest";
import { formatPrice, formatDuration } from "@/lib/beats/format";

describe("formatPrice", () => {
  it("renders cents as Brazilian currency", () => {
    expect(formatPrice(19900)).toBe("R$ 199,00");
  });

  it("renders a whole-real value with cents", () => {
    expect(formatPrice(5000)).toBe("R$ 50,00");
  });

  it("renders zero", () => {
    expect(formatPrice(0)).toBe("R$ 0,00");
  });
});

describe("formatDuration", () => {
  it("pads seconds under ten", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("renders durations under a minute", () => {
    expect(formatDuration(42)).toBe("0:42");
  });

  it("floors fractional seconds", () => {
    expect(formatDuration(59.9)).toBe("0:59");
  });
});
