import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/beats/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Dark Trap")).toBe("dark-trap");
  });

  it("strips accents", () => {
    expect(slugify("Sertanejo Remix Ação")).toBe("sertanejo-remix-acao");
  });

  it("drops punctuation and collapses separators", () => {
    expect(slugify("Boom  Bap / Lo-Fi!")).toBe("boom-bap-lo-fi");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --R&B--  ")).toBe("r-b");
  });
});
