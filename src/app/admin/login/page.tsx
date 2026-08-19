import { signIn } from "@/app/auth/actions";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">SUSPROD / ADMIN</h1>
        <LoginForm action={signIn} />
      </div>
    </main>
  );
}
