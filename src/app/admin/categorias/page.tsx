import { createServerClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "./actions";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";

export default async function CategoriesPage() {
  const supabase = await createServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("position")
    .order("name");

  const rows = categories ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
      <CategoryForm action={createCategory} />
      {rows.length === 0 ? (
        <p className="text-muted">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between py-3"
            >
              <span>{category.name}</span>
              <DeleteCategoryButton id={category.id} action={deleteCategory} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
