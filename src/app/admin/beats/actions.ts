"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { beatInputSchema } from "@/lib/beats/schema";
import { slugify } from "@/lib/beats/slug";
import {
  bucketFor,
  storagePathFor,
  type AssetKind,
  type UploadTarget,
} from "@/lib/beats/storage";
import type { BeatStatus } from "@/lib/beats/queries";

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}

// An empty price field is a decision, not an omission: it means "use the site
// default" for MP3 and WAV, and "quote it by hand" for the exclusive licence.
function parseOptionalPriceCents(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  return text === "" ? null : Math.round(Number(text) * 100);
}

// A storage path written back into the form by the browser after it uploaded
// the file itself. Empty means the file was never sent.
function parseOptionalPath(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function beatInputFrom(formData: FormData) {
  return beatInputSchema.safeParse({
    kind: String(formData.get("kind") ?? "beat"),
    title: formData.get("title"),
    priceCents: parseOptionalPriceCents(formData.get("price")),
    priceWavCents: parseOptionalPriceCents(formData.get("priceWav")),
    priceExclusiveCents: parseOptionalPriceCents(formData.get("priceExclusive")),
    bpm: parseOptionalInt(formData.get("bpm")),
    musicalKey: String(formData.get("musicalKey") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    categoryIds: formData.getAll("categoryIds").map((value) => Number(value)),
  });
}

type TargetResult = { error: string } | { ok: true; targets: UploadTarget[] };

// Hands the browser one short-lived signed upload URL per file so the bytes go
// straight to storage. The paths are still decided here rather than by the
// caller: a client that named its own path could write anywhere in the bucket.
async function signUploads(
  supabase: Awaited<ReturnType<typeof assertAdmin>>,
  slug: string,
  assets: Array<{ kind: AssetKind; filename: string }>,
): Promise<TargetResult> {
  const targets: UploadTarget[] = [];

  for (const { kind, filename } of assets) {
    const bucket = bucketFor(kind);
    const path = storagePathFor(kind, slug, filename);
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data) return { error: `Falha ao preparar o envio (${kind}).` };
    targets.push({ kind, bucket, path, token: data.token });
  }

  return { ok: true as const, targets };
}

// Upload targets for a beat that does not exist yet, so the slug comes from the
// title the form is about to save under.
export async function createBeatUploadTargets(
  title: string,
  assets: Array<{ kind: AssetKind; filename: string }>,
): Promise<TargetResult> {
  const supabase = await assertAdmin();
  return signUploads(supabase, slugify(title), assets);
}

// Upload targets for a beat that already exists. Reuse its stored slug so the
// file name stays stable even when the title changed, and so a replacement
// overwrites the old art in place.
export async function editBeatUploadTargets(
  id: number,
  assets: Array<{ kind: AssetKind; filename: string }>,
): Promise<TargetResult> {
  const supabase = await assertAdmin();
  const { data: beat } = await supabase
    .from("beats")
    .select("slug")
    .eq("id", id)
    .single();

  if (!beat) return { error: "Beat não encontrado." };
  return signUploads(supabase, beat.slug, assets);
}

export async function createBeat(formData: FormData) {
  const parsed = beatInputFrom(formData);

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const isService = parsed.data.kind === "service";
  // The files were uploaded by the browser before this ran; only their storage
  // paths travel through here.
  const previewPath = parseOptionalPath(formData.get("previewPath"));
  const masterMp3Path = parseOptionalPath(formData.get("masterMp3Path"));
  const masterWavPath = parseOptionalPath(formData.get("masterWavPath"));
  const coverPath = parseOptionalPath(formData.get("coverPath"));

  // A service has nothing to preview and no master to deliver.
  if (!isService && !previewPath) return { error: "Envie o preview com a tag de voz." };
  if (!isService && !masterMp3Path) return { error: "Envie o MP3 sem tag." };

  const supabase = await assertAdmin();
  const slug = slugify(parsed.data.title);

  const { data: beat, error: insertError } = await supabase
    .from("beats")
    .insert({
      title: parsed.data.title,
      slug,
      kind: parsed.data.kind,
      price_cents: parsed.data.priceCents,
      price_wav_cents: parsed.data.priceWavCents,
      price_exclusive_cents: parsed.data.priceExclusiveCents,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
      description: parsed.data.description,
      preview_path: previewPath,
      master_mp3_path: masterMp3Path,
      master_wav_path: masterWavPath,
      cover_path: coverPath,
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
  const supabase = await assertAdmin();
  const { error } = await supabase.from("beats").update({ status }).eq("id", id);
  if (error) return { error: "Não foi possível alterar o status." };

  revalidatePath("/admin");
  return { ok: true as const };
}

// Taking a sold beat off the shelf. It cannot be deleted -- an order line
// points at it and the foreign key is ON DELETE RESTRICT -- so archiving is
// what "remove it from the store" means for it: the row stays for the order
// history, and every public read filters on status = 'published' already, so
// nothing else has to change to hide it.
export async function archiveBeat(id: number) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("beats")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return { error: "Não foi possível arquivar o beat." };

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateBeat(id: number, formData: FormData) {
  const parsed = beatInputFrom(formData);

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await assertAdmin();
  const { error: updateError } = await supabase
    .from("beats")
    .update({
      title: parsed.data.title,
      kind: parsed.data.kind,
      price_cents: parsed.data.priceCents,
      price_wav_cents: parsed.data.priceWavCents,
      price_exclusive_cents: parsed.data.priceExclusiveCents,
      bpm: parsed.data.bpm,
      musical_key: parsed.data.musicalKey,
      description: parsed.data.description,
    })
    .eq("id", id);

  if (updateError) return { error: "Não foi possível salvar as alterações." };

  // A new cover is optional on edit. When one was picked the browser already
  // uploaded it under the beat's stored slug, so only the path arrives here.
  const coverPath = parseOptionalPath(formData.get("coverPath"));
  if (coverPath) {
    await supabase.from("beats").update({ cover_path: coverPath }).eq("id", id);
  }

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
  const supabase = await assertAdmin();

  const { data: beat } = await supabase
    .from("beats")
    .select("preview_path, master_mp3_path, master_wav_path, cover_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("beats").delete().eq("id", id);
  if (error) {
    // 23503 is the foreign key violation raised by order_items: this beat was
    // sold, and the record of that sale keeps it alive. Saying so is the whole
    // difference between a dead end and an obvious next step.
    return {
      error:
        error.code === "23503"
          ? "Este beat já foi vendido, então não pode ser excluído. Arquive para tirá-lo da loja."
          : "Não foi possível excluir o beat.",
    };
  }

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
