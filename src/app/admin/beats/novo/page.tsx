import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { createBeat } from "../actions";
import { BeatForm } from "../beat-form";

export default async function NewBeatPage() {
  const supabase = await createServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (!categories?.length) {
    return (
      <p className="text-muted">
        Cadastre uma{" "}
        <Link href="/admin/categorias" className="underline">
          categoria
        </Link>{" "}
        antes de subir um beat.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Novo beat</h1>
      <BeatForm categories={categories} action={createBeat} />
    </div>
  );
}
