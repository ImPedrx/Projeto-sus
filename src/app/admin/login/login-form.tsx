"use client";

import { useState } from "react";

type Result = { error: string } | undefined | void;

export function LoginForm({
  action,
}: {
  action: (formData: FormData) => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await action(new FormData(event.currentTarget));
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border border-border bg-surface px-3 py-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm text-muted">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded border border-border bg-surface px-3 py-2"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-foreground">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
      >
        Entrar
      </button>
    </form>
  );
}
