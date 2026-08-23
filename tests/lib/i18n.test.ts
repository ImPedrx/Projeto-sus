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
  it("reads Portuguese off the path prefix", () => {
    expect(localeFromPathname("/pt")).toBe("pt");
    expect(localeFromPathname("/pt/projetos")).toBe("pt");
  });

  it("falls back to English", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/projects")).toBe("en");
    // A path that merely starts with the locale letters is not the locale.
    expect(localeFromPathname("/ptbr")).toBe("en");
  });
});

describe("pathFor", () => {
  it("keeps English at the root", () => {
    expect(pathFor("en", "home")).toBe("/");
    expect(pathFor("en", "catalog")).toBe("/projects");
  });

  it("prefixes Portuguese and keeps its slug", () => {
    expect(pathFor("pt", "home")).toBe("/pt");
    expect(pathFor("pt", "catalog")).toBe("/pt/projetos");
  });
});
