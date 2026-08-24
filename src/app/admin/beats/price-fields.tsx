"use client";

import { DEFAULT_LICENSE_PRICE_CENTS } from "@/lib/beats/licenses";

const field = "w-full rounded border border-border bg-surface px-3 py-2";

function toInput(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "" : (cents / 100).toFixed(2);
}

const DEFAULT_MP3 = toInput(DEFAULT_LICENSE_PRICE_CENTS.mp3);
const DEFAULT_WAV = toInput(DEFAULT_LICENSE_PRICE_CENTS.wav);

export type PriceDefaults = {
  priceCents?: number | null;
  priceWavCents?: number | null;
  priceExclusiveCents?: number | null;
};

// Three prices for a beat, one for a service. An empty licence field is not an
// error: MP3 and WAV fall back to the site default shown as the placeholder,
// and an empty EXCLUSIVE means the buyer has to ask for a quote.
export function PriceFields({
  kind,
  defaults = {},
}: {
  kind: "beat" | "service";
  defaults?: PriceDefaults;
}) {
  if (kind === "service") {
    return (
      <div className="space-y-2">
        <label htmlFor="price" className="block text-sm text-muted">
          Preço (US$)
        </label>
        <input
          id="price"
          name="price"
          inputMode="decimal"
          required
          defaultValue={toInput(defaults.priceCents)}
          className={field}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm text-muted">
            MP3 (US$)
          </label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder={DEFAULT_MP3}
            defaultValue={toInput(defaults.priceCents)}
            className={field}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="priceWav" className="block text-sm text-muted">
            WAV (US$)
          </label>
          <input
            id="priceWav"
            name="priceWav"
            inputMode="decimal"
            placeholder={DEFAULT_WAV}
            defaultValue={toInput(defaults.priceWavCents)}
            className={field}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="priceExclusive" className="block text-sm text-muted">
            EXCLUSIVE (US$)
          </label>
          <input
            id="priceExclusive"
            name="priceExclusive"
            inputMode="decimal"
            placeholder="sob consulta"
            defaultValue={toInput(defaults.priceExclusiveCents)}
            className={field}
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        Em branco, MP3 e WAV usam o padrão do site (US$ {DEFAULT_MP3} e US${" "}
        {DEFAULT_WAV}). EXCLUSIVE em branco aparece como &ldquo;sob consulta&rdquo;.
      </p>
    </div>
  );
}

export function KindField({
  value,
  onChange,
}: {
  value: "beat" | "service";
  onChange: (kind: "beat" | "service") => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm text-muted">Tipo</legend>
      <input type="hidden" name="kind" value={value} />
      <div className="flex gap-2">
        {(["beat", "service"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`rounded border px-4 py-2 text-sm transition-colors ${
              value === option
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-foreground"
            }`}
          >
            {option === "beat" ? "Beat" : "Serviço"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
