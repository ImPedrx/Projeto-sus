import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname.startsWith("/admin/login")) return children;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Being signed in is not the same as being an admin. RLS hides every draft
  // from a non-admin, so probing for drafts is the cheapest admin check that
  // matches what the policies actually allow.
  const { error } = await supabase
    .from("beats")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");
  if (error) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin">Beats</Link>
          <Link href="/admin/categorias">Categorias</Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted">
            Sair
          </button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
