import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type BeatStatus = "draft" | "published" | "sold";

export type AdminBeatRow = {
  id: number;
  title: string;
  priceCents: number;
  status: BeatStatus;
  categoryNames: string[];
};

type RawRow = {
  id: number;
  title: string;
  price_cents: number;
  status: string;
  beat_categories: Array<{ categories: { name: string } | null }> | null;
};

export async function listBeatsForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<AdminBeatRow[]> {
  const { data, error } = await supabase
    .from("beats")
    .select("id, title, price_cents, status, beat_categories(categories(name))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    priceCents: row.price_cents,
    status: row.status as BeatStatus,
    categoryNames: (row.beat_categories ?? [])
      .map((link) => link.categories?.name)
      .filter((name): name is string => Boolean(name)),
  }));
}
