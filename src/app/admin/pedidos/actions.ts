"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { error: string };

// An order moves forward or is cancelled, and never goes back. Writing the legal
// moves down means a stale tab cannot approve an order that was already
// cancelled by reposting the form.
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending: ["approved", "cancelled"],
  approved: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "aguardando",
  approved: "aprovado",
  paid: "pago",
  cancelled: "cancelado",
};

async function moveTo(id: number, next: OrderStatus): Promise<ActionResult> {
  const supabase = await createServerClient();

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (readError || !current) return { error: "Pedido não encontrado." };

  const from = current.status as OrderStatus;
  if (!ALLOWED[from].includes(next)) {
    return {
      error: `Um pedido ${STATUS_LABEL[from]} não pode ir para ${STATUS_LABEL[next]}.`,
    };
  }

  const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o pedido." };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  return { ok: true };
}

export async function approveOrder(id: number) {
  return moveTo(id, "approved");
}

export async function markOrderPaid(id: number) {
  return moveTo(id, "paid");
}

// Cancelling sets a status; nothing deletes the row. Money moves outside the
// platform, so this record is the only trail of what was agreed.
export async function cancelOrder(id: number) {
  return moveTo(id, "cancelled");
}

export type DeliveryLink = { title: string; url: string; expiresAt: string };
export type DeliveryResult = { links: DeliveryLink[] } | { error: string };

const DELIVERY_TTL_SECONDS = 7 * 24 * 60 * 60;

// The master lives in a private bucket and stays there: delivery is a link that
// expires, not a file made public. Refused before approval, so a link cannot
// exist for an order the producer has not agreed to.
export async function signDelivery(id: number): Promise<DeliveryResult> {
  const supabase = await createServerClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status, order_items(beat_id, title)")
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) return { error: "Pedido não encontrado." };

  const status = order.status as OrderStatus;
  if (status !== "approved" && status !== "paid") {
    return { error: "Aprove o pedido antes de gerar os links." };
  }

  const items = (order.order_items ?? []) as Array<{ beat_id: number; title: string }>;
  const { data: beats, error: beatsError } = await supabase
    .from("beats")
    .select("id, master_mp3_path, master_wav_path")
    .in("id", items.map((item) => item.beat_id));

  if (beatsError) return { error: "Não foi possível ler os arquivos." };

  const paths = new Map(beats?.map((beat) => [beat.id, beat]) ?? []);
  const links: DeliveryLink[] = [];
  const expiresAt = new Date(Date.now() + DELIVERY_TTL_SECONDS * 1000).toISOString();

  for (const item of items) {
    const beat = paths.get(item.beat_id);
    if (!beat) continue;

    for (const [label, path] of [
      ["MP3", beat.master_mp3_path],
      ["WAV", beat.master_wav_path],
    ] as const) {
      if (!path) continue;
      const { data, error } = await supabase.storage
        .from("beat-private")
        .createSignedUrl(path, DELIVERY_TTL_SECONDS);
      if (error || !data) continue;
      links.push({ title: `${item.title} · ${label}`, url: data.signedUrl, expiresAt });
    }
  }

  if (links.length === 0) return { error: "Nenhum arquivo disponível para este pedido." };

  return { links };
}
