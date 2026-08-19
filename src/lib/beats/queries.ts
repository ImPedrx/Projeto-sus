import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { publicAssetUrl } from "@/lib/beats/storage";

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

export type StoreCategory = { name: string; slug: string };

export type StoreBeat = {
  id: number;
  title: string;
  slug: string;
  priceCents: number;
  bpm: number | null;
  musicalKey: string | null;
  durationSeconds: number | null;
  description: string | null;
  // Only whether a WAV exists, never its path: the master lives in the private
  // bucket and nothing public should carry a pointer to it.
  hasWav: boolean;
  coverUrl: string | null;
  previewUrl: string | null;
  categories: StoreCategory[];
};

type RawStoreRow = {
  id: number;
  title: string;
  slug: string;
  price_cents: number;
  bpm: number | null;
  musical_key: string | null;
  duration_seconds: number | null;
  description: string | null;
  master_wav_path: string | null;
  cover_path: string | null;
  preview_path: string;
  beat_categories: Array<{ categories: StoreCategory | null }> | null;
};

export function toStoreBeat(row: RawStoreRow, projectUrl: string): StoreBeat {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    priceCents: row.price_cents,
    bpm: row.bpm,
    musicalKey: row.musical_key,
    durationSeconds: row.duration_seconds,
    description: row.description,
    hasWav: Boolean(row.master_wav_path),
    coverUrl: publicAssetUrl(projectUrl, row.cover_path),
    previewUrl: publicAssetUrl(projectUrl, row.preview_path),
    categories: (row.beat_categories ?? [])
      .map((link) => link.categories)
      .filter((category): category is StoreCategory => Boolean(category)),
  };
}

const STORE_COLUMNS =
  "id, title, slug, price_cents, bpm, musical_key, duration_seconds, description, master_wav_path, cover_path, preview_path, beat_categories(categories(name, slug))";

// RLS already restricts anonymous reads to published beats; the status filter
// keeps the intent legible at the call site and lets the partial index serve it.
export async function listPublishedBeats(
  supabase: SupabaseClient<Database>,
  options: { categorySlug?: string; limit?: number } = {},
): Promise<StoreBeat[]> {
  let query = supabase
    .from("beats")
    .select(STORE_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const beats = ((data ?? []) as unknown as RawStoreRow[]).map((row) =>
    toStoreBeat(row, projectUrl),
  );

  // Filtering here rather than in SQL keeps the join shape intact: a nested
  // filter would drop the beat's other categories from the response.
  return options.categorySlug
    ? beats.filter((beat) =>
        beat.categories.some((category) => category.slug === options.categorySlug),
      )
    : beats;
}

export async function listCategories(
  supabase: SupabaseClient<Database>,
): Promise<StoreCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name, slug")
    .order("position")
    .order("name");

  if (error) throw error;
  return data ?? [];
}
