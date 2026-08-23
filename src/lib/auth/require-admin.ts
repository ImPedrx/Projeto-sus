import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// Being signed in is not the same as being an admin, and RLS cannot tell the
// two apart on its own: it hides drafts from a signed-in non-admin without
// raising an error, so an empty result alone would let them through. Both
// guards below ask the database outright with the is_admin() RPC.

// Guard for Server Components. Redirects the non-admin to the login before any
// query runs, so an admin page never fetches data or streams its RSC payload
// for someone who is not authenticated — the layout guard stays as a backstop.
// Returns the authenticated client so the caller reuses it.
export async function requireAdmin() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/admin/login");

  return supabase;
}

// Guard for Server Actions. Throws instead of redirecting, so an action fails
// loud for a non-admin rather than trusting RLS to silently affect zero rows
// and then reporting success back to the caller.
export async function assertAdmin() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) throw new Error("Unauthorized");

  return supabase;
}
