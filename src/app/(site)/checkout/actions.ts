"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { orderInputSchema } from "@/lib/orders/schema";
import { buildOrderMessage, buildOrderSubject } from "@/lib/orders/message";
import { sendEmail } from "@/lib/email/send";
import { licensePriceCents, type LineLicense } from "@/lib/beats/licenses";

export type PlaceOrderResult = { code: string } | { error: string };

// place_order() raises with these codes so the reason survives the trip through
// PostgREST, where the message alone would arrive as an opaque string.
const REASONS: Record<string, string> = {
  P0001: "Seu carrinho está vazio ou tem beats demais.",
  P0002: "Um dos beats saiu do catálogo. Recarregue a página e tente de novo.",
  P0003: "Muitos pedidos seguidos com esse e-mail. Espere um pouco e tente de novo.",
  P0004: "Muitos pedidos vindos daqui agora há pouco. Espere um pouco e tente de novo.",
};

// The first hop in x-forwarded-for is the client as Vercel's proxy saw it; the
// rest are proxies. It is a hint, not proof of identity — spoofable by design —
// which is exactly why it only feeds a rate limit and never an auth decision.
async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return h.get("x-real-ip");
}

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();
  const { data: code, error } = await supabase.rpc("place_order", {
    payload: parsed.data,
    client_ip: await clientIp(),
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
    items: Array<{ beatId: number; license: LineLicense }>;
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
      .select("id, title, price_cents, price_wav_cents, price_exclusive_cents")
      .in(
        "id",
        input.items.map((item) => item.beatId),
      );

    const byId = new Map((beats ?? []).map((beat) => [beat.id, beat]));

    const items = input.items.flatMap((line) => {
      const beat = byId.get(line.beatId);
      if (!beat) return [];
      return [
        {
          title: beat.title,
          license: line.license,
          priceCents: licensePriceCents(
            {
              priceCents: beat.price_cents,
              priceWavCents: beat.price_wav_cents,
              priceExclusiveCents: beat.price_exclusive_cents,
            },
            line.license,
          ),
        },
      ];
    });

    // Unpriced lines are quoted by hand, the same way place_order() leaves them
    // out of the stored total.
    const totalCents = items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);

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
