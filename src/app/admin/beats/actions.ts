"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { beatInputSchema } from "@/lib/beats/schema";
import { slugify } from "@/lib/beats/slug";
import { bucketFor, storagePathFor, type AssetKind } from "@/lib/beats/storage";
import type { BeatStatus } from "@/lib/beats/queries";

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}

export async function createBeat(formData: FormData) {
  // The form collects reais with a comma decimal separator; the database
  // stores integer cents.
  const priceText = String(formData.get("price") ?? "").replace(",", ".");

  const parsed = beatInputSchema.safeParse({
    title: formData.get("title"),
    priceCents: Math.round(Number(priceText) * 100),
    bpm: parseOptionalInt(formData.get("bpm")),
    musicalKey: String(formData.get("musicalKey") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    categoryIds: formData.getAll("categoryIds").map((value) => Number(value)),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const preview = formData.get("preview") as File | null;
  const masterMp3 = formData.get("masterMp3") as File | null;
  const masterWav = formData.get("masterWav") as File | null;
  const cover = formData.get("cover") as File | null;

  if (!preview?.size) return { error: "Envie o preview com a tag de voz." };
  if (!masterMp3?.size) return { error: "Envie o MP3 sem tag." };

  const supabase = await createServerClient();
  const slug = slugify(parsed.data.title);

  const uploads: Array<[AssetKind, File]> = [
    ["preview", preview],
    ["mp3", masterMp3],
  ];
  if (masterWav?.size) uploads.push(["wav", masterWav]);
  if (cover?.size) uploads.push(["cover", cover]);

  const paths: Partial<Record<AssetKind, string>> = {};

  for (const [kind, file] of uploads) {
    const path = storagePathFor(kind, slug, file.name);
    const { error } = await supabase.storage
      .from(bucketFor(kind))
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) return { error: `Falha ao enviar o arquivo (${kind}).` };
    paths[kind] = path;
  }

  const { data: beat, error: insertError } = await supabase
    .from("beats")
    .insert({
      title: parsed.data.title,
      slug,
      price_cents: parsed.data.priceCents,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
      description: parsed.data.description,
      preview_path: paths.preview!,
      master_mp3_path: paths.mp3!,
      master_wav_path: paths.wav ?? null,
      cover_path: paths.cover ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !beat) {
    return {
      error:
        insertError?.code === "23505"
          ? "Já existe um beat com esse título."
          : "Não foi possível salvar o beat.",
    };
  }

  const { error: linkError } = await supabase.from("beat_categories").insert(
    parsed.data.categoryIds.map((categoryId) => ({
      beat_id: beat.id,
      category_id: categoryId,
    })),
  );

  if (linkError) {
    // A beat with no category would be invisible in the catalog, so undo the
    // insert rather than leaving a half-created row.
    await supabase.from("beats").delete().eq("id", beat.id);
    return { error: "Não foi possível vincular as categorias." };
  }

  revalidatePath("/admin");
  return { ok: true as const, id: beat.id };
}

export async function setBeatStatus(id: number, status: BeatStatus) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("beats").update({ status }).eq("id", id);
  if (error) return { error: "Não foi possível alterar o status." };

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateBeat(id: number, formData: FormData) {
  const priceText = String(formData.get("price") ?? "").replace(",", ".");

  const parsed = beatInputSchema.safeParse({
    title: formData.get("title"),
    priceCents: Math.round(Number(priceText) * 100),
    bpm: parseOptionalInt(formData.get("bpm")),
    musicalKey: String(formData.get("musicalKey") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    categoryIds: formData.getAll("categoryIds").map((value) => Number(value)),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerClient();
  const { error: updateError } = await supabase
    .from("beats")
    .update({
      title: parsed.data.title,
      price_cents: parsed.data.priceCents,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
      description: parsed.data.description,
    })
    .eq("id", id);

  if (updateError) return { error: "Não foi possível salvar as alterações." };

  // Replace the category links wholesale — the set is tiny, and diffing buys
  // nothing here.
  await supabase.from("beat_categories").delete().eq("beat_id", id);
  const { error: linkError } = await supabase
    .from("beat_categories")
    .insert(
      parsed.data.categoryIds.map((categoryId) => ({
        beat_id: id,
        category_id: categoryId,
      })),
    );

  if (linkError) return { error: "Não foi possível salvar as categorias." };

  revalidatePath("/admin");
  revalidatePath(`/admin/beats/${id}`);
  return { ok: true as const };
}

export async function deleteBeat(id: number) {
  const supabase = await createServerClient();

  const { data: beat } = await supabase
    .from("beats")
    .select("preview_path, master_mp3_path, master_wav_path, cover_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("beats").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o beat." };

  // Remove the files only after the row is gone, so a storage failure never
  // leaves a row pointing at a missing file.
  if (beat) {
    const publicPaths = [beat.preview_path, beat.cover_path].filter(
      Boolean,
    ) as string[];
    const privatePaths = [beat.master_mp3_path, beat.master_wav_path].filter(
      Boolean,
    ) as string[];
    if (publicPaths.length) {
      await supabase.storage.from("beat-public").remove(publicPaths);
    }
    if (privatePaths.length) {
      await supabase.storage.from("beat-private").remove(privatePaths);
    }
  }

  revalidatePath("/admin");
  return { ok: true as const };
}
