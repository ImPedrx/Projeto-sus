import { describe, expect, it } from "vitest";
import { beatInputSchema } from "@/lib/beats/schema";

const valid = {
  title: "Dark Night",
  priceCents: 6000,
  priceWavCents: 12000,
  priceExclusiveCents: null,
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

  it("reads an empty licence price as the site default rather than an error", () => {
    const result = beatInputSchema.safeParse({ ...valid, priceCents: null, priceWavCents: null });
    expect(result.success).toBe(true);
  });

  it("requires a price on a service, which has no default to fall back to", () => {
    expect(
      beatInputSchema.safeParse({ ...valid, kind: "service", priceCents: null }).success,
    ).toBe(false);
    expect(
      beatInputSchema.safeParse({ ...valid, kind: "service", priceCents: 15000 }).success,
    ).toBe(true);
  });

  it("rejects a fractional price", () => {
    expect(beatInputSchema.safeParse({ ...valid, priceCents: 59.5 }).success).toBe(false);
  });

  it("rejects an implausible bpm", () => {
    expect(beatInputSchema.safeParse({ ...valid, bpm: 12 }).success).toBe(false);
  });

  it("allows bpm and key to be omitted", () => {
    const result = beatInputSchema.safeParse({
      title: "Sem Info",
      priceCents: null,
      priceWavCents: null,
      priceExclusiveCents: null,
      bpm: null,
      musicalKey: null,
      categoryIds: [2],
    });
    expect(result.success).toBe(true);
  });
});

describe("beatInputSchema mensagens", () => {
  function firstError(input: Record<string, unknown>) {
    const result = beatInputSchema.safeParse(input);
    return result.success ? null : result.error.issues[0].message;
  }

  it("explains a bpm that is not a number", () => {
    expect(firstError({ ...valid, bpm: Number("seila") })).toBe(
      "Informe o BPM em números, entre 40 e 300.",
    );
  });

  it("explains a bpm outside the usable range", () => {
    expect(firstError({ ...valid, bpm: 12 })).toBe("O BPM mínimo é 40.");
    expect(firstError({ ...valid, bpm: 999 })).toBe("O BPM máximo é 300.");
  });

  it("explains a price that is not a number", () => {
    expect(firstError({ ...valid, priceCents: Number("dez dolares") })).toBe(
      "Informe o preço MP3 em números, por exemplo 60.00.",
    );
  });

  it("explains a musical key that is too long", () => {
    expect(firstError({ ...valid, musicalKey: "x".repeat(11) })).toBe(
      "Use no máximo 10 caracteres no tom.",
    );
  });
});
