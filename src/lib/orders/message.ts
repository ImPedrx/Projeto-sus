import { formatPrice } from "@/lib/beats/format";
import type { LineLicense } from "@/lib/beats/licenses";

export type OrderMessageInput = {
  code: string;
  customerName: string;
  customerEmail: string;
  artistName?: string;
  instagram?: string;
  note?: string;
  items: Array<{ title: string; license: LineLicense; priceCents: number | null }>;
  totalCents: number;
  panelUrl?: string;
};

// Plain text, built from data rather than markup, so the same message can go
// out by email, be pasted into a chat, or be asserted against in a test.
export function buildOrderMessage(order: OrderMessageInput): string {
  const lines: string[] = [
    `Novo pedido ${order.code}`,
    "",
    `Cliente: ${order.customerName}`,
    `E-mail: ${order.customerEmail}`,
  ];

  if (order.artistName) lines.push(`Nome artístico: ${order.artistName}`);
  if (order.instagram) lines.push(`Instagram: @${order.instagram}`);

  lines.push("", "Itens:");
  for (const item of order.items) {
    // An unpriced line is an exclusive licence with no published value: the
    // producer quotes it when he replies, so it says so instead of a number.
    const price =
      item.priceCents === null ? "sob consulta" : formatPrice(item.priceCents);
    const label = item.license === "service" ? "serviço" : item.license.toUpperCase();
    lines.push(`  · ${item.title} [${label}] — ${price}`);
  }

  lines.push("", `Total: ${formatPrice(order.totalCents)}`);

  if (order.items.some((item) => item.priceCents === null)) {
    lines.push("(itens sob consulta não entram no total)");
  }

  if (order.note) {
    lines.push("", "Recado do cliente:", order.note);
  }

  if (order.panelUrl) {
    lines.push("", `Abrir no painel: ${order.panelUrl}`);
  }

  lines.push(
    "",
    "O pagamento é combinado direto com o cliente. Aprove ou cancele o pedido no painel.",
  );

  return lines.join("\n");
}

export function buildOrderSubject(order: { code: string; customerName: string }): string {
  return `Pedido ${order.code} — ${order.customerName}`;
}
