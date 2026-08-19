const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(cents: number): string {
  // Intl separates symbol and number with a non-breaking space; normalize it
  // so the output compares equal to a plain-space string.
  return currency.format(cents / 100).replace(/\u00a0/g, " ");
}

export function formatDuration(seconds: number): string {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
