import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OrderStatus } from "@/lib/supabase/types";

export type OrderRow = {
  id: number;
  code: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
};

export type OrderDetail = OrderRow & {
  artistName: string | null;
  instagram: string | null;
  note: string | null;
  items: Array<{ beatId: number; title: string; priceCents: number }>;
};

type RawListRow = {
  id: number;
  code: string;
  customer_name: string;
  customer_email: string;
  total_cents: number;
  status: OrderStatus;
  created_at: string;
  order_items: Array<{ beat_id: number }> | null;
};

// Every read here runs as the signed-in admin, so RLS is what actually decides
// whether any of it returns a row.
export async function listOrders(
  supabase: SupabaseClient<Database>,
  status?: OrderStatus,
): Promise<OrderRow[]> {
  let query = supabase
    .from("orders")
    .select("id, code, customer_name, customer_email, total_cents, status, created_at, order_items(beat_id)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as RawListRow[]).map((row) => ({
    id: row.id,
    code: row.code,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
    itemCount: row.order_items?.length ?? 0,
  }));
}

export async function countPendingOrders(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw error;
  return count ?? 0;
}

// The detail query asks for more of each item than the list does, so
// order_items is replaced rather than intersected — an intersection would keep
// the narrower shape from the list type.
type RawDetail = Omit<RawListRow, "order_items"> & {
  artist_name: string | null;
  instagram: string | null;
  note: string | null;
  order_items: Array<{ beat_id: number; title: string; price_cents: number }> | null;
};

export async function getOrder(
  supabase: SupabaseClient<Database>,
  id: number,
): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, code, customer_name, customer_email, artist_name, instagram, note, total_cents, status, created_at, order_items(beat_id, title, price_cents)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as RawDetail;
  const items = (row.order_items ?? []).map((item) => ({
    beatId: item.beat_id,
    title: item.title,
    priceCents: item.price_cents,
  }));

  return {
    id: row.id,
    code: row.code,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    artistName: row.artist_name,
    instagram: row.instagram,
    note: row.note,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
    itemCount: items.length,
    items,
  };
}
