import { signIn } from "@/app/auth/actions";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  // Present only when Turnstile is configured; without it the form renders and
  // works exactly as before, and the server skips verification to match.
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">SUSPROD / ADMIN</h1>
        <LoginForm action={signIn} turnstileSiteKey={turnstileSiteKey} />
      </div>
    </main>
  );
}
