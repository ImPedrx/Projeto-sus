import { describe, expect, it } from "vitest";
import { dictionary, locales, localeFromPathname, pathFor } from "@/lib/i18n";

describe("dictionary", () => {
  it("covers every locale with the same keys", () => {
    const reference = Object.keys(dictionary.pt).sort();
    for (const locale of locales) {
      expect(Object.keys(dictionary[locale]).sort()).toEqual(reference);
    }
  });

  it("never leaves a string empty", () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(dictionary[locale])) {
        expect(typeof value === "function" || value, `${locale}.${key}`).toBeTruthy();
      }
    }
  });
});

describe("localeFromPathname", () => {
  it("reads English off the path prefix", () => {
    expect(localeFromPathname("/en")).toBe("en");
    expect(localeFromPathname("/en/projects")).toBe("en");
  });

  it("falls back to Portuguese", () => {
    expect(localeFromPathname("/")).toBe("pt");
    expect(localeFromPathname("/projetos")).toBe("pt");
    expect(localeFromPathname("/enquete")).toBe("pt");
  });
});

describe("pathFor", () => {
  it("keeps Portuguese at the root", () => {
    expect(pathFor("pt", "home")).toBe("/");
    expect(pathFor("pt", "catalog")).toBe("/projetos");
  });

  it("prefixes English and translates the slug", () => {
    expect(pathFor("en", "home")).toBe("/en");
    expect(pathFor("en", "catalog")).toBe("/en/projects");
  });
});
