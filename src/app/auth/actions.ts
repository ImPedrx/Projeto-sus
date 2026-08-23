"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

// Verifies the Turnstile token with Cloudflare. Returns true when there is no
// secret configured, so an install without Turnstile behaves exactly as before;
// once the secret is set, a missing or bad token is refused before any password
// is checked, keeping bots off the auth endpoint.
async function passesTurnstile(formData: FormData): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const token = String(formData.get("cf-turnstile-response") ?? "");
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
    if (ip) body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // A transport failure to Cloudflare must not lock the admin out entirely,
    // but it must not wave a bot through either. Refuse and let them retry.
    return false;
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!(await passesTurnstile(formData))) {
    return { error: "Confirme que você não é um robô e tente de novo." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
