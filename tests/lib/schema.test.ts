import { describe, expect, it } from "vitest";
import { categoryInputSchema } from "@/lib/beats/schema";

describe("categoryInputSchema", () => {
  it("accepts a normal name", () => {
    expect(categoryInputSchema.parse({ name: "Dark Trap" }).name).toBe("Dark Trap");
  });

  it("trims surrounding whitespace", () => {
    expect(categoryInputSchema.parse({ name: "  Drill  " }).name).toBe("Drill");
  });

  it("rejects a blank name", () => {
    expect(categoryInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name over 40 characters", () => {
    expect(categoryInputSchema.safeParse({ name: "x".repeat(41) }).success).toBe(false);
  });
});
