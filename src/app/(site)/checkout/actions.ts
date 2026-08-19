"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { orderInputSchema } from "@/lib/orders/schema";
import { buildOrderMessage, buildOrderSubject } from "@/lib/orders/message";
import { sendEmail } from "@/lib/email/send";

export type PlaceOrderResult = { code: string } | { error: string };

// place_order() raises with these codes so the reason survives the trip through
// PostgREST, where the message alone would arrive as an opaque string.
const REASONS: Record<string, string> = {
  P0001: "Seu carrinho está vazio ou tem beats demais.",
  P0002: "Um dos beats saiu do catálogo. Recarregue a página e tente de novo.",
  P0003: "Muitos pedidos seguidos com esse e-mail. Espere um pouco e tente de novo.",
};

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();
  const { data: code, error } = await supabase.rpc("place_order", {
    payload: parsed.data,
  });

  if (error || !code) {
    return { error: REASONS[error?.code ?? ""] ?? "Não foi possível registrar o pedido." };
  }

  await notifyProducer(code, parsed.data);

  return { code };
}

// Runs after the order is committed. A transport that is missing or broken must
// not cost the producer a sale, so nothing here is allowed to throw.
async function notifyProducer(
  code: string,
  input: {
    customerName: string;
    customerEmail: string;
    artistName?: string;
    instagram?: string;
    note?: string;
    beatIds: number[];
  },
) {
  const recipient = process.env.ORDER_NOTIFICATION_TO;
  if (!recipient) {
    console.info("[order] no ORDER_NOTIFICATION_TO set; order lives in the panel only", code);
    return;
  }

  try {
    const supabase = await createServerClient();
    // Read the titles and prices back from the catalog rather than trusting the
    // cart, for the same reason the total is computed in the database.
    const { data: beats } = await supabase
      .from("beats")
      .select("title, price_cents")
      .in("id", input.beatIds);

    const items = (beats ?? []).map((beat) => ({
      title: beat.title,
      priceCents: beat.price_cents,
    }));
    const totalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

    const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

    await sendEmail({
      to: recipient,
      subject: buildOrderSubject({ code, customerName: input.customerName }),
      text: buildOrderMessage({
        code,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        artistName: input.artistName,
        instagram: input.instagram,
        note: input.note,
        items,
        totalCents,
        panelUrl: origin ? `${origin}/admin/pedidos` : undefined,
      }),
    });
  } catch (error) {
    console.error("[order] notification failed for", code, error);
  }
}
