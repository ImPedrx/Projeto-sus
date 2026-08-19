import { formatPrice } from "@/lib/beats/format";

export type OrderMessageInput = {
  code: string;
  customerName: string;
  customerEmail: string;
  artistName?: string;
  instagram?: string;
  note?: string;
  items: Array<{ title: string; priceCents: number }>;
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

  lines.push("", "Beats:");
  for (const item of order.items) {
    lines.push(`  · ${item.title} — ${formatPrice(item.priceCents)}`);
  }

  lines.push("", `Total: ${formatPrice(order.totalCents)}`);

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
