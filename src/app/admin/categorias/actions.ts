"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { categoryInputSchema } from "@/lib/beats/schema";
import { slugify } from "@/lib/beats/slug";

export async function createCategory(formData: FormData) {
  const parsed = categoryInputSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
  });

  if (error) {
    // 23505 is unique_violation: the slug already exists.
    return {
      error:
        error.code === "23505"
          ? "Essa categoria já existe."
          : "Não foi possível salvar.",
    };
  }

  revalidatePath("/admin/categorias");
  return { ok: true as const };
}

export async function deleteCategory(id: number) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    // 23503 is foreign_key_violation: beats still reference this category.
    return {
      error:
        error.code === "23503"
          ? "Existem beats nessa categoria. Remova-os antes."
          : "Não foi possível excluir.",
    };
  }

  revalidatePath("/admin/categorias");
  return { ok: true as const };
}
