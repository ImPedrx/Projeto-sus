import { describe, expect, it } from "vitest";
import { formatPrice, formatDuration, formatPostedDate } from "@/lib/beats/format";

describe("formatPrice", () => {
  it("renders cents as US currency", () => {
    expect(formatPrice(6000)).toBe("$60.00");
  });

  it("renders a whole-dollar value with cents", () => {
    expect(formatPrice(12000)).toBe("$120.00");
  });

  it("renders zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
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

describe("formatPostedDate", () => {
  it("renders the day in each locale", () => {
    expect(formatPostedDate("2026-08-23T10:30:00Z", "en")).toBe("Aug 23, 2026");
    expect(formatPostedDate("2026-08-23T10:30:00Z", "pt")).toMatch(/23/);
  });

  it("reads the timestamp in UTC, so the server and the browser agree", () => {
    // 22:30 UTC is already the 24th in some zones and still the 23rd in others.
    expect(formatPostedDate("2026-08-23T22:30:00Z", "en")).toBe("Aug 23, 2026");
  });

  it("renders nothing for a timestamp it cannot read", () => {
    expect(formatPostedDate("not a date", "en")).toBe("");
  });
});
