import type { Locale } from "@/lib/i18n";

// Prices are quoted in US dollars in both locales: the producer sells abroad
// and a single currency keeps the storefront, the order email and the panel
// from disagreeing about what a beat costs.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatPrice(cents: number): string {
  // Intl separates symbol and number with a non-breaking space in some
  // locales; normalize it so the output compares equal to a plain-space string.
  return currency.format(cents / 100).replace(/ /g, " ");
}

export function formatDuration(seconds: number): string {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

const DATE_LOCALES: Record<Locale, string> = { pt: "pt-BR", en: "en-US" };

// Day precision only: the catalogue cares about when a beat went up, not the
// minute, and a fixed UTC zone keeps the server and the browser from rendering
// two different days for the same row.
export function formatPostedDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
