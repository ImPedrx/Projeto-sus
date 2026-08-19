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

  // Being signed in is not the same as being an admin, and RLS cannot tell the
  // two apart on its own: it hides drafts from a signed-in non-admin without
  // raising an error, so an empty result would let them into the shell. Ask
  // the database outright instead.
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/admin/login");

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
