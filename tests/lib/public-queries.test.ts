import { describe, expect, it } from "vitest";
import { toStoreBeat } from "@/lib/beats/queries";

describe("toStoreBeat", () => {
  const row = {
    id: 1,
    title: "Dark Night",
    slug: "dark-night",
    price_cents: 19900,
    bpm: 140,
    musical_key: "F#m",
    duration_seconds: 125,
    description: "Trap escuro, 808 arrastado.",
    master_wav_path: "masters/dark-night.wav",
    cover_path: "covers/dark-night.png",
    preview_path: "previews/dark-night.mp3",
    beat_categories: [
      { categories: { name: "Dark Trap", slug: "dark-trap" } },
      { categories: null },
    ],
  };

  it("maps the row into the shape the storefront renders", () => {
    const beat = toStoreBeat(row, "https://proj.supabase.co");

    expect(beat).toEqual({
      id: 1,
      title: "Dark Night",
      slug: "dark-night",
      priceCents: 19900,
      bpm: 140,
      musicalKey: "F#m",
      durationSeconds: 125,
      description: "Trap escuro, 808 arrastado.",
      hasWav: true,
      coverUrl:
        "https://proj.supabase.co/storage/v1/object/public/beat-public/covers/dark-night.png",
      previewUrl:
        "https://proj.supabase.co/storage/v1/object/public/beat-public/previews/dark-night.mp3",
      categories: [{ name: "Dark Trap", slug: "dark-trap" }],
    });
  });

  it("leaves the cover null when the beat has none", () => {
    expect(toStoreBeat({ ...row, cover_path: null }, "https://proj.supabase.co").coverUrl).toBeNull();
  });
});
