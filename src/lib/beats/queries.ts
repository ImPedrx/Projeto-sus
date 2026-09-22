import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { publicAssetUrl } from "@/lib/beats/storage";

export type BeatStatus = "draft" | "published" | "sold" | "archived";
export type BeatKind = "beat" | "service";

export type AdminBeatRow = {
  id: number;
  title: string;
  kind: BeatKind;
  priceCents: number | null;
  status: BeatStatus;
  // How many order lines point at this beat. Non-zero means it cannot be
  // deleted -- the foreign key is ON DELETE RESTRICT -- so the admin offers
  // archiving instead of a delete that would only fail.
  orderCount: number;
};

type RawRow = {
  id: number;
  title: string;
  kind: string;
  price_cents: number | null;
  status: string;
  order_items: Array<{ count: number }> | null;
};

export async function listBeatsForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<AdminBeatRow[]> {
  const { data, error } = await supabase
    .from("beats")
    .select("id, title, kind, price_cents, status, order_items(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind as BeatKind,
    priceCents: row.price_cents,
    status: row.status as BeatStatus,
    // An embedded count arrives as a one-row array, and as no rows at all when
    // nothing points at the beat.
    orderCount: row.order_items?.[0]?.count ?? 0,
  }));
}

export type StoreBeat = {
  id: number;
  title: string;
  slug: string;
  kind: BeatKind;
  // Null on any of the three means "fall back to the site default", except for
  // the exclusive licence, where it means the buyer has to ask. Read them
  // through licensePriceCents() rather than directly.
  priceCents: number | null;
  priceWavCents: number | null;
  priceExclusiveCents: number | null;
  createdAt: string;
  bpm: number | null;
  musicalKey: string | null;
  durationSeconds: number | null;
  description: string | null;
  // Only whether a WAV exists, never its path: the master lives in the private
  // bucket and nothing public should carry a pointer to it.
  hasWav: boolean;
  coverUrl: string | null;
  previewUrl: string | null;
};

type RawStoreRow = {
  id: number;
  title: string;
  slug: string;
  kind: string;
  price_cents: number | null;
  price_wav_cents: number | null;
  price_exclusive_cents: number | null;
  created_at: string;
  bpm: number | null;
  musical_key: string | null;
  duration_seconds: number | null;
  description: string | null;
  master_wav_path: string | null;
  cover_path: string | null;
  preview_path: string | null;
};

export function toStoreBeat(row: RawStoreRow, projectUrl: string): StoreBeat {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    kind: row.kind as BeatKind,
    priceCents: row.price_cents,
    priceWavCents: row.price_wav_cents,
    priceExclusiveCents: row.price_exclusive_cents,
    createdAt: row.created_at,
    bpm: row.bpm,
    musicalKey: row.musical_key,
    durationSeconds: row.duration_seconds,
    description: row.description,
    hasWav: Boolean(row.master_wav_path),
    coverUrl: publicAssetUrl(projectUrl, row.cover_path),
    previewUrl: publicAssetUrl(projectUrl, row.preview_path),
  };
}

const STORE_COLUMNS =
  "id, title, slug, kind, price_cents, price_wav_cents, price_exclusive_cents, created_at, bpm, musical_key, duration_seconds, description, master_wav_path, cover_path, preview_path";

// RLS already restricts anonymous reads to published beats; the status filter
// keeps the intent legible at the call site and lets the partial index serve it.
export async function listPublishedBeats(
  supabase: SupabaseClient<Database>,
  options: { limit?: number; kind?: BeatKind } = {},
): Promise<StoreBeat[]> {
  let query = supabase
    .from("beats")
    .select(STORE_COLUMNS)
    .eq("status", "published")
    .eq("kind", options.kind ?? "beat")
    .order("created_at", { ascending: false });

  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return ((data ?? []) as unknown as RawStoreRow[]).map((row) =>
    toStoreBeat(row, projectUrl),
  );
}
